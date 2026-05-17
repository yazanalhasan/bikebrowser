@tool
extends EditorPlugin

func _enter_tree():
	add_autoload_singleton("QuestGenerator", "res://addons/ProceduralQuest/quest_generator.gd")

func _exit_tree():
	remove_autoload_singleton("QuestGenerator")
