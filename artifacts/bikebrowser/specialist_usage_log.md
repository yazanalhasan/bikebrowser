# BikeBrowser Specialist Usage Log (Executive Brain)

Records which AI/specialist handles which task and why. Routing policy:

| Task type | Primary | Why | Backup |
|---|---|---|---|
| Planning / architecture / project ownership | **Claude (this loop)** | reasoning, continuity, arc.md alignment | — |
| Dialogue / quests / world-building / character / art direction | **Claude** | narrative + canon judgment | local qwen (egress-free drafts) |
| Code implementation / debug / refactor / engine wiring | **Codex** | implementation throughput | Claude |
| Large-scale code iteration / experiments | Codex | breadth | DeepSeek (API; not local) |
| Art generation (pixel/concept) | **ComfyUI + SDXL (local GPU)** + Aseprite | egress-free, on-prem | Meshy/Hunyuan (3D only) |
| Art *quality judgment* | **Human** | no local multimodal critique | hosted vision model |
| E2E validation / browser automation | **Playwright** | deterministic runtime checks | — |
| Local LLM drafting (egress-free) | **Ollama qwen2.5 32B/72B** (dual RTX 5090) | private, free | — |

## Delegations this ownership era
| When | Task | Specialist | Outcome |
|---|---|---|---|
| This session | All P0/P1/Item-7 dialogue, quests, characters, heart-beats, bibles | Claude (direct edits) | shipped + validated (build+smoke) |
| This session | Build/smoke validation | Playwright + vite | green throughout |
| (Available, unused) | Real-executor code mutation | Codex via EB governed registry | not needed; edits direct + reviewable |

## Policy notes
- BikeBrowser is a governed EB project (codex/openclaw/playwright/visual_analysis
  executors registered); commits/pushes/deploys require approval.
- **No LangChain** unless a specific measurable benefit is shown.
- Prefer the cheapest sufficient specialist; document any delegation here.
