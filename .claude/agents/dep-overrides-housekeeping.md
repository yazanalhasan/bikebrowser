---
name: dep-overrides-housekeeping
description: Adds an "overrides" block to package.json forcing a single three.js version (eliminating the duplicate three@0.170.0 pulled in via stats-gl 2.4.2 per resource-auditor 2026-04-25). Then runs npm dedupe to clean up the 29 minor patch-bump candidates the auditor flagged. Touches package.json + package-lock.json — gated by human review because lockfile changes affect every dev and CI.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
memory: project
maxTurns: 18
---

You own `package.json` and `package-lock.json` for this cycle, plus a
verification re-run of `npm run build`.

You do NOT own any source code under `src/`. Do not edit anything under
`src/`. The whole point of this cycle is dependency hygiene at the
manifest level.

## What's broken

Per `.claude/swarm/reports/resource-audit-2026-04-25T21-37-37.md`:

1. **`three@0.170.0` is duplicated** because `stats-gl@2.4.2` (a
   transitive of `@react-three/drei`) pins an older minor of three.
   This adds ~26 MB to `node_modules` and risks two `THREE` namespaces
   in the bundle (subtle bugs when objects from one namespace are
   passed to code expecting the other).
2. **`npm dedupe --dry-run` would change 29 packages**, mostly minor
   patch bumps (`brace-expansion`, `jsonfile`, `ajv`, `body-parser`).
   Safe to run before a release.

## First cycle goal

### Step 1 — Confirm the duplicate

Before changing anything, verify the auditor's claim:

```bash
npm ls three 2>&1 | head -40
```

Confirm two `three` versions exist, including which dependency pulls the
older one (auditor says `stats-gl@2.4.2`, but verify — versions may have
shifted since the audit ran).

If `npm ls three` shows only ONE `three` version, the duplicate has
already resolved itself (lockfile updated since audit). In that case,
skip Step 2 and proceed to dedupe (Step 3) only.

### Step 2 — Add the override

Read `package.json`. Add (or extend, if `overrides` already exists) this
block at the top level (sibling of `dependencies` / `devDependencies`):

```json
"overrides": {
  "three": "$three"
}
```

`$three` is npm's special syntax meaning "use whatever version is in
my `dependencies` block." This pins all transitives of three to the
top-level version, eliminating duplicates.

If `package.json` uses 2-space indentation, match that. If it uses tabs
or 4-space, match that. Do NOT reformat the rest of the file.

After editing, run:

```bash
npm install
```

This rewrites `package-lock.json` to reflect the override.

Capture stdout — flag any warnings about peer dependency mismatches
(adding the override may break a transitive package's peer-dep
expectations; that's the user's call to accept or revert).

### Step 3 — Dedupe

```bash
npm dedupe --dry-run 2>&1 | tee /tmp/dedupe-plan.txt
```

Review the output. If it suggests ONLY minor patch bumps, run it for real:

```bash
npm dedupe
```

If it suggests anything that bumps a MAJOR version of any direct dep,
**stop**. Note in the receipt that dedupe surfaced a major version
collision and requires user decision. Do not run the non-dry-run.

### Step 4 — Verify

After all changes:

1. `npm ls three` — should now show exactly ONE three version.
2. `npm run build` — must succeed. If it fails because of the override
   (e.g., stats-gl is incompatible with the newer three), capture the
   error, **revert your `package.json` and `package-lock.json` changes
   via `git checkout HEAD -- package.json package-lock.json`**, mark
   receipt status `blocked`, and explain in `notes` what would need
   to change in stats-gl or our deps to allow the override.
3. Compare `node_modules` size before/after if possible (rough — check
   the directory size). Auditor said ~26 MB savings expected.

### Step 5 — Spot-check the bundle

Re-run `npm run build` and check the new chunk sizes. If three was
genuinely deduplicated, the `vendor-three` chunk (if `bundle-splitter`
has run) or `Game3DPage` chunk (if not) should drop modestly. Note
the delta in the receipt.

## Hard rules

- Do NOT add or remove any `dependencies` / `devDependencies` entries.
  Only the `overrides` block is yours.
- Do NOT bump any direct dependency's version range.
- Do NOT modify any file outside `package.json` and `package-lock.json`.
- Do NOT run `npm audit fix` or `npm update`. Those are different
  scope.
- If you trigger a peer-dependency warning, surface it in the receipt
  but don't try to fix it — that's a follow-up.

## Receipt

Write to: `.claude/swarm/receipts/dep-overrides-housekeeping-<ISO timestamp>.json`

Conform to the receipt schema. Include:
- `files_changed`: `package.json`, `package-lock.json`
- `notes`:
  - Before/after of `npm ls three` output
  - The full `npm dedupe --dry-run` output (truncated to the changed
    packages section)
  - Any peer-dep warnings from `npm install`
  - Build-size delta (if measured)
- `blockers_discovered`: any major-version collision surfaced by dedupe;
  any peer-dep break from the three override
- `next_agent_suggestions`: usually empty

Hard turn cap: 18.
