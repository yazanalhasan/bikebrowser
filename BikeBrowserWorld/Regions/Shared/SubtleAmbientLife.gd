extends Node

@export var flicker_targets: Array[NodePath] = []
@export var sway_targets: Array[NodePath] = []
@export var flutter_targets: Array[NodePath] = []
@export_range(0.0, 1.0, 0.05) var flicker_strength := 0.65
@export_range(0.0, 1.0, 0.05) var sway_strength := 0.55
@export_range(0.0, 1.0, 0.05) var flutter_strength := 0.55
@export_range(0.1, 2.0, 0.05) var speed_scale := 0.82

var _time := 0.0
var _base_alpha: Dictionary = {}
var _base_rotation: Dictionary = {}

func _ready() -> void:
	for path in flicker_targets + flutter_targets:
		var item := get_node_or_null(path) as CanvasItem
		if item != null:
			_base_alpha[path] = item.modulate.a
	for path in sway_targets:
		var node := get_node_or_null(path) as Node2D
		if node != null:
			_base_rotation[path] = node.rotation

func _process(delta: float) -> void:
	_time += delta * speed_scale
	_apply_flicker()
	_apply_sway()
	_apply_flutter()

func _apply_flicker() -> void:
	for index in flicker_targets.size():
		var path := flicker_targets[index]
		var item := get_node_or_null(path) as CanvasItem
		if item == null:
			continue
		var base := float(_base_alpha.get(path, item.modulate.a))
		var pulse := 0.97 + (sin(_time * 0.8 + index * 1.7) * 0.025 + sin(_time * 2.1 + index) * 0.01) * flicker_strength
		var color := item.modulate
		color.a = clampf(base * pulse, 0.0, 1.0)
		item.modulate = color

func _apply_sway() -> void:
	for index in sway_targets.size():
		var path := sway_targets[index]
		var node := get_node_or_null(path) as Node2D
		if node == null:
			continue
		var base := float(_base_rotation.get(path, node.rotation))
		node.rotation = base + deg_to_rad(0.42) * sway_strength * sin(_time * 0.42 + index * 1.3)

func _apply_flutter() -> void:
	for index in flutter_targets.size():
		var path := flutter_targets[index]
		var item := get_node_or_null(path) as CanvasItem
		if item == null:
			continue
		var base := float(_base_alpha.get(path, item.modulate.a))
		var pulse := 0.9 + sin(_time * 0.5 + index * 2.0) * 0.045 * flutter_strength
		var color := item.modulate
		color.a = clampf(base * pulse, 0.0, 1.0)
		item.modulate = color
