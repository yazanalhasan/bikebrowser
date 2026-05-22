extends Node2D

@onready var chain_station: Node2D = $ChainStation
@onready var tire_station: Node2D = $TireStation
@onready var title: Label = $Title

var elapsed := 0.0

func _ready() -> void:
	RegionRegistry.current_region_id = "bike_repair_visual_preview"
	RegionRegistry.current_spawn_id = "default"
	if title:
		title.text = "Bike repair visual correctness preview"

func _process(delta: float) -> void:
	elapsed += delta
	var chain_rig: Node = chain_station.get_node_or_null("BikeVisual/ChainRig") if chain_station else null
	if chain_rig and chain_rig.has_method("set_pedal_pressed"):
		chain_rig.call("set_pedal_pressed", elapsed < 4.0)
	var tire_rig: Node = tire_station.get_node_or_null("TireRig") if tire_station else null
	if tire_rig and tire_rig.has_method("set_current_action_pressed"):
		tire_rig.call("set_current_action_pressed", elapsed < 6.0)
