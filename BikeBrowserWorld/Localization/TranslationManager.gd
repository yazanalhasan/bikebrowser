extends Node
class_name TranslationManager

signal language_changed(lang_code: String)

@export var default_language: String = "en"
@export var language_dir: String = "res://Localization/languages"

var current_language: String = "en"
var _translations: Dictionary = {}
var _fallback: Dictionary = {}
var _language_meta: Dictionary = {
	"en": { "name": "English", "rtl": false, "tts_voice": "en-US" },
	"es": { "name": "Spanish", "rtl": false, "tts_voice": "es-US" },
	"ar": { "name": "Arabic", "rtl": true, "tts_voice": "ar-SA" },
	"qu": { "name": "Quechua", "rtl": false, "tts_voice": "qu" },
	"tr": { "name": "Turkish", "rtl": false, "tts_voice": "tr-TR" },
	"fa": { "name": "Kurdish/Persian", "rtl": true, "tts_voice": "fa-IR" },
	"sw": { "name": "Swahili", "rtl": false, "tts_voice": "sw-KE" },
	"zh": { "name": "Mandarin", "rtl": false, "tts_voice": "zh-CN" }
}

func _ready() -> void:
	_fallback = _load_language(default_language)
	set_language(default_language)

func set_language(lang_code: String) -> bool:
	var loaded := _load_language(lang_code)
	if loaded.is_empty() and lang_code != default_language:
		return false
	current_language = lang_code
	_translations = loaded
	language_changed.emit(lang_code)
	return true

func translate(key: String, context: String = "", params: Array = [], count: int = -1) -> String:
	var full_key := key
	if context != "":
		full_key = "%s.%s" % [context, key]
	var value = _translations.get(full_key, _fallback.get(full_key, key))
	if typeof(value) == TYPE_DICTIONARY and count >= 0:
		value = _select_plural(value, count)
	var text := str(value)
	if not params.is_empty():
		text = text % params
	return text

func tr_plural(key: String, count: int, context: String = "") -> String:
	return translate(key, context, [count], count)

func get_available_languages() -> Array:
	return _language_meta.keys()

func get_language_info(lang_code: String) -> Dictionary:
	return _language_meta.get(lang_code, {})

func is_rtl(lang_code: String = current_language) -> bool:
	return bool(_language_meta.get(lang_code, {}).get("rtl", false))

func get_tts_voice(lang_code: String = current_language) -> String:
	return str(_language_meta.get(lang_code, {}).get("tts_voice", "en-US"))

func apply_text_direction(control: Control, lang_code: String = current_language) -> void:
	if control == null:
		return
	if is_rtl(lang_code):
		control.layout_direction = Control.LAYOUT_DIRECTION_RTL
	else:
		control.layout_direction = Control.LAYOUT_DIRECTION_LTR

func _load_language(lang_code: String) -> Dictionary:
	var path := "%s/%s.json" % [language_dir, lang_code]
	if not FileAccess.file_exists(path):
		return {}
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return {}
	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) == TYPE_DICTIONARY:
		return parsed
	return {}

func _select_plural(forms: Dictionary, count: int) -> String:
	if count == 0 and forms.has("zero"):
		return str(forms["zero"])
	if count == 1 and forms.has("one"):
		return str(forms["one"])
	if forms.has("other"):
		return str(forms["other"])
	return str(forms.values()[0])
