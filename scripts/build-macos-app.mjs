import { execFile } from "node:child_process";
import { chmod, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const packageMeta = JSON.parse(await readFile(join(projectRoot, "package.json"), "utf8"));
const appVersion = packageMeta.version || "0.1.0";
const distRoot = join(projectRoot, "dist");
const appName = "Insight Tadpole.app";
const legacyAppNames = ["Insight tadpole.app", "Research Assist Notes.app"];
const appRoot = process.env.INSIGHT_TADPOLE_APP_ROOT ? resolve(process.env.INSIGHT_TADPOLE_APP_ROOT) : join(distRoot, appName);
const contentsRoot = join(appRoot, "Contents");
const macosRoot = join(contentsRoot, "MacOS");
const resourcesRoot = join(contentsRoot, "Resources");
const bundledAppRoot = join(resourcesRoot, "app");
const runtimeSourceRoot = join(distRoot, "node-runtime");
const bundledRuntimeRoot = join(resourcesRoot, "runtime");
const launcherPath = join(macosRoot, "insight-tadpole");
const launcherSourcePath = join(projectRoot, "scripts", "macos-launcher.m");

await rm(appRoot, { recursive: true, force: true });
if (!process.env.INSIGHT_TADPOLE_APP_ROOT) {
  for (const legacyAppName of legacyAppNames) {
    await rm(join(distRoot, legacyAppName), { recursive: true, force: true });
  }
}
await mkdir(macosRoot, { recursive: true });
await mkdir(resourcesRoot, { recursive: true });
await cp(join(projectRoot, "assets", "app-icon.icns"), join(resourcesRoot, "app-icon.icns"));
await cp(runtimeSourceRoot, bundledRuntimeRoot, { recursive: true });

for (const path of ["index.html", "styles.css", "app.js", "package.json", "assets", "scripts"]) {
  await cp(join(projectRoot, path), join(bundledAppRoot, path), { recursive: true });
}

await writeFile(
  join(contentsRoot, "Info.plist"),
  `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>en</string>
  <key>CFBundleExecutable</key>
  <string>insight-tadpole</string>
  <key>CFBundleIconFile</key>
  <string>app-icon</string>
  <key>CFBundleIconName</key>
  <string>app-icon</string>
  <key>CFBundleIdentifier</key>
  <string>local.insight-tadpole</string>
  <key>CFBundleName</key>
  <string>Insight Tadpole</string>
  <key>CFBundleDisplayName</key>
  <string>Insight Tadpole</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>${appVersion}</string>
  <key>LSMinimumSystemVersion</key>
  <string>12.0</string>
</dict>
</plist>
`
);

await execFileAsync("clang", ["-fobjc-arc", "-framework", "Cocoa", launcherSourcePath, "-o", launcherPath]);
await chmod(launcherPath, 0o755);

console.log(`Built ${appRoot}`);
