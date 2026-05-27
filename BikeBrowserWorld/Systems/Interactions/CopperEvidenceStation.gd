extends "res://Systems/Interactions/QuestObjectiveStation.gd"

var plausible_sample_identified := false
var conductivity_verified := false
var reported_to_pete := false
var test_light: Polygon2D
var evidence_label: Label

func _ready() -> void:
	super._ready()
	_add_probe_visuals()
	_refresh_probe_visuals()

func complete_station(_actor: Node = null) -> bool:
	if interaction_locked or _world_input_blocked() or quest_id.strip_edges().is_empty():
		return false
	interaction_locked = true
	_request_camera_focus()
	if QuestRegistry.completed_quests.has(quest_id):
		_emit_quiet_feedback()
		interaction_locked = false
		return true
	if not QuestRegistry.is_active(quest_id) and not QuestRegistry.start_quest(quest_id):
		EventBus.interaction_feedback.emit(_locked_feedback_text(), "quiet")
		interaction_locked = false
		return false
	var objective_id := _next_objective_id()
	match objective_id:
		"find_copper_rock":
			plausible_sample_identified = true
			_record_copper_objective(objective_id, "Blue-green staining marks this as the plausible copper-bearing rock.", "curious")
		"test_conductivity":
			if not plausible_sample_identified and not _objective_completed("find_copper_rock"):
				EventBus.interaction_feedback.emit("Pick the blue-green copper sample before using the probe.", "quiet")
				interaction_locked = false
				return false
			conductivity_verified = true
			_record_copper_objective(objective_id, "The probe light turns on: this sample conducts like useful copper ore.", "warm")
		"report_to_pete":
			if not conductivity_verified and not _objective_completed("test_conductivity"):
				EventBus.interaction_feedback.emit("Pete needs the probe result, not just a guess.", "quiet")
				interaction_locked = false
				return false
			reported_to_pete = true
			_record_copper_objective(objective_id, completion_message, "warm")
		_:
			interaction_locked = false
			return super.complete_station(_actor)
	_refresh_probe_visuals()
	interaction_locked = false
	return QuestRegistry.completed_quests.has(quest_id)

func _record_copper_objective(objective_id: String, feedback: String, tone: String) -> void:
	QuestRegistry.record_objective(quest_id, objective_id)
	DiscoveryService.mark_discovered("copper_evidence_%s" % objective_id, {
		"questId": quest_id,
		"objectiveId": objective_id,
		"sample": "blue_green_copper_ore",
		"conductive": conductivity_verified,
	})
	AudioService.play_sfx("reward_tiny" if conductivity_verified else "soft_click", tone)
	EventBus.interaction_feedback.emit(feedback, tone)
	EventBus.notebook_updated.emit(QuestRegistry.get_notebook_snapshot())
	_refresh_station_state()

func _add_probe_visuals() -> void:
	if test_light == null:
		test_light = Polygon2D.new()
		test_light.name = "ConductivityTestLight"
		test_light.polygon = PackedVector2Array([
			Vector2(-10, -10),
			Vector2(10, -10),
			Vector2(14, 0),
			Vector2(10, 10),
			Vector2(-10, 10),
			Vector2(-14, 0),
		])
		test_light.position = Vector2(44, -46)
		test_light.z_index = 4
		add_child(test_light)
	if evidence_label == null:
		evidence_label = Label.new()
		evidence_label.name = "ConductivityEvidenceLabel"
		evidence_label.position = Vector2(-72, 34)
		evidence_label.add_theme_font_size_override("font_size", 11)
		evidence_label.add_theme_color_override("font_color", Color(1.0, 0.94, 0.78, 1.0))
		evidence_label.add_theme_color_override("font_shadow_color", Color(0.03, 0.04, 0.05, 0.72))
		evidence_label.add_theme_constant_override("shadow_offset_x", 1)
		evidence_label.add_theme_constant_override("shadow_offset_y", 1)
		add_child(evidence_label)

func _refresh_probe_visuals() -> void:
	if test_light:
		test_light.color = Color(0.45, 1.0, 0.42, 0.95) if conductivity_verified else Color(0.16, 0.20, 0.18, 0.78)
	if evidence_label:
		if conductivity_verified:
			evidence_label.text = "probe lit: conductive"
		elif plausible_sample_identified:
			evidence_label.text = "sample selected: test next"
		else:
			evidence_label.text = "find stained copper ore"
