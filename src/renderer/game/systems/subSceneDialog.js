/**
 * What a sub-scene dialog is asking the scene to do.
 *
 * A sub-scene (the mine, the foraging grounds, the river) opens three kinds
 * of dialog: a side-quest offer, a running side-quest step, and an embedded
 * challenge. Only the first two were routed anywhere. A challenge answer
 * fell through to the main-quest advance, so a child who picked the wrong
 * answer in the mine was never told — the box just said "Grab a steel
 * bracket…", the next step of a completely different quest.
 *
 * Pure so it can be tested without Phaser.
 */

/**
 * @param {object} dialog the registry `dialogEvent`
 * @param {number} [choiceIndex]
 * @returns {{ challengeId: string, choiceIndex: number }|null}
 */
export function challengeDialogAction(dialog, choiceIndex) {
  const step = dialog?.step;
  if (step?.type !== 'embedded_challenge' || !step.challengeId) return null;
  // No pick means the child closed the box; nothing to mark right or wrong.
  if (choiceIndex == null) return null;
  return { challengeId: step.challengeId, choiceIndex };
}
