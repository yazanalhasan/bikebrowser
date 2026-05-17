extends SceneTree

var failures: Array[String] = []

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	var scene: PackedScene = load("res://Regions/Neighborhood/NeighborhoodStreet.tscn")
	_assert(scene != null, "NeighborhoodStreet scene loads")
	if scene == null:
		_finish()
		return

	var neighborhood := scene.instantiate()
	root.add_child(neighborhood)
	await process_frame
	await process_frame

	var garage_entrance: Node = neighborhood.get_node_or_null("GarageEntrance")
	var player: Node2D = neighborhood.get_node_or_null("Player")
	var region_registry: Node = root.get_node_or_null("RegionRegistry")
	_assert(garage_entrance != null, "GarageEntrance exists")
	_assert(player != null, "Player exists")
	_assert(region_registry != null, "RegionRegistry autoload exists")
	if garage_entrance == null or player == null or region_registry == null:
		_finish()
		return

	player.position = (garage_entrance as Node2D).position
	await physics_frame
	await physics_frame
	_assert(bool(garage_entrance.get("player_in_range")), "player enters garage trigger")
	garage_entrance.call("_transition")
	await create_timer(0.70).timeout
	_assert(String(region_registry.get("current_region_id")) == "garage", "garage transition changes current region")

	root.remove_child(neighborhood)
	neighborhood.free()
	scene = null
	await process_frame
	_finish()

func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)

func _finish() -> void:
	if failures.is_empty():
		print("Garage transition check passed")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)
