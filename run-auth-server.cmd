@echo off
setlocal

cd /d "%~dp0"
start "LearnHTML Auth Server" cmd /k "cd /d ""%~dp0"" && node server.js"

