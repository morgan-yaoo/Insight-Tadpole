# Insight Tadpole

A local-first research note app for capturing ideas, pasted paper excerpts, source metadata, auto-categories, editable subcategories, and tags. When launched through the local server or macOS bundle, it stores notes as real files on your Mac and keeps sorted Markdown copies by category, subcategory, and tag.

## Run Locally

```bash
npm start
```

Then open `http://localhost:3214`.

Opening `index.html` directly in a browser still works as a fallback, but that mode can only use browser localStorage. Use `npm start` or the macOS app bundle for local PC file storage.

## Test

```bash
npm run check
npm run test:logical-pressure
```

The logical and pressure test starts an isolated localhost server with a temporary data folder, checks API round trips, sorted Markdown folders, exports, and repeated large-library writes, then removes the temporary test data.

## Where Notes Are Stored

By default, the local server writes to:

```text
$HOME/Insight Tadpole Data/
```

If an older `Insight Tadpole`, `Insight tadpole`, or `Research Assist Notes` storage folder exists and the default folder does not, the local server copies the old data into `$HOME/Insight Tadpole Data/` on first launch.

Inside that folder:

```text
notes.json
settings.json
sorted-notes/
  by-category/
  by-subcategory/
  by-tag/
  _category-index.md
  _subcategory-index.md
  _tag-index.md
exports/
```

You can change the storage location in the Storage page with `Choose Storage Folder`. If the chosen folder is empty, the current library is copied there. If it already contains `notes.json` or `settings.json`, Insight Tadpole switches to that library without overwriting it.

You can override the data folder with:

```bash
RESEARCH_ASSIST_DATA_DIR="/path/to/my/notes" npm start
```

## macOS App Bundle

Build a lightweight macOS launcher bundle:

```bash
npm run build:mac
```

The app appears at:

```text
dist/Insight Tadpole.app
```

This bundle starts the local Node server and opens the app in the default browser. It does not require Electron or any npm dependencies.

## Apple Silicon DMG / PKG

Build distributable Apple Silicon artifacts:

```bash
npm run build:dist
```

The outputs appear at:

```text
dist/Insight Tadpole-Apple-Silicon.dmg
dist/Insight Tadpole-Apple-Silicon.pkg
```

The PKG is restricted to `arm64` and macOS 12.0 or later. The launcher uses an embedded runtime at `Contents/Resources/runtime/node` if present; otherwise it requires Node.js to be installed on the Mac.

These local artifacts are unsigned and not notarized, so Gatekeeper may show a warning when they are opened on another Mac.

## Features

- Capture notes, excerpts, paper references, and research questions.
- Revisit existing notes with a Review queue, reviewed/later scheduling, and review-log reflections.
- Automatic category suggestions for ideas, literature notes, methods, evidence, questions, quotes, and tasks.
- Editable custom categories with saved names, colors, and nested subcategories.
- Auto-suggested tags plus manual tag editing.
- All Notes page with category, subcategory, tag, pinned, and text search filters.
- Separate Capture, Review, All Notes, Organize, and Storage pages.
- Local file persistence with sorted Markdown folders.
- JSON and Markdown export snapshots saved into the visible `exports` folder.
