# Anime Art Pipeline (Executive Brain) — live GPU generation

The local GPU art pipeline is **online and proven**. Owner directive: reimagine the
whole game's graphics in an **anime** style using the GPUs/ComfyUI.

## Capability (verified this session)
- **Hardware:** 2× RTX 5090 (32 GB each, ~31 GB free).
- **ComfyUI:** installed at `C:\AI\ComfyUI` (venv + `main.py`); driven via its HTTP
  API on `127.0.0.1:8188`.
- **Model:** `sd_xl_base_1.0.safetensors` (vanilla SDXL base — does solid anime with
  strong prompting; a dedicated anime SDXL checkpoint, e.g. Animagine XL, would push
  quality from "great" to "amazing" — a ~6 GB download decision).
- **Speed:** ~3–6 s per 832×1216 image on a 5090.

### Critical fix (Blackwell GPUs)
The RTX 5090 is compute capability **12.0** — too new for the installed **xformers**
build, so the default attention path crashes the KSampler
(`memory_efficient_attention_forward ... requires capability <= (9,0)`). **Launch
ComfyUI with `--use-pytorch-cross-attention`** (native attention) and it works:
```
C:\AI\ComfyUI\venv\Scripts\python.exe main.py --port 8188 --use-pytorch-cross-attention
```

## Generator
`scripts/art/comfy_gen.py` — reusable: builds an SDXL txt2img graph, submits to
ComfyUI, polls `/history`, copies the result into the repo.
```
python scripts/art/comfy_gen.py --prompt "..." --out path.png \
  --w 832 --h 1216 --seed 7 --steps 30 --sampler dpmpp_2m --scheduler karras
```
`scripts/art/gen_cast.sh` — batch-generates the main cast with one shared style
string + per-character descriptions (consistency).

## First batch — the main cast (anime), in `artifacts/bikebrowser/anime_proof/`
zuzu · dex · chen · ramirez · mariam — full-body anime illustrations, on-character.
**These are concept/key-art quality**, not yet game-ready sprites.

## Realistic path to "the entire game"
1. **Style lock** (taste): pick the look from the first batch / iterate prompts +
   (optionally) add an anime checkpoint. Human-curated — taste is the gate.
2. **Sprite-ready characters:** background-remove (the `background_removal` models
   are installed) → trim/resize to the game's sprite sizes.
3. **The animation problem (the hard part):** the game uses **4-direction walk
   spritesheets** (e.g. `zuzuWalkSheet`). SDXL gives ONE hero pose, not a consistent
   animated walk cycle. Options, smallest-first:
   a. **Static idle sprites** — replace the standing neighborhood NPCs with the new
      anime art (background-removed). High impact, achievable now; loses walk frames.
   b. **Dialogue portraits** — show the anime key-art when a character speaks.
   c. **Animated sheets** — a much larger effort (ControlNet pose-conditioning +
      consistency); a later phase.
4. **Backdrops & props:** anime backdrops (Community Crossing, environment vistas)
   are *easier* than characters (no animation/consistency constraint) — high ROI.
5. **Integrate** into `act1AssetManifest` + loaders; validate in-game; iterate.

## Honest caveats
- Quality is a **human/taste judgment** — the owner curates which generations ship.
- Character **consistency across many sprites/frames** is the real challenge; static
  art + backdrops are the reliable early wins.
- "Anime" is a deliberate **style change** from the canon pixel-JRPG look (decision
  #2) — owner-directed; arc.md/decision log updated to record the new direction.
