extends SceneTree

var failures: Array[String] = []

const SURFACED_REPAIR_ASSETS := [
	"res://Assets/Props/Bike/small_safety_check_bike.png",
	"res://Assets/Props/Bike/small_safety_check_bike_brakes_worn.png",
	"res://Assets/Props/Bike/small_safety_check_bike_tires_flat.png",
	"res://Assets/Props/Bike/small_safety_check_bike_chain_slipped.png",
	"res://Assets/Props/Bike/garage_repair_stand_bmx_slipped_chain.png",
	"res://Assets/Props/Bike/garage_repair_stand_bmx_aligning_chain.png",
	"res://Assets/Props/Bike/garage_repair_stand_bmx_seated_chain.png",
	"res://Assets/Props/Repair/bike_wheel.png",
	"res://Assets/Props/Repair/inner_tube.png",
	"res://Assets/Props/Repair/floor_air_pump.png",
	"res://Assets/Props/Repair/tire_patch_kit.png",
	"res://Assets/Props/Repair/loose_bike_chain.png",
	"res://Assets/Props/BikeRepair/single_tube_patch.png",
	"res://Assets/Props/BikeRepair/prepared_patch_zone.png",
	"res://Assets/Props/BikeRepair/air_escape_trace.png",
	"res://Assets/Props/BikeRepair/tire_lever_set.png",
	"res://Assets/Props/BikeRepair/chain_breaker_tool.png",
	"res://Assets/Props/BikeRepair/master_link.png",
	"res://Assets/Props/BikeRepair/sandpaper_piece.png",
]

const FORBIDDEN_RUNTIME_SUFFIXES := [
	"_backup.png",
	"_pass1_backup.png",
	"_raw.png",
]

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	for asset_path in SURFACED_REPAIR_ASSETS:
		_assert(FileAccess.file_exists(asset_path), "runtime asset exists: %s" % asset_path)
		_assert(_has_valid_runtime_name(asset_path), "runtime asset is not backup/raw: %s" % asset_path)
		_assert(_has_aseprite_source(asset_path), "Aseprite source exists beside runtime asset: %s" % asset_path)
		_assert(_texture_is_nontrivial(asset_path), "runtime asset has non-trivial texture size: %s" % asset_path)
	_finish()

func _has_valid_runtime_name(asset_path: String) -> bool:
	for suffix in FORBIDDEN_RUNTIME_SUFFIXES:
		if asset_path.ends_with(suffix):
			return false
	return true

func _has_aseprite_source(asset_path: String) -> bool:
	return FileAccess.file_exists(asset_path.trim_suffix(".png") + ".aseprite")

func _texture_is_nontrivial(asset_path: String) -> bool:
	var texture := load(asset_path)
	if not texture is Texture2D:
		return false
	var size: Vector2 = texture.get_size()
	return size.x >= 16 and size.y >= 16

func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)

func _finish() -> void:
	if failures.is_empty():
		print("Art asset contract check passed")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)
