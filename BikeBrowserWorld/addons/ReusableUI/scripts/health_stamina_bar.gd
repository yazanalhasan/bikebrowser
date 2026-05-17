@tool
extends Control
class_name HealthStaminaBar

@export var max_value: float = 100.0:
	set(v):
		max_value = maxf(v, 0.001)
		_target_value = clampf(_target_value, 0.0, max_value)
		_display_value = clampf(_display_value, 0.0, max_value)
		queue_redraw()
@export var value: float = 100.0:
	set(v):
		set_value(v)
	get:
		return _target_value
@export var animation_time: float = 0.25
@export var show_border: bool = true:
	set(v):
		show_border = v
		queue_redraw()
@export var show_gloss: bool = true:
	set(v):
		show_gloss = v
		queue_redraw()
@export var background_color: Color = Color(0.06, 0.07, 0.08, 0.9):
	set(v):
		background_color = v
		queue_redraw()
@export var border_color: Color = Color(1, 1, 1, 0.65):
	set(v):
		border_color = v
		queue_redraw()

var _target_value: float = 100.0
var _display_value: float = 100.0
var _tween: Tween

func _ready() -> void:
	custom_minimum_size = Vector2(180, 22)
	_target_value = clampf(value, 0.0, max_value)
	_display_value = _target_value

func set_value(new_value: float, instant: bool = false) -> void:
	_target_value = clampf(new_value, 0.0, max_value)
	if _tween:
		_tween.kill()
	if instant or animation_time <= 0.0 or not is_inside_tree():
		_display_value = _target_value
		queue_redraw()
		return
	_tween = create_tween()
	_tween.tween_method(_set_display_value, _display_value, _target_value, animation_time).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)

func _set_display_value(new_value: float) -> void:
	_display_value = new_value
	queue_redraw()

func get_percent() -> float:
	return clampf(_display_value / max_value, 0.0, 1.0)

func _fill_color(percent: float) -> Color:
	if percent > 0.5:
		return Color.YELLOW.lerp(Color.LIME_GREEN, (percent - 0.5) / 0.5)
	return Color.RED.lerp(Color.YELLOW, percent / 0.5)

func _draw() -> void:
	var rect := Rect2(Vector2.ZERO, size)
	draw_rect(rect, background_color, true)
	var fill_width := maxf(0.0, size.x * get_percent())
	if fill_width > 0.0:
		draw_rect(Rect2(Vector2.ZERO, Vector2(fill_width, size.y)), _fill_color(get_percent()), true)
	if show_gloss:
		draw_rect(Rect2(Vector2(1, 1), Vector2(maxf(fill_width - 2.0, 0.0), size.y * 0.42)), Color(1, 1, 1, 0.22), true)
	if show_border:
		draw_rect(rect.grow(-0.5), border_color, false, 1.0)
