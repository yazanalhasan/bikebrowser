extends Node
class_name AddonDialogueGraphManager

signal dialogue_started(npc_id)
signal dialogue_ended
signal choice_selected(choice_id)

var current_dialogue: Dictionary = {}
var current_node_id: String = ""
var is_active: bool = false
var dialogue_box: Control = null

func start_dialogue(dialogue_id: String, npc_id: String = ""):
	var file_path = "res://Data/dialogue/" + dialogue_id + ".json"
	if not FileAccess.file_exists(file_path):
		push_error("Dialogue file not found: " + file_path)
		return
	var file = FileAccess.open(file_path, FileAccess.READ)
	var content = file.get_as_text()
	var parsed = JSON.parse_string(content)
	current_dialogue = parsed if typeof(parsed) == TYPE_DICTIONARY else {}
	current_node_id = "start"
	is_active = true
	dialogue_started.emit(npc_id)
	show_current_node()

func show_current_node():
	var node = current_dialogue.get("nodes", {}).get(current_node_id)
	if not node:
		end_dialogue()
		return
	if node.has("action"):
		execute_action(str(node.get("action", "")))
	if dialogue_box and dialogue_box.has_method("show_text"):
		dialogue_box.show_text(node.get("text", ""), node.get("choices", []))
		dialogue_box.set("dialogue_manager", self)
	if node.get("choices", []).is_empty() and node.get("next", "") == "end":
		end_dialogue()

func select_choice(choice_index: int):
	var node = current_dialogue.get("nodes", {}).get(current_node_id)
	if not node:
		end_dialogue()
		return
	var choices = node.get("choices", [])
	if choice_index < 0:
		var next_from_node = node.get("next", "end")
		if next_from_node == "end" or next_from_node == "":
			end_dialogue()
		else:
			current_node_id = next_from_node
			show_current_node()
		return
	if choice_index >= choices.size():
		return
	var choice = choices[choice_index]
	choice_selected.emit(choice.get("id", ""))
	var action = choice.get("action", "")
	if action:
		execute_action(action)
	var next_node = choice.get("next", "")
	if next_node == "end":
		end_dialogue()
	elif next_node:
		current_node_id = next_node
		show_current_node()

func execute_action(action: String):
	var parts = action.split(" ")
	if parts.is_empty():
		return
	var cmd = parts[0]
	var args = parts.slice(1)
	match cmd:
		"give_item":
			if args.size() >= 2 and Engine.has_singleton("InventoryManager"):
				Engine.get_singleton("InventoryManager").add_item(args[0], int(args[1]))
		"start_quest":
			if args.size() >= 1 and Engine.has_singleton("QuestRegistry"):
				Engine.get_singleton("QuestRegistry").start_quest(args[0])
		"complete_quest":
			if args.size() >= 1 and Engine.has_singleton("QuestRegistry"):
				Engine.get_singleton("QuestRegistry").complete_quest(args[0])
		"add_reputation":
			if args.size() >= 2 and Engine.has_singleton("ReputationSystem"):
				Engine.get_singleton("ReputationSystem").add_reputation(args[0], int(args[1]))

func end_dialogue():
	is_active = false
	current_dialogue = {}
	current_node_id = ""
	dialogue_ended.emit()
	if dialogue_box and dialogue_box.has_method("hide"):
		dialogue_box.hide()

func set_dialogue_box(box: Control):
	dialogue_box = box
	if dialogue_box:
		dialogue_box.set("dialogue_manager", self)
