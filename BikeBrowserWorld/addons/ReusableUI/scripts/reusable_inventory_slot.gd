extends PanelContainer
class_name ReusableInventorySlot

signal item_hovered(item: Dictionary, slot_index: int, global_position: Vector2)
signal item_unhovered()
signal item_dropped(from_index: int, to_index: int)

var slot_index := -1
var item: Dictionary = {}

@onready var _icon: TextureRect = %Icon
@onready var _count: Label = %Count

func set_item(new_item: Dictionary) -> void:
	item = new_item
	if not is_node_ready():
		return
	var texture: Texture2D = item.get("icon", null)
	_icon.texture = texture
	_count.text = str(item.get("count", "")) if int(item.get("count", 1)) > 1 else ""
	tooltip_text = "%s\n%s" % [str(item.get("name", "")), str(item.get("description", ""))]

func clear_item() -> void:
	set_item({})

func _ready() -> void:
	mouse_entered.connect(func():
		if not item.is_empty():
			item_hovered.emit(item, slot_index, get_global_mouse_position())
	)
	mouse_exited.connect(func(): item_unhovered.emit())
	set_item(item)

func _get_drag_data(_at_position: Vector2) -> Variant:
	if item.is_empty():
		return null
	var preview := TextureRect.new()
	preview.texture = _icon.texture
	preview.custom_minimum_size = Vector2(42, 42)
	set_drag_preview(preview)
	return {"from_index": slot_index, "item": item}

func _can_drop_data(_at_position: Vector2, data: Variant) -> bool:
	return typeof(data) == TYPE_DICTIONARY and data.has("from_index") and int(data.from_index) != slot_index

func _drop_data(_at_position: Vector2, data: Variant) -> void:
	item_dropped.emit(int(data.from_index), slot_index)
