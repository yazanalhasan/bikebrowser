@tool
extends SceneTree

const DIRECTIONS := ["down", "left", "right", "up"]
const NPCS := {
	"mrs_ramirez": {
		"scene": "res://Regions/NPCs/MrsRamirezNpc.tscn",
		"frames": "res://Assets/Characters/MrsRamirez/mrs_ramirez_spriteframes.tres",
		"actions": ["idle", "talk", "cheer"]
	},
	"old_miner": {
		"scene": "res://Regions/NPCs/OldMinerPeteNpc.tscn",
		"frames": "res://Assets/Characters/MinerPete/old_miner_spriteframes.tres",
		"actions": ["idle", "talk", "point"]
	},
	"desert_guide": {
		"scene": "res://Regions/NPCs/RangerNitaNpc.tscn",
		"frames": "res://Assets/Characters/RangerNita/desert_guide_spriteframes.tres",
		"actions": ["idle", "talk", "point"]
	},
	"river_biologist": {
		"scene": "res://Regions/NPCs/DrMayaNpc.tscn",
		"frames": "res://Assets/Characters/DrMaya/river_biologist_spriteframes.tres",
		"actions": ["idle", "talk", "write"]
	},
	"zevon": {
		"scene": "res://Regions/NPCs/ZevonNpc.tscn",
		"frames": "res://Assets/Characters/Zevon/zevon_spriteframes.tres",
		"actions": ["idle", "talk"]
	},
	"jacob": {
		"scene": "res://Regions/NPCs/JacobNpc.tscn",
		"frames": "res://Assets/Characters/Jacob/jacob_spriteframes.tres",
		"actions": ["idle", "talk"]
	},
	"charlie": {
		"scene": "res://Regions/NPCs/CharlieNpc.tscn",
		"frames": "res://Assets/Characters/Charlie/charlie_spriteframes.tres",
		"actions": ["idle", "talk"]
	},
	"cole": {
		"scene": "res://Regions/NPCs/ColeNpc.tscn",
		"frames": "res://Assets/Characters/Cole/cole_spriteframes.tres",
		"actions": ["idle", "talk"]
	},
	"james": {
		"scene": "res://Regions/NPCs/JamesNpc.tscn",
		"frames": "res://Assets/Characters/James/james_spriteframes.tres",
		"actions": ["idle", "talk"]
	},
}

func _init() -> void:
	var failures: Array[String] = []
	for npc_id in NPCS.keys():
		var config: Dictionary = NPCS[npc_id]
		var scene := load(config.scene) as PackedScene
		if scene == null:
			failures.append("Missing scene: %s" % config.scene)
		var frames := load(config.frames) as SpriteFrames
		if frames == null:
			failures.append("Missing SpriteFrames: %s" % config.frames)
			continue
		for action in config.actions:
			for direction in DIRECTIONS:
				var animation_name := "%s_%s_%s" % [npc_id, action, direction]
				if not frames.has_animation(animation_name):
					failures.append("Missing animation: %s" % animation_name)

	if failures.is_empty():
		print("NPC asset check passed")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)
