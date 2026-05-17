extends Node

@export var sway_amount := 2.0
@export var light_pulse := 0.18

var time := 0.0
var targets := {}

func _ready() -> void:
	await get_tree().process_frame
	var root := get_parent()
	if root == null:
		return
	for path in [
		"BehindPropLayer/SaguaroCactusA",
		"BehindPropLayer/SaguaroCactusB",
		"MidPropLayer/PricklyPearA",
		"MidPropLayer/PricklyPearB",
		"ForegroundPropLayer/StreetLampA",
		"ForegroundPropLayer/StreetLampB",
		"BehindPropLayer/PorchLight"
	]:
		var node := root.get_node_or_null(path)
		if node is Node2D:
			targets[path] = {
				"node": node,
				"position": node.position,
				"modulate": node.modulate
			}

func _process(delta: float) -> void:
	time += delta
	_sway("BehindPropLayer/SaguaroCactusA", 0.55, 0.0)
	_sway("BehindPropLayer/SaguaroCactusB", 0.47, 1.4)
	_sway("MidPropLayer/PricklyPearA", 0.66, 2.1)
	_sway("MidPropLayer/PricklyPearB", 0.61, 0.8)
	_pulse("ForegroundPropLayer/StreetLampA", 1.2, 0.0)
	_pulse("ForegroundPropLayer/StreetLampB", 1.0, 1.3)
	_pulse("BehindPropLayer/PorchLight", 0.9, 0.4)

func _sway(path: String, speed: float, phase: float) -> void:
	if not targets.has(path):
		return
	var data: Dictionary = targets[path]
	var node: Node2D = data["node"]
	var base_position: Vector2 = data["position"]
	node.position.x = base_position.x + sin(time * speed + phase) * sway_amount

func _pulse(path: String, speed: float, phase: float) -> void:
	if not targets.has(path):
		return
	var data: Dictionary = targets[path]
	var node: Node2D = data["node"]
	var base_modulate: Color = data["modulate"]
	var alpha: float = clamp(base_modulate.a + sin(time * speed + phase) * light_pulse, 0.45, 1.0)
	node.modulate = Color(base_modulate.r, base_modulate.g, base_modulate.b, alpha)
