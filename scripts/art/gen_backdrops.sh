#!/bin/bash
NEG="characters, people, person, text, watermark, signature, ui, frame, border, blurry, lowres, deformed, photorealistic, 3d render"
gen() { python scripts/art/comfy_gen.py --seed "$1" --w 1216 --h 832 --steps 32 --neg "$NEG" --prefix "bg_$2" --out "artifacts/bikebrowser/anime_proof/bg_$2.png" --prompt "$3"; }
gen 201 crossing "masterpiece, anime painted background art, studio ghibli style scenery, golden hour over a desert dry-wash crossing, a sturdy repaired wooden footbridge spanning a sandy riverbed, saguaro cacti and mesquite, warm orange sunset sky, soft glowing light, sonoran desert, no people, scenic establishing shot, lush detailed background"
gen 202 skatepark "masterpiece, anime painted background art, studio ghibli style scenery, wide sonoran desert sky at warm golden hour, distant red rock hills and saguaro silhouettes, soft fluffy clouds, vibrant warm gradient sky, empty open landscape horizon, no people, scenic background for a skate park"
echo BG_DONE
