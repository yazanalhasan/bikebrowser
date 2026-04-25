---
name: Mid-session agent registry limitation
description: The Agent tool's subagent_type registry is loaded at session start; agent .md files added mid-session aren't selectable until session restart. Route via general-purpose with the spec embedded, or restart.
type: feedback
---

If a new agent definition is added to `.claude/agents/<name>.md` during a session and the user immediately asks the orchestrator to dispatch it, the Agent tool will return: `Agent type '<name>' not found. Available agents: ...`. The registered list is frozen at session start.

**Why:** Observed 2026-04-25 with `tts-voice-config` and `tts-dialog-integration` — both were authored mid-session via a separate commit (`c590519 swarm: add Audio & TTS pod`), but the orchestrator's Agent tool only knew about the agents that existed at session boot.

**How to apply (in order of preference):**

1. **Preferred — restart the session.** A fresh `claude` invocation re-reads `.claude/agents/` at boot and registers everything. The new agents become natively dispatchable, their frontmatter (model, maxTurns, memory) is honored end-to-end, and worker memory dirs (e.g. `.claude/agent-memory/<name>/`) are correctly scoped.

2. **Workaround — route via `general-purpose`.** Compose the worker prompt with the agent's full spec embedded ("You are running as the X swarm worker. Your full agent definition is at `.claude/agents/<name>.md` — read it first."). The work and standards are still authoritative because the spec lives on disk; only the frontmatter (model, maxTurns binding, project-memory routing) is bypassed. The reviewer can still validate against the on-disk spec, so the gate works correctly. Note this in the receipt and in completed[]'s notes so the trail exists.

The workaround is fine for one-off urgency but the trade-off is that the `model: sonnet` and `maxTurns: 25` (or whatever) on the agent's frontmatter are not enforced by the framework — they're only enforced by the prompt. If a worker has a tight budget (haiku/short maxTurns), the workaround is more risky.

For any session with more than one or two new agents to add, the cleanest move is: commit the new definitions, surface a "session restart recommended" handoff, and pick up native dispatch in the next session.
