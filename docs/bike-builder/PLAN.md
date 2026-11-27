# Bike Builder plan: compatible parts for bike-browser.com

Source Page: https://cursor.com/canvas/store-306620b4-dd78-497a-bdbb-ec5616ddb0d4/f3cb761c-cf2d-4b26-8f11-cbdd357e8967 (2026-11-26)
Owner decision 2026-11-26: the audience is **both** practical (a real parts-picker for real builds) **and** educational (a kid learning layer for his son). Build approved to start, phase by phase, with PRs only and merges on Dr. Yazan's say-so.

## Bottom line
A curated, rules-first builder for bicycles and e-bikes, starting with the drivetrain and brakes. His son's VG Sports 9-speed 11-42 kit is test case #1. Dirt bikes and motorcycles come later, as fitment lookup only, because they need licensed year/make/model data.

## What exists today (main = May 9 build 0af2f8f; builder code identical on PR #12)
| Route / feature | Reality | Data | Status |
|---|---|---|---|
| /project-builder | 5 project tiles → video search, learning path, missions | curated videos (/api/search) | video tool, not a builder |
| /current-projects | one hardcoded VG Sports 9s 11-42 project + Park Tool videos | src/renderer/data/currentProjects.js, src/services/projectStorage.ts | static |
| /build-planner | form → checklist, fit/standover/budget cards, recommended parts | MockBuildPlannerAIClient (mock-v1) + 1 curated BBS02 e-bike build | mostly mock |
| /shop (Shop Materials) | material chips → product cards + Amazon/eBay/Walmart search links | Electron IPC only. On the web it's links only | links only |
| Rear/Electronic Derailleurs, Brake Systems, E-Bike Power, Dirt Bike Shop... tiles | video presets | src/renderer/data/videoQualityPresets.js | videos only |
| src/compatibility/* | 3 e-bike rules, loose pairing bug, skips checks when data is missing | ProjectItem.specs | stub |
| src/store/projectStore.ts | zustand + localStorage projects/items/notes | browser | reusable |
| src/services/ebayService.js | eBay Finding API, **decommissioned 2025-02-04** | none | dead |
| src/main/sources/shopping-manager.js | retailer/OfferUp/FB sources, mock fallbacks | desktop only | desktop |
| functions/api/* | health, profile (KV), rank, search (videos), spelling-ocr, videos | Pages + KV PROFILE_STORE | real, no parts |
| game systemGraph/simulationEngine/ebikeSystem/batterySystem | requires/supports/conflicts graph, voltage/current checks | hardcoded | reusable ideas |
| Drivetrain gear-ratio physics | none (spellingTrainer/math/gearPhysics.js is circle math) | - | missing |

## PCPartPicker → bikes
Slots per category. **The frame sets the standards** (like a motherboard). A compatibility filter limits a slot's candidates to those that pass. Three severities: **Incompatible / Warning / Can't verify**. Running totals (gear range, weight. Price only in parent mode). Saved and shared builds.

## Rules that matter (phase)
- Freehub/driver: HG, Micro Spline, XD, XDR, Campagnolo, N3W. XD cassette on XDR only with a 1.85 mm spacer. Shimano 11s road on HG-L needs a 1.85 mm spacer (Shimano C-731). Error. P1
- Speed count match: shifter = RD = cassette = chain. Error. P1
- Actuation / pull-ratio family match (Shimano 6-9s & road 10s ≈1.7; Tiagra 4700/road 11s; Shimano MTB 10/11/12; SRAM 1:1/Exact, X-Actuation 11/12). Error. P1
- RD max cog: over by ≤ about 6T with a hanger extender → Warning; more → Error. P1
- RD capacity: (big ring − small ring) + (big cog − small cog) ≤ capacity. Front difference ≤ RD max on 2x. Error. P1
- Electronic ecosystems Di2 / AXS / EPS never cross, and generations matter. Error. P1
- Full Mount (Eagle Transmission, XPLR AXS) needs a UDH frame. Error. P1
- Brakes: rim vs disc. Post vs flat mount (adapter → Warning). Rotor size ≤ frame/fork max. 6-bolt vs Center Lock (adapter → Warning). Lever + caliper in the same system and fluid (Shimano/Campagnolo mineral, most SRAM DOT, SRAM Maven mineral). Never mix. P1
- BB shell × spindle (BSA, T47, PF30, BB86/92 × 24 mm / DUB / 30 mm). P2
- Axles: QR 130/135, 12x142, 12x148 Boost, 157 SuperBoost. Front QR100, 15x100, 15x110. P2
- Wheel BSD and tire clearance, headset SHIS, seatpost diameter, dropper routing. P2
- E-bike: battery V = controller V, battery A ≥ controller A, controller W ≥ motor W (warning), connectors, dropout/torque arm, mid-drive BB. US: federal < 750 W & < 20 mph motor-only. Classes 1/2/3 are state law. P3
- Moto: ACES/VCdb year/make/model fitment. P4

## Architecture
Sources → ingest + AI extraction (draft + confidence) → parent review queue → data store (local JSON in phase 1, D1 later. R2 for docs) → Pages Functions /api/parts, /api/builds (later) → one shared TS rules engine (browser + Worker) → Builder UI (kid / parent) → game hooks.

Data model: `standards` (enums + aliases), `parts` (category, brand, model, model_code, years, specs per category schema, indexed standard fields, source_url, verified_by/at, confidence, review_status), `rules` (slots, severity, declarative predicate, adult and kid messages, citation, version), `offers` (later, parent only), `builds` (profile, type, slots, notes, share slug, project link), `bikes` (real bikes as baselines).

Engine: declarative rules. Three severities. SQL/JSON prefilter then full rules. **Unknown ≠ OK** (missing data → Can't verify). Golden tests from manufacturer tables and real builds.

UI flow: bike type → start from frame or "my bike" → slot list with a running banner, gear-range chart and weight → filtered part picker per slot → parent mode adds prices (later) → save to project and share.

## Data strategy
Primary: manufacturer docs (facts + citation) + AI extraction with human review + manual curation of his real bike. Seed helpers: bike-part-planner (MIT), Pedal Brief (CC BY 4.0), derailleur-analysis (MIT). Cross-check: Reference Source. Later: Bike Archive API (lookup), AvantLink/eBay Browse (prices, parent only), vPIC (moto VIN), paid powersports fitment. Avoid: scraping, BikePartPicker data, Geometry Geeks, 99 Spokes. See REUSE_RESEARCH.md.
MVP target: about 300 hand-verified parts (phase 1 about 150 drivetrain + brakes).

## Kid / parent / game
Kid mode is the default. It builds and checks, uses kid wording, has no prices and no outbound links, includes a gear-ratio lab and earns game rewards. Parent mode (PIN, later) adds prices and links, the review queue and real-bike baselines. Game: a Zuzu's garage "wrong part" quest using the same engine. Gear-inch/development physics shared with the multiplication practice.

## Phases (estimates)
0. Foundations: standards, engine, golden tests, fix e-bike engine bugs, retire dead eBay code (about 1 week agent).
1. MVP drivetrain + brakes: /builder, about 150 parts, kid/parent wording, localStorage builds, "Zuzu's bike" baseline (3-4 weeks agent + 10-15 h review).
2. Frame-level standards: frames, forks, wheels, BB, axles, headset, seatpost, tires. Share links. D1 (3-4 weeks + 10 h).
3. E-bike: kits, batteries, controllers, connectors, class indicator, game battery lab (3 weeks + 8 h).
4. Prices + moto: AvantLink/eBay in parent mode. Moto pilot only if data is licensed.

## Risks
Wrong "compatible" verdict (high: cite and Can't verify). Child exposure to shopping (high: parent gate before any offers). Stale catalogue (medium: yearly refresh). Moto scope creep (medium). Affiliate gates (low). Overlap with existing pages (low: fold Build Planner and Shop into /builder over time).

## Open decisions
1. ~~Audience~~: decided, both practical and educational.
2. Scope order: bicycle drivetrain + brakes → frames → e-bike → moto pilot?
3. Shopping: prices/links only in a PIN parent mode? Affiliate programs?
4. Data: CC BY-SA (Bike Book) acceptable? Paid powersports data? Who reviews about 300 parts?
5. Placement: new /builder now, later absorbing Build Planner and Shop Materials? Game quests from phase 1?
