extends SceneTree

const OUTPUT_DIR := "C:/dev/bikebrowser/reports/region_audit/screenshots"

func _init() -> void:
	call_deferred("_run")


func _run() -> void:
	DirAccess.make_dir_recursive_absolute(OUTPUT_DIR)
	var regions_text := FileAccess.get_file_as_string("res://Data/regions/regions.json")
	var regions = JSON.parse_string(regions_text)
	if typeof(regions) != TYPE_DICTIONARY:
		printerr("regions.json did not parse as a dictionary")
		quit(1)
		return
	for region_id in regions.keys():
		var region: Dictionary = regions[region_id]
		var scene_path := String(region.get("scenePath", ""))
		if scene_path.is_empty() or not ResourceLoader.exists(scene_path):
			printerr("missing scene for %s: %s" % [region_id, scene_path])
			continue
		var packed: PackedScene = load(scene_path)
		var instance: Node = packed.instantiate()
		root.add_child(instance)
		await process_frame
		await process_frame
		var image := root.get_texture().get_image()
		var output_path := "%s/%s.png" % [OUTPUT_DIR, region_id]
		var err := image.save_png(output_path)
		if err != OK:
			printerr("failed screenshot %s err=%s" % [region_id, err])
		else:
			print("saved %s" % output_path)
		root.remove_child(instance)
		instance.queue_free()
		await process_frame
	quit(0)
