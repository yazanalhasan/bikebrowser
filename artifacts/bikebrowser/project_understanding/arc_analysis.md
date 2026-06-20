# arc.md Analysis — Authoritative Vision (Executive Brain)

Source: `arc.md` (1,946 lines, the canonical vision). **arc.md wins all conflicts.**
This is Executive Brain's parsed understanding; every BikeBrowser decision is
evaluated against it.

## Executive summary
BikeBrowser+ is an **educational 2D Phaser game** that teaches **systems thinking**
by letting one core toolkit scale upward: a child repairs bikes in the Sonoran
Desert, expands through six regionally-grounded Earth biomes (each a real culture,
language, resource identity), and ultimately engineers life on an alien planet.
The thesis: children learn complex science best when abstract systems appear first
as **useful tools in a concrete world**, then are reused at rising complexity.

## Core gameplay loop
The **Universal Testing Machine (UTM) pattern** is the master mechanic and applies
to *every* system: take a real scientific/engineering instrument → simplify it into
a visually understandable mechanic → let the child discover the principle by using
it to solve an actual problem. Biology mirrors it: **Observe → Test → Model →
Predict → Engineer.**

Two canon disciplines govern everything:
- **Relationships, not facts.** Never teach trivia/quizzes/encyclopedia-completion
  (that is the anti-pattern, halt-and-surface). Teach relationships between things.
- **Prediction precedes intervention.** The player may not modify a system until
  they can accurately predict it. This is the unifying form of "test before you
  trust." A feature that lets intervention precede prediction is a halt trigger.

## Educational philosophy (permanent ARC rule)
Five rising levels: **(1) Observe → (2) Explain → (3) Predict → (4) Engineer →
(5) Teach.** The player is rarely asked "what's the answer?" — they are asked
"what will happen?" and eventually "can you teach someone else why?" The acts
overlay rising cognitive demand: **Act 1 = Observe-dominant**, Act 2 = Explain,
Act 3 = Predict→Engineer (every act still contains all five).

Standards posture: **Arizona Academic Standards = minimum baseline**; advanced/
gifted frameworks are enrichment/optional and **may never be required**. The game
never shows school-style questions; it tags quests with reasoning domains instead.

## World structure
- **Mechanical spine — seven vehicles:** bike → e-bike → motorcycle → car → boat →
  plane → spacecraft. Player **repairs then builds** each; each adds exactly one new
  engineering domain (mechanical → electrical → combustion → systems-integration →
  fluid → aero → vacuum/life-support). The vehicle is also the literal key that
  gates map reach. All test rigs are **portable carry-forward systems** — nothing
  is discarded between rungs.
- **Biology spine — seven domains** paralleling the vehicles (ecology, ethnobotany,
  phytochemistry, pharmacology, cellular, molecular, systems biology), each via the
  Observe→Predict→Engineer loop.
- **Geography/language = the supply chain:** seven regions / six committed languages
  (Spanish, Arabic, Quechua, Turkish, Kurdish/Persian, Swahili, Mandarin) answer
  *where* materials and knowledge come from. Language is **access to relationships,
  trade, trust, and knowledge** — never a vocabulary quiz.

## Progression structure (acts)
- **Act 1 — Ground (Ch 1–4: bike, e-bike, motorcycle, car).** Starts in the Sonoran
  Desert (the shipped foundation, "Chapter 1") and grows overland. **This is the
  current build's scope.**
- **Act 2 — Sea & Air (Ch 5–6: boat, plane).** Ocean/coastal + intercontinental
  regions; spacecraft subsystem groundwork begins.
- **Act 3 — Space (Ch 7: spacecraft) + terraforming/life-engineering** on the alien
  planet.

## Act 1 (current focus) — canonical detail
- **Setting:** Sonoran Desert (Phoenix/Tempe/Scottsdale): washes, saguaros, palo
  verde, mesquite, creosote, dry riverbeds, neighborhood streets, garages, a broken
  bridge connecting two neighborhoods. Local, grounded, resource-constrained.
- **Player goal:** repair/upgrade/use a bike to explore, **reconnect separated
  areas** (the broken bridge is the early structural challenge — "emotionally
  understandable, physically visible, mechanically expandable"), help NPCs, unlock
  the first engineering pathway.
- **Learns:** bike mechanics; desert ecology (heat/water/shade/monsoon); foraging +
  harvest ethics; basic chemistry (mixing/extraction/pH/drying); dose-response;
  materials basics; construction (beams/triangles/load/stability); fog-of-war map;
  community trust/quests/trade/cultural access.
- **Languages:** English (UI), Spanish (natural to AZ), **Arabic** (first
  intentional non-English layer, via a family/mentor character).
- **Completion:** bike good enough to reach the wider map; bridge reconnected; basic
  material testing demonstrated; ecology/foraging/chemistry quests done; enough NPC
  trust to unlock broader regions; first "systems upgrade" / spacecraft clue.

## Embedded values (must be honored)
Respect for real science; learning by doing; **cultural authenticity not decoration**;
ecology/stewardship over extraction; dose-response thinking; **failure as feedback,
not punishment**; language as relationship; progression repair→construction→
experiment→design→simulation→creation.

## Risks (Executive Brain assessment)
1. **Scope vs. ship.** arc.md is enormous (3 acts, 7 vehicles, 7 biology domains, 6
   languages). The *shippable unit now* is **Act 1 / Chapter 1 (Sonoran Desert
   bike)**. Risk = scope creep away from a finishable Act-1 demo. Mitigation: treat
   Act 1 as the release target; everything else is roadmap.
2. **Cultural-content guardrail.** Spanish/Arabic (and later tracks) are committed
   canon, but *specific* indigenous/religious/marginalized content **requires a
   human-authored design brief** — agents must NOT generate it unilaterally. Our
   current Arabic content (Auntie Mariam, Levantine warmth) stays light/relational;
   deeper cultural specifics need human sign-off.
3. **Anti-pattern drift.** Any slide toward quizzes/trivia/fact-memorization
   violates "relationships, not facts." Our heart-beats + side quests stay on the
   right side (they teach via story/prediction).
4. **"Prediction precedes intervention"** must be preserved as we add content (e.g.
   the Dex Prediction Duel correctly makes the player predict before judging).

## Unresolved questions (from arc.md §6 + our read)
- Exact boundary of Act 1 / Chapter 1 vs. the e-bike chapter (where does the
  shippable demo end?).
- Knowledge State System is **unbuilt and gated** (§8.5) — our notebook is the
  closest existing surface; how/when it becomes the formal Knowledge State.
- Act 3 language decision pending; not relevant to Act 1.
- Biology workbench observation-scale modes are largely future; Act 1 only needs
  surface ecology (which we have).

## Decision test (apply to every change)
> "Does this improve the player's emotional connection to the world while
> preserving the STEM-adventure vision in arc.md — teaching relationships (not
> facts) via Observe→Predict→Test→Trust-Evidence, with prediction before
> intervention?"
