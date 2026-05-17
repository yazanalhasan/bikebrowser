class_name LayoutApplier
extends Node

static func load_layout(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		return {}
	var parsed = JSON.parse_string(FileAccess.get_file_as_string(path))
	if typeof(parsed) == TYPE_DICTIONARY:
		return parsed
	return {}

static func apply_layout(root: Node, layout: Dictionary) -> void:
	var nodes: Dictionary = layout.get("nodes", {})
	for node_name in nodes.keys():
		var node := root.get_node_or_null(String(node_name))
		if node == null:
			continue
		_apply_node_layout(node, nodes[node_name])

static func spawn_position(layout: Dictionary, spawn_id: String = "default") -> Vector2:
	var spawns: Dictionary = layout.get("spawns", {})
	var spawn: Dictionary = spawns.get(spawn_id, spawns.get("default", { "x": 0, "y": 0 }))
	return Vector2(float(spawn.get("x", 0)), float(spawn.get("y", 0)))

static func _apply_node_layout(node: Node, spec: Dictionary) -> void:
	if node is Node2D:
		node.position = Vector2(float(spec.get("x", 0)), float(spec.get("y", 0)))
		if spec.has("scale"):
			var scale_value := float(spec.get("scale", 1.0))
			node.scale = Vector2(scale_value, scale_value)
		elif spec.has("scaleX") or spec.has("scaleY"):
			node.scale = Vector2(float(spec.get("scaleX", node.scale.x)), float(spec.get("scaleY", node.scale.y)))
		if spec.has("z"):
			node.z_index = int(spec["z"])
	if node is Control:
		node.position = Vector2(float(spec.get("x", 0)), float(spec.get("y", 0)))
		if spec.has("w") and spec.has("h"):
			node.size = Vector2(float(spec.get("w", 0)), float(spec.get("h", 0)))
		if spec.has("color") and node is ColorRect:
			node.color = Color.html(String(spec["color"]))
	if node is Polygon2D:
		if spec.has("w") and spec.has("h"):
			var width := float(spec["w"])
			var height := float(spec["h"])
			node.polygon = _shape_polygon(String(spec.get("shape", "rect")), width, height)
		if spec.has("color"):
			node.color = Color.html(String(spec["color"]))
	var collision := node.get_node_or_null("CollisionShape2D")
	if collision is CollisionShape2D and spec.has("w") and spec.has("h"):
		var shape := RectangleShape2D.new()
		shape.size = Vector2(float(spec["w"]), float(spec["h"]))
		collision.shape = shape
	# Optional: drive an NPC interaction circle from layout JSON via
	# `interaction_radius`. Targets the InteractionArea/CollisionShape2D
	# child of an AnimatedNpcInteraction Area2D. Per-region override.
	if spec.has("interaction_radius"):
		var interaction_area := node.get_node_or_null("InteractionArea")
		if interaction_area != null:
			var icol := interaction_area.get_node_or_null("CollisionShape2D")
			if icol is CollisionShape2D:
				var circle := CircleShape2D.new()
				circle.radius = float(spec["interaction_radius"])
				icol.shape = circle
		if node.has_method("set_interaction_radius"):
			node.call("set_interaction_radius", float(spec["interaction_radius"]))

static func _shape_polygon(shape: String, width: float, height: float) -> PackedVector2Array:
	match shape:
		"diamond":
			return PackedVector2Array([
				Vector2(width * 0.5, 0),
				Vector2(width, height * 0.5),
				Vector2(width * 0.5, height),
				Vector2(0, height * 0.5),
			])
		"triangle":
			return PackedVector2Array([
				Vector2(width * 0.5, 0),
				Vector2(width, height),
				Vector2(0, height),
			])
		"soft":
			return PackedVector2Array([
				Vector2(width * 0.08, 0),
				Vector2(width * 0.92, 0),
				Vector2(width, height * 0.12),
				Vector2(width, height * 0.88),
				Vector2(width * 0.92, height),
				Vector2(width * 0.08, height),
				Vector2(0, height * 0.88),
				Vector2(0, height * 0.12),
			])
		_:
			return PackedVector2Array([
				Vector2(0, 0),
				Vector2(width, 0),
				Vector2(width, height),
				Vector2(0, height),
			])
