extends Resource
class_name SaveData

const SAVE_VERSION := "1.0"

@export var version: String = SAVE_VERSION
@export var timestamp: String = ""
@export var playtime_seconds: int = 0
@export var slot: int = 1
@export var screenshot_path: String = ""
@export var player: Dictionary = {
	"name": "Zuzu",
	"health": 100,
	"stamina": 100,
	"level": 1,
	"xp": 0,
	"badges": []
}
@export var inventory: Dictionary = {}
@export var quests: Dictionary = {
	"completed": [],
	"active": {}
}
@export var world: Dictionary = {
	"npc_positions": {},
	"harvested_plants": [],
	"opened_chests": []
}
@export var discovery: Dictionary = {
	"plants": [],
	"animals": [],
	"recipes": []
}
@export var achievements: Dictionary = {
	"earned": [],
	"progress": {}
}

func to_dict() -> Dictionary:
	return {
		"version": version,
		"timestamp": timestamp,
		"playtime_seconds": playtime_seconds,
		"slot": slot,
		"screenshot_path": screenshot_path,
		"player": player,
		"inventory": inventory,
		"quests": quests,
		"world": world,
		"discovery": discovery,
		"achievements": achievements
	}

static func from_dict(data: Dictionary) -> Resource:
	var save_data: Resource = load("res://SaveSystem/SaveData.gd").new()
	save_data.version = str(data.get("version", SAVE_VERSION))
	save_data.timestamp = str(data.get("timestamp", ""))
	save_data.playtime_seconds = int(data.get("playtime_seconds", 0))
	save_data.slot = int(data.get("slot", 1))
	save_data.screenshot_path = str(data.get("screenshot_path", ""))
	save_data.player = data.get("player", save_data.player).duplicate(true)
	save_data.inventory = data.get("inventory", {}).duplicate(true)
	save_data.quests = data.get("quests", save_data.quests).duplicate(true)
	save_data.world = data.get("world", save_data.world).duplicate(true)
	save_data.discovery = data.get("discovery", save_data.discovery).duplicate(true)
	save_data.achievements = data.get("achievements", save_data.achievements).duplicate(true)
	return save_data
