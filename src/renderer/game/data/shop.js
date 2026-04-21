/**
 * Garage Shop — items and upgrades Zuzu can buy with Zuzubucks.
 *
 * Each entry:
 *   id       — unique key, stored in save.upgrades or save.inventory
 *   name     — display name
 *   description — what it does
 *   icon     — emoji
 *   cost     — Zuzubucks price
 *   type     — 'upgrade' (permanent) or 'consumable'
 *   requires — optional prerequisite upgrade id
 */

const SHOP_ITEMS = [
  {
    id: 'tool_rack',
    name: 'Tool Rack',
    description: 'A wall-mounted rack. Keeps your tools organized — faster repairs!',
    icon: '🗄️',
    cost: 20,
    type: 'upgrade',
    requires: null,
  },
  {
    id: 'work_light',
    name: 'Work Light',
    description: 'A bright lamp for your workbench. See small parts clearly.',
    icon: '💡',
    cost: 15,
    type: 'upgrade',
    requires: null,
  },
  {
    id: 'repair_stand',
    name: 'Repair Stand',
    description: 'A bike stand that holds the bike up while you work. Pro-level!',
    icon: '🔩',
    cost: 40,
    type: 'upgrade',
    requires: 'tool_rack',
  },
  {
    id: 'extra_patch_kit',
    name: 'Extra Patch Kit',
    description: 'An extra set of patches and glue. Always good to have spares.',
    icon: '🩹',
    cost: 10,
    type: 'consumable',
    requires: null,
  },
];

export default SHOP_ITEMS;

export const SHOP_MAP = Object.fromEntries(SHOP_ITEMS.map((i) => [i.id, i]));

/**
 * Get purchasable items based on current state.
 * @param {object} state — game save state
 * @returns {object[]} — items with `canBuy` and `owned` flags
 */
export function getShopItems(state) {
  const owned = new Set([...(state?.upgrades || []), ...(state?.inventory || [])]);
  const bucks = state?.zuzubucks || 0;

  return SHOP_ITEMS.map((item) => {
    const isOwned = item.type === 'upgrade' && owned.has(item.id);
    const reqMet = !item.requires || owned.has(item.requires);
    const canAfford = bucks >= item.cost;

    return {
      ...item,
      owned: isOwned,
      canBuy: !isOwned && reqMet && canAfford,
      locked: !reqMet,
      lockReason: !reqMet ? `Requires: ${SHOP_MAP[item.requires]?.name || item.requires}` : null,
    };
  });
}
