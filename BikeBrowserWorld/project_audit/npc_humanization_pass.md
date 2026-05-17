# NPC Humanization Pass

Generated: 2026-05-15

## Scope

This pass stayed inside the vertical-slice dialogue and presentation layer. It did not change DialogueManager ownership, QuestRegistry ownership, region structure, save systems, or runtime architecture.

Touched areas:

- `Data/dialogue/*.json`
- Short mission-facing copy in `Data/missions`
- Existing interaction feedback strings
- Tiny existing NPC idle motion in `Systems/Interactions`

## Dialogue Philosophy

NPCs now speak less like tutorial systems and more like neighbors with habits, patience, and local knowledge. Educational meaning is still present, but it is carried through observations:

- bikes complain before they fail
- safety checks are calm habits
- repairs belong to people, not just objects
- the desert and river reward slow attention

The pass prefers short, readable lines with implied next steps. NPCs suggest, notice, and invite rather than command.

## Priority NPCs

### Mr. Chen

Mr. Chen was tuned toward calm mentor energy. His lines now emphasize listening, patience, and mechanical intuition:

- "Chains usually complain before they fail."
- "Most repairs start there."
- "That's a mechanic's eye."

His bridge lines now sound more like a thoughtful neighbor looking at storm damage, not a structural engineering popup. Completion language was softened toward quiet pride.

### Mrs. Ramirez

Mrs. Ramirez now feels more like an active neighborhood cyclist. Her safety-check dialogue is shorter, friendlier, and more tactile:

- "Before I ride, I give the bike a quick hello."
- "A thumb press tells you more than you'd think."
- "Notice first, ride second."

Her progression feedback is warm but restrained. She smiles and notices care rather than delivering a reward speech.

### Mom

Mom now sounds protective without becoming a rule screen. The tone is soft, practical, and emotionally safe:

- snacks and helmet by the door
- brave and careful can coexist
- grown-up help is framed as support, not restriction

### Neighbor Kid

The neighbor kid now feels more fidgety and local, with a little self-aware drama around the bike clunk. The line invites investigation without formal quest wording.

### Old Miner Pete

Pete keeps his storyteller quality but loses some lecture density. His lines now use tactile mine language and slower rhythm:

- creaking beams
- eyes adjusting
- rock hints
- "Look first. Then fix."

### Ranger Nita

Ranger Nita now sounds quieter and more observant. The desert identity is stronger, and the guidance is respectful without sounding like a field manual.

### Dr. Maya

Dr. Maya's science lines were softened into field companionship. She still teaches evidence, but through listening to the river and sharing careful attention.

## Interaction Personality

Small existing feedback moments were rewritten:

- safety check responses now feel like tactile observations
- chain repair responses echo Mr. Chen's mentor language
- NPC approach feedback adds small gestures, such as Mrs. Ramirez adjusting a glove or Mr. Chen glancing at the bike

Subtle idle polish was added inside existing interaction scripts:

- Mr. Chen: slow, tiny thoughtful tilt
- Mrs. Ramirez: small relaxed shift
- Old Miner Pete: tiny lean
- Ranger Nita and Dr. Maya: gentle stillness/observation motion

The motion is intentionally minimal and does not create new animation systems.

## Progression Reactions

After the safety check, the HUD now implies Mrs. Ramirez notices Zuzu's care and points naturally toward Mr. Chen. After chain repair, the response is quiet and grounded:

- "The chain runs quiet. Even the garage feels a little easier."

This keeps success warm without turning it into a celebration speech.

## Remaining Rough Edges

- Some non-priority mission descriptions still use direct objective language.
- Factory/helper NPCs outside the requested priority list still have more prototype-like phrasing.
- Visual idle gestures are subtle transform polish, not bespoke sprite animation.
- Full Godot-window playtesting is still needed for final emotional feel and dialogue box pacing.

