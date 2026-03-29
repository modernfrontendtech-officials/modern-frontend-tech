@echo off
setlocal

cd /d "%~dp0"

echo Starting LearnHTML main server on http://localhost:3000
start "LearnHTML Main Server" cmd /k "cd /d ""%~dp0"" && node server.js"

echo Starting OpenAnimix Studio dev server on http://127.0.0.1:3001/openanimix
start "OpenAnimix Studio Dev Server" cmd /k "cd /d ""%~dp0openanimix-studio"" && npm run dev"

echo.
echo OpenAnimix Studio will be available at:
echo http://localhost:3000/openanimix
echo http://localhost:3000/openanimix/editor
echo.
