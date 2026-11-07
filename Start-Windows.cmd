@echo off
setlocal
cd /d "%~dp0"
title Little Days - Local Preview
if not exist "tools\preview.py" goto missingfiles
if not exist "Public\index.html" goto missingfiles
py -3 -c "import sys; sys.exit(sys.version_info < (3, 10))" >nul 2>nul
if not errorlevel 1 goto launcher
python -c "import sys; sys.exit(sys.version_info < (3, 10))" >nul 2>nul
if not errorlevel 1 goto python
echo Python 3.10 or newer was not found.
echo Install Python from https://www.python.org/downloads/windows/
echo Enable Python Launcher or add Python to PATH, then reopen this file.
pause
exit /b 1
:launcher
py -3 "tools\preview.py" --open %*
goto finished
:python
python "tools\preview.py" --open %*
goto finished
:missingfiles
echo Please extract the ENTIRE Notebook ZIP first.
echo Open the folder containing Start-Windows.cmd, Public, tools and Packages.
pause
exit /b 1
:finished
if errorlevel 1 pause
endlocal
