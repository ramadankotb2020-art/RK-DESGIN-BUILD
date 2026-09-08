@echo off
setlocal
chcp 65001 >nul
title RK Design - Update website data
cd /d "%~dp0"
if errorlevel 1 goto folder_failed

where node >nul 2>nul
if errorlevel 1 goto node_missing
where npm >nul 2>nul
if errorlevel 1 goto npm_missing

>update-log.txt echo RK Design update started: %date% %time%
echo Checking media tools...
node -e "require('sharp'); require('ffmpeg-static')" >>update-log.txt 2>&1
if not errorlevel 1 goto tools_ready

echo Installing dependencies. Please wait...
call npm ci >>update-log.txt 2>&1
if errorlevel 1 goto failed
node -e "require('sharp'); require('ffmpeg-static')" >>update-log.txt 2>&1
if errorlevel 1 goto failed

:tools_ready
echo Automatic video generation is disabled.
echo [1/2] Optimizing existing images and videos. This may take a while...
node scripts\optimize-media.js >>update-log.txt 2>&1
if errorlevel 1 goto failed

echo [2/2] Rebuilding the project list...
node scripts\build-projects.js >>update-log.txt 2>&1
if errorlevel 1 goto failed

echo.
type update-log.txt
echo.
echo ================================================
echo LOCAL UPDATE COMPLETED SUCCESSFULLY.
echo Open index.html to check your projects.
echo If already open, refresh with Ctrl+Shift+R.
echo.
echo This tool does NOT upload or publish your website.
echo Upload the changed media AND js/projects-data.js
echo to GitHub, then wait for hosting deployment.
echo ================================================
pause
exit /b 0

:failed
echo.
type update-log.txt
echo.
echo UPDATE FAILED. See update-log.txt for details.
echo Fix the error and run this file again.
pause
exit /b 1

:node_missing
echo Node.js is not installed or is not on PATH.
echo Install Node.js LTS from https://nodejs.org
echo Then close this window and run this file again.
pause
exit /b 1

:npm_missing
echo npm was not found. Reinstall Node.js LTS with npm enabled.
echo Then close this window and run this file again.
pause
exit /b 1

:folder_failed
echo Could not open the website folder.
echo Extract the website to a local folder and try again.
pause
exit /b 1
