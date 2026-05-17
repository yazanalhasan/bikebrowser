extends Control

var _output: RichTextLabel

func _ready() -> void:
	_build()
	_refresh_output()

func _build() -> void:
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
	title.text = "Runtime Systems Demo"
	title.add_theme_font_size_override("font_size", 26)
	root.add_child(title)

	var buttons := HBoxContainer.new()
	buttons.add_theme_constant_override("separation", 8)
	root.add_child(buttons)
	_add_button(buttons, "Generate Name", _demo_name)
	_add_button(buttons, "Generate Quest", _demo_quest)
	_add_button(buttons, "Crafting Check", _demo_crafting)
	_add_button(buttons, "Unlock Badge", _demo_badge)
	_add_button(buttons, "Play Stinger", _demo_audio)

	_output = RichTextLabel.new()
	_output.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_output.bbcode_enabled = false
	root.add_child(_output)

	var back := Button.new()
	back.text = "Back to Showcase"
	back.pressed.connect(func(): get_tree().change_scene_to_file("res://Regions/SystemShowcase/SystemShowcase.tscn"))
	root.add_child(back)

func _refresh_output() -> void:
	var status := {}
	if ProjectIntegration and ProjectIntegration.has_method("get_runtime_status"):
		status = ProjectIntegration.get_runtime_status()
	_output.text = "ProjectIntegration status:\n%s\n\nUse the buttons above to exercise individual systems." % JSON.stringify(status, "\t")

func _demo_name() -> void:
	if not _has_root("NameGeneratorRuntime"):
		_append("NameGeneratorRuntime is not loaded.")
		return
	var generator := get_node("/root/NameGeneratorRuntime")
	_append("Generated names: %s, %s, %s" % [
		generator.get_full_name("sonoran"),
		generator.get_full_name("arabic"),
		generator.get_full_name("fantasy")
	])

func _demo_quest() -> void:
	if not _has_root("QuestGeneratorRuntime"):
		_append("QuestGeneratorRuntime is not loaded.")
		return
	var quest: Dictionary = get_node("/root/QuestGeneratorRuntime").generate_quest(0, 2, "Mrs. Ramirez")
	_append("Generated quest:\n%s" % JSON.stringify(quest, "\t"))

func _demo_crafting() -> void:
	if not _has_root("CraftingManagerRuntime"):
		_append("CraftingManagerRuntime is not loaded.")
		return
	var crafting := get_node("/root/CraftingManagerRuntime")
	crafting.load_recipes("recipes.json")
	_append("Crafting recipes loaded: %s" % [", ".join(crafting.recipes.keys())])

func _demo_badge() -> void:
	if not _has_root("AchievementManagerRuntime"):
		_append("AchievementManagerRuntime is not loaded.")
		return
	var unlocked: bool = get_node("/root/AchievementManagerRuntime").unlock("chain_hero")
	_append("Achievement unlock requested for chain_hero. Newly unlocked: %s" % str(unlocked))

func _demo_audio() -> void:
	if not _has_root("AudioService"):
		_append("AudioService is not loaded.")
		return
	AudioService.play_sfx("reward_chime", "celebrate")
	_append("Requested reward stinger through AudioService.")

func _add_button(parent: Control, text: String, callback: Callable) -> void:
	var button := Button.new()
	button.text = text
	button.pressed.connect(callback)
	parent.add_child(button)

func _append(text: String) -> void:
	_output.text += "\n\n" + text

func _has_root(node_name: String) -> bool:
	return get_node_or_null("/root/" + node_name) != null
