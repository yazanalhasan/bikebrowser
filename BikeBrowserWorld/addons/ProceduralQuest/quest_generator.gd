extends Node
class_name QuestGenerator

enum QuestType { FETCH, DELIVERY, EXPLORATION, COLLECTION, TALKING, CRAFTING, REPAIR }

var location_db: Dictionary = {}
var item_db: Dictionary = {}
var npc_db: Dictionary = {}
var quest_templates: Dictionary = {}

func _ready():
	load_databases()

func load_databases():
	_load_json("location_database.json", location_db)
	_load_json("item_database.json", item_db)
	_load_json("npc_database.json", npc_db)
	_load_json("quest_templates.json", quest_templates)

func _load_json(filename: String, target: Dictionary):
	var path = "res://addons/ProceduralQuest/" + filename
	if FileAccess.file_exists(path):
		var file = FileAccess.open(path, FileAccess.READ)
		var data = JSON.parse_string(file.get_as_text())
		if data:
			for key in data:
				target[key] = data[key]

func generate_quest(quest_type: QuestType, difficulty: int = 1, giver: String = "") -> Dictionary:
	var template = quest_templates.get(str(quest_type), {})
	if template.is_empty():
		return _create_fallback_quest()
	var quest = {
		"id": "proc_quest_" + str(Time.get_unix_time_from_system()),
		"name": template.get("name", "A New Quest"),
		"type": quest_type,
		"difficulty": difficulty,
		"giver": giver if not giver.is_empty() else _get_random_npc(),
		"steps": [],
		"reward": {
			"gold": 10 * difficulty,
			"xp": 5 * difficulty,
			"reputation": difficulty
		},
		"repeatable": true
	}
	match quest_type:
		QuestType.FETCH:
			var item = _get_random_item()
			var location = _get_random_location()
			quest["name"] = "Fetch the " + item
			quest["steps"] = [
				{"action": "travel_to", "location": location},
				{"action": "collect", "item": item, "amount": 1 + difficulty},
				{"action": "return_to", "npc": quest["giver"]}
			]
			quest["objective"] = "Bring " + str(1 + difficulty) + " " + item + " from " + location
		QuestType.DELIVERY:
			var recipient = _get_random_npc()
			var item = _get_random_item()
			quest["name"] = "Deliver the " + item
			quest["steps"] = [
				{"action": "talk_to", "npc": quest["giver"]},
				{"action": "deliver", "item": item, "to": recipient},
				{"action": "return_to", "npc": quest["giver"]}
			]
			quest["objective"] = "Deliver " + item + " to " + recipient
		QuestType.COLLECTION:
			var item = _get_random_item()
			var amount = 3 + difficulty * 2
			quest["name"] = "Collect " + str(amount) + " " + item + "s"
			quest["steps"] = [
				{"action": "collect", "item": item, "amount": amount},
				{"action": "return_to", "npc": quest["giver"]}
			]
			quest["objective"] = "Collect " + str(amount) + " " + item
		QuestType.EXPLORATION:
			var location = _get_random_location()
			quest["name"] = "Explore the " + location
			quest["steps"] = [
				{"action": "travel_to", "location": location},
				{"action": "explore", "location": location},
				{"action": "return_to", "npc": quest["giver"]}
			]
			quest["objective"] = "Find and explore " + location
		QuestType.TALKING:
			var target_npc = _get_random_npc()
			quest["name"] = "Talk to " + target_npc
			quest["steps"] = [
				{"action": "talk_to", "npc": target_npc},
				{"action": "return_to", "npc": quest["giver"]}
			]
			quest["objective"] = "Have a conversation with " + target_npc
		QuestType.CRAFTING:
			var item = _get_random_item()
			quest["name"] = "Craft a " + item
			quest["steps"] = [
				{"action": "craft", "item": item},
				{"action": "return_to", "npc": quest["giver"]}
			]
			quest["objective"] = "Craft one " + item
		QuestType.REPAIR:
			var item = _get_random_item()
			var location = _get_random_location()
			quest["name"] = "Repair the " + item
			quest["steps"] = [
				{"action": "travel_to", "location": location},
				{"action": "repair", "item": item},
				{"action": "return_to", "npc": quest["giver"]}
			]
			quest["objective"] = "Repair " + item + " at " + location
	return quest

func _get_random_item() -> String:
	var items = item_db.keys()
	if items.is_empty():
		return "copper_ore"
	return items[randi() % items.size()]

func _get_random_location() -> String:
	var locations = location_db.keys()
	if locations.is_empty():
		return "Copper Mine"
	return locations[randi() % locations.size()]

func _get_random_npc() -> String:
	var npcs = npc_db.keys()
	if npcs.is_empty():
		return "Mr. Chen"
	return npcs[randi() % npcs.size()]

func _create_fallback_quest() -> Dictionary:
	return {
		"id": "fallback_quest",
		"name": "Help a Neighbor",
		"description": "Someone in the neighborhood needs assistance.",
		"steps": [{"action": "talk_to", "npc": "Mr. Chen"}],
		"reward": {"gold": 10, "xp": 5}
	}
