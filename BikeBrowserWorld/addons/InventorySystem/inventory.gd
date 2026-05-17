extends Resource
class_name Inventory

signal item_added(item_id, amount)
signal item_removed(item_id, amount)
signal inventory_changed

@export var slots: Array[InventorySlot] = []
@export var max_slots: int = 20

func add_item(item_id: String, amount: int = 1) -> bool:
	for slot in slots:
		if slot.item_id == item_id and slot.stackable and slot.amount + amount <= slot.max_stack:
			slot.amount += amount
			item_added.emit(item_id, amount)
			inventory_changed.emit()
			return true
	if slots.size() < max_slots:
		var new_slot = InventorySlot.new()
		new_slot.item_id = item_id
		new_slot.amount = amount
		new_slot.stackable = _is_stackable(item_id)
		slots.append(new_slot)
		item_added.emit(item_id, amount)
		inventory_changed.emit()
		return true
	return false

func remove_item(item_id: String, amount: int = 1) -> bool:
	for i in range(slots.size()):
		if slots[i].item_id == item_id:
			if slots[i].amount < amount:
				return false
			slots[i].amount -= amount
			if slots[i].amount <= 0:
				slots.remove_at(i)
			item_removed.emit(item_id, amount)
			inventory_changed.emit()
			return true
	return false

func has_item(item_id: String, amount: int = 1) -> bool:
	for slot in slots:
		if slot.item_id == item_id and slot.amount >= amount:
			return true
	return false

func get_item_count(item_id: String) -> int:
	var total = 0
	for slot in slots:
		if slot.item_id == item_id:
			total += slot.amount
	return total

func clear():
	slots.clear()
	inventory_changed.emit()

func _is_stackable(item_id: String) -> bool:
	var non_stackable = ["tool", "weapon", "armor"]
	for cat in non_stackable:
		if item_id.contains(cat):
			return false
	return true

func serialize() -> Dictionary:
	var data = []
	for slot in slots:
		data.append({"id": slot.item_id, "amount": slot.amount})
	return {"slots": data, "max_slots": max_slots}

func deserialize(data: Dictionary):
	clear()
	max_slots = data.get("max_slots", 20)
	for slot_data in data.get("slots", []):
		var slot = InventorySlot.new()
		slot.item_id = slot_data["id"]
		slot.amount = slot_data["amount"]
		slot.stackable = _is_stackable(slot.item_id)
		slots.append(slot)
	inventory_changed.emit()
