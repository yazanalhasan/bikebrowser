extends GridContainer
class_name InventoryGrid

signal inventory_changed(items: Array)
signal item_selected(item: Dictionary, slot_index: int)

@export_range(1, 12, 1) var columns_count := 4:
	set(v):
		columns_count = v
		columns = v
@export_range(1, 144, 1) var slot_count := 16:
	set(v):
		slot_count = v
		_resize_items()
@export var slot_scene: PackedScene = preload("res://addons/ReusableUI/scenes/InventorySlot.tscn")

var items: Array[Dictionary] = []

func _ready() -> void:
	columns = columns_count
	_resize_items()
	_rebuild_slots()

func set_grid_size(width: int, height: int) -> void:
	columns_count = width
	slot_count = width * height

func set_items(new_items: Array[Dictionary]) -> void:
	items = new_items.duplicate(true)
	_resize_items()
	_rebuild_slots()

func get_item(slot_index: int) -> Dictionary:
	return items[slot_index] if slot_index >= 0 and slot_index < items.size() else {}

func set_item(slot_index: int, item: Dictionary) -> void:
	if slot_index < 0 or slot_index >= items.size():
		return
	items[slot_index] = item
	_rebuild_slots()
	inventory_changed.emit(items)

func swap_slots(from_index: int, to_index: int) -> void:
	if from_index < 0 or to_index < 0 or from_index >= items.size() or to_index >= items.size():
		return
	var old := items[to_index]
	items[to_index] = items[from_index]
	items[from_index] = old
	_rebuild_slots()
	inventory_changed.emit(items)

func _resize_items() -> void:
	while items.size() < slot_count:
		items.append({})
	while items.size() > slot_count:
		items.pop_back()

func _rebuild_slots() -> void:
	if not is_node_ready():
		return
	for child in get_children():
		child.queue_free()
	for index in range(slot_count):
		var slot := slot_scene.instantiate() as ReusableInventorySlot
		if slot == null:
			push_error("InventoryGrid slot_scene must instance a ReusableInventorySlot.")
			return
		slot.slot_index = index
		slot.set_item(items[index])
		slot.item_dropped.connect(swap_slots)
		slot.gui_input.connect(func(event: InputEvent, i := index):
			if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT and not items[i].is_empty():
				item_selected.emit(items[i], i)
		)
		add_child(slot)
