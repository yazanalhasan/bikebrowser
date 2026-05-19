extends CanvasLayer

class OverlayView:
	extends Control

	var host: CanvasLayer

	func _draw() -> void:
		if host != null:
			host._draw_editor(self)

	func _gui_input(event: InputEvent) -> void:
		if host != null:
			host._handle_canvas_input(event)

const SNAP := 8.0
const NUDGE := 1.0
const FAST_NUDGE := 8.0
const MAX_HISTORY := 50

var scene_root: Node = null
var editable_nodes: Array[Node] = []
var selected: Array[Node] = []
var baseline := {}
var clipboard: Array[Dictionary] = []
var undo_stack: Array[Dictionary] = []
var redo_stack: Array[Dictionary] = []
var layer_locks := {}
var layer_solo := ""
var grid_visible := true
var show_bounds := false
var show_parents := false
var rotating := false
var dragging := false
var panning := false
var drag_start := Vector2.ZERO
var last_mouse := Vector2.ZERO
var drag_before := {}
var view_pan := Vector2.ZERO
var view_zoom := 1.0
var dev_token := ""
var token_requested := false
var scene_relative_path := "Regions/Neighborhood/NeighborhoodStreet.tscn"

var view: OverlayView
var badge: Label
var inspector: PanelContainer
var layers_panel: PanelContainer
var bottom_panel: PanelContainer
var dialog: ConfirmationDialog
var http: HTTPRequest
var pending_save_body := {}
var inspector_fields := {}

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_build_ui()

func open_for_scene(root: Node) -> void:
	scene_root = root
	_refresh_scene_path()
	_refresh_editable_nodes()
	_capture_baseline()
	_request_token()
	_update_panels()
	_publish_state()

func selected_count() -> int:
	return selected.size()

func selection_debug() -> Dictionary:
	if selected.is_empty() or not is_instance_valid(selected[0]):
		return {}
	var node := selected[0]
	var data := {
		"path": _node_key(node)
	}
	if node is Node2D:
		data["position"] = { "x": node.position.x, "y": node.position.y }
	return data

func selection_target() -> Dictionary:
	for node in editable_nodes:
		if not is_instance_valid(node) or _is_locked(node) or not (node is CanvasItem) or not node.visible:
			continue
		var bounds := _screen_bounds(node)
		if bounds.size.x < 6 or bounds.size.y < 6:
			continue
		var center := bounds.get_center()
		var viewport_size := get_viewport().get_visible_rect().size
		if center.x > 280 and center.x < viewport_size.x - 300 and center.y > 60 and center.y < viewport_size.y - 90:
			return {
				"path": _node_key(node),
				"x": center.x,
				"y": center.y
			}
	return {}

func _build_ui() -> void:
	view = OverlayView.new()
	view.host = self
	view.name = "EditorView"
	view.set_anchors_preset(Control.PRESET_FULL_RECT)
	view.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(view)

	badge = Label.new()
	badge.text = "EDIT MODE"
	badge.add_theme_color_override("font_color", Color(0.98, 0.82, 0.48))
	badge.add_theme_color_override("font_shadow_color", Color(0.05, 0.04, 0.03, 0.8))
	badge.add_theme_constant_override("shadow_offset_x", 1)
	badge.add_theme_constant_override("shadow_offset_y", 1)
	badge.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	badge.position = Vector2(-128, 14)
	badge.size = Vector2(112, 24)
	add_child(badge)

	inspector = PanelContainer.new()
	inspector.name = "InspectorPanel"
	inspector.position = Vector2(12, 52)
	inspector.size = Vector2(260, 430)
	add_child(inspector)

	layers_panel = PanelContainer.new()
	layers_panel.name = "LayerPanel"
	layers_panel.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	layers_panel.position = Vector2(-286, 52)
	layers_panel.size = Vector2(274, 430)
	add_child(layers_panel)

	bottom_panel = PanelContainer.new()
	bottom_panel.name = "AssetPalette"
	bottom_panel.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	bottom_panel.position = Vector2(280, -74)
	bottom_panel.size = Vector2(720, 62)
	add_child(bottom_panel)
	var palette_label := Label.new()
	palette_label.text = "Asset palette: Sprite2D drag-in is available in Tier 2; current Tier 1 edits existing scene nodes."
	bottom_panel.add_child(palette_label)

	dialog = ConfirmationDialog.new()
	dialog.title = "Save Scene Changes"
	dialog.dialog_text = ""
	dialog.confirmed.connect(_confirm_save)
	add_child(dialog)

	http = HTTPRequest.new()
	http.process_mode = Node.PROCESS_MODE_ALWAYS
	http.request_completed.connect(_on_http_completed)
	add_child(http)

func _refresh_scene_path() -> void:
	if scene_root != null and scene_root.scene_file_path.begins_with("res://"):
		scene_relative_path = scene_root.scene_file_path.trim_prefix("res://")

func _refresh_editable_nodes() -> void:
	editable_nodes.clear()
	if scene_root == null:
		return
	_collect_editable(scene_root)

func _collect_editable(node: Node) -> void:
	if node == self or node.name in [&"Hud", &"DialogBox", &"EditorOverlay"]:
		return
	if node != scene_root and node is CanvasItem and not _is_editor_ui(node):
		editable_nodes.append(node)
	for child in node.get_children():
		_collect_editable(child)

func _is_editor_ui(node: Node) -> bool:
	return node is Control or node is CanvasLayer

func _capture_baseline() -> void:
	baseline.clear()
	for node in editable_nodes:
		baseline[_node_key(node)] = _snapshot(node)

func _snapshot(node: Node) -> Dictionary:
	var snap := {}
	if node is Node2D:
		snap.position = node.position
		snap.scale = node.scale
		snap.rotation = node.rotation
	if node is CanvasItem:
		snap.visible = node.visible
		snap.z_index = node.z_index
		snap.modulate = node.modulate
	return snap

func _node_key(node: Node) -> String:
	if scene_root == null or node == null:
		return ""
	return String(scene_root.get_path_to(node))

func _draw_editor(canvas: Control) -> void:
	var rect := canvas.get_rect()
	if grid_visible:
		var step := SNAP * view_zoom
		var color := Color(0.96, 0.76, 0.42, 0.16)
		var x := fposmod(view_pan.x, step)
		while x < rect.size.x:
			canvas.draw_line(Vector2(x, 0), Vector2(x, rect.size.y), color, 1.0)
			x += step
		var y := fposmod(view_pan.y, step)
		while y < rect.size.y:
			canvas.draw_line(Vector2(0, y), Vector2(rect.size.x, y), color, 1.0)
			y += step

	for node in selected:
		if not is_instance_valid(node):
			continue
		var bounds := _screen_bounds(node)
		canvas.draw_rect(bounds, Color(1.0, 0.72, 0.36, 0.95), false, 1.0)
		for p in [bounds.position, bounds.position + Vector2(bounds.size.x, 0), bounds.position + bounds.size, bounds.position + Vector2(0, bounds.size.y)]:
			canvas.draw_rect(Rect2(p - Vector2(3, 3), Vector2(6, 6)), Color(1.0, 0.72, 0.36, 0.95), true)

	if show_bounds:
		for node in editable_nodes:
			if not is_instance_valid(node):
				continue
			canvas.draw_rect(_screen_bounds(node), Color(0.35, 0.72, 1.0, 0.28), false, 1.0)

	if show_parents:
		for node in selected:
			if is_instance_valid(node) and node.get_parent() is CanvasItem:
				canvas.draw_line(_screen_center(node), _screen_center(node.get_parent()), Color(1.0, 1.0, 1.0, 0.25), 1.0)

func _handle_canvas_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		_handle_mouse_button(event)
	elif event is InputEventMouseMotion:
		_handle_mouse_motion(event)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		_handle_key(event)
		get_viewport().set_input_as_handled()

func _handle_key(event: InputEventKey) -> void:
	match event.keycode:
		KEY_ESCAPE:
			selected.clear()
		KEY_G:
			grid_visible = not grid_visible
		KEY_B:
			show_bounds = not show_bounds
		KEY_P:
			show_parents = not show_parents
		KEY_R:
			rotating = not rotating
		KEY_H:
			_flip(Vector2(-1, 1))
		KEY_DELETE, KEY_BACKSPACE:
			_delete_selected()
		KEY_D:
			if event.ctrl_pressed:
				_duplicate_selected()
		KEY_C:
			if event.ctrl_pressed:
				_copy_selected()
		KEY_V:
			if event.ctrl_pressed:
				_paste()
			else:
				_flip(Vector2(1, -1))
		KEY_Z:
			if event.ctrl_pressed and event.shift_pressed:
				redo()
			elif event.ctrl_pressed:
				undo()
		KEY_Y:
			if event.ctrl_pressed:
				redo()
		KEY_S:
			if event.ctrl_pressed:
				_show_save_diff()
		KEY_BRACKETLEFT:
			_reorder_selected(-1)
		KEY_BRACKETRIGHT:
			_reorder_selected(1)
		KEY_F:
			_frame_selection()
		KEY_HOME:
			view_pan = Vector2.ZERO
			view_zoom = 1.0
		KEY_F5:
			_quick_play_test()
		KEY_F12:
			_request_screenshot()
		KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT:
			var delta := Vector2.ZERO
			var amount := FAST_NUDGE if event.shift_pressed else NUDGE
			if event.keycode == KEY_LEFT:
				delta.x = -amount
			elif event.keycode == KEY_RIGHT:
				delta.x = amount
			elif event.keycode == KEY_UP:
				delta.y = -amount
			elif event.keycode == KEY_DOWN:
				delta.y = amount
			_move_selected(delta, false)
	_update_panels()
	view.queue_redraw()
	_publish_state()

func _handle_mouse_button(event: InputEventMouseButton) -> void:
	if event.button_index == MOUSE_BUTTON_LEFT:
		if event.pressed:
			var node := _pick_node(event.position)
			if node != null:
				_select_node(node, event.shift_pressed, event.ctrl_pressed)
				dragging = true
				drag_start = event.position
				last_mouse = event.position
				drag_before = _snapshot_selection()
			else:
				if not event.shift_pressed and not event.ctrl_pressed:
					selected.clear()
		else:
			if dragging:
				_commit_drag()
			dragging = false
	elif event.button_index == MOUSE_BUTTON_MIDDLE:
		panning = event.pressed
		last_mouse = event.position
	elif event.button_index == MOUSE_BUTTON_WHEEL_UP and event.pressed:
		_zoom_at(event.position, 1.08)
	elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN and event.pressed:
		_zoom_at(event.position, 1.0 / 1.08)
	_update_panels()
	view.queue_redraw()
	_publish_state()

func _handle_mouse_motion(event: InputEventMouseMotion) -> void:
	if dragging and selected.size() > 0:
		var delta := (event.position - last_mouse) / view_zoom
		_move_selected(delta, not event.alt_pressed, false)
		last_mouse = event.position
	elif panning or Input.is_key_pressed(KEY_SPACE):
		view_pan += event.position - last_mouse
		last_mouse = event.position
	view.queue_redraw()
	_publish_state()

func _pick_node(screen_pos: Vector2) -> Node:
	for i in range(editable_nodes.size() - 1, -1, -1):
		var node := editable_nodes[i]
		if not is_instance_valid(node) or _is_locked(node) or not (node is CanvasItem) or not node.visible:
			continue
		if _screen_bounds(node).has_point(screen_pos):
			return node
	return null

func _select_node(node: Node, add: bool, toggle: bool) -> void:
	if toggle:
		if selected.has(node):
			selected.erase(node)
		else:
			selected.append(node)
	elif add:
		if not selected.has(node):
			selected.append(node)
	else:
		selected = [node]

func _move_selected(delta: Vector2, snap: bool, push_command := true) -> void:
	if selected.is_empty():
		return
	var before := _snapshot_selection()
	for node in selected:
		if node is Node2D and not _is_locked(node):
			node.position += delta
			if snap:
				node.position = Vector2(round(node.position.x / SNAP) * SNAP, round(node.position.y / SNAP) * SNAP)
	var after := _snapshot_selection()
	if push_command:
		_push_command("Move", before, after)

func _commit_drag() -> void:
	var after := _snapshot_selection()
	if JSON.stringify(drag_before) != JSON.stringify(after):
		_push_command("Move", drag_before, after)

func _flip(multiplier: Vector2) -> void:
	var before := _snapshot_selection()
	for node in selected:
		if node is Node2D:
			node.scale *= multiplier
	_push_command("Flip", before, _snapshot_selection())

func _duplicate_selected() -> void:
	var before_nodes := selected.duplicate()
	var new_selection: Array[Node] = []
	for node in before_nodes:
		if not is_instance_valid(node):
			continue
		var copy: Node = node.duplicate()
		copy.name = String(node.name) + "Copy"
		node.get_parent().add_child(copy)
		if copy is Node2D:
			copy.position += Vector2(8, 8)
		new_selection.append(copy)
	selected = new_selection
	_refresh_editable_nodes()
	_capture_baseline()
	_push_command("Duplicate", {}, _snapshot_selection())

func _delete_selected() -> void:
	for node in selected:
		if is_instance_valid(node):
			node.queue_free()
	selected.clear()
	call_deferred("_refresh_after_delete")

func _refresh_after_delete() -> void:
	_refresh_editable_nodes()
	_update_panels()
	view.queue_redraw()

func _copy_selected() -> void:
	clipboard.clear()
	for node in selected:
		clipboard.append({
			"name": String(node.name),
			"snapshot": _snapshot(node)
		})

func _paste() -> void:
	_duplicate_selected()

func _reorder_selected(direction: int) -> void:
	for node in selected:
		var parent := node.get_parent()
		if parent == null:
			continue
		var idx := node.get_index()
		parent.move_child(node, clamp(idx + direction, 0, parent.get_child_count() - 1))
	_refresh_editable_nodes()

func _snapshot_selection() -> Dictionary:
	var result := {}
	for node in selected:
		if is_instance_valid(node):
			result[_node_key(node)] = _snapshot(node)
	return result

func _push_command(label: String, before: Dictionary, after: Dictionary) -> void:
	undo_stack.append({ "label": label, "before": before, "after": after })
	if undo_stack.size() > MAX_HISTORY:
		undo_stack.pop_front()
	redo_stack.clear()

func undo() -> void:
	if undo_stack.is_empty():
		return
	var command := undo_stack.pop_back()
	_apply_snapshot_set(command.before)
	redo_stack.append(command)

func redo() -> void:
	if redo_stack.is_empty():
		return
	var command := redo_stack.pop_back()
	_apply_snapshot_set(command.after)
	undo_stack.append(command)

func _apply_snapshot_set(items: Dictionary) -> void:
	for key in items.keys():
		var node := scene_root.get_node_or_null(NodePath(String(key)))
		if node != null:
			_apply_snapshot(node, items[key])
	_update_panels()
	view.queue_redraw()
	_publish_state()

func _apply_snapshot(node: Node, snap: Dictionary) -> void:
	if node is Node2D:
		if snap.has("position"):
			node.position = snap.position
		if snap.has("scale"):
			node.scale = snap.scale
		if snap.has("rotation"):
			node.rotation = snap.rotation
	if node is CanvasItem:
		if snap.has("visible"):
			node.visible = snap.visible
		if snap.has("z_index"):
			node.z_index = int(snap.z_index)
		if snap.has("modulate"):
			node.modulate = snap.modulate

func _screen_bounds(node: Node) -> Rect2:
	var center := _screen_center(node)
	var size := Vector2(48, 48)
	if node is Sprite2D and node.texture != null:
		size = node.texture.get_size() * node.global_scale.abs()
	elif node is Label:
		size = node.size * node.global_scale.abs()
	elif node is Polygon2D:
		size = _polygon_size(node) * node.global_scale.abs()
	return Rect2(center - size * 0.5 * view_zoom + view_pan, size * view_zoom).abs()

func _screen_center(node: Node) -> Vector2:
	if node is Node2D:
		return node.global_position * view_zoom + view_pan
	if node is Control:
		return node.global_position + node.size * 0.5
	return Vector2.ZERO

func _polygon_size(poly: Polygon2D) -> Vector2:
	if poly.polygon.is_empty():
		return Vector2(48, 48)
	var min_v := poly.polygon[0]
	var max_v := poly.polygon[0]
	for p in poly.polygon:
		min_v = min_v.min(p)
		max_v = max_v.max(p)
	return (max_v - min_v).abs().max(Vector2(8, 8))

func _is_locked(node: Node) -> bool:
	var layer := _layer_name(node)
	return bool(layer_locks.get(layer, false))

func _layer_name(node: Node) -> String:
	var current := node
	while current != null and current.get_parent() != scene_root:
		current = current.get_parent()
	if current == null:
		return "Scene"
	return String(current.name)

func _update_panels() -> void:
	_update_inspector()
	_update_layers()

func _update_inspector() -> void:
	for child in inspector.get_children():
		child.queue_free()
	inspector_fields.clear()
	var box := VBoxContainer.new()
	inspector.add_child(box)
	var title := Label.new()
	title.text = "Inspector (%d)" % selected.size()
	box.add_child(title)
	if selected.size() != 1:
		return
	var node := selected[0]
	_add_readonly(box, "Name", String(node.name))
	if node is Node2D:
		_add_number_field(box, "x", node.position.x, func(v): _set_selected_property("position:x", v))
		_add_number_field(box, "y", node.position.y, func(v): _set_selected_property("position:y", v))
		_add_number_field(box, "scale x", node.scale.x, func(v): _set_selected_property("scale:x", v))
		_add_number_field(box, "scale y", node.scale.y, func(v): _set_selected_property("scale:y", v))
		_add_number_field(box, "rotation", rad_to_deg(node.rotation), func(v): _set_selected_property("rotation_degrees", v))
	if node is CanvasItem:
		_add_number_field(box, "z-index", node.z_index, func(v): _set_selected_property("z_index", v))
		_add_check(box, "visible", node.visible, func(v): _set_selected_property("visible", v))
	_add_readonly(box, "Layer", _layer_name(node))

func _add_readonly(box: VBoxContainer, label: String, value: String) -> void:
	var l := Label.new()
	l.text = label + ": " + value
	box.add_child(l)

func _add_number_field(box: VBoxContainer, label: String, value: float, callback: Callable) -> void:
	var row := HBoxContainer.new()
	var l := Label.new()
	l.text = label
	l.custom_minimum_size = Vector2(84, 0)
	var edit := LineEdit.new()
	edit.text = str(value)
	edit.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	edit.text_submitted.connect(func(text): callback.call(float(text)))
	row.add_child(l)
	row.add_child(edit)
	box.add_child(row)

func _add_check(box: VBoxContainer, label: String, value: bool, callback: Callable) -> void:
	var check := CheckBox.new()
	check.text = label
	check.button_pressed = value
	check.toggled.connect(func(v): callback.call(v))
	box.add_child(check)

func _set_selected_property(property: String, value) -> void:
	var before := _snapshot_selection()
	for node in selected:
		if property == "position:x" and node is Node2D:
			node.position.x = float(value)
		elif property == "position:y" and node is Node2D:
			node.position.y = float(value)
		elif property == "scale:x" and node is Node2D:
			node.scale.x = float(value)
		elif property == "scale:y" and node is Node2D:
			node.scale.y = float(value)
		elif property == "rotation_degrees" and node is Node2D:
			node.rotation = deg_to_rad(float(value))
		elif property == "z_index" and node is CanvasItem:
			node.z_index = int(value)
		elif property == "visible" and node is CanvasItem:
			node.visible = bool(value)
	_push_command("Inspect " + property, before, _snapshot_selection())
	view.queue_redraw()
	_publish_state()

func _update_layers() -> void:
	for child in layers_panel.get_children():
		child.queue_free()
	var box := VBoxContainer.new()
	layers_panel.add_child(box)
	var title := Label.new()
	title.text = "Layers"
	box.add_child(title)
	var layers := _layer_counts()
	for layer in layers.keys():
		var row := HBoxContainer.new()
		var name := Label.new()
		name.text = "%s (%d)" % [layer, layers[layer]]
		name.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var visible := CheckBox.new()
		visible.text = "V"
		visible.button_pressed = _layer_visible(layer)
		visible.toggled.connect(func(v, layer_name = layer): _set_layer_visible(layer_name, v))
		var lock := CheckBox.new()
		lock.text = "L"
		lock.button_pressed = bool(layer_locks.get(layer, false))
		lock.toggled.connect(func(v, layer_name = layer): layer_locks[layer_name] = v)
		var solo := CheckBox.new()
		solo.text = "S"
		solo.button_pressed = layer_solo == layer
		solo.toggled.connect(func(v, layer_name = layer): _set_layer_solo(layer_name, v))
		row.add_child(name)
		row.add_child(visible)
		row.add_child(lock)
		row.add_child(solo)
		box.add_child(row)

func _layer_counts() -> Dictionary:
	var counts := {}
	for node in editable_nodes:
		var layer := _layer_name(node)
		counts[layer] = int(counts.get(layer, 0)) + 1
	return counts

func _layer_visible(layer: String) -> bool:
	for node in editable_nodes:
		if _layer_name(node) == layer and node is CanvasItem:
			return node.visible
	return true

func _set_layer_visible(layer: String, visible: bool) -> void:
	for node in editable_nodes:
		if _layer_name(node) == layer and node is CanvasItem:
			node.visible = visible
	view.queue_redraw()

func _set_layer_solo(layer: String, enabled: bool) -> void:
	layer_solo = layer if enabled else ""
	for node in editable_nodes:
		if node is CanvasItem:
			node.visible = layer_solo.is_empty() or _layer_name(node) == layer_solo
	view.queue_redraw()

func _zoom_at(point: Vector2, factor: float) -> void:
	var before := (point - view_pan) / view_zoom
	view_zoom = clamp(view_zoom * factor, 0.35, 3.0)
	view_pan = point - before * view_zoom

func _frame_selection() -> void:
	if selected.is_empty():
		return
	var center := Vector2.ZERO
	var count := 0
	for node in selected:
		if node is Node2D:
			center += node.global_position
			count += 1
	if count > 0:
		center /= count
		view_pan = get_viewport().get_visible_rect().size * 0.5 - center * view_zoom

func _show_save_diff() -> void:
	var changes := _changed_patches()
	if changes.is_empty():
		dialog.dialog_text = "No editable property changes to save."
		pending_save_body.clear()
	else:
		var lines: Array[String] = []
		for patch in changes:
			lines.append(String(patch.nodePath))
			for property in patch.properties.keys():
				lines.append("  " + property + " -> " + str(patch.properties[property]))
		dialog.dialog_text = "\\n".join(lines)
		pending_save_body = {
			"relativePath": scene_relative_path,
			"patches": changes
		}
	dialog.popup_centered(Vector2(620, 460))

func _changed_patches() -> Array:
	var patches := []
	for node in editable_nodes:
		if not is_instance_valid(node):
			continue
		var key := _node_key(node)
		if not baseline.has(key):
			continue
		var before: Dictionary = baseline[key]
		var now := _snapshot(node)
		var props := {}
		for property in ["position", "scale", "rotation", "z_index", "visible"]:
			if now.has(property) and before.has(property) and now[property] != before[property]:
				props[property] = _json_value(now[property])
		if not props.is_empty():
			patches.append({ "nodePath": key, "properties": props })
	return patches

func _json_value(value):
	if value is Vector2:
		return { "x": value.x, "y": value.y }
	if value is Color:
		return { "r": value.r, "g": value.g, "b": value.b, "a": value.a }
	return value

func _confirm_save() -> void:
	if pending_save_body.is_empty():
		return
	if dev_token.is_empty():
		_request_token()
		return
	var headers := ["Content-Type: application/json", "x-dev-editor-token: " + dev_token]
	http.request("http://127.0.0.1:3001/api/dev-editor/save-scene", headers, HTTPClient.METHOD_POST, JSON.stringify(pending_save_body))

func _request_token() -> void:
	if token_requested or not dev_token.is_empty():
		return
	token_requested = true
	http.request("http://127.0.0.1:3001/api/dev-token")

func _on_http_completed(_result: int, response_code: int, _headers: PackedStringArray, body: PackedByteArray) -> void:
	var text := body.get_string_from_utf8()
	var parsed = JSON.parse_string(text)
	if typeof(parsed) != TYPE_DICTIONARY:
		return
	if parsed.get("token", "") != "":
		dev_token = String(parsed.token)
	elif response_code >= 200 and response_code < 300 and parsed.get("success", false):
		_capture_baseline()
		_send_telegram_save_summary()
	_publish_state({ "lastHttpCode": response_code, "lastHttpResponse": parsed })

func _send_telegram_save_summary() -> void:
	if OS.has_feature("web"):
		JavaScriptBridge.eval("console.info('Scene " + scene_relative_path + " saved.');", true)

func _publish_state(extra: Dictionary = {}) -> void:
	var root := get_node_or_null("/root/LevelEditor")
	if root != null and root.has_method("_publish_state"):
		root.call("_publish_state", extra)

func _quick_play_test() -> void:
	var root := get_node_or_null("/root/LevelEditor")
	if root != null:
		root.call("exit_edit_mode")
		await get_tree().create_timer(10.0).timeout
		root.call("enter_edit_mode")

func _request_screenshot() -> void:
	var img := get_viewport().get_texture().get_image()
	var dir := "user://editor_screenshots"
	DirAccess.make_dir_recursive_absolute(dir)
	img.save_png(dir + "/editor_" + Time.get_datetime_string_from_system().replace(":", "-") + ".png")
