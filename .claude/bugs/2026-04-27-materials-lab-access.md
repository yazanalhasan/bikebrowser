# Materials Lab access bug — diagnosis (2026-04-27)

Player report: active quest `desert_coating`, on step 5/7 (`apply_coating`),
hint says *"Use the material workbench to combine resin + wax into a
protective coating."*. Player cannot access the Materials Lab.

All citations are absolute paths under `C:\Users\yazan\bikebrowser\`.

---

## 1. Where is MaterialLabScene supposed to be reachable from?

Survey of every plausible mechanism. There is exactly **one** access path
in the live (non-legacy) scene graph:

| Mechanism | File:Line | Result |
| --- | --- | --- |
| Phaser scene registry | `src/renderer/game/config.js:20,51` | Imported and listed in `ALL_SCENES`. Registered. |
| Logical scene registry | `src/renderer/game/systems/sceneRegistry.js:79-97` | Defined as a `local` layer scene with `worldPos: null`, exit only `toGarage`. |
| Overworld map marker | `src/renderer/game/scenes/OverworldScene.js:70-73` | `OverworldScene` iterates `getLocalScenes()` and **skips any scene whose `worldPos` is `null`** (line 73: `if (!sceneDef.worldPos) continue;`). Because `MaterialLabScene.worldPos === null`, it gets **no marker** here. |
| World-map node | `src/renderer/game/data/worldMapData.js:39-104` | `WORLD_LOCATIONS` does **not** include MaterialLabScene. Reachable WorldMap entries: `desert_foraging`, `copper_mine`, `salt_river`, `dry_wash`. None of them mention the Materials Lab. |
| Door / interactable in another scene | `src/renderer/game/scenes/ZuzuGarageScene.js:177-224` | A `Materials Lab` doorway prop (left wall, near workbench) with an interactable. Calls `this.scene.start('MaterialLabScene', { spawn: 'fromGarage' })` at line 206 — **but only when a hard-coded gate passes**. See §4. |
| Door from a sub-scene | grep `scene.start('MaterialLabScene')` over `src/`: only one hit — `ZuzuGarageScene.js:206`. No other scene starts it. |
| NPC dialog → travel | grep across `src/renderer/game/scenes/` for any other `scene.start` to MaterialLab → none. |
| Legacy `GarageScene`/`NeighborhoodScene` | `src/renderer/game/scenes/GarageScene.js`, `NeighborhoodScene.js` | Neither references MaterialLabScene at all (grep returned no matches). They are themselves orphaned in the live flow — entered only via `SCENE_KEY_MIGRATION` (`config.js:77-80`) which **redirects them away** to `ZuzuGarageScene`/`OverworldScene` on boot. |

**Conclusion:** the *only* way into MaterialLabScene is the doorway interactable in `ZuzuGarageScene`.

---

## 2. Is MaterialLabScene currently registered, loaded, and reachable?

- **Registered:** yes. `src/renderer/game/config.js:20` imports it; `src/renderer/game/config.js:51` lists it in `ALL_SCENES`. Phaser will boot it.
- **Loaded:** yes. The class extends `LabRigBase` (`src/renderer/game/scenes/MaterialLabScene.js:67`) and registers HMR (line 676). No syntax-level break.
- **Reachable in principle:** yes. Test: if a player on the `bridge_collapse` quest reaches the right step, the doorway opens and `scene.start('MaterialLabScene', { spawn: 'fromGarage' })` fires (`ZuzuGarageScene.js:206`).
- **Reachable from `desert_coating` (step 5, `apply_coating`):** **no**. The doorway gate explicitly checks `bridge_collapse` quest state and a 3-item bridge sample inventory; neither condition is satisfied for a `desert_coating` player.

So the scene is fine — the only access mechanism is gated on the wrong quest.

---

## 3. What is the actual access mechanism?

A click/`E`-press interactable on the Materials Lab doorway prop in
`ZuzuGarageScene`. Concretely:

`src/renderer/game/scenes/ZuzuGarageScene.js:177-224`:

```js
// === MATERIALS LAB DOORWAY (left wall, near workbench) ===
// Visible prop the player can interact with — gates on having all 3
// material samples in inventory and being on (or past) the
// weigh_instruction step of bridge_collapse.
…
this.addInteractable({
  x: this.layout.interact_lab.x, y: this.layout.interact_lab.y,
  label: 'Materials Lab',
  icon: '🧪',
  radius: 70,
  onInteract: () => {
    const s = this.registry.get('gameState') || {};
    const inv = s.inventory || [];
    const haveAll = inv.includes('mesquite_wood_sample') &&
      inv.includes('copper_ore_sample') &&
      inv.includes('steel_sample');
    // Active step gating — index 8 is `weigh_instruction` per quests.js.
    const aq = s.activeQuest;
    const onTrack = aq?.id === 'bridge_collapse' && (aq.stepIndex || 0) >= 8;

    if (haveAll || onTrack) {
      this.scene.start('MaterialLabScene', { spawn: 'fromGarage' });
      return;
    }

    // Otherwise — friendly nudge so the player knows where to go.
    const missing = [];
    if (!inv.includes('mesquite_wood_sample')) missing.push('🪵 mesquite');
    if (!inv.includes('copper_ore_sample')) missing.push('🟠 copper');
    if (!inv.includes('steel_sample')) missing.push('⚙️ steel');
    const list = missing.length ? `\n\nMissing: ${missing.join(', ')}` : '';
    this.registry.set('dialogEvent', {
      speaker: 'Mr. Chen',
      text: `The materials lab is through here.\n\n` +
        `Bring me all three samples first — wood, copper, and steel — ` +
        `and I'll show you the testing machine.${list}`,
      choices: null, step: null,
    });
  },
});
```

Inside MaterialLabScene, the back door fires through `LabRigBase.addExit({ targetScene: 'ZuzuGarageScene' })` at `src/renderer/game/scenes/LabRigBase.js:293-297`, with spawn `'fromMaterialLab'` (`MaterialLabScene.js:78`, registered at `sceneRegistry.js:65`). Round-trip works.

---

## 4. Why is it currently inaccessible?

The doorway gate has two predicates joined by `||`:

1. `haveAll` = inventory contains **all three** of:
   - `'mesquite_wood_sample'`
   - `'copper_ore_sample'`
   - `'steel_sample'`
   (`ZuzuGarageScene.js:198-200`)

2. `onTrack` = active quest `id === 'bridge_collapse'` AND `stepIndex >= 8`
   (`ZuzuGarageScene.js:202-203`).

For a `desert_coating` player:

- **`haveAll` is almost certainly false.** The bridge-quest sample items are granted only by progressing `bridge_collapse` (workbench grants `steel_sample` at `ZuzuGarageScene.js:153-167`; the wood/copper analogues come from quest steps in `quests.js` outside the desert_coating chain). A player who jumped to `desert_coating` without completing bridge collapse will not have all three.
- **`onTrack` is false.** `aq.id === 'desert_coating'`, not `'bridge_collapse'`.

So the gate falls through to the "friendly nudge" branch (`ZuzuGarageScene.js:216-222`) which **never starts the scene** — it only emits a Mr. Chen dialog telling the player to bring three bridge samples. From the user's perspective the door looks broken: clicking it loops them back to a dialog that's irrelevant to their active quest.

There is **no `desert_coating`-aware branch** in this gate. The desert quest's hint text *"Use the material workbench"* points the player at the same doorway, but the doorway code knows nothing about `desert_coating`.

Secondary issue (downstream of access): even if the door opened, `MaterialLabScene` does not currently implement a "combine resin + wax" workflow. Its quest hook is hard-wired to the bridge quest's `load_test_completed` observation (`MaterialLabScene.js:75-77`, `LabRigBase.js:540-563`). The lab does not emit `coating_applied` anywhere in `src/`.

---

## 5. Is the `desert_coating` quest's `combine_materials` step correctly targeted?

`src/renderer/game/data/quests.js:1611-1617`:

```js
{
  id: 'apply_coating',
  type: 'observe',
  text: 'Combine and apply the resin-wax coating to the bike components.',
  requiredObservation: 'coating_applied',
  hint: 'Use the material workbench to combine resin + wax into a protective coating.',
},
```

Two issues:

a. **No `scene:` field.** Compare to `bridge_collapse.test_material` step which sets `scene: 'MaterialLabScene'` (`quests.js:1227`) and `heat_failure.observe_expansion` which sets `scene: 'ThermalRigScene'` (`quests.js:1344`). The `apply_coating` step has *no* `scene:` pointer at all. The player cannot rely on the quest UI to teleport / direct them to the workbench scene.

b. **No emitter for `coating_applied`.** The observation `'coating_applied'` is referenced exactly once in the entire codebase (`quests.js:1615`); a grep of `src/` for that string returns no other hits. The quest gate (`questSystem.js:201-207`) requires it before advancing, but **nothing ever pushes it onto `state.observations`**. Even if the player gained access to MaterialLabScene, there is no UI / button / interaction that produces `coating_applied`. The step is a dead-end by design.

This same structural defect holds for several other observe-typed steps — see the audit (`scene-access-audit.md`).

---

## ROOT CAUSE CATEGORY

**`scene access gate is keyed to a single quest (`bridge_collapse`), with no branch for the other quests whose hints route the player there; combined with quest steps that lack a `scene:` pointer and reference observations no system emits, leaving multiple `observe` steps fundamentally un-completable.`**

In short: the door is bridge-quest-specific, the desert-coating step has no scene
target and no emitter, and `coating_applied` is referenced but never granted.
