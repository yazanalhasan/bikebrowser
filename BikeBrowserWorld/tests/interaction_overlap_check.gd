extends SceneTree

# Regression test for the Mr. Chen / GarageEntrance class of bug.
#
# Loads every populated region scene and reports any NPC interaction circle
# whose world-space shape overlaps a ui_accept-consuming Area2D
# (TransitionZone door, SafetyCheckStation, or other interaction zone) in the
# same scene. Two such Area2Ds responding to the same E-press is ambiguous —
# whichever resolves first wins, and the player feels it as a stuck door.
#
# An overlap is allowed if EITHER node opts in via `allow_overlap = true`. That
# escape hatch is for the rare intentional case (e.g. a doorway an NPC is
# supposed to greet you from). Default is to fail.

const SCENES := [
	"res://Regions/Neighborhood/NeighborhoodStreet.tscn",
	"res://Regions/Garage/ZuzuGarage.tscn",
]

const NPC_SCRIPT := "res://Systems/Interactions/AnimatedNpcInteraction.gd"
const TRANSITION_SCRIPT := "res://Systems/World/TransitionZone.gd"
const SAFETY_SCRIPT := "res://Systems/Interactions/SafetyCheckStation.gd"

var failures: Array[String] = []

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	for scene_path in SCENES:
		var packed: PackedScene = load(scene_path)
		if packed == null:
			failures.append(scene_path + " — scene failed to load")
			continue
		var region: Node = packed.instantiate()
		root.add_child(region)
		await process_frame
		await process_frame
		_check_region(scene_path, region)
		root.remove_child(region)
		region.free()
		await process_frame
	_finish()

func _check_region(scene_path: String, region: Node) -> void:
	var npcs: Array = _find_with_script(region, NPC_SCRIPT)
	var consumers: Array = _find_with_script(region, TRANSITION_SCRIPT)
	consumers.append_array(_find_with_script(region, SAFETY_SCRIPT))
	for npc in npcs:
		var interaction_area: Node = npc.get_node_or_null("InteractionArea")
		if interaction_area == null:
			continue
		var npc_shape := _shape_world(interaction_area)
		if npc_shape.is_empty():
			continue
		for consumer in consumers:
			if consumer == npc:
				continue
			var consumer_shape := _shape_world(consumer)
			if consumer_shape.is_empty():
				continue
			if not _overlaps(npc_shape, consumer_shape):
				continue
			if bool(npc.get("allow_overlap")) or bool(consumer.get("allow_overlap")):
				continue
			failures.append(
				"%s — %s ∩ %s (both consume ui_accept; neither opts in via allow_overlap)" % [
					scene_path, _path_in(region, npc), _path_in(region, consumer)
				]
			)

# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------

func _find_with_script(root_node: Node, script_path: String) -> Array:
	var hits: Array = []
	_walk(root_node, func(n: Node) -> void:
		var s: Script = n.get_script()
		if s != null and s.resource_path == script_path:
			hits.append(n)
	)
	return hits

func _walk(node: Node, fn: Callable) -> void:
	fn.call(node)
	for child in node.get_children():
		_walk(child, fn)

func _shape_world(area: Node) -> Dictionary:
	var collision: CollisionShape2D = null
	for child in area.get_children():
		if child is CollisionShape2D:
			collision = child
			break
	if collision == null:
		return {}
	var shape := collision.shape
	if shape == null:
		return {}
	var pos: Vector2 = collision.global_position
	if shape is CircleShape2D:
		return { "kind": "circle", "center": pos, "radius": shape.radius }
	if shape is RectangleShape2D:
		return { "kind": "rect", "center": pos, "half": shape.size * 0.5 }
	return {}

func _overlaps(a: Dictionary, b: Dictionary) -> bool:
	if a.kind == "circle" and b.kind == "circle":
		return a.center.distance_to(b.center) < a.radius + b.radius
	if a.kind == "rect" and b.kind == "rect":
		var dx: float = abs(a.center.x - b.center.x)
		var dy: float = abs(a.center.y - b.center.y)
		return dx < a.half.x + b.half.x and dy < a.half.y + b.half.y
	# circle vs rect — clamp circle center to rect bounds, check distance
	var circle: Dictionary = a if a.kind == "circle" else b
	var rect: Dictionary = b if a.kind == "circle" else a
	var min_pt: Vector2 = rect.center - rect.half
	var max_pt: Vector2 = rect.center + rect.half
	var closest := Vector2(
		clamp(circle.center.x, min_pt.x, max_pt.x),
		clamp(circle.center.y, min_pt.y, max_pt.y)
	)
	return circle.center.distance_to(closest) < circle.radius

func _path_in(root_node: Node, target: Node) -> String:
	return String(root_node.get_path_to(target))

func _finish() -> void:
	if failures.is_empty():
		print("Interaction overlap check passed")
		quit(0)
	else:
		for f in failures:
			push_error(f)
		quit(1)
