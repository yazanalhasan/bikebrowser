@tool
extends SceneTree

const FRAME_SIZE := Vector2i(96, 96)
const DIRECTIONS := ["down", "left", "right", "up"]

const NPCS := {
	"mr_chen": {
		"output": "res://Assets/Characters/NPCs/MrChen/mr_chen_spriteframes.tres",
		"sheets": {
			"idle": "res://Assets/Characters/NPCs/MrChen/MrChen_idle.png",
			"talk": "res://Assets/Characters/NPCs/MrChen/MrChen_talk.png",
			"repair": "res://Assets/Characters/NPCs/MrChen/MrChen_repair.png",
			"point": "res://Assets/Characters/NPCs/MrChen/MrChen_point.png",
		}
	},
	"mrs_ramirez": {
		"output": "res://Assets/Characters/MrsRamirez/mrs_ramirez_spriteframes.tres",
		"sheets": {
			"idle": "res://Assets/Characters/MrsRamirez/MrsRamirez_idle.png",
			"talk": "res://Assets/Characters/MrsRamirez/MrsRamirez_talk.png",
			"cheer": "res://Assets/Characters/MrsRamirez/MrsRamirez_cheer.png",
		}
	},
	"old_miner": {
		"output": "res://Assets/Characters/MinerPete/old_miner_spriteframes.tres",
		"sheets": {
			"idle": "res://Assets/Characters/MinerPete/MinerPete_idle.png",
			"talk": "res://Assets/Characters/MinerPete/MinerPete_talk.png",
			"point": "res://Assets/Characters/MinerPete/MinerPete_point.png",
		}
	},
	"desert_guide": {
		"output": "res://Assets/Characters/RangerNita/desert_guide_spriteframes.tres",
		"sheets": {
			"idle": "res://Assets/Characters/RangerNita/RangerNita_idle.png",
			"talk": "res://Assets/Characters/RangerNita/RangerNita_talk.png",
			"point": "res://Assets/Characters/RangerNita/RangerNita_point.png",
		}
	},
	"river_biologist": {
		"output": "res://Assets/Characters/DrMaya/river_biologist_spriteframes.tres",
		"sheets": {
			"idle": "res://Assets/Characters/DrMaya/DrMaya_idle.png",
			"talk": "res://Assets/Characters/DrMaya/DrMaya_talk.png",
			"write": "res://Assets/Characters/DrMaya/DrMaya_write.png",
		}
	},
	"zevon": {
		"output": "res://Assets/Characters/Zevon/zevon_spriteframes.tres",
		"sheets": {
			"idle": "res://Assets/Characters/Zevon/Zevon_idle.png",
			"talk": "res://Assets/Characters/Zevon/Zevon_talk.png",
		}
	},
	"jacob": {
		"output": "res://Assets/Characters/Jacob/jacob_spriteframes.tres",
		"sheets": {
			"idle": "res://Assets/Characters/Jacob/Jacob_idle.png",
			"talk": "res://Assets/Characters/Jacob/Jacob_talk.png",
		}
	},
	"charlie": {
		"output": "res://Assets/Characters/Charlie/charlie_spriteframes.tres",
		"sheets": {
			"idle": "res://Assets/Characters/Charlie/Charlie_idle.png",
			"talk": "res://Assets/Characters/Charlie/Charlie_talk.png",
		}
	},
	"cole": {
		"output": "res://Assets/Characters/Cole/cole_spriteframes.tres",
		"sheets": {
			"idle": "res://Assets/Characters/Cole/Cole_idle.png",
			"talk": "res://Assets/Characters/Cole/Cole_talk.png",
		}
	},
	"james": {
		"output": "res://Assets/Characters/James/james_spriteframes.tres",
		"sheets": {
			"idle": "res://Assets/Characters/James/James_idle.png",
			"talk": "res://Assets/Characters/James/James_talk.png",
		}
	},
}

func _init() -> void:
	for npc_id in NPCS.keys():
		_build_spriteframes(npc_id, NPCS[npc_id])
	quit(0)

func _build_spriteframes(npc_id: String, config: Dictionary) -> void:
	var frames := SpriteFrames.new()
	for animation_name in frames.get_animation_names():
		frames.remove_animation(animation_name)

	for action in config.sheets.keys():
		var texture := load(config.sheets[action]) as Texture2D
		if texture == null:
			push_error("Missing sheet for %s/%s: %s" % [npc_id, action, config.sheets[action]])
			quit(1)
			return

		for direction_index in DIRECTIONS.size():
			var direction: String = DIRECTIONS[direction_index]
			var animation_name := "%s_%s_%s" % [npc_id, action, direction]
			frames.add_animation(animation_name)
			frames.set_animation_speed(animation_name, 6.0)
			frames.set_animation_loop(animation_name, action == "idle")

			for frame_index in 4:
				var atlas := AtlasTexture.new()
				atlas.atlas = texture
				atlas.region = Rect2i(
					frame_index * FRAME_SIZE.x,
					direction_index * FRAME_SIZE.y,
					FRAME_SIZE.x,
					FRAME_SIZE.y
				)
				frames.add_frame(animation_name, atlas, 1.0)

	var error := ResourceSaver.save(frames, config.output)
	if error != OK:
		push_error("Failed to save %s: %s" % [config.output, error_string(error)])
		quit(1)
		return

	print("Saved NPC SpriteFrames: %s" % config.output)
