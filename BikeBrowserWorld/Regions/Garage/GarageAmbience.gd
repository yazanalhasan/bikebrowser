extends Node

var time := 0.0
var lights: Array[Light2D] = []
var chain_prop: Node2D
var chain_base_position := Vector2.ZERO

func _ready() -> void:
	await get_tree().process_frame
	var root := get_parent()
	if root == null:
		return
	for path in [
		"LightingLayer/WorkbenchLight",
		"LightingLayer/CeilingLight",
		"LightingLayer/RepairStandLight"
	]:
		var light := root.get_node_or_null(path)
		if light is Light2D:
			lights.append(light)
	chain_prop = root.get_node_or_null("InteractableLayer/LooseChainProp") as Node2D
	if chain_prop:
		chain_base_position = chain_prop.position

func _process(delta: float) -> void:
	time += delta
	for index in range(lights.size()):
		var light := lights[index]
		light.energy = max(0.22, light.energy + sin(time * (0.8 + index * 0.2)) * 0.002)
	if chain_prop:
		chain_prop.position.y = chain_base_position.y + sin(time * 2.3) * 1.1
