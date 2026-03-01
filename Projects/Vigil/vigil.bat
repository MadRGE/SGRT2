@echo off
title Vigil IDS
cd /d "%~dp0"
call .venv\Scripts\activate.bat
python -m vigil %*
pause
