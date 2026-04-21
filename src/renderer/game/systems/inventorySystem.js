/**
 * Inventory system — manages the player's items.
 *
 * Operates on a plain array of item-id strings stored in save data.
 * The Phaser scene or React HUD can read the array at any time.
 */

import ITEMS from '../data/items.js';

/** Return full item metadata for every item id in the list. */
export function resolveInventory(itemIds = []) {
  return itemIds
    .map((id) => ITEMS[id])
    .filter(Boolean);
}

/** Add an item id to the inventory array and return the new array. */
export function addItem(inventory, itemId) {
  if (!ITEMS[itemId]) return inventory; // unknown item — no-op
  return [...inventory, itemId];
}

/** Remove the first occurrence of an item id. Returns [newInventory, removed]. */
export function removeItem(inventory, itemId) {
  const index = inventory.indexOf(itemId);
  if (index === -1) return [inventory, false];
  const copy = [...inventory];
  copy.splice(index, 1);
  return [copy, true];
}

/** Check whether the inventory contains at least one of the given item. */
export function hasItem(inventory, itemId) {
  return inventory.includes(itemId);
}
