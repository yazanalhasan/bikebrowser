extends Node

# CANONICAL RUNTIME SYSTEM
# This is the authoritative first-loop gameplay inventory manager.
# Generated inventory addons are library/demo systems unless bridged here.

var items: Dictionary = {
	"field_notebook": { "quantity": 1, "kind": "tool" },
	"wrench": { "quantity": 1, "kind": "tool" },
	"chain_lube": { "quantity": 1, "kind": "tool" },
	"inner_tube": { "quantity": 1, "kind": "mechanics" },
	"patch_kit": { "quantity": 1, "kind": "mechanics" },
	"copper_ore": { "quantity": 1, "kind": "materials" },
	"water_test_strip": { "quantity": 1, "kind": "biology" },
	"plant_sample": { "quantity": 1, "kind": "biology" },
}

var learned_recipes: Dictionary = {}

const ITEM_LABELS := {
	"field_notebook": "Field Notebook",
	"wrench": "Wrench",
	"chain_lube": "Chain Lube",
	"inner_tube": "Inner Tube",
	"patch_kit": "Patch Kit",
	"inner_tube_ready": "Ready Inner Tube",
	"mrs_ramirez_rear_tube_flat": "Mrs. Ramirez's rear tube (flat, slow leak)",
	"mrs_ramirez_rear_tube_repaired": "Mrs. Ramirez's rear tube (repaired)",
	"mrs_ramirez_bike_ready": "Mrs. Ramirez's bike: ready to ride",
	"copper_ore": "Copper Ore",
	"surface_copper": "Surface Copper",
	"deep_copper": "Deep Copper Ore",
	"wire_spool": "Wire Spool",
	"refined_copper": "Refined Copper",
	"water_test_strip": "Water Test Strip",
	"plant_sample": "Plant Sample",
	"yucca_fiber": "Yucca Fiber",
	"agave_fiber": "Agave Fiber",
	"jojoba_bean": "Jojoba Bean",
	"creosote_leaves": "Creosote Leaves",
	"cactus_water": "Cactus Water",
	"desert_fiber_bundle": "Desert Fiber Bundle",
	"water_filter": "Water Filter",
	"algae_sample": "Algae Sample",
	"microbial_sample": "Microbial Sample",
	"river_minerals": "River Minerals",
	"reed_fiber": "Reed Fiber",
	"organic_compound": "Organic Compound",
	"irrigation_valve": "Irrigation Valve",
	"copper_evidence_note": "Copper Evidence Note",
	"plant_observation_note": "Plant Observation Note",
	"water_evidence_note": "Water Evidence Note",
	"regional_travel_sketchbook": "Regional Travel Sketchbook",
	"spacecraft_clue_card": "Spacecraft Clue Card",
	"hard_hat": "Hard Hat",
}

const RECIPES := {
	"patch_ready_tube": {
		"name": "Patch a Ready Tube",
		"hint": "Learn this by inspecting and patching the flat tire.",
		"ingredients": ["inner_tube", "patch_kit"],
		"result": "inner_tube_ready",
		"resultKind": "crafted",
		"learnQuest": "act1_pre_ride_check",
		"learnObjective": "patch_applied",
	},
	"copper_conductivity_note": {
		"name": "Copper Conductivity Note",
		"hint": "Learn this after the copper conductivity test.",
		"ingredients": ["copper_ore", "water_test_strip"],
		"result": "copper_evidence_note",
		"resultKind": "note",
		"learnQuest": "copper_rock_id",
		"learnObjective": "test_conductivity",
	},
	"plant_field_note": {
		"name": "Plant Field Note",
		"hint": "Learn this when plant observations go into the notebook.",
		"ingredients": ["plant_sample", "field_notebook"],
		"result": "plant_observation_note",
		"resultKind": "note",
		"learnQuest": "desert_plant_observation",
		"learnObjective": "journal_observations",
	},
}

func _ready() -> void:
	EventBus.quest_step_completed.connect(_on_quest_step_completed)
	EventBus.reward_intent.connect(_on_reward_intent)
	EventBus.inventory_updated.emit(get_inventory_snapshot())

func has_item(item_id: String) -> bool:
	return items.has(item_id) and int(items[item_id].get("quantity", 0)) > 0

func add_item(item_id: String, quantity: int = 1, kind: String = "item") -> void:
	var entry: Dictionary = items.get(item_id, { "quantity": 0, "kind": kind })
	entry["quantity"] = int(entry.get("quantity", 0)) + quantity
	entry["kind"] = kind
	items[item_id] = entry
	EventBus.emit_game_event("inventory_changed", { "itemId": item_id, "quantity": entry["quantity"] })
	EventBus.inventory_updated.emit(get_inventory_snapshot())

func remove_item(item_id: String, quantity: int = 1) -> void:
	if not items.has(item_id):
		return
	var entry: Dictionary = items[item_id]
	entry["quantity"] = max(int(entry.get("quantity", 0)) - quantity, 0)
	items[item_id] = entry
	EventBus.emit_game_event("inventory_changed", { "itemId": item_id, "quantity": entry["quantity"] })
	EventBus.inventory_updated.emit(get_inventory_snapshot())

func learn_recipe(recipe_id: String) -> bool:
	if not RECIPES.has(recipe_id):
		return false
	if learned_recipes.has(recipe_id):
		return true
	learned_recipes[recipe_id] = {
		"learnedAt": Time.get_datetime_string_from_system(true)
	}
	EventBus.emit_game_event("recipe_learned", { "recipeId": recipe_id })
	EventBus.inventory_updated.emit(get_inventory_snapshot())
	return true

func is_recipe_learned(recipe_id: String) -> bool:
	return learned_recipes.has(recipe_id)

func combine_items(first_item_id: String, second_item_id: String) -> bool:
	var recipe_id := find_recipe_for_items(first_item_id, second_item_id)
	if recipe_id.is_empty():
		_emit_recipe_feedback("Those two do not make a useful Act 1 note yet.", "quiet")
		return false
	return craft_recipe(recipe_id)

func find_recipe_for_items(first_item_id: String, second_item_id: String) -> String:
	for recipe_id in RECIPES.keys():
		var ingredients: Array = RECIPES[recipe_id].get("ingredients", [])
		if ingredients.size() == 2 and ingredients.has(first_item_id) and ingredients.has(second_item_id):
			return String(recipe_id)
	return ""

func craft_recipe(recipe_id: String) -> bool:
	if not RECIPES.has(recipe_id):
		_emit_recipe_feedback("That recipe is not in this notebook.", "quiet")
		return false
	var recipe: Dictionary = RECIPES[recipe_id]
	if not learned_recipes.has(recipe_id):
		_emit_recipe_feedback("Not learned yet: %s" % String(recipe.get("hint", "try the related quest first.")), "quiet")
		return false
	for ingredient in recipe.get("ingredients", []):
		if not has_item(String(ingredient)):
			_emit_recipe_feedback("Missing %s." % _item_name(String(ingredient)), "quiet")
			return false
	var result := String(recipe.get("result", ""))
	if result.is_empty():
		return false
	add_item(result, 1, String(recipe.get("resultKind", "crafted")))
	_emit_recipe_feedback("Added %s to the notebook." % _item_name(result), "warm")
	SaveService.save_now("inventory_recipe")
	return true

func get_inventory_snapshot() -> Dictionary:
	return {
		"items": get_item_cards(),
		"recipes": get_recipe_cards(),
		"learnedRecipes": get_learned_recipe_cards(),
	}

func get_item_cards() -> Array:
	var cards: Array = []
	for item_id in items.keys():
		var entry: Dictionary = items[item_id]
		if int(entry.get("quantity", 0)) <= 0:
			continue
		cards.append({
			"id": item_id,
			"name": _item_name(String(item_id)),
			"quantity": int(entry.get("quantity", 0)),
			"kind": String(entry.get("kind", "item")),
		})
	return cards

func get_recipe_cards() -> Array:
	var cards: Array = []
	for recipe_id in RECIPES.keys():
		var recipe: Dictionary = RECIPES[recipe_id]
		var ingredient_names: Array[String] = []
		for ingredient in recipe.get("ingredients", []):
			ingredient_names.append(_item_name(String(ingredient)))
		cards.append({
			"id": recipe_id,
			"name": String(recipe.get("name", recipe_id)),
			"ingredients": ingredient_names,
			"result": _item_name(String(recipe.get("result", ""))),
			"learned": learned_recipes.has(recipe_id),
			"hint": String(recipe.get("hint", "")),
		})
	return cards

func get_learned_recipe_cards() -> Array:
	var cards: Array = []
	for card in get_recipe_cards():
		if bool(card.get("learned", false)):
			cards.append(card)
	return cards

func serialize() -> Dictionary:
	return {
		"items": items,
		"learnedRecipes": learned_recipes,
	}

func _on_quest_step_completed(quest_id: String, objective_id: String) -> void:
	for recipe_id in RECIPES.keys():
		var recipe: Dictionary = RECIPES[recipe_id]
		if String(recipe.get("learnQuest", "")) == quest_id and String(recipe.get("learnObjective", "")) == objective_id:
			learn_recipe(String(recipe_id))

func _on_reward_intent(reward: Dictionary) -> void:
	for item_id in reward.get("items", []):
		add_item(String(item_id), 1, "quest")

func _emit_recipe_feedback(message: String, tone: String) -> void:
	EventBus.recipe_feedback.emit(message, tone)
	EventBus.interaction_feedback.emit(message, tone)

func _item_name(item_id: String) -> String:
	return String(ITEM_LABELS.get(item_id, item_id.replace("_", " ").capitalize()))
