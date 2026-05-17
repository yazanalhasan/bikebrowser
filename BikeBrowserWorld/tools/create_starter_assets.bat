@echo off
setlocal
set "ROOT=%~dp0.."
call "%~dp0resolve_aseprite.bat" || exit /b 1
"%ASEPRITE_EXE%" -b --script-param root="%ROOT%" --script "%ROOT%\tools\aseprite\create_starter_assets.lua"
if errorlevel 1 exit /b %errorlevel%
if not exist "%ROOT%\Assets\Characters\Zuzu\Zuzu_idle.aseprite" exit /b 2
if not exist "%ROOT%\Assets\Characters\Zuzu\Zuzu_walk.aseprite" exit /b 2
if not exist "%ROOT%\Assets\Characters\NPCs\MrChen\MrChen_idle.aseprite" exit /b 2
if not exist "%ROOT%\Assets\Environment\GarageKit\garage_floor_tiles.aseprite" exit /b 2
if not exist "%ROOT%\Assets\Environment\GarageKit\garage_wall_tiles.aseprite" exit /b 2
if not exist "%ROOT%\Assets\Environment\GarageKit\garage_props.aseprite" exit /b 2
if not exist "%ROOT%\Assets\Environment\GarageKit\tool_wall.aseprite" exit /b 2
if not exist "%ROOT%\Assets\Environment\GarageKit\bike_stand.aseprite" exit /b 2
if not exist "%ROOT%\Assets\Environment\GarageKit\workbench.aseprite" exit /b 2
if not exist "%ROOT%\Assets\Environment\GarageKit\garage_lighting.aseprite" exit /b 2
echo Starter Aseprite source files generated.
