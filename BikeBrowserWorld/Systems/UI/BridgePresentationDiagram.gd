extends Control

signal page_completed(page_id: String)

const PAPER := Color(0.98, 0.91, 0.72, 1.0)
const INK := Color(0.20, 0.15, 0.10, 1.0)
const GRAPHITE := Color(0.28, 0.27, 0.24, 1.0)
const WOOD := Color(0.64, 0.39, 0.20, 1.0)
const BLUE := Color(0.22, 0.47, 0.60, 1.0)
const ORANGE := Color(0.88, 0.49, 0.20, 1.0)
const GREEN := Color(0.36, 0.52, 0.30, 1.0)
const RED := Color(0.78, 0.24, 0.17, 1.0)

var slide: Dictionary = {}
var page_id := ""
var demo_type := "overview"
var interaction_type := ""
var completed := false
var t := 0.0
var selected_crossing := ""
var sorted_count := 0
var label_count := 0
var rectangle_pushed := false
var brace_placed := false
var brace_pushed := false
var load_trace_index := 0
var paper_texture: Texture2D
var family_cards_texture: Texture2D
var dry_wash_texture: Texture2D
var frame_states_texture: Texture2D
var truss_states_texture: Texture2D
var load_path_texture: Texture2D

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_STOP
	paper_texture = _load_ui_texture("res://Assets/UI/BridgeNotebook/bridge_notebook_paper.png")
	family_cards_texture = _load_ui_texture("res://Assets/UI/BridgeNotebook/bridge_family_cards.png")
	dry_wash_texture = _load_ui_texture("res://Assets/UI/BridgeNotebook/dry_wash_gap.png")
	frame_states_texture = _load_ui_texture("res://Assets/UI/BridgeNotebook/rectangle_frame_states.png")
	truss_states_texture = _load_ui_texture("res://Assets/UI/BridgeNotebook/triangle_truss_states.png")
	load_path_texture = _load_ui_texture("res://Assets/UI/BridgeNotebook/load_path_arrows.png")

func set_slide(next_slide: Dictionary) -> void:
	slide = next_slide.duplicate(true)
	page_id = String(slide.get("id", ""))
	demo_type = String(slide.get("demo_type", "overview"))
	interaction_type = String(slide.get("interaction_type", ""))
	completed = false
	selected_crossing = ""
	sorted_count = 0
	label_count = 0
	rectangle_pushed = false
	brace_placed = false
	brace_pushed = false
	load_trace_index = 0
	queue_redraw()

func force_complete_for_test() -> void:
	_mark_completed()

func _process(delta: float) -> void:
	t += delta
	queue_redraw()

func _gui_input(event: InputEvent) -> void:
	if not visible:
		return
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		_handle_press(event.position)
		get_viewport().set_input_as_handled()

func _handle_press(pos: Vector2) -> void:
	match interaction_type:
		"place_crossing":
			_handle_crossing(pos)
		"sort_forces":
			_handle_sort(pos)
		"label_parts":
			_handle_label(pos)
		"push_rectangle":
			rectangle_pushed = true
			_mark_completed()
		"place_brace":
			if _brace_rect().has_point(pos):
				brace_placed = true
			elif _push_rect().has_point(pos) and brace_placed:
				brace_pushed = true
				_mark_completed()
		"trace_load_path":
			_handle_load_trace(pos)
		_:
			_mark_completed()
	queue_redraw()

func _handle_crossing(pos: Vector2) -> void:
	var gap := _work_rect()
	if Rect2(gap.position + Vector2(gap.size.x * 0.32, gap.size.y * 0.42), Vector2(gap.size.x * 0.36, gap.size.y * 0.24)).has_point(pos):
		selected_crossing = "deck"
		_mark_completed()

func _handle_sort(pos: Vector2) -> void:
	for card in _bridge_cards():
		if Rect2(card.get("pos", Vector2.ZERO), Vector2(104, 56)).has_point(pos):
			sorted_count = mini(sorted_count + 1, 6)
			if sorted_count >= 6:
				_mark_completed()
			return

func _handle_label(pos: Vector2) -> void:
	for target in _part_targets():
		if Rect2(target.get("pos", Vector2.ZERO) - Vector2(44, 24), Vector2(88, 48)).has_point(pos):
			label_count = mini(label_count + 1, 3)
			if label_count >= 3:
				_mark_completed()
			return

func _handle_load_trace(pos: Vector2) -> void:
	var points := _load_points()
	if load_trace_index >= points.size():
		return
	var point: Vector2 = points[load_trace_index]
	if pos.distance_to(point) <= 44.0:
		load_trace_index += 1
		if load_trace_index >= points.size():
			_mark_completed()

func _mark_completed() -> void:
	if completed:
		return
	completed = true
	page_completed.emit(page_id)

func _draw() -> void:
	var rect := Rect2(Vector2.ZERO, size)
	_draw_notebook_paper(rect)
	var work := _work_rect()
	_draw_tape(rect.position + Vector2(28, 10), -0.08)
	_draw_tape(rect.end - Vector2(150, rect.size.y - 8), 0.08)
	_draw_margin_note(rect)
	match demo_type:
		"crossing_problem":
			_draw_crossing_problem(work)
		"bridge_types":
			_draw_bridge_types(work)
		"bridge_parts":
			_draw_bridge_parts(work)
		"rectangle_wobble":
			_draw_rectangle_wobble(work)
		"triangle_truss":
			_draw_triangle_truss(work)
		"load_path":
			_draw_load_path(work)
		_:
			_draw_crossing_problem(work)
	_draw_status(rect)

func _draw_notebook_paper(rect: Rect2) -> void:
	if paper_texture != null:
		draw_texture_rect(paper_texture, rect, false, Color(1.0, 1.0, 1.0, 0.96))
	else:
		draw_rect(rect, PAPER, true)
	draw_rect(rect, Color(0.40, 0.24, 0.12, 0.22), false, 2.0)
	for y in range(int(rect.position.y + 28), int(rect.end.y - 12), 24):
		draw_line(Vector2(rect.position.x + 18, y), Vector2(rect.end.x - 18, y), Color(0.37, 0.46, 0.52, 0.10), 1.0)
	for x in range(int(rect.position.x + 86), int(rect.end.x - 24), 84):
		draw_line(Vector2(x, rect.position.y + 18), Vector2(x, rect.end.y - 18), Color(0.68, 0.43, 0.24, 0.05), 1.0)
	draw_circle(rect.position + Vector2(66, 42), 5.0, Color(0.52, 0.34, 0.20, 0.24))
	draw_circle(rect.position + Vector2(66, rect.size.y * 0.5), 5.0, Color(0.52, 0.34, 0.20, 0.22))
	draw_circle(rect.position + Vector2(66, rect.size.y - 42), 5.0, Color(0.52, 0.34, 0.20, 0.22))

func _draw_margin_note(rect: Rect2) -> void:
	var note := Rect2(rect.position + Vector2(20, 56), Vector2(122, 112))
	draw_rect(note, Color(1.0, 0.84, 0.48, 0.84), true)
	draw_rect(note, Color(0.40, 0.24, 0.12, 0.28), false, 1.0)
	_draw_text("Mr. Chen", note.position + Vector2(12, 24), 14, INK)
	_draw_text("Try it\nbefore you\nname it.", note.position + Vector2(12, 52), 13, GRAPHITE)

func _draw_status(rect: Rect2) -> void:
	var text := "Notebook mark made" if completed else String(slide.get("prompt", "Try the sketch."))
	var status_rect := Rect2(rect.position + Vector2(160, rect.size.y - 40), Vector2(rect.size.x - 184, 28))
	draw_rect(status_rect, Color(1.0, 0.96, 0.82, 0.84), true)
	draw_rect(status_rect, Color(0.42, 0.28, 0.15, 0.22), false, 1.0)
	_draw_text(text, status_rect.position + Vector2(12, 20), 14, GREEN if completed else INK)

func _draw_crossing_problem(rect: Rect2) -> void:
	if dry_wash_texture != null:
		draw_texture_rect(dry_wash_texture, rect.grow(-8), false, Color(1.0, 1.0, 1.0, 0.42))
	_draw_desert_banks(rect)
	var deck_rect := Rect2(rect.position + Vector2(rect.size.x * 0.33, rect.size.y * 0.45), Vector2(rect.size.x * 0.34, 22))
	var color := ORANGE if completed else Color(0.72, 0.46, 0.25, 0.74)
	draw_rect(deck_rect, color, true)
	draw_rect(deck_rect, INK, false, 2.0)
	_draw_text("tap deck", deck_rect.position + Vector2(22, 17), 13, INK)
	if completed:
		_arrow(deck_rect.get_center() + Vector2(0, -44), deck_rect.get_center() + Vector2(0, -8), BLUE)
		_arrow(deck_rect.position + Vector2(18, 28), rect.position + Vector2(rect.size.x * 0.22, rect.size.y * 0.72), BLUE)
		_arrow(deck_rect.end + Vector2(-18, 28), rect.position + Vector2(rect.size.x * 0.78, rect.size.y * 0.72), BLUE)
		_draw_text("force finds ground", rect.position + Vector2(rect.size.x * 0.38, rect.size.y * 0.25), 16, BLUE)

func _draw_bridge_types(rect: Rect2) -> void:
	if family_cards_texture != null:
		draw_texture_rect(family_cards_texture, Rect2(rect.position + Vector2(4, 4), Vector2(minf(rect.size.x - 8.0, 584.0), 176)), false, Color(1.0, 1.0, 1.0, 0.30))
	var buckets := ["bending", "compression", "tension", "mixed"]
	for i in range(buckets.size()):
		var b := Rect2(rect.position + Vector2(18 + i * 128, rect.size.y - 54), Vector2(116, 36))
		draw_rect(b, Color(0.91, 0.78, 0.52, 0.76), true)
		draw_rect(b, Color(0.38, 0.24, 0.12, 0.30), false, 1.0)
		_draw_text(buckets[i], b.position + Vector2(10, 23), 12, INK)
	var index := 0
	for card in _bridge_cards():
		var r := Rect2(card.get("pos", Vector2.ZERO), Vector2(104, 56))
		var sorted := index < sorted_count
		draw_rect(r, Color(0.95, 0.88, 0.68, 0.92), true)
		draw_rect(r, GREEN if sorted else Color(0.34, 0.22, 0.13, 0.32), false, 2.0)
		_draw_text(String(card.get("name", "")), r.position + Vector2(8, 15), 11, INK)
		_draw_mini_bridge(String(card.get("kind", "")), r.grow(-10))
		index += 1

func _draw_bridge_parts(rect: Rect2) -> void:
	var deck_y := rect.position.y + rect.size.y * 0.44
	var left := rect.position.x + 90.0
	var right := rect.end.x - 90.0
	_line(Vector2(left, deck_y), Vector2(right, deck_y), 9.0, ORANGE)
	_support(Vector2(left + 20.0, deck_y), 72.0)
	_support(Vector2(right - 20.0, deck_y), 72.0)
	_support(Vector2((left + right) * 0.5, deck_y), 96.0)
	var labels := ["deck", "abutment", "pier"]
	var targets := _part_targets()
	for i in range(targets.size()):
		var p: Vector2 = targets[i].get("pos", Vector2.ZERO)
		var hit := i < label_count
		draw_circle(p, 14.0, Color(0.30, 0.53, 0.62, 0.35 if not hit else 0.85))
		_draw_text(labels[i], p + Vector2(18, 5), 13, GREEN if hit else GRAPHITE)

func _draw_rectangle_wobble(rect: Rect2) -> void:
	if frame_states_texture != null:
		draw_texture_rect(frame_states_texture, Rect2(rect.position + Vector2(76, 20), Vector2(rect.size.x - 152, rect.size.y - 46)), false, Color(1.0, 1.0, 1.0, 0.20))
	var wobble := 0.0
	if rectangle_pushed:
		wobble = 46.0 + sin(t * 5.0) * 5.0
	else:
		wobble = sin(t * 1.6) * 3.0
	_draw_rectangle_frame(rect, wobble, RED if rectangle_pushed else ORANGE)
	_arrow(rect.position + Vector2(rect.size.x - 70, rect.size.y * 0.35), rect.position + Vector2(rect.size.x - 144, rect.size.y * 0.35), RED)
	_draw_text("PUSH", rect.position + Vector2(rect.size.x - 118, rect.size.y * 0.30), 14, RED)

func _draw_triangle_truss(rect: Rect2) -> void:
	if truss_states_texture != null:
		draw_texture_rect(truss_states_texture, Rect2(rect.position + Vector2(84, 16), Vector2(rect.size.x - 168, rect.size.y - 36)), false, Color(1.0, 1.0, 1.0, 0.18))
	_draw_rectangle_frame(rect, 0.0, ORANGE)
	if brace_placed:
		_line(rect.position + Vector2(150, rect.size.y * 0.70), rect.position + Vector2(rect.size.x - 150, rect.size.y * 0.28), 7.0, BLUE)
		_draw_text("triangles", rect.position + Vector2(rect.size.x * 0.42, rect.size.y * 0.20), 16, BLUE)
	else:
		var brace := _brace_rect()
		draw_rect(brace, BLUE, true)
		draw_rect(brace, INK, false, 1.0)
		_draw_text("brace", brace.position + Vector2(12, 20), 13, Color.WHITE)
	if brace_placed:
		var push := _push_rect()
		draw_rect(push, Color(0.95, 0.70, 0.36, 0.90), true)
		draw_rect(push, INK, false, 1.0)
		_draw_text("push again", push.position + Vector2(10, 22), 13, INK)
	if brace_pushed:
		_arrow(rect.position + Vector2(rect.size.x - 70, rect.size.y * 0.36), rect.position + Vector2(rect.size.x - 142, rect.size.y * 0.36), GREEN)
		_draw_text("stays stiff", rect.position + Vector2(rect.size.x * 0.40, rect.size.y * 0.78), 16, GREEN)

func _draw_load_path(rect: Rect2) -> void:
	if load_path_texture != null:
		draw_texture_rect(load_path_texture, rect.grow(-8), false, Color(1.0, 1.0, 1.0, 0.26))
	_draw_desert_banks(rect)
	_draw_truss_bridge(rect)
	var points := _load_points()
	_draw_bike(points[0] + Vector2(-18, -42))
	for i in range(points.size()):
		draw_circle(points[i], 13.0, GREEN if i < load_trace_index else Color(0.24, 0.38, 0.72, 0.32))
		if i < points.size() - 1 and i < load_trace_index:
			_arrow(points[i], points[i + 1], BLUE)
	var labels := ["deck", "braces", "supports", "ground"]
	for i in range(points.size()):
		_draw_text(labels[i], points[i] + Vector2(18, 6), 13, INK)

func _work_rect() -> Rect2:
	return Rect2(Vector2(152, 20), size - Vector2(172, 72))

func _bridge_cards() -> Array:
	var r := _work_rect()
	var names := [
		{ "name": "beam", "kind": "beam", "pos": r.position + Vector2(18, 18) },
		{ "name": "arch", "kind": "arch", "pos": r.position + Vector2(142, 18) },
		{ "name": "frame", "kind": "frame", "pos": r.position + Vector2(266, 18) },
		{ "name": "cable", "kind": "cable", "pos": r.position + Vector2(390, 18) },
		{ "name": "suspend", "kind": "suspension", "pos": r.position + Vector2(80, 92) },
		{ "name": "truss", "kind": "truss", "pos": r.position + Vector2(326, 92) },
	]
	return names

func _part_targets() -> Array:
	var r := _work_rect()
	return [
		{ "pos": r.position + Vector2(r.size.x * 0.50, r.size.y * 0.35) },
		{ "pos": r.position + Vector2(r.size.x * 0.20, r.size.y * 0.73) },
		{ "pos": r.position + Vector2(r.size.x * 0.50, r.size.y * 0.78) },
	]

func _brace_rect() -> Rect2:
	var r := _work_rect()
	return Rect2(r.position + Vector2(24, r.size.y - 42), Vector2(88, 28))

func _push_rect() -> Rect2:
	var r := _work_rect()
	return Rect2(r.position + Vector2(r.size.x - 128, r.size.y - 48), Vector2(102, 34))

func _load_points() -> Array[Vector2]:
	var r := _work_rect()
	return [
		r.position + Vector2(r.size.x * 0.50, r.size.y * 0.31),
		r.position + Vector2(r.size.x * 0.42, r.size.y * 0.54),
		r.position + Vector2(r.size.x * 0.25, r.size.y * 0.73),
		r.position + Vector2(r.size.x * 0.18, r.size.y * 0.88),
	]

func _draw_desert_banks(rect: Rect2) -> void:
	var left_bank := PackedVector2Array([
		rect.position + Vector2(0, rect.size.y * 0.68),
		rect.position + Vector2(rect.size.x * 0.34, rect.size.y * 0.48),
		rect.position + Vector2(rect.size.x * 0.34, rect.size.y),
		rect.position + Vector2(0, rect.size.y),
	])
	var right_bank := PackedVector2Array([
		rect.position + Vector2(rect.size.x * 0.66, rect.size.y * 0.48),
		rect.position + Vector2(rect.size.x, rect.size.y * 0.68),
		rect.position + Vector2(rect.size.x, rect.size.y),
		rect.position + Vector2(rect.size.x * 0.66, rect.size.y),
	])
	draw_colored_polygon(left_bank, Color(0.74, 0.53, 0.32, 0.84))
	draw_colored_polygon(right_bank, Color(0.74, 0.53, 0.32, 0.84))
	draw_rect(Rect2(rect.position + Vector2(rect.size.x * 0.34, rect.size.y * 0.55), Vector2(rect.size.x * 0.32, rect.size.y * 0.45)), Color(0.35, 0.29, 0.25, 0.18), true)

func _draw_rectangle_frame(rect: Rect2, rack: float, color: Color) -> void:
	var a := rect.position + Vector2(150, rect.size.y * 0.70)
	var b := rect.position + Vector2(rect.size.x - 150, rect.size.y * 0.70)
	var c := rect.position + Vector2(rect.size.x - 150 + rack, rect.size.y * 0.28)
	var d := rect.position + Vector2(150 + rack, rect.size.y * 0.28)
	var pts := PackedVector2Array([a, b, c, d, a])
	draw_polyline(pts, color, 8.0, true)

func _draw_truss_bridge(rect: Rect2) -> void:
	var left := rect.position.x + rect.size.x * 0.22
	var right := rect.position.x + rect.size.x * 0.78
	var top := rect.position.y + rect.size.y * 0.33
	var bottom := rect.position.y + rect.size.y * 0.63
	_line(Vector2(left, top), Vector2(right, top), 8.0, ORANGE)
	_line(Vector2(left, bottom), Vector2(right, bottom), 6.0, WOOD)
	for i in range(5):
		var x0 := lerpf(left, right, float(i) / 5.0)
		var x1 := lerpf(left, right, float(i + 1) / 5.0)
		_line(Vector2(x0, bottom), Vector2(x1, top), 4.0, BLUE)
	_support(Vector2(left, top), 92.0)
	_support(Vector2(right, top), 92.0)

func _draw_mini_bridge(kind: String, r: Rect2) -> void:
	var y := r.position.y + r.size.y * 0.66
	_line(Vector2(r.position.x + 6, y), Vector2(r.end.x - 6, y), 3.0, ORANGE)
	match kind:
		"arch":
			var pts := PackedVector2Array()
			for i in range(12):
				var p := float(i) / 11.0
				pts.append(Vector2(lerpf(r.position.x + 10, r.end.x - 10, p), y + 14 - sin(p * PI) * 28))
			draw_polyline(pts, BLUE, 2.0, true)
		"frame":
			for i in range(4):
				var x := lerpf(r.position.x + 12, r.end.x - 12, float(i) / 3.0)
				_line(Vector2(x, y), Vector2(x, y + 16), 2.0, BLUE)
		"cable":
			var mast := Vector2(r.get_center().x, r.position.y + 6)
			_line(mast, Vector2(mast.x, y + 14), 2.0, WOOD)
			_line(mast, Vector2(r.position.x + 10, y), 1.5, BLUE)
			_line(mast, Vector2(r.end.x - 10, y), 1.5, BLUE)
		"suspension":
			var pts := PackedVector2Array()
			for i in range(12):
				var p := float(i) / 11.0
				pts.append(Vector2(lerpf(r.position.x + 8, r.end.x - 8, p), r.position.y + 14 + sin(p * PI) * 12))
			draw_polyline(pts, BLUE, 2.0, true)
		"truss":
			for i in range(4):
				var x0 := lerpf(r.position.x + 8, r.end.x - 8, float(i) / 4.0)
				var x1 := lerpf(r.position.x + 8, r.end.x - 8, float(i + 1) / 4.0)
				_line(Vector2(x0, y + 12), Vector2(x1, y), 2.0, BLUE)

func _draw_bike(pos: Vector2) -> void:
	draw_circle(pos, 11.0, INK)
	draw_circle(pos + Vector2(42, 0), 11.0, INK)
	_line(pos, pos + Vector2(22, -18), 3.0, INK)
	_line(pos + Vector2(42, 0), pos + Vector2(22, -18), 3.0, INK)
	_line(pos + Vector2(22, -18), pos + Vector2(34, -32), 3.0, INK)

func _support(top: Vector2, height: float) -> void:
	draw_colored_polygon(PackedVector2Array([
		top + Vector2(-12, 0),
		top + Vector2(12, 0),
		top + Vector2(8, height),
		top + Vector2(-8, height),
	]), WOOD)

func _draw_tape(pos: Vector2, angle: float) -> void:
	var tape := Transform2D(angle, pos)
	var pts := PackedVector2Array([
		tape * Vector2(0, 0),
		tape * Vector2(92, 0),
		tape * Vector2(86, 22),
		tape * Vector2(6, 22),
	])
	draw_colored_polygon(pts, Color(0.95, 0.77, 0.43, 0.58))

func _line(a: Vector2, b: Vector2, width: float, color: Color) -> void:
	draw_line(a, b, color, width, true)

func _arrow(a: Vector2, b: Vector2, color: Color) -> void:
	draw_line(a, b, color, 4.0, true)
	var direction := (b - a).normalized()
	var normal := Vector2(-direction.y, direction.x)
	draw_colored_polygon(PackedVector2Array([
		b,
		b - direction * 14.0 + normal * 7.0,
		b - direction * 14.0 - normal * 7.0,
	]), color)

func _draw_text(text: String, pos: Vector2, font_size: int, color: Color) -> void:
	var font := ThemeDB.fallback_font
	draw_string(font, pos, text, HORIZONTAL_ALIGNMENT_LEFT, -1.0, font_size, color)

func _load_ui_texture(path: String) -> Texture2D:
	var resource := load(path)
	if resource is Texture2D:
		return resource
	var image := Image.new()
	if image.load(path) != OK:
		return null
	return ImageTexture.create_from_image(image)
