extends Area2D

@export var npc_id := "mr_chen"
@export var dialogue_id := "mr_chen_chain"
@export var feedback_message := "The character turns toward Zuzu, ready to talk."
@export var feedback_tone := "warm"
# Interaction radius for the talk/presence circle. Default 32 keeps an NPC from
# greedily intercepting ui_accept meant for adjacent doors or stations. Override
# per-NPC by setting this on the scene instance, or via the layout JSON
# `interaction_radius` key. See project_audit/interaction_topology_fix.md.
@export var interaction_radius: float = 32.0
# Set true on an NPC that is intentionally overlapping a ui_accept consumer
# (door, station). The interaction-overlap regression test treats this as opt-in.
@export var allow_overlap: bool = false

@onready var sprite = $AnimatedSprite2D
@onready var interaction_area = $InteractionArea

var current_direction = "down"
var is_talking = false
var player_in_range := false
var player_ref: Node2D = null
var interaction_locked := false
var idle_time := 0.0
var sprite_base_position := Vector2.ZERO
var sprite_base_rotation := 0.0
var last_presence_msec := -30000

func _ready():
	interaction_area.body_entered.connect(_on_interaction_body_entered)
	interaction_area.body_exited.connect(_on_interaction_body_exited)
	_apply_interaction_radius()
	if sprite:
		sprite_base_position = sprite.position
		sprite_base_rotation = sprite.rotation
	play_idle()

func set_interaction_radius(r: float) -> void:
	interaction_radius = r
	_apply_interaction_radius()

func _apply_interaction_radius() -> void:
	if interaction_area == null:
		return
	var collision: CollisionShape2D = interaction_area.get_node_or_null("CollisionShape2D")
	if collision == null:
		return
	var fresh := CircleShape2D.new()
	fresh.radius = interaction_radius
	collision.shape = fresh

func _process(delta: float) -> void:
	idle_time += delta
	if player_ref:
		face_player(player_ref.global_position)
	elif not is_talking:
		_apply_idle_personality()

func _unhandled_input(event: InputEvent) -> void:
	if player_in_range and event.is_action_pressed("ui_accept"):
		trigger_dialogue()

func play_idle():
	if not is_talking:
		_play_animation(npc_id + "_idle_" + current_direction)

func play_talk():
	is_talking = true
	_play_animation(npc_id + "_talk_" + current_direction)

func stop_talk():
	is_talking = false
	play_idle()
	_apply_idle_personality()

func face_player(player_position):
	var direction = (player_position - global_position).normalized()
	if abs(direction.x) > abs(direction.y):
		current_direction = "right" if direction.x > 0 else "left"
	else:
		current_direction = "down" if direction.y > 0 else "up"
	if is_talking:
		_play_animation(npc_id + "_talk_" + current_direction)
	else:
		play_idle()

func trigger_dialogue() -> void:
	if interaction_locked:
		return
	interaction_locked = true
	play_talk()
	await get_tree().create_timer(0.08).timeout
	if not player_in_range:
		interaction_locked = false
		return
	var dialogue_manager := get_node_or_null("/root/DialogueManager")
	if dialogue_manager != null and dialogue_manager.has_method("start_dialogue"):
		dialogue_manager.start_dialogue(_current_dialogue_id(), npc_id)
	var event_bus := get_node_or_null("/root/EventBus")
	if event_bus != null:
		event_bus.interaction_feedback.emit(_current_feedback_message(), feedback_tone)
	await get_tree().create_timer(0.18).timeout
	interaction_locked = false

func _on_interaction_body_entered(body: Node) -> void:
	if body.is_in_group("player"):
		player_in_range = true
		player_ref = body as Node2D
		if player_ref:
			face_player(player_ref.global_position)
		play_talk()
		_emit_presence_line()

func _on_interaction_body_exited(body: Node) -> void:
	if body == player_ref:
		player_in_range = false
		player_ref = null
		stop_talk()

func _play_animation(animation_name: String) -> void:
	if sprite.sprite_frames and sprite.sprite_frames.has_animation(animation_name):
		sprite.play(animation_name)

func _apply_idle_personality() -> void:
	if sprite == null:
		return
	sprite.position = sprite_base_position
	sprite.rotation = sprite_base_rotation
	match npc_id:
		"mr_chen":
			sprite.rotation = sprite_base_rotation + sin(idle_time * 0.65) * 0.012
		"mrs_ramirez":
			sprite.position.x = sprite_base_position.x + sin(idle_time * 0.55) * 0.45
		"old_miner":
			sprite.rotation = sprite_base_rotation + sin(idle_time * 0.48) * 0.01
		"desert_guide":
			sprite.position.y = sprite_base_position.y + sin(idle_time * 0.38) * 0.55
		"river_biologist":
			sprite.position.y = sprite_base_position.y + sin(idle_time * 0.5) * 0.35
		_:
			sprite.position.y = sprite_base_position.y + sin(idle_time * 0.45) * 0.3

func _current_dialogue_id() -> String:
	match npc_id:
		"mrs_ramirez":
			if _quest_completed("chain_repair"):
				return "mrs_ramirez_after_chain"
			if _quest_completed("bike_safety_check"):
				return "mrs_ramirez_after_safety"
		"mr_chen":
			if _quest_completed("chain_repair"):
				return "mr_chen_after_chain"
			if _quest_completed("bike_safety_check"):
				return "mr_chen_after_safety"
	return dialogue_id

func _current_feedback_message() -> String:
	match npc_id:
		"mrs_ramirez":
			if _quest_completed("chain_repair"):
				return "Mrs. Ramirez glances at the bike chain and smiles like she heard the difference."
			if _quest_completed("bike_safety_check"):
				return "Mrs. Ramirez gives the tire a tiny nod, already back in her riding rhythm."
		"mr_chen":
			if _quest_completed("chain_repair"):
				return "Mr. Chen listens for the chain before he says anything."
			if _quest_completed("bike_safety_check"):
				return "Mr. Chen notices Zuzu checking the bike before rushing in."
	return feedback_message

func _emit_presence_line() -> void:
	var now := Time.get_ticks_msec()
	if now - last_presence_msec < 14000:
		return
	last_presence_msec = now
	var event_bus := get_node_or_null("/root/EventBus")
	if event_bus == null:
		return
	var line := _presence_line()
	if not line.is_empty():
		event_bus.interaction_feedback.emit(line, "quiet")

func _presence_line() -> String:
	match npc_id:
		"mrs_ramirez":
			if _quest_completed("chain_repair"):
				return "Mrs. Ramirez murmurs, \"That chain sounds happier.\""
			if _quest_completed("bike_safety_check"):
				return "Mrs. Ramirez checks the breeze, then the curb, like she always does."
			return "Mrs. Ramirez flexes her fingers in her gloves. \"Cool evening for a ride.\""
		"mr_chen":
			if _quest_completed("chain_repair"):
				return "Mr. Chen rests a hand near the bike, just listening."
			if _quest_completed("bike_safety_check"):
				return "Mr. Chen says softly, \"Careful eyes. Good start.\""
			return "Mr. Chen studies the garage light for a moment."
		"old_miner":
			return "Old Miner Pete taps dust from one boot and watches the street settle."
		"desert_guide":
			return "Ranger Nita watches the wind move dust along the trail."
		"river_biologist":
			return "Dr. Maya pauses her notes to listen toward the water."
	return ""

func _quest_completed(quest_id: String) -> bool:
	var quest_registry := get_node_or_null("/root/QuestRegistry")
	return quest_registry != null and quest_registry.completed_quests.has(quest_id)
