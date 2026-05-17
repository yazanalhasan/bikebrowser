extends Node

var variations = {}

func load_variations(file_path: String):
	var file = FileAccess.open(file_path, FileAccess.READ)
	if file == null:
		push_error("Could not open variations file: " + file_path)
		return
	var content = file.get_as_text()
	var parsed = JSON.parse_string(content)
	variations = parsed if typeof(parsed) == TYPE_DICTIONARY else {}

func get_variation(base_line: String) -> String:
	var variant_list = variations.get(base_line, [])
	if variant_list.is_empty():
		return base_line
	return variant_list[randi() % variant_list.size()]

func get_random_variation(key: String) -> String:
	var variant_list = variations.get(key, [])
	if variant_list.is_empty():
		return key
	return variant_list[randi() % variant_list.size()]
