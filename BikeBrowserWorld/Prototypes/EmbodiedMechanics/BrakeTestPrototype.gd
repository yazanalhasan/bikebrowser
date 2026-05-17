extends Node2D

@onready var rig: Node = $BrakeRig
@onready var hint: Label = $InstructionHint
@onready var backdrop: ColorRect = $Backdrop

func _ready() -> void:
	_frame_prototype()
	get_viewport().size_changed.connect(_frame_prototype)
	if hint:
		hint.text = "Hold E or Enter"
	if rig and rig.has_signal("brake_soft_feedback"):
		rig.brake_soft_feedback.connect(_on_brake_soft_feedback)
	if rig and rig.has_signal("brake_verified_changed"):
		rig.brake_verified_changed.connect(_on_brake_verified_changed)

func _on_brake_soft_feedback(kind: String) -> void:
	if hint == null:
		return
	if kind == "soft_lever_click":
		hint.text = "Lever moving"
	elif kind == "subtle_cable_tension":
		hint.text = "Cable taut"
	elif kind == "soft_wheel_stop":
		hint.text = "Wheel stopped"
	elif kind == "gentle_wheel_stop":
		hint.text = "Brake works"

func _on_brake_verified_changed(_verified: bool) -> void:
	if hint:
		hint.text = "Brake works"

func _frame_prototype() -> void:
	var viewport_size := get_viewport_rect().size
	if backdrop:
		backdrop.position = Vector2.ZERO
		backdrop.size = viewport_size
	if rig is Node2D:
		rig.position = viewport_size * 0.5 + Vector2(0.0, 28.0)
	if hint:
		hint.position = Vector2(viewport_size.x * 0.5 - 66.0, 34.0)
