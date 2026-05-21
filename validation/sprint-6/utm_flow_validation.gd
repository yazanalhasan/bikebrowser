extends SceneTree

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	var packed := load("res://Regions/Garage/UniversalTestingMachine.tscn")
	if packed == null:
		printerr("UTM scene failed to load")
		quit(1)
		return
	var utm: Node = packed.instantiate()
	root.add_child(utm)
	var quest_registry: Node = root.get_node("/root/QuestRegistry")
	if not quest_registry.start_quest("bridge_quest_3"):
		printerr("bridge_quest_3 failed to start")
		quit(1)
		return
	quest_registry.record_objective("bridge_quest_3", "go_to_testing_rig")
	for sample_id in ["wood", "steel", "composite"]:
		utm.call("_load_sample", sample_id)
		var guard := 0
		while not utm.get("completed_samples").has(sample_id) and guard < 20:
			utm.call("_apply_load")
			guard += 1
		if not utm.get("completed_samples").has(sample_id):
			printerr("sample did not complete: %s" % sample_id)
			quit(1)
			return
	utm.call("_choose_material", "composite")
	if quest_registry.is_objective_complete("bridge_quest_3", "choose_best_material"):
		printerr("composite should not complete choose_best_material")
		quit(1)
		return
	utm.call("_choose_material", "steel")
	var required := ["go_to_testing_rig", "test_wood", "test_metal", "test_composite", "choose_best_material"]
	for objective_id in required:
		if not quest_registry.is_objective_complete("bridge_quest_3", objective_id):
			printerr("missing objective: %s" % objective_id)
			quit(1)
			return
	print("UTM flow validation passed")
	quit(0)
