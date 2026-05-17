@echo off
setlocal
set "ROOT=%~dp0.."
call "%~dp0resolve_aseprite.bat" || exit /b 1
"%ASEPRITE_EXE%" -b --script-param root="%ROOT%" --script "%ROOT%\tools\aseprite\import_zuzu_sheets.lua"
if errorlevel 1 exit /b %errorlevel%
for %%F in (
  "%ROOT%\Assets\Characters\Zuzu\Importality\Zuzu_idle.aseprite"
  "%ROOT%\Assets\Characters\Zuzu\Importality\Zuzu_walk.aseprite"
  "%ROOT%\Assets\Characters\Zuzu\Importality\Zuzu_interact.aseprite"
  "%ROOT%\Assets\Characters\Zuzu\Importality\Zuzu_repair.aseprite"
  "%ROOT%\Assets\Characters\Zuzu\Importality\Zuzu_celebrate.aseprite"
) do (
  if not exist "%%~fF" exit /b 2
)
echo Zuzu Aseprite files created for Importality.
