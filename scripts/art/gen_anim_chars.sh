#!/bin/bash
CK="animagine-xl-4.0.safetensors"
Q="masterpiece, high score, great score, absurdres"
NEG="lowres, bad anatomy, bad hands, text, error, missing finger, extra digits, fewer digits, cropped, worst quality, low quality, low score, bad score, average score, signature, watermark, username, blurry, multiple views, 2boys, 2girls, multiple people"
g() { python scripts/art/comfy_gen.py --ckpt "$CK" --cfg 6 --steps 28 --seed "$1" --w "$2" --h "$3" --neg "$NEG" --prefix "$4" --out "$5" --prompt "$Q, $6"; }
declare -A TAG
TAG[zuzu]="1boy, child, dark-skinned male, short curly black hair, brown eyes, teal bicycle helmet, teal and white cycling vest, white shirt, brown cargo shorts, sneakers"
TAG[dex]="1boy, teenager, light brown hair, backwards green baseball cap, green jacket, white shirt, baggy jeans, sneakers, smirk"
TAG[chen]="1boy, old man, elderly, grey hair, round glasses, brown apron, blue work shirt, gentle smile"
TAG[ramirez]="1girl, mature female, brown hair, hair bun, floral apron, pink blouse, warm smile"
TAG[mariam]="1girl, old woman, elderly, hijab, teal headscarf, embroidered earth-tone dress, gentle smile"
for c in zuzu dex chen ramirez mariam; do
  g $((10+RANDOM%90)) 832 1216 "ap_$c" "artifacts/bikebrowser/anime_proof/port_$c.png" "${TAG[$c]}, full body, standing, looking at viewer, gentle smile, detailed sonoran desert background, soft light"
  g $((100+RANDOM%90)) 768 1280 "af_$c" "artifacts/bikebrowser/anime_proof/aspr_$c.png" "${TAG[$c]}, full body, standing straight, facing viewer, arms at sides, simple background, white background, full body visible head to toe"
  g $((200+RANDOM%90)) 768 1280 "ab_$c" "artifacts/bikebrowser/anime_proof/aback_$c.png" "${TAG[$c]}, full body, standing, from behind, back view, facing away from viewer, simple background, white background, full body visible head to toe"
done
echo CHARS_DONE
