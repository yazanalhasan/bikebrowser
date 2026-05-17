extends Control

const TOOL_ROWS := [
	["Dialogue Writer", "C:/Users/yazan/tools/dialogue_writer/dialogue_writer.py", "Generates dialogue JSON from NPC profiles."],
	["Palette Generator", "C:/Users/yazan/tools/palette_generator/palette_generator.py", "Builds biome palettes for tilemaps."],
	["Quest Visualizer", "C:/Users/yazan/tools/quest_visualizer/quest_visualizer.py", "Exports quest dependency diagrams."],
	["SFX Generator", "C:/Users/yazan/tools/sfx_generator/sfx_prompts.md", "Prompt library for sound effects."],
	["Pixel Upscaler", "C:/Users/yazan/tools/pixel_upscaler/pixel_upscaler.py", "Batch upscales pixel art."],
	["Quest Validator", "res://addons/ToolHelpers/QuestValidator/QuestValidator.gd", "Editor-facing quest validation helper."],
	["Dialogue Randomizer", "res://addons/ToolHelpers/VariationPicker.gd", "Runtime picker for generated line variations."],
	["Sprite Packer", "res://addons/ToolHelpers/AtlasLoader.gd", "Runtime atlas metadata loader."],
	["Terrain Generator", "res://addons/TerrainGenerator/TerrainGenerator.gd", "Editor/runtime terrain generation helper."],
	["Voice Prompt Generator", "C:/Users/yazan/tools/voice_prompt_generator/voice_prompt_generator.py", "Creates TTS prompts for external voice tools."]
]

func _ready() -> void:
	var margin := MarginContainer.new()
	margin.set_anchors_preset(Control.PRESET_FULL_RECT)
	margin.add_theme_constant_override("margin_left", 20)
	margin.add_theme_constant_override("margin_top", 20)
	margin.add_theme_constant_override("margin_right", 20)
	margin.add_theme_constant_override("margin_bottom", 20)
	add_child(margin)

	var root := VBoxContainer.new()
	root.add_theme_constant_override("separation", 12)
	margin.add_child(root)

	var title := Label.new()
	title.text = "Tool Helpers Demo"
	title.add_theme_font_size_override("font_size", 26)
	root.add_child(title)

	var note := Label.new()
	note.text = "These projects are mostly external tools. Their Godot-facing helper scripts are copied into the project, while the Python tools stay in C:/Users/yazan/tools/."
	note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	root.add_child(note)

	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	root.add_child(scroll)
	var list := VBoxContainer.new()
	list.add_theme_constant_override("separation", 8)
	scroll.add_child(list)

	for row in TOOL_ROWS:
		list.add_child(_tool_card(row[0], row[1], row[2]))

	var back := Button.new()
	back.text = "Back to Showcase"
	back.pressed.connect(func(): get_tree().change_scene_to_file("res://Regions/SystemShowcase/SystemShowcase.tscn"))
	root.add_child(back)

func _tool_card(title_text: String, path_text: String, body_text: String) -> Control:
	var panel := PanelContainer.new()
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 4)
	panel.add_child(box)
	var title := Label.new()
	title.text = title_text
	title.add_theme_font_size_override("font_size", 18)
	box.add_child(title)
	var body := Label.new()
	body.text = body_text
	body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	box.add_child(body)
	var path := Label.new()
	path.text = path_text
	path.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	box.add_child(path)
	return panel
