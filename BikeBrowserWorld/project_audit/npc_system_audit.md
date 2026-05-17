# NPC System Audit

## NPC Matrix

| NPC Scene | npc_id | dialogue_id | Dialogue exists | Script | Active instances |
| --- | --- | --- | --- | --- | --- |
| Regions/NPCs/CharlieNpc.tscn | charlie | charlie_intro | yes | res://Systems/Interactions/AnimatedNpcInteraction.gd | not instanced in scanned region scenes |
| Regions/NPCs/ColeNpc.tscn | cole | cole_intro | yes | res://Systems/Interactions/AnimatedNpcInteraction.gd | not instanced in scanned region scenes |
| Regions/NPCs/DrMayaNpc.tscn | river_biologist | dr_maya_intro | yes | res://Systems/Interactions/AnimatedNpcInteraction.gd | not instanced in scanned region scenes |
| Regions/NPCs/JacobNpc.tscn | jacob | jacob_intro | yes | res://Systems/Interactions/AnimatedNpcInteraction.gd | not instanced in scanned region scenes |
| Regions/NPCs/JamesNpc.tscn | james | james_intro | yes | res://Systems/Interactions/AnimatedNpcInteraction.gd | not instanced in scanned region scenes |
| Regions/NPCs/MrChenNpc.tscn | mr_chen | mr_chen_chain | yes | res://Systems/Interactions/AnimatedNpcInteraction.gd | not instanced in scanned region scenes |
| Regions/NPCs/MrsRamirezNpc.tscn | mrs_ramirez | mrs_ramirez_intro | yes | res://Systems/Interactions/AnimatedNpcInteraction.gd | not instanced in scanned region scenes |
| Regions/NPCs/OldMinerPeteNpc.tscn | old_miner | old_miner_intro | yes | res://Systems/Interactions/AnimatedNpcInteraction.gd | not instanced in scanned region scenes |
| Regions/NPCs/RangerNitaNpc.tscn | desert_guide | ranger_nita_intro | yes | res://Systems/Interactions/AnimatedNpcInteraction.gd | not instanced in scanned region scenes |
| Regions/NPCs/ZevonNpc.tscn | zevon | zevon_intro | yes | res://Systems/Interactions/AnimatedNpcInteraction.gd | not instanced in scanned region scenes |
| Regions/Neighborhood/MrChen.tscn | mr_chen | mr_chen_chain | yes | res://Systems/Interactions/NpcInteraction.gd | not instanced in scanned region scenes |

## Dialogue Files

| File | ID | Detected format | Top-level keys |
| --- | --- | --- | --- |
| Data/dialogue/abuela_rosa_intro.json | abuela_rosa_intro | dialogue_tree | id, npc_id, greeting, dialogue_tree |
| Data/dialogue/charlie_intro.json | charlie_intro | dialogue_tree | id, npc_id, speaker, greeting, dialogue_tree, lines |
| Data/dialogue/cole_intro.json | cole_intro | dialogue_tree | id, npc_id, speaker, greeting, dialogue_tree, lines |
| Data/dialogue/dr_maya_expanded.json | dr_maya_expanded | dialogue_tree | id, npc_id, speaker, lines, dialogue_tree |
| Data/dialogue/dr_maya_intro.json | dr_maya_intro | lines-array | id, speaker, lines |
| Data/dialogue/jacob_intro.json | jacob_intro | dialogue_tree | id, npc_id, speaker, greeting, dialogue_tree, lines |
| Data/dialogue/james_intro.json | james_intro | dialogue_tree | id, npc_id, speaker, greeting, dialogue_tree, lines |
| Data/dialogue/mom_intro.json | mom_intro | dialogue_tree | id, npc_id, greeting, dialogue_tree |
| Data/dialogue/mr_chen_bridge.json | mr_chen_bridge | lines-array | id, npc_id, speaker, lines, other_npc_lines |
| Data/dialogue/mr_chen_chain.json | mr_chen_chain | lines-array | id, speaker, lines, onComplete |
| Data/dialogue/mr_chen_expanded.json | mr_chen_expanded | dialogue_tree | id, npc_id, speaker, greeting, lines, dialogue_tree |
| Data/dialogue/mrs_ramirez_intro.json | mrs_ramirez_intro | lines-array | id, speaker, lines |
| Data/dialogue/mrs_ramirez_questline.json | mrs_ramirez_questline | dialogue_tree | id, npc_id, speaker, lines, dialogue_tree |
| Data/dialogue/neighbor_kid_intro.json | neighbor_kid_intro | dialogue_tree | id, npc_id, greeting, dialogue_tree |
| Data/dialogue/old_miner_intro.json | old_miner_intro | lines-array | id, speaker, lines |
| Data/dialogue/old_miner_pete_expanded.json | old_miner_pete_expanded | dialogue_tree | id, npc_id, speaker, lines, dialogue_tree |
| Data/dialogue/ranger_nita_expanded.json | ranger_nita_expanded | dialogue_tree | id, npc_id, speaker, lines, dialogue_tree |
| Data/dialogue/ranger_nita_intro.json | ranger_nita_intro | lines-array | id, speaker, lines |
| Data/dialogue/shopkeeper_intro.json | shopkeeper_intro | dialogue_tree | id, npc_id, greeting, dialogue_tree |
| Data/dialogue/uncle_karim_intro.json | uncle_karim_intro | dialogue_tree | id, npc_id, greeting, dialogue_tree |
| Data/dialogue/zevon_intro.json | zevon_intro | dialogue_tree | id, npc_id, speaker, greeting, dialogue_tree, lines |

## Findings

- IMPLEMENTED: NPC scenes exist for core mentors and use Area2D-based interaction.
- IMPLEMENTED: Current regions instantiate the central mentor NPCs.
- PARTIALLY IMPLEMENTED: Dialogue files use mixed schemas (`lines-array`, `dialogue_tree`, and addon-style `nodes`), so all data is not guaranteed to render through one UI.
- PARTIALLY IMPLEMENTED: NPC schedules exist as data, but no active schedule applier was found in the scene graph.
- BROKEN/RISK: Calling `DialogueManager.start_dialogue` by class name can fail because the addon declares `class_name DialogueManager`; use `/root/DialogueManager` for the autoload.
