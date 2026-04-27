/**
 * questTemplating — pure helper for token-replacing dialog text from
 * player-derived state.
 *
 * Why this exists: quest steps that read out measurement results
 * (Mr. Chen's `quiz_weight`, `quiz_strength`) used to hard-code canonical
 * literals (e.g. "Mesquite: 0.83 g/cm³"). That short-circuits the
 * measurement loop — the player's actual scale readings never make it
 * into the conversation. This helper resolves placeholder tokens like
 * `{massTable}` and `{strengthTable}` from `state.materialLog` and
 * `state.materialTestsCompleted`.
 *
 * Design constraints:
 *   - Pure function. No Phaser, no DOM, no globals, no I/O.
 *   - Falls through to original text unchanged if `templateVars` is
 *     absent or empty — non-templated steps stay byte-identical.
 *   - Empty source data (e.g. player skipped the lab) renders an
 *     explicit "(no measurements yet)" so the dialog reads as "go
 *     measure first" rather than handing the player the answer.
 *
 * Used by:
 *   - NeighborhoodScene._emitEnrichedDialog — interpolates before the
 *     dialog event fires.
 */

import { MATERIALS } from './materials/materialDatabase.js';

/**
 * Replace `{massTable}` / `{strengthTable}` tokens in `text` using
 * data from `state`.
 *
 * @param {string} text
 * @param {string[]|undefined} templateVars — names of tokens to resolve.
 * @param {object} state — gameState
 * @returns {string}
 */
export function interpolateStepText(text, templateVars, state) {
  if (typeof text !== 'string') return text;
  if (!Array.isArray(templateVars) || templateVars.length === 0) return text;

  let out = text;

  if (templateVars.includes('massTable')) {
    const log = Array.isArray(state?.materialLog) ? state.materialLog : [];
    const rows = log
      .map((r) => {
        const mass = Number.isFinite(r?.massGrams) ? r.massGrams : 0;
        const density = mass / 10; // 10 cm³ uniform coupons
        const name = r?.name || r?.id || '?';
        return `  ${name}: ${mass.toFixed(2)} g (${density.toFixed(2)} g/cm³)`;
      })
      .join('\n');
    out = out.replace('{massTable}', rows || '  (no measurements yet)');
  }

  if (templateVars.includes('strengthTable')) {
    const completed = Array.isArray(state?.materialTestsCompleted)
      ? state.materialTestsCompleted
      : [];
    const rows = completed
      .map((id) => {
        const m = MATERIALS[id];
        const name = m?.name || id;
        // No `strengthPct` in materialDatabase — derive a 0-100% rating
        // from ultimateStrengthMPa using a 600 MPa ceiling so steel
        // (~450 MPa) lands at 75%, mesquite (~100 MPa) at ~17%, copper
        // (~250 MPa) at ~42%. The ratings are *relative* and rendered
        // in-context, not asserted as absolute numbers.
        const ult = Number.isFinite(m?.ultimateStrengthMPa)
          ? m.ultimateStrengthMPa
          : null;
        const pct = ult == null ? null : Math.round((ult / 600) * 100);
        const pctStr = pct == null ? '—' : `${pct}%`;
        return `  ${name}: ${pctStr}`;
      })
      .join('\n');
    out = out.replace('{strengthTable}', rows || '  (no tests yet)');
  }

  return out;
}
