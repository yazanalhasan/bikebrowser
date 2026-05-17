@echo off
setlocal enabledelayedexpansion
set "ROOT=%~dp0.."
call "%~dp0resolve_aseprite.bat" || exit /b 1
set "OUT=%ROOT%\Assets\Exports\Tilesets"
if not exist "%OUT%" mkdir "%OUT%"
for %%F in (
  "%ROOT%\Assets\Environment\GarageKit\garage_floor_tiles.aseprite"
  "%ROOT%\Assets\Environment\GarageKit\garage_wall_tiles.aseprite"
  "%ROOT%\Assets\Environment\GarageKit\garage_props.aseprite"
  "%ROOT%\Assets\Environment\GarageKit\tool_wall.aseprite"
  "%ROOT%\Assets\Environment\GarageKit\bike_stand.aseprite"
  "%ROOT%\Assets\Environment\GarageKit\workbench.aseprite"
  "%ROOT%\Assets\Environment\GarageKit\garage_lighting.aseprite"
) do (
  if exist "%%~fF" (
    set "NAME=%%~nF"
    "%ASEPRITE_EXE%" -b "%%~fF" --sheet "%OUT%\!NAME!.png" --data "%OUT%\!NAME!.json" --format json-array --list-tags
    if errorlevel 1 exit /b !errorlevel!
  ) else (
    echo Missing source: %%~fF
  )
)
echo Tileset exports complete.
