import { chmod, cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
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
  <string>0.1.0</string>
  <key>LSMinimumSystemVersion</key>
  <string>12.0</string>
</dict>
</plist>
`
);

await writeFile(
  launcherPath,
  `#!/bin/zsh
set -e
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
APP_DIR="$(cd "$(dirname "$0")/../Resources/app" && pwd)"
NODE_BIN="$APP_DIR/../runtime/node"
if [[ ! -x "$NODE_BIN" ]]; then
  NODE_BIN="$(command -v node || true)"
fi
if [[ -z "$NODE_BIN" ]]; then
  for candidate in /opt/homebrew/bin/node /usr/local/bin/node /usr/bin/node; do
    if [[ -x "$candidate" ]]; then
      NODE_BIN="$candidate"
      break
    fi
  done
fi
if [[ -z "$NODE_BIN" ]]; then
  osascript -e 'display dialog "Insight Tadpole needs Node.js to run. Install Node.js for Apple Silicon, then open the app again. If Node is already installed, make sure it is available at /opt/homebrew/bin/node or /usr/local/bin/node." buttons {"OK"} default button "OK" with icon caution'
  exit 1
fi
cd "$APP_DIR"
PORT="\${RESEARCH_ASSIST_PORT:-3214}"
URL="http://localhost:$PORT"
META_URL="http://127.0.0.1:$PORT/api/meta"
if /usr/bin/curl -fsS "$META_URL" 2>/dev/null | /usr/bin/grep -q storageMode; then
  /usr/bin/open "$URL"
  exit 0
fi
"$NODE_BIN" scripts/serve.mjs --port "$PORT" --open
`
);

await chmod(launcherPath, 0o755);

console.log(`Built ${appRoot}`);
