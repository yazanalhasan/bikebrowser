---
name: tts-dialog-integration
description: Wires the TTS voice configuration into the dialog/quiz UI in GameContainer.jsx. Fixes the speaker-name to npcId mismatch so gender lookup succeeds, and appends answer-choice text to the TTS utterance so quiz options are read aloud (currently only the question stem is spoken in dialog quizzes; physics-question quizzes already work). Strictly scoped to the dialog-TTS effect block in GameContainer.jsx — does not touch any other part of that file.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
memory: project
maxTurns: 20
---

You own the dialog-side TTS integration. The voice configuration layer
(`tts-voice-config` agent) handles gender mapping; you wire it into the
UI so the right voice + right text actually get spoken.

## Files in scope

- `src/renderer/game/GameContainer.jsx` — **only** the dialog-TTS effect
  block around lines 485-497 (per the audit). Do NOT modify any other
  block in this file. If your fix requires touching another block,
  surface it in the receipt as a NEEDS_REVISION cause rather than
  expanding scope.

## Out of scope

- `src/renderer/game/services/npcSpeech.js` (owned by tts-voice-config)
- `src/renderer/game/data/npcProfiles.js` (owned by tts-voice-config)
- Anything under `src/renderer/game3d/`
- The physics-question TTS path at `GameContainer.jsx:330-352` — that
  already speaks both stem and choices correctly; do not touch it.

## Context — the two gaps

Per the audit:

**Gap 1: speaker→npcId mismatch**
At line ~495, the dialog TTS code does:
```js
autoSpeak(textToSpeak, dialog.voicePreference, {
  npcId: dialog.npcId || dialog.speaker?.toLowerCase()
});
```
When `dialog.npcId` is missing it falls back to lowercased speaker
display name (e.g., `"Mrs. Ramirez"` → `"mrs. ramirez"`). The
`CHARACTER_GENDER` map keys are snake_case (`"mrs_ramirez"`), so the
fallback never matches, and gender selection fails silently.

**Gap 2: dialog quiz choices not spoken**
The dialog branch only speaks the stem (`dialog.text` /
`dialog.aiDialogue?.spokenLine`). When `dialog.choices` is present
(an array of choice objects with a `label` field per the audit), the
choices are rendered to the screen at lines 1018-1031 but never spoken.
The physics-question path at lines 337-344 already does this correctly
("Option 1: <text>. Option 2: <text>.") — match that pattern.

## First cycle goal

1. **Read the relevant block** at `GameContainer.jsx:485-497` plus the
   physics-question reference at `GameContainer.jsx:330-352`. Confirm
   the audit's understanding before changing anything.

2. **Build a speaker-name → npcId resolver** as a small helper at the
   top of the file (or inside the effect — your call). It should:
   - Accept a display name like `"Mrs. Ramirez"` or `"Old Miner Pete"`
   - Return the snake_case key: `"mrs_ramirez"`, `"old_miner_pete"`
   - Strip honorifics (`Mr.`, `Mrs.`, `Ms.`, `Dr.`, `Ranger`) BEFORE
     snake-casing — this matches how `CHARACTER_GENDER` keys are
     constructed in npcSpeech.js (e.g., `desert_guide`, not
     `ranger_nita`)

   Important: the resolver does NOT need to be perfect for every NPC.
   Its job is to convert the dialog's `speaker` field into something
   that has a fighting chance of matching `CHARACTER_GENDER`. When in
   doubt, the upstream agent's `'default'` fallback covers the miss.

3. **Update the `npcId` fallback** at line ~495 to use the resolver
   when `dialog.speaker` is the only signal:
   ```js
   npcId: dialog.npcId || resolveSpeakerToNpcId(dialog.speaker)
   ```

4. **Append choice text to the TTS string** when `dialog.choices`
   exists. Match the physics-question format precisely:
   `"Option 1: <choice 1 label>. Option 2: <choice 2 label>. ..."`.
   Append AFTER the stem with a sentence break (period + space) so the
   utterance reads naturally:
   ```
   <stem>. Option 1: <choice>. Option 2: <choice>. Option 3: <choice>.
   ```
   The choice array element shape is `{ label, correct? }`; use
   `c.label` (not `c.text` — verify by reading the rendering block at
   lines 1018-1031 first).

5. **Do not change the `speak()` / `autoSpeak()` call signature.** Only
   change the arguments you pass.

## Standards

- JavaScript only — no TypeScript.
- Do not introduce new top-level dependencies.
- Do not change any other behavior in GameContainer.jsx — leave
  unrelated state, effects, and rendering alone. The reviewer will
  flag any out-of-scope edit as a CRITICAL scope violation.
- Do not refactor `speak()` callers elsewhere in the file. Your fix is
  localized.

## Verification hints (no automation required this cycle)

After your changes:
- A dialog with `speaker: "Mrs. Ramirez"` and no `npcId` should still
  resolve to `"mrs_ramirez"` and pick the female voice.
- A dialog with `choices: [{label:"A bike chain"},{label:"A motor"}]`
  should produce a TTS utterance like:
  `"How does power reach the wheel? Option 1: A bike chain. Option 2: A motor."`

You don't need to write tests this cycle (no test infra exists yet),
but list manual verification steps in the receipt notes.

## Receipt requirement

Write to: `.claude/swarm/receipts/tts-dialog-integration-<ISO timestamp>.json`

Conform to `.claude/swarm/receipt-schema.json`. In `notes`:
- The exact line range you modified in GameContainer.jsx
- The shape of the resolver helper (signature + what it returns)
- The exact format string you used for choice TTS (so a reader can
  audit consistency with the physics-question path)
- Manual verification steps (3-5 specific dialogs to test)

If your scope creeps to other files or other blocks of GameContainer,
STOP and write the receipt with `status: "blocked"` plus a blocker
description. Do not silently expand scope.
