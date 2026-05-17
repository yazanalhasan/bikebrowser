from pathlib import Path
import collections
import json
import re

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "project_audit"


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def read(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return ""


def table(rows, headers):
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join(["---"] * len(headers)) + " |",
    ]
    for row in rows:
        lines.append("| " + " | ".join(str(cell).replace("|", "\\|").replace("\n", "<br>") for cell in row) + " |")
    return "\n".join(lines)


def write(name: str, body: str):
    (OUT / name).write_text(body.strip() + "\n", encoding="utf-8")


files = [path for path in ROOT.rglob("*") if path.is_file()]
dirs = [path for path in ROOT.rglob("*") if path.is_dir()]
scenes = sorted(path for path in files if path.suffix == ".tscn")
scripts = sorted(path for path in files if path.suffix == ".gd")
json_files = sorted(path for path in files if path.suffix == ".json")
by_ext = collections.Counter(path.suffix.lower() or "<none>" for path in files)
by_top = collections.defaultdict(list)
for path in files:
    by_top[path.relative_to(ROOT).parts[0]].append(path)

project_text = read(ROOT / "project.godot")
main_scene = ""
autoloads = []
editor_plugins = ""
section = ""
for line in project_text.splitlines():
    if line.startswith("[") and line.endswith("]"):
        section = line.strip("[]")
        continue
    if section == "application" and line.startswith("run/main_scene"):
        main_scene = line.split("=", 1)[1].strip().strip('"')
    if section == "autoload" and "=" in line:
        key, value = line.split("=", 1)
        autoloads.append((key.strip(), value.strip().strip('"').lstrip("*")))
    if section == "editor_plugins" and line.startswith("enabled="):
        editor_plugins = line.split("=", 1)[1]

res_ref_pattern = re.compile(r'(?:path|script|texture|stream)="(res://[^"]+)"|(?:preload|load)\("(res://[^"]+)"\)')
ext_res_pattern = re.compile(r'\[ext_resource[^\]]*type="([^"]+)"[^\]]*path="([^"]+)"[^\]]*id="([^"]+)"')
node_pattern = re.compile(r'\[node name="([^"]+)" type="([^"]+)"(?: parent="([^"]+)")?(?: instance=ExtResource\("([^"]+)"\))?')

scene_info = {}
script_info = {}
all_refs = []

for scene in scenes:
    text = read(scene)
    ext_resources = []
    ext_by_id = {}
    for match in ext_res_pattern.finditer(text):
        type_name, path, resource_id = match.groups()
        ext_resources.append((type_name, path, resource_id))
        ext_by_id[resource_id] = path
    nodes = []
    for match in node_pattern.finditer(text):
        name, type_name, parent, instance_id = match.groups()
        nodes.append({
            "name": name,
            "type": type_name,
            "parent": parent or ".",
            "instance": ext_by_id.get(instance_id, "") if instance_id else "",
        })
    refs = [match.group(1) or match.group(2) for match in res_ref_pattern.finditer(text)]
    all_refs.extend((scene, ref) for ref in refs)
    scene_info[rel(scene)] = {"ext": ext_resources, "nodes": nodes, "refs": refs}

for script in scripts:
    text = read(script)
    refs = [match.group(1) or match.group(2) for match in res_ref_pattern.finditer(text)]
    all_refs.extend((script, ref) for ref in refs)
    script_info[rel(script)] = {
        "extends": re.findall(r"^extends\s+(.+)", text, re.M)[:1],
        "class_name": re.findall(r"^class_name\s+([A-Za-z0-9_]+)", text, re.M),
        "signals": re.findall(r"^signal\s+([A-Za-z0-9_]+)", text, re.M),
        "refs": refs,
    }

text_resource_suffixes = {".tres", ".res", ".import", ".cfg", ".godot", ".json"}
already_scanned = set(scenes) | set(scripts)
for text_resource in files:
    if text_resource in already_scanned:
        continue
    if "project_audit" in text_resource.relative_to(ROOT).parts:
        continue
    if text_resource.suffix.lower() in text_resource_suffixes or text_resource.name == "project.godot":
        text = read(text_resource)
        refs = [match.group(1) or match.group(2) for match in res_ref_pattern.finditer(text)]
        all_refs.extend((text_resource, ref) for ref in refs)

json_data = {}
invalid_json = []
for path in json_files:
    try:
        json_data[rel(path)] = json.loads(read(path))
    except Exception as exc:
        invalid_json.append((rel(path), str(exc)))

missing_refs = []
seen_missing = set()
for source, ref in all_refs:
    target = ROOT / ref.replace("res://", "")
    key = (rel(source), ref)
    if not target.exists() and key not in seen_missing:
        seen_missing.add(key)
        missing_refs.append((rel(source), ref))

class_map = collections.defaultdict(list)
for path, info in script_info.items():
    for class_name in info["class_name"]:
        class_map[class_name].append(path)
duplicate_classes = {key: value for key, value in class_map.items() if len(value) > 1}

plugins = []
for plugin_cfg in sorted((ROOT / "addons").rglob("plugin.cfg")):
    text = read(plugin_cfg)
    name = ""
    script = ""
    for line in text.splitlines():
        if line.startswith("name="):
            name = line.split("=", 1)[1].strip().strip('"')
        if line.startswith("script="):
            script = line.split("=", 1)[1].strip().strip('"')
    plugins.append((name, rel(plugin_cfg), script, ("res://" + rel(plugin_cfg)) in editor_plugins))

regions = json_data.get("Data/regions/regions.json", {})
if not isinstance(regions, dict):
    regions = {}

dialogue_files = []
for path in sorted((ROOT / "Data" / "dialogue").glob("*.json")):
    data = json_data.get(rel(path), {})
    detected = "unknown"
    if isinstance(data, dict):
        if "lines" in data:
            detected = "lines-array"
        if "nodes" in data:
            detected = "nodes"
        if "dialogue_tree" in data:
            detected = "dialogue_tree"
    dialogue_files.append((rel(path), path.stem, detected, ", ".join(list(data.keys())[:8]) if isinstance(data, dict) else ""))
dialogue_ids = {Path(row[0]).stem for row in dialogue_files}

npc_scenes = sorted((ROOT / "Regions" / "NPCs").glob("*.tscn")) + sorted((ROOT / "Regions" / "Neighborhood").glob("MrChen.tscn"))
npc_rows = []
instances = []
for scene_path, info in scene_info.items():
    for node in info["nodes"]:
        instance = node["instance"]
        if "Regions/NPCs/" in instance or instance.endswith("/MrChen.tscn"):
            instances.append((scene_path, node["name"], instance))

for path in npc_scenes:
    text = read(path)
    npc_id = re.search(r'npc_id\s*=\s*"([^"]*)"', text)
    dialogue_id = re.search(r'dialogue_id\s*=\s*"([^"]*)"', text)
    script = re.search(r'\[ext_resource[^\]]*type="Script"[^\]]*path="([^"]+)"', text)
    d_id = dialogue_id.group(1) if dialogue_id else ""
    active = [scene for scene, _, instance in instances if instance == "res://" + rel(path)]
    npc_rows.append([
        rel(path),
        npc_id.group(1) if npc_id else "",
        d_id,
        "yes" if d_id in dialogue_ids else "NO",
        script.group(1) if script else "",
        ", ".join(active) if active else "not instanced in scanned region scenes",
    ])

quest_rows = []
quest_ids = {}
for path in sorted((ROOT / "Data" / "missions").glob("*.json")):
    data = json_data.get(rel(path), {})
    if isinstance(data, dict):
        quest_id = str(data.get("id", path.stem))
        quest_ids[quest_id] = path
        quest_rows.append({
            "file": rel(path),
            "id": quest_id,
            "name": data.get("title") or data.get("name", ""),
            "steps": len(data.get("steps", [])) if isinstance(data.get("steps", []), list) else 0,
            "prereq": data.get("prerequisites", []),
            "unlocks": data.get("unlocks", []),
            "next": data.get("next_in_chain", ""),
            "reward": data.get("reward", {}),
        })

quest_registry_text = read(ROOT / "Core" / "QuestRegistry" / "QuestRegistry.gd")
registered_paths = re.findall(r'"(res://Data/missions/[^"]+\.json)"', quest_registry_text)
registered_ids = []
for path in registered_paths:
    data = json_data.get(path.replace("res://", ""), {})
    if isinstance(data, dict):
        registered_ids.append(str(data.get("id", Path(path).stem)))

quest_missing = []
for quest in quest_rows:
    for field in ("prereq", "unlocks"):
        values = quest[field]
        if isinstance(values, str):
            values = [values]
        if isinstance(values, list):
            for value in values:
                if str(value) and str(value) not in quest_ids:
                    quest_missing.append((quest["id"], field, value))
    if quest["next"] and quest["next"] not in quest_ids:
        quest_missing.append((quest["id"], "next_in_chain", quest["next"]))

audio_files = sorted(path for path in files if path.suffix.lower() in (".mp3", ".wav", ".ogg"))
audio_text = read(ROOT / "Core" / "AudioService" / "AudioService.gd")
audio_refs = sorted(set(re.findall(r'"(res://Assets/Audio/[^"]+)"', audio_text)))

top_rows = []
for top, paths in sorted(by_top.items()):
    top_rows.append([
        top,
        len(paths),
        sum(1 for path in paths if path.suffix == ".tscn"),
        sum(1 for path in paths if path.suffix == ".gd"),
        sum(1 for path in paths if path.suffix == ".json"),
        f"{sum(path.stat().st_size for path in paths) / 1024 / 1024:.1f} MB",
    ])

write("project_tree.md", f"""
# Project Tree Audit

Root: `{ROOT}`

## Inventory Summary

- Total files: {len(files)}
- Total folders: {len(dirs)}
- Scenes (`.tscn`): {len(scenes)}
- GDScript files (`.gd`): {len(scripts)}
- JSON files: {len(json_files)} ({len(json_files) - len(invalid_json)} valid, {len(invalid_json)} invalid)
- Main scene: `{main_scene}`

## Top-Level Folder Counts

{table(top_rows, ["Folder", "Files", "Scenes", "Scripts", "JSON", "Size"])}

## Common File Extensions

{table(by_ext.most_common(30), ["Extension", "Count"])}

## Broken `res://` References Found By Text Scan

{table(missing_refs[:100], ["Source", "Missing reference"]) if missing_refs else "No broken `res://` references found by text scan."}

## Duplicate Global Classes

{table([[name, ", ".join(paths)] for name, paths in duplicate_classes.items()], ["class_name", "Scripts"]) if duplicate_classes else "No duplicate `class_name` declarations found."}

## Suspicious Generated Content

- `.godot/` contains local import/cache artifacts.
- `exports/web/` contains generated web export output.
- Character folders include raw sheets, cleaned sheets, individual frame PNGs, GIF previews, and import metadata.
- Multiple generated addon/runtime systems overlap with core systems.
""")

write("runtime_architecture.md", f"""
# Runtime Architecture Audit

## Autoloads

{table([[name, path, "yes" if (ROOT / path.replace("res://", "")).exists() else "NO"] for name, path in autoloads], ["Singleton", "Path", "Exists"])}

## Addon Plugin Files

{table([[name, path, script, "enabled" if enabled else "installed/disabled"] for name, path, script, enabled in plugins], ["Plugin", "plugin.cfg", "Script", "Status"])}

## Startup Flow

```mermaid
flowchart TD
  A["Godot launches project"] --> B["project.godot run/main_scene"]
  B --> C["NeighborhoodStreet.tscn"]
  C --> D["RegionScene + LayoutApplier"]
  D --> E["EventBus.region_entered"]
  E --> F["AudioService.play_region_bed"]
  C --> G["ZuzuController"]
  G --> H["NPC and transition Area2Ds"]
```

## Interaction Flow

```mermaid
flowchart TD
  Player["Player in group player"] --> NPC["NpcInteraction / AnimatedNpcInteraction"]
  NPC --> Dialogue["/root/DialogueManager.start_dialogue"]
  Dialogue --> Data["Data/dialogue/<id>.json"]
  Data --> Event["EventBus.dialogue_requested"]
  Event --> UI["DialogController"]
  Event --> Audio["AudioService.speak via UI feedback"]
```

## Region Loading Flow

```mermaid
flowchart TD
  Zone["TransitionZone"] --> Registry["RegionRegistry.change_region"]
  Registry --> FadeOut["Fade overlay out"]
  Registry --> Save["SaveService.save_now"]
  Registry --> Scene["change_scene_to_file"]
  Scene --> Region["New RegionScene"]
  Region --> Spawn["Layout spawn anchor"]
  Registry --> FadeIn["Fade overlay in"]
```

## Architecture Findings

- IMPLEMENTED: Autoload-driven runtime architecture exists and the main scene points to the current neighborhood world.
- IMPLEMENTED: EventBus is the main signal hub.
- PARTIALLY IMPLEMENTED: Region transition, save, dialogue, quest, reward, and audio flows are present but not fully unified with generated addon systems.
- RISK: Addon classes can shadow autoload names, especially `DialogueManager`.
""")

scene_rows = []
for key in sorted(path for path in scene_info if path.startswith("Regions/")):
    info = scene_info[key]
    types = collections.Counter(node["type"] for node in info["nodes"])
    instances_here = sorted(set(node["instance"] for node in info["nodes"] if node["instance"]))
    scene_rows.append([key, len(info["nodes"]), ", ".join(f"{k}:{v}" for k, v in types.most_common(6)), ", ".join(instances_here[:5])])

write("current_gameplay_state.md", f"""
# Current Gameplay State

## Current Boot

- Main scene: `{main_scene}`.
- This means `Boot.tscn` is not the active startup scene.
- The player currently starts in the neighborhood hub when F5 runs the configured project.

## What Exists Now

{table(scene_rows, ["Scene", "Node count", "Common node types", "Instanced scenes"])}

## Implemented

- Player movement script and player-group based interactions.
- NPC interaction prompts and dialogue request flow.
- Region transitions between neighborhood, garage, copper mine, desert trail, and salt river.
- Core quest, reward, save, and audio autoloads.

## Partially Implemented

- Mission JSON exists beyond the quests registered in `QuestRegistry`.
- Educational data exists but is not all surfaced in gameplay.
- Generated Projects 1-20 are present, but many are demos/libraries rather than active gameplay systems.

## Placeholder / Dead Ends

- Some region visuals are still simple blockout geometry plus prop sprites.
- Some NPC/dialogue assets exist only as data or prefab scenes.
- Some generated autoloads are available but do not participate in the first gameplay loop.

## Verification Notes

A headless scene-load pass was saved to `project_audit/headless_scene_check.txt`. The checked major scenes loaded without script parse errors or missing-resource errors. This does not prove interaction/game feel quality, because movement, camera, audio, and dialogue timing still require manual native Godot playtesting.
""")

write("scene_visual_audit.md", f"""
# Scene-by-Scene Visual Audit

Screenshots were not captured in this automated pass because native Godot rendering requires the local editor/game window. This audit uses actual `.tscn` node trees and the current observed game screenshots from the session.

{table(scene_rows, ["Scene", "Node count", "Common node types", "Instanced scenes"])}

## Visual Findings

- IMPLEMENTED: The current neighborhood is no longer blank; it contains Zuzu, NPCs, props, and HUD text.
- PARTIALLY IMPLEMENTED: Mine, desert, river, garage, and showcase scenes exist as region scenes, but they need manual visual playtesting.
- PLACEHOLDER: Several scenes use ColorRect/Sprite2D blockout layers instead of cohesive tilemap/environment systems.
- RISK: Pixel density and scale vary across generated props, characters, and vector-derived garage assets.
- OPPORTUNITY: Formalize Background, Ground, PropsBack, NPCs, Player, PropsFront, Transitions, Camera, UI layers across all regions.

## Headless Scene Load Verification

`project_audit/headless_scene_check.txt` records a Godot headless load pass for the main neighborhood, garage, mine, desert, river, system showcase, HUD, and dialogue box scenes. No checked scene emitted a parse error or missing-resource error. Most one-shot headless launches emitted Godot shutdown warnings about ObjectDB/resources still in use; these should be treated as verification caveats until reproduced in the editor profiler, not as confirmed in-game failures.
""")

write("npc_system_audit.md", f"""
# NPC System Audit

## NPC Matrix

{table(npc_rows, ["NPC Scene", "npc_id", "dialogue_id", "Dialogue exists", "Script", "Active instances"])}

## Dialogue Files

{table(dialogue_files, ["File", "ID", "Detected format", "Top-level keys"])}

## Findings

- IMPLEMENTED: NPC scenes exist for core mentors and use Area2D-based interaction.
- IMPLEMENTED: Current regions instantiate the central mentor NPCs.
- PARTIALLY IMPLEMENTED: Dialogue files use mixed schemas (`lines-array`, `dialogue_tree`, and addon-style `nodes`), so all data is not guaranteed to render through one UI.
- PARTIALLY IMPLEMENTED: NPC schedules exist as data, but no active schedule applier was found in the scene graph.
- BROKEN/RISK: Calling `DialogueManager.start_dialogue` by class name can fail because the addon declares `class_name DialogueManager`; use `/root/DialogueManager` for the autoload.
""")

quest_matrix = []
for quest in quest_rows:
    quest_matrix.append([
        quest["file"],
        quest["id"],
        quest["name"],
        quest["steps"],
        "REGISTERED" if quest["id"] in registered_ids else "DATA ONLY",
        ", ".join(quest["prereq"]) if isinstance(quest["prereq"], list) else quest["prereq"],
        ", ".join(quest["unlocks"]) if isinstance(quest["unlocks"], list) else quest["unlocks"],
        quest["next"],
    ])

write("quest_system_audit.md", f"""
# Quest System Audit

## Live Registry

`Core/QuestRegistry/QuestRegistry.gd` currently hardcodes:

{table([[path, qid] for path, qid in zip(registered_paths, registered_ids)], ["Path", "Quest ID"])}

## Mission Files

{table(quest_matrix, ["File", "ID", "Name/Title", "Steps", "Runtime status", "Prerequisites", "Unlocks", "Next"])}

## Broken Quest References

{table(quest_missing, ["Quest", "Field", "Missing ID"]) if quest_missing else "No missing prerequisite/unlock/next references found by static JSON scan."}

## Findings

- IMPLEMENTED: Quest start/objective/complete/reward/save flow exists.
- PARTIALLY IMPLEMENTED: Most mission JSON is generated content, not live content, until registered or dynamically loaded.
- PLACEHOLDER: Prerequisite/unlock/next chain fields are not enforced by the current registry code.
- RISK: Dialogue or interaction actions can reference quests that the registry does not know about.
""")

edges = []
for quest in quest_rows:
    for value in quest["unlocks"] if isinstance(quest["unlocks"], list) else ([] if not quest["unlocks"] else [quest["unlocks"]]):
        edges.append((quest["id"], value, "-->"))
    for value in quest["prereq"] if isinstance(quest["prereq"], list) else ([] if not quest["prereq"] else [quest["prereq"]]):
        edges.append((value, quest["id"], "-.->"))
    if quest["next"]:
        edges.append((quest["id"], quest["next"], "-->"))
mermaid = ["flowchart TD"]
if edges:
    for src, dst, arrow in edges:
        src_id = re.sub(r"[^A-Za-z0-9_]", "_", str(src))
        dst_id = re.sub(r"[^A-Za-z0-9_]", "_", str(dst))
        mermaid.append(f'  {src_id}["{src}"] {arrow} {dst_id}["{dst}"]')
else:
    for quest in quest_rows:
        node_id = re.sub(r"[^A-Za-z0-9_]", "_", quest["id"])
        mermaid.append(f'  {node_id}["{quest["id"]}"]')

write("quest_flow_map.md", f"""
# Quest Flow Map

```mermaid
{chr(10).join(mermaid)}
```

Solid arrows are unlock/next relationships. Dotted arrows are prerequisites. Runtime availability is currently narrower than the graph because only `{", ".join(registered_ids)}` are registered.
""")

write("audio_system_audit.md", f"""
# Audio + Music Audit

## Audio Assets

{table([[rel(path), "yes" if Path(str(path) + ".import").exists() else "unknown"] for path in audio_files], ["Audio file", "Import metadata"])}

## AudioService References

{table([[path, "yes" if (ROOT / path.replace("res://", "")).exists() else "NO"] for path in audio_refs], ["Referenced path", "Exists"])}

## Findings

- IMPLEMENTED: AudioService is an autoload and creates native `AudioStreamPlayer` nodes outside web builds.
- IMPLEMENTED: MP3 files for neighborhood, garage, copper mine, salt river, title, dry wash, and stingers exist.
- PARTIALLY IMPLEMENTED: `desert_trail` is not mapped in `MUSIC_BY_REGION`, so it uses default neighborhood music.
- PARTIALLY IMPLEMENTED: Web audio is oscillator/speechSynthesis based; native Godot uses MP3 and DisplayServer TTS.
- PLATFORM DEPENDENT: Native TTS depends on OS/Godot support.
- RISK: Music starts on `EventBus.region_entered`; running a scene directly without region entry may produce silence.
""")

write("player_controller_audit.md", """
# Player Controller Audit

Primary script: `Systems/World/ZuzuController.gd`

## Findings

- IMPLEMENTED: A dedicated player controller exists and is referenced by playable region scenes.
- IMPLEMENTED: NPC and transition systems depend on the player being in group `player`.
- PARTIALLY IMPLEMENTED: Camera behavior is scene-local; generated camera runtime exists but is not clearly the canonical active camera system.
- PARTIALLY IMPLEMENTED: Quest, inventory, and save integration are indirect through interactions and autoloads, not owned by a full player state machine.
- NEEDS MANUAL PROFILING: Movement feel, diagonal speed, jitter, and collision quality require running the native Godot window.

```mermaid
flowchart LR
  Zuzu["ZuzuController"] --> Group["player group"]
  Group --> NPC["NPC Area2D"]
  Group --> Zone["TransitionZone"]
  NPC --> Dialogue["DialogueManager"]
  Zone --> Region["RegionRegistry"]
```
""")

large_runtime = sorted(
    [path for path in files if path.suffix.lower() in (".png", ".gif", ".aseprite", ".mp3", ".pck", ".wasm")],
    key=lambda path: path.stat().st_size,
    reverse=True,
)[:30]

write("performance_audit.md", f"""
# Performance + Memory Audit

## Largest Runtime-Relevant Files

{table([[rel(path), f"{path.stat().st_size / 1024 / 1024:.1f} MB"] for path in large_runtime], ["File", "Size"])}

## Findings

- GENERATED ARTIFACTS: `.godot/` and `exports/web/` are large generated folders inside the project tree.
- DUPLICATION: Character art often exists as raw sheet, cleaned sheet, per-frame PNGs, GIF, import metadata, and Godot cache output.
- SCENE LOADING: Region transitions use whole-scene swaps, which is acceptable now but can hitch as regions grow.
- AUDIO: MP3 tracks are loaded on demand by path rather than all preloaded at startup.
- PHYSICS: Current scenes appear light on collision shapes, so physics is unlikely to be a bottleneck yet.
- UNKNOWN: Real draw calls, texture memory, and overdraw require running Godot profiler/render debug locally.
""")

education_files = [
    rel(path) for path in sorted((ROOT / "Data").rglob("*.json"))
    if any(part in rel(path) for part in ("domains", "discovery", "biology", "ecology", "notes", "badges", "missions"))
]
write("educational_systems_audit.md", f"""
# Educational Systems Audit

## Educational Data Files

{table([[path] for path in education_files[:160]], ["File"])}

## Findings

- IMPLEMENTED: Mechanics, missions, discovery, ecology, biology, notes, and badge data exist.
- PARTIALLY IMPLEMENTED: Some dialogue and mission content teaches bike repair/ecology/biology concepts.
- PARTIALLY IMPLEMENTED: Achievement, localization, and TTS systems exist but are not fully embedded in every educational loop.
- GENERATED BUT UNUSED: Several educational/data systems are scaffolded but not yet connected to moment-to-moment gameplay.
- RISK: Without a canonical quest/objective system, educational progression can exist in JSON but remain unreachable.
""")

region_rows = []
for region_id, region in regions.items():
    scene_path = region.get("scenePath", "")
    scene_exists = (ROOT / scene_path.replace("res://", "")).exists()
    scene_text = read(ROOT / scene_path.replace("res://", "")) if scene_exists else ""
    layout = re.search(r'layout_path\s*=\s*"([^"]+)"', scene_text)
    region_rows.append([
        region_id,
        region.get("title", ""),
        scene_path,
        "yes" if scene_exists else "NO",
        layout.group(1) if layout else "",
        ", ".join(region.get("spawns", {}).keys()),
    ])

write("world_structure_audit.md", f"""
# World Structure Audit

## Registered Regions

{table(region_rows, ["Region ID", "Title", "Scene", "Scene exists", "Layout path", "Spawns"])}

## Findings

- IMPLEMENTED: `RegionRegistry` loads region metadata from JSON.
- IMPLEMENTED: Current world is discrete region scenes connected by transition zones.
- PARTIALLY IMPLEMENTED: Spawn anchors are layout-driven where scenes use `LayoutApplier`.
- NOT IMPLEMENTED: Streaming/chunked world loading.
- RISK: The region graph is currently simple; expanding areas needs a transition map and startup validator.
""")

write("art_direction_audit.md", """
# Art Direction Audit

## Findings

- IMPLEMENTED: Current neighborhood uses a warmer, more populated visual presentation than the earlier blank boot scene.
- IMPLEMENTED: Character and prop asset families exist for mentors, Zuzu, desert, garage, mine, river, and UI.
- PARTIALLY IMPLEMENTED: The Sonoran neighborhood direction is present, but region scenes still mix pixel characters, generated props, simple rectangles, and vector-derived assets.
- PLACEHOLDER: Some backgrounds and roads are blockout geometry rather than final tilemaps/painted layers.
- RISK: Scale and pixel density are not enforced, so new generated assets can feel mismatched.
- OPPORTUNITY: Define per-region palette, shadow, outline, and scale rules before placing all 133+ props.
""")

write("save_system_audit.md", """
# Save System Audit

## Save Systems Present

- `Core/SaveService/SaveService.gd`: live autoload used by quests/regions.
- `SaveSystem/SaveManager.gd`: generated reusable save-slot manager, autoloaded as `SaveManagerRuntime`.
- `SaveSystem/AutoSaveManager.gd`: generated autosave helper.
- `SaveSystem/CloudSyncAdapter.gd`: generated cloud sync scaffold.

## Live Save Flow

```mermaid
flowchart TD
  Quest["QuestRegistry changes"] --> Save["SaveService.save_now"]
  Region["RegionRegistry transition"] --> Save
  Save --> Payload["build_save_payload"]
  Payload --> File["user://bikebrowser_save.json"]
  Save --> Event["EventBus.save_requested"]
```

## Findings

- IMPLEMENTED: SaveService serializes current region/spawn, regions, quests, discovery, inventory, timestamp, and player stub data.
- PARTIALLY IMPLEMENTED: Correct reload depends on every subsystem having an apply/deserialize path; static audit did not confirm full load-on-boot restoration.
- RISK: Two save systems can diverge unless one is made canonical.
""")

write("addon_ecosystem_audit.md", f"""
# Addon Ecosystem Audit

## Addon Matrix

{table([[name, path, script, "enabled" if enabled else "installed/disabled"] for name, path, script, enabled in plugins], ["Addon", "plugin.cfg", "Script", "Status"])}

## Findings

- ACTIVE EDITOR ADDON: `nklbdev.importality`.
- INSTALLED/DISABLED: ReusableUI, NameGenerator, DialogueSystem, ProceduralQuest, InventorySystem, TerrainGenerator, AsepriteWizard.
- RUNTIME AUTOLOADED: Some disabled addons are still used as runtime autoloads.
- GENERATED BUT UNUSED: Many addons are complete library/demo systems rather than active gameplay features.
- RISK: Addon global classes can collide with core autoload expectations.
""")

write("master_dossier.md", f"""
# BikeBrowserWorld Master Engineering Dossier

## Current State Of The Game

BikeBrowserWorld is a Godot 4.6 2D adventure/education prototype. It now boots to `{main_scene}` and has a region-based world with neighborhood, garage, mine, desert, river, and system showcase scenes. The codebase also contains a large ecosystem of generated addons and tools from Projects 1-20.

## What Actually Works

- Main scene points at the current neighborhood.
- Player, NPCs, props, HUD, and transition zones exist in region scenes.
- RegionRegistry can transition between registered scenes.
- Dialogue requests are routed through EventBus.
- QuestRegistry can run the two registered quests: `{", ".join(registered_ids)}`.
- Music assets exist and AudioService can play native MP3 streams.

## What Is Partially Working

- Many quests exist as JSON but are not registered.
- Dialogue data exists in multiple schemas.
- Save, inventory, achievement, localization, and camera systems exist in duplicate/generated forms.
- TTS is implemented but platform-dependent.
- Educational data is broad but not consistently surfaced in live gameplay.

## What Is Placeholder

- Some region environments use blockout geometry.
- Some addons are showcase-only.
- NPC schedules and several educational systems are data-only.
- Generated Projects 1-20 are present but not all integrated into the boot gameplay loop.

## What Is Missing

- One canonical save/dialogue/quest/inventory/achievement architecture.
- Dynamic mission loading and validation.
- Unified dialogue schema.
- A tested first-15-minute quest chain.
- Startup validators for missing resources, dialogue IDs, quest IDs, spawn anchors, and audio tracks.

## Most Important Systems

1. EventBus
2. RegionRegistry
3. ZuzuController
4. DialogueManager + DialogController
5. QuestRegistry + RewardBridge
6. SaveService
7. AudioService
8. LayoutApplier

## Most Fragile Systems

- DialogueManager class/autoload collision.
- Quest registry hardcoded path list.
- Duplicate generated runtime managers.
- Audio/TTS platform behavior.
- Save restoration path.

## Highest Priority Fixes

1. Choose canonical runtime systems and demote duplicates to library/demo status.
2. Convert QuestRegistry to folder-driven validated loading.
3. Normalize dialogue JSON to one schema.
4. Build the first 15-minute loop around Mrs. Ramirez, Mr. Chen, chain repair, garage repair, and one reward.
5. Add startup validation reports inside Godot.

## Recommended World Structure

```mermaid
flowchart TD
  N["Neighborhood Street"] --> G["Garage"]
  N --> M["Copper Mine"]
  N --> D["Desert Trail"]
  N --> R["Salt River"]
  G --> N
  M --> N
  D --> N
  R --> N
```

## Recommended Region Hierarchy

Root `RegionScene` with child layers: Background, Ground, PropsBack, NPCs, Player, PropsFront, Transitions, Camera, UI.

## Recommended Save Architecture

Use `Core/SaveService` as canonical. Treat generated SaveManager as a reusable library until intentionally integrated. Add apply/deserialize methods for all saved subsystem payloads.

## Recommended Quest Architecture

Load all mission JSON from `Data/missions`, validate against a schema, enforce prerequisites/unlocks/next-chain, and emit errors for unreachable quests.

## Recommended NPC Architecture

Use a single NPC contract: `npc_id`, `display_name`, `dialogue_id`, `quest_hooks`, `interaction_radius`, `schedule_id`. Validate dialogue and quest hooks at startup.

## Recommended Audio Architecture

Keep `AudioService` canonical. Add complete region-to-track mapping, a visible audio debug/test scene, and graceful fallback when native TTS is unavailable.

## Recommended Gameplay Loop

Neighborhood exploration -> Mrs. Ramirez safety check -> Mr. Chen chain repair -> garage repair interaction -> reward/badge -> choose next region.
""")

print(f"wrote {len(list(OUT.glob('*.md')))} markdown files")
print(f"files={len(files)} scenes={len(scenes)} scripts={len(scripts)} json={len(json_files)} missing_refs={len(missing_refs)} quests={len(quest_rows)} npcs={len(npc_rows)}")
