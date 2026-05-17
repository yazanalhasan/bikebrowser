extends Control

@onready var grid = $GridContainer
var inventory: Inventory
var slot_scene: PackedScene = preload("res://addons/InventorySystem/InventorySlotUI.tscn")

func set_inventory(new_inventory: Inventory):
	inventory = new_inventory
	inventory.inventory_changed.connect(refresh)
	refresh()

func refresh():
	for child in grid.get_children():
		child.queue_free()
	if inventory == null:
		return
	for slot in inventory.slots:
		var slot_ui = slot_scene.instantiate()
		slot_ui.setup(slot)
		grid.add_child(slot_ui)

func _ready():
	if inventory:
		refresh()
