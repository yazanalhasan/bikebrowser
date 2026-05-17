extends Button

var slot: InventorySlot

func setup(new_slot: InventorySlot):
	slot = new_slot
	text = slot.item_id + "\n" + str(slot.amount)
	tooltip_text = slot.item_id

func _pressed():
	print("Selected: " + slot.item_id)
