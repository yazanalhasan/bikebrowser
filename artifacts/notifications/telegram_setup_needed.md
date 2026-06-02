# Telegram Setup Needed

Telegram progress updates are **code-ready but not configured**. The build does
**not** pause for this — progress is logged locally to `progress_updates.md`.
Enabling Telegram requires a bot token + chat id (secrets / external account =
operator action). **No tokens are hardcoded or printed.**

## What exists (verified by code)
- **Executive Brain:** `brain/integrations/telegram.py` — `TelegramClient`
  (`send_message`, `get_updates`), `telegram_is_configured()`,
  `notify_status_update(title, lines)`, `notify_approval_requested(...)`. Already
  called from `brain/execution/runner.py` (`_notify_status`).
- **OpenClaw:** governed PowerShell scripts under `C:\OpenClaw\scripts\`:
  `send_telegram_governance_summary.ps1`, `start_telegram_governance.ps1`,
  `resolve_telegram_governance_chat.ps1`, `send_orchestration_summary.ps1`.

## What is missing
- `TELEGRAM_BOT_TOKEN` — **absent** from Executive Brain `.env`.
- `TELEGRAM_CHAT_ID` — **absent**.
- `telegram_is_configured()` → **False**; any send raises `TelegramConfigError`.

## Required env vars (operator sets; never commit these)
```
# Executive Brain .env (gitignored)
TELEGRAM_BOT_TOKEN=<from @BotFather>
TELEGRAM_CHAT_ID=<your chat or group id>
```

## Safest setup
1. In Telegram, message **@BotFather** → `/newbot` → copy the bot token.
2. Start a chat with the new bot (or add it to a group) and send any message.
3. Get the chat id: `https://api.telegram.org/bot<TOKEN>/getUpdates` → read
   `result[].message.chat.id` (or run OpenClaw `resolve_telegram_governance_chat.ps1`).
4. Put both values in EB `.env` (gitignored). Do **not** paste the token into
   chat or commit it. Rotate via BotFather if ever exposed.
5. Verify: `python -c "from brain.integrations.telegram import telegram_is_configured; print(telegram_is_configured())"` → `True`.

## Where EB should call it (already wired)
- `brain/execution/runner.py::_notify_status` already calls
  `notify_status_update` on execution start / block / pass / fail (wrapped in
  try/except so missing config never breaks a run).
- For production-session milestones, call `notify_status_update("phase complete",
  [...])` after: each phase completion, each commit, acceptance pass/fail, each
  recovery escalation, each major blocker.

## Sample command (once configured)
```python
from brain.integrations.telegram import notify_status_update
notify_status_update("Phase 1.1 complete", ["acceptance: GREEN", "notebook 13->15", "commit 06b8582"])
```
Or via OpenClaw (governed; privilege promotion required):
```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\OpenClaw\scripts\send_telegram_governance_summary.ps1 -Summary "Phase 1.1 GREEN"
```

## Status
**Telegram = NOT configured → using local `progress_updates.md`.** Provide the
two env vars to enable live Telegram updates; no code changes needed.
