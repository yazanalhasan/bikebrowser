const fs = require('fs');
const path = require('path');

const DEFAULT_STATE = {
  projects: [],
  notes: [],
  preferences: {
    byNormalizedKey: {},
  },
};

function normalizeKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

class ServerStorage {
  constructor(filePath) {
    this.filePath = filePath;
    this.state = this.load();
  }

  ensureDir() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
  }

  load() {
    try {
      if (!fs.existsSync(this.filePath)) {
        return { ...DEFAULT_STATE };
      }

      const raw = fs.readFileSync(this.filePath, 'utf8');
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_STATE,
        ...parsed,
        projects: Array.isArray(parsed.projects) ? parsed.projects : [],
        notes: Array.isArray(parsed.notes) ? parsed.notes : [],
        preferences: parsed.preferences || { byNormalizedKey: {} },
      };
    } catch {
      return { ...DEFAULT_STATE };
    }
  }

  save() {
    this.ensureDir();
    fs.writeFileSync(this.filePath, JSON.stringify(this.state, null, 2), 'utf8');
  }

  getProjects() {
    return this.state.projects;
  }

  createProject(input = {}) {
    const project = {
      id: input.id || `project-${Date.now()}`,
      name: input.name || 'Untitled Project',
      description: input.description || '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.state.projects.push(project);
    this.save();
    return project;
  }

  getNotes() {
    return this.state.notes;
  }

  addNote(input = {}) {
    const note = {
      id: input.id || `note-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      projectId: input.projectId || null,
      itemId: input.itemId || null,
      itemName: input.itemName || '',
      state: input.state || 'preferred',
      content: input.content || '',
      createdAt: Date.now(),
    };

    this.state.notes.push(note);

    const prefKey = normalizeKey(note.itemName || note.itemId || note.content);
    if (prefKey) {
      const current = this.state.preferences.byNormalizedKey[prefKey] || {
        preferred: 0,
        rejected: 0,
      };

      if (note.state === 'rejected') {
        current.rejected += 1;
      } else {
        current.preferred += 1;
      }

      this.state.preferences.byNormalizedKey[prefKey] = current;
    }

    this.save();
    return note;
  }

  getPreferences() {
    return this.state.preferences.byNormalizedKey || {};
  }
}

module.exports = {
  ServerStorage,
  normalizeKey,
};
