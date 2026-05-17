# Inventory and Crafting System Addon

Complete inventory management and recipe-based crafting system.

## Installation

Copy folder to `res://addons/InventorySystem/` and enable in Project Settings.

## Usage

```gdscript
var inv = Inventory.new()
inv.add_item("copper_ore", 5)

CraftingManager.load_recipes("recipes.json")
CraftingManager.craft("copper_wire", inv)
```
