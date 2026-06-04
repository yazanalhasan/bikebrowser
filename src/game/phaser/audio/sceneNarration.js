// Scene narration helper — reads the visible text of a Phaser panel aloud via
// the Act1AudioSystem narrator. Used by the educational scenes (Investigation,
// Prediction, Bridge, Ecology, Biome) so the narrator auto-reads each panel as
// it appears. Strips emoji / arrow / symbol glyphs that TTS reads awkwardly, and
// skips any excluded Text (e.g. the keyboard-control hint line).

// Emoji, arrows (← ↑ → ↓), check/cross marks (✓ ✗ ✅ 💥 🥀 …), bullets, etc.
const SYMBOL_GLYPHS = /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{27BF}\u{2B00}-\u{2BFF}\u{2600}-\u{26FF}\u{FE00}-\u{FE0F}\u{200D}\u{2022}\u{00B7}]/gu;

export function cleanForSpeech(text) {
  return String(text || '').replace(SYMBOL_GLYPHS, ' ').replace(/\s+/g, ' ').trim();
}

function collect(obj, out, ox, oy, exclude) {
  if (!obj || obj.visible === false) return;
  const x = ox + (obj.x || 0);
  const y = oy + (obj.y || 0);
  if (obj.type === 'Text') {
    if (!exclude.has(obj)) {
      const t = cleanForSpeech(obj.text);
      if (t) out.push({ t, x, y });
    }
    return;
  }
  const list = obj.list || (typeof obj.getChildren === 'function' ? obj.getChildren() : null);
  if (list) for (const child of list) collect(child, out, x, y, exclude);
}

// Read every visible, non-excluded Text in a container, top-to-bottom.
export function narratePanel(scene, container, options = {}) {
  const audio = scene.registry?.get('act1AudioSystem');
  if (!audio || !container) return;
  const exclude = new Set(options.exclude || []);
  const parts = [];
  collect(container, parts, 0, 0, exclude);
  parts.sort((a, b) => (a.y - b.y) || (a.x - b.x));
  const text = parts.map((p) => p.t).join('. ');
  if (text) audio.narrate(text, options);
}

// Read a single short string (e.g. the focused option as the player cycles).
export function narrateText(scene, text, options = {}) {
  const audio = scene.registry?.get('act1AudioSystem');
  const body = cleanForSpeech(text);
  if (audio && body) audio.narrate(body, options);
}
