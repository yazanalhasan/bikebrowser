extends SceneTree

var failures: Array[String] = []

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	_check_rig_hooks()
	_check_station_hooks()
	_check_notebook_inventory_hooks()
	_check_audio_hooks()
	_finish()

func _check_rig_hooks() -> void:
	var tire_rig_text := _read_text("res://Prototypes/EmbodiedMechanics/TireRig.gd")
	var mechanical_core_text := _read_text("res://Systems/Mechanical/MechanicalSystemCore.gd")
	_assert(tire_rig_text.find("MechanicalSystemCore.gd") != -1, "TireRig uses MechanicalSystemCore")
	_assert(tire_rig_text.find("validation_tags") != -1, "TireRig declares validation tags")
	_assert(tire_rig_text.find("register_part") != -1, "TireRig registers visual/mechanical parts")
	_assert(mechanical_core_text.find("func get_validation_snapshot") != -1, "MechanicalSystemCore exposes validation snapshots")
	_assert(mechanical_core_text.find('"forces": force_channels') != -1, "MechanicalSystemCore snapshots force channels")

	var chain_rig_script: Script = load("res://Prototypes/EmbodiedMechanics/ChainRig.gd")
	_assert(chain_rig_script != null, "ChainRig script loads")
	if chain_rig_script:
		var chain_rig: Node = chain_rig_script.new()
		root.add_child(chain_rig)
		await process_frame
		_assert(chain_rig.has_method("set_pedal_pressed"), "ChainRig exposes deterministic pedal input")
		_assert(chain_rig.has_method("step_mechanic"), "ChainRig exposes deterministic mechanic stepping")
		_assert(chain_rig.get("mechanical_state") != null, "ChainRig exposes mechanical_state")
		root.remove_child(chain_rig)
		chain_rig.free()

func _check_station_hooks() -> void:
	_check_station(
		"res://Regions/Desert/DesertTrail.tscn",
		"PlantObservationStation",
		"desert_plant_observation",
		["talk_to_ranger_nita", "observe_three_plants", "journal_observations", "return_to_nita"]
	)
	_check_station(
		"res://Regions/River/SaltRiver.tscn",
		"WaterQualityStation",
		"test_water_quality",
		["talk_to_dr_maya", "collect_water_sample", "run_ph_test", "identify_macroinvertebrates", "report_results"]
	)

func _check_station(scene_path: String, station_name: String, expected_quest: String, expected_objectives: Array) -> void:
	var packed: PackedScene = load(scene_path)
	_assert(packed != null, "%s loads" % scene_path)
	if packed == null:
		return
	var scene: Node = packed.instantiate()
	root.add_child(scene)
	await process_frame
	var station: Node = scene.get_node_or_null(station_name)
	_assert(station != null, "%s exists" % station_name)
	if station:
		_assert(String(station.get("quest_id")) == expected_quest, "%s has expected quest_id" % station_name)
		var objective_ids: Array = station.get("objective_ids")
		for objective in expected_objectives:
			_assert(objective_ids.has(objective), "%s exposes objective %s" % [station_name, objective])
		_assert(station.has_method("complete_station"), "%s exposes deterministic completion hook" % station_name)
	root.remove_child(scene)
	scene.free()

func _check_notebook_inventory_hooks() -> void:
	var inventory := root.get_node_or_null("InventoryManager")
	_assert(inventory != null, "InventoryManager autoload exists")
	if inventory:
		_assert(inventory.has_method("serialize"), "InventoryManager exposes serialize hook")
		_assert(inventory.has_method("add_item"), "InventoryManager exposes add_item hook")
	var notebook := root.get_node_or_null("NotebookManager")
	if notebook == null:
		print("Notebook validation hook not present: no NotebookManager autoload is registered.")

func _check_audio_hooks() -> void:
	var audio := root.get_node_or_null("AudioService")
	var event_bus := root.get_node_or_null("EventBus")
	_assert(audio != null, "AudioService autoload exists")
	_assert(event_bus != null, "EventBus autoload exists")
	if audio:
		_assert(event_bus != null and event_bus.has_signal("audio_unlocked"), "EventBus emits audio_unlocked")
		_assert(audio.has_method("unlock_audio"), "AudioService exposes unlock_audio")
		_assert(audio.has_method("play_sfx"), "AudioService exposes cue playback")
		_assert(audio.has_method("speak"), "AudioService exposes TTS playback")
		_assert(audio.has_method("validate_audio_mappings"), "AudioService validates region audio mappings")

func _read_text(path: String) -> String:
	if not FileAccess.file_exists(path):
		return ""
	return FileAccess.get_file_as_string(path)

func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)

func _finish() -> void:
	if failures.is_empty():
		print("Act 1 validation hooks check passed")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)
