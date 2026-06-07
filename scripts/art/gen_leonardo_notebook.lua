-- gen_leonardo_notebook.lua — authored Leonardo-notebook backdrop for the bridge
-- design / load-test scenes. Run headless:
--   aseprite -b --script scripts/art/gen_leonardo_notebook.lua
-- Produces a real raster (paper grain + jittered sepia ink) — replaces the old
-- procedural Phaser-graphics backdrop. Deterministic (seeded) so re-runs match.
-- v2: heavier ink weight/coverage + cross-hatch shading for a denser, more
-- confident notebook page.

local W, H = 960, 600
local ASE = "C:/dev/bikebrowser/src/game/art/source/aseprite/act1/leonardo_notebook.aseprite"
local PNG = "C:/dev/bikebrowser/src/game/art/final/act1/leonardo_notebook.png"
local SRCPNG = "C:/dev/bikebrowser/src/game/art/source/aseprite/act1/leonardo_notebook_source.png"

math.randomseed(1337)
local spr = Sprite(W, H, ColorMode.RGB)
local img = spr.cels[1].image
local pc = app.pixelColor

local function clampb(v) if v < 0 then return 0 elseif v > 255 then return 255 else return math.floor(v) end end

local function blend(x, y, r, g, b, a)
  x = math.floor(x); y = math.floor(y)
  if x < 0 or y < 0 or x >= W or y >= H then return end
  a = (a or 255) / 255
  local d = img:getPixel(x, y)
  local dr, dg, db, da = pc.rgbaR(d), pc.rgbaG(d), pc.rgbaB(d), pc.rgbaA(d)
  if da == 0 then dr, dg, db = r, g, b end
  img:drawPixel(x, y, pc.rgba(clampb(dr * (1 - a) + r * a), clampb(dg * (1 - a) + g * a), clampb(db * (1 - a) + b * a), 255))
end

local function fillRect(x, y, w, h, r, g, b, a)
  for yy = y, y + h - 1 do for xx = x, x + w - 1 do blend(xx, yy, r, g, b, a) end end
end

local function disc(cx, cy, rad, r, g, b, a)
  for yy = -rad, rad do for xx = -rad, rad do
    if xx * xx + yy * yy <= rad * rad then blend(cx + xx, cy + yy, r, g, b, a) end
  end end
end

local function softBlob(cx, cy, rad, r, g, b, a)
  for yy = -rad, rad do for xx = -rad, rad do
    local d = math.sqrt(xx * xx + yy * yy)
    if d <= rad then blend(cx + xx, cy + yy, r, g, b, a * (1 - d / rad)) end
  end end
end

-- hand-drawn ink stroke: Bresenham walk with per-step jitter + variable weight.
-- v2: higher base alpha + heavier dabs => bolder, more confident lines.
local function ink(x0, y0, x1, y1, r, g, b, a, weight)
  weight = weight or 1
  x0 = math.floor(x0); y0 = math.floor(y0); x1 = math.floor(x1); y1 = math.floor(y1)
  local dx = math.abs(x1 - x0); local dy = -math.abs(y1 - y0)
  local sx = x0 < x1 and 1 or -1; local sy = y0 < y1 and 1 or -1
  local err = dx + dy
  while true do
    local jx = (math.random() < 0.3) and (math.random(0, 1)) or 0
    local jy = (math.random() < 0.3) and (math.random(0, 1)) or 0
    local aa = a * (0.82 + math.random() * 0.18)
    disc(x0 + jx, y0 + jy, weight, r, g, b, aa)
    if x0 == x1 and y0 == y1 then break end
    local e2 = 2 * err
    if e2 >= dy then err = err + dy; x0 = x0 + sx end
    if e2 <= dx then err = err + dx; y0 = y0 + sy end
  end
end

local INK = { 46, 30, 16 }
local FAINT = { 86, 62, 36 }
local RED = { 150, 52, 34 }
local GRN = { 58, 92, 44 }

-- parallel-line shading inside a region predicate (adds tonal depth)
local function hatch(x0, y0, x1, y1, step, ang, r, g, b, a, inside)
  local dx, dy = math.cos(ang), math.sin(ang)
  for off = -(x1 - x0) - (y1 - y0), (x1 - x0) + (y1 - y0), step do
    local px, py = (x0 + x1) / 2 + dx * off, (y0 + y1) / 2 + dy * off
    for t = -((x1 - x0) + (y1 - y0)), (x1 - x0) + (y1 - y0), 1 do
      local x = px - dy * t; local y = py + dx * t
      if x >= x0 and x <= x1 and y >= y0 and y <= y1 and (not inside or inside(x, y)) then
        blend(x, y, r, g, b, a)
      end
    end
  end
end

local function node(x, y, r, g, b) disc(x, y, 3, r, g, b, 245) end

local function arrowhead(x, y, ang, r, g, b)
  local s = 8
  ink(x, y, x - math.cos(ang - 0.5) * s, y - math.sin(ang - 0.5) * s, r, g, b, 245, 2)
  ink(x, y, x - math.cos(ang + 0.5) * s, y - math.sin(ang + 0.5) * s, r, g, b, 245, 2)
end

local function script(x, y, rows, cols, r, g, b)
  for i = 0, rows - 1 do
    local yy = y + i * 7
    local n = cols + math.random(-1, 1)
    local cx = x
    for _ = 1, n do
      local wlen = math.random(6, 16)
      ink(cx, yy + math.random(-1, 1), cx + wlen, yy + math.random(-1, 1), r, g, b, 200, 1)
      cx = cx + wlen + math.random(3, 6)
    end
  end
end

-- ===== 1. parchment base =====
fillRect(0, 0, W, H, 228, 209, 165, 255)
for _ = 1, 24000 do
  local x, y = math.random(0, W - 1), math.random(0, H - 1)
  if math.random() < 0.5 then blend(x, y, 196, 176, 132, 30) else blend(x, y, 244, 230, 196, 24) end
end
for _ = 1, 40 do softBlob(math.random(0, W), math.random(0, H), math.random(40, 120), 206, 184, 138, 20) end
for _ = 1, 16 do softBlob(math.random(40, W - 40), math.random(40, H - 40), math.random(10, 26), 178, 138, 84, 55) end
for y = 0, H - 1 do for x = 0, W - 1 do
  local ex = math.min(x, W - 1 - x); local ey = math.min(y, H - 1 - y)
  local e = math.min(ex / 90, ey / 90)
  if e < 1 then blend(x, y, 150, 120, 78, (1 - e) * 46) end
end end

-- ===== 2. borders =====
local function frame(inset, weight, a)
  ink(inset, inset, W - inset, inset, INK[1], INK[2], INK[3], a, weight)
  ink(inset, H - inset, W - inset, H - inset, INK[1], INK[2], INK[3], a, weight)
  ink(inset, inset, inset, H - inset, INK[1], INK[2], INK[3], a, weight)
  ink(W - inset, inset, W - inset, H - inset, INK[1], INK[2], INK[3], a, weight)
end
frame(14, 3, 240)
frame(22, 2, 175)

-- ===== 3. title block =====
script(70, 50, 2, 7, INK[1], INK[2], INK[3])
ink(70, 74, 470, 74, FAINT[1], FAINT[2], FAINT[3], 175, 1)

-- ===== 4. Leonardo's self-supporting (reciprocal) arch bridge =====
local ax0, ax1, ay, sag = 110, 470, 360, 150
local function arcY(x, lift)
  local hs = (ax1 - ax0) / 2; local cx = (ax0 + ax1) / 2
  local t = (x - cx) / hs
  return ay - lift * (1 - t * t)
end
-- shade beneath the arch crown for volume (hatch only under the outer arc)
hatch(ax0, ay - sag, ax1, ay, 5, math.rad(58), FAINT[1], FAINT[2], FAINT[3], 26,
  function(x, y) return y > arcY(x, sag - 34) and y < arcY(x, sag) + 8 end)
local prevOx, prevOy, prevIx, prevIy
for x = ax0, ax1, 3 do
  local oy = arcY(x, sag); local iy = arcY(x, sag - 34)
  if prevOx then
    ink(prevOx, prevOy, x, oy, INK[1], INK[2], INK[3], 248, 3)
    ink(prevIx, prevIy, x, iy, INK[1], INK[2], INK[3], 220, 2)
  end
  prevOx, prevOy, prevIx, prevIy = x, oy, x, iy
end
local up = true
for x = ax0 + 12, ax1 - 12, 30 do
  local oy = arcY(x, sag); local nx = x + 30; local niy = arcY(nx, sag - 34)
  if up then ink(x, oy, nx, niy, INK[1], INK[2], INK[3], 235, 2) else ink(x, arcY(x, sag - 34), nx, arcY(nx, sag), INK[1], INK[2], INK[3], 235, 2) end
  ink(x, oy, x, arcY(x, sag - 34), INK[1], INK[2], INK[3], 175, 1)
  up = not up
end
for x = ax0 + 10, ax1 - 10, 22 do
  local oy = arcY(x, sag)
  ink(x, oy - 6, x + 14, arcY(x + 14, sag) - 6, FAINT[1], FAINT[2], FAINT[3], 200, 2)
end
ink(ax0, ay, ax0, ay + 40, INK[1], INK[2], INK[3], 240, 3)
ink(ax1, ay, ax1, ay + 40, INK[1], INK[2], INK[3], 240, 3)
ink(ax0 - 16, ay + 40, ax1 + 16, ay + 40, INK[1], INK[2], INK[3], 215, 2)
script(150, 392, 2, 5, FAINT[1], FAINT[2], FAINT[3])

-- ===== 5. truss study with compression/tension annotations =====
local dx0, dx1, dy = 560, 860, 210
hatch(dx0 + 50, dy, dx1 - 50, dy + 78, 6, math.rad(122), FAINT[1], FAINT[2], FAINT[3], 22,
  function(x, y)
    local midx = (dx0 + dx1) / 2
    local prog = (x - (dx0 + 50)) / ((dx1 - 50) - (dx0 + 50))
    local lowy = dy + 78 * (1 - math.abs(0.5 - prog) * 2 * 0.0) -- inside triangle-ish band
    return y > dy + 6 and y < dy + 72 and x > dx0 + 50 and x < dx1 - 50 and (math.abs(x - midx) < (1 - (y - dy) / 78) * 100)
  end)
ink(dx0, dy, dx1, dy, INK[1], INK[2], INK[3], 248, 3)
ink(dx0 + 50, dy, dx0 + 50, dy + 78, INK[1], INK[2], INK[3], 248, 3)
ink(dx1 - 50, dy, dx1 - 50, dy + 78, INK[1], INK[2], INK[3], 248, 3)
ink(dx0 + 50, dy + 78, dx1 - 50, dy + 78, INK[1], INK[2], INK[3], 230, 2)
ink(dx0 + 50, dy + 78, (dx0 + dx1) / 2, dy, INK[1], INK[2], INK[3], 230, 2)
ink(dx1 - 50, dy + 78, (dx0 + dx1) / 2, dy, INK[1], INK[2], INK[3], 230, 2)
for _, p in ipairs({ { dx0, dy }, { dx1, dy }, { dx0 + 50, dy }, { dx1 - 50, dy }, { (dx0 + dx1) / 2, dy }, { dx0 + 50, dy + 78 }, { dx1 - 50, dy + 78 } }) do
  node(p[1], p[2], INK[1], INK[2], INK[3])
end
ink(dx0 + 28, dy + 40, dx0 + 47, dy + 40, RED[1], RED[2], RED[3], 248, 2); arrowhead(dx0 + 47, dy + 40, 0, RED[1], RED[2], RED[3])
ink(dx0 + 72, dy + 40, dx0 + 53, dy + 40, RED[1], RED[2], RED[3], 248, 2); arrowhead(dx0 + 53, dy + 40, math.pi, RED[1], RED[2], RED[3])
script(dx0 + 22, dy - 24, 1, 4, RED[1], RED[2], RED[3])
ink((dx0 + dx1) / 2 - 6, dy + 78, (dx0 + dx1) / 2 - 30, dy + 78, GRN[1], GRN[2], GRN[3], 248, 2); arrowhead((dx0 + dx1) / 2 - 30, dy + 78, math.pi, GRN[1], GRN[2], GRN[3])
ink((dx0 + dx1) / 2 + 6, dy + 78, (dx0 + dx1) / 2 + 30, dy + 78, GRN[1], GRN[2], GRN[3], 248, 2); arrowhead((dx0 + dx1) / 2 + 30, dy + 78, 0, GRN[1], GRN[2], GRN[3])
script(dx0 + 70, dy + 92, 1, 5, GRN[1], GRN[2], GRN[3])

-- ===== 6. compass / divider study =====
local hx, hy = 240, 430
ink(hx, hy, hx - 34, hy + 96, INK[1], INK[2], INK[3], 245, 3)
ink(hx, hy, hx + 34, hy + 96, INK[1], INK[2], INK[3], 245, 3)
disc(hx, hy, 5, INK[1], INK[2], INK[3], 250)
local prevx, prevy
for a = 20, 160, 5 do
  local rad = a * math.pi / 180
  local x = hx + math.cos(rad) * 90; local y = hy + 96 - math.sin(rad) * 18
  if prevx then ink(prevx, prevy, x, y, FAINT[1], FAINT[2], FAINT[3], 185, 1) end
  prevx, prevy = x, y
end

-- ===== 7. scale bar + notes =====
local sbx, sby = 560, 470
ink(sbx, sby, sbx + 220, sby, INK[1], INK[2], INK[3], 235, 2)
for i = 0, 8 do ink(sbx + i * 27.5, sby - 5, sbx + i * 27.5, sby + 5, INK[1], INK[2], INK[3], 235, 2) end
script(560, 488, 4, 8, INK[1], INK[2], INK[3])
script(70, 470, 6, 5, INK[1], INK[2], INK[3])

-- a wheel doodle (margin)
local prevwx, prevwy
for a = 0, 360, 10 do
  local rad = a * math.pi / 180
  local x = 820 + math.cos(rad) * 24; local y = 110 + math.sin(rad) * 24
  if prevwx then ink(prevwx, prevwy, x, y, FAINT[1], FAINT[2], FAINT[3], 215, 2) end
  prevwx, prevwy = x, y
  ink(820, 110, x, y, FAINT[1], FAINT[2], FAINT[3], 120, 1)
end

spr:saveAs(ASE)
img:saveAs(PNG)
img:saveAs(SRCPNG)
print("leonardo_notebook v2: wrote " .. PNG)
