# Final Audio Soundspace Report

Goal: audio supports warmth, not noise.

Changes:

- Dry wash discovery transitions to `bridge_problem`.
- Material testing transitions to `utm_testing`.
- Ecology and chemistry transition to `ecology_chemistry`.
- Bridge repair still transitions to `map_unlock`.
- NPC voice profiles remain distinct for Zuzu, Mr. Chen, Mrs. Ramirez, Auntie Mariam, trader, and signs.

Validation:

- `game-rebuild.audio.spec.js` covers speech normalization, voice routing, replay, quiet mode, and music state tracking.

Remaining:

- Browser speech voices depend on local OS voices.
- More final authored ambience loops can be added without changing the architecture.

