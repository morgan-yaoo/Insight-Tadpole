import { execFile } from "node:child_process";
import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceSvg = join(projectRoot, "assets", "app-icon.svg");
const iconsetRoot = join(projectRoot, "dist", "app-icon.iconset");
const workRoot = join(projectRoot, "dist", "icon-work");
const renderedPng = join(workRoot, "app-icon.svg.png");
const previewPng = join(projectRoot, "assets", "app-icon-preview.png");
const icnsPath = join(projectRoot, "assets", "app-icon.icns");

const icons = [
  ["icon_16x16.png", 16],
  ["icon_16x16@2x.png", 32],
  ["icon_32x32.png", 32],
  ["icon_32x32@2x.png", 64],
  ["icon_128x128.png", 128],
  ["icon_128x128@2x.png", 256],
  ["icon_256x256.png", 256],
  ["icon_256x256@2x.png", 512],
  ["icon_512x512.png", 512],
  ["icon_512x512@2x.png", 1024]
];

await rm(workRoot, { recursive: true, force: true });
await rm(iconsetRoot, { recursive: true, force: true });
await mkdir(workRoot, { recursive: true });
await mkdir(iconsetRoot, { recursive: true });

await execFileAsync("qlmanage", ["-t", "-s", "1024", "-o", workRoot, sourceSvg]);
await cp(renderedPng, previewPng);

for (const [filename, size] of icons) {
  await execFileAsync("sips", ["-z", String(size), String(size), renderedPng, "--out", join(iconsetRoot, filename)]);
}

await execFileAsync("iconutil", ["-c", "icns", "-o", icnsPath, iconsetRoot]);
await execFileAsync("xattr", ["-cr", icnsPath]).catch(() => {});
await rm(workRoot, { recursive: true, force: true });
await rm(iconsetRoot, { recursive: true, force: true });

console.log("Built " + icnsPath);
console.log("Built " + previewPng);
