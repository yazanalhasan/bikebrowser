import { speciesById, methodById, METHODS } from '../../data/chapter2/ethnobotanySpecies.js';

// ExtractionModel — Chapter 2's biology carry-forward rig (the Extraction Bench,
// the first instrument of the Biology Workbench). It is the living analog of the
// Materials Lab / CircuitModel: given a (species, part, method) it reports what
// the player gets — and *why the method matters*. The verdict reads entirely from
// the species' declared part→method→product mapping; nothing is hard-coded here.
//
// Outcomes:
//   'yield'  — correct method → the product (food/fiber/dye/medicine/fuel/drink).
//   'wrong'  — a plausible-but-incorrect method → no useful product + the reason
//              (the teaching contrast: same part, different method, different
//              outcome — the seed of phytochemistry in Chapter 3).
//   'inert'  — a method with no defined effect on this part → nothing happens.

export class ExtractionModel {
  process(speciesId, partId, methodId) {
    const species = speciesById(speciesId);
    const method = methodById(methodId);
    if (!species || !method) {
      return { ok: false, outcome: 'invalid', reason: 'pick a plant, a part, and a method.' };
    }
    const part = species.parts.find((p) => p.id === partId);
    if (!part) return { ok: false, outcome: 'invalid', reason: 'pick a part of the plant.' };

    if (methodId === part.method) {
      return {
        ok: true,
        outcome: 'yield',
        product: part.product,
        category: part.category,
        reason: `${cap(method.verb)}ing the ${part.name} of ${species.name} yields ${article(part.product)} — a ${part.category}.`,
        species: species.id,
        part: part.id,
        method: methodId,
      };
    }

    if (part.wrong && methodId === part.wrong.method) {
      return {
        ok: false,
        outcome: 'wrong',
        product: null,
        category: null,
        reason: `${cap(method.verb)}ing the ${part.name} fails: ${part.wrong.because}`,
        correctMethod: part.method,
        species: species.id,
        part: part.id,
        method: methodId,
      };
    }

    return {
      ok: false,
      outcome: 'inert',
      product: null,
      category: null,
      reason: `${cap(method.verb)}ing the ${part.name} does nothing useful — try the method that suits this part.`,
      correctMethod: part.method,
      species: species.id,
      part: part.id,
      method: methodId,
    };
  }

  // All (part → product) pairs a species can produce — for the bench's "what can
  // this plant become?" summary and for the knowledge-graph hook.
  productsOf(speciesId) {
    const species = speciesById(speciesId);
    if (!species) return [];
    return species.parts.map((p) => ({
      part: p.id, partName: p.name, method: p.method, product: p.product, category: p.category,
    }));
  }

  methods() { return METHODS; }
}

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function article(s) { return /^[aeiou]/i.test(s) ? `an ${s}` : `a ${s}`; }

export default ExtractionModel;
