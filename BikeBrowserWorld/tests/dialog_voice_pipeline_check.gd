extends SceneTree

var failures: Array[String] = []

var scenes := [
	"res://Regions/Neighborhood/NeighborhoodStreet.tscn",
	"res://Regions/Garage/ZuzuGarage.tscn",
	"res://Regions/Desert/DesertTrail.tscn",
	"res://Regions/River/SaltRiver.tscn",
	"res://Regions/Mine/CopperMine.tscn",
]

var speakers := [
	"Mrs. Ramirez",
	"Mr. Chen",
	"Ranger Nita",
	"Dr. Maya",
	"Old Miner Pete",
]

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	var audio_service: Node = root.get_node_or_null("AudioService")
	_assert(audio_service != null, "AudioService autoload exists")
	for speaker in speakers:
		var profile: Dictionary = audio_service.call("resolve_voice_profile", speaker) if audio_service else {}
		_assert(not profile.is_empty(), "%s has a voice profile" % speaker)

	for scene_path in scenes:
		var packed: PackedScene = load(scene_path)
		_assert(packed != null, "%s loads" % scene_path)
		if packed == null:
			continue
		var scene := packed.instantiate()
		root.add_child(scene)
		current_scene = scene
		await process_frame
		var dialog := scene.get_node_or_null("DialogBox")
		var hud := scene.get_node_or_null("Hud")
		_assert(dialog != null, "%s has DialogBox after RegionScene setup" % scene_path)
		_assert(hud != null, "%s has Hud after RegionScene setup" % scene_path)
		if dialog is CanvasLayer and hud is CanvasLayer:
			_assert(dialog.layer > hud.layer, "%s dialog renders above HUD" % scene_path)
		scene.queue_free()
		await process_frame

	_finish()

func _finish() -> void:
	if failures.is_empty():
		print("Dialog voice pipeline check passed")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)

func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)
