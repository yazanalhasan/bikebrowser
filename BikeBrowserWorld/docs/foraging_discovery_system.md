# Foraging and Discovery System

## Identification Loop

Ranger Nita teaches players to identify plants through observation clues: silhouette, flower or fruit color, stem texture, smell notes, and safe-distance warnings. The player selects a plant, reads 2-3 clues, then chooses from three possible IDs. Touch-based clues appear only after Ranger Nita marks the plant safe.

## Harvesting Interaction

When a known plant has harvestable parts, the player presses E near the highlighted harvest point. Zuzu plays a short careful-pick animation, the plant rustles, and a soft inventory sound confirms the item. Harvesting yields named items such as `prickly_pear_fruit`, `mesquite_pods`, `yucca_fiber`, or `agave_fiber`.

## Inventory Integration

Harvested items are added to the player inventory with source plant, quantity, and use tags: food, medicine, material, or tool. Recipe systems can query these tags, while quests can require exact item IDs.

## Over-Harvesting Warning

Each plant patch has a harvest limit. Taking too much causes Ranger Nita to interrupt: "Leave enough for birds, bugs, and tomorrow's flowers." The patch enters a recovering state and the journal records the ecology lesson instead of rewarding more items.

## Plant Uses

Food recipes include prickly pear jam, mesquite flour cakes, saguaro fruit syrup, and wolfberry trail mix. Medicine recipes include careful creosote tea, desert lavender calming sachets, jojoba skin balm, and agave wound wrap. Material recipes include yucca rope, agave twine, mesquite handle blanks, and composite plant-fiber samples. Tool recipes include an ocotillo walking stick, yucca brush, and palo verde marker stakes.

## Discovery Journal

Identifying a plant adds it to the Discovery Journal with art, description, where found, safe/unsafe notes, harvestable items, and one educational fact. Progress milestones award badges: 5 plants unlocks "Budding Botanist"; 15 plants unlocks "Master Naturalist."

## Sample Journal UI Mockup

```text
+--------------------------------------------------+
| Discovery Journal                         5 / 15 |
+----------------------+---------------------------+
| [Saguaro Cactus]     | Saguaro Cactus            |
| [Prickly Pear]       | Tall ribbed cactus with   |
| [Creosote Bush]      | white flowers and red     |
| [Mesquite Tree]      | fruit in summer.          |
| [Palo Verde]         |                           |
+----------------------+ Edible: fruit             |
| Found in: open desert and rocky slopes            |
| Harvest: fruit                                    |
| Fact: Saguaros can live for more than 150 years.  |
+--------------------------------------------------+
```
