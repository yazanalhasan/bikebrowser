# Side-Region Containment Audit

**Date:** 2026-05-17
**Scope:** Can the first-15-minute vertical slice be broken by a curious player wandering into Mine / Desert / River? Yes — and worse than feared.

---

## 1. Side-Region Exit Wiring (NeighborhoodStreet.tscn:783–823)

The three side-region triggers from the neighborhood are:

| Exit | target_region | target_spawn | require_accept | Prompt text |
|---|---|---|---|---|
| MineExit | copper_mine | from_neighborhood | **false** | "Copper Mine" |
| DesertExit | desert_trail | from_neighborhood | **false** | "Desert Trail" |
| RiverExit | salt_river | from_neighborhood | **false** | "Salt River" |

`require_accept = false` is critical. Looking at `TransitionZone.gd:31–37`:

```gdscript
func _on_body_entered(body: Node) -> void:
    if body.is_in_group("player"):
        player_in_range = true
        if prompt:
            _show_prompt()
        if not require_accept:
            _transition()
```

**The player does not need to press E. Touching the edge trigger immediately fires `_transition()` and changes the scene.** All three side-region exits are auto-triggering. A child wandering 1 cm past the visible screen edge gets teleported into a prototype region. This is the highest-priority containment problem in the first-15-min slice.

The neighborhood layout puts these triggers at the four cardinal edges (x ≈ ±620, y ≈ 40–400 for mine/desert, y ≈ 392 wide band for river). They are *immediately* reachable from the spawn (0,0); no quest, no NPC, no warmth precedes them.

## 2. TransitionZone Has No Gating Surface

`TransitionZone.gd` exposes only `target_region`, `target_spawn`, `require_accept`, `feedback_message`. There is **no `required_quest_id`, no `unlock_after`, no `is_locked` field**. Gating must be added as a new export on this script (one of the few additive places Phase 2 systems work would touch — small, surgical, additive).

## 3. Side-Region Prototype Energy

Confirmed skeletal:

- **CopperMine.tscn** (76 lines): `Background` + `Ground` are empty `Polygon2D` nodes (no points set in the .tscn — points must come from layout JSON, but `copper_mine.json` is the 17-liner). Visual content: a mine-entrance sprite, two ore chunks, a mine cart, OldMinerPete NPC, back-exit. **Eight visual nodes total.** Will read as raw prototype.
- **DesertTrail.tscn** (81 lines): `Background` + `Trail` empty Polygon2Ds. Trail marker + 2 cacti + agave + mesquite + Ranger Nita + back-exit. **Nine visual nodes.**
- **SaltRiver.tscn** (81 lines): `Background` Polygon2D, river-water sprite, `SandyBank` empty Polygon2D, dock, sampling kit, 2 cattails, Dr. Maya, back-exit. **Ten visual nodes.**

By comparison, NeighborhoodStreet has 217 nodes and ZuzuGarage has 148. The visual delta when the player crosses is severe — they'll read the game as "polished demo with broken regions hidden behind doorways."

Each side region also auto-spawns its NPC (OldMinerPete / RangerNita / DrMaya), all using the same 64-radius `AnimatedNpcInteraction` pattern — they'll fire a presence line on contact, compounding the "this is prototype" impression with dialogue noise.

## 4. Real First-15-Min Failure Mode

Spawn position is (0,0). Mrs. Ramirez is at (−330,−82). Mr. Chen at (308,−82). Mine exit at (−620,40). Desert exit at (620,40). River exit at (0,392). **All side exits are visible from spawn and reachable in under 10 seconds of free movement.**

Worse: a child playing for the first time who walks "down" to explore the road area passes through `y=58` (RoadLineC) directly toward RiverExit at `y=392`. The river exit is the most likely accidental hit.

## 5. Recommendation: Option (a), Soft-Gate

Recommend gating all three side exits behind `chain_repair` completion (the canonical end of the vertical slice). Reasoning:

- (b) "hide the exit triggers entirely" is heavier: requires conditional `.tscn` mutation or runtime show/hide and risks the layout-data-driven rule. Reversing it later when side regions are ready needs scene rework.
- (c) "leave open" is unacceptable: the river exit is on the player's natural exploration vector.
- (a) is **additive only**, fits the existing `TransitionZone` script, is fully reversible by deleting one field per exit, and matches the project principle of authored restraint.

### Concrete Implementation (DO NOT IMPLEMENT THIS PASS)

**File 1: `BikeBrowserWorld/Systems/World/TransitionZone.gd`** — add one export and one guard:

```gdscript
# After line 6, add:
@export var required_quest_id := ""   # quest must be completed before this gate opens
@export var locked_feedback := ""      # optional barker line; empty = no prompt at all when locked

# In _ready (line 17 area), after `prompt.text = _prompt_copy(...)`, add:
if _is_locked():
    prompt.visible = false   # silent gate; no "??? Copper Mine" hint either

# Replace _on_body_entered (line 31):
func _on_body_entered(body: Node) -> void:
    if not body.is_in_group("player"):
        return
    if _is_locked():
        if locked_feedback != "":
            EventBus.interaction_feedback.emit(locked_feedback, "quiet")
        return
    player_in_range = true
    if prompt:
        _show_prompt()
    if not require_accept:
        _transition()

# Add helper near end:
func _is_locked() -> bool:
    if required_quest_id == "":
        return false
    var qr := get_node_or_null("/root/QuestRegistry")
    return qr == null or not qr.completed_quests.has(required_quest_id)
```

**File 2: `BikeBrowserWorld/Regions/Neighborhood/NeighborhoodStreet.tscn`** — three lines, one per exit (lines 783, 797, 811):

```
[node name="MineExit" type="Area2D" parent="."]
script = ExtResource("3_transition")
target_region = "copper_mine"
target_spawn = "from_neighborhood"
require_accept = false
required_quest_id = "chain_repair"
feedback_message = "Zuzu rides toward the copper mine."
```

Same field added to `DesertExit` (line 797) and `RiverExit` (line 811).

**Optional follow-up:** also flip `require_accept` to `true` for the three side exits even when unlocked, so accidental edge bumps require deliberate E. Independent of the gate.

### Risks of (a)

- **Gate timing**: chain_repair is the *current* slice-end. If that quest's completion ID drifts (data contract audit will catch this), the gate stays locked forever. Mitigation: data contract test should verify `required_quest_id` references resolve via `QuestRegistry.has_quest`.
- **No visible cue to player**: the design here is "side regions don't exist until they exist." If the user prefers "you can see the path but not walk it yet," swap `locked_feedback` to a one-line poetic barker ("The desert trail looks too long today.") and set `prompt.visible = true` with greyed styling. I'd hold the silent version first — fewer cues, more authored restraint.

## 6. Out-of-Scope Observation

The other three TransitionZones with `require_accept = false` are the four **return** exits *back* to the neighborhood (`BackToNeighborhood` in each side region — CopperMine.tscn:49, DesertTrail.tscn:54, SaltRiver.tscn:54). These should stay `require_accept = false` — the player has *already* entered a region they shouldn't be in; making them deliberately press E to escape is hostile. Leave alone.

## 7. Summary

- Side exits auto-trigger on touch; no quest gating exists.
- First-15-min spell can be broken in under 10 seconds.
- Recommend **option (a)** with one new `required_quest_id` export on TransitionZone and one field per exit in NeighborhoodStreet.tscn.
- Implementation cost: ~15 LOC across two files. Fully reversible.
- Do not implement this pass; coordinate with Phase 2 (interaction topology) and Phase 7 (data contract) so the test layer can verify quest-id resolution at the same time.
