---
name: AGENT_NAME_HERE
description: One-sentence description of what this agent owns and produces.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
memory: project
maxTurns: 25
---

You own SCOPE_HERE under FILE_PATHS_HERE.

## First cycle goal

Concrete description of what this single cycle should produce. Should be
narrow enough that one cycle (≤ maxTurns) can finish it. If broader work is
needed, split into multiple agents or multiple cycles defined in
sequencing.yaml.

## Standards

- Match the patterns in adjacent files. If a directory uses TypeScript
  strict, you do too. If it uses JavaScript, do not introduce TypeScript.
- All assets via the asset pipeline (do not inline imports).
- No window.require, no direct ipcRenderer access from the renderer.
- Tests under the appropriate __tests__/ directory if they exist; otherwise
  follow the receipt note about test infra not yet existing.

## Receipt requirement

When you finish, write a JSON receipt to:
.claude/swarm/receipts/AGENT_NAME_HERE-<ISO timestamp>.json

The receipt must conform to .claude/swarm/receipt-schema.json. Include:
- All files you changed or created
- All exports you added (function/component/class names)
- All test files you added
- Any blockers you hit and which downstream agents they block
- Suggested next agent(s)
- Brief notes on decisions you made

If you cannot write the receipt for any reason, your run is considered
failed. Do not skip this step.
