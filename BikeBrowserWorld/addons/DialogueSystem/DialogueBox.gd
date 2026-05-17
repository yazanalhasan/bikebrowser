extends Panel

@onready var text_label = $TextLabel
@onready var choice_container = $ChoiceContainer
@onready var continue_button = $ContinueButton

var typewriter_speed: float = 0.03
var current_text: String = ""
var is_typing: bool = false
var choices: Array = []
var dialogue_manager: Node

func _ready():
	hide()
	continue_button.pressed.connect(_on_continue_pressed)

func show_text(text: String, new_choices: Array = []):
	show()
	current_text = text
	choices = new_choices
	is_typing = true
	text_label.text = ""
	_type_text()
	for child in choice_container.get_children():
		child.queue_free()
	continue_button.visible = choices.is_empty()
	for i in range(choices.size()):
		var btn = Button.new()
		btn.text = choices[i].get("text", "Option " + str(i + 1))
		btn.pressed.connect(_on_choice_pressed.bind(i))
		choice_container.add_child(btn)
	choice_container.visible = not choices.is_empty()

func _type_text(index: int = 0):
	if not is_typing:
		text_label.text = current_text
		return
	if index < current_text.length():
		text_label.text += current_text[index]
		await get_tree().create_timer(typewriter_speed).timeout
		_type_text(index + 1)
	else:
		is_typing = false

func _on_continue_pressed():
	if is_typing:
		is_typing = false
		text_label.text = current_text
	else:
		if dialogue_manager:
			dialogue_manager.select_choice(-1)

func _on_choice_pressed(choice_index: int):
	if is_typing:
		is_typing = false
		text_label.text = current_text
		return
	if dialogue_manager:
		dialogue_manager.select_choice(choice_index)
