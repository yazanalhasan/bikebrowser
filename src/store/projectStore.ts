import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Project, ProjectItem, ProjectNote } from '../types/project';
import { loadProjects, saveProjects } from '../services/projectStorage';
import { generateFingerprint } from '../utils/fingerprint';
import { isInterchangeableItem } from '../utils/similarity';
import { runCompatibilityCheck } from '../compatibility/engine';
import {
  normalizeProductName,
  getGroupKey,
  buildVariantHash,
  isDuplicate,
} from '../renderer/services/productNormalization';

type NewProjectItem = Omit<ProjectItem, 'id' | 'fingerprint' | 'addedAt'>;

type SourcingNoteInput = {
  projectId: string;
  projectName?: string;
  url: string;
  title?: string;
  category?: string;
  partId?: string | null;
  partIds?: string[];
  comment?: string;
  price?: number | string | null;
};

type BrowsingItemInput = {
  id: string;
  name: string;
  category: string;
  specs?: Record<string, unknown>;
};

type ProjectStore = {
  projects: Project[];
  activeProjectId: string | null;
  createProject: (name: string, description?: string) => string;
  ensureProject: (projectId: string, projectName: string, description?: string) => void;
  setActiveProject: (id: string | null) => void;
  getActiveProject: () => Project | undefined;
  updateProject: (updatedProject: Project) => void;
  addItemToProject: (item: NewProjectItem) => { added: boolean; duplicate: boolean };
  removeItemFromProject: (itemId: string) => void;
  addNote: (content: string, links?: string[], relatedItemIds?: string[]) => ProjectNote | null;
  addSourcingNote: (note: SourcingNoteInput) => { added: boolean; duplicate: boolean; note: ProjectNote | null };
  removeSourcingNote: (projectId: string, noteId: string) => void;
  setSelectedSourcingNote: (projectId: string, noteId: string) => void;
  syncBrowsableItems: (projectId: string, items: BrowsingItemInput[]) => void;
  markItemPreferred: (projectId: string, itemId: string) => void;
  clearItemPreferred: (projectId: string, itemId: string) => void;
  setItemDeprioritized: (projectId: string, itemId: string, value: boolean) => void;
  runDecisionEngine: (projectId: string) => void;
  getAllNotesSummary: () => Array<ProjectNote & { projectId: string; projectName: string }>;
};

function extractTitleFromUrl(url: string): string {
  try {
    const parsed = new URL(String(url || '').trim());
    return parsed.hostname || 'Custom Link';
  } catch {
    return 'Custom Link';
  }
}

function normalizePrice(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeItemCategory(rawCategory: string): ProjectItem['category'] {
  const value = String(rawCategory || '').toLowerCase().trim();
  const allowed = new Set([
    'battery',
    'motor',
    'controller',
    'frame',
    'display',
    'bms',
    'charger',
    'wheel',
    'other',
  ]);

  return (allowed.has(value) ? value : 'other') as ProjectItem['category'];
}

function withDecisionDefaults(item: ProjectItem): ProjectItem {
  return {
    ...item,
    isPreferred: Boolean(item.isPreferred),
    isDeprioritized: Boolean(item.isDeprioritized),
    relatedItemIds: Array.isArray(item.relatedItemIds) ? [...new Set(item.relatedItemIds)] : [],
  };
}

function normalizeNoteContent(content: string): string {
  return String(content || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function normalizeRelatedIds(ids?: string[]): string[] {
  return [...new Set((Array.isArray(ids) ? ids : []).map((id) => String(id || '').trim()).filter(Boolean))];
}

function isDuplicateProjectNote(existing: ProjectNote, candidate: { content: string; links: string[]; relatedItemIds: string[] }): boolean {
  const existingLinks = [...new Set((existing.links || []).map((value) => String(value || '').trim()).filter(Boolean))].sort();
  const candidateLinks = [...new Set((candidate.links || []).map((value) => String(value || '').trim()).filter(Boolean))].sort();
  const existingRelated = normalizeRelatedIds(existing.relatedItemIds).sort();
  const candidateRelated = normalizeRelatedIds(candidate.relatedItemIds).sort();

  return (
    normalizeNoteContent(existing.content) === normalizeNoteContent(candidate.content) &&
    JSON.stringify(existingLinks) === JSON.stringify(candidateLinks) &&
    JSON.stringify(existingRelated) === JSON.stringify(candidateRelated)
  );
}

function applyDecisionEngineToItems(items: ProjectItem[]): ProjectItem[] {
  const normalized = items.map((item) => withDecisionDefaults(item));
  const preferred = normalized.filter((item) => item.isPreferred);

  if (preferred.length === 0) {
    return normalized.map((item) => ({
      ...item,
      isDeprioritized: false,
      relatedItemIds: [],
    }));
  }

  const preferredIds = new Set(preferred.map((item) => item.id));

  return normalized.map((item) => {
    if (preferredIds.has(item.id)) {
      const related = normalized
        .filter((candidate) => candidate.id !== item.id && isInterchangeableItem(item, candidate))
        .map((candidate) => candidate.id);

      return {
        ...item,
        isPreferred: true,
        isDeprioritized: false,
        relatedItemIds: [...new Set(related)],
      };
    }

    const interchangeable = preferred.filter((preferredItem) => isInterchangeableItem(item, preferredItem));
    return {
      ...item,
      isPreferred: false,
      isDeprioritized: interchangeable.length > 0,
      relatedItemIds: [...new Set(interchangeable.map((entry) => entry.id))],
    };
  });
}

const initialProjects = loadProjects();
const initialActive = initialProjects[0]?.id || null;

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: initialProjects,
  activeProjectId: initialActive,

  createProject: (name, description) => {
    const now = Date.now();
    const newProject: Project = {
      id: uuidv4(),
      name,
      description,
      items: [],
      notes: [],
      compatibility: [],
      tags: [],
      createdAt: now,
      updatedAt: now,
    };

    const projects = [...get().projects, newProject];
    saveProjects(projects);
    set({ projects, activeProjectId: newProject.id });
    return newProject.id;
  },

  ensureProject: (projectId, projectName, description) => {
    const key = String(projectId || '').trim();
    if (!key) {
      return;
    }

    const existing = get().projects.find((project) => project.id === key);
    if (existing) {
      if (projectName && existing.name !== projectName) {
        const updated = { ...existing, name: projectName, description: description || existing.description, updatedAt: Date.now() };
        get().updateProject(updated);
      }
      return;
    }

    const now = Date.now();
    const newProject: Project = {
      id: key,
      name: projectName || 'Untitled Project',
      description,
      items: [],
      notes: [],
      compatibility: [],
      tags: [],
      createdAt: now,
      updatedAt: now,
    };

    const projects = [...get().projects, newProject];
    saveProjects(projects);
    set({ projects });
  },

  setActiveProject: (id) => {
    set({ activeProjectId: id });
  },

  getActiveProject: () => {
    const { projects, activeProjectId } = get();
    return projects.find((project) => project.id === activeProjectId);
  },

  updateProject: (updatedProject) => {
    const projects = get().projects.map((project) =>
      project.id === updatedProject.id ? { ...updatedProject, updatedAt: Date.now() } : project
    );

    saveProjects(projects);
    set({ projects });
  },

  addItemToProject: (item) => {
    const project = get().getActiveProject();
    if (!project) {
      return { added: false, duplicate: false };
    }

    const fingerprint = generateFingerprint(item);
    const exists = project.items.find((existing) => existing.fingerprint === fingerprint);
    if (exists) {
      return { added: false, duplicate: true };
    }

    const newItem: ProjectItem = {
      ...item,
      id: uuidv4(),
      fingerprint,
      addedAt: Date.now(),
      isPreferred: false,
      isDeprioritized: false,
      relatedItemIds: [],
    };

    const nextItems = applyDecisionEngineToItems([...project.items, newItem]);
    const updated: Project = {
      ...project,
      items: nextItems,
      compatibility: runCompatibilityCheck(nextItems),
      updatedAt: Date.now(),
    };

    get().updateProject(updated);
    return { added: true, duplicate: false };
  },

  removeItemFromProject: (itemId) => {
    const project = get().getActiveProject();
    if (!project) {
      return;
    }

    const nextItems = applyDecisionEngineToItems(project.items.filter((item) => item.id !== itemId));
    const updated: Project = {
      ...project,
      items: nextItems,
      compatibility: runCompatibilityCheck(nextItems),
      updatedAt: Date.now(),
    };

    get().updateProject(updated);
  },

  addNote: (content, links = [], relatedItemIds = []) => {
    const project = get().getActiveProject();
    if (!project) {
      return null;
    }

    const candidate = {
      content,
      links,
      relatedItemIds: normalizeRelatedIds(relatedItemIds),
    };
    const duplicate = project.notes.some((entry) => isDuplicateProjectNote(entry, candidate));
    if (duplicate) {
      return null;
    }

    const newNote: ProjectNote = {
      id: uuidv4(),
      content,
      links,
      relatedItemIds: candidate.relatedItemIds.length > 0 ? candidate.relatedItemIds : undefined,
      createdAt: Date.now(),
    };

    const preferredIds = new Set(candidate.relatedItemIds);
    const nextItems = applyDecisionEngineToItems(
      (project.items || []).map((item) =>
        preferredIds.has(item.id)
          ? { ...withDecisionDefaults(item), isPreferred: true }
          : withDecisionDefaults(item)
      )
    );

    const updated: Project = {
      ...project,
      items: nextItems,
      notes: [...project.notes, newNote],
      updatedAt: Date.now(),
    };

    get().updateProject(updated);
    return newNote;
  },

  addSourcingNote: (noteInput) => {
    const project = get().projects.find((entry) => entry.id === noteInput.projectId);
    if (!project) {
      return { added: false, duplicate: false, note: null };
    }

    const url = String(noteInput.url || '').trim();
    if (!url.startsWith('http')) {
      return { added: false, duplicate: false, note: null };
    }

    const title = String(noteInput.title || '').trim() || extractTitleFromUrl(url);
    const normalizedName = normalizeProductName(title);
    const groupKey = getGroupKey(normalizedName);
    const price = normalizePrice(noteInput.price);

    const relatedItemIds = normalizeRelatedIds([
      ...(noteInput.partId ? [String(noteInput.partId)] : []),
      ...((noteInput.partIds || []).map((entry) => String(entry || ''))),
    ]);

    const candidate: ProjectNote = {
      id: uuidv4(),
      content: String(noteInput.comment || title),
      links: [url],
      relatedItemIds: relatedItemIds.length > 0 ? relatedItemIds : undefined,
      title,
      url,
      category: String(noteInput.category || 'general').toLowerCase(),
      comment: String(noteInput.comment || '').trim(),
      normalizedName,
      groupKey,
      variantHash: buildVariantHash({ normalizedName, url, price, title }),
      price,
      selected: false,
      createdAt: Date.now(),
    };

    const existingComparable = (project.notes || []).map((entry) => ({
      normalizedName: entry.normalizedName || normalizeProductName(entry.title || entry.content || ''),
      url: entry.url || entry.links?.[0] || '',
    }));

    if (isDuplicate(existingComparable as any[], candidate as any)) {
      return { added: false, duplicate: true, note: null };
    }

    const nextItems = applyDecisionEngineToItems(
      (project.items || []).map((item) =>
        relatedItemIds.includes(item.id)
          ? { ...withDecisionDefaults(item), isPreferred: true }
          : withDecisionDefaults(item)
      )
    );

    const updated: Project = {
      ...project,
      items: nextItems,
      notes: [...(project.notes || []), candidate],
      updatedAt: Date.now(),
    };

    get().updateProject(updated);
    return { added: true, duplicate: false, note: candidate };
  },

  removeSourcingNote: (projectId, noteId) => {
    const project = get().projects.find((entry) => entry.id === projectId);
    if (!project) {
      return;
    }

    const updated: Project = {
      ...project,
      notes: (project.notes || []).filter((note) => note.id !== noteId),
      updatedAt: Date.now(),
    };

    get().updateProject(updated);
  },

  setSelectedSourcingNote: (projectId, noteId) => {
    const project = get().projects.find((entry) => entry.id === projectId);
    if (!project) {
      return;
    }

    const target = (project.notes || []).find((note) => note.id === noteId);
    if (!target) {
      return;
    }

    const groupKey = target.groupKey || getGroupKey(normalizeProductName(target.title || target.content || ''));
    const updated: Project = {
      ...project,
      notes: (project.notes || []).map((note) => {
        const noteGroup = note.groupKey || getGroupKey(normalizeProductName(note.title || note.content || ''));
        if (noteGroup === groupKey) {
          return {
            ...note,
            selected: note.id === noteId,
          };
        }
        return note;
      }),
      updatedAt: Date.now(),
    };

    get().updateProject(updated);
  },

  syncBrowsableItems: (projectId, items) => {
    const project = get().projects.find((entry) => entry.id === projectId);
    if (!project) {
      return;
    }

    const incoming = Array.isArray(items) ? items : [];
    const incomingIds = new Set(incoming.map((entry) => String(entry.id || '').trim()).filter(Boolean));
    const existingById = new Map((project.items || []).map((item) => [item.id, withDecisionDefaults(item)]));

    const synced = incoming.map((entry) => {
      const id = String(entry.id || '').trim();
      const current = existingById.get(id);
      const base: ProjectItem = {
        id,
        name: entry.name,
        category: normalizeItemCategory(entry.category),
        specs: entry.specs as any,
        fingerprint: generateFingerprint({ name: entry.name, category: normalizeItemCategory(entry.category) }),
        addedAt: current?.addedAt || Date.now(),
        isPreferred: current?.isPreferred || false,
        isDeprioritized: current?.isDeprioritized || false,
        relatedItemIds: current?.relatedItemIds || [],
      };

      return withDecisionDefaults({
        ...current,
        ...base,
      });
    });

    const preserved = (project.items || []).filter((item) => !incomingIds.has(item.id));
    const nextItems = applyDecisionEngineToItems([...preserved, ...synced]);
    const updated: Project = {
      ...project,
      items: nextItems,
      updatedAt: Date.now(),
    };

    get().updateProject(updated);
  },

  markItemPreferred: (projectId, itemId) => {
    const project = get().projects.find((entry) => entry.id === projectId);
    if (!project) {
      return;
    }

    const targetId = String(itemId || '').trim();
    if (!targetId) {
      return;
    }

    const nextItems = applyDecisionEngineToItems(
      (project.items || []).map((item) => {
        if (item.id === targetId) {
          return {
            ...withDecisionDefaults(item),
            isPreferred: true,
            isDeprioritized: false,
          };
        }
        return withDecisionDefaults(item);
      })
    );

    const updated: Project = {
      ...project,
      items: nextItems,
      updatedAt: Date.now(),
    };

    get().updateProject(updated);
  },

  clearItemPreferred: (projectId, itemId) => {
    const project = get().projects.find((entry) => entry.id === projectId);
    if (!project) {
      return;
    }

    const targetId = String(itemId || '').trim();
    const nextItems = applyDecisionEngineToItems(
      (project.items || []).map((item) =>
        item.id === targetId
          ? {
              ...withDecisionDefaults(item),
              isPreferred: false,
              isDeprioritized: false,
              relatedItemIds: [],
            }
          : withDecisionDefaults(item)
      )
    );

    const updated: Project = {
      ...project,
      items: nextItems,
      updatedAt: Date.now(),
    };

    get().updateProject(updated);
  },

  setItemDeprioritized: (projectId, itemId, value) => {
    const project = get().projects.find((entry) => entry.id === projectId);
    if (!project) {
      return;
    }

    const targetId = String(itemId || '').trim();
    const nextItems = (project.items || []).map((item) => {
      if (item.id === targetId) {
        return {
          ...withDecisionDefaults(item),
          isDeprioritized: Boolean(value),
        };
      }
      return withDecisionDefaults(item);
    });

    const updated: Project = {
      ...project,
      items: nextItems,
      updatedAt: Date.now(),
    };

    get().updateProject(updated);
  },

  runDecisionEngine: (projectId) => {
    const project = get().projects.find((entry) => entry.id === projectId);
    if (!project) {
      return;
    }

    const updated: Project = {
      ...project,
      items: applyDecisionEngineToItems(project.items || []),
      updatedAt: Date.now(),
    };

    get().updateProject(updated);
  },

  getAllNotesSummary: () => {
    return get().projects.flatMap((project) =>
      project.notes.map((note) => ({
        projectId: project.id,
        projectName: project.name,
        ...note,
      }))
    );
  },
}));

export default useProjectStore;
