import { CELL_SLOTS, CELL_CATALOG, cellOptionById } from '../../data/chapter4/cellular.js';

// CellModel — Chapter 4's cellular-biology carry-forward rig (the Microscope). It
// decides whether the player can actually SEE cells, in the order light physics
// demands: the sample must be translucent (thin), the magnification must resolve a
// cell, and a stain must give contrast. Only then are the sample's structures
// revealed. Verdict reads only from the option data.
//
// Verdict priority: opaque (no light) > too_coarse (can't resolve) > no_contrast
// (transparent) > resolved.

export class CellModel {
  resolve(selection = {}) {
    return CELL_SLOTS.map((slot) => ({ slot, id: selection[slot] || null, opt: cellOptionById(slot, selection[slot]) }));
  }

  solve(selection = {}) {
    const parts = this.resolve(selection);
    const missing = parts.filter((p) => !p.opt).map((p) => p.slot);
    if (missing.length) {
      return { ok: false, verdict: 'incomplete', reason: `prepare the slide (missing: ${missing.join(', ')})`, missing };
    }
    const by = Object.fromEntries(parts.map((p) => [p.slot, p.opt]));

    let verdict; let reason; let revealed = [];
    if (!by.prep.translucent) {
      verdict = 'opaque';
      reason = `Opaque: a ${by.prep.name.toLowerCase()} blocks the light — nothing reaches the eyepiece. Cut a thin section.`;
    } else if (!by.mag.resolves) {
      verdict = 'too_coarse';
      reason = `Too coarse: ${by.mag.name} sees tissue but can't resolve a single cell. Use a higher objective.`;
    } else if (!by.stain.contrast) {
      verdict = 'no_contrast';
      reason = `No contrast: unstained cells are nearly transparent — a colourless blur. Add a stain.`;
    } else {
      verdict = 'resolved';
      revealed = by.sample.structures;
      reason = `Resolved: you can see ${revealed.join(', ')} in the ${by.sample.name.toLowerCase()}. ${by.sample.alive ? 'It is alive — built from cells, like everything living.' : ''}`;
    }

    return {
      ok: verdict === 'resolved',
      verdict,
      reason,
      revealed,
      sampleAlive: by.sample.alive,
      members: parts,
      missing: [],
    };
  }

  catalog() { return CELL_CATALOG; }
}

export default CellModel;
