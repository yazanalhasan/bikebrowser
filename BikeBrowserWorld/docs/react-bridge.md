# React Bridge

Godot sends typed events with `window.parent.postMessage`.

Godot to React:

```json
{
  "type": "quest_started",
  "questId": "chain_repair",
  "timestamp": "2026-05-12T00:00:00.000Z"
}
```

```json
{
  "type": "reward_intent",
  "source": "godot",
  "domain": "mechanics",
  "questId": "chain_repair",
  "amount": 1,
  "currency": "allowance_usd",
  "label": "Chain repair mission",
  "idempotencyKey": "godot:chain_repair:inspect_chain:v1",
  "timestamp": "2026-05-12T00:00:00.000Z"
}
```

React to Godot:

```json
{
  "type": "hydrate_save",
  "saveKey": "bikebrowser_godot_test_save",
  "save": {},
  "timestamp": "2026-05-12T00:00:00.000Z"
}
```

Allowed Godot-to-React events:

- `quest_started`
- `reward_intent`
- `save_requested`
- `debug_log`

Allowed React-to-Godot events:

- `hydrate_save`
- `settings_update`
- `reward_balance`

React validates events in:

```text
src/renderer/godot/bridgeEvents.js
```
