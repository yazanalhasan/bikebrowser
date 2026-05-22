extends Node

# CANONICAL RUNTIME SYSTEM
# This is the authoritative gameplay audio service for region music,
# stingers, and TTS fallbacks.

const MUSIC_BY_REGION := {
	"boot": "res://Assets/Audio/Music/title_screen.ogg",
	"neighborhood_street": "res://Assets/Audio/Music/neighborhood_street.ogg",
	"garage": "res://Assets/Audio/Music/garage_workshop.ogg",
	"copper_mine": "res://Assets/Audio/Music/copper_mine.ogg",
	"desert_trail": "res://Assets/Audio/Music/dry_wash_bridge.ogg",
	"dry_wash": "res://Assets/Audio/Music/dry_wash_bridge.ogg",
	"salt_river": "res://Assets/Audio/Music/salt_river.ogg",
	"system_showcase": "res://Assets/Audio/Music/title_screen.ogg",
	"bridge_presentation_preview": "res://Assets/Audio/Music/title_screen.ogg",
}

const DEFAULT_MUSIC := "res://Assets/Audio/Music/neighborhood_street.ogg"
const REWARD_STINGER := "res://Assets/Audio/Stingers/quest_fanfare.mp3"
const SOFT_CLICK_STINGER := "res://Assets/Audio/Stingers/chain_repair_success.mp3"
const WEB_RESOURCE_BASE := "/godot/BikeBrowserWorld/"
const REWARD_TINY := "res://Assets/Audio/Cues/reward_tiny.ogg"
const REWARD_SMALL := "res://Assets/Audio/Cues/reward_small.ogg"
const REWARD_MEDIUM := "res://Assets/Audio/Cues/reward_medium.ogg"
const REWARD_LARGE := "res://Assets/Audio/Cues/reward_large.ogg"
const AMBIENCE_SAMPLE_RATE := 12000
const VOICE_PROFILE_PATH := "res://Data/audio/voice_profiles.json"
const VOICE_VOLUME := 0.92
const VOICE_DUCK_MUSIC_DB := -3.0
const VOICE_DUCK_AMBIENCE_DB := -5.0
const VOICE_DUCK_RECOVERY_SEC := 1.1

const MUSIC_MIX_BY_REGION := {
	"boot": { "volume_db": -13.0, "fade_out": 0.55, "fade_in": 1.45 },
	"neighborhood_street": { "volume_db": -11.0, "fade_out": 0.75, "fade_in": 1.85 },
	"garage": { "volume_db": -13.5, "fade_out": 0.85, "fade_in": 2.15 },
	"copper_mine": { "volume_db": -12.5, "fade_out": 0.75, "fade_in": 1.9 },
	"desert_trail": { "volume_db": -12.0, "fade_out": 0.8, "fade_in": 1.95 },
	"dry_wash": { "volume_db": -12.5, "fade_out": 0.8, "fade_in": 1.95 },
	"salt_river": { "volume_db": -12.0, "fade_out": 0.8, "fade_in": 1.95 },
	"system_showcase": { "volume_db": -14.0, "fade_out": 0.55, "fade_in": 1.35 },
}

const CUE_PROFILES := {
	"soft_click": { "path": SOFT_CLICK_STINGER, "volume_db": -27.0, "pitch": 1.14, "duration": 0.1, "min_gap": 180 },
	"transition_soft": { "path": SOFT_CLICK_STINGER, "volume_db": -28.0, "pitch": 0.88, "duration": 0.2, "min_gap": 650, "post_silence": 360 },
	"dialogue_open": { "path": SOFT_CLICK_STINGER, "volume_db": -30.0, "pitch": 1.0, "duration": 0.14, "min_gap": 500 },
	"dialogue_next": { "path": SOFT_CLICK_STINGER, "volume_db": -34.0, "pitch": 1.08, "duration": 0.07, "min_gap": 650 },
	"dialogue_close": { "path": SOFT_CLICK_STINGER, "volume_db": -33.0, "pitch": 0.84, "duration": 0.12, "min_gap": 500, "post_silence": 260 },
	"pencil_scratch": { "path": SOFT_CLICK_STINGER, "volume_db": -34.0, "pitch": 1.28, "duration": 0.09, "min_gap": 220 },
	"paper_flip": { "path": SOFT_CLICK_STINGER, "volume_db": -32.0, "pitch": 0.92, "duration": 0.16, "min_gap": 360 },
	"brace_click": { "path": SOFT_CLICK_STINGER, "volume_db": -28.5, "pitch": 0.76, "duration": 0.14, "min_gap": 260 },
	"bridge_test_thump": { "path": SOFT_CLICK_STINGER, "volume_db": -29.0, "pitch": 0.58, "duration": 0.20, "min_gap": 340 },
	"force_path_cue": { "path": SOFT_CLICK_STINGER, "volume_db": -31.0, "pitch": 1.36, "duration": 0.12, "min_gap": 220 },
	"chain_inspect": { "path": SOFT_CLICK_STINGER, "volume_db": -25.5, "pitch": 0.78, "duration": 0.2, "min_gap": 320 },
	"pedal_rotate": { "path": SOFT_CLICK_STINGER, "volume_db": -25.0, "pitch": 0.92, "duration": 0.24, "min_gap": 340 },
	"chain_align": { "path": SOFT_CLICK_STINGER, "volume_db": -24.5, "pitch": 1.0, "duration": 0.22, "min_gap": 340 },
	"chain_seat": { "path": SOFT_CLICK_STINGER, "volume_db": -23.5, "pitch": 1.06, "duration": 0.26, "min_gap": 360, "post_silence": 140 },
	"wheel_spin_success": { "path": SOFT_CLICK_STINGER, "volume_db": -24.5, "pitch": 1.16, "duration": 0.42, "min_gap": 700, "post_silence": 520 },
	"brake_check": { "path": SOFT_CLICK_STINGER, "volume_db": -26.0, "pitch": 0.72, "duration": 0.18, "min_gap": 320 },
	"tire_press": { "path": SOFT_CLICK_STINGER, "volume_db": -26.5, "pitch": 0.84, "duration": 0.16, "min_gap": 320 },
	"chain_roll": { "path": SOFT_CLICK_STINGER, "volume_db": -25.5, "pitch": 0.96, "duration": 0.21, "min_gap": 340 },
	"wheel_spin": { "path": SOFT_CLICK_STINGER, "volume_db": -26.0, "pitch": 1.1, "duration": 0.23, "min_gap": 340 },
	"tube_slide": { "path": SOFT_CLICK_STINGER, "volume_db": -27.0, "pitch": 0.66, "duration": 0.18, "min_gap": 340 },
	"patch_press": { "path": SOFT_CLICK_STINGER, "volume_db": -26.0, "pitch": 0.88, "duration": 0.16, "min_gap": 340 },
	"pump_air": { "path": SOFT_CLICK_STINGER, "volume_db": -25.5, "pitch": 0.74, "duration": 0.22, "min_gap": 360 },
	"soft_reward": { "path": REWARD_STINGER, "volume_db": -25.5, "pitch": 1.0, "duration": 0.8, "min_gap": 900, "post_silence": 650 },
	"reward_chime": { "path": REWARD_STINGER, "volume_db": -22.5, "pitch": 0.94, "duration": 1.1, "min_gap": 1300, "post_silence": 900 },
	"reward_tiny": { "path": REWARD_TINY, "volume_db": -6.0, "pitch": 1.0, "duration": 0.15, "min_gap": 240, "post_silence": 120 },
	"reward_small": { "path": REWARD_SMALL, "volume_db": -5.5, "pitch": 1.0, "duration": 0.3, "min_gap": 360, "post_silence": 180 },
	"reward_medium": { "path": REWARD_MEDIUM, "volume_db": -4.5, "pitch": 1.0, "duration": 0.6, "min_gap": 700, "post_silence": 420 },
	"reward_large": { "path": REWARD_LARGE, "volume_db": -4.0, "pitch": 1.0, "duration": 1.2, "min_gap": 1400, "post_silence": 900 },
}

const AMBIENCE_BY_REGION := {
	"neighborhood_street": { "volume_db": -35.0, "hum": 70.0, "hum_gain": 0.012, "air_gain": 0.02, "texture": "crickets", "breath": 0.42, "space": 0.26 },
	"garage": { "volume_db": -33.0, "hum": 58.0, "hum_gain": 0.017, "air_gain": 0.012, "texture": "workshop", "breath": 0.32, "space": -0.14 },
	"copper_mine": { "volume_db": -36.0, "hum": 46.0, "hum_gain": 0.014, "air_gain": 0.016, "texture": "settle", "breath": 0.34, "space": -0.18 },
	"desert_trail": { "volume_db": -36.0, "hum": 64.0, "hum_gain": 0.008, "air_gain": 0.025, "texture": "wind", "breath": 0.52, "space": 0.22 },
	"dry_wash": { "volume_db": -36.0, "hum": 58.0, "hum_gain": 0.01, "air_gain": 0.024, "texture": "wind", "breath": 0.5, "space": 0.16 },
	"salt_river": { "volume_db": -36.0, "hum": 82.0, "hum_gain": 0.008, "air_gain": 0.023, "texture": "water", "breath": 0.46, "space": 0.18 },
	"boot": { "volume_db": -40.0, "hum": 64.0, "hum_gain": 0.006, "air_gain": 0.008, "texture": "quiet", "breath": 0.6, "space": 0.0 },
	"system_showcase": { "volume_db": -40.0, "hum": 64.0, "hum_gain": 0.006, "air_gain": 0.008, "texture": "quiet", "breath": 0.6, "space": 0.0 },
}

var audio_unlocked := false
var voice_enabled := true
var muted := false
var current_region := ""
var music_player: AudioStreamPlayer
var stinger_player: AudioStreamPlayer
var ambience_player: AudioStreamPlayer
var ambience_playback: AudioStreamGeneratorPlayback
var current_music_path := ""
var current_ambience_region := ""
var ambience_time := 0.0
var ambience_noise_seed := 0.37
var interaction_fallback_block_until_msec := 0
var quiet_until_msec := 0
var last_cue_msec := {}
var voice_profiles: Dictionary = {}

func _ready() -> void:
	voice_profiles = _load_voice_profiles()
	_setup_native_audio_players()
	EventBus.region_entered.connect(_on_region_entered)
	EventBus.interaction_feedback.connect(_on_interaction_feedback)
	EventBus.reward_feedback.connect(_on_reward_feedback)
	EventBus.accomplishment_feedback.connect(_on_accomplishment_feedback)
	if OS.has_feature("web"):
		_install_web_audio_runtime()
	else:
		audio_unlocked = true
	set_process(not OS.has_feature("web"))

func _input(event: InputEvent) -> void:
	if not OS.has_feature("web") or audio_unlocked:
		return
	if event.is_pressed() and not event.is_echo():
		unlock_audio()

func unlock_audio() -> bool:
	if audio_unlocked:
		return true
	audio_unlocked = true
	if OS.has_feature("web"):
		_install_web_audio_runtime()
		JavaScriptBridge.eval("window.BikeBrowserAudio && window.BikeBrowserAudio.unlock(); window.BikeBrowserAudioUnlockUI && window.BikeBrowserAudioUnlockUI.hide();", true)
	EventBus.audio_unlocked.emit()
	EventBus.log_debug("Audio unlocked after user gesture", { "web": OS.has_feature("web") })
	if not current_region.is_empty():
		play_region_bed(current_region)
	return true

func play_region_bed(region_id: String) -> void:
	current_region = region_id
	if muted or not audio_unlocked:
		return
	var music_path := _music_path_for_region(region_id)
	if OS.has_feature("web"):
		var mix := _music_mix_for_region(region_id)
		JavaScriptBridge.eval("window.BikeBrowserAudio && window.BikeBrowserAudio.playRegion('%s','%s',%.3f,%.3f,%.3f);" % [region_id, _web_url_for_resource(music_path), float(mix.get("volume_db", -11.0)), float(mix.get("fade_out", 0.75)), float(mix.get("fade_in", 1.85))], true)
	else:
		_play_native_music(music_path, region_id)
		_play_native_ambience(region_id)
	EventBus.log_debug("Audio region bed requested", { "regionId": region_id, "musicPath": music_path })

func play_sfx(cue: String, tone: String = "soft") -> void:
	if muted or not audio_unlocked:
		return
	var now := Time.get_ticks_msec()
	if cue == "soft_click" and now < quiet_until_msec:
		return
	var profile: Dictionary = CUE_PROFILES.get(cue, CUE_PROFILES["soft_click"])
	var min_gap := int(profile.get("min_gap", 0))
	var last_played := int(last_cue_msec.get(cue, -100000))
	if now - last_played < min_gap:
		return
	last_cue_msec[cue] = now
	if cue != "soft_click":
		interaction_fallback_block_until_msec = now + 220
	var post_silence := int(profile.get("post_silence", 0))
	if post_silence > 0:
		quiet_until_msec = max(quiet_until_msec, now + post_silence)
	if OS.has_feature("web"):
		JavaScriptBridge.eval("window.BikeBrowserAudio && window.BikeBrowserAudio.cue('%s','%s','%s',%.3f,%.3f);" % [cue, tone, _web_url_for_resource(String(profile.get("path", SOFT_CLICK_STINGER))), float(profile.get("volume_db", -25.0)), float(profile.get("duration", 0.0))], true)
	else:
		if cue == "transition_soft":
			_shape_transition_space()
		elif cue == "reward_chime" or cue == "soft_reward":
			_shape_reward_afterglow()
		_play_native_stinger(profile)

func speak(text: String, speaker: String = "Narrator") -> void:
	var clean_text := text.strip_edges()
	if clean_text.is_empty():
		_log_tts_skipped("empty_text", speaker, text)
		return
	if muted:
		_log_tts_skipped("muted", speaker, text)
		return
	if not voice_enabled:
		_log_tts_skipped("voice_disabled", speaker, text)
		return
	if not audio_unlocked:
		_log_tts_skipped("audio_locked", speaker, text)
		return
	var voice_profile := resolve_voice_profile(speaker)
	_shape_voice_space()
	if OS.has_feature("web"):
		var escaped := text.json_escape()
		var speaker_escaped := speaker.json_escape()
		var hint_escaped := String(voice_profile.get("voiceHint", "")).json_escape()
		JavaScriptBridge.eval("window.BikeBrowserAudio && window.BikeBrowserAudio.speak(\"%s\", \"%s\", %.3f, %.3f, \"%s\", %.3f);" % [escaped, speaker_escaped, float(voice_profile["pitch"]), float(voice_profile["rate"]), hint_escaped, VOICE_VOLUME], true)
		EventBus.log_debug("Web TTS requested", { "speaker": speaker, "voiceHint": voice_profile.get("voiceHint", ""), "textLength": text.length() })
	else:
		_speak_native(text, speaker, voice_profile)

func voice_mix_profile() -> Dictionary:
	return {
		"volume": VOICE_VOLUME,
		"duckMusicDb": VOICE_DUCK_MUSIC_DB,
		"duckAmbienceDb": VOICE_DUCK_AMBIENCE_DB,
		"recoverySec": VOICE_DUCK_RECOVERY_SEC
	}

func resolve_voice_profile(speaker: String) -> Dictionary:
	if voice_profiles.is_empty():
		voice_profiles = _load_voice_profiles()
	var default_profile: Dictionary = voice_profiles.get("default", { "pitch": 1.0, "rate": 0.95, "voiceHint": "neutral grounded", "tone": "calm" })
	var speakers: Dictionary = voice_profiles.get("speakers", {})
	var profile: Dictionary = speakers.get(speaker, default_profile)
	var resolved := default_profile.duplicate(true)
	for key in profile.keys():
		resolved[key] = profile[key]
	resolved["pitch"] = clamp(float(resolved.get("pitch", 1.0)), 0.84, 1.16)
	resolved["rate"] = clamp(float(resolved.get("rate", 0.95)), 0.84, 1.08)
	return resolved

func resolve_tts_voice_id(voice_profile: Dictionary) -> String:
	if not DisplayServer.has_feature(DisplayServer.FEATURE_TEXT_TO_SPEECH):
		return ""
	var voices := DisplayServer.tts_get_voices_for_language("en")
	if voices.is_empty():
		return ""
	var hint := String(voice_profile.get("voiceHint", "")).to_lower()
	var preferred_terms := _voice_preference_terms(hint)
	for term in preferred_terms:
		for voice in voices:
			var voice_text := _voice_search_text(voice)
			if voice_text.find(term) != -1:
				return _voice_id_from(voice)
	return _voice_id_from(voices[0])

func cancel_speech() -> void:
	if OS.has_feature("web"):
		JavaScriptBridge.eval("window.BikeBrowserAudio && window.BikeBrowserAudio.cancelSpeech();", true)
	elif DisplayServer.has_feature(DisplayServer.FEATURE_TEXT_TO_SPEECH):
		DisplayServer.tts_stop()

func set_voice_enabled(enabled: bool) -> void:
	voice_enabled = enabled
	if not voice_enabled:
		cancel_speech()

func set_muted(is_muted: bool) -> void:
	muted = is_muted
	if OS.has_feature("web"):
		JavaScriptBridge.eval("window.BikeBrowserAudio && window.BikeBrowserAudio.setMuted(%s);" % ("true" if muted else "false"), true)
	else:
		if music_player:
			music_player.volume_db = -80.0 if muted else _music_mix_for_region(current_region).get("volume_db", -11.0)
		if stinger_player:
			stinger_player.volume_db = -80.0 if muted else -4.0
		if ambience_player:
			ambience_player.volume_db = -80.0 if muted else _ambience_mix_for_region(current_ambience_region).get("volume_db", -34.0)
	if muted:
		cancel_speech()

func _on_region_entered(region_id: String, _spawn_id: String) -> void:
	current_region = region_id
	play_region_bed(region_id)

func _on_interaction_feedback(_message: String, tone: String) -> void:
	var now := Time.get_ticks_msec()
	if now < interaction_fallback_block_until_msec or now < quiet_until_msec:
		return
	play_sfx("soft_click", tone)

func _on_reward_feedback(reward: Dictionary) -> void:
	EventBus.log_debug("Reward feedback received; tiered accomplishment cues handle audio", {
		"label": reward.get("label", "reward"),
	})

func _on_accomplishment_feedback(accomplishment: Dictionary) -> void:
	var tier := String(accomplishment.get("tier", "small"))
	var cue := "reward_%s" % tier
	if not CUE_PROFILES.has(cue):
		cue = "reward_small"
	play_sfx(cue, tier)
	EventBus.emit_game_event("audio_cue", {
		"cue": cue,
		"tier": tier,
		"label": accomplishment.get("label", "accomplishment"),
		"key": accomplishment.get("key", ""),
	})

func _setup_native_audio_players() -> void:
	if OS.has_feature("web"):
		return
	music_player = AudioStreamPlayer.new()
	music_player.name = "MusicPlayer"
	music_player.volume_db = -8.0
	add_child(music_player)
	stinger_player = AudioStreamPlayer.new()
	stinger_player.name = "StingerPlayer"
	stinger_player.volume_db = -4.0
	add_child(stinger_player)
	ambience_player = AudioStreamPlayer.new()
	ambience_player.name = "AmbiencePlayer"
	var ambience_stream := AudioStreamGenerator.new()
	ambience_stream.mix_rate = AMBIENCE_SAMPLE_RATE
	ambience_stream.buffer_length = 0.45
	ambience_player.stream = ambience_stream
	ambience_player.volume_db = -34.0
	add_child(ambience_player)

func _music_path_for_region(region_id: String) -> String:
	if MUSIC_BY_REGION.has(region_id):
		return String(MUSIC_BY_REGION[region_id])
	var warning := "Missing music mapping for region '%s'; using default music." % region_id
	push_warning(warning)
	EventBus.log_debug(warning)
	return DEFAULT_MUSIC

func _web_url_for_resource(path: String) -> String:
	if path.begins_with("res://"):
		return WEB_RESOURCE_BASE + path.replace("res://", "")
	return path

func validate_audio_mappings(region_ids: Array) -> Array:
	var errors: Array = []
	for region_id_value in region_ids:
		var region_id := String(region_id_value)
		if not MUSIC_BY_REGION.has(region_id):
			errors.append("Missing music mapping for region: %s" % region_id)
			continue
		var path := String(MUSIC_BY_REGION[region_id])
		if not ResourceLoader.exists(path):
			errors.append("Missing music file for region %s: %s" % [region_id, path])
	if not ResourceLoader.exists(REWARD_STINGER):
		errors.append("Missing reward stinger: %s" % REWARD_STINGER)
	if not ResourceLoader.exists(SOFT_CLICK_STINGER):
		errors.append("Missing soft click stinger: %s" % SOFT_CLICK_STINGER)
	for cue_path in [REWARD_TINY, REWARD_SMALL, REWARD_MEDIUM, REWARD_LARGE]:
		if not ResourceLoader.exists(cue_path):
			errors.append("Missing reward cue: %s" % cue_path)
	return errors

func play_test_music(region_id: String) -> void:
	audio_unlocked = true
	play_region_bed(region_id)

func play_test_stinger(stinger_id: String) -> void:
	audio_unlocked = true
	play_sfx("reward_medium" if stinger_id == "quest_fanfare" else "soft_click")

func test_tts() -> void:
	audio_unlocked = true
	speak("BikeBrowser audio test.", "Narrator")

func _process(_delta: float) -> void:
	if OS.has_feature("web") or muted or not audio_unlocked:
		return
	_fill_native_ambience_buffer()

func _play_native_music(path: String, region_id: String = "") -> void:
	if music_player == null or path.is_empty() or current_music_path == path:
		return
	if not ResourceLoader.exists(path):
		push_warning("Missing native music file: %s" % path)
		EventBus.log_debug("Missing native music file", { "path": path })
		if path != DEFAULT_MUSIC:
			_play_native_music(DEFAULT_MUSIC, "neighborhood_street")
		return
	var stream := load(path)
	if stream == null:
		EventBus.log_debug("Failed to load native music file", { "path": path })
		return
	if stream is AudioStreamMP3 or stream is AudioStreamOggVorbis:
		stream.loop = true
	current_music_path = path
	var mix := _music_mix_for_region(region_id)
	var target_volume: float = mix.get("volume_db", -11.0)
	var fade_out: float = mix.get("fade_out", 0.75)
	var fade_in: float = mix.get("fade_in", 1.85)
	if music_player.playing:
		var tween := create_tween()
		tween.tween_property(music_player, "volume_db", -30.0, fade_out).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
		tween.tween_callback(func() -> void:
			music_player.stream = stream
			music_player.volume_db = -30.0
			music_player.play()
		)
		tween.tween_property(music_player, "volume_db", target_volume, fade_in).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	else:
		music_player.stream = stream
		music_player.volume_db = -30.0
		music_player.play()
		var tween := create_tween()
		tween.tween_property(music_player, "volume_db", target_volume, fade_in).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)

func _play_native_stinger(profile: Dictionary) -> void:
	var path := String(profile.get("path", SOFT_CLICK_STINGER))
	if stinger_player == null or path.is_empty():
		return
	if not ResourceLoader.exists(path):
		EventBus.log_debug("Missing native stinger file", { "path": path })
		return
	var stream := load(path)
	if stream == null:
		return
	stinger_player.stream = stream
	stinger_player.volume_db = float(profile.get("volume_db", -25.0))
	stinger_player.pitch_scale = float(profile.get("pitch", 1.0))
	stinger_player.play()
	var duration := float(profile.get("duration", 0.0))
	if duration > 0.0:
		get_tree().create_timer(duration).timeout.connect(func() -> void:
			if stinger_player and stinger_player.playing and stinger_player.stream == stream:
				var tween := create_tween()
				tween.tween_property(stinger_player, "volume_db", -40.0, 0.12)
				tween.tween_callback(stinger_player.stop)
		)

func _play_native_ambience(region_id: String) -> void:
	if ambience_player == null:
		return
	current_ambience_region = region_id
	var target_volume: float = _ambience_mix_for_region(region_id).get("volume_db", -34.0)
	if not ambience_player.playing:
		ambience_player.volume_db = -46.0
		ambience_player.play()
		ambience_playback = ambience_player.get_stream_playback()
	var tween := create_tween()
	tween.tween_property(ambience_player, "volume_db", target_volume, 2.2).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)

func _shape_transition_space() -> void:
	if music_player and music_player.playing:
		var music_target: float = _music_mix_for_region(current_region).get("volume_db", -11.0)
		var tween := create_tween()
		tween.tween_property(music_player, "volume_db", music_target - 3.5, 0.18).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
		tween.tween_property(music_player, "volume_db", music_target, 0.55).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	if ambience_player and ambience_player.playing:
		var ambience_target: float = _ambience_mix_for_region(current_ambience_region).get("volume_db", -34.0)
		var ambience_tween := create_tween()
		ambience_tween.tween_property(ambience_player, "volume_db", ambience_target - 5.0, 0.2).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
		ambience_tween.tween_property(ambience_player, "volume_db", ambience_target, 0.8).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)

func _shape_reward_afterglow() -> void:
	if ambience_player and ambience_player.playing:
		var ambience_target: float = _ambience_mix_for_region(current_ambience_region).get("volume_db", -34.0)
		var tween := create_tween()
		tween.tween_property(ambience_player, "volume_db", ambience_target - 3.0, 0.28).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
		tween.tween_property(ambience_player, "volume_db", ambience_target, 1.1).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)

func _shape_voice_space() -> void:
	if music_player and music_player.playing:
		var music_target: float = _music_mix_for_region(current_region).get("volume_db", -11.0)
		var tween := create_tween()
		tween.tween_property(music_player, "volume_db", music_target + VOICE_DUCK_MUSIC_DB, 0.16).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
		tween.tween_property(music_player, "volume_db", music_target, VOICE_DUCK_RECOVERY_SEC).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	if ambience_player and ambience_player.playing:
		var ambience_target: float = _ambience_mix_for_region(current_ambience_region).get("volume_db", -34.0)
		var ambience_tween := create_tween()
		ambience_tween.tween_property(ambience_player, "volume_db", ambience_target + VOICE_DUCK_AMBIENCE_DB, 0.16).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
		ambience_tween.tween_property(ambience_player, "volume_db", ambience_target, VOICE_DUCK_RECOVERY_SEC).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)

func _fill_native_ambience_buffer() -> void:
	if ambience_player == null or not ambience_player.playing:
		return
	if ambience_playback == null:
		ambience_playback = ambience_player.get_stream_playback()
	if ambience_playback == null:
		return
	var frames: int = ambience_playback.get_frames_available()
	var profile := _ambience_mix_for_region(current_ambience_region)
	var hum_hz: float = profile.get("hum", 64.0)
	var hum_gain: float = profile.get("hum_gain", 0.014)
	var air_gain: float = profile.get("air_gain", 0.02)
	var texture := String(profile.get("texture", "quiet"))
	var breath_amount: float = profile.get("breath", 0.4)
	var space: float = profile.get("space", 0.0)
	for _frame in frames:
		ambience_time += 1.0 / float(AMBIENCE_SAMPLE_RATE)
		var breath := _ambience_breath(ambience_time, breath_amount)
		var hum: float = sin(TAU * hum_hz * ambience_time) * hum_gain * breath
		var air: float = _warm_noise() * air_gain * breath
		var detail: float = _ambience_detail(texture, ambience_time) * min(1.0, breath + 0.18)
		var sample: float = clamp(hum + air + detail, -0.1, 0.1)
		var moving_space: float = clamp(space + sin(ambience_time * 0.19) * 0.04, -0.35, 0.35)
		var left: float = sample * (1.0 - moving_space * 0.22)
		var right: float = sample * (1.0 + moving_space * 0.22)
		ambience_playback.push_frame(Vector2(left, right))

func _ambience_breath(t: float, amount: float) -> float:
	var slow_wave := (sin(t * 0.23) + 1.0) * 0.5
	var slower_wave := (sin(t * 0.071 + 1.7) + 1.0) * 0.5
	var open_air := 1.0 - amount
	var movement := (slow_wave * 0.72 + slower_wave * 0.28) * amount
	return clamp(open_air + movement, 0.32, 1.0)

func _ambience_detail(texture: String, t: float) -> float:
	match texture:
		"crickets":
			var cricket_gate: float = max(0.0, sin(t * 0.82) - 0.9) * 0.025
			return sin(TAU * 1850.0 * t) * cricket_gate
		"workshop":
			var tool_tick: float = max(0.0, sin(t * 0.31) - 0.978) * 0.02
			var chain_tick: float = max(0.0, sin(t * 0.67 + 1.9) - 0.965) * 0.013
			return sin(TAU * 420.0 * t) * tool_tick + sin(TAU * 760.0 * t) * chain_tick
		"settle":
			return sin(TAU * 95.0 * t) * max(0.0, sin(t * 0.42) - 0.96) * 0.022
		"wind":
			return sin(TAU * 132.0 * t) * (0.006 + max(0.0, sin(t * 0.31)) * 0.006)
		"water":
			return sin(TAU * 176.0 * t) * (0.007 + max(0.0, sin(t * 0.72)) * 0.006)
	return 0.0

func _warm_noise() -> float:
	ambience_noise_seed = fposmod(ambience_noise_seed * 1103.0 + 0.137, 1.0)
	return (ambience_noise_seed * 2.0 - 1.0) * 0.45

func _music_mix_for_region(region_id: String) -> Dictionary:
	return MUSIC_MIX_BY_REGION.get(region_id, MUSIC_MIX_BY_REGION["neighborhood_street"])

func _ambience_mix_for_region(region_id: String) -> Dictionary:
	return AMBIENCE_BY_REGION.get(region_id, AMBIENCE_BY_REGION["neighborhood_street"])

func _speak_native(text: String, speaker: String, voice_profile: Dictionary) -> void:
	if not DisplayServer.has_feature(DisplayServer.FEATURE_TEXT_TO_SPEECH):
		var warning := "Native TTS unavailable; showing text only"
		push_warning(warning)
		EventBus.log_debug(warning, { "speaker": speaker, "textLength": text.length() })
		EventBus.tts_unavailable.emit(text)
		return
	var voices := DisplayServer.tts_get_voices_for_language("en")
	var voice_id := resolve_tts_voice_id(voice_profile)
	if voice_id.is_empty():
		var warning := "Native TTS voice unavailable; showing text only"
		push_warning(warning)
		EventBus.log_debug(warning, { "speaker": speaker, "textLength": text.length() })
		EventBus.tts_unavailable.emit(text)
		return
	var pitch := float(voice_profile.get("pitch", 1.0))
	var rate := float(voice_profile.get("rate", 0.95))
	DisplayServer.tts_stop()
	DisplayServer.tts_speak(text, voice_id, int(round(VOICE_VOLUME * 100.0)), pitch, rate, 0, true)

func _log_tts_skipped(reason: String, speaker: String, text: String) -> void:
	EventBus.log_debug("TTS skipped; showing text only", {
		"reason": reason,
		"speaker": speaker,
		"textLength": text.length()
	})
	EventBus.tts_unavailable.emit(text)

func _voice_preference_terms(hint: String) -> Array[String]:
	if hint.find("feminine") != -1:
		return ["female", "woman", "zira", "aria", "jenny", "susan", "hazel", "heera", "zira"]
	if hint.find("older") != -1 or hint.find("grounded") != -1:
		return ["male", "man", "david", "mark", "george", "guy"]
	if hint.find("bright") != -1 or hint.find("casual") != -1:
		return ["female", "jenny", "aria", "zira", "neutral"]
	return ["neutral", "zira", "david"]

func _voice_search_text(voice) -> String:
	if typeof(voice) == TYPE_DICTIONARY:
		var data: Dictionary = voice
		return ("%s %s %s" % [String(data.get("id", "")), String(data.get("name", "")), String(data.get("language", ""))]).to_lower()
	return str(voice).to_lower()

func _voice_id_from(voice) -> String:
	if typeof(voice) == TYPE_DICTIONARY:
		var data: Dictionary = voice
		return String(data.get("id", data.get("name", "")))
	return str(voice)

func _load_voice_profiles() -> Dictionary:
	if not FileAccess.file_exists(VOICE_PROFILE_PATH):
		return { "default": { "pitch": 1.0, "rate": 0.95, "voiceHint": "neutral grounded", "tone": "calm" }, "speakers": {} }
	var parsed = JSON.parse_string(FileAccess.get_file_as_string(VOICE_PROFILE_PATH))
	if typeof(parsed) == TYPE_DICTIONARY:
		return parsed
	return { "default": { "pitch": 1.0, "rate": 0.95, "voiceHint": "neutral grounded", "tone": "calm" }, "speakers": {} }

func _install_web_audio_runtime() -> void:
	if not OS.has_feature("web"):
		return
	JavaScriptBridge.eval("""
(function () {
  if (window.BikeBrowserAudio) return;
  const state = {
    ctx: null,
    master: null,
    musicBus: null,
    sfxBus: null,
    music: [],
    ambience: [],
    unlocked: false,
    muted: false,
    quietUntil: 0,
    cueTimes: {},
    lastCue: "",
    lastRegion: "",
    currentTrackUrl: "",
    currentTrackRegion: "",
    musicPlaying: false,
    oscillatorFallbackDisabled: true,
    availableVoiceCount: 0,
    lastVoiceName: "",
    lastVoiceHint: "",
    lastVoiceSpeaker: "",
    pendingSpeechToken: 0,
    lastSpeechStatus: "idle"
  };
  const regionMix = {
    neighborhood_street: { ambFreq: 73, ambGain: 0.006, noiseGain: 0.004, fade: 2.1, pan: 0.24 },
    garage: { ambFreq: 58, ambGain: 0.008, noiseGain: 0.003, fade: 2.35, pan: -0.12 },
    copper_mine: { ambFreq: 46, ambGain: 0.006, noiseGain: 0.004, fade: 2.0, pan: -0.18 },
    desert_trail: { ambFreq: 64, ambGain: 0.005, noiseGain: 0.006, fade: 2.15, pan: 0.2 },
    salt_river: { ambFreq: 82, ambGain: 0.005, noiseGain: 0.006, fade: 2.15, pan: 0.18 },
    boot: { ambFreq: 64, ambGain: 0.004, noiseGain: 0.002, fade: 1.45, pan: 0 },
    system_showcase: { ambFreq: 64, ambGain: 0.004, noiseGain: 0.002, fade: 1.35, pan: 0 }
  };
  const cueProfiles = {
    reward_chime: { gap: 1300, post: 900 },
    soft_reward: { gap: 900, post: 650 },
    reward_tiny: { gap: 240, post: 120 },
    reward_small: { gap: 360, post: 180 },
    reward_medium: { gap: 700, post: 420 },
    reward_large: { gap: 1400, post: 900 },
    transition_soft: { gap: 650, post: 360 },
    dialogue_open: { gap: 500, post: 0 },
    dialogue_next: { gap: 650, post: 0 },
    dialogue_close: { gap: 500, post: 260 },
    soft_click: { gap: 180, post: 0 }
  };
  function gainFromDb(db) {
    const value = Number(db);
    if (!Number.isFinite(value)) return 0.25;
    return Math.pow(10, value / 20);
  }
  function ctx() {
    if (!state.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      state.ctx = new AudioContext();
      state.master = state.ctx.createGain();
      state.musicBus = state.ctx.createGain();
      state.sfxBus = state.ctx.createGain();
      state.master.gain.value = 0.34;
      state.musicBus.gain.value = 1.0;
      state.sfxBus.gain.value = 1.0;
      state.musicBus.connect(state.master);
      state.sfxBus.connect(state.master);
      state.master.connect(state.ctx.destination);
    }
    return state.ctx;
  }
  function fadeOutHandle(handle, dur) {
    if (!handle) return;
    const c = ctx();
    const endAt = c.currentTime + dur;
    try {
      handle.gain.gain.cancelScheduledValues(c.currentTime);
      handle.gain.gain.setValueAtTime(Math.max(handle.gain.gain.value, 0.0001), c.currentTime);
      handle.gain.gain.exponentialRampToValueAtTime(0.0001, endAt);
    } catch (_) {}
    window.setTimeout(() => {
      try {
        if (handle.el) {
          handle.el.pause();
          handle.el.src = "";
          handle.el.load();
        } else if (handle.node && handle.node.stop) {
          handle.node.stop();
        }
      } catch (_) {}
      try { if (handle.node) handle.node.disconnect(); } catch (_) {}
      try { if (handle.source) handle.source.disconnect(); } catch (_) {}
      try { handle.gain.disconnect(); } catch (_) {}
    }, (dur + 0.08) * 1000);
  }
  function makeMediaHandle(url, volumeDb, loop) {
    const c = ctx();
    if (!c || !url) return null;
    const el = new Audio(url);
    el.loop = !!loop;
    el.preload = "auto";
    el.crossOrigin = "anonymous";
    el.volume = 1.0;
    const source = c.createMediaElementSource(el);
    const gain = c.createGain();
    gain.gain.value = 0.0001;
    source.connect(gain).connect(loop ? state.musicBus : state.sfxBus);
    return { el, source, gain, url };
  }
  function noiseBed(gainValue, dur, panValue) {
    const c = ctx();
    if (!c || state.muted || !state.unlocked) return null;
    const bufferSize = Math.max(1, Math.floor(c.sampleRate * dur));
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      last = last * 0.96 + (Math.random() * 2 - 1) * 0.04;
      data[i] = last;
    }
    const src = c.createBufferSource();
    const g = c.createGain();
    const pan = c.createStereoPanner ? c.createStereoPanner() : null;
    src.buffer = buffer;
    src.loop = true;
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(gainValue, c.currentTime + 1.2);
    if (pan) {
      pan.pan.value = panValue || 0;
      src.connect(g).connect(pan).connect(state.master);
    } else {
      src.connect(g).connect(state.master);
    }
    src.start();
    return { node: src, gain: g };
  }
  function canCue(name) {
    const now = performance.now();
    const profile = cueProfiles[name] || cueProfiles.soft_click;
    if (name === "soft_click" && now < state.quietUntil) return false;
    if (now - (state.cueTimes[name] || -100000) < profile.gap) return false;
    state.cueTimes[name] = now;
    if (profile.post) state.quietUntil = Math.max(state.quietUntil, now + profile.post);
    return true;
  }
  function voiceTerms(hint) {
    const value = String(hint || "").toLowerCase();
    if (value.includes("feminine")) return ["female", "woman", "zira", "aria", "jenny", "susan", "hazel", "heera"];
    if (value.includes("older") || value.includes("grounded")) return ["male", "man", "david", "mark", "george", "guy"];
    if (value.includes("bright") || value.includes("casual")) return ["female", "jenny", "aria", "zira", "neutral"];
    if (value.includes("calm") || value.includes("warm")) return ["female", "zira", "aria", "jenny", "susan", "hazel", "neutral"];
    if (value.includes("measured") || value.includes("steady") || value.includes("workshop")) return ["male", "david", "mark", "george", "guy", "neutral"];
    return ["neutral", "zira", "david"];
  }
  function getVoices() {
    if (!("speechSynthesis" in window)) return null;
    const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
    state.availableVoiceCount = voices ? voices.length : 0;
    window.BikeBrowserAudioState = state;
    return voices || [];
  }
  function speakerIndex(speaker, size) {
    if (!size) return 0;
    const text = String(speaker || "");
    let hash = 0;
    for (let i = 0; i < text.length; i++) hash = ((hash * 31) + text.charCodeAt(i)) >>> 0;
    return hash % size;
  }
  function chooseVoice(hint, speaker) {
    const voices = getVoices();
    if (!voices || !voices.length) return null;
    const enVoices = voices.filter((voice) => String(voice.lang || "").toLowerCase().startsWith("en"));
    const pool = enVoices.length ? enVoices : voices;
    const terms = voiceTerms(hint);
    for (const term of terms) {
      const found = pool.find((voice) => `${voice.name || ""} ${voice.voiceURI || ""} ${voice.lang || ""}`.toLowerCase().includes(term));
      if (found) return found;
    }
    return pool[speakerIndex(speaker, pool.length)] || pool[0] || null;
  }
  function primeVoices() {
    if (!("speechSynthesis" in window)) return;
    getVoices();
    window.speechSynthesis.onvoiceschanged = () => getVoices();
  }
  function duckSpace(amount, dur) {
    const c = ctx();
    if (!c) return;
    [...state.music, ...state.ambience].forEach((handle) => {
      try {
        const current = Math.max(handle.gain.gain.value, 0.0001);
        handle.gain.gain.cancelScheduledValues(c.currentTime);
        handle.gain.gain.setValueAtTime(current, c.currentTime);
        handle.gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, current * amount), c.currentTime + 0.18);
        handle.gain.gain.exponentialRampToValueAtTime(current, c.currentTime + dur);
      } catch (_) {}
    });
  }
  window.BikeBrowserAudio = {
    unlock() {
      const c = ctx();
      if (!c) return false;
      const finish = () => {
        state.unlocked = true;
        primeVoices();
        window.BikeBrowserAudioState = state;
        if (window.BikeBrowserAudioUnlockUI && window.BikeBrowserAudioUnlockUI.hide) window.BikeBrowserAudioUnlockUI.hide();
        console.info("[BikeBrowserAudio] unlocked");
        if (state.currentTrackRegion && state.currentTrackUrl) {
          this.playRegion(state.currentTrackRegion, state.currentTrackUrl);
        }
        return true;
      };
      if (c.state === "suspended") {
        c.resume().then(finish).catch(() => false);
      } else {
        finish();
      }
      return true;
    },
    playRegion(region, trackUrl, volumeDb, fadeOutSec, fadeInSec) {
      const c = ctx();
      if (!c || state.muted) return;
      if (!trackUrl) {
        console.warn("[BikeBrowserAudio] no authored music track for region", region);
        return;
      }
      if (!state.unlocked) {
        state.currentTrackRegion = region;
        state.currentTrackUrl = trackUrl;
        window.BikeBrowserAudioState = state;
        return;
      }
      if (state.currentTrackUrl === trackUrl && state.music.length && state.music[0].el && !state.music[0].el.paused) {
        state.lastRegion = region;
        state.musicPlaying = true;
        window.BikeBrowserAudioState = state;
        return;
      }
      state.currentTrackRegion = region;
      state.currentTrackUrl = trackUrl;
      const mix = regionMix[region] || regionMix.neighborhood_street;
      const fadeOut = Number.isFinite(fadeOutSec) ? fadeOutSec : mix.fade;
      const fadeIn = Number.isFinite(fadeInSec) ? fadeInSec : mix.fade;
      const targetGain = gainFromDb(Number.isFinite(volumeDb) ? volumeDb : -12);
      state.lastRegion = region;
      window.BikeBrowserAudioState = state;
      state.music.forEach((handle) => fadeOutHandle(handle, fadeOut));
      state.ambience.forEach((handle) => fadeOutHandle(handle, fadeOut + 0.35));
      const music = makeMediaHandle(trackUrl, volumeDb, true);
      if (!music) return;
      music.gain.gain.setValueAtTime(0.0001, c.currentTime);
      music.gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, targetGain), c.currentTime + fadeIn);
      music.el.play().then(() => {
        state.musicPlaying = true;
        window.BikeBrowserAudioState = state;
      }).catch((error) => {
        state.musicPlaying = false;
        window.BikeBrowserAudioState = state;
        console.warn("[BikeBrowserAudio] authored music playback failed", { region, trackUrl, error: error && error.message ? error.message : String(error) });
      });
      state.music = [music];
      const ambience = c.createOscillator();
      const ambGain = c.createGain();
      const ambPan = c.createStereoPanner ? c.createStereoPanner() : null;
      ambience.type = "triangle";
      ambience.frequency.value = mix.ambFreq;
      ambGain.gain.setValueAtTime(0.0001, c.currentTime);
      ambGain.gain.exponentialRampToValueAtTime(mix.ambGain, c.currentTime + 1.4);
      if (ambPan) {
        ambPan.pan.value = mix.pan || 0;
        ambience.connect(ambGain).connect(ambPan).connect(state.master);
      } else {
        ambience.connect(ambGain).connect(state.master);
      }
      ambience.start();
      const bed = noiseBed(mix.noiseGain, 2.0, (mix.pan || 0) * -0.65);
      state.ambience = bed ? [{ node: ambience, gain: ambGain }, bed] : [{ node: ambience, gain: ambGain }];
    },
    cue(name, toneName, cueUrl, volumeDb, durationSec) {
      const c = ctx();
      if (!c || state.muted || !state.unlocked) return;
      if (!canCue(name)) return;
      state.lastCue = name;
      window.BikeBrowserAudioState = state;
      console.info("[BikeBrowserAudio] cue", name, toneName || "");
      if (!cueUrl) {
        console.warn("[BikeBrowserAudio] cue has no authored asset; procedural fallback is disabled", name);
        return;
      }
      const isReward = String(name).startsWith("reward_") || name === "soft_reward" || name === "reward_chime";
      if (isReward) duckSpace(name === "reward_large" ? 0.62 : 0.76, Math.max(0.85, Number(durationSec) || 0.4));
      if (name === "transition_soft") duckSpace(0.68, 0.8);
      const handle = makeMediaHandle(cueUrl, volumeDb, false);
      if (!handle) return;
      const targetGain = gainFromDb(Number.isFinite(volumeDb) ? volumeDb : -12);
      handle.gain.gain.setValueAtTime(Math.max(0.0001, targetGain), c.currentTime);
      handle.el.play().catch((error) => {
        console.warn("[BikeBrowserAudio] authored cue playback failed", { name, cueUrl, error: error && error.message ? error.message : String(error) });
      });
      const stopAfter = Number(durationSec) > 0 ? Number(durationSec) : 0;
      if (stopAfter > 0) {
        window.setTimeout(() => fadeOutHandle(handle, 0.08), stopAfter * 1000);
      } else {
        handle.el.addEventListener("ended", () => fadeOutHandle(handle, 0.01), { once: true });
      }
    },
    speak(text, speaker, pitch, rate, voiceHint, voiceVolume, forceDefault) {
      if (state.muted || !state.unlocked) return;
      if (!("speechSynthesis" in window)) {
        state.lastSpeechStatus = "unavailable";
        window.BikeBrowserAudioState = state;
        console.warn("[BikeBrowserAudio] TTS unavailable; showing text only", { speaker, text });
        return;
      }
      primeVoices();
      const token = ++state.pendingSpeechToken;
      const voices = getVoices();
      if ((!voices || !voices.length) && !forceDefault) {
        state.lastSpeechStatus = "waiting_for_voices";
        state.lastVoiceHint = voiceHint || "";
        state.lastVoiceSpeaker = speaker || "";
        window.BikeBrowserAudioState = state;
        let attempts = 0;
        const retry = () => {
          if (token !== state.pendingSpeechToken) return;
          const loaded = getVoices();
          if (loaded && loaded.length) {
            this.speak(text, speaker, pitch, rate, voiceHint, voiceVolume);
          } else if (++attempts < 10) {
            window.setTimeout(retry, 120);
          } else {
            console.warn("[BikeBrowserAudio] TTS voices did not load; browser default voice may be used", { speaker, voiceHint });
            this.speak(text, speaker, pitch, rate, voiceHint, voiceVolume, true);
          }
        };
        window.setTimeout(retry, 120);
        return;
      }
      window.speechSynthesis.cancel();
      duckSpace(0.58, 1.25);
      const utter = new SpeechSynthesisUtterance(text);
      const voice = chooseVoice(voiceHint, speaker);
      if (voice) utter.voice = voice;
      state.lastVoiceName = voice ? String(voice.name || voice.voiceURI || "") : "";
      state.lastVoiceHint = voiceHint || "";
      state.lastVoiceSpeaker = speaker || "";
      utter.rate = Number.isFinite(rate) ? rate : 0.95;
      utter.pitch = Number.isFinite(pitch) ? pitch : 1.0;
      utter.volume = Number.isFinite(voiceVolume) ? voiceVolume : 0.92;
      utter.onstart = () => {
        state.lastSpeechStatus = "speaking";
        window.BikeBrowserAudioState = state;
      };
      utter.onerror = (event) => {
        state.lastSpeechStatus = "error";
        window.BikeBrowserAudioState = state;
        console.warn("[BikeBrowserAudio] TTS failed; showing text only", { speaker, error: event.error || "unknown" });
      };
      utter.onend = () => {
        state.lastSpeechStatus = "ended";
        window.BikeBrowserAudioState = state;
      };
      window.speechSynthesis.speak(utter);
    },
    cancelSpeech() {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    },
    setMuted(value) {
      state.muted = !!value;
      if (state.master) state.master.gain.value = state.muted ? 0 : 0.16;
      if (state.muted) this.cancelSpeech();
    }
  };
})();
""", true)
