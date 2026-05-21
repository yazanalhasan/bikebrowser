extends Node
class_name BikeBrowserDevConsole

static func start_bridge_quest_3() -> Array[String]:
	if OS.get_environment("BIKEBROWSER_DEV_EDITOR") != "1":
		push_warning("start_bridge_quest_3 is only available when BIKEBROWSER_DEV_EDITOR=1.")
		return []
	var registry := Engine.get_main_loop().root.get_node_or_null("/root/QuestRegistry")
	if registry == null:
		push_warning("QuestRegistry autoload is not available.")
		return []
	if not registry.is_active("bridge_quest_3") and not registry.completed_quests.has("bridge_quest_3"):
		registry.start_quest("bridge_quest_3")
	var quest: Dictionary = registry.get_quest("bridge_quest_3")
	var active: Dictionary = registry.active_quests.get("bridge_quest_3", {})
	var completed: Array = active.get("completedObjectives", [])
	var open: Array[String] = []
	for step in quest.get("steps", []):
		var objective_id := String(step.get("id", ""))
		if not completed.has(objective_id):
			open.append(objective_id)
	print("bridge_quest_3 active objectives: %s" % [open])
	return open
