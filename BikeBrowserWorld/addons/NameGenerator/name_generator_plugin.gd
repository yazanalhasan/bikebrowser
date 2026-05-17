@tool
extends EditorPlugin

func _enter_tree():
	add_autoload_singleton("NameGenerator", "res://addons/NameGenerator/name_generator.gd")

func _exit_tree():
	remove_autoload_singleton("NameGenerator")
