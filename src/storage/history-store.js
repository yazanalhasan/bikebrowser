const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_HISTORY = {
  projects: [],
  searches: [],
  version: 1
};

class HistoryStore {
  constructor(dataDir) {
    this.dataDir = dataDir || path.join(
      process.env.HOME || process.env.USERPROFILE || process.cwd(),
      '.kid-safe-browser'
    );
    this.filePath = path.join(this.dataDir, 'history.json');
    this.data = this._load();
  }

  _ensureDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  _load() {
    try {
      if (!fs.existsSync(this.filePath)) {
        return { ...DEFAULT_HISTORY, projects: [], searches: [] };
      }
      const raw = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      return {
        ...DEFAULT_HISTORY,
        ...raw,
        projects: Array.isArray(raw.projects) ? raw.projects : [],
        searches: Array.isArray(raw.searches) ? raw.searches : []
      };
    } catch (error) {
      console.warn('[HistoryStore] Failed to load history:', error.message);
      return { ...DEFAULT_HISTORY, projects: [], searches: [] };
    }
  }

  _save() {
    try {
      this._ensureDir();
      const json = JSON.stringify(this.data, null, 2);
      fs.writeFileSync(this.filePath, json, 'utf8');
    } catch (error) {
      console.warn('[HistoryStore] Failed to save history:', error.message);
    }
  }

  _generateId() {
    return crypto.randomBytes(8).toString('hex');
  }

  // --- Project methods ---

  createProject(name) {
    const project = {
      id: this._generateId(),
      name: String(name || 'Untitled Project'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: [],
      searches: [],
      notes: []
    };
    this.data.projects.push(project);
    this._save();
    return project;
  }

  getProjects() {
    return this.data.projects;
  }

  getProject(projectId) {
    return this.data.projects.find((p) => p.id === projectId) || null;
  }

  addItemToProject(projectId, item) {
    const project = this.getProject(projectId);
    if (!project) return null;

    const entry = {
      id: this._generateId(),
      ...item,
      added_at: new Date().toISOString()
    };
    project.items.push(entry);
    project.updated_at = new Date().toISOString();
    this._save();
    return entry;
  }

  addNoteToProject(projectId, note) {
    const project = this.getProject(projectId);
    if (!project) return null;

    const entry = {
      id: this._generateId(),
      text: String(note || ''),
      created_at: new Date().toISOString()
    };
    project.notes.push(entry);
    project.updated_at = new Date().toISOString();
    this._save();
    return entry;
  }

  // --- Search history methods ---

  saveSearchResult(searchRecord) {
    const entry = {
      id: this._generateId(),
      input_type: searchRecord.input_type || 'text',
      input_data: searchRecord.input_data || {},
      structured_query: searchRecord.structured_query || {},
      results_count: searchRecord.results_count || 0,
      top_results: (searchRecord.top_results || []).slice(0, 10).map((r) => ({
        title: r.title,
        source: r.source,
        category: r.category,
        score: r.compositeScore || r.score || 0,
        url: r.url
      })),
      timestamp: new Date().toISOString(),
      project_id: searchRecord.project_id || null
    };

    this.data.searches.push(entry);

    // Link to project if specified
    if (entry.project_id) {
      const project = this.getProject(entry.project_id);
      if (project) {
        project.searches.push(entry.id);
        project.updated_at = new Date().toISOString();
      }
    }

    // Keep history manageable (last 500 searches)
    if (this.data.searches.length > 500) {
      this.data.searches = this.data.searches.slice(-500);
    }

    this._save();
    return entry;
  }

  getSearchHistory(limit = 50) {
    return this.data.searches.slice(-limit).reverse();
  }

  getProjectHistory(projectId) {
    const project = this.getProject(projectId);
    if (!project) return { items: [], searches: [], notes: [] };

    const searchEntries = this.data.searches.filter(
      (s) => project.searches.includes(s.id)
    );

    return {
      items: project.items,
      searches: searchEntries,
      notes: project.notes
    };
  }

  findSimilarItems(query, threshold = 0.3) {
    const terms = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return [];

    const seen = new Set();
    const matches = [];

    for (const search of this.data.searches) {
      for (const result of (search.top_results || [])) {
        const key = result.url || result.title;
        if (seen.has(key)) continue;
        seen.add(key);

        const text = `${result.title} ${result.category || ''}`.toLowerCase();
        const matchCount = terms.filter((t) => text.includes(t)).length;
        const score = matchCount / terms.length;

        if (score >= threshold) {
          matches.push({ ...result, similarity: score, from_search: search.id });
        }
      }
    }

    return matches.sort((a, b) => b.similarity - a.similarity).slice(0, 20);
  }
}

module.exports = { HistoryStore };
