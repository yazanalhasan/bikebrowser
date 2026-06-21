#!/bin/bash
NEG="characters, people, person, text, watermark, ui, frame, border, blurry, lowres, deformed, 3d render, photorealistic"
gen() { python scripts/art/comfy_gen.py --seed "$1" --w 1216 --h 640 --steps 32 --neg "$NEG" --prefix "scn_$2" --out "artifacts/bikebrowser/anime_proof/scn_$2.png" --prompt "$3"; }
gen 501 utm        "masterpiece, anime painted background, studio ghibli interior, cozy desert garage workshop, a tall material testing press machine with gauges and a clamp, workbench with tools, pegboard wall, warm afternoon light through a dusty window, no people"
gen 502 ecology    "masterpiece, anime painted background, ghibli scenery, shady edge of a sonoran desert wash, mesquite and creosote bushes, dappled green light, small wildflowers and desert plants, warm earthy ground, no people"
gen 503 investigation "masterpiece, anime painted background, ghibli scenery, a dry desert riverbed scoured by a flash flood, sandy scoured banks, scattered driftwood and rocks, cool overcast light, moody, no people"
gen 504 biome      "masterpiece, anime painted background, ghibli scenery, a shallow salt river in the desert, salt-crusted pale banks, green reeds, distant red rock mesas, warm golden light, no people"
echo SCN_DONE
