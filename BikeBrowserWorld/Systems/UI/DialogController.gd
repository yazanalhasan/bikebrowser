extends CanvasLayer

var current_dialogue: Dictionary = {}
var current_index := 0
var target_text := ""
var reveal_speed := 36.0

@onready var panel: Panel = $Panel
@onready var speaker_label: Label = $Panel/VBox/SpeakerLabel
@onready var body_label: Label = $Panel/VBox/BodyLabel
@onready var voice_button: Button = $Panel/VBox/ButtonRow/VoiceButton
@onready var continue_button: Button = $Panel/VBox/ButtonRow/ContinueButton
@onready var close_button: Button = $Panel/VBox/ButtonRow/CloseButton

func _ready() -> void:
	panel.visible = false
	EventBus.dialogue_requested.connect(_on_dialogue_requested)
	voice_button.pressed.connect(_toggle_voice)
	continue_button.pressed.connect(_advance)
	close_button.pressed.connect(_close)
	_apply_button_copy()

func _on_dialogue_requested(dialogue: Dictionary) -> void:
	current_dialogue = dialogue
	current_index = 0
	panel.visible = true
	panel.modulate.a = 0.0
	panel.scale = Vector2(0.985, 0.985)
	AudioService.play_sfx("dialogue_open", "gentle")
	var tween := create_tween()
	tween.tween_property(panel, "modulate:a", 0.96, 0.32).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	tween.parallel().tween_property(panel, "scale", Vector2.ONE, 0.32).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	_show_current_line()

func _show_current_line() -> void:
	var lines: Array = current_dialogue.get("lines", [])
	if current_index >= lines.size():
		_complete_dialogue()
		return
	var line: Dictionary = lines[current_index]
	speaker_label.text = String(line.get("speaker", current_dialogue.get("speaker", "Friend")))
	target_text = String(line.get("text", ""))
	body_label.text = target_text
	body_label.visible_characters = 0
	continue_button.text = "Begin" if current_index == lines.size() - 1 else "Next"
	AudioService.speak(target_text, speaker_label.text)

func _process(delta: float) -> void:
	if panel.visible and body_label.visible_characters < target_text.length():
		body_label.visible_characters = min(target_text.length(), body_label.visible_characters + int(ceil(reveal_speed * delta)))

func _unhandled_input(event: InputEvent) -> void:
	if panel.visible and event.is_action_pressed("ui_accept"):
		get_viewport().set_input_as_handled()
		_advance()

func _advance() -> void:
	AudioService.cancel_speech()
	AudioService.play_sfx("dialogue_next", "gentle")
	current_index += 1
	_show_current_line()

func _complete_dialogue() -> void:
	await get_tree().create_timer(0.14).timeout
	_hide_panel()
	var on_complete: Dictionary = current_dialogue.get("onComplete", {})
	if on_complete.get("type", "") == "start_quest":
		var quest_id := String(on_complete.get("questId", ""))
		QuestRegistry.start_quest(quest_id)
		if quest_id == "chain_repair":
			QuestRegistry.record_objective(quest_id, "talk_to_mr_chen")
		elif quest_id == "bike_safety_check":
			QuestRegistry.record_objective(quest_id, "talk_to_mrs_ramirez")

func _close() -> void:
	AudioService.cancel_speech()
	_hide_panel()

func _toggle_voice() -> void:
	AudioService.set_voice_enabled(not AudioService.voice_enabled)
	voice_button.text = "Voice On" if AudioService.voice_enabled else "Voice Off"
	if AudioService.voice_enabled and panel.visible:
		AudioService.speak(target_text, speaker_label.text)

func _hide_panel() -> void:
	if not panel.visible:
		return
	AudioService.play_sfx("dialogue_close", "gentle")
	var tween := create_tween()
	tween.tween_property(panel, "modulate:a", 0.0, 0.28).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	tween.tween_callback(func() -> void: panel.visible = false)

func _apply_button_copy() -> void:
	voice_button.text = "Voice On"
	continue_button.text = "Next"
	close_button.text = "Rest"
