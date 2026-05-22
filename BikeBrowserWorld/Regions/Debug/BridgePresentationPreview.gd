extends Node2D

const HudScene := preload("res://Regions/UI/Hud.tscn")

func _ready() -> void:
	RegionRegistry.current_region_id = "bridge_presentation_preview"
	var background := ColorRect.new()
	background.color = Color(0.22, 0.30, 0.26, 1.0)
	background.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(background)

	var title := Label.new()
	title.text = "Mr. Chen's Bridge Lesson Preview"
	title.position = Vector2(36, 28)
	title.add_theme_font_size_override("font_size", 22)
	title.add_theme_color_override("font_color", Color(0.98, 0.91, 0.72, 1.0))
	add_child(title)

	var hud := HudScene.instantiate()
	hud.name = "Hud"
	add_child(hud)
	await get_tree().process_frame
	_show_bridge_presentation()

func _show_bridge_presentation() -> void:
	var presentation := _load_presentation("mr_chen_triangle_bridge_lesson")
	EventBus.emit_game_event("presentation_requested", {
		"quest_id": "bridge_quest_5",
		"objective_id": "watch_bridge_presentation",
		"presentation": presentation,
	})

func _load_presentation(presentation_id: String) -> Dictionary:
	var path := "res://Data/presentations/%s.json" % presentation_id
	if not FileAccess.file_exists(path):
		return {}
	var parsed = JSON.parse_string(FileAccess.get_file_as_string(path))
	if typeof(parsed) == TYPE_DICTIONARY:
		return parsed
	return {}
