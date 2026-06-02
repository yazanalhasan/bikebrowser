# Educational Value Audit — Phase 12 (Learning Experiences, Graded)

**Question (gameplay ignored):** What *learning* experiences currently exist
in the live `src/game/` runtime? Grade them. Separate real in-runtime
learning moments from the design-doc curriculum that isn't implemented.
**Rule:** runtime > docs; implementation > architecture.

---

## Real in-runtime learning moments (what a child actually learns by doing)

### 1. "Different materials behave differently under load" — UTM bench  ★ best evidence-of-learning
- **Moment:** click the UTM, watch each sample's rectangle scale/rotate by its
  `deformation` and read its band (`MaterialsLabSystem.js:19-39`;
  `NeighborhoodScene.js:891-901`). The notebook card states the concept:
  *"stiffness, strength, brittleness, and usefulness are not the same thing"*
  (`act1NotebookEntries.js:9`).
- **Why it counts:** a concrete, repeatable, visual mapping from properties to
  observable behavior. This is genuine materials-science intuition.
- **Caveat:** one click tests all four (`Act1RuntimeSystem.js:173`); the child
  doesn't predict first, so it's "observe a comparison" not "test a
  hypothesis."
- **Grade: B+** (real, concrete, visual concept transfer).

### 2. "Don't build on untested/weak material" — evidence-gated bridge  ★ strongest mechanic
- **Moment:** the plan is **refused** until all 4 materials are tested, and a
  scrap-only plan is **rejected with a reason**
  (`ConstructionSystem.js:18-27`); the payoff line names the lesson —
  *"You did not guess. You tested, then built."* (`:47`).
- **Why it counts:** the rule (evidence precedes action) is enforced by code,
  not narrated. The child cannot proceed by guessing.
- **Grade: B** (real behavioral gate; the "design space" is a single correct
  config, so it's recognition, not open engineering).

### 3. "Desert plants solve heat/water problems; harvest has limits" — ecology field-guide
- **Moment:** observe 4 species; read `heat/water/habitat/harvestEthic` prose;
  notebook card "Harvesting has limits" (`act1Ecology.js`,
  `act1NotebookEntries.js:12`); sign dialogue "Observe first. Take little.
  Leave habitat." (`act1Dialogue.js`, `ecology_helper`).
- **Why it's thin:** static facts revealed on click; no systems behavior, no
  consequence of over-harvest, no organism/population dynamics.
- **Grade: C-** (real ecological-ethics framing; near-zero conceptual depth or
  feedback).

### 4. "Recipes need mixing/drying before you trust them" — chemistry
- **Moment:** run 1 of 2 hard-coded recipes; get a canned mix→wait→test string
  (`ChemistrySystem.js:18-26`).
- **Grade: D** (the *idea* of process-before-trust is present; there's no
  actual chemistry to learn — no reagents, variables, or failure).

### 5. Externalized memory / evidence literacy — Field Notebook
- **Moment:** 16 evidence cards accrete as the child acts
  (`NotebookSystem.js`; `act1NotebookEntries.js`, 16 entries); NPCs say the
  notebook "helped us trust the repair" (`spanish_trust` dialogue).
- **Why it counts (mildly):** models "record evidence, then use it" — a real
  meta-skill — but the game never makes the child *apply* a recalled card.
- **Grade: C** (good habit modeled; not exercised/assessed).

### 6. Language-as-relationship — Spanish/Arabic
- **Moment:** two NPC interactions deliver a greeting + translation in context,
  not as a quiz (`LanguageSystem`; `act1Dialogue.js` `spanish_trust`,
  `arabic_welcome`).
- **Grade: C-** (authentic exposure; 1 phrase each, no practice/production).

---

## Grade summary (in-runtime learning value)

| Learning experience | Mechanic depth | Feedback | Concept transfer | Grade |
|---|---|---|---|---|
| Materials under load (UTM) | comparative test + visual | visible deformation | strong | **B+** |
| Evidence-gated building | code-enforced gate | refusal + reason | strong (narrow) | **B** |
| Notebook / evidence literacy | accretion tracker | passive | medium | **C** |
| Ecology / harvest ethics | static field-guide | none | low | **C-** |
| Chemistry process | 2 canned recipes | canned string | low | **D** |
| Language as relationship | 2 contextual phrases | none | low | **C-** |
| Prediction / hypothesis | — not implemented — | — | — | **F** |
| Teaching-back | — not implemented — | — | — | **F** |

**Overall in-runtime educational value: C+/B-.** One genuinely good idea
(test-then-build, realized as the UTM bench + the evidence-gated bridge)
carries the whole experience; everything else is thin static content.

---

## Design-doc curriculum that is NOT implemented (do not credit as learning)

These are well-written but produce **zero runtime learning behavior**:
- **5-tier hierarchy with Predict & Teach mechanics** — the Predict step
  (capture hypothesis → compare) and Teach tier are **absent from code**
  (`educational_progression_framework.md`).
- **Grade 2→3→4 standards mapping + 100 Chapter-1 quests** —
  `data/curriculum/chapter-map.md`, `chapter1_quest_set_v1.md`,
  `quest_taxonomy.md`. The live game ships **10 quests**
  (`act1Quests.js`), not 100.
- **Sonoran biological knowledge graph** — `data/sonoran/plants.sonoran.js`
  (12 `draft_unverified` plants) + ethnobotany/phytochemistry/pharmacology
  substrates. **0 JS importers; 0 runtime presence.**
- **Biology Stage 2/3 (organism design, ecosystem simulation)** — explicit
  **throwing stubs** in the off-path renderer tree
  (`src/renderer/game/systems/biology/index.js:158-270`). No learner ever
  designs an organism or runs an ecosystem.

**Net:** the *real* educational value lives in one tight loop (predict-the-
materials theme → comparative UTM test → evidence-gated bridge build). The
ambitious multi-disciplinary biology curriculum exists only as documents and
off-path stubs and should not be counted as delivered learning.
