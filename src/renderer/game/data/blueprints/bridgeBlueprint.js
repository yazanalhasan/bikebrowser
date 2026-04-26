/**
 * Bridge blueprints — data definitions for ConstructionSystem consumers.
 *
 * Each blueprint declares a set of placement slots (where parts go in
 * scene-space), a state key under which the placed-slot ids array is
 * persisted, and a completion contract (observation + dialog + quest tag).
 *
 * The current canonical blueprint is mesquite-only. Future variants
 * (steel = overkill animation, copper = collapse animation) live as
 * additional exports here when the answer-branching dispatch lands.
 */

/**
 * Mesquite-beam bridge spanning the dry wash.
 *
 * Slots are arranged in a horizontal line at y≈400 — the wash channel
 * cuts across the scene at the same y, so the beams visually bridge it.
 * Four beams keep the build short enough that a ~5–8 year old player
 * doesn't lose interest, while still feeling like a real construction.
 *
 * @type {import('../../systems/construction/constructionSystem.js').ConstructionBlueprint}
 */
export const BRIDGE_MESQUITE_BLUEPRINT = {
  id: 'mesquite_bridge_v1',
  name: 'Mesquite Bridge',
  // Drag-and-drop placement (ConstructionSystem mode === 'drag'). Player
  // presses on a ghost beam, drags into the wash, drops on any unplaced
  // anchor to lock it in. Esc cancels mid-flight. Other blueprints that
  // omit this field (or set 'click') keep the legacy click-to-place path.
  mode: 'drag',
  slots: [
    { id: 'beam_a', x: 220, y: 400, w: 130, h: 18, type: 'beam' },
    { id: 'beam_b', x: 350, y: 400, w: 130, h: 18, type: 'beam' },
    { id: 'beam_c', x: 480, y: 400, w: 130, h: 18, type: 'beam' },
    { id: 'beam_d', x: 610, y: 400, w: 130, h: 18, type: 'beam' },
  ],
  stateKey: 'bridgeBuiltSlots',
  completion: {
    observation: 'bridge_built',
    stateFlag: 'bridgeBuilt',
    questId: 'bridge_collapse',
    dialogSpeaker: 'Mr. Chen',
    dialogText:
      'It holds! Watch — the bike rolled across without a creak. ' +
      "You picked the right material, and the bridge is your proof.\n\n" +
      "Mesquite is light, strong enough for the load, and dry-desert tough. " +
      "That's how engineers think.",
  },
};

export default BRIDGE_MESQUITE_BLUEPRINT;
