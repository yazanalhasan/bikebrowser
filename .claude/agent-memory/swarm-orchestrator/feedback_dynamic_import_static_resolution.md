---
name: Vite/Rollup statically resolve dynamic-import string literals
description: Wrapping `await import('./missing.js')` in try/catch does NOT prevent Vite/Rollup from failing the build when the path doesn't resolve. Static analysis happens before runtime.
type: feedback
---

When an agent uses a dynamic import to "softly" depend on a future
module — i.e. one that isn't shipped yet — wrapping the import in
try/catch is **insufficient**. Vite's pre-bundler AND Rollup's
production builder both statically analyze string-literal dynamic
import paths at build time. If the path doesn't resolve to a real file,
the build fails with `Could not resolve "..."` before the runtime
try/catch ever executes.

**Why this rule exists:** runtime-audit-system (2026-04-26) shipped
`auditDiscoveryUnlocks` with `await import('../data/discoveryUnlocks.js')`
wrapped in try/catch. The spec wording "try/catch the import; gracefully
skip when the file is absent" implied runtime-only handling. Reviewer
confirmed the try/catch shape but did not run `npm run build`. Production
build failed with `Could not resolve`. User reported `Failed to fetch
dynamically imported module: GamePage.jsx` because the broken module
upstream poisoned the dynamic-import chain in dev too. Hotfix in commit
c2fae90: hide path behind a variable + /* @vite-ignore */ comment.

## How to apply

When dispatching ANY agent that uses a dynamic import to a path that
**may not exist at build time** (forward-references to other agents'
deliverables, plugin-style modules, conditional features), the dispatch
prompt MUST require:

1. **Hide the path behind a variable**, not a string literal:

   ```js
   // ❌ Vite/Rollup will resolve this at build time
   const mod = await import('../data/maybeMissing.js');

   // ✅ Hidden from static analysis
   const path = '../data/maybeMissing.js';
   const mod = await import(/* @vite-ignore */ path);
   ```

2. **Reviewer must run `npm run build`** when verifying any agent that
   adds a dynamic import. The orchestrator should embed this check in
   the reviewer prompt for that class of work — passing `node --check`
   is not sufficient because syntax-validity is not the failure mode.

## Reviewer checklist (paste into review prompts for affected work)

> If the worker added a dynamic `import()` call:
> - Check the path is variable-indirected (not a string literal).
> - Run `npm run build` and verify it completes. Any "Could not
>   resolve" error → FAIL.
