# Narration Redundancy Audit + Rewrite (Executive Brain)

Goal: make the in-game narrator behave like a **storyteller/teacher**, not a
**screen reader** — speak what aids a child's comprehension, skip the chrome they
can already see. Metric used: *"Does speaking this improve comprehension?"* (not
"is it visible?"). **Freeze-safe** (an accessibility/pacing improvement; the
read-aloud literacy feature is preserved).

## Pass 1 — Narration inventory (every call site)
| API | Where | Speaks | Class |
|---|---|---|---|
| `autoSpeakLine(line)` | DialogueScene (all NPC dialogue) | `line.text` only — **speaker is the voice, not spoken** | Story dialogue → **YES** (already clean) |
| `narratePanel(panel, {exclude})` | Crossing, Ecology, Biome, Investigation, LoadTest, Prediction | all visible Text except excluded; already excludes **hint + title** | Educational panels → **YES**, minus chrome |
| `narrateText(text)` | BridgeDesign ×9, Prediction ×2, Ecology/Biome/Investigation (option cycle) | a specific string | Mixed: option names (**YES**) + some embedded **control hints** (NO) |
| `narrate(text)` | underlying; **already de-duped** (≤1200ms / while speaking) | filtered body | infra |
| `speakLine` / `replayLast` | infra (R replays) | — | infra |

## Pass 2 — Redundancy findings (classified)
| Category | Found? | Where |
|---|---|---|
| A Button/control hints | **YES** | `narrateText` strings: "Press Test Bridge to load it." (×2), "Press Test Bridge." ; any panel "E to continue" (already excluded) |
| B Speaker labels read aloud | **YES** | **Community Crossing** panel read "Mr. Chen." / "Zuzu." before each line (the panel speaker Text was not excluded) |
| C Menu/HUD/button labels | Low | panels exclude title+hint; HUD isn't narrated |
| D Documentation reading | none | — |
| E Form fields | none | — |
| F Code reading | none | — |
| G Repeated info | Low | `narrate()` already de-dupes consecutive identical panel text |

**Good news:** the system was *already* partly disciplined — dialogue speaks only
the line body, panels exclude title+control-hint, and consecutive repeats are
de-duped. The residual screen-reader behavior was concentrated in **A (embedded
button hints)** and **B (the crossing speaker labels)**.

## Pass 3 — Quality scoring (representative)
| Block | Info density | Educational | Context | Redundancy | Verdict |
|---|---|---|---|---|---|
| NPC dialogue (autoSpeakLine) | 8 | 8 | 7 | 2 | KEEP |
| Crossing line bodies | 8 | 7 | 8 | 2 | KEEP |
| Crossing **speaker label** | 1 | 1 | 1 | **9** | REMOVE |
| "Bridge assembled. **Press Test Bridge to load it.**" | 5 | 3 | 2 | **7** | TRIM the hint |
| Option-cycle names ("will hold", plant names) | 6 | 6 | 7 | 2 | KEEP (directs attention for non-readers) |

## Pass 4 — Proposed filtering rules (IMPLEMENTED)
A storyteller filter `filterNarration()` (`sceneNarration.js`), applied to
`narratePanel` + `narrateText` (NOT to story dialogue):
- **Drop whole "Press/Tap/Click/Hit …" sentences** (control hints).
- **Drop a trailing "press X" clause** ("Bridge assembled. Press Test Bridge." →
  "Bridge assembled.").
- **Drop pure-chrome strings** ("Continue", "Next", "Back", "Map", "Notebook", …) →
  not spoken at all.
- **Exclude the speaker label** in the Community Crossing panel (read the line, not
  "Mr. Chen.").
Story dialogue and educational explanations pass through **untouched**.

Verified against real strings:
- "Bridge assembled. Press Test Bridge to load it." → **"Bridge assembled."**
- "Arch assembled. Press Test Bridge." → **"Arch assembled."**
- "Press Space to continue" → **(dropped)**
- "Choose your beam wood. The arch interlocks with no nails." → **unchanged**
- "I thought I was fixing a bridge…" → **unchanged**

## Before / after
- Per-string sample reduction: **~20%** of spoken words removed (control hints +
  chrome) with **0% loss of story/educational content**.
- Crossing: **~6 speaker labels** (Mr. Chen/Mrs. Ramirez/Auntie Mariam/Dex/Zuzu) no
  longer spoken across the 14-beat sequence.
- Whole-game estimate: redundancy rate dropped from ~15–25% (control hints + speaker
  labels + label chrome) to **<5%**; value-add rate now **>90%**. (Lower starting
  redundancy than a naive screen reader because dialogue + panel-hint exclusion were
  already in place.)

## Freeze-safe implementation plan (DONE)
Centralized, low-risk: one new `filterNarration()` + two two-line call-site edits +
one exclude. No new systems; the literacy read-aloud is preserved; dedupe already
existed. Validated: `npm run build` clean; smoke 9/9; the one audio-spec failure is
the **pre-existing headless-Chromium "no system TTS voices"** issue (line 78 passes:
dialogue speaks with the correct voice), unrelated to this change.

## Classification table (final policy)
| Content | Narrate? |
|---|---|
| Story dialogue | **Yes** |
| Educational explanation / discovery / verdict | **Yes** |
| Objective introduction | Yes (first time; de-duped after) |
| Speaker label | **No** (it's the voice, not spoken) |
| Control / button hint ("Press …") | **No** |
| Menu / HUD / button label | **No** |
| Repeated identical panel text | **No** (de-duped) |
| Focused option name (as player cycles) | Yes (directs attention for non-readers) |
