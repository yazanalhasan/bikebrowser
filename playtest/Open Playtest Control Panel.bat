@echo off
set "PROJECT_ROOT=%~dp0.."
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0open_playtest_control_panel.ps1" -ProjectRoot "%PROJECT_ROOT%"
