extends SceneTree

var failures: Array[String] = []
var reward_payload: Dictionary = {}
var locked_event: Dictionary = {}

const REQUIRED_ACT1_QUESTS := [
	"act1_pre_ride_check",
	"chain_repair",
	"bridge_quest_5",
	"desert_plant_observation",
	"test_water_quality",
	"copper_rock_id",
	"workshop_first_build",
]

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	var quest_registry: Node = root.get_node_or_null("QuestRegistry")
	var event_bus: Node = root.get_node_or_null("EventBus")
	_assert(quest_registry != null, "QuestRegistry autoload exists")
	_assert(event_bus != null, "EventBus autoload exists")
	if quest_registry == null or event_bus == null:
		_finish()
		return

	quest_registry.active_quests.clear()
	quest_registry.completed_quests.clear()
	event_bus.reward_intent.connect(func(payload: Dictionary) -> void:
		reward_payload = payload
	)
	event_bus.game_event.connect(func(event: Dictionary) -> void:
		if event.get("type", "") == "quest_locked":
			locked_event = event
	)

	_assert(quest_registry.has_quest("act1_regional_readiness"), "Act 1 capstone quest is registered")
	_assert(not quest_registry.can_start_quest("act1_regional_readiness"), "Act 1 capstone starts locked")
	_assert(not quest_registry.start_quest("act1_regional_readiness"), "locked capstone cannot start early")
	_assert(not locked_event.is_empty(), "locked capstone emits a quest_locked event")
	_assert(locked_event.get("missing", []).has("quest:act1_pre_ride_check"), "locked event names missing prerequisites")

	for quest_id in REQUIRED_ACT1_QUESTS:
		_complete_all_objectives(quest_registry, quest_id)

	_assert(quest_registry.can_start_quest("act1_regional_readiness"), "Act 1 capstone unlocks after required quests")
	_assert(quest_registry.start_quest("act1_regional_readiness"), "Act 1 capstone starts after prerequisites")
	_complete_all_objectives(quest_registry, "act1_regional_readiness")

	_assert(quest_registry.completed_quests.has("act1_regional_readiness"), "Act 1 capstone completes")
	_assert(reward_payload.get("questId", "") == "act1_regional_readiness", "capstone emits reward payload")
	_assert(reward_payload.get("badge", "") == "Systems Thinker", "capstone reward names Systems Thinker badge")
	var reward_items: Array = reward_payload.get("items", [])
	_assert(reward_items.has("regional_travel_sketchbook"), "capstone grants regional travel sketchbook")
	_assert(reward_items.has("spacecraft_clue_card"), "capstone grants spacecraft clue card")

	_finish()

func _complete_all_objectives(quest_registry: Node, quest_id: String) -> void:
	if not quest_registry.completed_quests.has(quest_id):
		quest_registry.start_quest(quest_id)
	var quest: Dictionary = quest_registry.get_quest(quest_id)
	for step in quest.get("steps", []):
		var step_id := String(step.get("id", ""))
		if not step_id.is_empty():
			quest_registry.record_objective(quest_id, step_id)

func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)

func _finish() -> void:
	if failures.is_empty():
		print("Act 1 regional readiness check passed")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)
