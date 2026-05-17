extends CanvasLayer
class_name ReusableConfirmationDialog

signal confirmed()
signal canceled()

@onready var _panel: PanelContainer = %Panel
@onready var _title: Label = %Title
@onready var _message: Label = %Message
@onready var _yes: Button = %YesButton
@onready var _no: Button = %NoButton

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	visible = false
	_yes.pressed.connect(func():
		visible = false
		confirmed.emit()
	)
	_no.pressed.connect(func():
		visible = false
		canceled.emit()
	)

func ask(title: String, message: String, yes_text := "Yes", no_text := "No") -> void:
	_title.text = title
	_message.text = message
	_yes.text = yes_text
	_no.text = no_text
	visible = true
	_yes.grab_focus()

func _unhandled_input(event: InputEvent) -> void:
	if not visible:
		return
	get_viewport().set_input_as_handled()
	if event.is_action_pressed("ui_cancel"):
		visible = false
		canceled.emit()
