#!/bin/bash
CK="animagine-xl-4.0.safetensors"
Q="masterpiece, high score, great score, absurdres, scenery, no humans"
NEG="humans, people, person, character, text, watermark, signature, ui, frame, blurry, lowres, worst quality, low quality, low score, bad score"
g() { python scripts/art/comfy_gen.py --ckpt "$CK" --cfg 6 --steps 30 --seed "$1" --w "$2" --h "$3" --neg "$NEG" --prefix "$4" --out "artifacts/bikebrowser/anime_proof/$5.png" --prompt "$Q, $6"; }
g 301 1216 832 ab_cross    bg_crossing      "golden hour over a sonoran desert dry wash, a sturdy repaired wooden footbridge over a sandy riverbed, saguaro cacti, mesquite, warm orange sunset sky, anime background art, ghibli"
g 302 1216 832 ab_skate    bg_skatepark     "wide sonoran desert at warm golden hour, distant red rock mesas, saguaro silhouettes, soft clouds, vibrant warm sky, open landscape, anime background art, ghibli"
g 303 1216 832 ab_ground   bg_ground        "top-down overhead view of sonoran desert ground, warm sandy soil, dry golden grass, small round desert shrubs, scattered rocks, faint dirt paths, anime map texture, no sky"
g 304 1216 640 ab_utm      scn_utm          "cozy desert garage workshop interior, a tall material testing press machine with gauges, workbench, tools on pegboard, warm light through a window, anime interior, ghibli"
g 305 1216 640 ab_eco      scn_ecology      "shady edge of a sonoran desert wash, mesquite and creosote bushes, dappled green light, small wildflowers, warm earthy ground, anime background, ghibli"
g 306 1216 640 ab_inv      scn_investigation "a dry desert riverbed scoured by a flash flood, sandy banks, scattered driftwood and rocks, cool overcast light, moody, anime background, ghibli"
g 307 1216 640 ab_biome    scn_biome        "shallow salt river in the desert, salt-crusted pale banks, green reeds, distant red mesas, warm golden light, anime background, ghibli"
echo BACKDROPS_DONE
