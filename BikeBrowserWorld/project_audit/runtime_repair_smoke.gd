extends SceneTree

func _initialize() -> void:
	await process_frame
	var failures: Array = []
	var quest_registry := root.get_node_or_null("/root/QuestRegistry")
	var dialogue_manager := root.get_node_or_null("/root/DialogueManager")
	var audio_service := root.get_node_or_null("/root/AudioService")
	if quest_registry == null:
		failures.append("QuestRegistry autoload missing")
	elif quest_registry.has_method("get_validation_report"):
		var quest_report: Dictionary = quest_registry.get_validation_report()
		if int(quest_report.get("quest_count", 0)) != 18:
			failures.append("Expected 18 quests, got %s" % quest_report.get("quest_count", 0))
		if not quest_registry.start_quest("chain_repair"):
			failures.append("chain_repair did not start")
		if not quest_registry.start_quest("flat_tire_repair"):
			failures.append("flat_tire_repair did not start")
	if dialogue_manager == null:
		failures.append("DialogueManager autoload missing")
	elif dialogue_manager.has_method("load_dialogue"):
		for dialogue_id in ["mr_chen_chain", "mrs_ramirez_intro", "mr_chen_expanded", "old_miner_intro", "ranger_nita_intro", "dr_maya_intro"]:
			var dialogue: Dictionary = dialogue_manager.load_dialogue(dialogue_id)
			if dialogue.is_empty():
				failures.append("Dialogue failed to load: %s" % dialogue_id)
			elif not dialogue.has("dialogue_tree") or not dialogue.has("lines"):
				failures.append("Dialogue did not normalize: %s" % dialogue_id)
	if audio_service == null:
		failures.append("AudioService autoload missing")
	elif audio_service.has_method("validate_audio_mappings"):
		var regions := ["boot", "neighborhood_street", "garage", "copper_mine", "desert_trail", "salt_river", "system_showcase"]
		var audio_errors: Array = audio_service.validate_audio_mappings(regions)
		for error in audio_errors:
			failures.append(error)
	if failures.is_empty():
		print("runtime_repair_smoke: PASS")
		quit(0)
	else:
		for failure in failures:
			push_error("runtime_repair_smoke: %s" % failure)
		quit(1)
