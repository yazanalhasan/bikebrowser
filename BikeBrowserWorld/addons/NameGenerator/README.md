# Name Generator Addon for Godot 4

Generates culturally diverse random names for NPCs.

## Installation

1. Copy folder to `res://addons/NameGenerator/`
2. Enable in Project Settings > Plugins

## Usage

```gdscript
var name = NameGenerator.get_random_name("sonoran", "male")
var full = NameGenerator.get_full_name("arabic")
var culture = NameGenerator.get_random_culture()
```

## Categories

`sonoran`, `quechua`, `arabic`, `turkish`, `persian`, `swahili`, `mandarin`, `fantasy`
