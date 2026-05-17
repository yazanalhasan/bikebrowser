# Data Contract Audit — Active-Slice Objective ID Consistency

**Date:** 2026-05-17
**Scope:** Active first-15-minute missions — `bike_safety_check`, `first_safety_check`, `chain_repair`, `flat_tire_repair`. Cross-references checked against `Systems/Interactions/*.gd`, `Systems/UI/DialogController.gd`, and `tests/vertical_slice_check.gd`.

---

## 1. Cross-reference tables

### `bike_safety_check.json` (5 steps)

| Mission step ID | JSON line | Recorded by | Recorder line | vertical_slice_check.gd | Status |
|---|---|---|---|---|---|
| `talk_to_mrs_ramirez` | bike_safety_check.json:7 | `Systems/UI/DialogController.gd` | DialogController.gd:73 | — | ✅ |
| `check_brakes` | bike_safety_check.json:12 | `Systems/Interactions/SafetyCheckStation.gd` (brake_verified path) | SafetyCheckStation.gd:140 | — | ✅ |
| `check_tires` | bike_safety_check.json:17 | `Systems/Interactions/SafetyCheckStation.gd` (step iter) | SafetyCheckStation.gd:116 + steps[1] | — | ✅ |
| `check_chain` | bike_safety_check.json:22 | `Systems/Interactions/SafetyCheckStation.gd` (step iter) | SafetyCheckStation.gd:116 + steps[2] | — | ✅ |
| `report_safety_check` | bike_safety_check.json:27 | `Systems/Interactions/SafetyCheckStation.gd` (step iter) | SafetyCheckStation.gd:116 + steps[3] | — | ✅ |

**All IDs match.** No vertical_slice_check coverage for `bike_safety_check` — the test only covers `chain_repair` and `flat_tire_repair`.

### `first_safety_check.json` (3 steps)

| Mission step ID | JSON line | Recorded by | Recorder line | vertical_slice_check.gd | Status |
|---|---|---|---|---|---|
| `talk_to_mrs_ramirez` | first_safety_check.json:7 | DialogController.gd:73 (BUT see §2) | DialogController.gd:73 | — | ⚠️ ambiguous |
| `inspect_bike` | first_safety_check.json:12 | **none** | — | — | ❌ DRIFT |
| `report_findings` | first_safety_check.json:17 | **none** | — | — | ❌ DRIFT |

**`first_safety_check` is orphan data.** No script can advance `inspect_bike` or `report_findings`. If `QuestRegistry.start_quest("first_safety_check")` is ever called, the quest sits in `active_quests` forever. The project's own `project_audit/quest_system_audit.md` already flags this as `DATA ONLY`.

### `chain_repair.json` (6 steps)

| Mission step ID | JSON line | Recorded by | Recorder line | vertical_slice_check.gd | Status |
|---|---|---|---|---|---|
| `talk_to_mr_chen` | chain_repair.json:9 | DialogController.gd:71 | DialogController.gd:71 | not covered | ✅ |
| `inspect_chain` | chain_repair.json:14 | ChainHotspot.gd (step iter) | ChainHotspot.gd:115 + steps[0] | line 116 ✅ | ✅ |
| `rotate_pedals` | chain_repair.json:19 | ChainHotspot.gd (step iter) | ChainHotspot.gd:115 + steps[1] | line 117 ✅ | ✅ |
| `align_chain` | chain_repair.json:24 | ChainHotspot.gd (step iter) | ChainHotspot.gd:115 + steps[2] | line 118 ✅ | ✅ |
| `seat_chain` | chain_repair.json:29 | ChainHotspot.gd (step iter) | ChainHotspot.gd:115 + steps[3] | line 119 ✅ | ✅ |
| `test_rotation` | chain_repair.json:34 | ChainHotspot.gd (step iter) | ChainHotspot.gd:115 + steps[4] | line 120 ✅ | ✅ |

**Perfect coverage.**

### `flat_tire_repair.json` (4 steps)

| Mission step ID | JSON line | Recorded by | Recorder line | vertical_slice_check.gd | Status |
|---|---|---|---|---|---|
| `inspect_wheel` | flat_tire_repair.json:7 | TireRepairStation.gd:88 + steps[0] | TireRepairStation.gd:88 | line 132 ✅ | ✅ |
| `remove_tube` | flat_tire_repair.json:12 | TireRepairStation.gd:88 + steps[1] | TireRepairStation.gd:88 | line 133 ✅ | ✅ |
| `apply_patch` | flat_tire_repair.json:17 | TireRepairStation.gd:88 + steps[2] | TireRepairStation.gd:88 | line 134 ✅ | ✅ |
| `inflate_tire` | flat_tire_repair.json:22 | TireRepairStation.gd:88 + steps[3] | TireRepairStation.gd:88 | line 135 ✅ | ✅ |

**Perfect coverage.**

---

## 2. Drift findings

1. **`first_safety_check.json` is orphan data** — 2 of 3 objectives have no recorder; the mission is unfinishable through gameplay. **Recommendation:** delete the file OR explicitly mark it `"status": "deprecated"` and have `QuestRegistry.start_quest` refuse deprecated entries. Otherwise it'll be picked up if any future caller starts it.
2. **DialogController has TWO `talk_to_*` recorders for two different quests on the same NPC line range** (DialogController.gd:71-73). It is not visible from the grep alone whether both can fire for a single dialog action. If both `bike_safety_check` AND `first_safety_check` are activated simultaneously, both `talk_to_mrs_ramirez` calls may resolve — needs verification by reading DialogController.gd context (out of scope for this audit; flagging).
3. **vertical_slice_check.gd does not assert** `bike_safety_check` completes. The slice's name implies safety check coverage, but only chain + tire are walked. **Recommendation:** add `bike_safety_check` objective walkthrough to the slice test (4 lines).
4. **Schema variance does not currently cause drift in the active slice**, but the inconsistent `name` vs `title`, `giver` vs `quest_giver`, `allowance` vs `allowanceAmount` fields mean any new validator or save-payload consumer must defend against both shapes. Pure cost-of-future-change concern; not a live bug.

---

## 3. Proposed regression test (do NOT add as file yet)

`tests/mission_objective_contract_check.gd` — boots QuestRegistry, walks the active-slice missions, asserts each step ID is referenced by at least one `Systems/Interactions/*.gd` or `Systems/UI/DialogController.gd` literal.

```gdscript
extends SceneTree

const ACTIVE_SLICE_MISSIONS := ["bike_safety_check", "chain_repair", "flat_tire_repair"]
const SYSTEMS_GLOBS := ["res://Systems/Interactions/", "res://Systems/UI/"]

var failures: Array[String] = []

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	var quest_registry: Node = root.get_node_or_null("QuestRegistry")
	_assert(quest_registry != null, "QuestRegistry autoload exists")
	if quest_registry == null:
		_finish()
		return

	# Collect every "talk_to_*", "check_*", "inspect_*", recorded literal from Systems sources.
	var referenced_ids := {}
	for dir_path in SYSTEMS_GLOBS:
		var dir := DirAccess.open(dir_path)
		if dir == null:
			continue
		dir.list_dir_begin()
		var fname := dir.get_next()
		while fname != "":
			if fname.ends_with(".gd"):
				var text := FileAccess.get_file_as_string(dir_path + fname)
				var regex := RegEx.new()
				regex.compile("record_objective\\(\\s*[^,]+,\\s*\"([^\"]+)\"")
				for m in regex.search_all(text):
					referenced_ids[m.get_string(1)] = true
				# Also catch String(step["id"]) iteration: collect step["id"] literals in same file.
				var step_re := RegEx.new()
				step_re.compile("\"id\"\\s*:\\s*\"([^\"]+)\"")
				for m in step_re.search_all(text):
					referenced_ids[m.get_string(1)] = true
			fname = dir.get_next()

	for quest_id in ACTIVE_SLICE_MISSIONS:
		var quest = quest_registry.get_quest(quest_id)
		_assert(quest != null, "Mission %s loaded" % quest_id)
		if quest == null:
			continue
		var steps: Array = quest.get("steps", [])
		for step in steps:
			var step_id := String(step.get("id", ""))
			_assert(referenced_ids.has(step_id),
				"Mission %s step %s has at least one recorder in Systems/" % [quest_id, step_id])

	_finish()

func _assert(cond: bool, msg: String) -> void:
	if not cond:
		failures.append(msg)

func _finish() -> void:
	if failures.is_empty():
		print("Mission objective contract check passed")
		quit(0)
	else:
		for f in failures:
			push_error(f)
		quit(1)
```

This test would catch:
- A new mission step added to JSON without a station-script recorder.
- A station-script step ID renamed without updating the JSON.
- The current `first_safety_check` orphan state (would fail on `inspect_bike` and `report_findings`) — so it should NOT be added to the active-slice list, OR the file should be deprecated first.

Cost: zero runtime overhead, regex-only static scan. **Add only after `first_safety_check` is resolved** (deprecated, deleted, or wired to a recorder).

---

## 4. Dialogue-only NPC references in active missions

Search target: any of `abuela_rosa`, `uncle_karim`, `shopkeeper`, `mom`, `neighbor_kid` referenced in `Data/missions/*.json`.

| NPC | Referenced by mission? | Reachable region? | Recommendation |
|---|---|---|---|
| `abuela_rosa` | none | none | **Keep dialogue, defer scene.** Cultural-warmth content; not load-bearing. |
| `uncle_karim` | none | none | **Keep dialogue, defer scene.** Same. |
| `shopkeeper` | `bridge_quest_2.json:8` (`talk_to_shopkeeper`) | **no — bridge region layout doesn't exist** | **Keep, blocked on bridge layout.** This is a hidden gate on the bridge questline. Document as "shopkeeper scene + bridge region scaffolding both required before bridge arc is playable." |
| `mom` | none | none | **Keep dialogue, defer scene** — likely future home-scene content. |
| `neighbor_kid` | none | none | **Keep dialogue, defer scene** — likely future neighborhood ambience. |

**None of these block the first 15 minutes.** No deletion required for the active slice. The bridge arc has a hard data block — 5 missions reference a region and NPC that don't exist as scenes; this is documented elsewhere as a known gap.

---

## 5. Summary

- **Active first-15-minute slice objective IDs are consistent.** Chain repair, tire repair, and safety check all line up across JSON ↔ Systems ↔ test (where covered).
- **`first_safety_check.json` is the one drift case** — orphan content, unfinishable via gameplay. Resolve before adding the proposed regression test.
- **vertical_slice_check.gd gap**: `bike_safety_check` is not exercised. Add objective walkthrough (4 lines).
- **Dialogue-only NPCs do not block the slice.** Leave alone for now.
- **Schema variance is latent, not active.** Defer normalization until a payload consumer is added.

**Suggested order of operations:**
1. Deprecate or delete `first_safety_check.json`.
2. Add `bike_safety_check` walkthrough to `vertical_slice_check.gd` (4 `record_objective` lines + 1 reward assertion).
3. Add `tests/mission_objective_contract_check.gd` once step 1 is done.

End of audit.
