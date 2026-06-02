// Sonoran Chapter 1 — plant dataset (SEED tranche)
//
// First real-world implementation dataset for the Unified Biological
// Knowledge Graph (arc.md §3). Each record is a shared entity that the
// ecology / ethnobotany / phytochemistry / pharmacology / biology
// substrates read as facets.
//
// DISCIPLINE (see ./README.md, arc.md §2/§9):
//  - provenance.status is "draft_unverified": structural/ecological facts
//    are from general botanical knowledge and MUST be verified against the
//    named source before being marked "verified". Not canon until verified.
//  - culture.indigenous_uses is GATED: null + requiresHumanBrief:true. No
//    agent fills indigenous/sacred cultural content (human brief + CARE).
//  - pharmacology.mechanisms are EDUCATIONAL, mechanism-level, with
//    mandatory safety notes. Never clinical/therapeutic/diagnostic. The
//    game never instructs foraging-and-eating.
//  - chemistry.major_compounds carry PubChem/ChEBI refs flagged "verify".
//
// @typedef {Object} SonoranPlant
// @property {string} id
// @property {string} scientific_name
// @property {string[]} common_names
// @property {{habitat:string, pollinators:string[], water_requirements:string, biome:string, terrain:string[]}} ecology
// @property {{indigenous_uses:null, requiresHumanBrief:boolean, regional_uses:string[]}} culture
// @property {{food:string[], fiber:string[], medicine:string[], construction:string[]}} ethnobotany
// @property {{major_compounds:{name:string, ref:string, status:string}[]}} chemistry
// @property {{mechanisms:{effect:string, mechanism:string, safety:string}[]}} pharmacology
// @property {{adaptations:string[]}} cellular_biology
// @property {{pathways:string[]}} molecular_biology
// @property {{quests:string[], crafting:string[], discoveries:string[]}} gameplay
// @property {{seen:boolean, interacted:boolean, understood:boolean}} knowledge
// @property {{status:string, sources:string[], license:string}} provenance

const GATED_CULTURE = { indigenous_uses: null, requiresHumanBrief: true, regional_uses: [] };
const DRAFT = (sources) => ({ status: "draft_unverified", sources, license: "per-source; record on verify" });
const KNOWLEDGE0 = { seen: false, interacted: false, understood: false };

/** @type {SonoranPlant[]} */
export const SONORAN_PLANTS = [
  {
    id: "velvet_mesquite",
    scientific_name: "Prosopis velutina",
    common_names: ["Velvet Mesquite"],
    ecology: { habitat: "washes, floodplains, desert grassland", pollinators: ["native bees", "honey bee"], water_requirements: "low; deep taproot reaches groundwater", biome: "sonoran_desert", terrain: ["wash", "alluvial"] },
    culture: { ...GATED_CULTURE, regional_uses: ["pod flour", "fuelwood", "honey forage"] },
    ethnobotany: { food: ["pods (sweet, ground to flour)"], fiber: [], medicine: ["pod/bark decoctions (regional)"], construction: ["hardwood for tools/posts", "charcoal"] },
    chemistry: { major_compounds: [{ name: "galactomannan (mesquite gum)", ref: "PubChem:verify", status: "verify" }, { name: "sucrose/fructose (pods)", ref: "PubChem:CID5988", status: "verify" }] },
    pharmacology: { mechanisms: [{ effect: "demulcent (soothing) from gum", mechanism: "polysaccharide forms a viscous protective film", safety: "food-grade gum; whole-plant parts not a medicine — educational only" }] },
    cellular_biology: { adaptations: ["deep taproot", "drought-deciduous leaflets", "nitrogen-fixing root nodules (rhizobia symbiosis)"] },
    molecular_biology: { pathways: ["biological nitrogen fixation (nodule rhizobia)"] },
    gameplay: { quests: ["bake_trail_bread"], crafting: ["mesquite_flour", "charcoal", "hardwood_part"], discoveries: ["pods_are_food", "wood_makes_charcoal_preview_of_fuel"] },
    knowledge: { ...KNOWLEDGE0 },
    provenance: DRAFT(["USDA PLANTS", "Native Seeds/SEARCH", "Arizona-Sonora Desert Museum"]),
  },
  {
    id: "saguaro",
    scientific_name: "Carnegiea gigantea",
    common_names: ["Saguaro"],
    ecology: { habitat: "rocky bajadas, south-facing slopes", pollinators: ["white-winged dove", "lesser long-nosed bat", "white-lined sphinx moth", "bees"], water_requirements: "very low; stores water in pleated stem", biome: "sonoran_desert", terrain: ["rock", "bajada"] },
    culture: { ...GATED_CULTURE, regional_uses: ["fruit harvested in early summer (regional, culturally significant — GATED)"] },
    ethnobotany: { food: ["fruit/seeds (regional)"], fiber: [], medicine: [], construction: ["dried woody ribs used as poles (regional)"] },
    chemistry: { major_compounds: [{ name: "mucilage polysaccharides", ref: "PubChem:verify", status: "verify" }] },
    pharmacology: { mechanisms: [] },
    cellular_biology: { adaptations: ["CAM photosynthesis (stomata open at night)", "pleated stem for expansion", "shallow wide root mat"] },
    molecular_biology: { pathways: ["CAM photosynthesis (PEP carboxylase, nocturnal CO2 fixation)"] },
    gameplay: { quests: [], crafting: ["saguaro_rib_pole"], discoveries: ["water_storage", "CAM_night_breathing", "keystone_for_birds"] },
    knowledge: { ...KNOWLEDGE0 },
    provenance: DRAFT(["USDA PLANTS", "Arizona-Sonora Desert Museum", "iNaturalist"]),
  },
  {
    id: "creosote_bush",
    scientific_name: "Larrea tridentata",
    common_names: ["Creosote Bush", "Greasewood"],
    ecology: { habitat: "flats and slopes; one of the most drought-tolerant shrubs", pollinators: ["native bees"], water_requirements: "extremely low", biome: "sonoran_desert", terrain: ["flat", "rock"] },
    culture: { ...GATED_CULTURE, regional_uses: ["resinous leaves; distinctive 'desert rain' smell"] },
    ethnobotany: { food: [], fiber: [], medicine: ["resin/leaf preparations (regional — strongly safety-gated)"], construction: ["lac resin as adhesive (regional)"] },
    chemistry: { major_compounds: [{ name: "nordihydroguaiaretic acid (NDGA)", ref: "PubChem:CID4534", status: "verify" }, { name: "leaf resin phenolics/flavonoids", ref: "ChEBI:verify", status: "verify" }] },
    pharmacology: { mechanisms: [{ effect: "antioxidant / lipoxygenase inhibition (NDGA)", mechanism: "phenolic radical scavenging; enzyme inhibition", safety: "DOSE-RESPONSE: NDGA is hepatotoxic at high oral dose — observe/extract for study only, never ingest; educational mechanism only" }] },
    cellular_biology: { adaptations: ["resin coating reduces leaf water loss", "allelopathy limits competitor roots"] },
    molecular_biology: { pathways: ["phenylpropanoid pathway (phenolics/lignans)"] },
    gameplay: { quests: [], crafting: ["resin_adhesive_sample"], discoveries: ["resin_reduces_water_loss", "smell_of_rain", "antioxidant_mechanism"] },
    knowledge: { ...KNOWLEDGE0 },
    provenance: DRAFT(["USDA PLANTS", "PubChem", "Arizona-Sonora Desert Museum"]),
  },
  {
    id: "teddybear_cholla",
    scientific_name: "Cylindropuntia bigelovii",
    common_names: ["Teddybear Cholla", "Jumping Cholla"],
    ecology: { habitat: "rocky slopes, dense stands", pollinators: ["bees"], water_requirements: "very low (CAM)", biome: "sonoran_desert", terrain: ["rock", "slope"] },
    culture: { ...GATED_CULTURE, regional_uses: [] },
    ethnobotany: { food: ["buds (regional, dethorned)"], fiber: [], medicine: [], construction: ["woody cylinder skeleton (craft)"] },
    chemistry: { major_compounds: [{ name: "mucilage polysaccharides", ref: "PubChem:verify", status: "verify" }] },
    pharmacology: { mechanisms: [] },
    cellular_biology: { adaptations: ["CAM photosynthesis", "detachable spined segments for vegetative spread/defense", "reduced leaves (spines)"] },
    molecular_biology: { pathways: ["CAM photosynthesis"] },
    gameplay: { quests: [], crafting: ["cholla_wood_craft"], discoveries: ["spines_are_modified_leaves", "vegetative_cloning"] },
    knowledge: { ...KNOWLEDGE0 },
    provenance: DRAFT(["USDA PLANTS", "iNaturalist", "Arizona-Sonora Desert Museum"]),
  },
  {
    id: "desert_agave",
    scientific_name: "Agave deserti",
    common_names: ["Desert Agave"],
    ecology: { habitat: "rocky slopes, bajadas", pollinators: ["bats", "bees", "hummingbirds"], water_requirements: "low (CAM); monocarpic (flowers once)", biome: "sonoran_desert", terrain: ["rock", "slope"] },
    culture: { ...GATED_CULTURE, regional_uses: ["roasted heart as food (regional)", "fiber traditions (GATED)"] },
    ethnobotany: { food: ["roasted heart/stalk (regional)"], fiber: ["leaf fiber for cordage/textiles"], medicine: [], construction: ["dried flower stalk; fiber lashings"] },
    chemistry: { major_compounds: [{ name: "fructans (agavins/inulin)", ref: "ChEBI:verify", status: "verify" }, { name: "steroidal saponins", ref: "PubChem:verify", status: "verify" }] },
    pharmacology: { mechanisms: [{ effect: "surfactant (saponins foam in water)", mechanism: "amphipathic saponins lower surface tension", safety: "saponins are GI-irritant raw — used externally as soap; educational only" }] },
    cellular_biology: { adaptations: ["CAM photosynthesis", "thick waxy cuticle", "fibrous vascular bundles for structure"] },
    molecular_biology: { pathways: ["CAM photosynthesis", "fructan biosynthesis"] },
    gameplay: { quests: ["repair_bike_bag_with_fiber_alt"], crafting: ["agave_fiber_cord", "agave_soap"], discoveries: ["fiber_for_strength", "saponin_soap", "CAM"] },
    knowledge: { ...KNOWLEDGE0 },
    provenance: DRAFT(["USDA PLANTS", "ChEBI", "Native Seeds/SEARCH"]),
  },
  {
    id: "banana_yucca",
    scientific_name: "Yucca baccata",
    common_names: ["Banana Yucca", "Datil Yucca"],
    ecology: { habitat: "slopes, grassland margins", pollinators: ["yucca moth (Tegeticula — obligate mutualism)"], water_requirements: "low", biome: "sonoran_desert", terrain: ["slope", "rock"] },
    culture: { ...GATED_CULTURE, regional_uses: ["fruit eaten (regional)", "fiber + soap-root traditions (GATED)"] },
    ethnobotany: { food: ["fleshy fruit (regional)"], fiber: ["leaf fiber → cordage, sandals, basketry"], medicine: [], construction: ["fiber lashings"] },
    chemistry: { major_compounds: [{ name: "steroidal saponins (sarsasapogenin-type)", ref: "PubChem:verify", status: "verify" }, { name: "lignocellulose leaf fiber", ref: "ChEBI:verify", status: "verify" }] },
    pharmacology: { mechanisms: [{ effect: "surfactant / detergent (root saponins → 'amole' soap)", mechanism: "saponins emulsify oils, lower surface tension", safety: "external soap use; saponins irritant if ingested — educational only" }] },
    cellular_biology: { adaptations: ["fibrous leaves with thick cuticle", "obligate pollination mutualism with yucca moth"] },
    molecular_biology: { pathways: ["saponin (triterpenoid/steroidal) biosynthesis"] },
    gameplay: { quests: ["repair_bike_bag_with_yucca_fiber"], crafting: ["yucca_cord", "yucca_sandals", "yucca_soap", "basket"], discoveries: ["fiber_makes_cordage", "saponin_soap", "moth_mutualism"] },
    knowledge: { ...KNOWLEDGE0 },
    provenance: DRAFT(["USDA PLANTS", "Native Seeds/SEARCH", "PubChem"]),
  },
  {
    id: "desert_willow",
    scientific_name: "Chilopsis linearis",
    common_names: ["Desert Willow"],
    // NOTE: NOT a true willow (Bignoniaceae, not Salix) — does NOT contain
    // salicin. Salicin belongs to true Salix (see Goodding's Willow,
    // manifest). Kept distinct to avoid a common botanical error.
    ecology: { habitat: "washes, intermittent streambeds", pollinators: ["large bees (carpenter)", "hummingbirds"], water_requirements: "low-moderate; wash-associated", biome: "sonoran_desert", terrain: ["wash"] },
    culture: { ...GATED_CULTURE, regional_uses: ["ornamental; flexible withes for craft (regional)"] },
    ethnobotany: { food: [], fiber: ["flexible withes for basketry/bows (regional)"], medicine: [], construction: ["flexible branches"] },
    chemistry: { major_compounds: [{ name: "iridoid glycosides (Bignoniaceae) — to research", ref: "ChEBI:verify", status: "verify" }] },
    pharmacology: { mechanisms: [] },
    cellular_biology: { adaptations: ["linear leaves reduce heat load", "wash-edge water access"] },
    molecular_biology: { pathways: ["iridoid biosynthesis (to verify)"] },
    gameplay: { quests: [], crafting: ["flexible_withe"], discoveries: ["not_a_true_willow", "wash_indicator_plant"] },
    knowledge: { ...KNOWLEDGE0 },
    provenance: DRAFT(["USDA PLANTS", "Lady Bird Johnson Wildflower Center"]),
  },
  {
    id: "blue_palo_verde",
    scientific_name: "Parkinsonia florida",
    common_names: ["Blue Palo Verde"],
    ecology: { habitat: "washes, floodplains", pollinators: ["native bees", "honey bee"], water_requirements: "low; green bark photosynthesizes", biome: "sonoran_desert", terrain: ["wash"] },
    culture: { ...GATED_CULTURE, regional_uses: ["seeds/pods eaten (regional)", "nurse plant for saguaro"] },
    ethnobotany: { food: ["seeds (regional)"], fiber: [], medicine: [], construction: ["light wood"] },
    chemistry: { major_compounds: [{ name: "leaf/bark flavonoids", ref: "ChEBI:verify", status: "verify" }] },
    pharmacology: { mechanisms: [] },
    cellular_biology: { adaptations: ["green photosynthetic bark", "drought-deciduous tiny leaflets", "nitrogen-fixing nodules"] },
    molecular_biology: { pathways: ["biological nitrogen fixation", "bark chloroplast photosynthesis"] },
    gameplay: { quests: [], crafting: ["light_wood_part"], discoveries: ["green_bark_photosynthesis", "nurse_plant_for_saguaro"] },
    knowledge: { ...KNOWLEDGE0 },
    provenance: DRAFT(["USDA PLANTS", "Arizona-Sonora Desert Museum"]),
  },
  {
    id: "desert_ironwood",
    scientific_name: "Olneya tesota",
    common_names: ["Desert Ironwood"],
    ecology: { habitat: "washes; keystone nurse tree, very long-lived", pollinators: ["native bees"], water_requirements: "low", biome: "sonoran_desert", terrain: ["wash"] },
    culture: { ...GATED_CULTURE, regional_uses: ["extremely dense wood prized for carving (regional)", "seeds edible roasted"] },
    ethnobotany: { food: ["seeds (roasted, regional)"], fiber: [], medicine: [], construction: ["very hard, dense wood (carving, tools)"] },
    chemistry: { major_compounds: [{ name: "dense lignified hardwood", ref: "ChEBI:verify", status: "verify" }] },
    pharmacology: { mechanisms: [] },
    cellular_biology: { adaptations: ["dense lignified xylem (highest-density desert wood)", "nitrogen fixation", "nurse-plant canopy microclimate"] },
    molecular_biology: { pathways: ["lignin biosynthesis (phenylpropanoid)", "nitrogen fixation"] },
    gameplay: { quests: [], crafting: ["ironwood_tool", "ironwood_carving"], discoveries: ["density_strength_tradeoff", "keystone_nurse_tree"] },
    knowledge: { ...KNOWLEDGE0 },
    provenance: DRAFT(["USDA PLANTS", "Arizona-Sonora Desert Museum"]),
  },
  {
    id: "engelmann_prickly_pear",
    scientific_name: "Opuntia engelmannii",
    common_names: ["Engelmann Prickly Pear", "Nopal"],
    ecology: { habitat: "slopes, flats, disturbed ground", pollinators: ["bees (cactus bees)"], water_requirements: "very low (CAM)", biome: "sonoran_desert", terrain: ["flat", "rock"] },
    culture: { ...GATED_CULTURE, regional_uses: ["pads (nopales) and fruit (tunas) eaten — broadly documented regional food"] },
    ethnobotany: { food: ["pads (nopales)", "fruit (tunas)"], fiber: [], medicine: ["mucilage as demulcent (regional)"], construction: [] },
    chemistry: { major_compounds: [{ name: "mucilage (pectic polysaccharides)", ref: "PubChem:verify", status: "verify" }, { name: "betalains (betanin — red fruit pigment)", ref: "PubChem:CID6540685", status: "verify" }] },
    pharmacology: { mechanisms: [{ effect: "demulcent / water-binding (mucilage)", mechanism: "polysaccharide hydrogel binds water", safety: "food plant; glochids (tiny spines) are a physical hazard — educational/handling caution" }] },
    cellular_biology: { adaptations: ["CAM photosynthesis", "flattened water-storing pads (cladodes)", "glochids + spines (modified leaves)"] },
    molecular_biology: { pathways: ["CAM photosynthesis", "betalain biosynthesis"] },
    gameplay: { quests: [], crafting: ["nopal_food", "mucilage_binder"], discoveries: ["CAM", "betalain_pigment_for_dye", "mucilage_binds_water"] },
    knowledge: { ...KNOWLEDGE0 },
    provenance: DRAFT(["USDA PLANTS", "Native Seeds/SEARCH", "PubChem"]),
  },
  {
    id: "ocotillo",
    scientific_name: "Fouquieria splendens",
    common_names: ["Ocotillo"],
    ecology: { habitat: "rocky slopes, bajadas", pollinators: ["hummingbirds", "carpenter bees"], water_requirements: "very low; drought-deciduous (leafs out after rain)", biome: "sonoran_desert", terrain: ["rock", "slope"] },
    culture: { ...GATED_CULTURE, regional_uses: ["live-stake fencing from cut canes (regional)"] },
    ethnobotany: { food: [], fiber: [], medicine: ["bark/flower preparations (regional)"], construction: ["canes for living fences/ramadas"] },
    chemistry: { major_compounds: [{ name: "stem waxes / resins", ref: "ChEBI:verify", status: "verify" }] },
    pharmacology: { mechanisms: [] },
    cellular_biology: { adaptations: ["rapid leaf flush/drop tied to rainfall (multiple cycles/year)", "waxy stem to limit water loss"] },
    molecular_biology: { pathways: ["wax/cutin biosynthesis"] },
    gameplay: { quests: [], crafting: ["ocotillo_fence_cane"], discoveries: ["rain_triggered_leaves", "wax_waterproofing_preview_of_boat_ch5"] },
    knowledge: { ...KNOWLEDGE0 },
    provenance: DRAFT(["USDA PLANTS", "Arizona-Sonora Desert Museum"]),
  },
  {
    id: "desert_marigold",
    scientific_name: "Baileya multiradiata",
    common_names: ["Desert Marigold"],
    ecology: { habitat: "roadsides, sandy flats; spring/summer annual-perennial", pollinators: ["bees", "butterflies"], water_requirements: "low", biome: "sonoran_desert", terrain: ["sand", "flat"] },
    culture: { ...GATED_CULTURE, regional_uses: ["showy yellow wildflower; pollinator forage"] },
    ethnobotany: { food: [], fiber: [], medicine: [], construction: [] },
    chemistry: { major_compounds: [{ name: "flavonoids", ref: "ChEBI:verify", status: "verify" }, { name: "sesquiterpene lactones (toxic to livestock)", ref: "PubChem:verify", status: "verify" }] },
    pharmacology: { mechanisms: [{ effect: "livestock toxicity (sesquiterpene lactones)", mechanism: "lactones disrupt cellular processes", safety: "TOXIC if eaten — observe-only; a teaching example of 'pretty != safe' / dose-response" }] },
    cellular_biology: { adaptations: ["woolly white leaf hairs reflect light and reduce water loss"] },
    molecular_biology: { pathways: ["terpenoid (sesquiterpene lactone) biosynthesis", "flavonoid biosynthesis"] },
    gameplay: { quests: [], crafting: [], discoveries: ["woolly_hairs_reflect_sun", "pretty_can_be_toxic", "pollinator_forage"] },
    knowledge: { ...KNOWLEDGE0 },
    provenance: DRAFT(["USDA PLANTS", "Lady Bird Johnson Wildflower Center"]),
  },
];

export const SONORAN_PLANTS_BY_ID = Object.fromEntries(SONORAN_PLANTS.map((p) => [p.id, p]));

export default SONORAN_PLANTS;
