// Dev-only console buffer. Captures console output to a bounded
// ring buffer accessible via window.__consoleBuffer and
// window.__exportConsole(). Used for sharing runtime console
// history with AI agents without screenshot fidelity loss.
//
// Gated behind import.meta.env.DEV by the caller. This module
// assumes it is only imported in dev builds.

const MAX_ENTRIES = 5000;
const buffer = [];

const original = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  info: console.info.bind(console),
  debug: console.debug.bind(console),
};

function push(level, args) {
  buffer.push({ level, ts: Date.now(), args });
  if (buffer.length > MAX_ENTRIES) {
    buffer.splice(0, buffer.length - MAX_ENTRIES);
  }
}

function safeStringify(value, depth = 0) {
  if (depth > 10) return '[Object: depth limit]';
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  const t = typeof value;
  if (t === 'string') return JSON.stringify(value);
  if (t === 'number' || t === 'boolean') return String(value);
  if (t === 'function') return `[Function: ${value.name || 'anonymous'}]`;
  if (t === 'symbol') return value.toString();
  if (t === 'bigint') return value.toString() + 'n';
  if (value instanceof Error) {
    return JSON.stringify({
      __type: 'Error',
      name: value.name,
      message: value.message,
      stack: value.stack,
    });
  }
  if (typeof Element !== 'undefined' && value instanceof Element) {
    return `[HTMLElement: <${value.tagName.toLowerCase()}${
      value.id ? ` id="${value.id}"` : ''
    }>]`;
  }
  if (Array.isArray(value)) {
    return '[' + value.map(v => safeStringify(v, depth + 1)).join(', ') + ']';
  }
  if (t === 'object') {
    try {
      const seen = new WeakSet();
      return JSON.stringify(value, (k, v) => {
        if (typeof v === 'object' && v !== null) {
          if (seen.has(v)) return '[Circular]';
          seen.add(v);
        }
        if (typeof v === 'function') return `[Function: ${v.name || 'anonymous'}]`;
        if (typeof v === 'undefined') return '[undefined]';
        return v;
      }, 2);
    } catch (e) {
      return `[Unstringifiable Object: ${e.message}]`;
    }
  }
  return String(value);
}

function exportBuffer(options = {}) {
  const { level, since, sinceLast, limit, format = 'json' } = options;
  let entries = buffer.slice();
  if (level) {
    const levels = Array.isArray(level) ? level : [level];
    entries = entries.filter(e => levels.includes(e.level));
  }
  if (since) entries = entries.filter(e => e.ts >= since);
  if (sinceLast) entries = entries.slice(-sinceLast);
  if (limit) entries = entries.slice(-limit);
  const formatted = entries.map(e => ({
    level: e.level,
    ts: new Date(e.ts).toISOString(),
    message: e.args.map(a => safeStringify(a)).join(' '),
  }));
  if (format === 'text') {
    return formatted
      .map(e => `[${e.ts}] ${e.level.toUpperCase().padEnd(5)} ${e.message}`)
      .join('\n');
  }
  return JSON.stringify(formatted, null, 2);
}

function clearBuffer() {
  buffer.length = 0;
}

export function initConsoleBuffer() {
  if (typeof window === 'undefined') return;
  if (window.__consoleBufferInitialized) return;
  window.__consoleBufferInitialized = true;
  console.log = (...args) => { push('log', args); original.log(...args); };
  console.warn = (...args) => { push('warn', args); original.warn(...args); };
  console.error = (...args) => { push('error', args); original.error(...args); };
  console.info = (...args) => { push('info', args); original.info(...args); };
  console.debug = (...args) => { push('debug', args); original.debug(...args); };
  window.__consoleBuffer = buffer;
  window.__exportConsole = exportBuffer;
  window.__clearConsole = clearBuffer;
  original.log(
    '[consoleBuffer] active. Run __exportConsole() in DevTools to ' +
    'capture full console history as JSON. Options: ' +
    '{level, since, sinceLast, limit, format}.'
  );
}
