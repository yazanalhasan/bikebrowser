extends Node
class_name CameraController

const CameraShakeScript := preload("res://CameraSystem/CameraShake.gd")

@export var camera_path: NodePath
@export var fade_color: Color = Color.BLACK

var camera: Camera2D
var shake_component: Node
var _fade_layer: CanvasLayer
var _fade_rect: ColorRect
var _base_zoom: Vector2 = Vector2.ONE

func _ready() -> void:
	camera = get_node_or_null(camera_path) as Camera2D
	if camera == null:
		camera = get_viewport().get_camera_2d()
	if camera != null:
		_base_zoom = camera.zoom

	shake_component = CameraShakeScript.new()
	add_child(shake_component)
	_create_fade_overlay()

func _physics_process(_delta: float) -> void:
	if camera == null:
		return
	if camera.has_method("set_shake_offset"):
		camera.set_shake_offset(shake_component.offset)
	else:
		camera.offset = shake_component.offset

func follow_player() -> void:
	if camera != null and camera.has_method("follow_player"):
		camera.follow_player(get_process_delta_time())

func shake(intensity: float, duration: float) -> void:
	shake_component.start(intensity, duration)

func zoom_to(target_zoom: float, duration: float) -> void:
	if camera == null:
		return
	var tween := create_tween()
	var zoom_value := Vector2.ONE / maxf(target_zoom, 0.01)
	tween.tween_property(camera, "zoom", zoom_value, duration).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)

func look_at(target_position: Vector2, duration: float) -> void:
	if camera == null:
		return
	var tween := create_tween()
	tween.tween_property(camera, "global_position", target_position, duration).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)

func fade_in(duration: float) -> void:
	_tween_fade(0.0, duration)

func fade_out(duration: float) -> void:
	_tween_fade(1.0, duration)

func reset_zoom(duration: float = 0.25) -> void:
	if camera == null:
		return
	create_tween().tween_property(camera, "zoom", _base_zoom, duration)

func _create_fade_overlay() -> void:
	_fade_layer = CanvasLayer.new()
	_fade_layer.layer = 100
	add_child(_fade_layer)

	_fade_rect = ColorRect.new()
	_fade_rect.color = Color(fade_color.r, fade_color.g, fade_color.b, 0.0)
	_fade_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_fade_rect.set_anchors_preset(Control.PRESET_FULL_RECT)
	_fade_layer.add_child(_fade_rect)

func _tween_fade(alpha: float, duration: float) -> void:
	var color := fade_color
	color.a = alpha
	create_tween().tween_property(_fade_rect, "color", color, duration).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
