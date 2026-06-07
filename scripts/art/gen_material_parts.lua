-- gen_material_parts.lua — Leonardo "beam study" sketches, one per construction
-- material, as an 8-frame 128x48 spritesheet. Replaces the flat colored
-- rectangles in the bridge-assembly tray. Run headless:
--   aseprite -b --script scripts/art/gen_material_parts.lua
-- Frame order (must match MATERIAL_FRAME in BridgeDesignScene.js):
--   0 balsa  1 pine  2 bamboo  3 brick  4 concrete  5 iron  6 steel  7 carbon_fiber

local FW, FH, N = 128, 48, 8
local W, H = FW * N, FH
local ASE = "C:/dev/bikebrowser/src/game/art/source/aseprite/act1/material_parts.aseprite"
local PNG = "C:/dev/bikebrowser/src/game/art/final/act1/material_parts.png"
local SRCPNG = "C:/dev/bikebrowser/src/game/art/source/aseprite/act1/material_parts_source.png"

math.randomseed(7)
local spr = Sprite(W, H, ColorMode.RGB)
local img = spr.cels[1].image
local pc = app.pixelColor
local function cl(v) if v < 0 then return 0 elseif v > 255 then return 255 else return math.floor(v + 0.5) end end

-- alpha-correct source-over so the sprite stays cleanly transparent
local function blend(x, y, r, g, b, a)
  x = math.floor(x); y = math.floor(y)
  if x < 0 or y < 0 or x >= W or y >= H then return end
  local na = (a or 255) / 255; if na <= 0 then return end
  local d = img:getPixel(x, y)
  local dr, dg, db, da = pc.rgbaR(d), pc.rgbaG(d), pc.rgbaB(d), pc.rgbaA(d) / 255
  local oa = na + da * (1 - na)
  if oa <= 0 then return end
  local nr = (r * na + dr * da * (1 - na)) / oa
  local ng = (g * na + dg * da * (1 - na)) / oa
  local nb = (b * na + db * da * (1 - na)) / oa
  img:drawPixel(x, y, pc.rgba(cl(nr), cl(ng), cl(nb), cl(oa * 255)))
end

local function rect(x, y, w, h, r, g, b, a) for yy = y, y + h - 1 do for xx = x, x + w - 1 do blend(xx, yy, r, g, b, a) end end end
local function disc(cx, cy, rad, r, g, b, a) for yy = -rad, rad do for xx = -rad, rad do if xx * xx + yy * yy <= rad * rad then blend(cx + xx, cy + yy, r, g, b, a) end end end end
local function ink(x0, y0, x1, y1, r, g, b, a, w)
  w = w or 0
  x0 = math.floor(x0); y0 = math.floor(y0); x1 = math.floor(x1); y1 = math.floor(y1)
  local dx = math.abs(x1 - x0); local dy = -math.abs(y1 - y0)
  local sx = x0 < x1 and 1 or -1; local sy = y0 < y1 and 1 or -1
  local err = dx + dy
  while true do
    if w > 0 then disc(x0, y0, w, r, g, b, a) else blend(x0, y0, r, g, b, a) end
    if x0 == x1 and y0 == y1 then break end
    local e2 = 2 * err
    if e2 >= dy then err = err + dy; x0 = x0 + sx end
    if e2 <= dx then err = err + dx; y0 = y0 + sy end
  end
end

local SEPIA = { 54, 37, 20 }
local MATS = {
  { id = 'balsa', col = { 232, 214, 168 }, tex = 'grain' },
  { id = 'pine', col = { 217, 176, 106 }, tex = 'grain' },
  { id = 'bamboo', col = { 158, 196, 106 }, tex = 'bamboo' },
  { id = 'brick', col = { 176, 87, 58 }, tex = 'brick' },
  { id = 'concrete', col = { 154, 154, 146 }, tex = 'aggregate' },
  { id = 'iron', col = { 115, 128, 143 }, tex = 'rivet' },
  { id = 'steel', col = { 174, 184, 198 }, tex = 'ibeam' },
  { id = 'carbon_fiber', col = { 59, 65, 76 }, tex = 'weave', dark = true },
}

local function darker(c, f) return { cl(c[1] * f), cl(c[2] * f), cl(c[3] * f) } end
local function lighter(c, f) return { cl(c[1] + (255 - c[1]) * f), cl(c[2] + (255 - c[2]) * f), cl(c[3] + (255 - c[3]) * f) } end

-- body of the beam in cell `ox`: x in [bx1,bx2], y in [by1,by2]
local bx1d, bx2d, by1, by2 = 12, 116, 14, 33

local function drawMaterial(ox, m)
  local bx1, bx2 = ox + bx1d, ox + bx2d
  local col = m.col
  local outline = m.dark and { 150, 156, 168 } or SEPIA
  -- body fill (skip extreme corner pixels for a slightly rounded plank)
  for y = by1, by2 do for x = bx1, bx2 do
    local corner = (x < bx1 + 2 and (y < by1 + 1 or y > by2 - 1)) or (x > bx2 - 2 and (y < by1 + 1 or y > by2 - 1))
    if not corner then blend(x, y, col[1], col[2], col[3], 255) end
  end end
  -- top highlight + bottom shadow for volume
  rect(bx1, by1, bx2 - bx1, 2, lighter(col, 0.35)[1], lighter(col, 0.35)[2], lighter(col, 0.35)[3], 150)
  rect(bx1, by2 - 2, bx2 - bx1, 3, darker(col, 0.7)[1], darker(col, 0.7)[2], darker(col, 0.7)[3], 150)

  -- per-material texture
  local dk = darker(col, 0.72)
  local lt = lighter(col, 0.4)
  if m.tex == 'grain' then
    for i = 0, 3 do local y = by1 + 4 + i * 4 + math.random(-1, 1); ink(bx1 + 4, y, bx2 - 4, y + math.random(-1, 1), dk[1], dk[2], dk[3], 110, 0) end
  elseif m.tex == 'bamboo' then
    for _, fx in ipairs({ 0.25, 0.5, 0.75 }) do
      local x = math.floor(bx1 + (bx2 - bx1) * fx)
      rect(x - 1, by1, 3, by2 - by1 + 1, dk[1], dk[2], dk[3], 170)
      blend(x, by1 - 1, dk[1], dk[2], dk[3], 200)
    end
    ink(bx1 + 3, by1 + 3, bx2 - 3, by1 + 3, lt[1], lt[2], lt[3], 120, 0)
  elseif m.tex == 'brick' then
    for i = 1, 2 do local y = by1 + i * 6; ink(bx1, y, bx2, y, lt[1], lt[2], lt[3], 200, 0) end
    for row = 0, 2 do local y0 = by1 + row * 6; for j = 0, 6 do local x = bx1 + 8 + j * 16 + (row % 2) * 8; if x < bx2 then ink(x, y0, x, y0 + 6, lt[1], lt[2], lt[3], 200, 0) end end end
  elseif m.tex == 'aggregate' then
    for _ = 1, 70 do local x = math.random(bx1 + 2, bx2 - 2); local y = math.random(by1 + 1, by2 - 1); if math.random() < 0.5 then blend(x, y, dk[1], dk[2], dk[3], 160) else blend(x, y, lt[1], lt[2], lt[3], 150) end end
    ink(bx1 + 30, by1, bx1 + 30, by2, dk[1], dk[2], dk[3], 90, 0)
    ink(bx1 + 64, by1, bx1 + 64, by2, dk[1], dk[2], dk[3], 90, 0)
  elseif m.tex == 'rivet' then
    for j = 0, 9 do local x = bx1 + 8 + j * 11; disc(x, by1 + 4, 2, dk[1], dk[2], dk[3], 230); disc(x, by2 - 3, 2, dk[1], dk[2], dk[3], 230); blend(x - 1, by1 + 3, lt[1], lt[2], lt[3], 200) end
    rect(bx1 + 2, by1 + 9, bx2 - bx1 - 4, 4, dk[1], dk[2], dk[3], 60)
  elseif m.tex == 'ibeam' then
    rect(bx1, by1, bx2 - bx1, 4, dk[1], dk[2], dk[3], 210)        -- top flange
    rect(bx1, by2 - 3, bx2 - bx1, 4, dk[1], dk[2], dk[3], 210)    -- bottom flange
    rect(math.floor((bx1 + bx2) / 2) - 3, by1 + 4, 7, by2 - by1 - 7, dk[1], dk[2], dk[3], 120) -- web
    ink(bx1 + 6, by1 + 6, bx2 - 14, by1 + 6, 255, 255, 255, 90, 0) -- sheen
  elseif m.tex == 'weave' then
    for off = -20, (bx2 - bx1), 6 do ink(bx1 + off, by2, bx1 + off + (by2 - by1), by1, lt[1], lt[2], lt[3], 70, 0) end
    for off = -20, (bx2 - bx1), 6 do ink(bx1 + off, by1, bx1 + off + (by2 - by1), by2, dk[1], dk[2], dk[3], 70, 0) end
    ink(bx1 + 8, by1 + 4, bx2 - 18, by1 + 4, 210, 220, 235, 70, 0) -- sheen
  end

  -- ink outline (hand-drawn)
  ink(bx1, by1, bx2, by1, outline[1], outline[2], outline[3], 235, 0)
  ink(bx1, by2, bx2, by2, outline[1], outline[2], outline[3], 235, 0)
  ink(bx1, by1, bx1, by2, outline[1], outline[2], outline[3], 235, 0)
  ink(bx2, by1, bx2, by2, outline[1], outline[2], outline[3], 235, 0)

  -- small "study" dimension line beneath (Leonardo notebook touch)
  local dy = by2 + 6
  ink(bx1, dy, bx2, dy, SEPIA[1], SEPIA[2], SEPIA[3], 150, 0)
  ink(bx1, dy - 2, bx1, dy + 2, SEPIA[1], SEPIA[2], SEPIA[3], 150, 0)
  ink(bx2, dy - 2, bx2, dy + 2, SEPIA[1], SEPIA[2], SEPIA[3], 150, 0)
  -- a couple of mirror-script tick marks above
  for j = 0, 3 do local x = bx1 + 4 + j * 9; ink(x, by1 - 4, x + 5, by1 - 4, SEPIA[1], SEPIA[2], SEPIA[3], 120, 0) end
end

for i, m in ipairs(MATS) do drawMaterial((i - 1) * FW, m) end

spr:saveAs(ASE)
img:saveAs(PNG)
img:saveAs(SRCPNG)
print("material_parts: wrote " .. PNG .. " (" .. N .. " frames " .. FW .. "x" .. FH .. ")")
