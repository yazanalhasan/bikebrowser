extends Control
class_name BadgeNotification

@export var display_seconds: float = 3.0
@export var slide_distance: float = 360.0

@onready var icon_rect: TextureRect = %BadgeIcon
@onready var title_label: Label = %TitleLabel
@onready var name_label: Label = %NameLabel

func _ready() -> void:
	visible = false

func show_badge(_badge_id: String, badge: Dictionary) -> void:
	title_label.text = "Badge Earned!"
	name_label.text = str(badge.get("name", "New Badge"))
	visible = true
	modulate.a = 0.0
	position.x += slide_distance

	var tween := create_tween()
	tween.tween_property(self, "position:x", position.x - slide_distance, 0.35).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tween.parallel().tween_property(self, "modulate:a", 1.0, 0.2)
	tween.tween_interval(display_seconds)
	tween.tween_property(self, "position:x", position.x + slide_distance, 0.25).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN)
	tween.parallel().tween_property(self, "modulate:a", 0.0, 0.2)
	tween.finished.connect(queue_free)

