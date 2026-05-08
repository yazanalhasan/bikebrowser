# renderer/devtools

Browser-side diagnostics tooling. Modules here are gated at call sites
and stay local to the browser unless a player explicitly copies an
export.

## consoleBuffer.js

A passive observer that captures `console.log` / `warn` / `error` /
`info` / `debug` output to a bounded ring buffer (5000 entries).
**It is not a logging framework.** It does not change console
formatting, does not route to a server, and does not replace existing
DevTools rendering. Wrappers delegate to the original bound methods
so DevTools shows everything exactly as it did before.

The point: AI agents can't see your DevTools. Screenshots lose
fidelity (truncation, line wraps, redacted object summaries). With
this buffer, you run `copy(__exportConsole())` in DevTools, paste
into the agent input, and the agent reads perfect text.

### Window globals

Once `initConsoleBuffer()` has been called (automatic in dev builds
and when gameplay reports are enabled via `GameContainer.jsx`):

| Global | Type | Purpose |
| --- | --- | --- |
| `window.__consoleBuffer` | `Array<{level, ts, args}>` | Raw entries (5000 cap, oldest evicted). Inspect live in DevTools. |
| `window.__exportConsole(opts?)` | `(opts?) => string` | Stringified export. JSON by default; pass `{format: 'text'}` for plain text. |
| `window.__clearConsole()` | `() => void` | Empty the buffer. |
| `window.__consoleBufferInitialized` | `boolean` | Idempotency guard. |

### Export options

```js
__exportConsole();                                  // all entries, JSON
__exportConsole({ format: 'text' });                // plain-text lines
__exportConsole({ level: 'error' });                // errors only
__exportConsole({ level: ['warn', 'error'] });      // warnings + errors
__exportConsole({ since: Date.now() - 60_000 });    // last minute
__exportConsole({ sinceLast: 50 });                 // last 50 entries
__exportConsole({ limit: 200, format: 'text' });    // last 200 as text
```

### Common patterns

- **Capture during a quest playthrough.** Run `__clearConsole()`
  before starting the step, play through, run
  `copy(__exportConsole({ format: 'text' }))`, paste to the agent.
- **Errors only.** `copy(__exportConsole({ level: 'error' }))`.
- **Just before a crash.** `__exportConsole({ sinceLast: 100 })`
  pulls the most recent 100 entries — usually the relevant window.

### How agents should use it

In your input to the agent, paste the exported text and tell the
agent it's runtime console output. The JSON format includes ISO
timestamps and explicit levels, which is easier for the agent to
reason about than terminal-formatted logs.

### Limitations

- 5000-entry cap. The oldest entries are dropped when full. Adjust
  `MAX_ENTRIES` in `consoleBuffer.js` only if you have a reason.
- Production builds have these globals only when gameplay reports are
  enabled. Set `VITE_ENABLE_GAMEPLAY_REPORTS=false` to hide the report
  tool and skip the buffer.
- `console.table`, `console.group`, `console.dir`, `console.trace`
  are NOT captured. Add a separate dispatch if you need them.
- Args are kept by reference until export. If you mutate an object
  after logging it, the export reflects the mutated state. This is
  the same behavior as DevTools' object inspector.
- Circular references, functions, DOM elements, and `Error`
  instances are handled at export time via `safeStringify`.

### Related dev tools

- `tools/inspect-save.js` — node script for inspecting localStorage
  game saves. Read-only, no buffer integration needed.
