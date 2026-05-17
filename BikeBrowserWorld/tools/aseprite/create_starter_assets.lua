local root = app.params["root"]
if root == nil or root == "" then
  root = "."
end

local sep = package.config:sub(1,1)
local function path(...)
  local parts = {...}
  return table.concat(parts, sep)
end

local palette = {
  transparent = Color{ r=0, g=0, b=0, a=0 },
  outline = Color{ r=47, g=31, b=31, a=255 },
  skin = Color{ r=181, g=119, b=78, a=255 },
  hair = Color{ r=72, g=45, b=31, a=255 },
  hair_light = Color{ r=122, g=78, b=42, a=255 },
  shirt = Color{ r=243, g=220, b=91, a=255 },
  shirt_shadow = Color{ r=198, g=177, b=72, a=255 },
  shirt_red = Color{ r=210, g=54, b=62, a=255 },
  shirt_blue = Color{ r=72, g=111, b=190, a=255 },
  pants = Color{ r=92, g=91, b=96, a=255 },
  mud = Color{ r=95, g=61, b=36, a=255 },
  stick = Color{ r=61, g=43, b=32, a=255 },
  garage_floor = Color{ r=164, g=108, b=58, a=255 },
  garage_shadow = Color{ r=74, g=45, b=32, a=255 },
  warm_light = Color{ r=244, g=185, b=91, a=255 },
  wood = Color{ r=112, g=68, b=32, a=255 },
  wall = Color{ r=138, g=90, b=49, a=255 },
  purple = Color{ r=89, g=48, b=94, a=255 },
  metal = Color{ r=72, g=86, b=94, a=255 },
  green = Color{ r=74, g=128, b=75, a=255 }
}

local function clear_image(image)
  for y = 0, image.height - 1 do
    for x = 0, image.width - 1 do
      image:drawPixel(x, y, palette.transparent)
    end
  end
end

local function rect(image, x, y, w, h, color)
  for yy = y, y + h - 1 do
    for xx = x, x + w - 1 do
      if xx >= 0 and yy >= 0 and xx < image.width and yy < image.height then
        image:drawPixel(xx, yy, color)
      end
    end
  end
end

local function diamond(image, cx, cy, rx, ry, color)
  for yy = cy - ry, cy + ry do
    for xx = cx - rx, cx + rx do
      local dx = math.abs(xx - cx) / rx
      local dy = math.abs(yy - cy) / ry
      if dx + dy <= 1 then
        image:drawPixel(xx, yy, color)
      end
    end
  end
end

local function draw_zuzu(image, ox, oy, step)
  rect(image, ox + 17, oy + 50, 14, 4, Color{ r=0, g=0, b=0, a=60 })
  rect(image, ox + 14, oy + 29, 2, 25, palette.stick)
  rect(image, ox + 20, oy + 13, 8, 8, palette.skin)
  rect(image, ox + 18, oy + 9, 13, 5, palette.hair)
  rect(image, ox + 19, oy + 8, 9, 2, palette.hair_light)
  rect(image, ox + 17, oy + 22, 15, 17, palette.shirt)
  rect(image, ox + 17, oy + 35, 15, 4, palette.shirt_shadow)
  rect(image, ox + 14, oy + 24, 4, 13, palette.skin)
  rect(image, ox + 30, oy + 24, 4, 13, palette.skin)
  rect(image, ox + 13, oy + 33, 4, 4, palette.mud)
  rect(image, ox + 18, oy + 39, 5, 13 + step, palette.pants)
  rect(image, ox + 26, oy + 39, 5, 13 - step, palette.pants)
  rect(image, ox + 18, oy + 52, 6, 3, palette.mud)
  rect(image, ox + 26, oy + 52, 6, 3, palette.mud)
  rect(image, ox + 20, oy + 24, 2, 2, palette.shirt_red)
  rect(image, ox + 27, oy + 25, 2, 2, palette.shirt_blue)
  rect(image, ox + 23, oy + 30, 2, 2, palette.shirt_red)
  rect(image, ox + 29, oy + 33, 2, 2, palette.shirt_blue)
end

local function draw_mr_chen(image, ox, oy)
  rect(image, ox + 14, oy + 51, 20, 4, Color{ r=0, g=0, b=0, a=70 })
  rect(image, ox + 19, oy + 11, 10, 9, Color{ r=164, g=101, b=67, a=255 })
  rect(image, ox + 17, oy + 21, 16, 22, Color{ r=70, g=105, b=88, a=255 })
  rect(image, ox + 14, oy + 24, 5, 18, Color{ r=70, g=105, b=88, a=255 })
  rect(image, ox + 32, oy + 23, 5, 19, Color{ r=70, g=105, b=88, a=255 })
  rect(image, ox + 18, oy + 43, 6, 12, Color{ r=54, g=57, b=66, a=255 })
  rect(image, ox + 28, oy + 43, 6, 12, Color{ r=54, g=57, b=66, a=255 })
  rect(image, ox + 13, oy + 33, 7, 3, palette.warm_light)
end

local function save_sprite(filename, width, height, frames, drawer, tag_name)
  local sprite = Sprite(width, height, ColorMode.RGB)
  sprite.filename = filename
  local layer = sprite.layers[1]
  for frame = 1, frames do
    if frame > 1 then sprite:newEmptyFrame(frame) end
    local image = Image(width, height, ColorMode.RGB)
    clear_image(image)
    drawer(image, frame)
    local cel = sprite:newCel(layer, frame, image, Point(0, 0))
    cel.image = image
  end
  if tag_name ~= nil then
    sprite:newTag(1, frames).name = tag_name
  end
  sprite:saveAs(filename)
  sprite:close()
end

local function save_tiles(filename, width, height, drawer)
  save_sprite(filename, width, height, 1, drawer, "tiles")
end

save_sprite(path(root, "Assets", "Characters", "Zuzu", "Zuzu_idle.aseprite"), 48, 64, 8, function(image, frame)
  draw_zuzu(image, 0, 0, frame % 2)
end, "idle_down")

save_sprite(path(root, "Assets", "Characters", "Zuzu", "Zuzu_walk.aseprite"), 48, 64, 8, function(image, frame)
  draw_zuzu(image, 0, 0, (frame % 4) - 1)
end, "walk_down")

save_sprite(path(root, "Assets", "Characters", "NPCs", "MrChen", "MrChen_idle.aseprite"), 48, 64, 8, function(image, frame)
  draw_mr_chen(image, 0, frame % 2)
end, "idle_down")

save_tiles(path(root, "Assets", "Environment", "GarageKit", "garage_floor_tiles.aseprite"), 128, 64, function(image)
  for y = 0, 63 do
    for x = 0, 127 do image:drawPixel(x, y, palette.garage_floor) end
  end
  for x = 0, 127, 16 do rect(image, x, 0, 1, 64, Color{ r=146, g=89, b=49, a=255 }) end
  for y = 0, 63, 16 do rect(image, 0, y, 128, 1, Color{ r=181, g=119, b=67, a=255 }) end
end)

save_tiles(path(root, "Assets", "Environment", "GarageKit", "garage_wall_tiles.aseprite"), 128, 64, function(image)
  rect(image, 0, 0, 128, 64, palette.wall)
  rect(image, 0, 0, 128, 8, Color{ r=92, g=56, b=35, a=255 })
  rect(image, 8, 12, 112, 3, Color{ r=188, g=124, b=67, a=255 })
end)

save_tiles(path(root, "Assets", "Environment", "GarageKit", "garage_props.aseprite"), 128, 128, function(image)
  rect(image, 8, 48, 44, 20, palette.wood)
  rect(image, 12, 36, 36, 14, Color{ r=153, g=91, b=45, a=255 })
  rect(image, 70, 30, 30, 50, palette.purple)
  rect(image, 74, 38, 22, 4, palette.warm_light)
  diamond(image, 92, 100, 18, 9, palette.green)
end)

save_tiles(path(root, "Assets", "Environment", "GarageKit", "tool_wall.aseprite"), 128, 96, function(image)
  rect(image, 8, 8, 112, 52, Color{ r=126, g=78, b=43, a=255 })
  for x = 18, 104, 14 do rect(image, x, 18, 3, 26, palette.metal) end
  rect(image, 12, 64, 104, 12, palette.wood)
end)

save_tiles(path(root, "Assets", "Environment", "GarageKit", "bike_stand.aseprite"), 96, 96, function(image)
  rect(image, 45, 25, 5, 45, Color{ r=39, g=91, b=123, a=255 })
  rect(image, 26, 70, 44, 5, Color{ r=39, g=91, b=123, a=255 })
  rect(image, 31, 35, 36, 5, palette.purple)
  diamond(image, 30, 54, 14, 14, palette.outline)
  diamond(image, 66, 54, 14, 14, palette.outline)
end)

save_tiles(path(root, "Assets", "Environment", "GarageKit", "workbench.aseprite"), 128, 96, function(image)
  rect(image, 12, 28, 104, 18, palette.wood)
  rect(image, 18, 46, 10, 32, Color{ r=76, g=47, b=29, a=255 })
  rect(image, 100, 46, 10, 32, Color{ r=76, g=47, b=29, a=255 })
  rect(image, 20, 18, 24, 8, palette.warm_light)
  rect(image, 62, 16, 18, 10, palette.green)
end)

save_tiles(path(root, "Assets", "Environment", "GarageKit", "garage_lighting.aseprite"), 128, 96, function(image)
  diamond(image, 64, 48, 54, 28, Color{ r=244, g=185, b=91, a=90 })
  rect(image, 61, 20, 6, 12, Color{ r=255, g=214, b=128, a=220 })
end)

app.alert("BikeBrowserWorld starter Aseprite assets generated.")
