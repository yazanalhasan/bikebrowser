#!/bin/bash
STYLE="masterpiece, best quality, anime style, cel shaded 2D anime illustration, full body character, vibrant saturated colors, clean crisp lineart, soft anime shading, studio ghibli inspired, isolated character, simple flat pale background, character reference"
gen() { python scripts/art/comfy_gen.py --seed "$1" --w 832 --h 1216 --prefix "bb_$2" --out "artifacts/bikebrowser/anime_proof/$2.png" --prompt "$STYLE, $3"; }
gen 11 zuzu   "a cheerful brave young desert kid, warm brown skin, short curly dark hair, teal bike helmet, teal and white adventure outfit, friendly confident smile"
gen 22 dex    "a cocky confident teenage BMX kid, tan skin, messy brown hair under a backwards green cap, baggy streetwear, smirking, arms crossed"
gen 33 chen   "a calm wise elderly asian man, grey hair, round glasses, brown mechanic apron over work shirt, kind warm eyes, gentle"
gen 44 ramirez "a warm caring middle aged latina woman, dark hair in a bun, floral apron, friendly motherly smile"
gen 55 mariam "a gentle wise elderly middle eastern woman, soft headscarf, traditional embroidered dress, warm kind smile, holding seeds"
echo ALL_DONE
