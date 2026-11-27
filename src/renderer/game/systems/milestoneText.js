/**
 * Milestone requirements in words a child can read.
 *
 * Pure, so it can be tested without React. The milestones panel used to
 * print the raw record — "mine: copper_ore (0/1)", "quest: desert_survival
 * (0/1)" — straight onto the screen.
 */

/**
 * @param {{ type: string, target?: string, current?: number, required?: number }} condition
 * @returns {string} something a seven-year-old can act on
 */
export function describeCondition(condition) {
  if (!condition) return '';
  const thing = String(condition.target || '').replace(/_/g, ' ');
  const have = condition.current ?? 0;
  const need = condition.required ?? 1;
  // Only show a tally when more than one is wanted; "(0/1)" is noise.
  const count = need > 1 ? ` (${have}/${need})` : '';

  switch (condition.type) {
    case 'mine': return `Mine some ${thing}${count}`;
    case 'quest': return `Finish "${thing}"${count}`;
    case 'item': return `Find ${thing}${count}`;
    case 'craft': return `Craft ${thing}${count}`;
    case 'visit': return `Visit ${thing}${count}`;
    case 'refine': return `Refine ${thing}${count}`;
    case 'bio': return `Collect ${thing}${count}`;
    case 'milestone': return `Reach "${thing}" first${count}`;
    case 'discover_region': return `Explore ${thing}${count}`;
    default: return `${thing || condition.type}${count}`;
  }
}
