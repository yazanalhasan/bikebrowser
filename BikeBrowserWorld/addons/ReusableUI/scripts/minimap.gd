@tool
extends Control
class_name ReusableMinimap

@export_enum("circle", "square") var frame_shape := "circle":
	set(v):
		frame_shape = v
		queue_redraw()
@export var rotates_with_player := true:
	set(v):
		rotates_with_player = v
		queue_redraw()
@export var player_direction := 0.0:
	set(v):
		player_direction = v
		queue_redraw()
@export var map_texture: Texture2D:
	set(v):
		map_texture = v
		queue_redraw()
@export var frame_color := Color(1, 1, 1, 0.85):
	set(v):
		frame_color = v
		queue_redraw()
@export var fill_color := Color(0.03, 0.04, 0.05, 0.82):
	set(v):
		fill_color = v
		queue_redraw()

var markers: Array[Dictionary] = []

func _ready() -> void:
	custom_minimum_size = Vector2(160, 160)

func set_player_direction(radians: float) -> void:
	player_direction = radians

func set_markers(new_markers: Array[Dictionary]) -> void:
	markers = new_markers
	queue_redraw()

func _draw() -> void:
	var center := size * 0.5
	var radius := minf(size.x, size.y) * 0.5 - 3.0
	if frame_shape == "circle":
		draw_circle(center, radius, fill_color)
	else:
		draw_rect(Rect2(center - Vector2(radius, radius), Vector2(radius * 2.0, radius * 2.0)), fill_color, true)
	if map_texture:
		var map_rect := Rect2(center - Vector2(radius, radius), Vector2(radius * 2.0, radius * 2.0))
		draw_texture_rect(map_texture, map_rect, false, Color.WHITE)
	for marker in markers:
		var pos: Vector2 = marker.get("offset", Vector2.ZERO)
		if rotates_with_player:
			pos = pos.rotated(-player_direction)
		draw_circle(center + pos.limit_length(radius - 10.0), float(marker.get("size", 4.0)), marker.get("color", Color.ORANGE))
	_draw_player_icon(center)
	if frame_shape == "circle":
		draw_arc(center, radius, 0.0, TAU, 96, frame_color, 3.0)
	else:
		draw_rect(Rect2(center - Vector2(radius, radius), Vector2(radius * 2.0, radius * 2.0)), frame_color, false, 3.0)

func _draw_player_icon(center: Vector2) -> void:
	var points := PackedVector2Array([
		Vector2(0, -10).rotated(player_direction),
		Vector2(7, 8).rotated(player_direction),
		Vector2(0, 4).rotated(player_direction),
		Vector2(-7, 8).rotated(player_direction)
	])
	for i in points.size():
		points[i] += center
	draw_colored_polygon(points, Color.CORNFLOWER_BLUE)
