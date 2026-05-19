extends Node

var enabled := false

func _ready() -> void:
	enabled = bool(ProjectSettings.get_setting("application/config/dev_mode", false))
	if OS.has_feature("web"):
		var query_enabled := _web_query_flag("devEditor")
		if query_enabled:
			enabled = true

func _web_query_flag(name: String) -> bool:
	if not OS.has_feature("web"):
		return false
	var script := "(new URLSearchParams(window.location.search)).get('%s') === '1'" % name
	var result = JavaScriptBridge.eval(script, true)
	return bool(result)

