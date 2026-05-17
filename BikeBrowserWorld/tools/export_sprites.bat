@echo off
setlocal enabledelayedexpansion
set "ROOT=%~dp0.."
call "%~dp0resolve_aseprite.bat" || exit /b 1
set "OUT=%ROOT%\Assets\Exports\Spritesheets"
if not exist "%OUT%" mkdir "%OUT%"
for %%F in (
  "%ROOT%\Assets\Characters\Zuzu\Zuzu_idle.aseprite"
  "%ROOT%\Assets\Characters\Zuzu\Zuzu_walk.aseprite"
  "%ROOT%\Assets\Characters\NPCs\MrChen\MrChen_idle.aseprite"
) do (
  if exist "%%~fF" (
    set "NAME=%%~nF"
    "%ASEPRITE_EXE%" -b "%%~fF" --sheet "%OUT%\!NAME!.png" --data "%OUT%\!NAME!.json" --format json-array --list-tags
    if errorlevel 1 exit /b !errorlevel!
  ) else (
    echo Missing source: %%~fF
  )
)
echo Sprite exports complete.
