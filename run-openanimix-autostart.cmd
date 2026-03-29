@echo off
setlocal

cd /d "%~dp0"

start "LearnHTML OpenAnimix Local Server" /min cmd /c "cd /d ""%~dp0"" && ""C:\Program Files\nodejs\node.exe"" server.js"
