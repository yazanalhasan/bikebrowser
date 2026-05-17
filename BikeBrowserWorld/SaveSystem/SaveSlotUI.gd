extends PanelContainer
class_name SaveSlotUI

signal load_requested(slot: int)
signal delete_requested(slot: int)
signal new_game_requested(slot: int)

@export var slot: int = 1

@onready var thumbnail: TextureRect = %Thumbnail
@onready var player_label: Label = %PlayerLabel
@onready var playtime_label: Label = %PlaytimeLabel
@onready var timestamp_label: Label = %TimestampLabel
@onready var load_button: Button = %LoadButton
@onready var delete_button: Button = %DeleteButton
@onready var new_game_button: Button = %NewGameButton

func _ready() -> void:
	load_button.pressed.connect(func() -> void: load_requested.emit(slot))
	delete_button.pressed.connect(func() -> void: delete_requested.emit(slot))
	new_game_button.pressed.connect(func() -> void: new_game_requested.emit(slot))

func set_save_info(info: Dictionary) -> void:
	if info.is_empty():
		player_label.text = "Empty Slot"
		playtime_label.text = "Playtime: --"
		timestamp_label.text = "Last saved: --"
		load_button.disabled = true
		delete_button.disabled = true
		new_game_button.disabled = false
		return

	var player_name := str(info.get("player_name", "Zuzu"))
	var level := int(info.get("level", 1))
	player_label.text = "%s - Level %d" % [player_name, level]
	playtime_label.text = "Playtime: %s" % _format_playtime(int(info.get("playtime_seconds", 0)))
	timestamp_label.text = "Last saved: %s" % str(info.get("timestamp", "Unknown"))
	_load_thumbnail(str(info.get("screenshot_path", "")))
	load_button.disabled = false
	delete_button.disabled = false
	new_game_button.disabled = true

func _load_thumbnail(path: String) -> void:
	if path == "" or not FileAccess.file_exists(path):
		thumbnail.texture = null
		return
	var image := Image.load_from_file(path)
	if image == null:
		thumbnail.texture = null
		return
	thumbnail.texture = ImageTexture.create_from_image(image)

func _format_playtime(seconds: int) -> String:
	var hours := int(seconds / 3600)
	var minutes := int((seconds % 3600) / 60)
	return "%02d:%02d" % [hours, minutes]
