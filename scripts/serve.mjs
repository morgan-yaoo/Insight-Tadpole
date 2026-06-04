import { createServer } from "node:http";
import { createReadStream, existsSync, readFileSync } from "node:fs";
import { cp, mkdir, readFile, rm, stat, unlink, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { basename, extname, join, normalize, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { homedir } from "node:os";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const execFileAsync = promisify(execFile);
const args = new Set(process.argv.slice(2));
const portArgIndex = process.argv.findIndex((arg) => arg === "--port");
const port = Number(process.env.PORT || (portArgIndex >= 0 ? process.argv[portArgIndex + 1] : 3214));
const shouldOpen = args.has("--open");
const homeDir = homedir();
const appDisplayName = "Insight Tadpole";
const appSupportDir = join(homeDir, "Library", "Application Support", appDisplayName);
const storageConfigFile = join(appSupportDir, "storage-config.json");
const defaultDataDir = join(homeDir, "Insight Tadpole Data");
const legacyDataDirs = [
  join(homeDir, "Library", "Application Support", "Insight Tadpole"),
  join(homeDir, "Library", "Application Support", "Insight tadpole"),
  join(homeDir, "Library", "Application Support", "Research Assist Notes")
];
let dataDir = resolveInitialDataDir();
const maxAttachmentBytes = 20 * 1024 * 1024;

const mimeTypes = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".md": "text/markdown",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".bmp": "image/bmp",
  ".tif": "image/tiff",
  ".tiff": "image/tiff"
};

function resolveInitialDataDir() {
  if (process.env.RESEARCH_ASSIST_DATA_DIR) {
    return resolve(process.env.RESEARCH_ASSIST_DATA_DIR);
  }

  try {
    if (existsSync(storageConfigFile)) {
      const parsed = JSON.parse(readFileSync(storageConfigFile, "utf8") || "{}");
      if (parsed && typeof parsed.dataDir === "string" && parsed.dataDir.trim()) {
        return resolve(expandHome(parsed.dataDir.trim()));
      }
    }
  } catch {
    // Fall back to the default data directory when the optional config is unreadable.
  }

  return defaultDataDir;
}

function notesFilePath(baseDir = dataDir) {
  return join(baseDir, "notes.json");
}

function settingsFilePath(baseDir = dataDir) {
  return join(baseDir, "settings.json");
}

function sortedDirPath(baseDir = dataDir) {
  return join(baseDir, "sorted-notes");
}

function exportsDirPath(baseDir = dataDir) {
  return join(baseDir, "exports");
}

function attachmentsDirPath(baseDir = dataDir) {
  return join(baseDir, "attachments");
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(body));
}

function sendText(response, status, body, contentType = "text/plain") {
  response.writeHead(status, {
    "Content-Type": contentType,
    "Cache-Control": "no-store"
  });
  response.end(body);
}

function displayPath(filePath) {
  if (filePath === homeDir) {
    return "$HOME";
  }

  if (filePath.startsWith(`${homeDir}/`)) {
    return `$HOME${filePath.slice(homeDir.length)}`;
  }

  return filePath;
}

function expandHome(filePath) {
  if (filePath === "$HOME") return homeDir;
  if (filePath.startsWith("$HOME/")) return join(homeDir, filePath.slice("$HOME/".length));
  if (filePath.startsWith("~/")) return join(homeDir, filePath.slice(2));
  return filePath;
}

function storagePaths() {
  return {
    dataDir: displayPath(dataDir),
    defaultDataDir: displayPath(defaultDataDir),
    canChooseDataDir: !process.env.RESEARCH_ASSIST_DATA_DIR,
    notesFile: displayPath(notesFilePath()),
    settingsFile: displayPath(settingsFilePath()),
    sortedDir: displayPath(sortedDirPath()),
    exportsDir: displayPath(exportsDirPath()),
    attachmentsDir: displayPath(attachmentsDirPath())
  };
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : null;
}

async function ensureStorage() {
  await migrateLegacyStorage();
  await mkdir(dataDir, { recursive: true });
  await mkdir(sortedDirPath(), { recursive: true });
  await mkdir(exportsDirPath(), { recursive: true });
  await mkdir(attachmentsDirPath(), { recursive: true });
}

async function migrateLegacyStorage() {
  if (process.env.RESEARCH_ASSIST_DATA_DIR || existsSync(dataDir)) {
    return;
  }

  const sourceDir = legacyDataDirs.find((legacyDir) => resolve(legacyDir) !== resolve(dataDir) && existsSync(legacyDir));
  if (sourceDir) {
    await cp(sourceDir, dataDir, { recursive: true });
  }
}

async function readNotes() {
  await ensureStorage();
  if (!existsSync(notesFilePath())) {
    return [];
  }

  const raw = await readFile(notesFilePath(), "utf8");
  const parsed = JSON.parse(raw || "[]");
  return Array.isArray(parsed) ? parsed : [];
}

async function writeNotes(notes) {
  await ensureStorage();
  await writeFile(notesFilePath(), `${JSON.stringify(notes, null, 2)}\n`, "utf8");
  await writeSortedNotes(notes);
}

async function readSettings() {
  await ensureStorage();
  if (!existsSync(settingsFilePath())) {
    return {};
  }

  const raw = await readFile(settingsFilePath(), "utf8");
  const parsed = JSON.parse(raw || "{}");
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
}

async function writeSettings(settings) {
  await ensureStorage();
  await writeFile(settingsFilePath(), `${JSON.stringify(settings, null, 2)}\n`, "utf8");
}

async function writeSortedNotes(notes) {
  const sortedDir = sortedDirPath();
  await rm(sortedDir, { recursive: true, force: true });
  await mkdir(sortedDir, { recursive: true });

  const categoryLines = ["# Category Index", ""];
  const subcategoryMap = new Map();
  const tagMap = new Map();

  for (const note of notes) {
    const category = note.categoryName || titleCase(note.category || "Inbox");
    const subcategory = note.subcategoryName || titleCase(note.subcategory || "");
    const categoryFolder = subcategory
      ? join(sortedDir, "by-category", safeName(category), safeName(subcategory))
      : join(sortedDir, "by-category", safeName(category));
    const filename = `${safeName(note.title || "Untitled Note")}-${String(note.id || Date.now()).slice(0, 8)}.md`;
    const markdown = noteToMarkdown(note);

    await mkdir(categoryFolder, { recursive: true });
    await writeFile(join(categoryFolder, filename), markdown, "utf8");
    categoryLines.push(`- ${category}${subcategory ? ` / ${subcategory}` : ""}: ${note.title || "Untitled Note"}`);

    if (subcategory) {
      const subcategoryKey = `${category} / ${subcategory}`;
      if (!subcategoryMap.has(subcategoryKey)) subcategoryMap.set(subcategoryKey, []);
      subcategoryMap.get(subcategoryKey).push(note);
      const subcategoryFolder = join(sortedDir, "by-subcategory", safeName(category), safeName(subcategory));
      await mkdir(subcategoryFolder, { recursive: true });
      await writeFile(join(subcategoryFolder, filename), markdown, "utf8");
    }

    for (const tag of note.tags || []) {
      if (!tagMap.has(tag)) tagMap.set(tag, []);
      tagMap.get(tag).push(note);
      const tagFolder = join(sortedDir, "by-tag", safeName(tag));
      await mkdir(tagFolder, { recursive: true });
      await writeFile(join(tagFolder, filename), markdown, "utf8");
    }
  }

  await writeFile(join(sortedDir, "_category-index.md"), `${categoryLines.join("\n")}\n`, "utf8");

  const subcategoryLines = ["# Subcategory Index", ""];
  for (const [subcategory, nestedNotes] of [...subcategoryMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    subcategoryLines.push(`## ${subcategory}`, "");
    for (const note of nestedNotes) {
      subcategoryLines.push(`- ${note.title || "Untitled Note"}`);
    }
    subcategoryLines.push("");
  }
  await writeFile(join(sortedDir, "_subcategory-index.md"), subcategoryLines.join("\n"), "utf8");

  const tagLines = ["# Tag Index", ""];
  for (const [tag, taggedNotes] of [...tagMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    tagLines.push(`## ${tag}`, "");
    for (const note of taggedNotes) {
      tagLines.push(`- ${note.title || "Untitled Note"}`);
    }
    tagLines.push("");
  }
  await writeFile(join(sortedDir, "_tag-index.md"), tagLines.join("\n"), "utf8");
}

function noteToMarkdown(note) {
  const lines = [
    `# ${note.title || "Untitled Note"}`,
    "",
    "- Type: Note",
    `- Category: ${note.categoryName || titleCase(note.category || "Inbox")}`,
    `- Subcategory: ${note.subcategoryName || titleCase(note.subcategory || "") || "None"}`,
    `- Source: ${note.source || "None"}`,
    `- Tags: ${(note.tags || []).join(", ") || "None"}`,
    `- Review Count: ${note.reviewCount || 0}`,
    `- Last Reviewed: ${note.lastReviewedAt ? new Date(note.lastReviewedAt).toISOString() : "Never"}`,
    `- Next Review: ${note.nextReviewAt ? new Date(note.nextReviewAt).toISOString() : "Now"}`,
    `- Created: ${new Date(note.createdAt || Date.now()).toISOString()}`,
    `- Updated: ${new Date(note.updatedAt || Date.now()).toISOString()}`,
    "",
    note.body || "",
    ""
  ];

  if (Array.isArray(note.attachments) && note.attachments.length) {
    lines.push("## Images", "");
    note.attachments.forEach((attachment) => {
      const target = attachmentMarkdownTarget(attachment);
      if (target) lines.push(`![${markdownLabel(attachment.name)}](${target})`);
    });
    lines.push("");
  }

  if (Array.isArray(note.reviewLog) && note.reviewLog.length) {
    lines.push("## Review Log", "");
    note.reviewLog.forEach((entry) => {
      lines.push(`- ${new Date(entry.at || Date.now()).toISOString()}: ${entry.text || ""}`);
    });
    lines.push("");
  }

  return lines.join("\n");
}

function titleCase(value) {
  return String(value)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function timestampSlug() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function safeName(value) {
  const cleaned = String(value || "untitled")
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  return cleaned || "untitled";
}

function attachmentExtension(name, type) {
  const allowed = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".heic", ".heif", ".bmp", ".tif", ".tiff"]);
  const fromName = extname(String(name || "")).toLowerCase();
  if (allowed.has(fromName)) return fromName;

  return {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/heic": ".heic",
    "image/heif": ".heif",
    "image/bmp": ".bmp",
    "image/tiff": ".tiff"
  }[String(type || "").toLowerCase()] || ".png";
}

function safeAttachmentFilename(name, type) {
  const extension = attachmentExtension(name, type);
  const original = String(name || "image");
  const stem = safeName(basename(original, extname(original)) || "image");
  return `${timestampSlug()}-${randomUUID().slice(0, 8)}-${stem}${extension}`;
}

function attachmentUrl(filename) {
  return `/attachments/${encodeURIComponent(filename)}`;
}

function safeAttachmentRequestName(value) {
  const rawName = decodeURIComponent(String(value || ""));
  const filename = basename(rawName);
  return filename && filename === rawName ? filename : "";
}

function attachmentFilePath(filename) {
  return join(attachmentsDirPath(), filename);
}

function markdownLabel(value) {
  return String(value || "Image").replace(/[\[\]\r\n]+/g, " ").trim() || "Image";
}

function attachmentMarkdownTarget(attachment) {
  if (attachment?.path) return expandHome(String(attachment.path));
  if (attachment?.filename) return join(attachmentsDirPath(), attachment.filename);
  return String(attachment?.url || attachment?.name || "");
}

async function writeStorageConfig(nextDataDir) {
  await mkdir(appSupportDir, { recursive: true });
  await writeFile(storageConfigFile, `${JSON.stringify({ dataDir: nextDataDir }, null, 2)}\n`, "utf8");
}

async function chooseStorageFolder() {
  const { stdout } = await execFileAsync("osascript", [
    "-e",
    `set chosenFolder to choose folder with prompt "Choose a storage folder for ${appDisplayName}" default location (path to home folder)`,
    "-e",
    "POSIX path of chosenFolder"
  ]);
  return stdout.trim().replace(/\/$/, "");
}

async function switchDataDir(nextDataDir) {
  const previousDataDir = dataDir;
  const targetDir = resolve(expandHome(nextDataDir));
  if (!targetDir) throw new Error("Storage folder is required");

  await mkdir(targetDir, { recursive: true });
  const targetHasLibrary = existsSync(notesFilePath(targetDir)) || existsSync(settingsFilePath(targetDir));
  if (!targetHasLibrary && existsSync(previousDataDir) && resolve(previousDataDir) !== targetDir) {
    await cp(previousDataDir, targetDir, { recursive: true, force: false });
  }

  dataDir = targetDir;
  await ensureStorage();
  if (!process.env.RESEARCH_ASSIST_DATA_DIR) {
    await writeStorageConfig(targetDir);
  }

  const settings = await readSettings();
  return {
    ok: true,
    copiedCurrentLibrary: !targetHasLibrary && existsSync(previousDataDir) && resolve(previousDataDir) !== targetDir,
    notes: await readNotes(),
    categories: settings.categories || [],
    ...storagePaths()
  };
}

async function handleApi(request, response, requestUrl) {
  try {
    if (request.method === "GET" && requestUrl.pathname === "/api/meta") {
      sendJson(response, 200, {
        storageMode: "files",
        ...storagePaths()
      });
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/notes") {
      const settings = await readSettings();
      sendJson(response, 200, { notes: await readNotes(), categories: settings.categories || [] });
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/notes") {
      const body = await readJsonBody(request);
      const notes = Array.isArray(body) ? body : body?.notes;
      const categories = Array.isArray(body?.categories) ? body.categories : null;
      if (!Array.isArray(notes)) {
        sendJson(response, 400, { error: "Expected an array of notes" });
        return;
      }

      await writeNotes(notes);
      if (categories) {
        await writeSettings({ categories });
      }
      sendJson(response, 200, {
        ok: true,
        count: notes.length,
        ...storagePaths()
      });
      return;
    }


    if (request.method === "POST" && requestUrl.pathname === "/api/attachments/delete") {
      const body = await readJsonBody(request);
      const filename = safeAttachmentRequestName(body?.filename);
      if (!filename) {
        sendJson(response, 400, { error: "Expected an attachment filename" });
        return;
      }

      await ensureStorage();
      const filePath = attachmentFilePath(filename);
      let deleted = false;
      if (existsSync(filePath)) {
        await unlink(filePath);
        deleted = true;
      }

      sendJson(response, 200, {
        ok: true,
        deleted,
        filename,
        ...storagePaths()
      });
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/attachments") {
      const body = await readJsonBody(request);
      const match = /^data:([^;,]+);base64,(.+)$/s.exec(String(body?.dataUrl || ""));
      if (!match) {
        sendJson(response, 400, { error: "Expected an image data URL" });
        return;
      }

      const type = String(body?.type || match[1] || "").toLowerCase();
      if (!type.startsWith("image/")) {
        sendJson(response, 415, { error: "Only image attachments are supported" });
        return;
      }

      const buffer = Buffer.from(match[2].replace(/\s+/g, ""), "base64");
      if (!buffer.byteLength || buffer.byteLength > maxAttachmentBytes) {
        sendJson(response, 413, { error: "Image must be 20 MB or smaller" });
        return;
      }

      await ensureStorage();
      const originalName = String(body?.name || "image").trim() || "image";
      const filename = safeAttachmentFilename(originalName, type);
      const filePath = attachmentFilePath(filename);
      await writeFile(filePath, buffer);
      sendJson(response, 200, {
        ok: true,
        attachment: {
          id: randomUUID(),
          name: originalName,
          type,
          size: buffer.byteLength,
          filename,
          path: displayPath(filePath),
          url: attachmentUrl(filename),
          createdAt: Date.now()
        },
        ...storagePaths()
      });
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/export/json") {
      const body = await readJsonBody(request);
      const notes = Array.isArray(body) ? body : body?.notes;
      const payload = Array.isArray(body)
        ? notes
        : {
            notes,
            categories: Array.isArray(body?.categories) ? body.categories : []
          };
      if (!Array.isArray(notes)) {
        sendJson(response, 400, { error: "Expected an array of notes" });
        return;
      }

      await ensureStorage();
      const filePath = join(exportsDirPath(), `insight-tadpole-notes-${timestampSlug()}.json`);
      await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
      sendJson(response, 200, {
        ok: true,
        filePath: displayPath(filePath),
        exportsDir: displayPath(exportsDirPath())
      });
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/export/markdown") {
      const body = await readJsonBody(request);
      const notes = Array.isArray(body) ? body : body?.notes;
      if (!Array.isArray(notes)) {
        sendJson(response, 400, { error: "Expected an array of notes" });
        return;
      }

      await ensureStorage();
      const markdown = [...notes]
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        .map(noteToMarkdown)
        .join("\n\n---\n\n");
      const filePath = join(exportsDirPath(), `insight-tadpole-notes-${timestampSlug()}.md`);
      await writeFile(filePath, `${markdown}\n`, "utf8");
      sendJson(response, 200, {
        ok: true,
        filePath: displayPath(filePath),
        exportsDir: displayPath(exportsDirPath())
      });
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/storage/choose") {
      if (process.env.RESEARCH_ASSIST_DATA_DIR) {
        sendJson(response, 409, { error: "Storage folder is fixed by RESEARCH_ASSIST_DATA_DIR" });
        return;
      }

      let selectedDir;
      try {
        selectedDir = await chooseStorageFolder();
      } catch (error) {
        if (String(error?.message || "").includes("User canceled")) {
          sendJson(response, 200, { ok: false, cancelled: true, ...storagePaths() });
          return;
        }
        throw error;
      }

      sendJson(response, 200, await switchDataDir(selectedDir));
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/storage/default") {
      if (process.env.RESEARCH_ASSIST_DATA_DIR) {
        sendJson(response, 409, { error: "Storage folder is fixed by RESEARCH_ASSIST_DATA_DIR" });
        return;
      }

      sendJson(response, 200, await switchDataDir(defaultDataDir));
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/storage/open") {
      await ensureStorage();
      execFile("open", [dataDir]);
      sendJson(response, 200, { ok: true, dataDir: displayPath(dataDir) });
      return;
    }

    sendJson(response, 404, { error: "Unknown API route" });
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Storage error" });
  }
}

async function serveAttachment(pathname, response) {
  await ensureStorage();
  const filename = safeAttachmentRequestName(pathname.slice("/attachments/".length));
  if (!filename) {
    sendText(response, 404, "Not found");
    return;
  }

  const filePath = join(attachmentsDirPath(), filename);
  if (!existsSync(filePath)) {
    sendText(response, 404, "Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": mimeTypes[extname(filePath).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-store"
  });
  createReadStream(filePath).pipe(response);
}

function resolvePath(url) {
  const requestPath = decodeURIComponent(new URL(url, `http://localhost:${port}`).pathname);
  const safePath = normalize(requestPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(root, safePath === "/" ? "index.html" : safePath);
  return filePath.startsWith(root) ? filePath : join(root, "index.html");
}

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url || "/", `http://localhost:${port}`);
  if (requestUrl.pathname.startsWith("/api/")) {
    await handleApi(request, response, requestUrl);
    return;
  }

  if (requestUrl.pathname.startsWith("/attachments/")) {
    await serveAttachment(requestUrl.pathname, response);
    return;
  }

  const filePath = resolvePath(request.url || "/");
  const target = existsSync(filePath) ? filePath : join(root, "index.html");

  try {
    const fileStat = await stat(target);
    if (fileStat.isDirectory()) {
      response.writeHead(302, { Location: "/" });
      response.end();
      return;
    }

    response.writeHead(200, {
      "Content-Type": mimeTypes[extname(target)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    createReadStream(target).pipe(response);
  } catch {
    sendText(response, 404, "Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  const url = `http://localhost:${port}`;
  console.log(`${appDisplayName} running at ${url}`);
  console.log(`Notes JSON: ${displayPath(notesFilePath())}`);
  console.log(`Settings JSON: ${displayPath(settingsFilePath())}`);
  console.log(`Sorted notes: ${displayPath(sortedDirPath())}`);
  console.log(`Exports: ${displayPath(exportsDirPath())}`);
  if (shouldOpen) {
    execFile("open", [url]);
  }
});
