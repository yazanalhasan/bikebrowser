import {
  normalizeProductName,
  getGroupKey,
  buildVariantHash,
  isDuplicate,
  groupNotes,
  getBestOption,
} from './productNormalization';

const STORAGE_KEY = 'bikebrowser.projectNotes.v1';

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function loadStore() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { projects: {} };
  }

  const parsed = safeParse(window.localStorage.getItem(STORAGE_KEY));
  if (!parsed || typeof parsed !== 'object') {
    return { projects: {} };
  }

  return {
    projects: parsed.projects && typeof parsed.projects === 'object' ? parsed.projects : {},
  };
}

function saveStore(store) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function normalizeProject(projectId, projectName) {
  return {
    id: String(projectId || ''),
    name: String(projectName || projectId || 'Untitled Project'),
    notes: [],
  };
}

function normalizeCategory(value) {
  const safe = String(value || 'general').trim().toLowerCase();
  return safe || 'general';
}

export function extractTitleFromUrl(url) {
  try {
    const parsed = new URL(String(url || '').trim());
    return parsed.hostname || 'Custom Link';
  } catch {
    return 'Custom Link';
  }
}

function parsePrice(value) {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return null;
}

function enrichNote(note) {
  const title = String(note?.title || '').trim() || extractTitleFromUrl(note?.url);
  const normalizedName = normalizeProductName(title);
  const price = parsePrice(note?.price);

  return {
    ...note,
    title,
    normalizedName,
    groupKey: String(note?.groupKey || getGroupKey(normalizedName)),
    variantHash: String(note?.variantHash || buildVariantHash({
      normalizedName,
      url: note?.url,
      price,
      title,
    })),
    price,
  };
}

function normalizeStoredNote(note) {
  const base = enrichNote(note || {});
  return {
    id: String(base.id || `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    url: String(base.url || '').trim(),
    title: String(base.title || '').trim() || 'Custom Link',
    category: normalizeCategory(base.category),
    partId: base.partId ? String(base.partId) : null,
    comment: String(base.comment || '').trim(),
    createdAt: String(base.createdAt || new Date().toISOString()),
    normalizedName: base.normalizedName,
    groupKey: base.groupKey,
    variantHash: base.variantHash,
    price: base.price,
    selected: Boolean(base.selected),
  };
}

function getOrCreateProjectRecord(store, projectId, projectName) {
  const key = String(projectId || '').trim();
  if (!key) {
    return null;
  }

  const current = store.projects[key];
  if (!current) {
    const created = normalizeProject(key, projectName);
    store.projects[key] = created;
    return created;
  }

  if (projectName && current.name !== projectName) {
    current.name = projectName;
  }

  if (!Array.isArray(current.notes)) {
    current.notes = [];
  }

  return current;
}

export function getProjectNotes(projectId) {
  const store = loadStore();
  const key = String(projectId || '').trim();
  if (!key || !store.projects[key]) {
    return [];
  }

  const notes = Array.isArray(store.projects[key].notes) ? store.projects[key].notes : [];
  return notes.map(normalizeStoredNote);
}

export function getAllProjectsWithNotes() {
  const store = loadStore();
  return Object.values(store.projects || {}).map((project) => ({
    id: project.id,
    name: project.name,
    notes: Array.isArray(project.notes) ? project.notes.map(normalizeStoredNote) : [],
  }));
}

export function getAllProjectNotes() {
  return getAllProjectsWithNotes().flatMap((project) =>
    (project.notes || []).map((note) => ({
      ...note,
      projectId: project.id,
      projectName: project.name,
    }))
  );
}

export function addNote(project, note) {
  const smart = addNoteSmart(project, note);
  return smart?.note || null;
}

export function addNoteSmart(project, note) {
  const store = loadStore();
  const projectRecord = getOrCreateProjectRecord(store, project?.id, project?.name);
  if (!projectRecord) {
    return { added: false, note: null, duplicate: false };
  }

  const id = `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const candidate = normalizeStoredNote({
    id,
    url: note?.url,
    title: note?.title,
    category: note?.category,
    partId: note?.partId,
    comment: note?.comment,
    price: note?.price,
    createdAt: new Date().toISOString(),
  });

  const existing = (projectRecord.notes || []).map(normalizeStoredNote);
  if (isDuplicate(existing, candidate)) {
    return { added: false, note: null, duplicate: true };
  }

  projectRecord.notes = [...existing, candidate];
  saveStore(store);

  return { added: true, note: candidate, duplicate: false };
}

export function removeNote(project, noteId) {
  const store = loadStore();
  const projectRecord = getOrCreateProjectRecord(store, project?.id, project?.name);
  if (!projectRecord) {
    return [];
  }

  projectRecord.notes = (projectRecord.notes || []).map(normalizeStoredNote).filter((entry) => entry.id !== noteId);
  saveStore(store);
  return projectRecord.notes;
}

export function setSelectedNote(project, noteId) {
  const store = loadStore();
  const projectRecord = getOrCreateProjectRecord(store, project?.id, project?.name);
  if (!projectRecord) {
    return [];
  }

  const notes = (projectRecord.notes || []).map(normalizeStoredNote);
  const target = notes.find((entry) => entry.id === noteId);
  if (!target) {
    return notes;
  }

  projectRecord.notes = notes.map((entry) => {
    if (entry.groupKey === target.groupKey) {
      return {
        ...entry,
        selected: entry.id === noteId,
      };
    }
    return entry;
  });

  saveStore(store);
  return projectRecord.notes;
}

export default {
  addNote,
  addNoteSmart,
  removeNote,
  setSelectedNote,
  getProjectNotes,
  getAllProjectNotes,
  getAllProjectsWithNotes,
  groupNotes,
  getBestOption,
  extractTitleFromUrl,
};
