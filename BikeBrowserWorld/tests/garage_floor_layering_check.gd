extends SceneTree

var failures: Array[String] = []

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	var garage_scene: PackedScene = load("res://Regions/Garage/ZuzuGarage.tscn")
	_assert(garage_scene != null, "ZuzuGarage scene loads")
	if garage_scene == null:
		_finish()
		return

	var garage: Node = garage_scene.instantiate()
	root.add_child(garage)
	current_scene = garage
	await process_frame

	var rug: Node = garage.get_node_or_null("PropLayer/RugProp")
	var player: Node = garage.get_node_or_null("Player")
	_assert(rug is CanvasItem, "Garage rug prop is renderable")
	_assert(player is CanvasItem, "Garage player is renderable")
	if rug is CanvasItem and player is CanvasItem:
		_assert(rug.z_index < player.z_index, "Garage floor rug renders below Zuzu")

	_finish()

func _finish() -> void:
	if failures.is_empty():
		print("Garage floor layering check passed")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)

func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)
