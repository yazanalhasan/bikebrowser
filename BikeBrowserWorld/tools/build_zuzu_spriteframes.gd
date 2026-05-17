@tool
extends SceneTree

const OUTPUT_PATH := "res://Assets/Characters/Zuzu/Zuzu.spriteframes.tres"
const FRAME_SIZE := Vector2i(96, 96)
const DIRECTIONS := ["down", "left", "right", "up"]
const ACTIONS := {
	"idle": "res://Assets/Characters/Zuzu/Native96/zuzu_idle_native96_v1/sheet-transparent.png",
	"walk": "res://Assets/Characters/Zuzu/Native96/zuzu_walk_native96_v1/sheet-transparent.png",
	"interact": "res://Assets/Characters/Zuzu/RuntimeHD/Zuzu_interact_96.png",
	"repair": "res://Assets/Characters/Zuzu/RuntimeHD/Zuzu_repair_96.png",
	"celebrate": "res://Assets/Characters/Zuzu/RuntimeHD/Zuzu_celebrate_96.png",
}

func _init() -> void:
	var frames := SpriteFrames.new()
	for animation_name in frames.get_animation_names():
		frames.remove_animation(animation_name)

	for action in ACTIONS.keys():
		var texture := load(ACTIONS[action]) as Texture2D
		if texture == null:
			push_error("Missing Zuzu sheet: %s" % ACTIONS[action])
			quit(1)
			return

		for direction_index in DIRECTIONS.size():
			var direction: String = DIRECTIONS[direction_index]
			var animation_name := "%s_%s" % [action, direction]
			frames.add_animation(animation_name)
			frames.set_animation_speed(animation_name, 8.0 if action == "walk" else 6.0)
			frames.set_animation_loop(animation_name, action in ["idle", "walk"])

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

	var error := ResourceSaver.save(frames, OUTPUT_PATH)
	if error != OK:
		push_error("Failed to save %s: %s" % [OUTPUT_PATH, error_string(error)])
		quit(1)
		return

	print("Saved Zuzu SpriteFrames: %s" % OUTPUT_PATH)
	quit(0)
