# Sonoran Dataset Expansion Plan

Builds out `data/sonoran/` from the 12-plant seed to the full target:
**50 plants, 25 insects, 15 fungi, 25 animals**. Each species is a node
in the Biology Knowledge Graph (Phase 2). Discipline unchanged: culture
GATED, provenance `draft_unverified` until source-checked, pharmacology
mechanism+safety-only.

## Prioritization tiers (applied within each category)
- **Tier 1 — Most iconic:** instantly recognizable, anchors the world's
  identity. Build first.
- **Tier 2 — Most educational:** richest reasoning/biology payload
  (mutualisms, CAM, N-fixing, dose-response).
- **Tier 3 — Most useful for gameplay:** crafting inputs, food-web
  connectors, quest enablers.
(Many species are multi-tier; tag = primary reason to include.)

## Opportunity columns (per species)
`reasoning` = which reasoning domains it naturally exercises ·
`engineering` = which vehicle/engineering lesson it feeds ·
`biology` = which biological domain(s) it teaches · `quest` = a candidate
in-world problem.

---

## PLANTS (target 50; 12 seeded ✓)

### Tier 1 — iconic (build next)
| sci_name | common | reasoning | engineering | biology | quest |
|---|---|---|---|---|---|
| ✓ Carnegiea gigantea | Saguaro | systems, causal | water-storage structure | ecology/cellular (CAM) | "what nests in the saguaro?" |
| ✓ Larrea tridentata | Creosote | causal, evidence | resin adhesive/water-loss | phytochem/pharma (NDGA) | "why does it smell like rain?" |
| ✓ Prosopis velutina | Velvet Mesquite | estimation | charcoal/hardwood | ethnobotany/ecology (N-fix) | "bake trail bread" |
| ✓ Fouquieria splendens | Ocotillo | causal | wax waterproofing (→Ch5) | cellular (rain-triggered leaf) | "waterproof it" |
| ✓ Opuntia engelmannii | Prickly Pear | experimental_design | mucilage binder, betalain dye | ethnobotany/phytochem | "make a dye" |
| ✓ Cylindropuntia bigelovii | Teddybear Cholla | spatial | cholla-wood craft | cellular (spines=leaves) | "why do segments jump?" |
| ✓ Yucca baccata | Banana Yucca | experimental_design | fiber cordage (UTM) | ethnobotany/ecology (moth) | "repair bike bag with yucca fiber" |
| ✓ Agave deserti | Desert Agave | optimization | fiber strength, saponin soap | ethnobotany/phytochem | "soap from the desert" |
| Parkinsonia microphylla | Foothill Palo Verde | systems | light wood; nurse plant | ecology (N-fix, nurse) | "who shelters baby saguaros?" |
| Ferocactus wislizeni | Fishhook Barrel | spatial, estimation | water-store geometry | cellular (CAM, ribs) | "which way does it lean, and why?" |

### Tier 2 — most educational
| sci_name | common | biology focus | quest |
|---|---|---|---|
| ✓ Olneya tesota | Desert Ironwood | density/strength + N-fix + keystone nurse | "strong but heavy" (→Ch6) |
| Simmondsia chinensis | Jojoba | liquid wax ester chemistry (unique) | "the plant that makes oil, not fat" |
| Ephedra spp. | Mormon Tea | alkaloid dose-response (SAFETY, observe-only) | "stimulant vs poison: the dose line" |
| Datura wrightii | Sacred Datura | TOXIC tropane alkaloids — observe-only | "beautiful and dangerous" (dose-response) |
| Larrea (soil) + biocrust | — | allelopathy + soil life bridge (→microbiology) | "why is there bare ground around it?" |
| Phaseolus acutifolius | Tepary Bean | N-fixation + drought crop (Native Seeds) | "the bean that beats drought" |
| Salix gooddingii | Goodding's Willow | **true Salix → salicin** (the willow example) | "why does willow-bark tea ease pain?" (mechanism) |
| Populus fremontii | Fremont Cottonwood | riparian indicator, transpiration | "follow the cottonwoods to water" |
| Typha domingensis | Cattail | wetland filter, fiber, starch | "the cattail does five jobs" |
| Encelia farinosa | Brittlebush | resin, reflective leaf hairs | "white leaves in summer: why?" |

### Tier 3 — gameplay connectors (names; opportunities authored in build pass 2)
Soaptree Yucca, Palmer's Agave, Buckhorn Cholla, Organ Pipe, Hedgehog
Cactus, Desert Spoon, Catclaw Acacia, Whitethorn Acacia, Fairy Duster,
Wolfberry, Desert Lavender, Globe Mallow, Mexican Gold Poppy, Lupine,
Chia, Desert Senna, Coyote Gourd, Wild Tobacco, Devil's Claw,
Seep Willow, Arrow Weed, Big Galleta grass, Bush Muhly, Netleaf
Hackberry, Canyon Ragweed, Blue Palo Verde ✓, Desert Marigold ✓,
Desert Willow ✓. *(fills to 50)*

---

## INSECTS (target 25)
### Tier 1 — iconic / keystone
- *Tegeticula* spp. **Yucca Moth** — obligate mutualism (systems_thinking
  centerpiece; "what happens to the yucca if the moth vanishes?").
- *Apis mellifera* + native solitary bees (digger/leafcutter/**cactus
  bees**) — pollination networks; estimation/optimization (forage range).
- *Hyles lineata* **White-lined Sphinx Moth** — night pollinator
  (links to CAM night-flowering).
- *Danaus* (Monarch/Queen) — milkweed dependence; migration (geography).
- *Pepsis* **Tarantula Hawk** — predator/parasitoid (food-web edge).
### Tier 2 — educational
Harvester ants (seed dispersal + soil), leafcutter ants (fungus farming
→ bridges to fungi/microbiology), desert termites (decomposition → soil),
*Derobrachus* Palo Verde root borer (wood/decomposer), cicada
(life-cycle/sound → weird-zone resonance), antlion (predation mechanics).
### Tier 3 — connectors
ladybird beetle, robber fly, jewel/metallic wood-borer, paper wasp, fig
wasp, giant mesquite bug, velvet ant, katydid, walkingstick, pipevine
swallowtail, digger wasp. *(fills to 25; each linked to ≥1 plant edge)*

Reasoning/eng/biology hooks: pollination = causal + systems; ant
seed-caching = estimation + experimental_design; decomposers = systems
(nutrient cycle → terraforming preview).

---

## FUNGI (target 15)
### Tier 1
- **Mycorrhizal fungi** (root symbionts) — the soil-life bridge; the
  single most important fungal node (plants↔soil↔microbiology). Quest:
  "the hidden network under the mesquite."
- **Biological soil crust** (cyanobacteria-lichen-fungi) — N-fixation +
  erosion control (terraforming preview). "don't step on the living
  soil."
- *Podaxis pistillaris* **Desert Shaggy Mane**, *Battarrea* desert
  stalked puffball — iconic desert fungi.
### Tier 2 / SAFETY
- *Coccidioides* (Valley Fever) — **observe/educational ONLY, never
  handling**; teaches soil-dust risk (safety + microbiology).
- Saguaro soft-rot agents (decomposition of fallen saguaros).
- Lichens (crustose/foliose) — symbiosis lesson (two organisms, one
  body).
### Tier 3
bird's nest fungi, earthstars, desert puffballs, *Montagnea arenaria*,
inky cap, wood-decay brackets, ectomycorrhizal associates of mesquite,
*Pisolithus* desert truffle. *(fills to 15)*

---

## ANIMALS (target 25)
### Tier 1 — iconic
- **Javelina, Coyote, Greater Roadrunner, Desert Tortoise, Gila
  Monster** (SAFETY: venom — observe-only), **Western Diamondback**
  (SAFETY), **Gila Woodpecker** (saguaro cavity nester — keystone edge).
### Tier 2 — educational
Kangaroo rat (water-from-seeds metabolism — dose-response/physiology
preview), desert bighorn (thermoregulation), Harris's hawk (cooperative
hunting → systems), Sonoran Desert toad (SAFETY: skin toxin, observe-
only; dose-response), round-tailed ground squirrel (estivation),
white-winged dove (saguaro pollinator/disperser — closes the saguaro
loop).
### Tier 3 — food-web connectors
desert cottontail, black-tailed jackrabbit, kit fox, ringtail, mule deer,
cactus wren, gilded flicker, Gambel's quail, curve-billed thrasher, elf
owl, chuckwalla, desert spiny lizard. *(fills to 25)*

Hooks: every animal carries ≥1 food-web edge (eats/eaten-by) and ≥1
adaptation (thermoregulation, water economy) — the Phase 4 substrate
wires these.

---

## Build passes (unchanged from data/sonoran/README, restated with tiers)
1. **Seed (done):** 12 plants.
2. **Pass 2:** Tier-1 plants (10) + Tier-1 insects/animals (the keystone
   mutualist set), with food-web edges (Phase 4).
3. **Pass 3:** Tier-2 across all categories; fungi (soil-life bridge).
4. **Pass 4 (verify):** flip `draft_unverified → verified` vs USDA / ASDM
   / iNaturalist / GBIF / LBJ Wildflower; record license per record.
5. **Pass 5 (cultural, human-gated):** author briefs; fill
   `culture.indigenous_uses`.

Coverage rule: no species ships without ≥1 graph edge to another species
and ≥1 quest hook — prevents a "dead encyclopedia entry."
