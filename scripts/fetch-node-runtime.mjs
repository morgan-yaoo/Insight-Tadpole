import { execFile } from "node:child_process";
import { access, chmod, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const nodeVersion = process.env.INSIGHT_TADPOLE_NODE_VERSION || "v24.16.0";
const platform = "darwin-arm64";
const archiveName = "node-" + nodeVersion + "-" + platform + ".tar.xz";
const baseUrl = "https://nodejs.org/dist/" + nodeVersion;
const archiveUrl = baseUrl + "/" + archiveName;
const sumsUrl = baseUrl + "/SHASUMS256.txt";
const runtimeRoot = join(projectRoot, "dist", "node-runtime");
const downloadRoot = join(projectRoot, "dist", "node-download");
const archivePath = join(downloadRoot, archiveName);
const sumsPath = join(downloadRoot, "SHASUMS256.txt");
const extractRoot = join(downloadRoot, "extract");
const extractedRoot = join(extractRoot, "node-" + nodeVersion + "-" + platform);
const nodePath = join(runtimeRoot, "node");

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function existingRuntimeMatches() {
  if (!(await exists(nodePath))) return false;
  try {
    const { stdout } = await execFileAsync(nodePath, ["--version"]);
    return stdout.trim() === nodeVersion;
  } catch {
    return false;
  }
}

if (await existingRuntimeMatches()) {
  console.log("Runtime already ready: " + nodePath + " (" + nodeVersion + ")");
  process.exit(0);
}

await rm(downloadRoot, { recursive: true, force: true });
await rm(runtimeRoot, { recursive: true, force: true });
await mkdir(downloadRoot, { recursive: true });
await mkdir(runtimeRoot, { recursive: true });
await mkdir(extractRoot, { recursive: true });

console.log("Downloading " + archiveUrl);
await execFileAsync("curl", ["-fL", archiveUrl, "-o", archivePath]);
await execFileAsync("curl", ["-fL", sumsUrl, "-o", sumsPath]);

const sums = await readFile(sumsPath, "utf8");
const expected = sums.split("\n").find((line) => line.endsWith(" " + archiveName));
if (!expected) {
  throw new Error("No checksum found for " + archiveName);
}
const { stdout: actualSumOutput } = await execFileAsync("shasum", ["-a", "256", archivePath]);
const actualHash = actualSumOutput.trim().split(/\s+/)[0];
const expectedHash = expected.split(/\s+/)[0];
if (actualHash !== expectedHash) {
  throw new Error("Checksum mismatch for " + archiveName);
}
console.log("Verified " + archiveName);

await execFileAsync("tar", ["-xJf", archivePath, "-C", extractRoot]);
await cp(join(extractedRoot, "bin", "node"), nodePath);
await chmod(nodePath, 0o755);
for (const name of ["LICENSE", "README.md"]) {
  if (await exists(join(extractedRoot, name))) {
    await cp(join(extractedRoot, name), join(runtimeRoot, name));
  }
}
await writeFile(
  join(runtimeRoot, "runtime-info.json"),
  JSON.stringify({ name: "node", version: nodeVersion, platform, source: archiveUrl }, null, 2) + "\n",
  "utf8"
);
await execFileAsync("xattr", ["-cr", runtimeRoot]).catch(() => {});
await rm(downloadRoot, { recursive: true, force: true });

const { stdout: versionOutput } = await execFileAsync(nodePath, ["--version"]);
console.log("Built runtime " + nodePath + " (" + versionOutput.trim() + ")");
