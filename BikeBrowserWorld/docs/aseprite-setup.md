# Aseprite Setup

## Detection Result

Detected Aseprite executable: `C:\Program Files\Aseprite\Aseprite.exe`

Detected version: `Aseprite 1.3.17.2-x64`

Checked locations:

- `C:\Program Files\Aseprite\Aseprite.exe`
- `C:\Program Files (x86)\Aseprite\Aseprite.exe`
- `%LOCALAPPDATA%\Aseprite\Aseprite.exe`
- `%APPDATA%\Aseprite\Aseprite.exe`
- Steam library folders listed in `C:\Program Files (x86)\Steam\steamapps\libraryfolders.vdf`

Steam status:

- Steam executable found at `C:\Program Files (x86)\Steam\steam.exe`
- Official Steam install URI attempted: `steam://install/431730`
- `C:\Program Files (x86)\Steam\steamapps\common\Aseprite\Aseprite.exe` was still missing afterward, so Steam likely needs purchase, account login, or install confirmation.

Final install status:

- Official Windows installer was downloaded to `C:\Users\yazan\Downloads\Aseprite-v1.3.17.2.exe`
- Installed executable detected at `C:\Program Files\Aseprite\Aseprite.exe`
- CLI verified with `Aseprite 1.3.17.2-x64`

## Install Source

Use the official Windows build from [aseprite.org](https://www.aseprite.org/) or the official [Steam release](https://store.steampowered.com/app/431730/Aseprite/) if it is already owned.

Do not use random third-party builds. The pipeline expects the official `Aseprite.exe` CLI behavior.

## After Installation

The local project path is stored in:

```text
BikeBrowserWorld\tools\aseprite-path.txt
```

To override later, set:

```bat
set ASEPRITE_EXE=C:\Program Files\Aseprite\Aseprite.exe
```

Or create:

```text
BikeBrowserWorld\tools\aseprite-path.txt
```

with the full executable path as the first line.

Expected examples:

```text
C:\Program Files\Aseprite\Aseprite.exe
C:\Program Files (x86)\Steam\steamapps\common\Aseprite\Aseprite.exe
```

## Verify

```bat
"%ASEPRITE_EXE%" --version
```

Then generate the starter source files:

```bat
BikeBrowserWorld\tools\create_starter_assets.bat
```

Then export Godot-ready PNG/JSON outputs:

```bat
BikeBrowserWorld\tools\export_sprites.bat
BikeBrowserWorld\tools\export_tilesets.bat
```
