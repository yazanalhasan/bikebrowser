extends Node
class_name CraftingManager

signal recipe_crafted(recipe_id, result_id)

var recipes: Dictionary = {}

func load_recipes(recipe_file: String):
	var path = "res://addons/InventorySystem/" + recipe_file
	if FileAccess.file_exists(path):
		var file = FileAccess.open(path, FileAccess.READ)
		var data = JSON.parse_string(file.get_as_text())
		for recipe in data.get("recipes", []):
			recipes[recipe["id"]] = recipe

func can_craft(recipe_id: String, inventory: Resource) -> bool:
	var recipe = recipes.get(recipe_id)
	if not recipe:
		return false
	for req in recipe.get("requirements", []):
		if not inventory.has_item(req["id"], req.get("amount", 1)):
			return false
	return true

func craft(recipe_id: String, inventory: Resource) -> bool:
	if not can_craft(recipe_id, inventory):
		return false
	var recipe = recipes[recipe_id]
	for req in recipe.get("requirements", []):
		inventory.remove_item(req["id"], req.get("amount", 1))
	var result_id = recipe.get("result", "")
	var result_amount = recipe.get("result_amount", 1)
	inventory.add_item(result_id, result_amount)
	recipe_crafted.emit(recipe_id, result_id)
	return true
