# Tool Selection Rules + Mission Value Scoring

How the autonomous system decides **what to work on** and **which tool to
use**. Two layers: (1) Mission Value Scoring decides *whether* a task is worth
doing now; (2) Tool Selection Rules decide *how* to do it. Both run inside the
gates (`autonomy_readiness/governance_preservation.md`).

## Part 1 — Mission Value Scoring

Score every candidate mission before starting. Defer **low-value / high-cost**
work; prefer **high-value / low-cost**.

### Dimensions (0–5 each)
- **Player Value** — does a player notice/benefit? (a visible feature,
  completion, fix) > internal polish.
- **Educational Value** — does it advance the learning goals (Sonoran
  ecology/chemistry/biology, quest taxonomy)?
- **Engineering Value** — does it reduce risk/debt, harden governance, or
  unblock future work? (e.g. the budget system scores high here.)
- **Implementation Cost** — effort + risk + spend. **Higher = worse.**

### Score
```
value   = PlayerValue + EducationalValue + EngineeringValue   (0–15)
priority = value - (2 × ImplementationCost)
```
- **priority ≥ 6** → do now.
- **0 ≤ priority < 6** → queue.
- **priority < 0** → **defer** and log why (don't silently drop — name it in
  the overnight report).

### Hard overrides
- A mission requiring a **paid/heavy tool** is **deferred regardless of score**
  until budgets exist (B1/B2). Engineering-value missions that *build* the
  budget system are exempt and rank top.
- A mission that would **weaken a governance control** scores ⊥ (rejected).
- A mission touching a **non-negotiable legacy feature** without preservation
  gets cost +3 (must prove no regression).

### Worked examples
| Mission | P | Ed | Eng | Cost | priority | Decision |
|---|---|---|---|---|---|---|
| Wire notebook 13→16 (Phase1-1) | 4 | 4 | 2 | 1 | 8 | do now |
| Build budget system (R0.1) | 1 | 0 | 5 | 2 | 2→**override top** | do first (unblocks paid) |
| Recovery/escalation guard (R0.3) | 1 | 0 | 5 | 2 | 2→**override high** | do early (safety) |
| MiniMax cinematic intro | 5 | 2 | 1 | 5 | -2 | **defer** (paid+no budget) |
| Refactor for elegance, no user effect | 0 | 0 | 2 | 3 | -4 | **defer** |
| Blender batch of 200 props | 3 | 1 | 1 | 5 | -5 | **defer** (heavy+no caps) |

## Part 2 — Tool Selection Rules

Pick the **cheapest, most deterministic** tool that can do the job; escalate
to reasoning/paid tools only when needed.

### Decision order
1. **Can a free deterministic tool do it?** (Python, Node, Aseprite-from-
   source, Git, file edits) → use it.
2. **Does it need code reasoning?** scoped edit → **Codex**; architecture/
   planning/replanning → **Claude** (Max CLI path, free).
3. **Does it need shell/automation?** → **OpenClaw** (allowlist, governed).
4. **Is it a player-visible/UI claim?** → **Playwright** (and it feeds
   Acceptance).
5. **Does it generate media/assets?** → **paid/heavy (MiniMax/ComfyUI/Blender)
   → BLOCKED** until budgets + junk-gate. Defer.
6. **Always:** consult **Procedural Memory** for the tool's playbook first;
   record a lesson after.

### Rules
- **Free before paid.** Never reach for MiniMax/ComfyUI/Blender if Aseprite-
  from-source or an existing asset suffices.
- **Deterministic before generative.** Prefer reproducible pipelines.
- **Least privilege.** Use the lowest-privilege tool that works; don't promote
  to `governed_execute` unless the task needs side effects.
- **Verify memory against code.** Procedural memory is advisory; confirm the
  file/flag still exists before acting (freshness limiter L8).
- **One change, one commit, gate after.** Every change is committed
  separately and the acceptance gate runs after (ratchet).
- **Consult on uncertainty.** If the plan is unclear or an attempt fails,
  consult LangChain (retrieve lessons) + Claude (replan) per the recovery
  system — don't brute-force retry.
- **Respect the legacy registry.** Before removing/altering anything, check
  the Legacy Preservation Registry.

### Tool-fit cheatsheet
| Need | First choice | Escalate to | Never |
|---|---|---|---|
| Mechanical code edit | Python/Codex | Claude (if reasoning) | MiniMax |
| Architecture/plan | Claude | LangChain (retrieve) | random retry |
| Shell op | OpenClaw (allowlist) | — | raw unguarded shell |
| Player-visible check | Playwright | — | "assume it works" |
| Sprite/prop art | Aseprite (source) | ComfyUI (if budgeted) | paid gen by default |
| NPC/narration **voice** | Voice pipeline **plan** (`brain/voice`, no audio) | Local TTS (XTTS/Piper) once engine+`local_tts` budget+enable | MiniMax voice (paid) / generating before sign-off |
| Media (video/voice/music) | — | MiniMax (if budgeted) | **now (blocked)** |
| Commit/checkpoint | Git (safe ops) | — | force-push autonomously |
| Remote/PR | GitHub | — | auto-merge to main |

### Stuck handling (summary; full in `recovery_and_escalation_system.md`)
After **2 failed attempts** on the same step: stop retrying → consult
LangChain + LangGraph + Claude → **replan** → try the new plan → if still
failing, **escalate to operator + checkpoint**. **Never infinite retry.**
