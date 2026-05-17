extends PanelContainer
class_name ReusableDialogueBox

signal choice_selected(choice_index: int, choice: Dictionary)
signal dialogue_finished()

@export var characters_per_second := 42.0

var _full_text := ""
var _typing := false
var _elapsed := 0.0
var _choices: Array[Dictionary] = []

@onready var _portrait: TextureRect = %Portrait
@onready var _speaker: Label = %Speaker
@onready var _body: RichTextLabel = %Body
@onready var _choices_box: VBoxContainer = %Choices

func show_dialogue(speaker: String, text: String, portrait: Texture2D = null, choices: Array[Dictionary] = []) -> void:
	_speaker.text = speaker
	_full_text = text
	_body.text = ""
	_portrait.texture = portrait
	_portrait.visible = portrait != null
	_choices = choices
	_elapsed = 0.0
	_typing = true
	_clear_choices()
	show()

func skip_typewriter() -> void:
	_body.text = _full_text
	_typing = false
	_build_choices()
	if _choices.is_empty():
		dialogue_finished.emit()

func _process(delta: float) -> void:
	if not _typing:
		return
	_elapsed += delta
	var visible_chars := mini(_full_text.length(), floori(_elapsed * characters_per_second))
	_body.text = _full_text.substr(0, visible_chars)
	if visible_chars >= _full_text.length():
		_typing = false
		_build_choices()
		if _choices.is_empty():
			dialogue_finished.emit()

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and _typing:
		skip_typewriter()

func _clear_choices() -> void:
	for child in _choices_box.get_children():
		child.queue_free()

func _build_choices() -> void:
	_clear_choices()
	for i in _choices.size():
		var choice := _choices[i]
		var button := Button.new()
		button.text = str(choice.get("text", "Choice %d" % [i + 1]))
		button.pressed.connect(func(index := i, data := choice): choice_selected.emit(index, data))
		_choices_box.add_child(button)
