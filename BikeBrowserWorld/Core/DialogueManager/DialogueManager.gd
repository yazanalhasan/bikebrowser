extends Node

# CANONICAL RUNTIME SYSTEM
# This is the authoritative gameplay dialogue manager. Addon dialogue
# systems are library/demo systems unless explicitly bridged here.

const DIALOGUE_DIR := "res://Data/dialogue/"

var validation_errors: Array = []
var validation_warnings: Array = []
var detected_schemas: Dictionary = {}
var normalized_dialogues: Dictionary = {}

func start_dialogue(dialogue_id: String, npc_id: String = "") -> void:
	var dialogue := load_dialogue(dialogue_id)
	if dialogue.is_empty():
		EventBus.log_debug("Missing dialogue", { "dialogueId": dialogue_id })
		return
	dialogue["npcId"] = npc_id
	EventBus.dialogue_requested.emit(dialogue)

func load_dialogue(dialogue_id: String) -> Dictionary:
	if normalized_dialogues.has(dialogue_id):
		return normalized_dialogues[dialogue_id].duplicate(true)
	var path := DIALOGUE_DIR + dialogue_id + ".json"
	var raw := _load_json(path)
	if raw.is_empty():
		var message := "Dialogue not found or invalid: %s" % dialogue_id
		validation_errors.append(message)
		push_error(message)
		return {}
	var normalized := normalize_dialogue(raw, path)
	normalized_dialogues[dialogue_id] = normalized
	return normalized.duplicate(true)

func normalize_dialogue(raw: Dictionary, path: String = "") -> Dictionary:
	if raw.has("dialogue_tree"):
		_count_schema("dialogue_tree")
		return _normalize_dialogue_tree(raw, path)
	if raw.has("lines"):
		_count_schema("lines")
		return _normalize_lines_array(raw, path)
	if raw.has("nodes"):
		_count_schema("nodes")
		return _normalize_nodes_graph(raw, path)
	_count_schema("fallback")
	var id := _dialogue_id_from(raw, path)
	var speaker := String(raw.get("speaker", raw.get("npc_id", "Unknown")))
	var text := _extract_text(raw.get("greeting", "..."))
	var warning := "Unknown dialogue schema in %s" % path
	validation_warnings.append(warning)
	push_warning(warning)
	return {
		"id": id,
		"speaker": speaker,
		"start_node": "start",
		"dialogue_tree": {
			"start": {
				"id": "start",
				"speaker": speaker,
				"text": text,
				"next": null
			}
		},
		"lines": [{ "speaker": speaker, "text": text }],
		"_source_path": path,
		"_schema": "fallback"
	}

func validate_all_dialogues() -> Dictionary:
	validation_errors.clear()
	validation_warnings.clear()
	detected_schemas.clear()
	normalized_dialogues.clear()
	var total := 0
	var dir := DirAccess.open(DIALOGUE_DIR)
	if dir == null:
		validation_errors.append("Cannot open dialogue directory: %s" % DIALOGUE_DIR)
		return get_dialogue_validation_report()
	dir.list_dir_begin()
	var file_name := dir.get_next()
	while file_name != "":
		if not dir.current_is_dir() and file_name.ends_with(".json"):
			total += 1
			var dialogue_id := file_name.get_basename()
			load_dialogue(dialogue_id)
		file_name = dir.get_next()
	dir.list_dir_end()
	return get_dialogue_validation_report()

func get_dialogue_validation_report() -> Dictionary:
	return {
		"dialogue_count": normalized_dialogues.size(),
		"schemas": detected_schemas,
		"errors": validation_errors,
		"warnings": validation_warnings,
		"dialogue_ids": normalized_dialogues.keys()
	}

func _load_json(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		return {}
	var parsed = JSON.parse_string(FileAccess.get_file_as_string(path))
	if typeof(parsed) == TYPE_DICTIONARY:
		return parsed
	return {}

func _normalize_lines_array(raw: Dictionary, path: String) -> Dictionary:
	var id := _dialogue_id_from(raw, path)
	var speaker := String(raw.get("speaker", raw.get("npc_id", "Friend")))
	var raw_lines: Array = raw.get("lines", [])
	var tree := {}
	var lines: Array = []
	if raw_lines.is_empty():
		var warning := "Dialogue has empty lines array: %s" % path
		validation_warnings.append(warning)
		push_warning(warning)
		raw_lines = [{ "speaker": speaker, "text": "..." }]
	for index in range(raw_lines.size()):
		var line_data := _line_to_dictionary(raw_lines[index], speaker)
		var node_id := "line_%d" % index
		var next_id = "line_%d" % (index + 1) if index < raw_lines.size() - 1 else null
		tree[node_id] = {
			"id": node_id,
			"speaker": String(line_data.get("speaker", speaker)),
			"text": String(line_data.get("text", "")),
			"next": next_id
		}
		lines.append({ "speaker": tree[node_id]["speaker"], "text": tree[node_id]["text"] })
	return _base_dialogue(raw, id, speaker, "line_0", tree, lines, path, "lines")

func _normalize_dialogue_tree(raw: Dictionary, path: String) -> Dictionary:
	var id := _dialogue_id_from(raw, path)
	var speaker := String(raw.get("speaker", raw.get("npc_id", "Friend")))
	var raw_tree = raw.get("dialogue_tree")
	var tree := {}
	var order: Array = []
	if typeof(raw_tree) == TYPE_ARRAY:
		for entry in raw_tree:
			if typeof(entry) != TYPE_DICTIONARY:
				continue
			var node: Dictionary = entry
			var node_id := String(node.get("id", "node_%d" % order.size()))
			tree[node_id] = _normalize_node(node, node_id, speaker)
			order.append(node_id)
	elif typeof(raw_tree) == TYPE_DICTIONARY:
		for node_id in raw_tree.keys():
			var node_data = raw_tree[node_id]
			if typeof(node_data) == TYPE_DICTIONARY:
				tree[String(node_id)] = _normalize_node(node_data, String(node_id), speaker)
				order.append(String(node_id))
	if tree.is_empty():
		var warning := "Dialogue tree has no usable nodes: %s" % path
		validation_warnings.append(warning)
		push_warning(warning)
		tree["start"] = { "id": "start", "speaker": speaker, "text": "...", "next": null }
		order.append("start")
	var start_node := String(raw.get("start_node", order[0]))
	if not tree.has(start_node):
		validation_errors.append("Dialogue start node missing in %s: %s" % [path, start_node])
		start_node = order[0]
	_validate_tree_links(tree, path)
	var lines := _tree_to_lines(tree, start_node, speaker)
	return _base_dialogue(raw, id, speaker, start_node, tree, lines, path, "dialogue_tree")

func _normalize_nodes_graph(raw: Dictionary, path: String) -> Dictionary:
	var id := _dialogue_id_from(raw, path)
	var speaker := String(raw.get("speaker", raw.get("npc", raw.get("npc_id", "Friend"))))
	var raw_nodes: Dictionary = raw.get("nodes", {})
	var tree := {}
	for node_id in raw_nodes.keys():
		var node = raw_nodes[node_id]
		if typeof(node) == TYPE_DICTIONARY:
			tree[String(node_id)] = _normalize_node(node, String(node_id), speaker)
	var start_node := "start" if tree.has("start") else (String(tree.keys()[0]) if not tree.is_empty() else "start")
	if tree.is_empty():
		validation_warnings.append("Nodes dialogue has no usable nodes: %s" % path)
		tree[start_node] = { "id": start_node, "speaker": speaker, "text": "...", "next": null }
	_validate_tree_links(tree, path)
	var lines := _tree_to_lines(tree, start_node, speaker)
	return _base_dialogue(raw, id, speaker, start_node, tree, lines, path, "nodes")

func _base_dialogue(raw: Dictionary, id: String, speaker: String, start_node: String, tree: Dictionary, lines: Array, path: String, schema: String) -> Dictionary:
	var normalized := raw.duplicate(true)
	normalized["id"] = id
	normalized["speaker"] = speaker
	normalized["start_node"] = start_node
	normalized["dialogue_tree"] = tree
	normalized["lines"] = lines
	normalized["_source_path"] = path
	normalized["_schema"] = schema
	return normalized

func _normalize_node(node: Dictionary, node_id: String, fallback_speaker: String) -> Dictionary:
	var normalized := node.duplicate(true)
	normalized["id"] = node_id
	normalized["speaker"] = String(node.get("speaker", fallback_speaker))
	normalized["text"] = _extract_text(node.get("text", node.get("greeting", "")))
	if not normalized.has("next"):
		normalized["next"] = null
	return normalized

func _tree_to_lines(tree: Dictionary, start_node: String, fallback_speaker: String) -> Array:
	var lines: Array = []
	var visited := {}
	var node_id = start_node
	while node_id != null and String(node_id) != "" and tree.has(String(node_id)) and not visited.has(String(node_id)):
		visited[String(node_id)] = true
		var node: Dictionary = tree[String(node_id)]
		lines.append({
			"speaker": String(node.get("speaker", fallback_speaker)),
			"text": String(node.get("text", ""))
		})
		node_id = node.get("next", null)
	return lines

func _validate_tree_links(tree: Dictionary, path: String) -> void:
	for node_id in tree.keys():
		var node: Dictionary = tree[node_id]
		var next_id = node.get("next", null)
		if next_id != null and String(next_id) != "" and not tree.has(String(next_id)):
			validation_errors.append("Dialogue node %s in %s points to missing next node: %s" % [node_id, path, next_id])

func _line_to_dictionary(line, fallback_speaker: String) -> Dictionary:
	if typeof(line) == TYPE_DICTIONARY:
		return line
	return { "speaker": fallback_speaker, "text": String(line) }

func _extract_text(value) -> String:
	if typeof(value) == TYPE_DICTIONARY:
		return String(value.get("text", ""))
	return String(value)

func _dialogue_id_from(raw: Dictionary, path: String) -> String:
	var fallback := path.get_file().get_basename() if not path.is_empty() else "dialogue"
	return String(raw.get("id", raw.get("dialogue_id", fallback)))

func _count_schema(schema: String) -> void:
	detected_schemas[schema] = int(detected_schemas.get(schema, 0)) + 1
