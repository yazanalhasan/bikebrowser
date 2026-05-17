extends Control

const DEMOS := [
	{
		"title": "UI Components",
		"description": "Reusable bars, quest tracker, inventory grid, dialogue, toasts, and confirmation dialog.",
		"path": "res://Regions/SystemShowcase/UiComponentsDemo.tscn"
	},
	{
		"title": "Runtime Systems",
		"description": "Name generation, procedural quests, crafting, localization, achievements, effects, and save hooks.",
		"path": "res://Regions/SystemShowcase/RuntimeSystemsDemo.tscn"
	},
	{
		"title": "Tool Helpers",
		"description": "Godot-facing helpers for dialogue variations, atlas lookup, quest validation, terrain, and external Python tools.",
		"path": "res://Regions/SystemShowcase/ToolHelpersDemo.tscn"
	}
]

func _ready() -> void:
	_build()

func _build() -> void:
	var margin := MarginContainer.new()
	margin.set_anchors_preset(Control.PRESET_FULL_RECT)
	margin.add_theme_constant_override("margin_left", 24)
	margin.add_theme_constant_override("margin_top", 24)
	margin.add_theme_constant_override("margin_right", 24)
	margin.add_theme_constant_override("margin_bottom", 24)
	add_child(margin)

	var root := VBoxContainer.new()
	root.add_theme_constant_override("separation", 16)
	margin.add_child(root)

	var title := Label.new()
	title.text = "Projects 1-20 Demo Scenes"
	title.add_theme_font_size_override("font_size", 28)
	root.add_child(title)

	var intro := Label.new()
	intro.text = "Open these scenes to inspect the reusable systems without changing the playable neighborhood."
	intro.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	root.add_child(intro)

	for demo in DEMOS:
		root.add_child(_make_demo_card(demo))

	var back := Button.new()
	back.text = "Return to Neighborhood"
	back.pressed.connect(func(): get_tree().change_scene_to_file("res://Regions/Neighborhood/NeighborhoodStreet.tscn"))
	root.add_child(back)

func _make_demo_card(demo: Dictionary) -> Control:
	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(0, 112)
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 6)
	panel.add_child(box)

	var title := Label.new()
	title.text = str(demo["title"])
	title.add_theme_font_size_override("font_size", 20)
	box.add_child(title)

	var description := Label.new()
	description.text = str(demo["description"])
	description.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	box.add_child(description)

	var button := Button.new()
	button.text = "Open " + str(demo["title"])
	button.pressed.connect(func(): get_tree().change_scene_to_file(str(demo["path"])))
	box.add_child(button)
	return panel
