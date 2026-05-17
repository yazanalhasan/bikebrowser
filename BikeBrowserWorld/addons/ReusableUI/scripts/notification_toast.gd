extends PanelContainer
class_name NotificationToast

signal dismissed()

@export_enum("top", "bottom") var slide_from := "top"
@export var auto_dismiss_seconds := 3.0
@export var slide_distance := 80.0

@onready var _icon: TextureRect = %Icon
@onready var _text: Label = %Text

var _tween: Tween
var _rest_position := Vector2.ZERO
var _has_rest_position := false

func show_toast(message: String, icon: Texture2D = null, seconds: float = -1.0) -> void:
	if not _has_rest_position:
		_rest_position = position
		_has_rest_position = true
	_text.text = message
	_icon.texture = icon
	_icon.visible = icon != null
	var duration := auto_dismiss_seconds if seconds < 0.0 else seconds
	visible = true
	modulate.a = 0.0
	var start_offset := Vector2(0, -slide_distance if slide_from == "top" else slide_distance)
	position = _rest_position + start_offset
	if _tween:
		_tween.kill()
	_tween = create_tween()
	_tween.tween_property(self, "position", _rest_position, 0.22).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	_tween.parallel().tween_property(self, "modulate:a", 1.0, 0.16)
	_tween.tween_interval(duration)
	_tween.tween_callback(dismiss)

func dismiss() -> void:
	if _tween:
		_tween.kill()
	_tween = create_tween()
	var end_offset := Vector2(0, -slide_distance if slide_from == "top" else slide_distance)
	_tween.tween_property(self, "position", _rest_position + end_offset, 0.18)
	_tween.parallel().tween_property(self, "modulate:a", 0.0, 0.18)
	_tween.tween_callback(func():
		visible = false
		dismissed.emit()
	)
