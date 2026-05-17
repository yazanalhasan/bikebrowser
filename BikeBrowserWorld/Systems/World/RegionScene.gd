extends Node2D

const LayoutApplier = preload("res://Systems/World/LayoutApplier.gd")

@export var region_id := ""
@export var layout_path := ""

var layout: Dictionary = {}

func _ready() -> void:
	layout = LayoutApplier.load_layout(layout_path)
	LayoutApplier.apply_layout(self, layout)
	var player := get_node_or_null("Player")
	if player is Node2D:
		player.position = LayoutApplier.spawn_position(layout, RegionRegistry.current_spawn_id)
	RegionRegistry.current_region_id = region_id
	EventBus.region_entered.emit(region_id, RegionRegistry.current_spawn_id)
	EventBus.log_debug("Region ready", { "regionId": region_id })
