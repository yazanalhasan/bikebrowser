extends Node

# CANONICAL RUNTIME SYSTEM
# Normalizes accomplishment moments into tiered sound and HUD feedback.

const DEBOUNCE_MSEC := 450
const CAPSTONE_QUESTS := {
	"act1_regional_readiness": true,
}

var last_emit_msec: Dictionary = {}
var seen_inventory_items: Dictionary = {}
var seen_recipes: Dictionary = {}
var notebook_primed := false
var inventory_primed := false
var suppress_notebook_until_msec := 0

func _ready() -> void:
	EventBus.quest_step_completed.connect(_on_quest_step_completed)
	EventBus.quest_completed.connect(_on_quest_completed)
	EventBus.game_event.connect(_on_game_event)
	EventBus.notebook_updated.connect(_on_notebook_updated)
	EventBus.inventory_updated.connect(_on_inventory_updated)
	EventBus.recipe_feedback.connect(_on_recipe_feedback)

func emit_accomplishment(tier: String, key: String, label: String, kind: String = "accomplishment", payload: Dictionary = {}) -> void:
	var clean_tier := tier.strip_edges().to_lower()
	if not ["tiny", "small", "medium", "large"].has(clean_tier):
		clean_tier = "small"
	var clean_key := key.strip_edges()
	if clean_key.is_empty():
		clean_key = "%s:%s" % [kind, label]
	var now := Time.get_ticks_msec()
	var last := int(last_emit_msec.get(clean_key, -100000))
	if now - last < DEBOUNCE_MSEC:
		return
	last_emit_msec[clean_key] = now
	var event := payload.duplicate(true)
	event["tier"] = clean_tier
	event["key"] = clean_key
	event["label"] = label
	event["kind"] = kind
	event["timestamp"] = Time.get_datetime_string_from_system(true)
	EventBus.accomplishment_feedback.emit(event)
	EventBus.emit_game_event("accomplishment_feedback", event)

func _on_quest_step_completed(quest_id: String, step_id: String) -> void:
	suppress_notebook_until_msec = Time.get_ticks_msec() + 250
	emit_accomplishment("tiny", "quest_step:%s:%s" % [quest_id, step_id], "Objective complete", "objective", {
		"questId": quest_id,
		"stepId": step_id,
	})

func _on_quest_completed(quest_id: String) -> void:
	suppress_notebook_until_msec = Time.get_ticks_msec() + 250
	var tier := "large" if CAPSTONE_QUESTS.has(quest_id) else "medium"
	emit_accomplishment(tier, "quest_complete:%s" % quest_id, "Quest complete", "quest", {
		"questId": quest_id,
	})

func _on_game_event(event: Dictionary) -> void:
	var event_type := String(event.get("type", ""))
	if event_type == "recipe_learned":
		var recipe_id := String(event.get("recipeId", ""))
		if not recipe_id.is_empty():
			_emit_recipe_learned(recipe_id)
	elif event_type == "discovery_unlocked":
		var discovery_id := String(event.get("discoveryId", ""))
		if not discovery_id.is_empty():
			emit_accomplishment("small", "discovery:%s" % discovery_id, "Notebook updated", "notebook", event)

func _on_notebook_updated(_snapshot: Dictionary) -> void:
	if not notebook_primed:
		notebook_primed = true
		return
	if Time.get_ticks_msec() < suppress_notebook_until_msec:
		return
	emit_accomplishment("small", "notebook:%d" % Time.get_ticks_msec(), "Notebook updated", "notebook")

func _on_inventory_updated(snapshot: Dictionary) -> void:
	var items: Array = snapshot.get("items", [])
	var recipes: Array = snapshot.get("learnedRecipes", [])
	if not inventory_primed:
		for item in items:
			seen_inventory_items[String(item.get("id", ""))] = true
		for recipe in recipes:
			seen_recipes[String(recipe.get("id", ""))] = true
		inventory_primed = true
		return
	for item in items:
		var item_id := String(item.get("id", ""))
		if item_id.is_empty() or seen_inventory_items.has(item_id):
			continue
		seen_inventory_items[item_id] = true
		emit_accomplishment("small", "item:%s" % item_id, "Item added", "item", { "itemId": item_id })
	for recipe in recipes:
		var recipe_id := String(recipe.get("id", ""))
		if recipe_id.is_empty() or seen_recipes.has(recipe_id):
			continue
		seen_recipes[recipe_id] = true
		_emit_recipe_learned(recipe_id)

func _on_recipe_feedback(_message: String, tone: String) -> void:
	if tone == "warm":
		emit_accomplishment("small", "recipe_feedback:%d" % Time.get_ticks_msec(), "Notebook updated", "notebook")

func _emit_recipe_learned(recipe_id: String) -> void:
	if seen_recipes.has(recipe_id):
		return
	seen_recipes[recipe_id] = true
	emit_accomplishment("small", "recipe:%s" % recipe_id, "Recipe learned", "recipe", { "recipeId": recipe_id })
