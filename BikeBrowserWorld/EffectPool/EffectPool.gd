extends Node
class_name EffectPool

@export var effect_paths: Dictionary = {
	"sparkle": "res://EffectPool/effects/sparkle.tscn",
	"impact_dust": "res://EffectPool/effects/impact_dust.tscn",
	"spark": "res://EffectPool/effects/spark.tscn",
	"smoke_puff": "res://EffectPool/effects/smoke_puff.tscn",
	"bubble_pop": "res://EffectPool/effects/bubble_pop.tscn",
	"leaves_dust_trail": "res://EffectPool/effects/leaves_dust_trail.tscn",
	"celebration_star": "res://EffectPool/effects/celebration_star.tscn",
	"error_x": "res://EffectPool/effects/error_x.tscn"
}
@export var preload_counts: Dictionary = {
	"sparkle": 10,
	"impact_dust": 8,
	"spark": 8,
	"smoke_puff": 6,
	"bubble_pop": 8,
	"leaves_dust_trail": 8,
	"celebration_star": 6,
	"error_x": 4
}

var _packed_effects: Dictionary = {}
var _available: Dictionary = {}

func _ready() -> void:
	preload_effects()

func preload_effects() -> void:
	for effect_name in effect_paths.keys():
		var scene := load(str(effect_paths[effect_name])) as PackedScene
		if scene == null:
			push_warning("Missing effect scene: %s" % effect_paths[effect_name])
			continue
		_packed_effects[effect_name] = scene
		_available[effect_name] = []
		for _i in range(int(preload_counts.get(effect_name, 1))):
			var effect := _create_effect(effect_name)
			effect.visible = false
			_available[effect_name].append(effect)

func spawn(effect_name: String, position: Vector2) -> Node2D:
	var effect := _take_effect(effect_name)
	if effect == null:
		return null
	effect.global_position = position
	if effect.has_method("play"):
		effect.play()
	return effect

func spawn_at_node(effect_name: String, node: Node2D) -> Node2D:
	if node == null:
		return null
	return spawn(effect_name, node.global_position)

func release(effect_name: String, effect: Node) -> void:
	if not _available.has(effect_name):
		effect.queue_free()
		return
	if effect.has_method("reset_effect"):
		effect.reset_effect()
	_available[effect_name].append(effect)

func _take_effect(effect_name: String) -> Node2D:
	if not _packed_effects.has(effect_name):
		return null
	var pool: Array = _available.get(effect_name, [])
	if pool.is_empty():
		return _create_effect(effect_name)
	return pool.pop_back()

func _create_effect(effect_name: String) -> Node2D:
	var scene := _packed_effects[effect_name] as PackedScene
	var effect := scene.instantiate() as Node2D
	add_child(effect)
	if effect.has_signal("finished"):
		effect.finished.connect(func(done_effect: Node) -> void: release(effect_name, done_effect))
	return effect
