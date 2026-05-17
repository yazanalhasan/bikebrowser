param(
  [string]$Character,
  [string]$Action,
  [string]$Mode = $Action,
  [string]$Duration = '140'
)
$raw = Get-ChildItem -Recurse C:\Users\yazan\.codex\generated_images -Filter *.png | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName
$out = "BikeBrowserWorld\Assets\Characters\$Character\${Character}_$Action"
New-Item -ItemType Directory -Force -Path $out | Out-Null
Copy-Item $raw (Join-Path $out 'raw-sheet.png') -Force
python C:\Users\yazan\.codex\skills\generate2dsprite\scripts\generate2dsprite.py process --input (Join-Path $out 'raw-sheet.png') --target npc --mode $Mode --output-dir $out --rows 4 --cols 4 --cell-size 96 --label-prefix "${Character}_$Action" --fit-scale 0.92 --align feet --shared-scale --component-mode largest --component-padding 8 --min-component-area 120 --edge-touch-margin 2 --duration $Duration
Copy-Item (Join-Path $out 'sheet-transparent.png') "BikeBrowserWorld\Assets\Characters\$Character\${Character}_$Action.png" -Force
