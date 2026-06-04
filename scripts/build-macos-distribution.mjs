import { execFile } from "node:child_process";
import { mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const distRoot = join(projectRoot, "dist");
const appName = "Insight Tadpole.app";
const dmgStagingRoot = join(distRoot, "dmg-staging");
const packageWorkRoot = join(distRoot, "pkg-work");
const appRoot = join(packageWorkRoot, appName);
const pkgRoot = join(packageWorkRoot, "root");
const componentPkgPath = join(packageWorkRoot, "local.insight-tadpole-component.pkg");
const componentPlistPath = join(packageWorkRoot, "components.plist");
const requirementsPath = join(packageWorkRoot, "apple-silicon-requirements.plist");
const dmgPath = join(distRoot, "Insight Tadpole-Apple-Silicon.dmg");
const pkgPath = join(distRoot, "Insight Tadpole-Apple-Silicon.pkg");
const cleanEnv = { ...process.env, COPYFILE_DISABLE: "1" };

await rm(dmgPath, { force: true });
await rm(pkgPath, { force: true });
await rm(dmgStagingRoot, { recursive: true, force: true });
await rm(packageWorkRoot, { recursive: true, force: true });
await execFileAsync(process.execPath, ["scripts/fetch-node-runtime.mjs"], { cwd: projectRoot, env: cleanEnv });
await mkdir(dmgStagingRoot, { recursive: true });
await mkdir(packageWorkRoot, { recursive: true });
await execFileAsync(process.execPath, ["scripts/build-macos-app.mjs"], {
  cwd: projectRoot,
  env: { ...cleanEnv, INSIGHT_TADPOLE_APP_ROOT: appRoot }
});

await execFileAsync("xattr", ["-cr", appRoot], { env: cleanEnv }).catch(() => {});
await execFileAsync("ditto", ["--norsrc", appRoot, join(dmgStagingRoot, appName)], { env: cleanEnv });
await symlink("/Applications", join(dmgStagingRoot, "Applications"));
await writeFile(
  join(dmgStagingRoot, "README.txt"),
  [
    "Insight Tadpole",
    "",
    "Drag Insight Tadpole.app into Applications.",
    "",
    "This Apple Silicon build is packaged for arm64 macOS 12.0 or later.",
    "The app starts a local note server and currently requires Node.js to be installed on the Mac unless an embedded runtime is added under Contents/Resources/runtime/node."
  ].join("\n"),
  "utf8"
);

await execFileAsync("hdiutil", [
  "create",
  "-volname",
  "Insight Tadpole",
  "-srcfolder",
  dmgStagingRoot,
  "-ov",
  "-format",
  "UDZO",
  dmgPath
], { env: cleanEnv });

await writeFile(
  requirementsPath,
  `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>os</key>
  <array>
    <string>12.0</string>
  </array>
  <key>arch</key>
  <array>
    <string>arm64</string>
  </array>
</dict>
</plist>
`,
  "utf8"
);

await writeFile(
  componentPlistPath,
  `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<array>
  <dict>
    <key>RootRelativeBundlePath</key>
    <string>Applications/Insight Tadpole.app</string>
    <key>BundleIsRelocatable</key>
    <false/>
    <key>BundleIsVersionChecked</key>
    <false/>
    <key>BundleHasStrictIdentifier</key>
    <false/>
    <key>BundleOverwriteAction</key>
    <string>upgrade</string>
  </dict>
</array>
</plist>
`,
  "utf8"
);

await mkdir(join(pkgRoot, "Applications"), { recursive: true });
await execFileAsync("ditto", ["--norsrc", appRoot, join(pkgRoot, "Applications", appName)], { env: cleanEnv });
await execFileAsync("pkgbuild", [
  "--root",
  pkgRoot,
  "--install-location",
  "/",
  "--identifier",
  "local.insight-tadpole",
  "--version",
  "0.1.0",
  "--ownership",
  "recommended",
  "--component-plist",
  componentPlistPath,
  "--filter",
  ".*\\.DS_Store$",
  "--filter",
  ".*\\._.*",
  componentPkgPath
], { env: cleanEnv });
await execFileAsync("productbuild", [
  "--product",
  requirementsPath,
  "--package",
  componentPkgPath,
  pkgPath
], { env: cleanEnv });

await rm(dmgStagingRoot, { recursive: true, force: true });
await rm(packageWorkRoot, { recursive: true, force: true });

console.log(`Built ${dmgPath}`);
console.log(`Built ${pkgPath}`);
