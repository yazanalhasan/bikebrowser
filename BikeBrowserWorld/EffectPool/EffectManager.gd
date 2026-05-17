extends Node
class_name EffectManager

const EffectPoolScript := preload("res://EffectPool/EffectPool.gd")

@export var max_simultaneous_effects: int = 32
@export var effect_pool_path: NodePath
@export var config: Dictionary = {
	"sparkle": { "preload_count": 10, "max_simultaneous": 5, "lifetime": 0.8, "sound": "sparkle.wav" },
	"impact_dust": { "preload_count": 8, "max_simultaneous": 4, "lifetime": 0.5, "sound": "impact.wav" },
	"smoke_puff": { "preload_count": 6, "max_simultaneous": 4, "lifetime": 0.9, "sound": "smoke.wav" },
	"bubble_pop": { "preload_count": 8, "max_simultaneous": 5, "lifetime": 0.6, "sound": "bubble.wav" },
	"celebration_star": { "preload_count": 6, "max_simultaneous": 3, "lifetime": 1.1, "sound": "celebration.wav" }
}

var _pool: Node
var _active_counts: Dictionary = {}
var _active_effects: Array[Node] = []

func _ready() -> void:
	_pool = get_node_or_null(effect_pool_path)
	if _pool == null:
		_pool = EffectPoolScript.new()
		add_child(_pool)

func spawn(effect_name: String, position: Vector2) -> Node2D:
	if not _can_spawn(effect_name):
		return null
	var effect: Node2D = _pool.spawn(effect_name, position)
	if effect == null:
		return null
	_track(effect_name, effect)
	return effect

func spawn_at_node(effect_name: String, node: Node2D) -> Node2D:
	if node == null:
		return null
	return spawn(effect_name, node.global_position)

func cleanup_old_effects() -> void:
	while _active_effects.size() > max_simultaneous_effects:
		var effect: Node = _active_effects.pop_front()
		if is_instance_valid(effect):
			effect.queue_free()

func _can_spawn(effect_name: String) -> bool:
	var effect_config: Dictionary = config.get(effect_name, {})
	var max_for_type := int(effect_config.get("max_simultaneous", max_simultaneous_effects))
	return int(_active_counts.get(effect_name, 0)) < max_for_type and _active_effects.size() < max_simultaneous_effects

func _track(effect_name: String, effect: Node) -> void:
	_active_counts[effect_name] = int(_active_counts.get(effect_name, 0)) + 1
	_active_effects.append(effect)
	if effect.has_signal("finished"):
		effect.finished.connect(func(_done: Node) -> void: _untrack(effect_name, effect), CONNECT_ONE_SHOT)
	cleanup_old_effects()

func _untrack(effect_name: String, effect: Node) -> void:
	_active_counts[effect_name] = maxi(0, int(_active_counts.get(effect_name, 1)) - 1)
	_active_effects.erase(effect)
