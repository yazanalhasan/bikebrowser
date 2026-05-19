extends Node2D

const LayoutApplier = preload("res://Systems/World/LayoutApplier.gd")
const DialogBoxScene := preload("res://Regions/UI/DialogBox.tscn")
const HudScene := preload("res://Regions/UI/Hud.tscn")

@export var region_id := ""
@export var layout_path := ""

var layout: Dictionary = {}

func _ready() -> void:
	layout = LayoutApplier.load_layout(layout_path)
	LayoutApplier.apply_layout(self, layout)
	_ensure_runtime_ui()
	var player := get_node_or_null("Player")
	if player is Node2D:
		player.position = LayoutApplier.spawn_position(layout, RegionRegistry.current_spawn_id)
	RegionRegistry.current_region_id = region_id
	EventBus.region_entered.emit(region_id, RegionRegistry.current_spawn_id)
	EventBus.log_debug("Region ready", { "regionId": region_id })
	_maybe_launch_playtest_region()

func _ensure_runtime_ui() -> void:
	var dialog_box := get_node_or_null("DialogBox")
	if dialog_box == null:
		dialog_box = DialogBoxScene.instantiate()
		dialog_box.name = "DialogBox"
		add_child(dialog_box)
	if dialog_box is CanvasLayer:
		dialog_box.layer = 30

	var hud := get_node_or_null("Hud")
	if hud == null:
		hud = HudScene.instantiate()
		hud.name = "Hud"
		add_child(hud)
	if hud is CanvasLayer:
		hud.layer = 5

func _maybe_launch_playtest_region() -> void:
	if not OS.has_feature("web"):
		return
	var enabled = JavaScriptBridge.eval("(new URLSearchParams(window.location.search)).get('playtest') === '1'", true)
	if not bool(enabled):
		return
	var target = JavaScriptBridge.eval("(new URLSearchParams(window.location.search)).get('playtestRegion') || ''", true)
	var target_region := String(target)
	if target_region.is_empty() or target_region == region_id:
		return
	if not RegionRegistry.regions.has(target_region):
		EventBus.log_debug("Ignored unknown playtest region", { "regionId": target_region })
		return
	call_deferred("_change_to_playtest_region", target_region)

func _change_to_playtest_region(target_region: String) -> void:
	RegionRegistry.change_region(target_region, "default")
