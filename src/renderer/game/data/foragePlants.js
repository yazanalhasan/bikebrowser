/**
 * Forage plant content — what a plant gives and what Zuzu says about it.
 *
 * Canonical data for the foraging surface shared by every scene that
 * scatters desert plants (`systems/foragingScenery.js`). This map used to
 * live inline in `scenes/StreetBlockScene.js` as two private objects, which
 * meant a second scene with plants had to copy both. It is data, so it
 * lives here (arc.md §4: data is canonical; behavior derives from data).
 *
 * `items` is the full set of things a species can grant. Whether any of
 * them is actually granted on a given interaction is a quest-state
 * decision made in `systems/foragingScenery.js` — this file says what is
 * possible, not when.
 *
 * Species keys match `data/flora.js` `name` and the `species` field in the
 * scene layout JSON. Adding a plant to a layout needs an entry here and
 * nothing else.
 */

export const FORAGE_PLANTS = {
  mesquite: {
    items: ['mesquite_pods', 'mesquite_wood_sample', 'bio_sample_bacteria'],
    desc: 'A mesquite tree! Its pods are nutritious and its wood makes excellent charcoal. '
      + 'Animals gather here to eat the pods. The soil around its roots is full of desert microbes.',
  },
  creosote: {
    items: ['creosote_leaves'],
    desc: 'Creosote bush — its resin is antimicrobial and anti-inflammatory. '
      + 'Careful: toxic in large doses!',
  },
  prickly_pear: {
    items: ['prickly_pear_fruit'],
    desc: 'Prickly pear cactus! The fruit is sweet and hydrating. The pads are edible too.',
  },
  barrel_cactus: {
    items: ['barrel_cactus_pulp'],
    desc: 'Barrel cactus — it has moisture inside but the pulp is bitter and can cause nausea.',
  },
  jojoba: {
    items: ['jojoba_seeds'],
    desc: 'Jojoba shrub — its seeds produce a stable liquid wax. Natural sunscreen and lubricant!',
  },
  agave: {
    items: ['agave_fiber', 'bio_sample_agave'],
    desc: 'Agave plant — strong fibers for rope and bandages. The sap has healing properties.',
  },
  yucca: {
    items: ['yucca_root'],
    desc: 'Yucca — the root contains natural soap (saponins). '
      + 'Used for cleaning and surfactants for thousands of years.',
  },
  desert_lavender: {
    items: ['desert_lavender_flowers'],
    desc: 'Desert lavender — purple flowers with a calming scent. '
      + 'Makes a soothing tea that improves focus.',
  },
  ephedra: {
    items: ['ephedra_stems'],
    desc: 'Ephedra (Mormon Tea) — a powerful natural stimulant. '
      + 'Boosts energy but stresses the heart. Use with caution!',
  },
  yerba_mansa: {
    items: ['yerba_mansa_root'],
    desc: 'Yerba mansa — powerful antimicrobial root found near water. '
      + "The desert's natural antibiotic.",
  },
};

/** Items a species can grant. Empty for an unknown species. */
export function getForageItems(species) {
  return FORAGE_PLANTS[species]?.items || [];
}

/** Zuzu's line about a species, with a plain fallback for unknown plants. */
export function getForageDescription(species, label) {
  return FORAGE_PLANTS[species]?.desc || `A ${label}.`;
}

export default FORAGE_PLANTS;
