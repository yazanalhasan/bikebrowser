# Bridge Material Testing Mini-Game

## Goal

The player tests bridge materials before rebuilding the dry-wash bridge. The mini-game teaches that "strongest" depends on the force: beams need stiffness and compression resistance, suspension parts need tensile strength, and flexible parts help only when stretching is useful.

## Material Properties

| Material | Tensile | Compressive | Flexibility | Weight | Cost | Best Use |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Wood plank | 5 | 6 | 4 | 3 | 2 | beam |
| Steel beam | 10 | 9 | 3 | 9 | 7 | beam |
| Aluminum bar | 7 | 6 | 4 | 4 | 6 | beam |
| Rubber strip | 3 | 2 | 10 | 2 | 3 | suspension |
| Composite fiber | 9 | 7 | 6 | 3 | 9 | suspension |
| Rope/cable | 8 | 1 | 7 | 2 | 4 | suspension |

## Testing Machine Visual

The rig sits on a garage workbench: two clamp blocks hold the material sample across a gap, a red hand lever releases weight plates one at a time, and a curved breaking-point gauge rises from green to yellow to red. As load increases, the sample bends downward. Small chalk marks on the bench show "bend," "crack," and "break" zones. A notebook panel sits on the right side of the screen with the current material, maximum load, bend amount, and a short observation sentence.

## Test Interaction

1. Place material in testing rig: Choose one sample card, then press confirm at the rig. The clamps slide inward and a label appears.
2. Add weight gradually: Pull the lever or tap the add-weight button. Each weight increases load by one step and moves the gauge.
3. Watch material bend or break: The sample sprite deforms as flexibility and strength are tested. A warning wobble appears near its expected limit.
4. Record result in notebook: When the material breaks or reaches the safe-load target, the notebook stamps the result and unlocks the educational explanation.

## Educational Explanations

- Wood plank: Wood is light and affordable, and its grain gives it decent strength along the plank. It can crack when overloaded because natural fibers split apart.
- Steel beam: Steel has very high tensile and compressive strength, so it resists both pulling and squeezing. It is heavy and costs more, but it makes reliable beams and brackets.
- Aluminum bar: Aluminum is lighter than steel and still fairly strong. It bends sooner, so it is useful when weight matters but less ideal for the main bridge span.
- Rubber strip: Rubber stretches because its molecules can uncoil and return. That makes it great for cushioning, but not stiff enough to hold a bridge deck flat.
- Composite fiber: Composite materials layer strong fibers in a binder. The fibers carry pulling force while the layers keep the material light.
- Rope/cable: Rope and cable are strong in tension because many strands share the pull. They are weak in compression because a loose cable buckles instead of pushing back.

## Quest Integration

The material test is Quest 3 of the bridge reconstruction chain. Completing the tests unlocks the bridge design table. If the player records at least three materials and selects a sensible bridge choice, Mr. Chen approves the design and Quest 4 begins. The recommended solution is steel or wood for beam/truss members, with rope/cable or composite for suspension support.

## JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "BridgeMaterialData",
  "type": "object",
  "required": ["materials"],
  "properties": {
    "materials": {
      "type": "array",
      "items": {
        "type": "object",
        "required": [
          "id",
          "name",
          "tensile_strength",
          "compressive_strength",
          "flexibility",
          "weight",
          "cost",
          "best_use_case",
          "explanation"
        ],
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "tensile_strength": { "type": "integer", "minimum": 1, "maximum": 10 },
          "compressive_strength": { "type": "integer", "minimum": 1, "maximum": 10 },
          "flexibility": { "type": "integer", "minimum": 1, "maximum": 10 },
          "weight": { "type": "integer", "minimum": 1, "maximum": 10 },
          "cost": { "type": "integer", "minimum": 1, "maximum": 10 },
          "best_use_case": { "type": "string", "enum": ["beam", "suspension", "arch"] },
          "explanation": { "type": "string" }
        }
      }
    }
  }
}
```
