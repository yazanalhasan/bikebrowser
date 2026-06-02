# Available Assets & Helpers Registry (Tool Registry)

The autonomous system's full toolset. Each entry: **purpose · strengths ·
weaknesses · when to use · when NOT to use · budget · privilege ·
acceptance.** "Budget" and "privilege" reference the gates in
`autonomy_readiness/` — paid/heavy tools are **BLOCKED for autonomy until the
budget system exists** (`budget_governance_gap.md`). Legend for autonomous
availability: 🟢 free local · 🟡 governed (privilege) · 🔴 paid/heavy
(blocked until budgets).

---

## 1. Executive Brain 🟢/🟡
- **Purpose:** the orchestrator — missions, executors, graph, reconciliation,
  acceptance, memory. The thing that *runs* autonomy.
- **Strengths:** fail-closed privilege gate; 5 reconcilers; runtime resume/
  replay; mission loop; the acceptance ratchet.
- **Weaknesses:** no budget governance; informal stuck-detection.
- **Use when:** any orchestrated, governed work.
- **Not when:** never bypass it to call tools raw.
- **Budget:** itself free; governs others. **Privilege:** it *is* the gate.
  **Acceptance:** owns the gate.

## 2. LangChain 🟢
- **Purpose:** retrieval / (future) plan-repair.
- **Strengths:** procedural-memory retrieval (`retrieval/selective.py`).
- **Weaknesses:** not yet a planning layer (limiter L1).
- **Use when:** retrieve relevant procedures/lessons before acting; consult on
  stuck (per recovery system).
- **Not when:** as the executor of side effects.
- **Budget:** free local. **Privilege:** none. **Acceptance:** advisory only.

## 3. LangGraph 🟢
- **Purpose:** the workflow/state-machine engine (`brain/graph/`).
- **Strengths:** deterministic 12-node pipeline; resumable.
- **Weaknesses:** graph edits need care; not for ad-hoc branching.
- **Use when:** structured multi-step missions.
- **Not when:** trivial single-step tasks.
- **Budget:** free. **Privilege:** inherits node privileges. **Acceptance:**
  pipeline ends at the acceptance node.

## 4. LangSmith 🟡(obs)
- **Purpose:** tracing/observability of runs.
- **Strengths:** post-hoc diagnosis of long runs.
- **Weaknesses:** not yet wired into the loop (B6); may be absent in headless.
- **Use when:** long/overnight runs needing traceability.
- **Not when:** offline/no-network contexts.
- **Budget:** free tier. **Privilege:** none. **Acceptance:** n/a.

## 5. Claude 🟡/🔴
- **Purpose:** reasoning/codegen executor (`claude_executor.py`, CLI).
- **Strengths:** strong reasoning; consult target on stuck.
- **Weaknesses:** CLI wrapper (coarse token accounting, L5).
- **Use when:** planning, code reasoning, replanning after failure.
- **Not when:** deterministic mechanical edits (use Python/Codex).
- **Budget:** Max-plan CLI = runtime only (🟡 allowed); **paid API path 🔴
  blocked until budgets**. **Privilege:** `plan_only` default → `governed_execute`.
  **Acceptance:** outputs gated by acceptance like any change.

## 6. Codex 🟡/🔴
- **Purpose:** code-generation/edit executor (`codex_executor.py`).
- **Strengths:** focused code edits; packet fallback exists.
- **Weaknesses:** narrower reasoning than Claude.
- **Use when:** scoped code changes.
- **Not when:** architecture decisions (consult Claude).
- **Budget:** 🔴 if paid API; 🟡 if local/Max path. **Privilege:** governed.
  **Acceptance:** required for any committed change.

## 7. OpenClaw 🟡
- **Purpose:** shell/automation executor (`openclaw_executor.py`).
- **Strengths:** shell allowlist + metacharacter guard + path-within checks.
- **Weaknesses:** powerful → dangerous if misgoverned.
- **Use when:** governed local shell ops.
- **Not when:** anything outside the allowlist or repo paths.
- **Budget:** free local (runtime). **Privilege:** `plan_only` default,
  fail-closed. **Acceptance:** effects validated.

## 8. Playwright 🟢
- **Purpose:** browser automation + the acceptance driver.
- **Strengths:** drives both game routes; deterministic after dead-band fix;
  player-visible verification.
- **Weaknesses:** timing-sensitive under load (B7).
- **Use when:** acceptance, player-visible validation, UI checks.
- **Not when:** as a substitute for unit logic.
- **Budget:** free local. **Privilege:** read/validate. **Acceptance:** it **is**
  one of the two required signals.

## 9. MiniMax 🔴
- **Purpose:** paid generative media (video/voice/music/audio/animation).
- **Strengths:** high-quality media.
- **Weaknesses:** **adapter not implemented (B4)**; paid; no budget.
- **Use when:** (future) media generation, after privilege+budget+junk-gate.
- **Not when:** **now — BLOCKED autonomously.**
- **Budget:** 🔴 paid, **no budget = blocked**. **Privilege:** 5 privileges,
  all `plan_only`. **Acceptance:** every asset must pass the junk-asset gate (L9).

## 10. ComfyUI 🔴(heavy)
- **Purpose:** local GPU image/asset generation.
- **Strengths:** free of per-call $; flexible pipelines.
- **Weaknesses:** **no resource caps (B2)**; can pin GPU for hours.
- **Use when:** (future) local asset gen within a resource budget.
- **Not when:** **batch/heavy autonomously now — BLOCKED.**
- **Budget:** 🔴 resource (gpu-min/batch) — **missing = blocked**.
  **Privilege:** governed. **Acceptance:** junk-asset gate.

## 11. Blender 🔴(heavy)
- **Purpose:** 3D modeling/render.
- **Strengths:** local; scriptable.
- **Weaknesses:** long renders; **no wall-clock/batch cap (B2)**.
- **Use when:** (future) governed single renders within a resource budget.
- **Not when:** **batch renders autonomously now — BLOCKED.**
- **Budget:** 🔴 resource — blocked. **Privilege:** governed. **Acceptance:**
  output quality-gated.

## 12. Aseprite 🟢/🟡
- **Purpose:** pixel/sprite art (source→PNG), the act1 art source pipeline.
- **Strengths:** deterministic; source-controlled SVG/aseprite sources.
- **Weaknesses:** manual-ish; CLI batch limited.
- **Use when:** sprite/prop art edits from sources.
- **Not when:** generative concepting (that's ComfyUI/MiniMax).
- **Budget:** free local. **Privilege:** file writes governed. **Acceptance:**
  art audit on changed assets.

## 13. Git 🟢/🟡
- **Purpose:** version control.
- **Strengths:** checkpoints, baseline tag, revertability.
- **Weaknesses:** destructive ops (reset/force) are dangerous.
- **Use when:** commit per change; branch; tag.
- **Not when:** force-push/hard-reset autonomously (operator only).
- **Budget:** free. **Privilege:** writes governed; destructive ops require
  explicit approval. **Acceptance:** commit only on green gate.

## 14. GitHub 🟡
- **Purpose:** remote repo / PRs / issues (`gh`).
- **Strengths:** review surface; CI trigger.
- **Weaknesses:** outward-facing (publishing = irreversible-ish).
- **Use when:** push branch, open PR for operator review.
- **Not when:** auto-merge to main autonomously; publishing secrets.
- **Budget:** free. **Privilege:** push/PR governed; **never commit secrets
  (MiniMax key lives only in gitignored `.env`)**. **Acceptance:** PR only on green.

## 15. Docker 🟡
- **Purpose:** containerized services/builds.
- **Strengths:** reproducible envs.
- **Weaknesses:** disk/CPU heavy; daemon state.
- **Use when:** isolated service runs/builds.
- **Not when:** uncontrolled image pulls/builds overnight.
- **Budget:** resource (disk/CPU). **Privilege:** governed. **Acceptance:** n/a
  directly.

## 16. Node 🟢
- **Purpose:** JS runtime / Vite build / npm for BikeBrowser.
- **Strengths:** runs the game, builds, tests.
- **Weaknesses:** `npm install` network/supply-chain surface.
- **Use when:** build, dev server, run JS tests.
- **Not when:** unvetted dependency additions autonomously.
- **Budget:** free local. **Privilege:** install governed. **Acceptance:** build
  must succeed; gate runs on built app.

## 17. Python 🟢
- **Purpose:** Executive Brain runtime + scripts/tests.
- **Strengths:** the Brain itself; deterministic edits/tests.
- **Weaknesses:** env/dependency drift.
- **Use when:** Brain logic, tests, mechanical edits.
- **Not when:** unvetted `pip install` autonomously.
- **Budget:** free local. **Privilege:** governed. **Acceptance:** Brain tests
  (365) + acceptance.

## 18. Acceptance 🟢
- **Purpose:** the production-promotion ratchet (Playwright PASS + Brain audit
  PASS, fresh evidence).
- **Strengths:** dual-signal; player-visible; non-negotiable.
- **Weaknesses:** timing fragility under load (B7).
- **Use when:** **after every change**; gates "done".
- **Not when:** never weaken/skip/bypass; a red gate **stops** the loop.
- **Budget:** free. **Privilege:** read/validate. **Acceptance:** it is the
  acceptance authority.

## 19. Procedural Memory 🟢
- **Purpose:** capabilities/playbooks/SOPs/workflows (114 entries).
- **Strengths:** validated; advisory guidance for tool use.
- **Weaknesses:** can lag code reality (L8) — verify before acting.
- **Use when:** look up how to use a tool/capability; record lessons.
- **Not when:** trusting a stale memory without verifying current code.
- **Budget:** free. **Privilege:** none. **Acceptance:** advisory.

## 20. Legacy Preservation Registry 🟢
- **Purpose:** the locked list of legacy features (25 subsystems, 10
  non-negotiables, 0 REMOVE) — `artifacts/foundation/`.
- **Strengths:** prevents autonomous deletion/regression of legacy value.
- **Weaknesses:** static; must be consulted, not assumed.
- **Use when:** before touching/removing anything that overlaps legacy.
- **Not when:** never delete a preserved feature autonomously.
- **Budget:** free. **Privilege:** read; deletions of preserved items require
  operator approval. **Acceptance:** preserved features must keep passing.

## 21. Voice Pipeline / Local TTS 🟡 (governance IMPLEMENTED; generation disabled)
- **Purpose:** Executive Brain's NPC/narration voice production path —
  `brain/voice/` (registry, content-addressed cache, manifest, bounded queue,
  validation, executor, xtts/piper adapters). Tag `voice_governance_v1`.
- **Strengths:** full plan→generate path exists and is fail-closed; integrates
  privilege + budget(resource) + recovery + asset-promotion; reuses the game's
  NPCVoiceRegistry/normalization.
- **Weaknesses:** **generation disabled** (`VOICE_GENERATION_ENABLED=False`); no
  TTS engine installed yet; intelligibility/language validation stubbed (Whisper
  future).
- **Use when:** plan/answer "generate this voice" (cache key, manifest, gate
  decisions) — **without** producing audio.
- **Not when:** generating real audio (operator-gated: install engine + register
  `voice_local` privilege + set `local_tts` resource budget + enable flag first).
- **Budget:** free local (no money) but **resource-governed** (`local_tts`
  GPU-min/wall-clock/batch; blocked until a budget is set). **Privilege:**
  `voice` unmapped → fail-closed; needs `voice_local` at `governed_execute`.
  **Acceptance:** clips must pass validation + promotion before production;
  cultural-voice (Arabic/Spanish) needs human CARE review.

---

## Quick autonomous-availability matrix (until budgets exist)
| Free local 🟢 (allowed) | Governed 🟡 (privilege, allowed if free) | Paid/heavy 🔴 (BLOCKED) |
|---|---|---|
| Executive Brain, LangChain, LangGraph, Playwright, Aseprite(src), Git(safe), Node, Python, Acceptance, Procedural Memory, Legacy Registry | Claude/Codex (Max CLI), OpenClaw, GitHub(push/PR), Docker, LangSmith, Voice pipeline (plan-only) | MiniMax, ComfyUI(batch), Blender(batch), Local TTS generation (until engine+budget+enable), any paid API path, cloud gen |

This matrix is the source of truth for `overnight_execution_policy.md`.
