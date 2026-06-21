#!/bin/bash
STYLE="masterpiece, best quality, anime style, cel shaded 2D anime, full body head to toe visible, standing straight facing viewer, relaxed neutral standing pose, full character visible, centered, clean crisp lineart, vibrant colors, simple flat solid light grey background, no scenery, game character sprite"
gen() { python scripts/art/comfy_gen.py --seed "$1" --w 768 --h 1280 --steps 30 --prefix "spr_$2" --out "artifacts/bikebrowser/anime_proof/sprite_$2.png" --prompt "$STYLE, $3"; }
gen 101 zuzu    "a cheerful young desert kid, warm brown skin, short curly dark hair, teal bike helmet, teal and white adventure outfit with shorts, small sneakers"
gen 102 dex     "a cocky teenage BMX kid, tan skin, messy brown hair under a backwards green cap, green jacket, baggy jeans, sneakers"
gen 103 chen    "a kind elderly asian man, grey hair, round glasses, brown mechanic apron over a blue work shirt, trousers, gentle smile"
gen 104 ramirez "a warm middle aged latina woman, dark hair in a bun, floral apron over a pink blouse, long skirt, friendly smile"
gen 105 mariam  "a gentle elderly middle eastern woman, soft teal headscarf, long embroidered earthy traditional dress, warm smile"
echo WORLD_DONE
