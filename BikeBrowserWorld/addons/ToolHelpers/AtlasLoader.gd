@tool
extends Node

var atlas_data = {}
var atlas_texture: Texture2D = null

func load_atlas(atlas_path: String, texture_path: String):
	var file = FileAccess.open(atlas_path, FileAccess.READ)
	if file == null:
		push_error("Could not open atlas metadata: " + atlas_path)
		return
	var content = file.get_as_text()
	var parsed = JSON.parse_string(content)
	atlas_data = parsed if typeof(parsed) == TYPE_DICTIONARY else {}
	atlas_texture = load(texture_path)

func get_texture_region(sprite_name: String) -> Rect2:
	var rect = atlas_data.get("sprites", {}).get(sprite_name)
	if not rect:
		return Rect2()
	return Rect2(rect.x, rect.y, rect.w, rect.h)

func create_sprite(sprite_name: String) -> Sprite2D:
	var sprite = Sprite2D.new()
	sprite.texture = atlas_texture
	var region = get_texture_region(sprite_name)
	sprite.region_enabled = true
	sprite.region_rect = region
	return sprite

func get_sprite_names() -> Array:
	return atlas_data.get("sprites", {}).keys()
