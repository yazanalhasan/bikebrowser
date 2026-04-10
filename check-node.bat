@echo off
echo === NODE VERSION ===
node -v 2>&1
echo.
echo === NPM VERSION ===
npm -v 2>&1
echo.
echo === NODE PATH ===
where node 2>&1
echo.
echo === NPM PATH ===
where npm 2>&1
