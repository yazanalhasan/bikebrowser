# Project 1-20 Godot Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the reusable Projects 1-20 available to the bootable BikeBrowserWorld Godot project without replacing the current playable neighborhood scene.

**Architecture:** Copy Godot addons and runtime systems into `BikeBrowserWorld`, register safe runtime singletons with non-conflicting names, and add one integration autoload that initializes optional systems and connects them to existing game events. Python-only tools remain external dev tools and are documented from the Godot project.

**Tech Stack:** Godot 4.6.2, GDScript, JSON data files, Python command-line tools.

---

### Task 1: Copy Godot-Facing Project Files

**Files:**
- Copy into: `C:/Users/yazan/bikebrowser/BikeBrowserWorld/addons/`
- Copy into: `C:/Users/yazan/bikebrowser/BikeBrowserWorld/SaveSystem/`
- Copy into: `C:/Users/yazan/bikebrowser/BikeBrowserWorld/CameraSystem/`
- Copy into: `C:/Users/yazan/bikebrowser/BikeBrowserWorld/EffectPool/`
- Copy into: `C:/Users/yazan/bikebrowser/BikeBrowserWorld/Localization/`
- Copy into: `C:/Users/yazan/bikebrowser/BikeBrowserWorld/AchievementSystem/`

- [x] **Step 1: Copy addon projects 1-5 and 19 into `res://addons/`**

Run:

```powershell
Copy-Item C:/Users/yazan/godot_addons/addons/ReusableUI C:/Users/yazan/bikebrowser/BikeBrowserWorld/addons/ReusableUI -Recurse -Force
Copy-Item C:/Users/yazan/godot_addons/addons/NameGenerator C:/Users/yazan/bikebrowser/BikeBrowserWorld/addons/NameGenerator -Recurse -Force
Copy-Item C:/Users/yazan/godot_addons/addons/DialogueSystem C:/Users/yazan/bikebrowser/BikeBrowserWorld/addons/DialogueSystem -Recurse -Force
Copy-Item C:/Users/yazan/godot_addons/addons/ProceduralQuest C:/Users/yazan/bikebrowser/BikeBrowserWorld/addons/ProceduralQuest -Recurse -Force
Copy-Item C:/Users/yazan/godot_addons/addons/InventorySystem C:/Users/yazan/bikebrowser/BikeBrowserWorld/addons/InventorySystem -Recurse -Force
Copy-Item C:/Users/yazan/godot_addons/TerrainGenerator C:/Users/yazan/bikebrowser/BikeBrowserWorld/addons/TerrainGenerator -Recurse -Force
```

- [x] **Step 2: Copy runtime systems 11-15 into the project root**

Run:

```powershell
Copy-Item C:/Users/yazan/godot_addons/SaveSystem C:/Users/yazan/bikebrowser/BikeBrowserWorld/SaveSystem -Recurse -Force
Copy-Item C:/Users/yazan/godot_addons/CameraSystem C:/Users/yazan/bikebrowser/BikeBrowserWorld/CameraSystem -Recurse -Force
Copy-Item C:/Users/yazan/godot_addons/EffectPool C:/Users/yazan/bikebrowser/BikeBrowserWorld/EffectPool -Recurse -Force
Copy-Item C:/Users/yazan/godot_addons/Localization C:/Users/yazan/bikebrowser/BikeBrowserWorld/Localization -Recurse -Force
Copy-Item C:/Users/yazan/godot_addons/AchievementSystem C:/Users/yazan/bikebrowser/BikeBrowserWorld/AchievementSystem -Recurse -Force
```

### Task 2: Add Runtime Integration Layer

**Files:**
- Create: `C:/Users/yazan/bikebrowser/BikeBrowserWorld/Core/ProjectIntegration/ProjectIntegration.gd`
- Modify: `C:/Users/yazan/bikebrowser/BikeBrowserWorld/project.godot`

- [x] **Step 1: Add a boot-safe ProjectIntegration autoload**

Create a small autoload that logs available projects, loads crafting recipes, connects achievements to quest completion, and triggers the current region music after boot.

- [x] **Step 2: Register non-conflicting singleton names**

Use names such as `NameGeneratorRuntime`, `QuestGeneratorRuntime`, and `AchievementManagerRuntime` so they do not collide with each script's `class_name`.

### Task 3: Verify

**Files:**
- Test command only.

- [x] **Step 1: Run a headless Godot startup check**

Run:

```powershell
godot --headless --path C:/Users/yazan/bikebrowser/BikeBrowserWorld --quit
```

Expected: no GDScript parse errors.

- [x] **Step 2: Run the existing vertical slice check**

Run:

```powershell
godot --headless --path C:/Users/yazan/bikebrowser/BikeBrowserWorld --script res://tests/vertical_slice_check.gd
```

Expected: existing unrelated quest assertion may still fail, but the project should load and parse.
