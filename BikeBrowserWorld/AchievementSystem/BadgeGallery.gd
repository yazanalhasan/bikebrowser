extends Control
class_name BadgeGallery

@export var achievement_manager_path: NodePath
@export var columns: int = 4

@onready var grid: GridContainer = %BadgeGrid
@onready var detail_label: RichTextLabel = %DetailLabel

func _ready() -> void:
	grid.columns = columns
	refresh()

func refresh() -> void:
	var manager := _manager()
	if manager == null:
		return
	for child in grid.get_children():
		child.queue_free()
	for badge_id in manager.get_all_badges().keys():
		var badge: Dictionary = manager.get_all_badges()[badge_id]
		grid.add_child(_make_badge_button(badge_id, badge, manager))

func _make_badge_button(badge_id: String, badge: Dictionary, manager: Node) -> Button:
	var button := Button.new()
	button.custom_minimum_size = Vector2(160, 104)
	button.text = str(badge.get("name", badge_id))
	if not manager.is_unlocked(badge_id):
		var progress_info := manager.get_progress(badge_id)
		if bool(badge.get("progressive", false)):
			button.text += "\n%d / %d" % [progress_info["current"], progress_info["target"]]
		else:
			button.text = "Locked\n" + button.text
		button.modulate = Color(0.55, 0.55, 0.55, 1.0)
	button.pressed.connect(func() -> void: _show_detail(badge_id, badge, manager))
	return button

func _show_detail(badge_id: String, badge: Dictionary, manager: Node) -> void:
	var progress_info := manager.get_progress(badge_id)
	var status := "Locked"
	if manager.is_unlocked(badge_id):
		status = "Unlocked"
	detail_label.text = "[b]%s[/b]\n%s\nStatus: %s\nProgress: %d / %d" % [
		badge.get("name", badge_id),
		badge.get("description", ""),
		status,
		progress_info["current"],
		progress_info["target"]
	]

func _manager() -> Node:
	if achievement_manager_path != NodePath():
		return get_node_or_null(achievement_manager_path)
	return get_node_or_null("/root/AchievementManager")
