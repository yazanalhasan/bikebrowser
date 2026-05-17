@tool
extends EditorPlugin

func _enter_tree():
	add_autoload_singleton("CraftingManager", "res://addons/InventorySystem/crafting.gd")

func _exit_tree():
	remove_autoload_singleton("CraftingManager")
