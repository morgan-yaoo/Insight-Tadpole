# Insight Tadpole

Insight Tadpole is a local-first research note app for capturing ideas, pasted paper excerpts, reading notes, source metadata, categories, subcategories, tags, and revisit queues. It is designed for researchers who want their note library to stay on their own Mac while still being searchable and automatically organized.

Current release: `v0.1.2`

Official repository: <https://github.com/morgan-yaoo/Insight-Tadpole>

## Download

Apple Silicon release builds are published from the GitHub Releases page:

<https://github.com/morgan-yaoo/Insight-Tadpole/releases>

The current local build artifacts are:

```text
dist/Insight Tadpole-Apple-Silicon.dmg
dist/Insight Tadpole-Apple-Silicon.pkg
```

The app is built for Apple Silicon Macs. These builds are unsigned and not notarized, so macOS Gatekeeper may show a warning the first time the app is opened on another Mac.

## Privacy And Storage

Insight Tadpole stores your notes locally by default. Your personal note data, images, exports, and storage folders are not part of this repository unless you deliberately copy them into the project folder and commit them.

Default storage folder:

```text
$HOME/Insight Tadpole Data/
```

Inside that folder:

```text
notes.json
settings.json
attachments/
sorted-notes/
  by-category/
  by-subcategory/
  by-tag/
  _category-index.md
  _subcategory-index.md
  _tag-index.md
exports/
```

If an older `Insight Tadpole`, `Insight tadpole`, or `Research Assist Notes` storage folder exists and the default folder does not, the local server copies the old data into `$HOME/Insight Tadpole Data/` on first launch.

You can change the storage location in the Storage page with `Choose Storage Folder`. If the chosen folder is empty, the current library is copied there. If it already contains `notes.json` or `settings.json`, Insight Tadpole switches to that library without overwriting it.

You can also override the data folder when running locally:

```bash
RESEARCH_ASSIST_DATA_DIR="/path/to/my/notes" npm start
```

## Features

- Capture ideas, excerpts, paper references, tasks, questions, and reading notes.
- Add images with the file picker, drag-and-drop, or clipboard paste.
- Click image thumbnails to open a full-screen image preview.
- Uploaded image files are renamed from the note title when saved.
- Store optional conference/journal and year metadata for paper notes.
- Write notes in Markdown, HTML, or plain text with a live preview.
- Use tag chips with comma, semicolon, or Enter input, plus click-to-remove tags.
- Use editable categories, saved colors, nested subcategories, and removable tags.
- Search notes by text, category, subcategory, tag, pinned state, and review state.
- Revisit notes with due-now, daily-random, all-notes, unreviewed, pinned, tag-indexed, and category-indexed queues.
- Set per-note review intervals and a daily random review target.
- Use two-step confirmation before deleting notes, categories, subcategories, tags, or cancelling draft edits.
- Keep sorted Markdown copies by category, subcategory, and tag.
- Export JSON and Markdown snapshots into the visible `exports` folder.

## Run Locally

```bash
npm start
```

Then open:

```text
http://localhost:3214
```

Opening `index.html` directly in a browser still works as a fallback, but that mode can only use browser localStorage. Use `npm start` or the macOS app bundle for real local file storage.

## Test

```bash
npm run check
npm run test:logical-pressure
```

The logical and pressure test starts an isolated localhost server with a temporary data folder, checks API round trips, attachment deletion, sorted Markdown folders, exports, and repeated large-library writes, then removes the temporary test data.

## Build

Build the lightweight macOS launcher bundle:

```bash
npm run build:mac
```

The app appears at:

```text
dist/Insight Tadpole.app
```

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

## Release 0.1.2

- Added per-note `Review Every` intervals for scheduled revisits.
- Added a `Daily Random` review queue with a saved daily note target.
- Daily random review prioritizes due notes, fills with stable random picks, and skips notes already reviewed today.
- Added two-step confirmation for deleting notes, deleting categories/subcategories, deleting tags, and cancelling draft edits.
- Added tag deletion in Organize; deleting a tag removes it from affected notes without deleting the notes.
- Improved Review queue dropdown spacing.
- Persisted review settings in local `settings.json` and added regression coverage.

## Release 0.1.1

- Improved Capture with image drag/drop, clipboard paste, file picker upload, and title-based image filenames.
- Added Markdown, HTML, and plain text note modes with live preview.
- Added tag chips that support comma, semicolon, Enter, and click-to-remove behavior.
- Added optional paper metadata fields for conference/journal and year.
- Added full-screen image preview from thumbnails.
- Moved `Clear Draft` and `Cancel Edit` next to `Save Note`.

## License

The source code is licensed for noncommercial use under the [PolyForm Noncommercial License 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0). Noncommercial forks, modifications, and redistribution are allowed only with attribution to Morgan and the original project. Commercial use requires prior written permission.

Documentation and non-brand visual assets are licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) unless otherwise noted. The Insight Tadpole name, logo, icon, and visual identity are reserved; see [NOTICE](NOTICE).
