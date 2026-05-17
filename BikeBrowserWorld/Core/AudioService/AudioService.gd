extends Node

# CANONICAL RUNTIME SYSTEM
# This is the authoritative gameplay audio service for region music,
# stingers, and TTS fallbacks.

const MUSIC_BY_REGION := {
	"boot": "res://Assets/Audio/Music/title_screen.mp3",
	"neighborhood_street": "res://Assets/Audio/Music/neighborhood_street.mp3",
	"garage": "res://Assets/Audio/Music/garage_workshop.mp3",
	"copper_mine": "res://Assets/Audio/Music/copper_mine.mp3",
	"desert_trail": "res://Assets/Audio/Music/dry_wash_bridge.mp3",
	"salt_river": "res://Assets/Audio/Music/salt_river.mp3",
	"system_showcase": "res://Assets/Audio/Music/title_screen.mp3",
}

const DEFAULT_MUSIC := "res://Assets/Audio/Music/neighborhood_street.mp3"
const REWARD_STINGER := "res://Assets/Audio/Stingers/quest_fanfare.mp3"
const SOFT_CLICK_STINGER := "res://Assets/Audio/Stingers/chain_repair_success.mp3"
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
	"salt_river": { "volume_db": -12.0, "fade_out": 0.8, "fade_in": 1.95 },
	"system_showcase": { "volume_db": -14.0, "fade_out": 0.55, "fade_in": 1.35 },
}

const CUE_PROFILES := {
	"soft_click": { "path": SOFT_CLICK_STINGER, "volume_db": -27.0, "pitch": 1.14, "duration": 0.1, "min_gap": 180 },
	"transition_soft": { "path": SOFT_CLICK_STINGER, "volume_db": -28.0, "pitch": 0.88, "duration": 0.2, "min_gap": 650, "post_silence": 360 },
	"dialogue_open": { "path": SOFT_CLICK_STINGER, "volume_db": -30.0, "pitch": 1.0, "duration": 0.14, "min_gap": 500 },
	"dialogue_next": { "path": SOFT_CLICK_STINGER, "volume_db": -34.0, "pitch": 1.08, "duration": 0.07, "min_gap": 650 },
	"dialogue_close": { "path": SOFT_CLICK_STINGER, "volume_db": -33.0, "pitch": 0.84, "duration": 0.12, "min_gap": 500, "post_silence": 260 },
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
}

const AMBIENCE_BY_REGION := {
	"neighborhood_street": { "volume_db": -35.0, "hum": 70.0, "hum_gain": 0.012, "air_gain": 0.02, "texture": "crickets", "breath": 0.42, "space": 0.26 },
	"garage": { "volume_db": -33.0, "hum": 58.0, "hum_gain": 0.017, "air_gain": 0.012, "texture": "workshop", "breath": 0.32, "space": -0.14 },
	"copper_mine": { "volume_db": -36.0, "hum": 46.0, "hum_gain": 0.014, "air_gain": 0.016, "texture": "settle", "breath": 0.34, "space": -0.18 },
	"desert_trail": { "volume_db": -36.0, "hum": 64.0, "hum_gain": 0.008, "air_gain": 0.025, "texture": "wind", "breath": 0.52, "space": 0.22 },
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
	if OS.has_feature("web"):
		_install_web_audio_runtime()
	else:
		audio_unlocked = true
	set_process(not OS.has_feature("web"))

func unlock_audio() -> bool:
	if audio_unlocked:
		return true
	audio_unlocked = true
	if OS.has_feature("web"):
		_install_web_audio_runtime()
		JavaScriptBridge.eval("window.BikeBrowserAudio && window.BikeBrowserAudio.unlock();", true)
	EventBus.audio_unlocked.emit()
	EventBus.log_debug("Audio unlocked after user gesture", { "web": OS.has_feature("web") })
	if not current_region.is_empty():
		play_region_bed(current_region)
	return true

func play_region_bed(region_id: String) -> void:
	current_region = region_id
	if muted or not audio_unlocked:
		return
	var layer := _web_layer_for_region(region_id)
	var music_path := _music_path_for_region(region_id)
	if OS.has_feature("web"):
		JavaScriptBridge.eval("window.BikeBrowserAudio && window.BikeBrowserAudio.playRegion('%s');" % layer, true)
	else:
		_play_native_music(music_path, region_id)
		_play_native_ambience(region_id)
	EventBus.log_debug("Audio region bed requested", { "regionId": region_id, "layer": layer, "musicPath": music_path })

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
		JavaScriptBridge.eval("window.BikeBrowserAudio && window.BikeBrowserAudio.cue('%s','%s');" % [cue, tone], true)
	else:
		if cue == "transition_soft":
			_shape_transition_space()
		elif cue == "reward_chime" or cue == "soft_reward":
			_shape_reward_afterglow()
		_play_native_stinger(profile)

func speak(text: String, speaker: String = "Narrator") -> void:
	if muted or not voice_enabled or not audio_unlocked or text.strip_edges().is_empty():
		return
	var voice_profile := resolve_voice_profile(speaker)
	_shape_voice_space()
	if OS.has_feature("web"):
		var escaped := text.json_escape()
		var speaker_escaped := speaker.json_escape()
		var hint_escaped := String(voice_profile.get("voiceHint", "")).json_escape()
		JavaScriptBridge.eval("window.BikeBrowserAudio && window.BikeBrowserAudio.speak(\"%s\", \"%s\", %.3f, %.3f, \"%s\", %.3f);" % [escaped, speaker_escaped, float(voice_profile["pitch"]), float(voice_profile["rate"]), hint_escaped, VOICE_VOLUME], true)
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
	play_sfx("reward_chime", "celebrate")
	EventBus.emit_game_event("audio_cue", {
		"cue": "reward_chime",
		"label": reward.get("label", "reward"),
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
	return errors

func play_test_music(region_id: String) -> void:
	audio_unlocked = true
	play_region_bed(region_id)

func play_test_stinger(stinger_id: String) -> void:
	audio_unlocked = true
	play_sfx("reward_chime" if stinger_id == "quest_fanfare" else "soft_click")

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
	if stream is AudioStreamMP3:
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

func _web_layer_for_region(region_id: String) -> String:
	match region_id:
		"garage":
			return "garage"
		"copper_mine":
			return "mine"
		"desert_trail":
			return "desert"
		"salt_river":
			return "river"
	return "neighborhood"

func _speak_native(text: String, speaker: String, voice_profile: Dictionary) -> void:
	if not DisplayServer.has_feature(DisplayServer.FEATURE_TEXT_TO_SPEECH):
		var warning := "TTS unavailable on this platform. Text was: %s" % text
		push_warning(warning)
		EventBus.log_debug(warning)
		EventBus.tts_unavailable.emit(text)
		return
	var voices := DisplayServer.tts_get_voices_for_language("en")
	var voice_id := resolve_tts_voice_id(voice_profile)
	var pitch := float(voice_profile.get("pitch", 1.0))
	var rate := float(voice_profile.get("rate", 0.95))
	DisplayServer.tts_stop()
	DisplayServer.tts_speak(text, voice_id, int(round(VOICE_VOLUME * 100.0)), pitch, rate, 0, true)

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
    music: [],
    ambience: [],
    unlocked: false,
    muted: false,
    quietUntil: 0,
    cueTimes: {}
  };
  const regionMix = {
    neighborhood: { freq: 146.83, musicGain: 0.012, ambFreq: 73, ambGain: 0.006, noiseGain: 0.004, fade: 2.1, pan: 0.24 },
    garage: { freq: 174.61, musicGain: 0.015, ambFreq: 58, ambGain: 0.008, noiseGain: 0.003, fade: 2.35, pan: -0.12 },
    mine: { freq: 130.81, musicGain: 0.013, ambFreq: 46, ambGain: 0.006, noiseGain: 0.004, fade: 2.0, pan: -0.18 },
    desert: { freq: 155.56, musicGain: 0.013, ambFreq: 64, ambGain: 0.005, noiseGain: 0.006, fade: 2.15, pan: 0.2 },
    river: { freq: 164.81, musicGain: 0.013, ambFreq: 82, ambGain: 0.005, noiseGain: 0.006, fade: 2.15, pan: 0.18 }
  };
  const cueProfiles = {
    reward_chime: { gap: 1300, post: 900 },
    soft_reward: { gap: 900, post: 650 },
    transition_soft: { gap: 650, post: 360 },
    dialogue_open: { gap: 500, post: 0 },
    dialogue_next: { gap: 650, post: 0 },
    dialogue_close: { gap: 500, post: 260 },
    soft_click: { gap: 180, post: 0 }
  };
  function ctx() {
    if (!state.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      state.ctx = new AudioContext();
      state.master = state.ctx.createGain();
      state.master.gain.value = 0.16;
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
      try { handle.node.stop(); } catch (_) {}
      try { handle.node.disconnect(); } catch (_) {}
      try { handle.gain.disconnect(); } catch (_) {}
    }, (dur + 0.08) * 1000);
  }
  function tone(freq, dur, gain, type, panValue) {
    const c = ctx();
    if (!c || state.muted || !state.unlocked) return;
    const osc = c.createOscillator();
    const g = c.createGain();
    const pan = c.createStereoPanner ? c.createStereoPanner() : null;
    osc.type = type || "sine";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(gain, c.currentTime + 0.025);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    if (pan) {
      pan.pan.value = panValue || 0;
      osc.connect(g).connect(pan).connect(state.master);
    } else {
      osc.connect(g).connect(state.master);
    }
    osc.start();
    osc.stop(c.currentTime + dur + 0.04);
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
    return ["neutral", "zira", "david"];
  }
  function chooseVoice(hint) {
    if (!("speechSynthesis" in window)) return null;
    const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
    if (!voices || !voices.length) return null;
    const enVoices = voices.filter((voice) => String(voice.lang || "").toLowerCase().startsWith("en"));
    const pool = enVoices.length ? enVoices : voices;
    const terms = voiceTerms(hint);
    for (const term of terms) {
      const found = pool.find((voice) => `${voice.name || ""} ${voice.voiceURI || ""} ${voice.lang || ""}`.toLowerCase().includes(term));
      if (found) return found;
    }
    return pool[0] || null;
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
        this.playRegion("neighborhood");
        return true;
      };
      if (c.state === "suspended") {
        c.resume().then(finish).catch(() => false);
      } else {
        finish();
      }
      return true;
    },
    playRegion(region) {
      const c = ctx();
      if (!c || state.muted || !state.unlocked) return;
      const mix = regionMix[region] || regionMix.neighborhood;
      state.music.forEach((handle) => fadeOutHandle(handle, mix.fade));
      state.ambience.forEach((handle) => fadeOutHandle(handle, mix.fade + 0.35));
      const music = c.createOscillator();
      const musicGain = c.createGain();
      music.type = "sine";
      music.frequency.value = mix.freq;
      musicGain.gain.setValueAtTime(0.0001, c.currentTime);
      musicGain.gain.exponentialRampToValueAtTime(mix.musicGain, c.currentTime + mix.fade);
      music.connect(musicGain).connect(state.master);
      music.start();
      state.music = [{ node: music, gain: musicGain }];
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
    cue(name, toneName) {
      if (!canCue(name)) return;
      if (name === "reward_chime") {
        duckSpace(0.72, 1.2);
        tone(523.25, 0.16, 0.025, "sine", -0.04);
        window.setTimeout(() => tone(659.25, 0.18, 0.022, "sine", 0.03), 105);
        window.setTimeout(() => tone(783.99, 0.24, 0.017, "sine", 0.0), 225);
        return;
      }
      if (name === "soft_reward") {
        duckSpace(0.8, 0.95);
        tone(440, 0.12, 0.016, "sine", -0.03);
        window.setTimeout(() => tone(554.37, 0.18, 0.014, "sine", 0.02), 120);
        return;
      }
      const cues = {
        chain_inspect: [196, 0.12, 0.018, "sawtooth"],
        pedal_rotate: [246.94, 0.16, 0.018, "triangle"],
        chain_align: [329.63, 0.14, 0.02, "triangle"],
        chain_seat: [392, 0.18, 0.022, "triangle"],
        wheel_spin_success: [493.88, 0.28, 0.024, "sine"],
        brake_check: [174.61, 0.11, 0.02, "square"],
        tire_press: [146.83, 0.13, 0.018, "triangle"],
        chain_roll: [220, 0.16, 0.018, "triangle"],
        wheel_spin: [440, 0.16, 0.018, "sine"],
        tube_slide: [123.47, 0.16, 0.014, "sawtooth"],
        patch_press: [164.81, 0.12, 0.018, "triangle"],
        pump_air: [110, 0.16, 0.016, "triangle"],
        dialogue_open: [392, 0.1, 0.009, "sine"],
        dialogue_next: [440, 0.055, 0.006, "sine"],
        dialogue_close: [329.63, 0.085, 0.006, "sine"],
        transition_soft: [220, 0.16, 0.01, "triangle"],
        soft_click: [toneName === "careful" ? 330 : 440, 0.055, 0.01, "triangle"]
      };
      const cue = cues[name] || cues.soft_click;
      if (name === "transition_soft") duckSpace(0.68, 0.8);
      tone(cue[0], cue[1], cue[2], cue[3], 0);
      if (name === "pedal_rotate" || name === "chain_roll") {
        window.setTimeout(() => tone(cue[0] * 1.12, 0.055, cue[2] * 0.45, cue[3], 0.04), 130);
      }
    },
    speak(text, speaker, pitch, rate, voiceHint, voiceVolume) {
      if (state.muted || !state.unlocked || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      duckSpace(0.58, 1.25);
      const utter = new SpeechSynthesisUtterance(text);
      const voice = chooseVoice(voiceHint);
      if (voice) utter.voice = voice;
      utter.rate = Number.isFinite(rate) ? rate : 0.95;
      utter.pitch = Number.isFinite(pitch) ? pitch : 1.0;
      utter.volume = Number.isFinite(voiceVolume) ? voiceVolume : 0.92;
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
