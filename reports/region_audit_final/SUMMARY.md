# Sprint 3 Region & Perspective Audit Summary

## Reference Availability
- brief_exists: False
- regions_reference_dir_exists: False
- master_reference_exists: False

## Per-region Report Card
- boot: PERSPECTIVE_CONFORMS (OK); hidden Polygon2D=0; layer estimate=0
- neighborhood_street: PERSPECTIVE_DRIFT (LAYERS_MISSING, PLACEHOLDER_DEBT_HIGH); hidden Polygon2D=43; layer estimate=1
- garage: PERSPECTIVE_DRIFT (PLACEHOLDER_DEBT_HIGH); hidden Polygon2D=17; layer estimate=1
- copper_mine: PERSPECTIVE_DRIFT (LAYERS_MISSING); hidden Polygon2D=0; layer estimate=1
- desert_trail: PERSPECTIVE_DRIFT (LAYERS_MISSING, PERSPECTIVE_DRIFT_LIGHTING_UNCLEAR); hidden Polygon2D=0; layer estimate=1
- salt_river: PERSPECTIVE_DRIFT (LAYERS_MISSING, PERSPECTIVE_DRIFT_LIGHTING_UNCLEAR); hidden Polygon2D=0; layer estimate=1
- dry_wash: PERSPECTIVE_DRIFT (LAYERS_MISSING, PERSPECTIVE_DRIFT_LIGHTING_UNCLEAR); hidden Polygon2D=0; layer estimate=1
- system_showcase: PERSPECTIVE_CONFORMS (OK); hidden Polygon2D=0; layer estimate=0

## Aggregate Placeholder Debt
- Hidden Polygon2D total: 60

## Regions Needing Perspective/Template Work
- neighborhood_street
- garage
- copper_mine
- desert_trail
- salt_river
- dry_wash

## Recommended Cleanup Order For Sprint 4
- Start with missing HUD/DialogBox regions: copper_mine, desert_trail, salt_river, dry_wash, system_showcase.
- Avoid structural churn in garage and neighborhood_street beyond what validation requires.
- Treat boot and system_showcase as special-case/stub regions.
