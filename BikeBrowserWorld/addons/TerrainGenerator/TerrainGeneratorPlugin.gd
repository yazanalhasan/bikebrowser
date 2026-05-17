@tool
extends EditorPlugin

var terrain_dock: Control

func _enter_tree():
	terrain_dock = preload("terrain_dock.tscn").instantiate()
	add_control_to_dock(DOCK_SLOT_LEFT_UL, terrain_dock)
	add_tool_menu_item("Generate Terrain", _on_generate_terrain)

func _exit_tree():
	remove_control_from_docks(terrain_dock)
	terrain_dock.queue_free()
	remove_tool_menu_item("Generate Terrain")

func _on_generate_terrain():
	if terrain_dock:
		terrain_dock._on_generate_pressed()
