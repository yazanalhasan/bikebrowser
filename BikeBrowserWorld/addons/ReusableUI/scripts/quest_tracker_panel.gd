extends PanelContainer
class_name QuestTrackerPanel

signal quest_selected(quest_id: String)

@export var main_title := "Main Quests"
@export var side_title := "Side Quests"

var _sections := {}
var _quests: Array[Dictionary] = []

@onready var _root: VBoxContainer = %Root
@onready var _scroll: ScrollContainer = %Scroll
@onready var _list: VBoxContainer = %QuestList

func _ready() -> void:
	_rebuild()

func set_quests(quests: Array[Dictionary]) -> void:
	_quests = quests
	if is_node_ready():
		_rebuild()

func add_quest(quest: Dictionary) -> void:
	_quests.append(quest)
	_rebuild()

func clear() -> void:
	_quests.clear()
	_rebuild()

func _rebuild() -> void:
	for child in _list.get_children():
		child.queue_free()
	_sections.clear()
	_add_section("main", main_title)
	_add_section("side", side_title)
	for quest in _quests:
		var quest_type := str(quest.get("type", "side"))
		if not _sections.has(quest_type):
			_add_section(quest_type, quest_type.capitalize())
		_add_quest_row(quest_type, quest)

func _add_section(section_id: String, title: String) -> void:
	var header := Button.new()
	header.text = "v " + title
	header.alignment = HORIZONTAL_ALIGNMENT_LEFT
	_list.add_child(header)
	var box := VBoxContainer.new()
	box.name = section_id + "_List"
	_list.add_child(box)
	_sections[section_id] = {"button": header, "box": box, "collapsed": false}
	header.pressed.connect(func():
		var section: Dictionary = _sections[section_id]
		section["collapsed"] = not bool(section["collapsed"])
		box.visible = not bool(section["collapsed"])
		header.text = ("> " if section["collapsed"] else "v ") + title
		_sections[section_id] = section
	)

func _add_quest_row(section_id: String, quest: Dictionary) -> void:
	var button := Button.new()
	button.alignment = HORIZONTAL_ALIGNMENT_LEFT
	button.text = "%s\n%s" % [str(quest.get("name", "Untitled Quest")), str(quest.get("step", ""))]
	button.tooltip_text = str(quest.get("description", button.text))
	button.pressed.connect(func(): quest_selected.emit(str(quest.get("id", ""))))
	_sections[section_id]["box"].add_child(button)
