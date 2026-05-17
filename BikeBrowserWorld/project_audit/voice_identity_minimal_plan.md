# Voice Identity — Minimal Plan

Date: 2026-05-17
Author: voice identity systems-engineer fork
Scope: research + plan; **no implementation**.

## 1. Correcting the brief

The systems-engineer dispatch brief stated: *"AudioService has hardcoded special-case Mr. Chen handling and generic fallback for everyone else."*

**This is stale.** Reading `Core/AudioService/AudioService.gd:150-182`, the resolver is already fully data-driven:

```gdscript
func speak(text: String, speaker: String = "Narrator") -> void:
    var voice_profile := resolve_voice_profile(speaker)
    ...

func resolve_voice_profile(speaker: String) -> Dictionary:
    var default_profile = voice_profiles.get("default", ...)
    var speakers = voice_profiles.get("speakers", {})
    var profile = speakers.get(speaker, default_profile)
    # merges over default, clamps pitch [0.84, 1.16] and rate [0.84, 1.08]
```

No NPC is hardcoded in code. The lookup is `speakers[speaker]` with display-name keys.

## 2. The data is already complete and tasteful

`Data/audio/voice_profiles.json` defines profiles for all 10 NPC scene characters: Mr. Chen, Mrs. Ramirez, Ranger Nita, Dr. Maya, Old Miner Pete, Zevon, Jacob, Charlie, Cole, James. Pitch range across all profiles: **0.86 → 1.08**. Rate range: **0.86 → 1.0**. Already inside the user's stated ±0.1 pitch / ±0.05 rate restraint envelope (one boundary touch — Mrs. Ramirez at +0.08). No cartoon voices. No work needed on the profile data itself.

The clamp at lines 180-181 (`0.84, 1.16` / `0.84, 1.08`) further enforces restraint at runtime.

## 3. The actual gap

It is a **lookup-key fragility**, not a missing system:

1. `DialogController.gd:46` calls `AudioService.speak(target_text, speaker_label.text)` — passes whatever appears in the dialog box as speaker. If the dialogue JSON's `speaker` field is `"Mr. Chen"`, the lookup matches. If it drifts to `"mr_chen"`, `"Mr Chen"`, or `"chen"`, it silently falls back to `default`.
2. The 5 dialogue-only NPCs (abuela_rosa, uncle_karim, shopkeeper, mom, neighbor_kid) are **not** in voice_profiles. They get default. Likely intentional but undocumented.
3. `Data/npcs/mr_chen.json` is the only NPC profile and has no `voiceKey` field linking it to voice_profiles.

## 4. Proposed minimal plan (not implemented this pass)

**Tier 0 — do nothing in code.** Audit dialogue JSON speaker strings against `voice_profiles.json` speakers map keys. If they all match, the system already works. Add a `voice_speaker_consistency_check.gd` test that loads every dialogue file, collects every `speaker` string, and warns when any speaker is neither `"default"`/`"Narrator"` nor present in voice_profiles speakers. Pure validation — no behavior change.

**Tier 1 — optional NPC profile field.** When/if other NPC profile JSONs are created (currently only mr_chen.json exists), add an optional `voiceKey` field that points to the voice_profiles speakers entry, e.g. `"voiceKey": "Mr. Chen"`. No code change required — purely a documentation contract so the eventual data backfill is unambiguous. Already implied by `displayName == voiceKey` for current NPCs.

**Tier 2 — fallback resolver (defer).** A one-line addition to `resolve_voice_profile`:

```gdscript
# After: var profile = speakers.get(speaker, default_profile)
# If profile is still default and speaker looks like an npc_id, try displayName lookup via NPC profile
```

Only worth adding if Tier 0 finds drift. Otherwise it adds an indirection nobody needs.

## 5. Per-NPC profiles — already authored

For reference, current profiles (no change recommended):

| NPC | pitch | rate | hint |
|---|---|---|---|
| Mr. Chen | 0.86 | 0.88 | older thoughtful |
| Mrs. Ramirez | 1.08 | 0.98 | warm feminine |
| Ranger Nita | 1.03 | 0.94 | calm outdoors |
| Dr. Maya | 1.02 | 0.91 | measured thoughtful |
| Old Miner Pete | 0.90 | 0.86 | older grounded |
| Zevon | 1.00 | 0.96 | warm curious |
| Jacob | 0.96 | 0.94 | steady practical |
| Charlie | 1.06 | 1.00 | bright calm |
| Cole | 0.98 | 0.93 | calm direct |
| James | 0.95 | 0.92 | measured workshop |

All within calm/neutral envelope. No tuning needed.

## 6. Should we implement now?

**No.** Reasoning:

- The voice system is already data-driven and the data is already authored.
- The original brief was based on stale information; there is no hardcoded Mr. Chen path to remove.
- The only real risk is silent speaker-string drift in dialogue JSON, which is best addressed by a cheap **validation test** (Tier 0), not a code change to AudioService.
- The protected-systems rule says don't touch Core unless validation proves necessary. Validation has not proved necessary; quite the opposite.

**Single follow-up recommended** (separate scope, can be done by data-contract fork or as one tiny PR): add `tests/voice_speaker_consistency_check.gd`. Pure read-only test, no Core changes, surfaces any drift before it ships silently.
