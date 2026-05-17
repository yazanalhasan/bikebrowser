extends Node
class_name AchievementManager

signal badge_unlocked(badge_id: String, badge: Dictionary)
signal badge_progress_changed(badge_id: String, current: int, target: int)

@export var badge_database_path: String = "res://AchievementSystem/badges.json"
@export var notification_scene: PackedScene

var badges: Dictionary = {}
var unlocked: Dictionary = {}
var progress: Dictionary = {}

func _ready() -> void:
	load_badges()

func load_badges() -> void:
	if not FileAccess.file_exists(badge_database_path):
		push_warning("Badge database not found: %s" % badge_database_path)
		return
	var file := FileAccess.open(badge_database_path, FileAccess.READ)
	if file == null:
		return
	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) == TYPE_DICTIONARY:
		badges = parsed

func unlock(badge_id: String) -> bool:
	if is_unlocked(badge_id) or not badges.has(badge_id):
		return false
	unlocked[badge_id] = Time.get_datetime_string_from_system(true)
	var badge: Dictionary = badges[badge_id]
	badge_unlocked.emit(badge_id, badge)
	_show_notification(badge_id, badge)
	return true

func is_unlocked(badge_id: String) -> bool:
	return unlocked.has(badge_id)

func get_progress(badge_id: String) -> Dictionary:
	var badge: Dictionary = badges.get(badge_id, {})
	var target := int(badge.get("target", 1))
	var current := int(progress.get(badge_id, 0))
	return {
		"current": current,
		"target": target,
		"percent": clampf(float(current) / maxf(float(target), 1.0), 0.0, 1.0),
		"unlocked": is_unlocked(badge_id)
	}

func add_progress(badge_id: String, amount: int = 1) -> void:
	if not badges.has(badge_id) or is_unlocked(badge_id):
		return
	var badge: Dictionary = badges[badge_id]
	var target := int(badge.get("target", 1))
	var current := int(progress.get(badge_id, 0)) + amount
	progress[badge_id] = current
	badge_progress_changed.emit(badge_id, current, target)
	if bool(badge.get("progressive", false)) and current >= target:
		unlock(badge_id)

func get_all_badges() -> Dictionary:
	return badges.duplicate(true)

func get_save_data() -> Dictionary:
	return {
		"unlocked": unlocked,
		"progress": progress
	}

func apply_save_data(data: Dictionary) -> void:
	unlocked = data.get("unlocked", {}).duplicate(true)
	progress = data.get("progress", {}).duplicate(true)

func _show_notification(badge_id: String, badge: Dictionary) -> void:
	if notification_scene == null:
		return
	var notification := notification_scene.instantiate()
	get_tree().root.add_child(notification)
	if notification.has_method("show_badge"):
		notification.show_badge(badge_id, badge)

