@echo off
if defined ASEPRITE_EXE (
  if exist "%ASEPRITE_EXE%" exit /b 0
)
set "PATH_FILE=%~dp0aseprite-path.txt"
if exist "%PATH_FILE%" (
  set /p ASEPRITE_EXE=<"%PATH_FILE%"
  if exist "%ASEPRITE_EXE%" exit /b 0
)
if exist "C:\Program Files\Aseprite\Aseprite.exe" (
  set "ASEPRITE_EXE=C:\Program Files\Aseprite\Aseprite.exe"
  exit /b 0
)
if exist "C:\Program Files (x86)\Aseprite\Aseprite.exe" (
  set "ASEPRITE_EXE=C:\Program Files (x86)\Aseprite\Aseprite.exe"
  exit /b 0
)
if exist "C:\Program Files (x86)\Steam\steamapps\common\Aseprite\Aseprite.exe" (
  set "ASEPRITE_EXE=C:\Program Files (x86)\Steam\steamapps\common\Aseprite\Aseprite.exe"
  exit /b 0
)
echo Aseprite.exe was not found.
echo Install the official Windows build or set ASEPRITE_EXE before running this script.
exit /b 1
