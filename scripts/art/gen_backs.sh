#!/bin/bash
STYLE="masterpiece, best quality, anime style, cel shaded 2D anime, full body head to toe, BACK VIEW seen from behind, facing away from viewer, back of the head and body visible, standing straight, single character only, centered, clean lineart, simple flat solid light grey background, no scenery, game character sprite"
NEG="front view, face, facing camera, two characters, multiple views, turnaround, character sheet, text, watermark, blurry, lowres, deformed, extra limbs, 3d, photorealistic"
gen() { python scripts/art/comfy_gen.py --seed "$1" --w 640 --h 1280 --steps 30 --neg "$NEG" --prefix "back_$2" --out "artifacts/bikebrowser/anime_proof/back_$2.png" --prompt "$STYLE, $3"; }
gen 401 zuzu    "young desert kid, short curly dark hair, teal bike helmet, white tshirt, backpack straps, brown shorts, sneakers"
gen 402 dex     "teenage BMX kid, backwards green cap, green jacket, baggy jeans, sneakers"
gen 403 chen    "elderly asian man, grey hair, brown apron straps over a blue shirt, trousers"
gen 404 ramirez "middle aged latina woman, dark hair in a bun, apron tied at the back, long skirt"
gen 405 mariam  "elderly woman, teal headscarf, long earthy embroidered dress"
echo BACKS_DONE
