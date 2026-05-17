@tool
extends Node

class_name TerrainGenerator

enum Biome { DESERT, DRY_WASH, RIVER, MINE, NEIGHBORHOOD }

var noise: FastNoiseLite
var biome_config: Dictionary = {}

func _init():
	noise = FastNoiseLite.new()
	noise.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH
	load_biome_config()

func load_biome_config():
	var config_path = "res://addons/TerrainGenerator/biomes.json"
	if FileAccess.file_exists(config_path):
		var file = FileAccess.open(config_path, FileAccess.READ)
		biome_config = JSON.parse_string(file.get_as_text())

func generate_terrain(tilemap: TileMap, bounds: Rect2, biome: Biome, seed: int = 12345):
	noise.seed = seed
	var biome_name = _biome_to_string(biome)
	var config = biome_config.get(biome_name, {})
	for x in range(bounds.position.x, bounds.end.x):
		for y in range(bounds.position.y, bounds.end.y):
			var height = noise.get_noise_2d(x, y)
			var tile = _get_tile_for_height(height, config)
			if tile != -1:
				tilemap.set_cell(0, Vector2i(x, y), tile)

func generate_dry_wash(tilemap: TileMap, start: Vector2, end: Vector2, channel_width: int = 3):
	var points = _get_line_points(start, end)
	var wash_tile = _get_tile_id("dry_sand")
	for point in points:
		for offset in range(-channel_width, channel_width + 1):
			var pos = Vector2i(point.x + offset, point.y)
			tilemap.set_cell(0, pos, wash_tile)
			var above = Vector2i(point.x + offset, point.y - 1)
			var below = Vector2i(point.x + offset, point.y + 1)
			if randf() < 0.3:
				tilemap.set_cell(0, above, wash_tile)
				tilemap.set_cell(0, below, wash_tile)

func generate_river(tilemap: TileMap, waypoints: Array, bank_width: int = 2):
	var water_tile = _get_tile_id("water")
	var bank_tile = _get_tile_id("wet_sand")
	for i in range(len(waypoints) - 1):
		var points = _get_line_points(waypoints[i], waypoints[i + 1])
		for point in points:
			for offset in range(-bank_width, bank_width + 1):
				var pos = Vector2i(point.x + offset, point.y)
				if abs(offset) <= 1:
					tilemap.set_cell(0, pos, water_tile)
				else:
					tilemap.set_cell(0, pos, bank_tile)

func _get_line_points(start: Vector2, end: Vector2) -> Array:
	var points = []
	var x1 = int(start.x)
	var y1 = int(start.y)
	var x2 = int(end.x)
	var y2 = int(end.y)
	var dx = abs(x2 - x1)
	var dy = abs(y2 - y1)
	var sx = 1 if x1 < x2 else -1
	var sy = 1 if y1 < y2 else -1
	var err = dx - dy
	while true:
		points.append(Vector2(x1, y1))
		if x1 == x2 and y1 == y2:
			break
		var e2 = 2 * err
		if e2 > -dy:
			err -= dy
			x1 += sx
		if e2 < dx:
			err += dx
			y1 += sy
	return points

func _get_tile_for_height(height: float, config: Dictionary) -> int:
	if height < -0.5:
		return _get_tile_id("sand")
	elif height < -0.2:
		return _get_tile_id("sand_dark")
	elif height < 0.2:
		return _get_tile_id("sand")
	elif height < 0.5:
		return _get_tile_id("rock")
	else:
		return _get_tile_id("rock_dark")

func _get_tile_id(name: String) -> int:
	# Override this in your project to return actual tile IDs.
	return -1

func _biome_to_string(biome: Biome) -> String:
	match biome:
		Biome.DESERT:
			return "desert"
		Biome.DRY_WASH:
			return "dry_wash"
		Biome.RIVER:
			return "river"
		Biome.MINE:
			return "mine"
		Biome.NEIGHBORHOOD:
			return "neighborhood"
		_:
			return "desert"

func scatter_vegetation(tilemap: TileMap, bounds: Rect2, plant_tiles: Dictionary, density: float = 0.05):
	for x in range(bounds.position.x, bounds.end.x):
		for y in range(bounds.position.y, bounds.end.y):
			if randf() < density:
				var plant = _get_random_plant(plant_tiles)
				if plant != -1:
					tilemap.set_cell(1, Vector2i(x, y), plant)
				elif randf() < 0.3:
					var rock = _get_tile_id("rock_small")
					if rock != -1:
						tilemap.set_cell(1, Vector2i(x, y), rock)

func _get_random_plant(plant_tiles: Dictionary) -> int:
	var plants = plant_tiles.keys()
	if plants.is_empty():
		return -1
	return plant_tiles[plants[randi() % plants.size()]]
