# NPC Humanization Pass 2

Generated: 2026-05-15

## Scope

This pass refined emotional persistence without changing DialogueManager, QuestRegistry ownership, save systems, region ownership, or quest architecture.

Touched areas:

- `Data/dialogue/mrs_ramirez_after_*.json`
- `Data/dialogue/mr_chen_after_*.json`
- Existing NPC interaction scripts
- Existing safety and chain interaction feedback
- HUD completion copy for the chain return beat

## Relationship Memory Additions

Mrs. Ramirez and Mr. Chen now choose small follow-up conversations when the player has already completed key first-slice actions.

After the safety check:

- Mrs. Ramirez notices the habit sticking.
- Mr. Chen recognizes that Zuzu is looking before rushing.
- Mr. Chen still starts the chain repair, but frames it as listening rather than assigning work.

After the chain repair:

- Mrs. Ramirez hears the bike running better.
- Mr. Chen acknowledges method, patience, and honest work.
- The garage and neighborhood language now imply that the work changed how the world feels, not just a quest flag.

## Quiet Neighborhood Presence

NPCs now emit restrained ambient presence lines when Zuzu comes near, with a cooldown so the neighborhood breathes between remarks.

Examples:

- "Mrs. Ramirez checks the breeze, then the curb, like she always does."
- "Mr. Chen rests a hand near the bike, just listening."
- "Ranger Nita watches the wind move dust along the trail."
- "Dr. Maya pauses her notes to listen toward the water."

These are not new quest trees. They are small human acknowledgments that make NPCs feel present before direct interaction.

## Mr. Chen Mentorship Refinements

Mr. Chen's new follow-up lines lean into quiet mentorship:

- noticing before fixing
- slowing down
- listening to the bike
- naming Zuzu's method without overpraising

His after-chain response avoids spectacle. He notices that Zuzu watched, adjusted, and tested.

## Mrs. Ramirez Community Refinements

Mrs. Ramirez now feels more rooted in daily riding:

- checking curbs and wind
- noticing bike sound
- treating safety as a lived habit
- encouraging care without sounding like a rule screen

Her follow-up after chain repair references both the bike and Mr. Chen, strengthening the feeling that these neighbors know each other.

## Quiet Space

The pass intentionally kept additions short. Most new lines are one to three conversational beats, and ambient remarks are throttled. Completed stations now give a quiet return line instead of replaying the full task.

## Remaining Manual Playtest Items

- Watch whether ambient proximity lines feel too frequent in the Godot window.
- Confirm that returning to the neighborhood after chain repair naturally invites talking to Mrs. Ramirez and Mr. Chen again.
- Listen for any TTS awkwardness on ellipses or contractions if native TTS is enabled later.
- Consider future tiny memory lines for Mom and Neighbor Kid once their first-slice physical placement is confirmed.

## Validation Notes

Headless validation should confirm:

- all new dialogue files normalize
- no missing quest references
- state-aware dialogue selection does not break NPC interactions
- completed safety and chain hotspots do not regress first-time completion
