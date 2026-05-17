@tool
extends Node
class_name NameGenerator

var names_cache: Dictionary = {}

func _ready():
	load_names()

func load_names():
	var file = FileAccess.open("res://addons/NameGenerator/names.json", FileAccess.READ)
	if file:
		var content = file.get_as_text()
		var parsed = JSON.parse_string(content)
		names_cache = parsed if typeof(parsed) == TYPE_DICTIONARY else {}

func get_random_name(category: String = "sonoran", gender: String = "neutral") -> String:
	var category_data = names_cache.get(category, {})
	var names = category_data.get(gender, category_data.get("neutral", []))
	if names.is_empty():
		return "Unknown"
	return names[randi() % names.size()]

func get_full_name(category: String = "sonoran") -> String:
	var first = get_random_name(category, "male")
	var last = get_random_name(category, "last")
	return first + " " + last

func get_random_culture() -> String:
	var cultures = names_cache.keys()
	if cultures.is_empty():
		return "sonoran"
	return cultures[randi() % cultures.size()]
