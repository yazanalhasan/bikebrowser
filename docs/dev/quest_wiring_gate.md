# Quest Wiring Gate

BikeBrowser quests should not ship as JSON-only objectives. Every active objective needs at least one producer in a scene or script.

## Static Audit

Run the full report:

    python scripts/audit-quest-wiring.py --json reports/quest_wiring_gate/latest.json

Run strict mode:

    python scripts/audit-quest-wiring.py --strict

Strict mode exits nonzero when any active quest has an objective with no producer. Current known design-blocked quests should either be wired or explicitly marked deprecated/superseded before this becomes a required CI gate.

## Pre-commit Hook

The hook checks only staged mission JSON files:

    Copy-Item scripts/hooks/pre-commit-quest-wiring.py .git/hooks/pre-commit

It rejects a commit when a newly added or modified quest objective lacks a scene/script producer.

## Dev-mode Runtime Warning

When BIKEBROWSER_DEV_EDITOR=1, RuntimeValidator reads reports/quest_wiring/MATRIX.json if it exists and prints warnings for active DATA_ONLY or PARTIAL quests. This is warning-only so release builds are not blocked.
