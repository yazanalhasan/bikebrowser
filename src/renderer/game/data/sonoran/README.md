# Sonoran Chapter 1 Dataset — build plan, manifest, and discipline

**Status:** first real-world implementation dataset for Chapter 1 (Bike,
Sonoran Desert). Seed tranche shipped in `plants.sonoran.js`; the rest is
a curated multi-pass build per the manifest below.

This dataset is the concrete grounding of the Unified Biological
Knowledge Graph (arc.md §3) for Chapter 1. Each record is a **shared
entity** keyed by `id` that the ecology, ethnobotany, phytochemistry,
pharmacology, and biology-workbench substrates read as facets.

## Target composition (per design directive)

| Category | Target count | Seed shipped | Primary sources |
|---|---|---|---|
| Plants | ~50 | 12 (backbone + common) | USDA PLANTS, Native Seeds/SEARCH, Lady Bird Johnson Wildflower Center, Arizona-Sonora Desert Museum, iNaturalist |
| Insects | ~25 | manifest only | iNaturalist, GBIF, Encyclopedia of Life, ASDM |
| Fungi | ~15 | manifest only | iNaturalist, GBIF, MycoPortal |
| Animals | ~25 | manifest only | ASDM, iNaturalist, GBIF, EOL |

## Provenance & cultural discipline (LOAD-BEARING — arc.md §2, §9)

1. **Every record carries `provenance`** with `status`
   (`draft_unverified` → `verified`), the intended source, and license.
   The seed ships `draft_unverified`: structural/ecological facts are
   from general botanical knowledge and **must be verified against the
   named source before the record is marked `verified`.** Nothing here
   is canon until verified.
2. **`culture.indigenous_uses` is GATED.** It ships `null` with
   `requiresHumanBrief: true`. No agent fills indigenous, religious, or
   marginalized cultural content — a human-authored design brief +
   sourced provenance (Indigenous-data-governance / CARE) is required
   (arc.md §2). `culture.regional_uses` (non-sacred, broadly-documented
   horticultural/agricultural use) may be drafted but still verified.
3. **`pharmacology.mechanisms` is educational-only**, mechanism-level,
   with mandatory safety annotation; never clinical/therapeutic/
   diagnostic (pharmacology-substrate.md §10). The game never instructs
   foraging-and-eating.
4. **`chemistry.major_compounds`** reference PubChem/ChEBI ids; the seed
   lists well-known compounds flagged `verify` until checked.

## Per-species schema (see `plants.sonoran.js` typedef)

```
species / scientific_name / common_names
ecology:        habitat, pollinators, water_requirements, biome, terrain
culture:        indigenous_uses (GATED null), regional_uses
ethnobotany:    food, fiber, medicine, construction   (structural uses)
chemistry:      major_compounds[]  (PubChem/ChEBI refs, verify)
pharmacology:   mechanisms[]       (educational, safety-annotated)
cellular_biology: adaptations[]    (xerophyte traits, CAM, etc.)
molecular_biology: pathways[]      (e.g. CAM photosynthesis pathway)
gameplay:       quests[], crafting[], discoveries[]
knowledge:      seen/interacted/understood (knowledge-state facets)
provenance:     { status, sources[], license }
```

## Plant manifest (~50; ✓ = seeded in plants.sonoran.js)

Trees/large: ✓ Velvet Mesquite (*Prosopis velutina*), ✓ Blue Palo Verde
(*Parkinsonia florida*), Foothill Palo Verde (*Parkinsonia microphylla*),
✓ Desert Ironwood (*Olneya tesota*), ✓ Desert Willow (*Chilopsis
linearis*), Catclaw Acacia (*Senegalia greggii*), Netleaf Hackberry
(*Celtis reticulata*).

Cacti: ✓ Saguaro (*Carnegiea gigantea*), ✓ Teddybear Cholla
(*Cylindropuntia bigelovii*), Buckhorn Cholla (*Cylindropuntia
acanthocarpa*), ✓ Engelmann Prickly Pear (*Opuntia engelmannii*), Barrel
Cactus (*Ferocactus wislizeni*), Organ Pipe (*Stenocereus thurberi*),
Hedgehog (*Echinocereus engelmannii*), Fishhook Pincushion (*Mammillaria
grahamii*).

Shrubs: ✓ Creosote Bush (*Larrea tridentata*), Brittlebush (*Encelia
farinosa*), Triangle-leaf Bursage (*Ambrosia deltoidea*), Jojoba
(*Simmondsia chinensis*), Fairy Duster (*Calliandra eriophylla*),
Whitethorn Acacia (*Vachellia constricta*), Desert Lavender (*Condea
emoryi*), Wolfberry (*Lycium* spp.).

Succulents/agave/yucca: ✓ Desert Agave (*Agave deserti*), Palmer's Agave
(*Agave palmeri*), ✓ Banana Yucca (*Yucca baccata*), Soaptree Yucca
(*Yucca elata*), ✓ Ocotillo (*Fouquieria splendens*), Desert Spoon
(*Dasylirion wheeleri*).

Grasses/herbs/annuals/vines/riparian/medicinal: Big Galleta (*Hilaria
rigida*), Bush Muhly (*Muhlenbergia porteri*), ✓ Desert Marigold
(*Baileya multiradiata*), Globe Mallow (*Sphaeralcea ambigua*), Mexican
Gold Poppy (*Eschscholzia californica* subsp. *mexicana*), Lupine
(*Lupinus sparsiflorus*), Chia (*Salvia columbariae*), Desert Senna
(*Senna covesii*), Canyon Ragweed (*Ambrosia ambrosioides*), Coyote Gourd
(*Cucurbita digitata*), Wild Tobacco (*Nicotiana obtusifolia*), Jimsonweed
(*Datura wrightii* — TOXIC, safety-flagged), Cattail (*Typha
domingensis*), Fremont Cottonwood (*Populus fremontii*), Goodding's Willow
(*Salix gooddingii*), Seep Willow (*Baccharis salicifolia*), Arrow Weed
(*Pluchea sericea*), Mormon Tea (*Ephedra* spp.), Devil's Claw
(*Proboscidea parviflora*), Tepary Bean (*Phaseolus acutifolius* — Native
Seeds/SEARCH crop). *(remaining slots filled in the next pass to reach ~50)*

## Insect manifest (~25)
Western honey bee, native solitary bees (digger/leafcutter/cactus bees),
Palo Verde root borer beetle, tarantula hawk wasp, monarch & queen
butterflies, white-lined sphinx moth (saguaro/agave pollinator), yucca
moth (*Tegeticula* — keystone mutualism), pipevine swallowtail, giant
mesquite bug, harvester ants, leafcutter ants, desert termites, ladybird
beetle, antlion, cicada, paper wasp, fig wasp, robber fly, jewel beetle,
katydid, walkingstick, velvet ant, giant desert centipede (note:
arthropod), Gila metallic wood borer, digger wasp.

## Fungi manifest (~15)
Desert truffle (*Pisolithus*), mycorrhizal fungi (root symbionts — the
soil-life bridge), saguaro soft-rot agents, *Coccidioides* (Valley Fever —
SAFETY: educational/observational only, never handling), bird's nest
fungi, earthstars, desert puffballs, *Podaxis pistillaris* (desert
shaggy mane), lichens (crustose/foliose — symbiosis), soil crust
cyanobacteria-fungi (biological soil crust), wood-decay bracket fungi,
*Battarrea* (desert stalked puffball), Inky cap, *Montagnea arenaria*,
ectomycorrhizal associates of mesquite.

## Animal manifest (~25)
Mammals: javelina, coyote, desert cottontail, black-tailed jackrabbit,
round-tailed ground squirrel, kangaroo rat, desert bighorn, mule deer,
ringtail, kit fox. Birds: Gila woodpecker, gilded flicker, cactus wren,
Harris's hawk, greater roadrunner, Gambel's quail, curve-billed thrasher,
elf owl, white-winged dove (saguaro pollinator/disperser). Reptiles/
amphibians: desert tortoise, Gila monster, western diamondback, desert
spiny lizard, Sonoran desert toad (SAFETY: toxin — observational only),
chuckwalla.

## Build passes
1. **Seed (done):** schema + 12 plants, structural fields, gated culture.
2. **Pass 2:** complete the ~50 plants (structural/ecological/chemistry,
   `draft_unverified`); add insects (pollinator links to plants).
3. **Pass 3:** fungi + animals; wire food-web links to ecology substrate.
4. **Verification pass:** flip `draft_unverified → verified` against named
   sources; record license per record.
5. **Cultural pass (human-gated):** author the cultural-content briefs;
   only then fill `culture.indigenous_uses`.
