# Runtime Bike Asset Inventory

Date: 2026-05-26

## Surfaced Runtime Bike Assets

| Asset | Runtime use | Size before fix | Source status before fix | Truth status |
| --- | --- | ---: | --- | --- |
| `Assets/Props/Bike/small_safety_check_bike.png` | Neighborhood safety bike base | 992x814, 17 KB | Missing `.aseprite` | Low-quality regression |
| `Assets/Props/Bike/small_safety_check_bike_brakes_worn.png` | Safety-check brake overlay/state | 992x814, 20 KB | Missing `.aseprite` | Low-quality regression |
| `Assets/Props/Bike/small_safety_check_bike_tires_flat.png` | Safety-check tire overlay/state | 992x814, 21 KB | Missing `.aseprite` | Low-quality regression |
| `Assets/Props/Bike/small_safety_check_bike_chain_slipped.png` | Safety-check chain overlay/state | 992x814, 22 KB | Missing `.aseprite` | Low-quality regression |
| `Assets/Props/Bike/garage_repair_stand_bmx_slipped_chain.png` | Repair-stand bike state asset | 650x628, 17 KB | Missing `.aseprite` | Low-quality regression |
| `Assets/Props/Bike/garage_repair_stand_bmx_aligning_chain.png` | Repair-stand bike state asset | 702x628, 16 KB | Missing `.aseprite` | Low-quality regression |
| `Assets/Props/Bike/garage_repair_stand_bmx_seated_chain.png` | Repair-stand bike state asset | 628x628, 14 KB | Missing `.aseprite` | Low-quality regression |
| `Assets/Props/Repair/bike_wheel.png` | TireRig wheel/tire | 96x96, 18 KB | Missing `.aseprite` | Production-acceptable, needs source |
| `Assets/Props/Repair/inner_tube.png` | TireRig tube | 96x64, 10 KB | Missing `.aseprite` | Production-acceptable, needs source |
| `Assets/Props/Repair/floor_air_pump.png` | TireRig pump | 64x96, 6 KB | Missing `.aseprite` | Production-acceptable, needs source |
| `Assets/Props/Repair/tire_patch_kit.png` | Tire repair supply prop | 48x48, 4 KB | Missing `.aseprite` | Production-acceptable, needs source |
| `Assets/Props/BikeRepair/single_tube_patch.png` | Applied tire patch | 64x40, 516 B | Missing `.aseprite` | Production-acceptable as small applied patch |
| `Assets/Props/BikeRepair/prepared_patch_zone.png` | Tire prep surface | 72x48, 614 B | Missing `.aseprite` | Production-acceptable as overlay |
| `Assets/Props/BikeRepair/air_escape_trace.png` | Leak/air trace | 72x54, 443 B | Missing `.aseprite` | Production-acceptable as effect |
| `Assets/Props/BikeRepair/tire_lever_set.png` | Tire repair supply prop | 48x32, 2 KB | Missing `.aseprite` | Production-acceptable, needs source |
| `Assets/Props/BikeRepair/chain_breaker_tool.png` | Chain repair supply prop | 48x32, 2 KB | Missing `.aseprite` | Production-acceptable, needs source |

## Scene References

| Scene | References |
| --- | --- |
| `Regions/Neighborhood/NeighborhoodStreet.tscn` | Safety bike base/brake/tire/chain state PNGs. |
| `Regions/Garage/SlippedChainStation.tscn` | Embedded chain rig and garage repair stand. |
| `Prototypes/EmbodiedMechanics/TireRig.tscn` | Wheel, tube, pump, patch, prep-zone, air trace, notebook, levers. |
| `Regions/Garage/ZuzuGarage.tscn` | Tool props and repair station instances. |

## Immediate Fix Policy

- Replace low-quality runtime bike PNGs with the pass-1 quality baseline or derived pass-1 variants.
- Generate `.aseprite` source files from the restored surfaced PNGs so the local source contract is no longer empty.
- Keep backup PNGs as historical references, but do not let runtime scenes point at backup-named assets.
