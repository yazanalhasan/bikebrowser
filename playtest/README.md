# Live Playtest Kit

This folder is a sidecar QA workspace for assisted human playtesting. It does not modify protected runtime systems, scenes, layouts, or assets.

## Folders

- `active_session/`: current session state snapshots.
- `screenshots/`: timestamped gameplay screenshots.
- `logs/`: mirrored runtime and console excerpts.
- `telemetry/`: lightweight event snapshots.
- `emotional_notes/`: live human reaction notes.
- `issue_reports/`: structured bug reports captured during play.

## Intended Use

1. Attach or autoload `capture_screenshot.gd` only during a playtest build/session.
2. Attach or autoload `log_runtime_output.gd` only during a playtest build/session.
3. Run `capture_bug_report.ps1` when the player reports a bug or emotional reaction.

The scripts are intentionally sidecar tools. They should not become gameplay systems.
