---
name: WorldMapScene layer depths
description: Confirmed depth values for every rendering layer in WorldMapScene, established at cycle 1
type: project
---

Depths confirmed by reading WorldMapScene.js (cycle 1, 2026-04-26):

| Layer | Depth | Container/object |
|---|---|---|
| background rect | -300 | inline add.rectangle |
| parchment rect | -200 | inline add.rectangle |
| terrain | -100 | _terrainContainer |
| fog | -75 | _fogContainer (added this cycle) |
| paths | -50 | _pathContainer |
| landmarks | -25 | _landmarkContainer |
| node bases | 0 | nodeBaseG (inline Graphics) |
| node circles/icons/labels | 1 | per-loc add.circle / add.text |
| vignette | 1000 | inline Graphics in _renderVignette |

**Why:** Fog must sit above terrain but below all interactive layers. -75 is the correct midpoint between -100 (terrain) and -50 (paths).

**How to apply:** When adding future layers, pick a depth that doesn't collide with these values. The only gap at cycle 1 is between -200 (parchment) and -100 (terrain).
