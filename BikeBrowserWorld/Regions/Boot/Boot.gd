extends Control

@onready var start_button: Button = $Center/Panel/VBox/StartButton
@onready var continue_button: Button = $Center/Panel/VBox/ContinueButton
@onready var audio_hint: Label = $Center/Panel/VBox/AudioUnlockHint

func _ready() -> void:
	start_button.pressed.connect(_start_new_game)
	continue_button.pressed.connect(_continue_game)
	EventBus.log_debug("Boot screen ready")

func _unhandled_input(event: InputEvent) -> void:
	if event.is_pressed() and not event.is_echo():
		_start_new_game()

func _start_new_game() -> void:
	_unlock_audio_from_gesture()
	RegionRegistry.current_spawn_id = "default"
	RegionRegistry.change_region("neighborhood_street", "default")

func _continue_game() -> void:
	_unlock_audio_from_gesture()
	var save := SaveService.load_saved_payload()
	var world: Dictionary = save.get("world", {})
	var region_id := String(world.get("currentRegion", "neighborhood_street"))
	var spawn_id := String(world.get("currentSpawn", "default"))
	RegionRegistry.change_region(region_id, spawn_id)

func _unlock_audio_from_gesture() -> void:
	if AudioService.unlock_audio():
		audio_hint.text = "Audio awake. Welcome back to the garage."
	else:
		audio_hint.text = "Audio needs one more tap."
