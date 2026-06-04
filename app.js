const STORAGE_KEY = "insight-tadpole:v1";
const LEGACY_STORAGE_KEYS = ["research-assist-notes:v1"];

const DEFAULT_CATEGORIES = [
  { id: "inbox", name: "Inbox", color: "#6f6b61", soft: "#ece8dc", keywords: [] },
  {
    id: "idea",
    name: "Idea",
    color: "#315f53",
    soft: "#dce9e1",
    keywords: ["idea", "hypothesis", "propose", "concept", "model", "framework", "argument", "intuition", "mechanism"]
  },
  {
    id: "literature",
    name: "Literature",
    color: "#315f7d",
    soft: "#dbe8f0",
    keywords: ["paper", "article", "literature", "review", "citation", "doi", "abstract", "author", "journal", "study"]
  },
  {
    id: "method",
    name: "Method",
    color: "#286a70",
    soft: "#d6eceb",
    keywords: ["method", "methodology", "protocol", "instrument", "measure", "dataset", "sample", "survey", "interview", "regression", "experiment design"]
  },
  {
    id: "evidence",
    name: "Evidence",
    color: "#775624",
    soft: "#efe4c7",
    keywords: ["finding", "result", "evidence", "effect", "coefficient", "p-value", "significant", "table", "figure", "estimate"]
  },
  {
    id: "question",
    name: "Question",
    color: "#8a4050",
    soft: "#f3dfe4",
    keywords: ["question", "why", "how", "unclear", "open problem", "limitation", "what if", "needs clarification", "?"]
  },
  {
    id: "quote",
    name: "Quote",
    color: "#655187",
    soft: "#e5deef",
    keywords: ["quote", "quoted", "page", "pp.", "\"", "“", "”", "passage", "excerpt"]
  },
  {
    id: "task",
    name: "Task",
    color: "#6b4e77",
    soft: "#eadfed",
    keywords: ["todo", "to do", "follow up", "email", "read", "check", "replicate", "draft", "revise", "run"]
  }
];

const CATEGORY_PALETTE = ["#315f53", "#315f7d", "#286a70", "#775624", "#8a4050", "#655187", "#6b4e77", "#6f6b61"];

let categories = normalizeCategories(DEFAULT_CATEGORIES);
let categoryById = makeCategoryMap(categories);

const tagHints = [
  "causal inference",
  "replication",
  "measurement",
  "dataset",
  "theory",
  "ethics",
  "limitations",
  "mechanism",
  "qualitative",
  "statistics",
  "fieldwork",
  "survey",
  "experiment",
  "modeling",
  "citation",
  "future work",
  "writing",
  "reading list",
  "methods",
  "evidence",
  "open question"
];

const reviewBaseScopes = [
  { value: "due", label: "Due Now" },
  { value: "all", label: "All Notes" },
  { value: "unreviewed", label: "Unreviewed" },
  { value: "pinned", label: "Pinned" }
];

const stopWords = new Set([
  "about",
  "after",
  "again",
  "against",
  "also",
  "among",
  "because",
  "before",
  "between",
  "could",
  "during",
  "every",
  "first",
  "from",
  "have",
  "into",
  "more",
  "most",
  "note",
  "over",
  "paper",
  "same",
  "should",
  "study",
  "than",
  "that",
  "their",
  "there",
  "these",
  "this",
  "through",
  "under",
  "using",
  "were",
  "what",
  "when",
  "where",
  "which",
  "while",
  "with",
  "would"
]);

const elements = {
  activeFilters: document.querySelector("#activeFilters"),
  addCategoryButton: document.querySelector("#addCategoryButton"),
  attachmentPanel: document.querySelector(".attachment-panel"),
  attachmentPreview: document.querySelector("#attachmentPreview"),
  bodyInput: document.querySelector("#bodyInput"),
  capturePanel: document.querySelector('[data-page-panel="capture"]'),
  categoryColorInput: document.querySelector("#categoryColorInput"),
  categoryNameInput: document.querySelector("#categoryNameInput"),
  categoryNav: document.querySelector("#categoryNav"),
  categorySelect: document.querySelector("#categorySelect"),
  chooseStorageButton: document.querySelector("#chooseStorageButton"),
  clearFiltersButton: document.querySelector("#clearFiltersButton"),
  dataFolderPath: document.querySelector("#dataFolderPath"),
  defaultStorageButton: document.querySelector("#defaultStorageButton"),
  exportJsonButton: document.querySelector("#exportJsonButton"),
  exportMarkdownButton: document.querySelector("#exportMarkdownButton"),
  exportsFolderPath: document.querySelector("#exportsFolderPath"),
  draftTagChips: document.querySelector("#draftTagChips"),
  formatSelect: document.querySelector("#formatSelect"),
  formatPreview: document.querySelector("#formatPreview"),
  formatPreviewMode: document.querySelector("#formatPreviewMode"),
  importInput: document.querySelector("#importInput"),
  imageInput: document.querySelector("#imageInput"),
  libraryCount: document.querySelector("#libraryCount"),
  lightboxCaption: document.querySelector("#lightboxCaption"),
  lightboxCloseButton: document.querySelector("#lightboxCloseButton"),
  lightboxImage: document.querySelector("#lightboxImage"),
  imageLightbox: document.querySelector("#imageLightbox"),
  newButton: document.querySelector("#newButton"),
  notesFilePath: document.querySelector("#notesFilePath"),
  notesList: document.querySelector("#notesList"),
  openStorageButton: document.querySelector("#openStorageButton"),
  organizationGrid: document.querySelector("#organizationGrid"),
  pasteButton: document.querySelector("#pasteButton"),
  markReviewedButton: document.querySelector("#markReviewedButton"),
  openReviewNoteButton: document.querySelector("#openReviewNoteButton"),
  reviewCurrent: document.querySelector("#reviewCurrent"),
  reviewCurrentBody: document.querySelector("#reviewCurrentBody"),
  reviewCurrentCategory: document.querySelector("#reviewCurrentCategory"),
  reviewCurrentEmpty: document.querySelector("#reviewCurrentEmpty"),
  reviewCurrentMeta: document.querySelector("#reviewCurrentMeta"),
  reviewCurrentTags: document.querySelector("#reviewCurrentTags"),
  reviewCurrentTitle: document.querySelector("#reviewCurrentTitle"),
  reviewDueCount: document.querySelector("#reviewDueCount"),
  reviewLaterButton: document.querySelector("#reviewLaterButton"),
  reviewNextButton: document.querySelector("#reviewNextButton"),
  reviewQueue: document.querySelector("#reviewQueue"),
  reviewReflectionInput: document.querySelector("#reviewReflectionInput"),
  reviewReviewedCount: document.querySelector("#reviewReviewedCount"),
  reviewScopeSelect: document.querySelector("#reviewScopeSelect"),
  reviewUpcomingCount: document.querySelector("#reviewUpcomingCount"),
  saveButton: document.querySelector("#saveButton"),
  searchInput: document.querySelector("#searchInput"),
  showPinnedButton: document.querySelector("#showPinnedButton"),
  sortCreatedButton: document.querySelector("#sortCreatedButton"),
  sortUpdatedButton: document.querySelector("#sortUpdatedButton"),
  sortedFolderPath: document.querySelector("#sortedFolderPath"),
  sourceInput: document.querySelector("#sourceInput"),
  storageStatus: document.querySelector("#storageStatus"),
  subcategorySelect: document.querySelector("#subcategorySelect"),
  suggestedCategoryButton: document.querySelector("#suggestedCategoryButton"),
  suggestedTags: document.querySelector("#suggestedTags"),
  syncStorageButton: document.querySelector("#syncStorageButton"),
  tagCloud: document.querySelector("#tagCloud"),
  tagInput: document.querySelector("#tagInput"),
  titleInput: document.querySelector("#titleInput"),
  toast: document.querySelector("#toast"),
  venueInput: document.querySelector("#venueInput"),
  yearInput: document.querySelector("#yearInput")
};

let state = {
  activePage: "capture",
  notes: [],
  selectedId: null,
  editingId: null,
  draftAttachments: [],
  draftTags: [],
  pendingAttachmentDeletes: [],
  originalDraftAttachmentKeys: new Set(),
  noteOrder: "updated",
  reviewSelectedId: null,
  reviewScope: "due",
  filters: {
    category: "all",
    subcategory: null,
    tag: null,
    search: "",
    pinned: false
  },
  draftCategoryTouched: false,
  storage: {
    mode: "loading",
    dataDir: "",
    defaultDataDir: "",
    canChooseDataDir: false,
    notesFile: "",
    settingsFile: "",
    sortedDir: "",
    exportsDir: "",
    attachmentsDir: "",
    lastSync: null,
    error: ""
  }
};

async function initializeStorage() {
  try {
    const meta = await apiGet("/api/meta");
    const response = await apiGet("/api/notes");
    state.storage = {
      mode: "files",
      dataDir: meta.dataDir,
      defaultDataDir: meta.defaultDataDir,
      canChooseDataDir: Boolean(meta.canChooseDataDir),
      notesFile: meta.notesFile,
      settingsFile: meta.settingsFile,
      sortedDir: meta.sortedDir,
      exportsDir: meta.exportsDir,
      attachmentsDir: meta.attachmentsDir,
      lastSync: null,
      error: ""
    };
    const rawNotes = response.notes || [];
    setCategories(response.categories, rawNotes);
    state.notes = rawNotes.map(normalizeNote);
  } catch {
    const library = loadBrowserLibrary();
    state.storage = {
      mode: "browser",
      dataDir: "",
      defaultDataDir: "",
      canChooseDataDir: false,
      notesFile: "",
      settingsFile: "",
      sortedDir: "",
      exportsDir: "",
      lastSync: null,
      error: "Open the app from http://localhost:3214 or the macOS bundle to write notes as local files."
    };
    setCategories(library.categories, library.notes);
    state.notes = library.notes.map(normalizeNote);
  }

  state.selectedId = null;
}

async function apiGet(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`GET ${path} failed`);
  return response.json();
}

async function apiPost(path, body = {}) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`POST ${path} failed`);
  return response.json();
}

function loadBrowserLibrary() {
  const saved =
    localStorage.getItem(STORAGE_KEY) ||
    LEGACY_STORAGE_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
  if (!saved) return { notes: seedNotes(), categories: null };

  try {
    const library = JSON.parse(saved);
    if (Array.isArray(library)) return { notes: library, categories: null };
    if (library && typeof library === "object") {
      return {
        notes: Array.isArray(library.notes) ? library.notes : [],
        categories: Array.isArray(library.categories) ? library.categories : null
      };
    }
  } catch {
    showToast("Saved browser library could not be read");
  }

  return { notes: [], categories: null };
}

function seedNotes() {
  const now = Date.now();
  return [
    normalizeNote({
      id: crypto.randomUUID(),
      title: "Embodied cues and attention",
      source: "Working idea",
      body: "Hypothesis: interface friction changes what participants notice before they start a reading task. Need a clean manipulation that separates novelty from effort.",
      category: "idea",
      tags: ["attention", "interface", "hypothesis"],
      pinned: true,
      createdAt: now - 1000 * 60 * 60 * 8,
      updatedAt: now - 1000 * 60 * 60 * 8
    }),
    normalizeNote({
      id: crypto.randomUUID(),
      title: "Measurement paragraph for literature review",
      source: "Johnson 2024, Journal of Applied Methods",
      body: "The paper treats measurement as an iterative alignment problem between observed behavior and latent constructs. Useful for the methods section, especially the distinction between proxy validity and ecological validity.",
      category: "literature",
      tags: ["measurement", "validity", "methods"],
      pinned: false,
      createdAt: now - 1000 * 60 * 60 * 3,
      updatedAt: now - 1000 * 60 * 60 * 3
    }),
    normalizeNote({
      id: crypto.randomUUID(),
      title: "Follow-up checks",
      source: "Replication notes",
      body: "To do: rerun the robustness check with clustered standard errors, then compare the effect size against the original table.",
      category: "task",
      tags: ["replication", "statistics", "todo"],
      pinned: false,
      createdAt: now - 1000 * 60 * 42,
      updatedAt: now - 1000 * 60 * 42
    })
  ];
}

function makeCategoryMap(categoryList) {
  return Object.fromEntries(categoryList.map((category) => [category.id, category]));
}

function setCategories(nextCategories, rawNotes = []) {
  categories = normalizeCategories(nextCategories, rawNotes);
  categoryById = makeCategoryMap(categories);
}

function normalizeCategories(savedCategories, rawNotes = []) {
  const hasSavedCategories = Array.isArray(savedCategories) && savedCategories.length;
  const source = hasSavedCategories ? savedCategories : DEFAULT_CATEGORIES;
  const ids = new Set();
  const normalized = [];

  source.forEach((category, index) => {
    const normalizedCategory = normalizeCategory(category, index, ids);
    if (normalizedCategory) {
      normalized.push(normalizedCategory);
      ids.add(normalizedCategory.id);
    }
  });

  rawNotes.forEach((note) => {
    const rawCategory = String(note?.category || "").trim();
    if (!rawCategory) return;
    const candidateId = makeCategoryId(rawCategory);
    if (ids.has(rawCategory) || ids.has(candidateId)) return;
    const categoryName = String(note.categoryName || titleCase(rawCategory)).trim();
    const normalizedCategory = normalizeCategory(
      { id: candidateId, name: categoryName, color: nextCategoryColor(normalized.length) },
      normalized.length,
      ids
    );
    if (normalizedCategory) {
      normalized.push(normalizedCategory);
      ids.add(normalizedCategory.id);
    }
  });

  rawNotes.forEach((note) => {
    const category = findCategoryForRawNote(normalized, note) || normalized[0];
    addRawSubcategoryToCategory(category, note);
  });

  if (normalized.length) return normalized;
  const fallback = normalizeCategory(DEFAULT_CATEGORIES[0], 0, new Set());
  return fallback ? [fallback] : [];
}

function mergeCategoryDefinitions(existingCategories, incomingCategories) {
  const merged = new Map();
  [...existingCategories, ...incomingCategories].forEach((category) => {
    const key = makeCategoryId(category?.id || category?.name);
    if (!key) return;
    const previous = merged.get(key) || {};
    merged.set(key, {
      ...previous,
      ...category,
      id: key,
      subcategories: mergeSubcategoryDefinitions(previous.subcategories || [], category?.subcategories || [])
    });
  });
  return [...merged.values()];
}

function mergeSubcategoryDefinitions(existingSubcategories, incomingSubcategories) {
  const merged = new Map();
  [...existingSubcategories, ...incomingSubcategories].forEach((subcategory) => {
    const definition = typeof subcategory === "string" ? { name: subcategory } : subcategory;
    const key = makeCategoryId(subcategory?.id || subcategory?.name || subcategory);
    if (!key) return;
    merged.set(key, { ...(merged.get(key) || {}), ...definition, id: key });
  });
  return [...merged.values()];
}

function normalizeCategory(category, index = 0, existingIds = new Set()) {
  const rawName = String(category?.name || titleCase(category?.id || "")).trim();
  const name = rawName || `Category ${index + 1}`;
  const baseId = makeCategoryId(category?.id || name);
  let id = baseId || `category-${index + 1}`;
  let suffix = 2;
  while (existingIds.has(id)) {
    id = `${baseId}-${suffix}`;
    suffix += 1;
  }

  const color = isHexColor(category?.color) ? category.color : nextCategoryColor(index);
  const keywords = normalizeKeywords(Array.isArray(category?.keywords) && category.keywords.length ? category.keywords : name.split(/\s+/));
  return {
    id,
    name,
    color,
    soft: category?.soft || softenColor(color),
    keywords,
    subcategories: normalizeSubcategories(category?.subcategories || [])
  };
}

function normalizeSubcategories(subcategories = []) {
  const source = Array.isArray(subcategories) ? subcategories : [];
  const ids = new Set();
  return source
    .map((subcategory, index) => {
      const normalizedSubcategory = normalizeSubcategory(subcategory, index, ids);
      if (normalizedSubcategory) ids.add(normalizedSubcategory.id);
      return normalizedSubcategory;
    })
    .filter(Boolean);
}

function normalizeSubcategory(subcategory, index = 0, existingIds = new Set()) {
  const rawName =
    typeof subcategory === "string"
      ? subcategory
      : String(subcategory?.name || titleCase(subcategory?.id || "")).trim();
  const name = String(rawName || `Subcategory ${index + 1}`).trim();
  const baseId = makeCategoryId(typeof subcategory === "string" ? name : subcategory?.id || name);
  let id = baseId || `subcategory-${index + 1}`;
  let suffix = 2;
  while (existingIds.has(id)) {
    id = `${baseId}-${suffix}`;
    suffix += 1;
  }

  const keywordSource =
    typeof subcategory === "object" && Array.isArray(subcategory?.keywords) && subcategory.keywords.length
      ? subcategory.keywords
      : name.split(/\s+/);
  return {
    id,
    name,
    keywords: normalizeKeywords(keywordSource)
  };
}

function normalizeKeywords(keywords) {
  const seen = new Set();
  return keywords
    .map((keyword) => String(keyword || "").trim().toLowerCase())
    .filter((keyword) => keyword.length > 1 || keyword === "?")
    .filter((keyword) => {
      if (seen.has(keyword)) return false;
      seen.add(keyword);
      return true;
    });
}

function findCategoryForRawNote(categoryList, note) {
  const rawCategory = String(note?.category || "").trim();
  if (!rawCategory) return null;
  const candidateId = makeCategoryId(rawCategory);
  return categoryList.find(
    (category) =>
      category.id === rawCategory ||
      category.id === candidateId ||
      category.name.toLowerCase() === rawCategory.toLowerCase()
  );
}

function addRawSubcategoryToCategory(category, note) {
  if (!category) return;
  const rawSubcategory = String(note?.subcategory || note?.subcategoryName || "").trim();
  if (!rawSubcategory) return;

  const candidateId = makeCategoryId(rawSubcategory);
  const exists = (category.subcategories || []).some(
    (subcategory) =>
      subcategory.id === rawSubcategory ||
      subcategory.id === candidateId ||
      subcategory.name.toLowerCase() === rawSubcategory.toLowerCase()
  );
  if (exists) return;

  const name = String(note.subcategoryName || titleCase(rawSubcategory)).trim() || "Subcategory";
  const existingIds = new Set((category.subcategories || []).map((subcategory) => subcategory.id));
  const normalizedSubcategory = normalizeSubcategory(
    { id: candidateId, name },
    category.subcategories?.length || 0,
    existingIds
  );
  category.subcategories = [...(category.subcategories || []), normalizedSubcategory];
}

function ensureCategoryForRawNote(note) {
  const rawCategory = String(note?.category || "").trim();
  if (!rawCategory) return getFallbackCategory();

  const candidateId = makeCategoryId(rawCategory);
  const existing = categoryById[rawCategory] || categoryById[candidateId];
  if (existing) return existing;

  const name = String(note.categoryName || titleCase(rawCategory)).trim() || "Category";
  const normalizedCategory = normalizeCategory(
    { id: candidateId, name, color: nextCategoryColor(categories.length) },
    categories.length,
    new Set(categories.map((category) => category.id))
  );
  setCategories([...categories, normalizedCategory]);
  return normalizedCategory;
}

function ensureSubcategoryForRawNote(categoryId, note) {
  const rawSubcategory = String(note?.subcategory || note?.subcategoryName || "").trim();
  if (!rawSubcategory) return "";

  const category = categoryById[categoryId] || getFallbackCategory();
  const candidateId = makeCategoryId(rawSubcategory);
  const existing = (category.subcategories || []).find(
    (subcategory) =>
      subcategory.id === rawSubcategory ||
      subcategory.id === candidateId ||
      subcategory.name.toLowerCase() === rawSubcategory.toLowerCase()
  );
  if (existing) return existing.id;

  const name = String(note.subcategoryName || titleCase(rawSubcategory)).trim() || "Subcategory";
  const normalizedSubcategory = normalizeSubcategory(
    { id: candidateId, name },
    category.subcategories?.length || 0,
    new Set((category.subcategories || []).map((subcategory) => subcategory.id))
  );
  setCategories(
    categories.map((item) =>
      item.id === category.id ? { ...item, subcategories: [...(item.subcategories || []), normalizedSubcategory] } : item
    )
  );
  return normalizedSubcategory.id;
}

function getFallbackCategory() {
  return categories[0] || { id: "inbox", name: "Inbox", color: "#6f6b61", soft: "#ece8dc", keywords: [], subcategories: [] };
}

function getSubcategory(categoryId, subcategoryId) {
  if (!subcategoryId) return null;
  const category = categoryById[categoryId] || getFallbackCategory();
  return (category.subcategories || []).find((subcategory) => subcategory.id === subcategoryId) || null;
}

function getSubcategoryFilterIds(value) {
  if (!value) return null;
  const [categoryId, subcategoryId] = String(value).split(":");
  if (!categoryId || !subcategoryId) return null;
  return { categoryId, subcategoryId };
}

function getNoteSubcategory(note) {
  return getSubcategory(note.category, note.subcategory);
}

function normalizeNote(note) {
  const text = String(note.body || "");
  const title = String(note.title || "").trim() || deriveTitle(text);
  const analysis = analyzeNote(`${title}\n${note.source || ""}\n${text}`);
  const rawCategory = String(note.category || "").trim();
  const category =
    (rawCategory && categoryById[rawCategory]?.id) ||
    (rawCategory && categoryById[makeCategoryId(rawCategory)]?.id) ||
    (rawCategory && ensureCategoryForRawNote(note).id) ||
    analysis.category ||
    getFallbackCategory().id;
  const subcategory = ensureSubcategoryForRawNote(category, note);
  return {
    id: note.id || crypto.randomUUID(),
    title,
    source: String(note.source || "").trim(),
    venue: String(note.venue || "").trim(),
    year: normalizeYear(note.year),
    body: text,
    format: normalizeNoteFormat(note.format),
    category,
    subcategory,
    tags: normalizeTags(note.tags || analysis.tags),
    attachments: normalizeAttachments(note.attachments),
    pinned: Boolean(note.pinned),
    lastReviewedAt: Number(note.lastReviewedAt) || null,
    nextReviewAt: Number(note.nextReviewAt) || null,
    reviewCount: Number(note.reviewCount) || 0,
    reviewLog: Array.isArray(note.reviewLog)
      ? note.reviewLog
          .map((entry) => ({
            at: Number(entry.at) || Date.now(),
            text: String(entry.text || "").trim()
          }))
          .filter((entry) => entry.text)
      : [],
    createdAt: note.createdAt || Date.now(),
    updatedAt: note.updatedAt || Date.now()
  };
}

function serializeNotes() {
  return state.notes.map((note) => ({
    ...note,
    categoryName: categoryById[note.category]?.name || getFallbackCategory().name,
    subcategoryName: getNoteSubcategory(note)?.name || ""
  }));
}

function serializeCategories() {
  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    color: category.color,
    soft: category.soft,
    keywords: category.keywords || [],
    subcategories: (category.subcategories || []).map((subcategory) => ({
      id: subcategory.id,
      name: subcategory.name,
      keywords: subcategory.keywords || []
    }))
  }));
}

function serializeLibrary() {
  return {
    notes: serializeNotes(),
    categories: serializeCategories()
  };
}

async function persist() {
  const library = serializeLibrary();
  if (state.storage.mode === "files") {
    try {
      const result = await apiPost("/api/notes", library);
      state.storage = {
        ...state.storage,
        dataDir: result.dataDir || state.storage.dataDir,
        defaultDataDir: result.defaultDataDir || state.storage.defaultDataDir,
        canChooseDataDir:
          typeof result.canChooseDataDir === "boolean" ? result.canChooseDataDir : state.storage.canChooseDataDir,
        notesFile: result.notesFile || state.storage.notesFile,
        settingsFile: result.settingsFile || state.storage.settingsFile,
        sortedDir: result.sortedDir || state.storage.sortedDir,
        exportsDir: result.exportsDir || state.storage.exportsDir,
        attachmentsDir: result.attachmentsDir || state.storage.attachmentsDir,
        lastSync: Date.now(),
        error: ""
      };
      renderStorage();
      return;
    } catch (error) {
      state.storage.error = error.message || "File sync failed";
      localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
      renderStorage();
      showToast("File sync failed; browser backup saved");
      return;
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
  state.storage.lastSync = Date.now();
  renderStorage();
}

function analyzeNote(rawText) {
  const text = rawText.toLowerCase();
  const scores = categories.map((category) => {
    const keywords = category.keywords?.length ? category.keywords : normalizeKeywords(category.name.split(/\s+/));
    const score = keywords.reduce((total, keyword) => {
      const needle = keyword.toLowerCase();
      if (needle === "?") return total + (text.includes("?") ? 2 : 0);
      const occurrences = text.split(needle).length - 1;
      return total + occurrences * (needle.includes(" ") ? 3 : 1);
    }, 0);
    return { id: category.id, score };
  });

  const best = scores.sort((a, b) => b.score - a.score)[0];
  return {
    category: best?.score > 0 ? best.id : getFallbackCategory().id,
    tags: suggestTags(rawText)
  };
}

function suggestTags(rawText) {
  const text = rawText.toLowerCase();
  const directMatches = tagHints.filter((tag) => text.includes(tag));
  const words = rawText
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 4 && !stopWords.has(word));

  const counts = words.reduce((map, word) => {
    const normalized = word.replace(/^-+|-+$/g, "");
    if (!normalized || stopWords.has(normalized)) return map;
    map.set(normalized, (map.get(normalized) || 0) + 1);
    return map;
  }, new Map());

  const frequentWords = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([word]) => word)
    .slice(0, 5);

  const properPhrases = [...rawText.matchAll(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}\b/g)]
    .map((match) => match[0].toLowerCase())
    .filter(
      (phrase) =>
        !phrase.includes("Insight Tadpole") && !phrase.includes("Insight tadpole") && !phrase.includes("Research Assist")
    )
    .slice(0, 4);

  return normalizeTags([...directMatches, ...properPhrases, ...frequentWords]).slice(0, 8);
}

function normalizeNoteFormat(format) {
  const normalized = String(format || "markdown").trim().toLowerCase();
  return ["markdown", "html", "plain"].includes(normalized) ? normalized : "markdown";
}

function normalizeYear(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const match = raw.match(/(?:19|20)\d{2}/);
  return match ? match[0] : raw.slice(0, 16);
}

function normalizeTags(tags) {
  const list = Array.isArray(tags) ? tags : String(tags || "").split(/[,;\n]+/);
  const seen = new Set();
  return list
    .map((tag) => String(tag).trim().toLowerCase().replace(/\s+/g, " "))
    .filter((tag) => tag.length > 1)
    .filter((tag) => {
      if (seen.has(tag)) return false;
      seen.add(tag);
      return true;
    });
}

function normalizeAttachments(attachments) {
  return (Array.isArray(attachments) ? attachments : [])
    .map(normalizeAttachment)
    .filter((attachment) => attachment.name || attachment.url || attachment.filename || attachment.dataUrl);
}

function normalizeAttachment(attachment) {
  const filename = String(attachment?.filename || "").trim();
  const dataUrl = String(attachment?.dataUrl || "").trim();
  const url = String(attachment?.url || "").trim() || dataUrl || (filename ? "/attachments/" + encodeURIComponent(filename) : "");
  const name = String(attachment?.name || filename || "Image").trim() || "Image";
  return {
    id: attachment?.id || crypto.randomUUID(),
    name,
    type: String(attachment?.type || "image/*").trim(),
    size: Number(attachment?.size) || 0,
    filename,
    path: String(attachment?.path || "").trim(),
    url,
    dataUrl,
    createdAt: Number(attachment?.createdAt) || Date.now()
  };
}

function attachmentSource(attachment) {
  return attachment?.url || attachment?.dataUrl || (attachment?.filename ? "/attachments/" + encodeURIComponent(attachment.filename) : "");
}

function attachmentMarkdownTarget(attachment) {
  return attachment?.path || attachmentSource(attachment) || attachment?.name || "";
}

function attachmentMarkdownLabel(attachment) {
  return String(attachment?.name || "Image").replace(/[\[\]\r\n]+/g, " ").trim() || "Image";
}

function attachmentDeleteKey(attachment) {
  const normalized = normalizeAttachment(attachment);
  return normalized.filename || normalized.path || normalized.url || normalized.dataUrl || normalized.name || normalized.id;
}

function sameAttachment(left, right) {
  const a = normalizeAttachment(left);
  const b = normalizeAttachment(right);
  if (a.filename && b.filename) return a.filename === b.filename;
  if (a.path && b.path) return a.path === b.path;
  if (a.url && b.url) return a.url === b.url;
  if (a.dataUrl && b.dataUrl) return a.dataUrl === b.dataUrl;
  return Boolean(a.id && b.id && a.id === b.id);
}

function isOriginalDraftAttachment(attachment) {
  return state.originalDraftAttachmentKeys.has(attachmentDeleteKey(attachment));
}

function queueAttachmentDelete(attachment) {
  const normalized = normalizeAttachment(attachment);
  if (!normalized.filename) return;
  if (state.pendingAttachmentDeletes.some((item) => sameAttachment(item, normalized))) return;
  state.pendingAttachmentDeletes = [...state.pendingAttachmentDeletes, normalized];
}

function isAttachmentStillReferenced(attachment, options = {}) {
  const includeDraft = options.includeDraft !== false;
  const normalized = normalizeAttachment(attachment);
  const referencedByNotes = state.notes.some((note) =>
    normalizeAttachments(note.attachments).some((item) => sameAttachment(item, normalized))
  );
  const referencedByDraft = includeDraft && state.draftAttachments.some((item) => sameAttachment(item, normalized));
  return referencedByNotes || referencedByDraft;
}

async function deleteAttachmentFileIfUnused(attachment, options = {}) {
  const normalized = normalizeAttachment(attachment);
  if (state.storage.mode !== "files" || !normalized.filename || isAttachmentStillReferenced(normalized, options)) {
    return false;
  }

  try {
    const result = await apiPost("/api/attachments/delete", { filename: normalized.filename });
    state.storage.attachmentsDir = result.attachmentsDir || state.storage.attachmentsDir;
    return Boolean(result.deleted);
  } catch {
    showToast("Could not delete image file");
    return false;
  }
}

async function deleteAttachmentsIfUnused(attachments, options = {}) {
  const unique = [];
  for (const attachment of normalizeAttachments(attachments)) {
    if (!unique.some((item) => sameAttachment(item, attachment))) unique.push(attachment);
  }

  let deleted = 0;
  for (const attachment of unique) {
    if (await deleteAttachmentFileIfUnused(attachment, options)) deleted += 1;
  }
  return deleted;
}

async function deleteQueuedAttachments() {
  const queued = state.pendingAttachmentDeletes;
  state.pendingAttachmentDeletes = [];
  return deleteAttachmentsIfUnused(queued, { includeDraft: false });
}

function attachmentReferencedOutsideNote(noteId, attachment) {
  const normalized = normalizeAttachment(attachment);
  return state.notes.some((note) =>
    note.id !== noteId && normalizeAttachments(note.attachments).some((item) => sameAttachment(item, normalized))
  );
}

async function renameAttachmentsForNote(note) {
  if (state.storage.mode !== "files" || !note?.attachments?.length) return 0;
  let renamed = 0;
  const nextAttachments = [];
  const contextTitle = note.title || note.source || "note";

  for (const [index, attachment] of normalizeAttachments(note.attachments).entries()) {
    if (!attachment.filename || attachmentReferencedOutsideNote(note.id, attachment)) {
      nextAttachments.push(attachment);
      continue;
    }

    try {
      const result = await apiPost("/api/attachments/rename", {
        filename: attachment.filename,
        title: contextTitle,
        index: index + 1,
        name: attachment.name,
        type: attachment.type
      });
      if (result.renamed && result.attachment) {
        nextAttachments.push(normalizeAttachment({ ...attachment, ...result.attachment }));
        renamed += 1;
      } else {
        nextAttachments.push(attachment);
      }
      state.storage.attachmentsDir = result.attachmentsDir || state.storage.attachmentsDir;
    } catch {
      nextAttachments.push(attachment);
    }
  }

  note.attachments = nextAttachments;
  state.draftAttachments = nextAttachments.map(normalizeAttachment);
  return renamed;
}

function attachmentRenameMessage(count) {
  return count ? " " + count + " image " + (count === 1 ? "file" : "files") + " renamed." : "";
}

function attachmentDeletionMessage(count) {
  return count ? " " + count + " image " + (count === 1 ? "file" : "files") + " removed." : "";
}

function renderAttachmentGrid(attachments, className = "") {
  const items = normalizeAttachments(attachments).filter((attachment) => attachmentSource(attachment));
  if (!items.length) return "";
  const modifier = className ? " " + className : "";
  return "<div class=\"attachment-grid" + modifier + "\">" +
    items
      .map((attachment) => {
        const src = attachmentSource(attachment);
        const name = attachment.name;
        return "<figure class=\"attachment-thumb\">" +
          "<button class=\"attachment-preview-button\" type=\"button\" data-image-preview=\"" + escapeHtml(src) + "\" data-image-caption=\"" + escapeHtml(name) + "\">" +
            "<img src=\"" + escapeHtml(src) + "\" alt=\"" + escapeHtml(name) + "\" loading=\"lazy\" />" +
          "</button>" +
          "<figcaption>" + escapeHtml(name) + "</figcaption>" +
        "</figure>";
      })
      .join("") +
    "</div>";
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result || "")));
    reader.addEventListener("error", () => reject(reader.error || new Error("Could not read file")));
    reader.readAsDataURL(file);
  });
}

async function imageFileToAttachment(file) {
  const type = inferImageMime(file.name, file.type);
  if (!type) {
    throw new Error("Only image files can be attached");
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error("Images must be 20 MB or smaller");
  }

  let dataUrl = await readFileAsDataUrl(file);
  if (!dataUrl.startsWith("data:image/")) {
    const commaIndex = dataUrl.indexOf(",");
    const payload = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
    dataUrl = "data:" + type + ";base64," + payload;
  }

  if (state.storage.mode === "files") {
    const result = await apiPost("/api/attachments", {
      name: file.name,
      type,
      size: file.size,
      dataUrl
    });
    state.storage.attachmentsDir = result.attachmentsDir || state.storage.attachmentsDir;
    return normalizeAttachment(result.attachment);
  }

  return normalizeAttachment({
    name: file.name,
    type,
    size: file.size,
    url: dataUrl,
    dataUrl,
    createdAt: Date.now()
  });
}

const imageFileExtensions = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".heic", ".heif", ".bmp", ".tif", ".tiff"]);

function imageExtensionFromName(name) {
  const match = String(name || "").toLowerCase().match(/\.[a-z0-9]+$/);
  return match ? match[0] : "";
}

function inferImageMime(name, type = "") {
  const normalized = String(type || "").toLowerCase();
  if (normalized.startsWith("image/")) return normalized;
  return {
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
  }[imageExtensionFromName(name)] || "";
}

function isImageFile(file) {
  return Boolean(file && inferImageMime(file.name, file.type));
}

function imageFilesFromFileList(fileList) {
  return [...(fileList || [])].filter(isImageFile);
}

function dataTransferHasFileDrop(dataTransfer) {
  return Boolean(
    dataTransfer && (
      [...(dataTransfer.types || [])].includes("Files") ||
      [...(dataTransfer.items || [])].some((item) => item.kind === "file") ||
      dataTransfer.files?.length
    )
  );
}

function imageFilesFromDataTransfer(dataTransfer) {
  const itemFiles = [...(dataTransfer?.items || [])]
    .filter((item) => item.kind === "file")
    .map((item) => item.getAsFile())
    .filter(isImageFile);
  return itemFiles.length ? itemFiles : imageFilesFromFileList(dataTransfer?.files);
}

function clipboardImageName(type) {
  const extension = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
    "image/bmp": "bmp",
    "image/tiff": "tiff"
  }[String(type || "").toLowerCase()] || "png";
  return "clipboard-image-" + Date.now() + "." + extension;
}

async function clipboardItemToFile(item) {
  const type = item.types.find((candidate) => candidate.startsWith("image/"));
  if (!type) return null;
  const blob = await item.getType(type);
  return new File([blob], clipboardImageName(blob.type || type), { type: blob.type || type });
}

async function pasteImagesFromNavigatorClipboard() {
  if (!navigator.clipboard?.read) return 0;
  const items = await navigator.clipboard.read();
  const files = [];
  for (const item of items) {
    const file = await clipboardItemToFile(item);
    if (file) files.push(file);
  }
  return addImageFilesToDraft(files);
}

async function addImageFilesToDraft(files) {
  const imageFiles = imageFilesFromFileList(files);
  if (!imageFiles.length) return 0;

  let added = 0;
  for (const file of imageFiles) {
    try {
      const attachment = await imageFileToAttachment(file);
      state.draftAttachments = [...state.draftAttachments, attachment];
      added += 1;
    } catch (error) {
      showToast(error.message || "Could not add " + file.name);
    }
  }

  renderDraftAttachments();
  if (added) showToast(added + " " + (added === 1 ? "image" : "images") + " added");
  return added;
}

async function addImagesToDraft(event) {
  const files = imageFilesFromFileList(event.target.files);
  event.target.value = "";
  await addImageFilesToDraft(files);
}

async function handleDraftPaste(event) {
  const files = imageFilesFromDataTransfer(event.clipboardData);
  if (!files.length) return;
  event.preventDefault();
  await addImageFilesToDraft(files);
}

function setAttachmentDropActive(active) {
  elements.attachmentPanel?.classList.toggle("drag-over", Boolean(active));
}

function handleDraftDragOver(event) {
  if (!dataTransferHasFileDrop(event.dataTransfer)) return;
  event.preventDefault();
  event.stopPropagation();
  event.dataTransfer.dropEffect = "copy";
  setAttachmentDropActive(true);
}

async function handleDraftDrop(event) {
  if (!dataTransferHasFileDrop(event.dataTransfer)) return;
  event.preventDefault();
  event.stopPropagation();
  setAttachmentDropActive(false);
  const files = imageFilesFromDataTransfer(event.dataTransfer);
  if (!files.length) {
    showToast("Drop image files only");
    return;
  }
  await addImageFilesToDraft(files);
}

async function removeDraftAttachment(id) {
  const removed = state.draftAttachments.find((attachment) => attachment.id === id);
  state.draftAttachments = state.draftAttachments.filter((attachment) => attachment.id !== id);

  if (removed) {
    if (state.editingId && isOriginalDraftAttachment(removed)) {
      queueAttachmentDelete(removed);
    } else {
      await deleteAttachmentFileIfUnused(removed);
    }
  }

  renderDraftAttachments();
  showToast("Image removed");
}

function renderDraftAttachments() {
  if (!elements.attachmentPreview) return;
  elements.attachmentPreview.innerHTML = "";
  const attachments = normalizeAttachments(state.draftAttachments);
  state.draftAttachments = attachments;

  if (!attachments.length) {
    const empty = document.createElement("div");
    empty.className = "attachment-empty";
    empty.textContent = "Drop images here or paste from clipboard";
    elements.attachmentPreview.append(empty);
    return;
  }

  attachments.forEach((attachment) => {
    const card = document.createElement("figure");
    card.className = "draft-attachment-card";

    const previewButton = document.createElement("button");
    previewButton.type = "button";
    previewButton.className = "attachment-preview-button";
    previewButton.dataset.imagePreview = attachmentSource(attachment);
    previewButton.dataset.imageCaption = attachment.name;

    const image = document.createElement("img");
    image.src = attachmentSource(attachment);
    image.alt = attachment.name;
    image.loading = "lazy";
    previewButton.append(image);

    const caption = document.createElement("figcaption");
    caption.textContent = attachment.name;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "attachment-remove";
    removeButton.setAttribute("aria-label", "Remove " + attachment.name);
    removeButton.title = "Remove image";
    removeButton.textContent = "×";
    removeButton.addEventListener("click", () => removeDraftAttachment(attachment.id));

    card.append(previewButton, caption, removeButton);
    elements.attachmentPreview.append(card);
  });
}

function makeCategoryId(value) {
  const id = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return id || `category-${Date.now()}`;
}

function isHexColor(value) {
  return /^#[0-9a-f]{6}$/i.test(String(value || ""));
}

function nextCategoryColor(index = categories.length) {
  return CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];
}

function softenColor(color) {
  if (!isHexColor(color)) return "#ece8dc";
  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, 0.16)`;
}

function titleCase(value) {
  return String(value || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function deriveTitle(text) {
  const cleaned = String(text || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return "Untitled research note";
  return cleaned.length > 68 ? `${cleaned.slice(0, 65)}...` : cleaned;
}

function currentDraftText() {
  return `${elements.titleInput.value}\n${elements.sourceInput.value}\n${elements.venueInput?.value || ""}\n${elements.yearInput?.value || ""}\n${elements.bodyInput.value}`;
}

function updateLiveAnalysis() {
  const analysis = analyzeNote(currentDraftText());
  const category = categoryById[analysis.category] || getFallbackCategory();
  const previousCategory = elements.categorySelect.value;
  if (!state.draftCategoryTouched) {
    elements.categorySelect.value = category.id;
  }
  if (elements.categorySelect.value !== previousCategory || !getSubcategory(elements.categorySelect.value, elements.subcategorySelect.value)) {
    renderSubcategorySelect();
  }

  applyCategoryPill(elements.suggestedCategoryButton, category);
  elements.suggestedCategoryButton.onclick = () => {
    elements.categorySelect.value = category.id;
    state.draftCategoryTouched = true;
    renderSubcategorySelect();
    showToast(`Category set to ${category.name}`);
  };

  const existing = new Set(currentDraftTags({ includePending: false }));
  elements.suggestedTags.innerHTML = "";
  const suggested = analysis.tags.length ? analysis.tags : ["idea", "paper", "follow up"];

  suggested.forEach((tag) => {
    const isApplied = existing.has(tag);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `suggested-tag${isApplied ? " applied" : ""}`;
    button.setAttribute("aria-pressed", String(isApplied));
    button.title = isApplied ? `Remove ${tag}` : `Add ${tag}`;
    button.textContent = tag;
    button.addEventListener("click", () => toggleTagInDraft(tag));
    elements.suggestedTags.append(button);
  });
  renderDraftTagChips();
  renderDraftFormatPreview();
}

function currentDraftTags(options = {}) {
  const includePending = options.includePending !== false;
  return normalizeTags([
    ...state.draftTags,
    ...(includePending ? normalizeTags(elements.tagInput.value) : [])
  ]);
}

function setDraftTags(tags) {
  state.draftTags = normalizeTags(tags);
  renderDraftTagChips();
}

function commitTagInput() {
  const pending = normalizeTags(elements.tagInput.value);
  if (!pending.length) {
    elements.tagInput.value = "";
    renderDraftTagChips();
    updateLiveAnalysis();
    return;
  }
  state.draftTags = normalizeTags([...state.draftTags, ...pending]);
  elements.tagInput.value = "";
  renderDraftTagChips();
  updateLiveAnalysis();
}

function removeTagFromDraft(tag) {
  state.draftTags = state.draftTags.filter((item) => item !== tag);
  renderDraftTagChips();
  updateLiveAnalysis();
}

function toggleTagInDraft(tag) {
  setDraftTags(state.draftTags.includes(tag)
    ? state.draftTags.filter((item) => item !== tag)
    : [...state.draftTags, tag]);
  updateLiveAnalysis();
}

function renderDraftTagChips() {
  if (!elements.draftTagChips) return;
  elements.draftTagChips.innerHTML = "";
  state.draftTags.forEach((tag) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "draft-tag-chip";
    button.title = "Remove " + tag;
    button.textContent = tag + " ×";
    button.addEventListener("click", () => removeTagFromDraft(tag));
    elements.draftTagChips.append(button);
  });
}

function renderDraftFormatPreview() {
  if (!elements.formatPreview) return;
  const format = normalizeNoteFormat(elements.formatSelect.value);
  elements.formatPreviewMode.textContent = format === "html" ? "HTML" : format === "plain" ? "Plain Text" : "Markdown";
  const body = elements.bodyInput.value.trim();
  if (!body) {
    elements.formatPreview.innerHTML = '<p class="preview-empty">Preview appears here while you write.</p>';
    return;
  }
  elements.formatPreview.innerHTML = renderNoteContent({ body, format, reviewLog: [] });
}

function render() {
  renderPage();
  renderCategorySelect();
  renderSubcategorySelect();
  renderSidebar();
  renderActiveFilters();
  renderNotes();
  renderOrganization();
  renderReview();
  renderStorage();
  renderDraftAttachments();
  updateLiveAnalysis();
  elements.libraryCount.textContent = `${state.notes.length} ${state.notes.length === 1 ? "note" : "notes"}`;
}

function renderPage() {
  document.querySelectorAll("[data-page-button]").forEach((button) => {
    const active = button.dataset.pageButton === state.activePage;
    button.classList.toggle("active", active);
    button.setAttribute("aria-current", active ? "page" : "false");
  });

  document.querySelectorAll("[data-page-panel]").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.pagePanel === state.activePage);
  });
}

function setPage(page) {
  state.activePage = page;
  renderPage();
  const activePanel = document.querySelector(`[data-page-panel="${page}"]`);
  activePanel?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderCategorySelect() {
  const currentCategory = elements.categorySelect.value || getFallbackCategory().id;
  elements.categorySelect.innerHTML = "";
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    elements.categorySelect.append(option);
  });
  elements.categorySelect.value = categoryById[currentCategory] ? currentCategory : getFallbackCategory().id;
}

function renderSubcategorySelect() {
  const category = categoryById[elements.categorySelect.value] || getFallbackCategory();
  const currentSubcategory = elements.subcategorySelect.value;
  const subcategories = category.subcategories || [];

  elements.subcategorySelect.innerHTML = "";
  const noneOption = document.createElement("option");
  noneOption.value = "";
  noneOption.textContent = subcategories.length ? "None" : "No subcategories";
  elements.subcategorySelect.append(noneOption);

  subcategories.forEach((subcategory) => {
    const option = document.createElement("option");
    option.value = subcategory.id;
    option.textContent = subcategory.name;
    elements.subcategorySelect.append(option);
  });

  elements.subcategorySelect.value = subcategories.some((subcategory) => subcategory.id === currentSubcategory)
    ? currentSubcategory
    : "";
  elements.subcategorySelect.disabled = !subcategories.length;
}

function renderSidebar() {
  const categoryCounts = countCategories();
  elements.categoryNav.innerHTML = "";
  const allButton = makeCategoryRow(
    { id: "all", name: "All Notes", color: "#25231f" },
    state.notes.length,
    state.filters.category === "all"
  );
  allButton.addEventListener("click", () => setCategoryFilter("all"));
  elements.categoryNav.append(allButton);

  categories.forEach((category) => {
    const row = makeCategoryRow(category, categoryCounts.get(category.id) || 0, state.filters.category === category.id);
    row.addEventListener("click", () => setCategoryFilter(category.id));
    elements.categoryNav.append(row);

    const subcategoryCounts = countSubcategories(category.id);
    (category.subcategories || []).forEach((subcategory) => {
      const filterValue = `${category.id}:${subcategory.id}`;
      const subcategoryRow = makeSubcategoryRow(
        subcategory,
        subcategoryCounts.get(subcategory.id) || 0,
        state.filters.subcategory === filterValue
      );
      subcategoryRow.addEventListener("click", () => setSubcategoryFilter(category.id, subcategory.id));
      elements.categoryNav.append(subcategoryRow);
    });
  });
}

function renderOrganization() {
  const categoryCounts = countCategories();
  elements.organizationGrid.innerHTML = "";
  elements.categoryColorInput.value = isHexColor(elements.categoryColorInput.value)
    ? elements.categoryColorInput.value
    : nextCategoryColor();

  categories.forEach((category) => {
    const count = categoryCounts.get(category.id) || 0;
    const card = document.createElement("div");
    card.className = "category-edit-card";
    card.style.borderLeftColor = category.color;

    const nameField = document.createElement("label");
    nameField.className = "field";
    const nameLabel = document.createElement("span");
    nameLabel.textContent = "Name";
    const nameInput = document.createElement("input");
    nameInput.value = category.name;
    nameInput.setAttribute("aria-label", `${category.name} category name`);
    nameField.append(nameLabel, nameInput);

    const colorField = document.createElement("label");
    colorField.className = "field";
    const colorLabel = document.createElement("span");
    colorLabel.textContent = "Color";
    const colorInput = document.createElement("input");
    colorInput.className = "category-color-input";
    colorInput.type = "color";
    colorInput.value = category.color;
    colorInput.setAttribute("aria-label", `${category.name} category color`);
    colorField.append(colorLabel, colorInput);

    const countButton = document.createElement("button");
    countButton.type = "button";
    countButton.className = "secondary-button category-edit-count";
    countButton.textContent = `${count} ${count === 1 ? "note" : "notes"}`;
    countButton.addEventListener("click", () => setCategoryFilter(category.id));

    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className = "secondary-button";
    saveButton.textContent = "Save";
    saveButton.addEventListener("click", () => updateCategory(category.id, nameInput.value, colorInput.value));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "danger-button";
    deleteButton.textContent = "Delete";
    deleteButton.disabled = categories.length <= 1;
    deleteButton.addEventListener("click", () => deleteCategory(category.id));

    nameInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") updateCategory(category.id, nameInput.value, colorInput.value);
    });

    const mainRow = document.createElement("div");
    mainRow.className = "category-edit-main";
    mainRow.append(nameField, colorField, countButton, saveButton, deleteButton);

    card.append(mainRow, makeSubcategoryEditor(category));
    elements.organizationGrid.append(card);
  });

  const tagCounts = countTags();
  elements.tagCloud.innerHTML = "";
  if (!tagCounts.size) {
    const empty = document.createElement("span");
    empty.className = "tag-chip empty";
    empty.textContent = "No tags yet";
    elements.tagCloud.append(empty);
    return;
  }

  [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .forEach(([tag, count]) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = `tag-chip${state.filters.tag === tag ? " active" : ""}`;
      chip.textContent = `${tag} ${count}`;
      chip.addEventListener("click", () => {
        state.filters.tag = state.filters.tag === tag ? null : tag;
        state.activePage = "library";
        render();
      });
      elements.tagCloud.append(chip);
    });
}

function makeSubcategoryEditor(category) {
  const subcategoryCounts = countSubcategories(category.id);
  const panel = document.createElement("div");
  panel.className = "subcategory-manager";

  const header = document.createElement("div");
  header.className = "subcategory-manager-header";
  const label = document.createElement("span");
  label.className = "section-label";
  label.textContent = "Subcategories";
  const countLabel = document.createElement("small");
  countLabel.textContent = `${category.subcategories?.length || 0}`;
  header.append(label, countLabel);

  const list = document.createElement("div");
  list.className = "subcategory-list";
  if (!category.subcategories?.length) {
    const empty = document.createElement("span");
    empty.className = "tag-chip empty";
    empty.textContent = "No subcategories yet";
    list.append(empty);
  } else {
    category.subcategories.forEach((subcategory) => {
      const row = document.createElement("div");
      row.className = "subcategory-edit-row";

      const input = document.createElement("input");
      input.value = subcategory.name;
      input.setAttribute("aria-label", `${subcategory.name} subcategory name`);

      const countButton = document.createElement("button");
      countButton.type = "button";
      countButton.className = "secondary-button category-edit-count";
      const count = subcategoryCounts.get(subcategory.id) || 0;
      countButton.textContent = `${count} ${count === 1 ? "note" : "notes"}`;
      countButton.addEventListener("click", () => setSubcategoryFilter(category.id, subcategory.id));

      const saveButton = document.createElement("button");
      saveButton.type = "button";
      saveButton.className = "secondary-button";
      saveButton.textContent = "Save";
      saveButton.addEventListener("click", () => updateSubcategory(category.id, subcategory.id, input.value));

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "danger-button";
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", () => deleteSubcategory(category.id, subcategory.id));

      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") updateSubcategory(category.id, subcategory.id, input.value);
      });

      row.append(input, countButton, saveButton, deleteButton);
      list.append(row);
    });
  }

  const addRow = document.createElement("div");
  addRow.className = "subcategory-add-row";
  const newInput = document.createElement("input");
  newInput.placeholder = "New subcategory";
  newInput.setAttribute("aria-label", `New subcategory for ${category.name}`);
  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "secondary-button";
  addButton.textContent = "Add";
  addButton.addEventListener("click", () => addSubcategory(category.id, newInput.value));
  newInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") addSubcategory(category.id, newInput.value);
  });
  addRow.append(newInput, addButton);

  panel.append(header, list, addRow);
  return panel;
}

function renderReview() {
  if (!elements.reviewQueue) return;

  renderReviewScopeSelect();

  const now = Date.now();
  const statsNotes = getReviewStatsNotes();
  const dueNotes = statsNotes.filter((note) => !note.nextReviewAt || note.nextReviewAt <= now);
  const reviewedNotes = statsNotes.filter((note) => note.lastReviewedAt);
  const upcomingNotes = statsNotes.filter((note) => note.nextReviewAt && note.nextReviewAt > now);
  elements.reviewDueCount.textContent = dueNotes.length;
  elements.reviewReviewedCount.textContent = reviewedNotes.length;
  elements.reviewUpcomingCount.textContent = upcomingNotes.length;
  elements.reviewScopeSelect.value = state.reviewScope;

  const queue = getReviewQueue();
  if (!state.reviewSelectedId || !queue.some((note) => note.id === state.reviewSelectedId)) {
    state.reviewSelectedId = queue[0]?.id || null;
  }

  elements.reviewQueue.innerHTML = "";
  if (!queue.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state compact-empty";
    empty.innerHTML = `
      <img src="assets/app-mark.svg" alt="" />
      <h2>No notes in queue</h2>
    `;
    elements.reviewQueue.append(empty);
  } else {
    queue.forEach((note) => {
      const category = categoryById[note.category] || getFallbackCategory();
      const subcategory = getNoteSubcategory(note);
      const visibleTags = note.tags.slice(0, 4);
      const tagMarkup = visibleTags.length
        ? visibleTags.map((tag) => `<span class="mini-tag">${escapeHtml(tag)}</span>`).join("")
        : '<span class="mini-tag muted-tag">untagged</span>';
      const hiddenTagCount = note.tags.length > visibleTags.length ? `<span class="mini-tag muted-tag">+${note.tags.length - visibleTags.length}</span>` : "";
      const subcategoryMarkup = subcategory ? `<span class="queue-subcategory">${escapeHtml(subcategory.name)}</span>` : "";
      const button = document.createElement("button");
      button.type = "button";
      button.className = `review-queue-card${state.reviewSelectedId === note.id ? " selected" : ""}`;
      button.style.borderLeftColor = category.color;
      button.innerHTML = `
        <strong>${escapeHtml(note.title)}</strong>
        <div class="review-queue-index">
          <span class="queue-category" style="background:${category.soft};border-color:${category.color};">${escapeHtml(category.name)}</span>
          ${subcategoryMarkup}
          <span class="queue-schedule">${reviewScheduleLabel(note)}</span>
        </div>
        <div class="review-queue-tags">${tagMarkup}${hiddenTagCount}</div>
        <small>${escapeHtml(excerpt(note.body, 92))}</small>
      `;
      button.addEventListener("click", () => selectReviewNote(note.id));
      elements.reviewQueue.append(button);
    });
  }

  renderCurrentReviewNote();
}

function renderReviewScopeSelect() {
  const options = getReviewScopeOptions();
  const optionValues = new Set(options.flatMap((group) => group.items.map((item) => item.value)));
  if (!optionValues.has(state.reviewScope)) state.reviewScope = "due";

  elements.reviewScopeSelect.innerHTML = "";
  options.forEach((group) => {
    const optgroup = document.createElement("optgroup");
    optgroup.label = group.label;
    group.items.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.value;
      option.textContent = typeof item.count === "number" ? `${item.label} (${item.count})` : item.label;
      optgroup.append(option);
    });
    elements.reviewScopeSelect.append(optgroup);
  });
}

function getReviewScopeOptions() {
  const categoryCounts = countCategories();
  const categoryOptions = categories
    .map((category) => ({
      value: `category:${category.id}`,
      label: `Category: ${category.name}`,
      count: categoryCounts.get(category.id) || 0
    }))
    .filter((item) => item.count > 0);

  const subcategoryOptions = categories
    .flatMap((category) => {
      const subcategoryCounts = countSubcategories(category.id);
      return (category.subcategories || []).map((subcategory) => ({
        value: `subcategory:${category.id}:${subcategory.id}`,
        label: `Subcategory: ${category.name} / ${subcategory.name}`,
        count: subcategoryCounts.get(subcategory.id) || 0
      }));
    })
    .filter((item) => item.count > 0);

  const tagOptions = [...countTags().entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag, count]) => ({
      value: `tag:${tag}`,
      label: `Tag: ${tag}`,
      count
    }));

  return [
    { label: "Queues", items: reviewBaseScopes },
    ...(categoryOptions.length ? [{ label: "Categories", items: categoryOptions }] : []),
    ...(subcategoryOptions.length ? [{ label: "Subcategories", items: subcategoryOptions }] : []),
    ...(tagOptions.length ? [{ label: "Tags", items: tagOptions }] : [])
  ];
}

function getReviewQueue() {
  const now = Date.now();
  return state.notes
    .filter((note) => {
      if (state.reviewScope.startsWith("category:")) {
        return note.category === state.reviewScope.slice("category:".length);
      }
      if (state.reviewScope.startsWith("subcategory:")) {
        const [, categoryId, subcategoryId] = state.reviewScope.split(":");
        return note.category === categoryId && note.subcategory === subcategoryId;
      }
      if (state.reviewScope.startsWith("tag:")) {
        return note.tags.includes(state.reviewScope.slice("tag:".length));
      }
      if (state.reviewScope === "all") return true;
      if (state.reviewScope === "pinned") return note.pinned;
      if (state.reviewScope === "unreviewed") return !note.lastReviewedAt;
      return !note.nextReviewAt || note.nextReviewAt <= now;
    })
    .sort((a, b) => {
      const aDue = !a.nextReviewAt || a.nextReviewAt <= now;
      const bDue = !b.nextReviewAt || b.nextReviewAt <= now;
      return (
        Number(bDue) - Number(aDue) ||
        Number(b.pinned) - Number(a.pinned) ||
        (a.nextReviewAt || a.lastReviewedAt || a.updatedAt || 0) - (b.nextReviewAt || b.lastReviewedAt || b.updatedAt || 0)
      );
    });
}

function getReviewStatsNotes() {
  if (state.reviewScope.startsWith("category:")) {
    const category = state.reviewScope.slice("category:".length);
    return state.notes.filter((note) => note.category === category);
  }
  if (state.reviewScope.startsWith("subcategory:")) {
    const [, categoryId, subcategoryId] = state.reviewScope.split(":");
    return state.notes.filter((note) => note.category === categoryId && note.subcategory === subcategoryId);
  }
  if (state.reviewScope.startsWith("tag:")) {
    const tag = state.reviewScope.slice("tag:".length);
    return state.notes.filter((note) => note.tags.includes(tag));
  }
  return state.notes;
}

function renderCurrentReviewNote() {
  const note = state.notes.find((item) => item.id === state.reviewSelectedId);
  elements.reviewCurrentEmpty.hidden = Boolean(note);
  elements.reviewCurrent.hidden = !note;
  if (!note) return;

  const category = categoryById[note.category] || getFallbackCategory();
  const subcategory = getNoteSubcategory(note);
  applyCategoryPill(elements.reviewCurrentCategory, category);
  if (subcategory) {
    elements.reviewCurrentCategory.textContent = `${category.name} / ${subcategory.name}`;
  }
  elements.reviewCurrentTitle.textContent = note.title;
  elements.reviewCurrentMeta.textContent = [
    noteSourceLabel(note),
    `Updated ${formatDate(note.updatedAt)}`,
    reviewScheduleLabel(note)
  ].join(" · ");
  elements.reviewCurrentBody.innerHTML = `<div class="rich-note-body">${renderNoteContent(note, { includeReviewLog: true })}</div>${renderAttachmentGrid(note.attachments, "review-attachments")}`;
  elements.reviewReflectionInput.value = "";
  elements.reviewCurrentTags.innerHTML = "";
  note.tags.forEach((tag) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tag-chip";
    button.textContent = tag;
    button.addEventListener("click", () => {
      state.filters.tag = tag;
      state.activePage = "library";
      render();
    });
    elements.reviewCurrentTags.append(button);
  });
}

function selectReviewNote(id) {
  state.reviewSelectedId = id;
  state.selectedId = id;
  render();
}

function selectNextReviewNote() {
  const queue = getReviewQueue();
  if (!queue.length) return;
  const index = queue.findIndex((note) => note.id === state.reviewSelectedId);
  const next = queue[index + 1] || queue[0];
  selectReviewNote(next.id);
}

async function markSelectedReviewed() {
  const note = state.notes.find((item) => item.id === state.reviewSelectedId);
  if (!note) return;
  const reflection = elements.reviewReflectionInput.value.trim();
  const now = Date.now();
  note.lastReviewedAt = now;
  note.nextReviewAt = now + 1000 * 60 * 60 * 24 * 14;
  note.reviewCount = (note.reviewCount || 0) + 1;
  if (reflection) {
    note.reviewLog = [...(note.reviewLog || []), { at: now, text: reflection }];
  }
  await persist();
  showToast("Note marked reviewed");
  selectNextReviewNote();
}

async function reviewSelectedLater() {
  const note = state.notes.find((item) => item.id === state.reviewSelectedId);
  if (!note) return;
  note.nextReviewAt = Date.now() + 1000 * 60 * 60 * 24 * 7;
  await persist();
  showToast("Review moved later");
  selectNextReviewNote();
}

function openReviewNoteInSearch() {
  if (!state.reviewSelectedId) return;
  state.selectedId = state.reviewSelectedId;
  state.activePage = "library";
  render();
}

function reviewScheduleLabel(note) {
  if (note.nextReviewAt && note.nextReviewAt > Date.now()) {
    return `Next ${formatDate(note.nextReviewAt)}`;
  }
  if (note.lastReviewedAt) {
    return `Reviewed ${formatDate(note.lastReviewedAt)}`;
  }
  return "Unreviewed";
}

function renderStorage() {
  if (!elements.storageStatus) return;

  const isFileStorage = state.storage.mode === "files";
  const modeText = isFileStorage
    ? "Notes are being saved on this Mac as JSON and sorted Markdown folders."
    : "This page is open in browser file mode, so notes are saved only in browser localStorage.";
  const syncText = state.storage.lastSync ? ` Last sync: ${formatDate(state.storage.lastSync)}.` : "";
  const errorText = state.storage.error ? ` ${state.storage.error}` : "";

  elements.storageStatus.className = `storage-status ${isFileStorage ? "ready" : "warning"}`;
  elements.storageStatus.textContent = `${modeText}${syncText}${errorText}`;
  elements.dataFolderPath.textContent = state.storage.dataDir || "Unavailable in file mode";
  elements.notesFilePath.textContent = state.storage.notesFile || "Unavailable in file mode";
  elements.sortedFolderPath.textContent = state.storage.sortedDir || "Unavailable in file mode";
  elements.exportsFolderPath.textContent = state.storage.exportsDir || "Unavailable in file mode";
  elements.openStorageButton.disabled = !isFileStorage;
  elements.chooseStorageButton.disabled = !isFileStorage || !state.storage.canChooseDataDir;
  elements.defaultStorageButton.disabled =
    !isFileStorage || !state.storage.canChooseDataDir || state.storage.dataDir === state.storage.defaultDataDir;
}

function countCategories() {
  return state.notes.reduce((map, note) => {
    map.set(note.category, (map.get(note.category) || 0) + 1);
    return map;
  }, new Map());
}

function countSubcategories(categoryId) {
  return state.notes.reduce((map, note) => {
    if (note.category === categoryId && note.subcategory) {
      map.set(note.subcategory, (map.get(note.subcategory) || 0) + 1);
    }
    return map;
  }, new Map());
}

function countTags() {
  const tagCounts = new Map();
  state.notes.forEach((note) => {
    note.tags.forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1));
  });
  return tagCounts;
}

function makeCategoryRow(category, count, active) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `category-row${active ? " active" : ""}`;

  const dot = document.createElement("span");
  dot.className = "category-dot";
  dot.style.background = category.color;
  dot.setAttribute("aria-hidden", "true");

  const name = document.createElement("span");
  name.textContent = category.name;

  const badge = document.createElement("span");
  badge.className = "category-count";
  badge.textContent = count;

  button.append(dot, name, badge);
  return button;
}

function makeSubcategoryRow(subcategory, count, active) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `subcategory-row${active ? " active" : ""}`;

  const name = document.createElement("span");
  name.textContent = subcategory.name;

  const badge = document.createElement("span");
  badge.className = "category-count";
  badge.textContent = count;

  button.append(name, badge);
  return button;
}

function setCategoryFilter(category) {
  state.filters.category = category;
  state.filters.subcategory = null;
  state.activePage = "library";
  render();
}

function setSubcategoryFilter(categoryId, subcategoryId) {
  state.filters.category = categoryId;
  state.filters.subcategory = `${categoryId}:${subcategoryId}`;
  state.activePage = "library";
  render();
}

async function addCategory() {
  const name = elements.categoryNameInput.value.trim();
  const color = elements.categoryColorInput.value;
  if (!name) {
    showToast("Name the category first");
    elements.categoryNameInput.focus();
    return;
  }

  if (categories.some((category) => category.name.toLowerCase() === name.toLowerCase())) {
    showToast("That category already exists");
    return;
  }

  const category = normalizeCategory(
    { id: makeCategoryId(name), name, color: isHexColor(color) ? color : nextCategoryColor() },
    categories.length,
    new Set(categories.map((item) => item.id))
  );
  setCategories([...categories, category]);
  elements.categoryNameInput.value = "";
  elements.categoryColorInput.value = nextCategoryColor(categories.length);
  elements.categorySelect.value = category.id;
  state.draftCategoryTouched = true;
  await persist();
  render();
  showToast(`Category added: ${category.name}`);
}

async function updateCategory(id, name, color) {
  const category = categoryById[id];
  if (!category) return;

  const cleanName = name.trim();
  if (!cleanName) {
    showToast("Category name cannot be empty");
    return;
  }

  if (categories.some((item) => item.id !== id && item.name.toLowerCase() === cleanName.toLowerCase())) {
    showToast("That category already exists");
    return;
  }

  const cleanColor = isHexColor(color) ? color : category.color;
  setCategories(
    categories.map((item) =>
      item.id === id
        ? {
            ...item,
            name: cleanName,
            color: cleanColor,
            soft: softenColor(cleanColor),
            keywords: normalizeKeywords([...(item.keywords || []), ...cleanName.split(/\s+/)])
          }
        : item
    )
  );
  await persist();
  render();
  showToast("Category updated");
}

async function addSubcategory(categoryId, name) {
  const category = categoryById[categoryId];
  if (!category) return;

  const cleanName = name.trim();
  if (!cleanName) {
    showToast("Name the subcategory first");
    return;
  }

  if ((category.subcategories || []).some((subcategory) => subcategory.name.toLowerCase() === cleanName.toLowerCase())) {
    showToast("That subcategory already exists");
    return;
  }

  const subcategory = normalizeSubcategory(
    { id: makeCategoryId(cleanName), name: cleanName },
    category.subcategories?.length || 0,
    new Set((category.subcategories || []).map((item) => item.id))
  );
  setCategories(
    categories.map((item) =>
      item.id === categoryId ? { ...item, subcategories: [...(item.subcategories || []), subcategory] } : item
    )
  );
  renderCategorySelect();
  elements.categorySelect.value = categoryId;
  renderSubcategorySelect();
  elements.subcategorySelect.value = subcategory.id;
  state.draftCategoryTouched = true;
  await persist();
  render();
  showToast(`Subcategory added: ${subcategory.name}`);
}

async function updateSubcategory(categoryId, subcategoryId, name) {
  const category = categoryById[categoryId];
  const subcategory = getSubcategory(categoryId, subcategoryId);
  if (!category || !subcategory) return;

  const cleanName = name.trim();
  if (!cleanName) {
    showToast("Subcategory name cannot be empty");
    return;
  }

  if ((category.subcategories || []).some((item) => item.id !== subcategoryId && item.name.toLowerCase() === cleanName.toLowerCase())) {
    showToast("That subcategory already exists");
    return;
  }

  setCategories(
    categories.map((item) =>
      item.id === categoryId
        ? {
            ...item,
            subcategories: (item.subcategories || []).map((nested) =>
              nested.id === subcategoryId
                ? {
                    ...nested,
                    name: cleanName,
                    keywords: normalizeKeywords([...(nested.keywords || []), ...cleanName.split(/\s+/)])
                  }
                : nested
            )
          }
        : item
    )
  );
  await persist();
  render();
  showToast("Subcategory updated");
}

async function deleteSubcategory(categoryId, subcategoryId) {
  const category = categoryById[categoryId];
  const subcategory = getSubcategory(categoryId, subcategoryId);
  if (!category || !subcategory) return;

  const affectedCount = state.notes.filter((note) => note.category === categoryId && note.subcategory === subcategoryId).length;
  const clearText = affectedCount
    ? ` ${affectedCount} ${affectedCount === 1 ? "note" : "notes"} will keep the category but lose this subcategory.`
    : "";
  const confirmed = window.confirm(`Delete "${subcategory.name}" from "${category.name}"?${clearText}`);
  if (!confirmed) return;

  const now = Date.now();
  state.notes = state.notes.map((note) =>
    note.category === categoryId && note.subcategory === subcategoryId
      ? {
          ...note,
          subcategory: "",
          updatedAt: now
        }
      : note
  );
  setCategories(
    categories.map((item) =>
      item.id === categoryId
        ? {
            ...item,
            subcategories: (item.subcategories || []).filter((nested) => nested.id !== subcategoryId)
          }
        : item
    )
  );

  const filterValue = `${categoryId}:${subcategoryId}`;
  if (state.filters.subcategory === filterValue) state.filters.subcategory = null;
  if (state.reviewScope === `subcategory:${categoryId}:${subcategoryId}`) state.reviewScope = "due";
  if (elements.categorySelect.value === categoryId && elements.subcategorySelect.value === subcategoryId) {
    elements.subcategorySelect.value = "";
  }

  await persist();
  render();
  showToast("Subcategory deleted");
}

async function deleteCategory(id) {
  const category = categoryById[id];
  if (!category || categories.length <= 1) return;

  const replacement = categories.find((item) => item.id !== id) || getFallbackCategory();
  const affectedCount = state.notes.filter((note) => note.category === id).length;
  const moveText = affectedCount ? ` ${affectedCount} ${affectedCount === 1 ? "note" : "notes"} will move to "${replacement.name}".` : "";
  const confirmed = window.confirm(`Delete "${category.name}"?${moveText}`);
  if (!confirmed) return;

  state.notes = state.notes.map((note) =>
    note.category === id
      ? {
          ...note,
          category: replacement.id,
          subcategory: "",
          updatedAt: Date.now()
        }
      : note
  );
  setCategories(categories.filter((item) => item.id !== id));

  if (state.filters.category === id) state.filters.category = "all";
  if (state.filters.subcategory?.startsWith(`${id}:`)) state.filters.subcategory = null;
  if (state.reviewScope === `category:${id}`) state.reviewScope = "due";
  if (state.reviewScope.startsWith(`subcategory:${id}:`)) state.reviewScope = "due";
  if (elements.categorySelect.value === id) elements.categorySelect.value = replacement.id;

  await persist();
  render();
  showToast("Category deleted");
}

function noteSourceLabel(note) {
  const parts = [note.source, note.venue, note.year]
    .map((part) => String(part || "").trim())
    .filter(Boolean);
  return parts.length ? parts.join(" · ") : "No source";
}

function notePlainBody(note) {
  const body = String(note.body || "");
  if (normalizeNoteFormat(note.format) !== "html") return body;
  try {
    const parsed = new DOMParser().parseFromString(body, "text/html");
    return parsed.body.textContent || "";
  } catch {
    return body.replace(/<[^>]+>/g, " ");
  }
}

function isSafeContentUrl(value, image = false) {
  const raw = String(value || "").trim().replaceAll("&amp;", "&");
  if (!raw) return false;
  if (image && raw.startsWith("data:image/")) return true;
  try {
    const url = new URL(raw, window.location.origin);
    if (["http:", "https:"].includes(url.protocol)) return true;
    return url.origin === window.location.origin && url.pathname.startsWith("/attachments/");
  } catch {
    return raw.startsWith("/attachments/");
  }
}

function renderPlainText(text) {
  const escaped = escapeHtml(text || "");
  if (!escaped.trim()) return "";
  return "<p>" + escaped.replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br>") + "</p>";
}

function renderInlineMarkdown(text) {
  let html = escapeHtml(text || "");
  html = html.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_match, alt, src) => {
    const cleanSrc = String(src || "").replaceAll("&amp;", "&");
    if (!isSafeContentUrl(cleanSrc, true)) return escapeHtml(alt || "Image");
    const label = alt || "Image";
    return '<img src="' + escapeHtml(cleanSrc) + '" alt="' + escapeHtml(label) + '" loading="lazy" data-image-preview="' + escapeHtml(cleanSrc) + '" data-image-caption="' + escapeHtml(label) + '" />';
  });
  html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_match, label, href) => {
    const cleanHref = String(href || "").replaceAll("&amp;", "&");
    if (!isSafeContentUrl(cleanHref)) return escapeHtml(label);
    return '<a href="' + escapeHtml(cleanHref) + '" target="_blank" rel="noreferrer">' + label + '</a>';
  });
  html = html.replace(/\x60([^\x60]+)\x60/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return html;
}

function renderMarkdown(text) {
  const lines = String(text || "").replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let listType = "";
  let inCode = false;
  let codeLines = [];

  const closeList = () => {
    if (listType) {
      html.push("</" + listType + ">");
      listType = "";
    }
  };

  for (const line of lines) {
    if (/^\x60\x60\x60/.test(line.trim())) {
      if (inCode) {
        html.push("<pre><code>" + escapeHtml(codeLines.join("\n")) + "</code></pre>");
        codeLines = [];
        inCode = false;
      } else {
        closeList();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (!line.trim()) {
      closeList();
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      closeList();
      html.push("<h" + heading[1].length + ">" + renderInlineMarkdown(heading[2]) + "</h" + heading[1].length + ">");
      continue;
    }

    const unordered = line.match(/^[-*]\s+(.+)$/);
    if (unordered) {
      if (listType !== "ul") {
        closeList();
        listType = "ul";
        html.push("<ul>");
      }
      html.push("<li>" + renderInlineMarkdown(unordered[1]) + "</li>");
      continue;
    }

    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      if (listType !== "ol") {
        closeList();
        listType = "ol";
        html.push("<ol>");
      }
      html.push("<li>" + renderInlineMarkdown(ordered[1]) + "</li>");
      continue;
    }

    const quote = line.match(/^>\s?(.+)$/);
    if (quote) {
      closeList();
      html.push("<blockquote>" + renderInlineMarkdown(quote[1]) + "</blockquote>");
      continue;
    }

    closeList();
    html.push("<p>" + renderInlineMarkdown(line) + "</p>");
  }

  if (inCode) html.push("<pre><code>" + escapeHtml(codeLines.join("\n")) + "</code></pre>");
  closeList();
  return html.join("");
}

function sanitizeHtml(html) {
  const allowedTags = new Set(["a", "b", "blockquote", "br", "code", "div", "em", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img", "li", "ol", "p", "pre", "span", "strong", "table", "tbody", "td", "th", "thead", "tr", "ul"]);
  const allowedAttrs = new Set(["alt", "colspan", "href", "rowspan", "src", "title"]);
  const doc = new DOMParser().parseFromString(String(html || ""), "text/html");

  [...doc.body.querySelectorAll("*")].forEach((element) => {
    const tag = element.tagName.toLowerCase();
    if (!allowedTags.has(tag)) {
      element.replaceWith(...element.childNodes);
      return;
    }

    [...element.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      if (!allowedAttrs.has(name) && !name.startsWith("aria-")) element.removeAttribute(attr.name);
    });

    if (tag === "a") {
      const href = element.getAttribute("href") || "";
      if (!isSafeContentUrl(href)) {
        element.removeAttribute("href");
      } else {
        element.setAttribute("target", "_blank");
        element.setAttribute("rel", "noreferrer");
      }
    }

    if (tag === "img") {
      const src = element.getAttribute("src") || "";
      if (!isSafeContentUrl(src, true)) {
        element.remove();
      } else {
        const caption = element.getAttribute("alt") || element.getAttribute("title") || "Image";
        element.setAttribute("loading", "lazy");
        element.setAttribute("data-image-preview", src);
        element.setAttribute("data-image-caption", caption);
      }
    }
  });

  return doc.body.innerHTML;
}

function renderReviewLogHtml(note) {
  if (!note.reviewLog?.length) return "";
  const items = note.reviewLog
    .map((entry) => "<li><strong>" + escapeHtml(formatDate(entry.at)) + ":</strong> " + escapeHtml(entry.text) + "</li>")
    .join("");
  return "<h2>Review Log</h2><ul>" + items + "</ul>";
}

function renderNoteContent(note, options = {}) {
  const format = normalizeNoteFormat(note.format);
  const body = String(note.body || "");
  const content = format === "html" ? sanitizeHtml(body) : format === "plain" ? renderPlainText(body) : renderMarkdown(body);
  return (content || "<p></p>") + (options.includeReviewLog ? renderReviewLogHtml(note) : "");
}

function renderActiveFilters() {
  elements.activeFilters.innerHTML = "";
  const filters = [];
  const subcategoryFilter = getSubcategoryFilterIds(state.filters.subcategory);
  if (subcategoryFilter) {
    const category = categoryById[subcategoryFilter.categoryId] || getFallbackCategory();
    const subcategory = getSubcategory(subcategoryFilter.categoryId, subcategoryFilter.subcategoryId);
    filters.push({
      label: `${category.name} / ${subcategory?.name || "Subcategory"}`,
      clear: () => (state.filters.subcategory = null)
    });
  } else if (state.filters.category !== "all") {
    filters.push({ label: categoryById[state.filters.category]?.name || "Category", clear: () => (state.filters.category = "all") });
  }
  if (state.filters.tag) {
    filters.push({ label: `#${state.filters.tag}`, clear: () => (state.filters.tag = null) });
  }
  if (state.filters.pinned) {
    filters.push({ label: "Pinned", clear: () => (state.filters.pinned = false) });
  }
  if (state.filters.search) {
    filters.push({ label: `"${state.filters.search}"`, clear: () => (state.filters.search = "") });
  }

  filters.forEach((filter) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "filter-chip";
    chip.textContent = `${filter.label} ×`;
    chip.addEventListener("click", () => {
      filter.clear();
      syncInputsFromState();
      render();
    });
    elements.activeFilters.append(chip);
  });
}

function getFilteredNotes() {
  const search = state.filters.search.trim().toLowerCase();
  const orderKey = state.noteOrder === "created" ? "createdAt" : "updatedAt";
  const subcategoryFilter = getSubcategoryFilterIds(state.filters.subcategory);
  return state.notes
    .filter((note) => (state.filters.category === "all" ? true : note.category === state.filters.category))
    .filter((note) =>
      subcategoryFilter
        ? note.category === subcategoryFilter.categoryId && note.subcategory === subcategoryFilter.subcategoryId
        : true
    )
    .filter((note) => (state.filters.tag ? note.tags.includes(state.filters.tag) : true))
    .filter((note) => (state.filters.pinned ? note.pinned : true))
    .filter((note) => {
      if (!search) return true;
      const categoryName = categoryById[note.category]?.name || getFallbackCategory().name;
      const subcategoryName = getNoteSubcategory(note)?.name || "";
      const reviewText = (note.reviewLog || []).map((entry) => entry.text).join(" ");
      const attachmentText = (note.attachments || []).map((attachment) => attachment.name).join(" ");
      const haystack = [note.title, note.source, note.venue, note.year, notePlainBody(note), reviewText, attachmentText, categoryName, subcategoryName, ...note.tags]
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    })
    .sort((a, b) => {
      const primary = (b[orderKey] || 0) - (a[orderKey] || 0);
      return primary || (b.updatedAt || 0) - (a.updatedAt || 0) || a.title.localeCompare(b.title);
    });
}

function renderNotes() {
  const notes = getFilteredNotes();
  elements.notesList.innerHTML = "";

  if (!notes.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `
      <img src="assets/app-mark.svg" alt="" />
      <h2>No notes found</h2>
      <p>Capture a new note or clear the current filters.</p>
    `;
    elements.notesList.append(empty);
    return;
  }

  notes.forEach((note) => {
    const category = categoryById[note.category] || getFallbackCategory();
    const subcategory = getNoteSubcategory(note);
    const card = document.createElement("article");
    card.className = `note-card${state.selectedId === note.id ? " selected" : ""}`;
    card.style.borderLeftColor = category.color;

    const tagMarkup = note.tags
      .slice(0, 5)
      .map((tag) => `<span class="mini-tag">${escapeHtml(tag)}</span>`)
      .join("");
    const subcategoryMarkup = subcategory
      ? `<button class="subcategory-pill" type="button" data-note-action="filter-subcategory">${escapeHtml(subcategory.name)}</button>`
      : "";
    const attachmentMarkup = renderAttachmentGrid(note.attachments, "note-attachments");

    card.innerHTML = `
      <div class="note-card-header">
        <h3>${escapeHtml(note.title)}</h3>
        ${note.pinned ? '<span class="pin-mark" aria-label="Pinned">⌖</span>' : ""}
      </div>
      <div class="note-index-pills">
        <span class="category-pill" style="background:${category.soft};border-color:${category.color};">${escapeHtml(category.name)}</span>
        ${subcategoryMarkup}
      </div>
      <div class="note-times">
        <div class="note-source">${escapeHtml(noteSourceLabel(note))}</div>
        <div class="note-date">Created ${formatDate(note.createdAt)}</div>
        <div class="note-date">Updated ${formatDate(note.updatedAt)}</div>
      </div>
      <div class="note-tags">${tagMarkup}</div>
      <p class="note-excerpt">${escapeHtml(excerpt(notePlainBody(note), 180))}</p>
      ${attachmentMarkup}
      <details class="note-card-details">
        <summary>Full Note</summary>
        <div class="note-card-body rich-note-body">${renderNoteContent(note, { includeReviewLog: true })}</div>
      </details>
      <div class="note-card-actions">
        <button class="secondary-button" type="button" data-note-action="edit">Edit</button>
        <button class="secondary-button" type="button" data-note-action="copy">Copy</button>
        <button class="secondary-button" type="button" data-note-action="pin">${note.pinned ? "Unpin" : "Pin"}</button>
        <button class="danger-button" type="button" data-note-action="delete">Delete</button>
      </div>
    `;
    card.querySelector('[data-note-action="edit"]').addEventListener("click", () => editNote(note.id));
    card.querySelector('[data-note-action="copy"]').addEventListener("click", () => copyNote(note.id));
    card.querySelector('[data-note-action="pin"]').addEventListener("click", () => togglePinNote(note.id));
    card.querySelector('[data-note-action="delete"]').addEventListener("click", () => deleteNote(note.id));
    card.querySelector('[data-note-action="filter-subcategory"]')?.addEventListener("click", () =>
      setSubcategoryFilter(note.category, note.subcategory)
    );
    elements.notesList.append(card);
  });
}

function applyCategoryPill(element, category) {
  element.textContent = category.name;
  element.style.background = category.soft;
  element.style.borderColor = category.color;
}

async function saveDraft() {
  const body = elements.bodyInput.value.trim();
  const rawTitle = elements.titleInput.value.trim();
  const title = rawTitle || deriveTitle(body || state.draftAttachments[0]?.name || "Image note");
  if (!body && !rawTitle && !state.draftAttachments.length) {
    showToast("Write something first");
    return;
  }

  const analysis = analyzeNote(currentDraftText());
  const category = elements.categorySelect.value || analysis.category || getFallbackCategory().id;
  const subcategory = getSubcategory(category, elements.subcategorySelect.value)?.id || "";
  const draft = {
    title,
    source: elements.sourceInput.value.trim(),
    venue: elements.venueInput.value.trim(),
    year: normalizeYear(elements.yearInput.value),
    body,
    format: normalizeNoteFormat(elements.formatSelect.value),
    category,
    subcategory,
    tags: currentDraftTags().length ? currentDraftTags() : analysis.tags,
    attachments: state.draftAttachments.map(normalizeAttachment)
  };

  let saveMessage = "";
  let renamedImages = 0;

  if (state.editingId) {
    const index = state.notes.findIndex((note) => note.id === state.editingId);
    if (index >= 0) {
      state.notes[index] = {
        ...state.notes[index],
        ...draft,
        updatedAt: Date.now()
      };
      renamedImages = await renameAttachmentsForNote(state.notes[index]);
      state.selectedId = state.notes[index].id;
    }
    state.editingId = null;
    saveMessage = "Note updated and sorted";
  } else {
    const note = normalizeNote({
      ...draft,
      id: crypto.randomUUID(),
      pinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    state.notes.unshift(note);
    renamedImages = await renameAttachmentsForNote(note);
    state.selectedId = note.id;
    saveMessage = "Note saved and sorted";
  }

  await persist();
  const deletedImages = await deleteQueuedAttachments();
  await clearDraft({ deleteDraftImages: false });
  state.activePage = "library";
  render();
  showToast(saveMessage + attachmentRenameMessage(renamedImages) + attachmentDeletionMessage(deletedImages));
}

async function clearDraft(options = {}) {
  const deleteDraftImages = options?.deleteDraftImages !== false;
  const draftAttachmentsToDelete = deleteDraftImages
    ? state.draftAttachments.filter((attachment) => !isOriginalDraftAttachment(attachment))
    : [];

  state.editingId = null;
  state.draftCategoryTouched = false;
  state.draftAttachments = [];
  state.draftTags = [];
  state.pendingAttachmentDeletes = [];
  state.originalDraftAttachmentKeys = new Set();
  elements.titleInput.value = "";
  elements.sourceInput.value = "";
  elements.bodyInput.value = "";
  elements.formatSelect.value = "markdown";
  elements.venueInput.value = "";
  elements.yearInput.value = "";
  elements.tagInput.value = "";
  elements.categorySelect.value = getFallbackCategory().id;
  renderSubcategorySelect();
  renderDraftAttachments();
  updateLiveAnalysis();
  const deletedImages = await deleteAttachmentsIfUnused(draftAttachmentsToDelete, { includeDraft: false });
  if (deletedImages) showToast(attachmentDeletionMessage(deletedImages).trim());
}

function editNote(id) {
  const note = state.notes.find((item) => item.id === id);
  if (!note) return;

  state.selectedId = note.id;
  state.editingId = note.id;
  state.draftCategoryTouched = true;
  state.activePage = "capture";
  state.draftAttachments = normalizeAttachments(note.attachments);
  state.draftTags = normalizeTags(note.tags);
  state.pendingAttachmentDeletes = [];
  state.originalDraftAttachmentKeys = new Set(state.draftAttachments.map(attachmentDeleteKey));
  elements.titleInput.value = note.title;
  elements.sourceInput.value = note.source;
  elements.venueInput.value = note.venue || "";
  elements.yearInput.value = note.year || "";
  elements.bodyInput.value = note.body;
  elements.formatSelect.value = normalizeNoteFormat(note.format);
  elements.tagInput.value = "";
  elements.categorySelect.value = note.category;
  renderSubcategorySelect();
  elements.subcategorySelect.value = note.subcategory || "";
  elements.bodyInput.focus();
  renderDraftAttachments();
  updateLiveAnalysis();
  renderPage();
}

async function deleteNote(id) {
  const note = state.notes.find((item) => item.id === id);
  if (!note) return;
  const confirmed = window.confirm(`Delete "${note.title}"?`);
  if (!confirmed) return;

  const attachmentsToDelete = normalizeAttachments(note.attachments);
  state.notes = state.notes.filter((item) => item.id !== note.id);
  if (state.selectedId === note.id) state.selectedId = null;
  if (state.reviewSelectedId === note.id) state.reviewSelectedId = null;
  if (state.editingId === note.id) await clearDraft({ deleteDraftImages: false });

  await persist();
  const deletedImages = await deleteAttachmentsIfUnused(attachmentsToDelete);
  render();
  showToast("Note deleted and folders updated" + attachmentDeletionMessage(deletedImages));
}

async function copyNote(id) {
  const note = state.notes.find((item) => item.id === id);
  if (!note) return;
  try {
    await navigator.clipboard.writeText(noteToMarkdown(note));
    showToast("Copied as Markdown");
  } catch {
    showToast("Clipboard unavailable");
  }
}

async function pasteFromClipboard() {
  try {
    const imageCount = await pasteImagesFromNavigatorClipboard();
    if (imageCount) return;
  } catch {
    // Some browsers expose text clipboard access but not image clipboard access.
  }

  try {
    const text = await navigator.clipboard.readText();
    elements.bodyInput.value = elements.bodyInput.value ? `${elements.bodyInput.value}\n\n${text}` : text;
    updateLiveAnalysis();
    showToast("Clipboard pasted");
  } catch {
    elements.bodyInput.focus();
    showToast("Use Command-V to paste");
  }
}

async function togglePinNote(id) {
  const note = state.notes.find((item) => item.id === id);
  if (!note) return;
  state.selectedId = note.id;
  note.pinned = !note.pinned;
  note.updatedAt = Date.now();
  await persist();
  render();
}

async function exportJson() {
  const library = serializeLibrary();
  if (state.storage.mode === "files") {
    try {
      const result = await apiPost("/api/export/json", library);
      state.storage.exportsDir = result.exportsDir || state.storage.exportsDir;
      renderStorage();
      showToast(`JSON saved to ${result.filePath}`);
      return;
    } catch {
      showToast("Folder export failed; downloading JSON");
    }
  }

  downloadFile("insight-tadpole-notes.json", JSON.stringify(library, null, 2), "application/json");
}

async function exportMarkdown() {
  if (state.storage.mode === "files") {
    try {
      const result = await apiPost("/api/export/markdown", { notes: serializeNotes() });
      state.storage.exportsDir = result.exportsDir || state.storage.exportsDir;
      renderStorage();
      showToast(`Markdown saved to ${result.filePath}`);
      return;
    } catch {
      showToast("Folder export failed; downloading Markdown");
    }
  }

  const markdown = [...state.notes]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map(noteToMarkdown)
    .join("\n\n---\n\n");
  downloadFile("insight-tadpole-notes.md", markdown, "text/markdown");
}

function noteToMarkdown(note) {
  const category = categoryById[note.category]?.name || getFallbackCategory().name;
  const subcategory = getNoteSubcategory(note)?.name || "";
  const lines = [
    `# ${note.title}`,
    "",
    "- Type: Note",
    `- Category: ${category}`,
    `- Subcategory: ${subcategory || "None"}`,
    `- Source: ${note.source || "None"}`,
    `- Conference / Journal: ${note.venue || "None"}`,
    `- Year: ${note.year || "None"}`,
    `- Format: ${normalizeNoteFormat(note.format)}`,
    `- Tags: ${note.tags.join(", ") || "None"}`,
    `- Review Count: ${note.reviewCount || 0}`,
    `- Last Reviewed: ${note.lastReviewedAt ? new Date(note.lastReviewedAt).toISOString() : "Never"}`,
    `- Next Review: ${note.nextReviewAt ? new Date(note.nextReviewAt).toISOString() : "Now"}`,
    `- Created: ${new Date(note.createdAt).toISOString()}`,
    `- Updated: ${new Date(note.updatedAt).toISOString()}`,
    "",
    note.body
  ];

  if (note.attachments?.length) {
    lines.push("", "## Images", "");
    note.attachments.forEach((attachment) => {
      const target = attachmentMarkdownTarget(attachment);
      if (target) lines.push(`![${attachmentMarkdownLabel(attachment)}](${target})`);
    });
  }

  if (note.reviewLog?.length) {
    lines.push("", "## Review Log", "");
    note.reviewLog.forEach((entry) => {
      lines.push(`- ${new Date(entry.at).toISOString()}: ${entry.text}`);
    });
  }

  return lines.join("\n");
}

function noteBodyWithReviewLog(note) {
  if (!note.reviewLog?.length) return note.body;
  const log = note.reviewLog
    .map((entry) => `- ${formatDate(entry.at)}: ${entry.text}`)
    .join("\n");
  return `${note.body}\n\n## Review Log\n\n${log}`;
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast(`Downloaded ${filename}`);
}

function importJson(event) {
  const [file] = event.target.files;
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", async () => {
    try {
      const imported = JSON.parse(String(reader.result));
      const importedNotes = Array.isArray(imported) ? imported : imported?.notes;
      const importedCategories = Array.isArray(imported) ? null : imported?.categories;
      if (!Array.isArray(importedNotes)) throw new Error("Expected notes");
      const mergedCategories = Array.isArray(importedCategories)
        ? mergeCategoryDefinitions(categories, importedCategories)
        : categories;
      setCategories(mergedCategories, importedNotes);
      const normalized = importedNotes.map(normalizeNote);
      const existingIds = new Set(state.notes.map((note) => note.id));
      const merged = normalized.map((note) => (existingIds.has(note.id) ? { ...note, id: crypto.randomUUID() } : note));
      state.notes = [...merged, ...state.notes];
      state.selectedId = merged[0]?.id || state.selectedId;
      await persist();
      render();
      showToast(`Imported and sorted ${merged.length} notes`);
    } catch {
      showToast("Import failed");
    } finally {
      event.target.value = "";
    }
  });
  reader.readAsText(file);
}

async function openStorageFolder() {
  if (state.storage.mode !== "files") {
    showToast("Open from the local server to use file storage");
    return;
  }

  try {
    await apiPost("/api/storage/open");
    showToast("Opening storage folder");
  } catch {
    showToast("Could not open storage folder");
  }
}

function applyStorageSwitchResult(result) {
  state.storage = {
    ...state.storage,
    mode: "files",
    dataDir: result.dataDir || state.storage.dataDir,
    defaultDataDir: result.defaultDataDir || state.storage.defaultDataDir,
    canChooseDataDir:
      typeof result.canChooseDataDir === "boolean" ? result.canChooseDataDir : state.storage.canChooseDataDir,
    notesFile: result.notesFile || state.storage.notesFile,
    settingsFile: result.settingsFile || state.storage.settingsFile,
    sortedDir: result.sortedDir || state.storage.sortedDir,
    exportsDir: result.exportsDir || state.storage.exportsDir,
    attachmentsDir: result.attachmentsDir || state.storage.attachmentsDir,
    lastSync: Date.now(),
    error: ""
  };

  if (Array.isArray(result.notes)) {
    setCategories(result.categories, result.notes);
    state.notes = result.notes.map(normalizeNote);
    state.selectedId = null;
    state.reviewSelectedId = null;
    state.editingId = null;
  }
}

async function chooseStorageFolder() {
  if (state.storage.mode !== "files") {
    showToast("Open from the local server to choose a folder");
    return;
  }

  await persist();
  try {
    const result = await apiPost("/api/storage/choose");
    if (result.cancelled) {
      showToast("Folder selection cancelled");
      return;
    }
    applyStorageSwitchResult(result);
    render();
    showToast(result.copiedCurrentLibrary ? "Storage folder chosen and library copied" : "Storage folder chosen");
  } catch (error) {
    state.storage.error = error.message || "Could not choose storage folder";
    renderStorage();
    showToast("Could not choose storage folder");
  }
}

async function useDefaultStorageFolder() {
  if (state.storage.mode !== "files") {
    showToast("Open from the local server to use the default folder");
    return;
  }

  await persist();
  try {
    const result = await apiPost("/api/storage/default");
    applyStorageSwitchResult(result);
    render();
    showToast(result.copiedCurrentLibrary ? "Default folder selected and library copied" : "Default folder selected");
  } catch (error) {
    state.storage.error = error.message || "Could not switch to default folder";
    renderStorage();
    showToast("Could not switch to default folder");
  }
}

async function syncStorage() {
  await persist();
  render();
  showToast(state.storage.mode === "files" ? "Files synced" : "Browser storage synced");
}

function syncInputsFromState() {
  elements.searchInput.value = state.filters.search;
  elements.showPinnedButton.setAttribute("aria-pressed", String(state.filters.pinned));
  elements.sortUpdatedButton.setAttribute("aria-pressed", String(state.noteOrder === "updated"));
  elements.sortCreatedButton.setAttribute("aria-pressed", String(state.noteOrder === "created"));
}

function setNoteOrder(order) {
  state.noteOrder = order === "created" ? "created" : "updated";
  syncInputsFromState();
  render();
}

function excerpt(text, length) {
  const cleaned = String(text || "").replace(/\s+/g, " ").trim();
  return cleaned.length > length ? `${cleaned.slice(0, length - 3)}...` : cleaned || "No note body";
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => elements.toast.classList.remove("show"), 2200);
}

function openImageLightbox(src, caption = "Image") {
  if (!elements.imageLightbox || !src) return;
  elements.lightboxImage.src = src;
  elements.lightboxImage.alt = caption;
  elements.lightboxCaption.textContent = caption;
  elements.imageLightbox.hidden = false;
}

function closeImageLightbox() {
  if (!elements.imageLightbox) return;
  elements.imageLightbox.hidden = true;
  elements.lightboxImage.removeAttribute("src");
}

function handleImagePreviewClick(event) {
  const trigger = event.target.closest("[data-image-preview]");
  if (!trigger) return;
  event.preventDefault();
  openImageLightbox(trigger.dataset.imagePreview, trigger.dataset.imageCaption || trigger.getAttribute("alt") || "Image");
}

function bindEvents() {
  document.querySelectorAll("[data-page-button]").forEach((button) => {
    button.addEventListener("click", () => setPage(button.dataset.pageButton));
  });

  [elements.titleInput, elements.sourceInput, elements.venueInput, elements.yearInput, elements.bodyInput].forEach((input) => {
    input.addEventListener("input", updateLiveAnalysis);
  });
  elements.formatSelect.addEventListener("change", updateLiveAnalysis);
  elements.tagInput.addEventListener("blur", commitTagInput);
  elements.tagInput.addEventListener("keydown", (event) => {
    if (["Enter", ",", ";"].includes(event.key)) {
      event.preventDefault();
      commitTagInput();
    }
  });
  elements.tagInput.addEventListener("input", () => {
    if (/[,;\n]/.test(elements.tagInput.value)) {
      commitTagInput();
    } else {
      renderDraftTagChips();
      updateLiveAnalysis();
    }
  });

  elements.saveButton.addEventListener("click", saveDraft);
  elements.newButton.addEventListener("click", clearDraft);
  elements.addCategoryButton.addEventListener("click", addCategory);
  elements.categoryNameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") addCategory();
  });
  elements.reviewScopeSelect.addEventListener("change", (event) => {
    state.reviewScope = event.target.value;
    state.reviewSelectedId = null;
    render();
  });
  elements.reviewNextButton.addEventListener("click", selectNextReviewNote);
  elements.markReviewedButton.addEventListener("click", markSelectedReviewed);
  elements.reviewLaterButton.addEventListener("click", reviewSelectedLater);
  elements.openReviewNoteButton.addEventListener("click", openReviewNoteInSearch);
  elements.pasteButton.addEventListener("click", pasteFromClipboard);
  elements.searchInput.addEventListener("input", (event) => {
    state.filters.search = event.target.value;
    render();
  });
  elements.showPinnedButton.addEventListener("click", () => {
    state.filters.pinned = !state.filters.pinned;
    syncInputsFromState();
    render();
  });
  elements.sortUpdatedButton.addEventListener("click", () => setNoteOrder("updated"));
  elements.sortCreatedButton.addEventListener("click", () => setNoteOrder("created"));
  elements.clearFiltersButton.addEventListener("click", () => {
    state.filters = { category: "all", subcategory: null, tag: null, search: "", pinned: false };
    syncInputsFromState();
    render();
  });
  elements.exportJsonButton.addEventListener("click", exportJson);
  elements.exportMarkdownButton.addEventListener("click", exportMarkdown);
  elements.importInput.addEventListener("change", importJson);
  elements.imageInput?.addEventListener("change", addImagesToDraft);
  elements.bodyInput.addEventListener("paste", handleDraftPaste);
  elements.attachmentPanel?.addEventListener("paste", handleDraftPaste);
  elements.attachmentPanel?.addEventListener("dragover", handleDraftDragOver);
  elements.attachmentPanel?.addEventListener("dragleave", () => setAttachmentDropActive(false));
  elements.attachmentPanel?.addEventListener("drop", handleDraftDrop);
  elements.capturePanel?.addEventListener("dragover", handleDraftDragOver);
  elements.capturePanel?.addEventListener("dragleave", () => setAttachmentDropActive(false));
  elements.capturePanel?.addEventListener("drop", handleDraftDrop);
  document.addEventListener("click", handleImagePreviewClick);
  elements.lightboxCloseButton?.addEventListener("click", closeImageLightbox);
  elements.imageLightbox?.addEventListener("click", (event) => {
    if (event.target === elements.imageLightbox) closeImageLightbox();
  });
  elements.openStorageButton.addEventListener("click", openStorageFolder);
  elements.chooseStorageButton.addEventListener("click", chooseStorageFolder);
  elements.defaultStorageButton.addEventListener("click", useDefaultStorageFolder);
  elements.syncStorageButton.addEventListener("click", syncStorage);
  elements.categorySelect.addEventListener("change", () => {
    state.draftCategoryTouched = true;
    renderSubcategorySelect();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.imageLightbox?.hidden) {
      closeImageLightbox();
      return;
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      if (state.activePage === "review") {
        markSelectedReviewed();
      } else {
        saveDraft();
      }
    }
  });
}

async function start() {
  bindEvents();
  renderCategorySelect();
  await initializeStorage();
  syncInputsFromState();
  render();
}

start();
