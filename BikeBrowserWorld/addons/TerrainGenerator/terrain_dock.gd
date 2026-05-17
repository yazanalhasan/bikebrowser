@tool
extends Panel

@onready var biome_select = $VBoxContainer/BiomeSelect
@onready var seed_input = $VBoxContainer/SeedInput
@onready var bounds_input = $VBoxContainer/BoundsInput
@onready var generate_button = $VBoxContainer/GenerateButton
@onready var status_label = $VBoxContainer/StatusLabel

func _ready():
	generate_button.pressed.connect(_on_generate_pressed)

func _on_generate_pressed():
	status_label.text = "Generating..."
	var tilemap = _get_selected_tilemap()
	if not tilemap:
		status_label.text = "Error: Select a TileMap node"
		return
	var biome_map = {
		0: TerrainGenerator.Biome.DESERT,
		1: TerrainGenerator.Biome.DRY_WASH,
		2: TerrainGenerator.Biome.RIVER,
		3: TerrainGenerator.Biome.MINE,
		4: TerrainGenerator.Biome.NEIGHBORHOOD
	}
	var biome = biome_map.get(biome_select.selected, TerrainGenerator.Biome.DESERT)
	var seed = 12345
	if seed_input.text.is_valid_int():
		seed = seed_input.text.to_int()
	else:
		seed = randi()
	var bounds_parts = bounds_input.text.split(",")
	if bounds_parts.size() == 4:
		var bounds = Rect2(
			float(bounds_parts[0]), float(bounds_parts[1]),
			float(bounds_parts[2]), float(bounds_parts[3])
		)
		TerrainGenerator.new().generate_terrain(tilemap, bounds, biome, seed)
		status_label.text = "Complete!"
	else:
		status_label.text = "Error: Invalid bounds format"

func _get_selected_tilemap() -> TileMap:
	var selected = EditorInterface.get_selection().get_selected_nodes()
	for node in selected:
		if node is TileMap:
			return node
	return null
