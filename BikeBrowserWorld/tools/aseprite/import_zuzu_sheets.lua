local root = app.params["root"]
if root == nil or root == "" then
  root = "."
end

local sep = package.config:sub(1,1)
local function path(...)
  return table.concat({...}, sep)
end

local function ensure_dir(dir)
  app.fs.makeAllDirectories(dir)
end

local function copy_cell(source_image, source_x, source_y, cell_size)
  local frame_image = Image(cell_size, cell_size, ColorMode.RGB)
  frame_image:clear()
  for y = 0, cell_size - 1 do
    for x = 0, cell_size - 1 do
      frame_image:drawPixel(x, y, source_image:getPixel(source_x + x, source_y + y))
    end
  end
  return frame_image
end

local function create_action(source_png, output_file, action)
  local source_sprite = app.open(source_png)
  if source_sprite == nil then
    error("Could not open source sheet: " .. source_png)
  end
  local source_image = source_sprite.cels[1].image
  local cell = 48
  local frames = 16
  local sprite = Sprite(cell, cell, ColorMode.RGB)
  sprite.filename = output_file
  local layer = sprite.layers[1]
  layer.name = "Zuzu"

  for frame = 1, frames do
    if frame > 1 then sprite:newEmptyFrame(frame) end
    local index = frame - 1
    local col = index % 4
    local row = math.floor(index / 4)
    local image = copy_cell(source_image, col * cell, row * cell, cell)
    sprite:newCel(layer, frame, image, Point(0, 0))
  end

  local directions = { "down", "left", "right", "up" }
  for i, direction in ipairs(directions) do
    local from_frame = ((i - 1) * 4) + 1
    local to_frame = from_frame + 3
    local tag = sprite:newTag(from_frame, to_frame)
    tag.name = action .. "_" .. direction
  end

  sprite:saveAs(output_file)
  sprite:close()
  source_sprite:close()
end

local out_dir = path(root, "Assets", "Characters", "Zuzu", "Importality")
ensure_dir(out_dir)

local actions = {
  { "idle", path(root, "Assets", "Characters", "Zuzu", "Forge", "zuzu_idle_4dir_v1", "sheet-transparent.png") },
  { "walk", path(root, "Assets", "Characters", "Zuzu", "Forge", "zuzu_walk_4dir_v2", "sheet-transparent.png") },
  { "interact", path(root, "Assets", "Characters", "Zuzu", "Forge", "zuzu_interact_4dir_v1", "sheet-transparent.png") },
  { "repair", path(root, "Assets", "Characters", "Zuzu", "Forge", "zuzu_repair_4dir_v1", "sheet-transparent.png") },
  { "celebrate", path(root, "Assets", "Characters", "Zuzu", "Forge", "zuzu_celebrate_4dir_v1", "sheet-transparent.png") },
}

for _, item in ipairs(actions) do
  local action = item[1]
  local source_png = item[2]
  local output_file = path(out_dir, "Zuzu_" .. action .. ".aseprite")
  create_action(source_png, output_file, action)
end

app.alert("Zuzu Importality Aseprite files created.")
