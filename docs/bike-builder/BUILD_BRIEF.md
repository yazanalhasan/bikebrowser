# BUILD BRIEF: Bike Builder, Phase 0+1 (foundations + bicycle drivetrain & brakes MVP)

Read the whole brief before starting. It is self-contained. Companion files (copy them into the repo under `docs/bike-builder/`): `PLAN.md` (full plan) and `REUSE_RESEARCH.md` (sources, licenses, verdicts).

## 1. Goal
Build a PCPartPicker-style builder at `/builder` on bike-browser.com whose core job is to tell you, **before you buy**, whether bicycle parts fit together. It must be:
- **Practical**: correct, cited verdicts a real adult home mechanic can trust for real builds.
- **Educational**: a kid learning layer for the owner's son (about 9), with plain explanations of *why* parts fit or don't, and nothing to buy.

Owner: Dr. Yazan Al-Hasan. Decisions are recorded in PLAN.md.

## 2. Hard constraints (non-negotiable)
1. Repo `yazanalhasan/bikebrowser`. **Branch off `main`** (May 9 build, commit 0af2f8f or later) as `feat/bike-builder-phase1`. Do not base this on the Act 1 art PR stack (#9/#10/#12).
2. **Open a PR into `main`. Never merge it. Never deploy.** Pushing to `main` triggers `.github/workflows/deploy-cloudflare-pages.yml` (production). Don't push to `main`, don't run `workflow_dispatch`, and don't run `wrangler pages deploy`.
3. **No secrets.** Don't read, add or print API keys or tokens. Don't touch `wrangler.toml`/`wrangler.jsonc` bindings or GitHub secrets.
4. **No shopping in this phase:** no prices, no buy links, no affiliate links, no retailer search links and no outbound links inside the builder. The only links allowed are source citations, shown in parent/adult view.
5. **Kid-safe tone everywhere:** friendly, encouraging, no scare copy, no brand hype.
6. **Don't break anything:** all existing routes work, `node --test tests/*.test.mjs` passes (every test that passes on main today) and `npm run build` is clean. Don't modify the game, the Act 1 art or the language/culture content.
7. Data storage: **local JSON seed files are acceptable and preferred for phase 1.** Design the schema so it maps 1:1 onto Cloudflare D1 tables later (include a `docs/bike-builder/d1-schema.sql` draft), but don't create D1 or any Cloudflare resource.
8. Licensing: follow REUSE_RESEARCH.md. Ship only facts with citations, MIT code with its notice kept, or CC BY data with attribution. **Don't ship** Bike Book (CC BY-SA), Bike Index ODbL data, Reference Source records verbatim, BikePartPicker data, scraped geometry data or any manufacturer PDF. Don't commit PDFs.
9. Node 22 (CI version). Tests must run under the existing `node --test tests/*.test.mjs` with no new global tooling. Write the engine as plain ESM `.js` with JSDoc types (plus `.d.ts` if useful), or TS that Node 22 can run without a build step. Don't add bun or tsx as a test requirement.

## 3. Scope

### 3.1 Phase 0: foundations (no visible UI change)
- `src/builder/standards.js`: enumerations with aliases and kid-friendly descriptions: `freehub` (HG-S/M/L/L2, MicroSpline, XD, XDR, Campagnolo, N3W, Linkglide-note), `speeds`, `actuation_family` (shimano-road-6-9-10, shimano-road-11, shimano-tiagra-4700, shimano-mtb-10-11, shimano-mtb-12, shimano-linkglide/cues, sram-1to1-exact, sram-x-actuation-11, sram-eagle-12, sram-axs, shimano-di2-12-wireless, shimano-di2-etube, campagnolo-mech-11/12/13, campagnolo-eps, microshift-advent etc.), `e_ecosystem`, `hanger` (standard, UDH, direct-mount), `brake_type` (rim-caliper, v-brake, cantilever, mechanical-disc, hydraulic-disc), `caliper_mount` (post-mount, flat-mount, IS), `rotor_mount` (6-bolt, center-lock), `brake_fluid` (mineral, DOT), `chain_type` (standard, flattop, t-type, linkglide).
- `src/builder/engine.js`: pure functions, no React and no DOM:
  - `checkBuild(build, catalog, rules) → { verdict: 'compatible'|'warnings'|'incompatible', findings: Finding[] }`
  - `filterCandidates(slot, build, catalog, rules) → Part[]` (the compatibility filter)
  - `Finding = { ruleId, severity: 'incompatible'|'warning'|'cannot_verify', slots: [a,b], partIds, messageAdult, messageKid, fix?, sourceUrl }`
  - **Missing or unknown data never passes silently.** It yields `cannot_verify` naming the missing field.
- `data/builder/rules.json`: **rules as data**. Each rule: `id, version, slots, severity, predicate` (declarative ops such as `eq`, `in`, `lte`, `capacity_sum_lte`, `same_family`, `same_ecosystem`, `requires_standard`, `adapter_allowed`), `messageAdult`, `messageKid`, `fix`, `sourceUrl`, `sourceRef`, `provenance: 'manufacturer_spec'|'industry_standard'|'practitioner_rule'`.
- Fix the existing `src/compatibility/engine.js|ts` pairing bug (rules are run on the wrong part pairs, e.g. voltage checked motor-vs-controller) in a minimal way, with a test, or document why it was left alone. Leave `src/services/ebayService.js` (dead eBay Finding API) unused and note it in the PR. Don't delete it in this PR.

### 3.2 Phase 1: bicycle drivetrain & brakes MVP
**Slots:** rear wheel/hub (freehub only), cassette, chain, rear derailleur, shifter (rear), crankset/chainrings (tooth counts only), front derailleur (2x only), brake levers, brake calipers, rotors (size + mount), frame (hanger type, brake mount, max rotor). Mark frame/fork as "minimal" in phase 1.

**Rules to implement (minimum), each with a cited source:**
1. Cassette freehub ↔ hub driver (with the XD-on-XDR 1.85 mm spacer exception and Shimano HG-L 1.85 mm spacer cases → `warning` "needs spacer"). Source: Shimano C-731 https://productinfo.shimano.com/en/compatibility/C-731 and SRAM XD/XDR https://support.sram.com/hc/en-us/sections/6129171904667
2. Speed count: shifter = RD = cassette = chain (known cross-speed exceptions as data, e.g. Shimano 6-9s RDs interchangeable).
3. Actuation family: shifter ↔ RD. Source: https://bike.bikegremlin.com/1278/bicycle-rear-derailleur-compatibility/ plus manufacturer docs, and pull-ratio values from boothinator/derailleur-analysis (MIT).
4. RD max cog: `cassette.largest ≤ rd.maxCog` → OK. Over spec by ≤ 8T **and** a hanger extender is in the build → `warning` with fix text. Otherwise → `incompatible`, with the fix "add a hanger extender (e.g. Wolf Tooth GoatLink/RoadLink style) and set the B-screw, or choose a long-cage RD rated for the cog". Mark the threshold `provenance: practitioner_rule`. Also check Shimano's *minimum* largest cog where published.
5. RD total capacity: `(bigRing − smallRing) + (bigCog − smallCog) ≤ rd.capacity`, and front difference ≤ `rd.maxFrontDiff` on 2x. Source: https://support.sram.com/hc/en-us/articles/6496285693339 and https://wisewheeling.com/rear-derailleur-capacity/
6. Electronic ecosystems: Di2 / AXS / EPS never mix. Generation checks as data. Source: SRAM AXS map https://www.sram.com/globalassets/document-hierarchy/compatibility-map/road/axs-components-compatibility-map.pdf
7. Full Mount RD (Eagle Transmission, XPLR AXS) requires a UDH frame. Source: https://www.sram.com/en/learn/understanding-udh-and-full-mount
8. Chain type: Flattop / T-Type / Linkglide only with their systems.
9. Brakes: rim vs disc vs frame; lever ↔ caliper same system and **same fluid** (mineral vs DOT never mixed. Shimano/Campagnolo mineral, most SRAM DOT, SRAM Maven mineral); caliper mount vs frame mount (adapter → `warning`); rotor size ≤ frame/fork max; rotor mount vs hub (6-bolt ↔ Center Lock adapter → `warning`). Source: SRAM hydraulic map https://www.sram.com/globalassets/document-hierarchy/compatibility-map/mtb-and-road-hydraulic-disc-brake-lever-and-caliper-compatibility.pdf and Shimano compatibility PDF.
10. Always-on `cannot_verify` notes: chain length must be sized on the bike; tire/frame clearance isn't checked in phase 1.

**Seed data (about 150 parts, all `review_status: 'draft'` unless the value is copied from a cited manufacturer table):**
- Shimano MTB 9/10/11/12s (Altus, Alivio, Deore, SLX, XT; CUES optional), Shimano road 105/Ultegra 11/12s, SRAM Eagle mechanical 12s (SX/NX/GX), SRAM AXS + Transmission (a few), common cassettes, chains and shifters; hydraulic and mechanical brakes (Shimano MT200/MT401/Deore, SRAM Level/Code/Maven, Tektro, Avid BB7-style mechanical), rotors 140-220 mm, 6-bolt and Center Lock.
- **His son's real bike baseline** (`data/builder/bikes/zuzu-bike.json`): VG Sports 9-speed MTB kit, 11-42T cassette (HG), 9s chain, hanger extender, from `src/services/projectStorage.ts`/`currentProjects.js` (Amazon B09VBNTGCD; store only the name and ASIN as an identifier, **no link or price in the builder**). The existing RD model is **unknown** → slot `owned-unknown` → the builder shows `cannot_verify` and asks a grown-up to enter the model.
- Use the sources in REUSE_RESEARCH.md: manufacturer facts with citation; Pedal Brief road/gravel groupsets (CC BY 4.0, attribution required); derailleur-analysis pull ratios (MIT); patterns/tests ported from isaacrowntree/bike-part-planner (MIT, keep the notice in ported files). Reference Source (https://referencesource.org/bike-drivetrain-groupset-compatibility/) may be used **only as a test oracle/cross-check**, not bundled.
- Every part value: `sourceUrl`, `sourceRef`, `checkedAt`. Add `data/builder/ATTRIBUTION.md`.

**Golden tests** (`tests/bike-builder-*.test.mjs`, at least 25 cases), including:
- **Son's bike, case A:** 9s HG 11-42 cassette + Shimano Alivio RD-M3100-SGS (max 36T, capacity 45T) + 9s Shimano shifter + HG hub + hanger extender in build → overall `warnings`, exactly one max-cog `warning` whose fix mentions the hanger extender and B-screw; capacity OK (31 ≤ 45).
- **Case B:** same without the extender → `incompatible` (max cog).
- **Case C:** Altus RD-M370-SGS (max 34T) + extender → `warning` (8T over).
- **Case D:** RD unknown (baseline) → `cannot_verify`, never `compatible`.
- Shimano Micro Spline cassette on HG hub → incompatible. XD cassette on XDR hub → warning (spacer). XDR cassette on XD → incompatible.
- 12s Shimano shifter + SRAM Eagle 12s RD → incompatible (actuation). AXS pod + Di2 RD → incompatible (ecosystem). Eagle Transmission on non-UDH frame → incompatible.
- 2x 50/34 + 11-34 on an RD with 37T capacity → incompatible (39 > 37). Same on 39T capacity → OK.
- Shimano lever + SRAM DOT caliper → incompatible (fluid). 203 mm rotor on a frame max 180 → incompatible. Center Lock rotor on 6-bolt hub → warning (adapter). Flat-mount caliper on post-mount frame → warning or incompatible per the data.
- Every rule in `rules.json` has a `sourceUrl` and both messages (schema test). Every seed part validates against its category schema (schema test). Every part `id` is unique.
- `filterCandidates('rear_derailleur', …)` for the son's bike returns no RD that fails speed/actuation.

### 3.3 UI: `/builder` (PCPartPicker-style)
- New route in `src/renderer/App.jsx`, plus a tile/link from the Home page and from Build Planner ("Check parts fit"). Lazy-load the page so the main bundle doesn't grow much.
- Layout: bike type picker (Mountain / Road / Gravel; E-bike shown as "coming soon" with no dead links) → **slot list** (part chosen, or "Choose a …") → a **running status banner** (Compatible / N warnings / N problems / N can't check) → a **findings list** grouped by severity, each with its fix and source.
- Slot click → **part picker** with a "Show only parts that fit" toggle (default on), search by name, and key specs per row (speeds, freehub, max cog, capacity...).
- **Start from Zuzu's bike** button loads the baseline.
- **Gear range panel:** lowest/highest gear ratio and gear inches for the chosen crank + cassette + wheel size (26/27.5/29/700c), as a simple bar or table. Put the physics in `src/builder/gearMath.js` with tests.
- **Kid mode is the default view**: friendly words ("The shifter and derailleur speak different languages"), short "Why?" explainers per finding, no source URLs, no brand marketing. A **"Grown-up details"** toggle shows exact specs, rule ids and source citations (link text only to manufacturer/source pages; no shop links). No PIN in phase 1 (nothing sensitive yet), but put the toggle behind one component so a PIN can be added later.
- Save builds to localStorage (reuse or follow the `src/store/projectStore.ts` patterns) and offer "Add to my projects". No accounts and no server writes.
- Accessibility: keyboard navigable, readable contrast, works on a tablet width (his son may use one). Respect `src/renderer/utils/uxSafety.js` route checks (add the route where needed so the UX tests pass).
- An in-page "Data sources" footer with the required attributions.

### 3.4 Out of scope (later phases)
Prices, retailers, affiliate programs, eBay/Amazon; D1/Workers/API endpoints; accounts and share links; frames/forks/BB/axles/headset/seatpost/tires (phase 2); e-bike electrical (phase 3); dirt bike/motorcycle (phase 4); the AI extraction pipeline UI (a script stub in `scripts/builder/` is OK, nothing committed that calls paid APIs); game quest integration (only leave a documented engine entry point the game can call).

## 4. Done criteria (all required)
- [ ] PR from `feat/bike-builder-phase1` into `main` is open, **not merged**, nothing deployed.
- [ ] `node --test tests/*.test.mjs`: all pre-existing tests plus ≥ 25 new builder tests pass. `npm run build` is clean (no new warnings beyond the existing chunk-size ones).
- [ ] The engine is pure and shared (no React imports), with the three severities and `cannot_verify` for unknowns.
- [ ] `rules.json` covers the 10 rule groups above, every rule cited. About 150 seed parts with sources. `ATTRIBUTION.md` present. No PDFs or non-permitted data committed.
- [ ] Son's-bike golden cases A-D pass exactly as specified.
- [ ] `/builder` works on `npm run dev:web` (web) and in the built SPA. Existing routes are unchanged (`/project-builder`, `/current-projects`, `/build-planner`, `/shop`, `/play`, `/play3d`, etc.).
- [ ] No prices, buy links, retailer links or outbound shop links anywhere in the builder. Kid view shows no URLs.
- [ ] `docs/bike-builder/` contains PLAN.md, REUSE_RESEARCH.md, d1-schema.sql (draft) and a short `DATA_REVIEW.md` listing every `draft` part for the owner to review.
- [ ] PR description: summary, screenshots of the kid and grown-up views (desktop + tablet width), test output, the list of sources used with their licenses, known gaps and the review checklist for Dr. Yazan.

## 5. Notes for the implementer
- The live site is a Vite React SPA on Cloudflare Pages (`functions/` = Pages Functions). Phase 1 needs no new Functions.
- Existing useful code: `src/store/projectStore.ts` (zustand/localStorage), `src/renderer/services/buildPlanner/*` (UI patterns), `src/renderer/game/systems/systemGraph.js` (requires/conflicts graph idea).
- Port 5173 on the owner's i9 is used by another app; Vite will pick 5174. Irrelevant in the cloud.
- When unsure whether a fact is right, mark it `draft` and `cannot_verify` rather than guessing. A wrong "compatible" verdict is the worst failure this product can have.
