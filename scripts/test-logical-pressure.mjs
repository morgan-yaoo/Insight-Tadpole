import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { existsSync } from "node:fs";
import { mkdtemp, readdir, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const port = Number(process.env.TEST_PORT || 43215);
const baseUrl = `http://127.0.0.1:${port}`;
const pressureNoteCount = Number(process.env.PRESSURE_NOTES || 1000);
const pressureWriteCycles = Number(process.env.PRESSURE_WRITE_CYCLES || 3);
const dataDir = await mkdtemp(join(tmpdir(), "insight-tadpole-test-"));

const reviewSettings = { dailyTarget: 7 };

const categories = [
  {
    id: "idea",
    name: "Idea",
    color: "#315f53",
    soft: "#dce9e1",
    keywords: ["idea", "hypothesis"],
    subcategories: [
      { id: "research-gap", name: "Research Gap", keywords: ["gap"] },
      { id: "mechanism", name: "Mechanism", keywords: ["mechanism"] }
    ]
  },
  {
    id: "method",
    name: "Method",
    color: "#286a70",
    soft: "#d6eceb",
    keywords: ["method", "protocol"],
    subcategories: [
      { id: "sampling", name: "Sampling", keywords: ["sample"] },
      { id: "analysis", name: "Analysis", keywords: ["analysis"] }
    ]
  },
  {
    id: "evidence",
    name: "Evidence",
    color: "#775624",
    soft: "#efe4c7",
    keywords: ["finding", "evidence"],
    subcategories: [{ id: "result", name: "Result", keywords: ["result"] }]
  }
];

const results = [];
const metrics = {};

let serverProcess;
try {
  serverProcess = startServer();
  await waitForServer();

  await testLogicalRoundTrip();
  await testSortedStorage();
  await testExports();
  await testPressureWrites();

  console.log(
    JSON.stringify(
      {
        ok: true,
        dataDir,
        pressureNoteCount,
        pressureWriteCycles,
        results,
        metrics
      },
      null,
      2
    )
  );
} finally {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill("SIGTERM");
    await once(serverProcess, "exit").catch(() => {});
  }
  await rm(dataDir, { recursive: true, force: true });
}

function startServer() {
  const child = spawn(process.execPath, ["scripts/serve.mjs", "--port", String(port)], {
    cwd: projectRoot,
    env: {
      ...process.env,
      RESEARCH_ASSIST_DATA_DIR: dataDir,
      PORT: String(port)
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  child.stdout.on("data", () => {});
  child.stderr.on("data", (chunk) => {
    process.stderr.write(chunk);
  });
  return child;
}

async function waitForServer() {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    if (serverProcess.exitCode !== null) {
      throw new Error(`Server exited before readiness with code ${serverProcess.exitCode}`);
    }

    try {
      const response = await fetch(`${baseUrl}/api/meta`);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
  }
  throw new Error("Timed out waiting for test server");
}

async function testLogicalRoundTrip() {
  const notes = [
    makeNote({
      id: "logic-note-1",
      title: "Mechanism idea",
      category: "idea",
      subcategory: "mechanism",
      tags: ["theory", "mechanism"]
    }),
    makeNote({
      id: "logic-note-2",
      title: "Sampling protocol",
      category: "method",
      subcategory: "sampling",
      tags: ["methods", "sampling"]
    })
  ];

  const post = await timed("logicalPostMs", () => apiPost("/api/notes", { notes, categories, reviewSettings }));
  assert.equal(post.count, notes.length);

  const library = await timed("logicalGetMs", () => apiGet("/api/notes"));
  assert.equal(library.notes.length, notes.length);
  assert.equal(library.categories.length, categories.length);
  assert.equal(library.reviewSettings.dailyTarget, reviewSettings.dailyTarget);
  assert.equal(library.notes.find((note) => note.id === "logic-note-1").subcategory, "mechanism");
  assert.equal(library.categories.find((category) => category.id === "idea").subcategories.length, 2);
  pass("logical round trip", "notes, categories, and subcategories survive POST/GET");
}

async function testSortedStorage() {
  const categoryPath = join(dataDir, "sorted-notes", "by-category", "Idea", "Mechanism");
  const subcategoryPath = join(dataDir, "sorted-notes", "by-subcategory", "Idea", "Mechanism");
  const subcategoryIndex = join(dataDir, "sorted-notes", "_subcategory-index.md");

  assert.equal(existsSync(categoryPath), true);
  assert.equal(existsSync(subcategoryPath), true);
  assert.equal(existsSync(subcategoryIndex), true);

  const categoryFiles = await readdir(categoryPath);
  assert.equal(categoryFiles.length, 1);
  const markdown = await readFile(join(categoryPath, categoryFiles[0]), "utf8");
  assert.match(markdown, /- Category: Idea/);
  assert.match(markdown, /- Subcategory: Mechanism/);
  assert.match(await readFile(subcategoryIndex, "utf8"), /Idea \/ Mechanism/);
  pass("sorted storage", "Markdown folders and subcategory index are written correctly");
}

async function testExports() {
  const library = await apiGet("/api/notes");
  const jsonExport = await timed("jsonExportMs", () => apiPost("/api/export/json", library));
  const markdownExport = await timed("markdownExportMs", () => apiPost("/api/export/markdown", { notes: library.notes }));

  assert.match(jsonExport.filePath, /insight-tadpole-notes-.*\.json$/);
  assert.match(markdownExport.filePath, /insight-tadpole-notes-.*\.md$/);
  assert.equal(existsSync(jsonExport.filePath), true);
  assert.equal(existsSync(markdownExport.filePath), true);
  assert.match(await readFile(markdownExport.filePath, "utf8"), /- Subcategory: Mechanism/);
  pass("export endpoints", "JSON and Markdown exports complete and include subcategory metadata");
}

async function testPressureWrites() {
  const notes = Array.from({ length: pressureNoteCount }, (_, index) => makePressureNote(index));
  const firstWrite = await timed("pressureInitialPostMs", () => apiPost("/api/notes", { notes, categories }));
  assert.equal(firstWrite.count, pressureNoteCount);

  for (let cycle = 1; cycle <= pressureWriteCycles; cycle += 1) {
    const now = Date.now();
    for (let index = cycle; index < notes.length; index += 97) {
      notes[index] = {
        ...notes[index],
        body: `${notes[index].body}\n\nCycle ${cycle}: updated pressure-test paragraph ${randomUUID()}.`,
        updatedAt: now + index
      };
    }
    await timed(`pressureRewrite${cycle}Ms`, () => apiPost("/api/notes", { notes, categories }));
  }

  const library = await timed("pressureGetMs", () => apiGet("/api/notes"));
  assert.equal(library.notes.length, pressureNoteCount);

  const markdownExport = await timed("pressureMarkdownExportMs", () =>
    apiPost("/api/export/markdown", { notes: library.notes })
  );
  assert.equal(existsSync(markdownExport.filePath), true);

  metrics.sortedFileCount = await countFiles(join(dataDir, "sorted-notes"));
  const notesFileStat = await stat(join(dataDir, "notes.json"));
  metrics.notesJsonBytes = notesFileStat.size;
  pass(
    "pressure writes",
    `${pressureNoteCount} notes, ${pressureWriteCycles} full rewrites, export, and ${metrics.sortedFileCount} sorted files completed`
  );
}

function makeNote({ id, title, category, subcategory, tags }) {
  const now = Date.now();
  return {
    id,
    title,
    source: "Automated logical test",
    body: `${title} body. This note checks category, subcategory, tag, and Markdown persistence logic.`,
    category,
    categoryName: categories.find((item) => item.id === category)?.name || category,
    subcategory,
    subcategoryName: categories
      .find((item) => item.id === category)
      ?.subcategories.find((item) => item.id === subcategory)?.name,
    tags,
    reviewIntervalDays: 21,
    pinned: false,
    lastReviewedAt: null,
    nextReviewAt: null,
    reviewCount: 0,
    reviewLog: [],
    createdAt: now,
    updatedAt: now
  };
}

function makePressureNote(index) {
  const category = categories[index % categories.length];
  const subcategory = category.subcategories[index % category.subcategories.length];
  const now = Date.now() - index * 1000;
  return {
    id: `pressure-note-${index}`,
    title: `Pressure note ${String(index).padStart(4, "0")}`,
    source: `Generated source ${index % 20}`,
    body: [
      `Pressure-test body for note ${index}.`,
      "This simulates pasted research notes with repeated paragraphs, metadata, tags, and review fields.",
      `Category ${category.name}; subcategory ${subcategory.name}; generated token ${randomUUID()}.`,
      "The purpose is to exercise JSON persistence, sorted Markdown folders, category indexing, tag indexing, and export paths."
    ].join(" "),
    category: category.id,
    categoryName: category.name,
    subcategory: subcategory.id,
    subcategoryName: subcategory.name,
    tags: [`tag-${index % 15}`, category.id, subcategory.id],
    pinned: index % 113 === 0,
    lastReviewedAt: index % 5 === 0 ? now - 1000 * 60 * 60 * 24 : null,
    nextReviewAt: index % 7 === 0 ? now + 1000 * 60 * 60 * 24 * 7 : null,
    reviewCount: index % 5,
    reviewLog: index % 11 === 0 ? [{ at: now, text: "Pressure review log entry." }] : [],
    createdAt: now,
    updatedAt: now + (index % 37)
  };
}

async function apiGet(path) {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) throw new Error(`GET ${path} failed with ${response.status}`);
  return response.json();
}

async function apiPost(path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`POST ${path} failed with ${response.status}`);
  return response.json();
}

async function timed(name, action) {
  const start = performance.now();
  const result = await action();
  metrics[name] = Math.round(performance.now() - start);
  return result;
}

async function countFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const nestedCounts = await Promise.all(
    entries.map(async (entry) => {
      const path = join(root, entry.name);
      return entry.isDirectory() ? countFiles(path) : 1;
    })
  );
  return nestedCounts.reduce((total, count) => total + count, 0);
}

function pass(name, details) {
  results.push({ name, status: "passed", details });
}
