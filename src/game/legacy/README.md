# Legacy Boundary

The existing Phaser implementation remains in `src/renderer/game`.

It is legacy for the graphics reset. Do not use it as visual reference for new production scenes.

Allowed uses:

- identify intended interactions
- preserve `/legacy-play`
- inspect save compatibility and existing tests
- copy stable constants only after review

Not allowed:

- importing messy old art into the new default scene
- making old scene layouts the new visual source of truth
- hardcoding quest progression into rebuilt scenes because old scenes did

The clean rebuild lives in `src/game`.
