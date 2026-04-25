# tts-dialog-integration — NEEDS_REVISION

- **Verdict by:** code-quality-reviewer (sonnet override, 2nd pass)
- **First reviewer pass:** `.claude/swarm/receipts/code-quality-reviewer-2026-04-25T19-20-00Z.json` (FAIL — retracted; CRITICAL was misattribution of pre-existing user edit to physics-question path)
- **Authoritative reviewer receipt:** `.claude/swarm/receipts/code-quality-reviewer-2026-04-25T19-45-00Z.json`
- **Worker receipt:** `.claude/swarm/receipts/tts-dialog-integration-2026-04-25T19-12-46Z.json`
- **Status in state.json:** `partial` (NOT in `completed[]`)

CRITICAL/scope and other PASS checks all clean — only one HIGH issue.

## The fix

`src/renderer/game/GameContainer.jsx:60` — `HONORIFIC_RE` strips `mr|mrs|ms|dr|ranger`. The actually-landed `CHARACTER_GENDER` keys in `npcSpeech.js` keep `mr_`/`mrs_` as part of the key:

| Speaker input | Resolver output (current) | Actual key | Match? |
|---|---|---|---|
| `"Mrs. Ramirez"` | `"ramirez"` | `mrs_ramirez` | MISS |
| `"Mr. Chen"` | `"chen"` | `mr_chen` | MISS |
| `"Dr. Maya"` | `"maya"` | `river_biologist` | MISS (unreachable anyway) |
| `"Ranger Nita"` | `"nita"` | `desert_guide` | MISS (unreachable anyway) |
| `"Zuzu"` | `"zuzu"` | `zuzu` | HIT |

Currently the resolver only ever matches Zuzu, leaving the upstream gender map effectively unreachable for every named adult NPC.

**Fix:** drop `mr|mrs|ms|dr` from `HONORIFIC_RE`. Keep only role-style prefixes that are NEVER part of a `CHARACTER_GENDER` key (`Ranger`, plus similar future ones).

```js
// Before
const HONORIFIC_RE = /^(mr|mrs|ms|dr|ranger)\.?\s+/i;
// After
const HONORIFIC_RE = /^(ranger)\.?\s+/i;
```

After the fix:
- `"Mrs. Ramirez"` → `"mrs_ramirez"` HIT (female voice)
- `"Mr. Chen"` → `"mr_chen"` HIT (male voice)
- `"Ranger Nita"` → `"nita"` (still a miss — `desert_guide` is unreachable from display name alone, acceptable per spec)

The dialog-TTS effect body, `autoSpeak()` call, choice format, and `c.label` field are all correct and need no changes.

## Note on the spec

The agent definition (`.claude/agents/tts-dialog-integration.md`) explicitly told the worker to strip `Mr/Mrs/Ms/Dr/Ranger`. That instruction contradicted the actual `CHARACTER_GENDER` keys landed by tts-voice-config. The keys are authoritative; the spec was wrong. The worker correctly followed the spec. They lose nothing on receipt accuracy or scope; just need the regex tweak.
