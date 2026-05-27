local output_dir = app.params["output"]
if output_dir == nil or output_dir == "" then
  error("Missing --script-param output=<dir>")
end

local sep = package.config:sub(1, 1)
local function out(name)
  return output_dir .. sep .. name
end

local function rgba(r, g, b, a)
  return Color { r = r, g = g, b = b, a = a }
end

local function make_sprite(width, height)
  local sprite = Sprite(width, height, ColorMode.RGB)
  sprite.filename = ""
  local layer = sprite.layers[1]
  layer.name = "art"
  local cel = sprite.cels[1]
  cel.image:clear(rgba(0, 0, 0, 0))
  return sprite, cel.image
end

local function save(sprite, path)
  sprite:saveAs(path)
  sprite:close()
end

local function pixel(image, x, y, color)
  if x >= 0 and y >= 0 and x < image.width and y < image.height then
    image:drawPixel(x, y, color)
  end
end

local function filled_ellipse(image, cx, cy, rx, ry, color)
  for y = math.floor(cy - ry), math.ceil(cy + ry) do
    for x = math.floor(cx - rx), math.ceil(cx + rx) do
      local dx = (x - cx) / rx
      local dy = (y - cy) / ry
      if dx * dx + dy * dy <= 1.0 then
        pixel(image, x, y, color)
      end
    end
  end
end

local function ellipse_ring(image, cx, cy, rx, ry, color)
  for y = math.floor(cy - ry - 1), math.ceil(cy + ry + 1) do
    for x = math.floor(cx - rx - 1), math.ceil(cx + rx + 1) do
      local dx = (x - cx) / rx
      local dy = (y - cy) / ry
      local d = dx * dx + dy * dy
      if d >= 0.75 and d <= 1.08 then
        pixel(image, x, y, color)
      end
    end
  end
end

local function line(image, x0, y0, x1, y1, color)
  local dx = math.abs(x1 - x0)
  local sx = x0 < x1 and 1 or -1
  local dy = -math.abs(y1 - y0)
  local sy = y0 < y1 and 1 or -1
  local err = dx + dy
  while true do
    pixel(image, x0, y0, color)
    if x0 == x1 and y0 == y1 then break end
    local e2 = 2 * err
    if e2 >= dy then
      err = err + dy
      x0 = x0 + sx
    end
    if e2 <= dx then
      err = err + dx
      y0 = y0 + sy
    end
  end
end

local rubber_dark = rgba(42, 48, 48, 255)
local rubber_mid = rgba(63, 73, 70, 255)
local rubber_light = rgba(102, 121, 111, 255)
local glue = rgba(214, 177, 105, 130)
local blue = rgba(126, 205, 230, 190)
local blue_soft = rgba(126, 205, 230, 100)
local graphite = rgba(60, 55, 50, 190)

do
  local sprite, image = make_sprite(64, 40)
  filled_ellipse(image, 31, 20, 24, 14, rubber_dark)
  filled_ellipse(image, 31, 19, 20, 11, rubber_mid)
  ellipse_ring(image, 31, 20, 25, 15, rubber_light)
  filled_ellipse(image, 22, 14, 3, 2, rubber_light)
  line(image, 17, 21, 45, 21, rgba(31, 36, 36, 120))
  line(image, 19, 25, 42, 25, rgba(31, 36, 36, 90))
  save(sprite, out("single_tube_patch.png"))
end

do
  local sprite, image = make_sprite(72, 48)
  filled_ellipse(image, 35, 25, 28, 15, rgba(224, 196, 138, 86))
  ellipse_ring(image, 35, 25, 30, 17, glue)
  for i = 0, 8 do
    local x = 16 + i * 5
    line(image, x, 18 + (i % 3), x + 14, 25 + (i % 4), graphite)
  end
  filled_ellipse(image, 35, 25, 4, 3, rgba(34, 26, 24, 190))
  save(sprite, out("prepared_patch_zone.png"))
end

do
  local sprite, image = make_sprite(72, 54)
  line(image, 18, 34, 50, 16, blue)
  line(image, 18, 35, 50, 17, blue_soft)
  line(image, 50, 16, 44, 16, blue)
  line(image, 50, 16, 47, 22, blue)
  for i = 0, 5 do
    filled_ellipse(image, 12 + i * 8, 34 - i * 4, 2 + (i % 2), 2 + (i % 2), blue_soft)
  end
  filled_ellipse(image, 12, 37, 3, 2, rgba(34, 26, 24, 190))
  save(sprite, out("air_escape_trace.png"))
end

do
  local sprite, image = make_sprite(88, 56)
  for y = 10, 45 do
    line(image, 14, y, 73, y, rgba(239, 220, 170, 46))
  end
  line(image, 14, 12, 73, 12, rgba(100, 75, 44, 170))
  line(image, 14, 44, 73, 44, rgba(100, 75, 44, 170))
  line(image, 14, 12, 14, 44, rgba(100, 75, 44, 170))
  line(image, 73, 12, 73, 44, rgba(100, 75, 44, 170))
  filled_ellipse(image, 29, 29, 14, 9, rubber_mid)
  filled_ellipse(image, 29, 29, 4, 3, rgba(20, 18, 17, 210))
  line(image, 39, 29, 61, 20, blue)
  line(image, 39, 30, 61, 21, blue_soft)
  filled_ellipse(image, 63, 20, 3, 3, blue_soft)
  save(sprite, out("notebook_tire_patch_entry.png"))
end
