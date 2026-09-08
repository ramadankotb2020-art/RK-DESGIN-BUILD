@echo off
setlocal
chcp 65001 >nul
title تحديث بيانات الموقع
title RK Design - Update website data
cd /d "%~dp0"
if errorlevel 1 goto folder_failed

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ================================================
    echo   Node.js مش متثبت على جهازك.
    echo.
    echo   الخطوات:
    echo   1^) روح لـ https://nodejs.org
    echo   2^) نزّل النسخة اللي مكتوب عليها LTS وثبّتها
    echo      ^(اضغط Next على كل حاجة، الإعدادات الافتراضية تمام^)
    echo   3^) بعد التثبيت، اقفل النافذة دي وافتح الملف ده تاني
    echo ================================================
    echo.
    echo اضغط أي زرار عشان تقفل...
    pause >nul
    exit /b 1
)
if errorlevel 1 goto node_missing
where npm >nul 2>nul
if errorlevel 1 goto npm_missing

echo بيحدّث بيانات المشاريع من الفولدرات اللي جوّه images\projects-by-name ...
echo هحوّل كمان كل صورة جديدة لـ WebP خفيف تلقائيًا ...
echo.
>update-log.txt echo RK Design update started: %date% %time%
echo Checking media tools...
node -e "require('sharp'); require('ffmpeg-static')" >>update-log.txt 2>&1
if not errorlevel 1 goto tools_ready

echo فحص مكتبات الضغط (sharp + ffmpeg-static) ...
node -e "require('sharp'); require('ffmpeg-static')" 2>nul
if %errorlevel% neq 0 (
    echo المكتبات مش متثبتة — بتثبّتها تلقائيًا مرة واحدة ...
    call npm install sharp ffmpeg-static
    echo.
)
echo Installing dependencies. Please wait...
call npm ci >>update-log.txt 2>&1
if errorlevel 1 goto failed
node -e "require('sharp'); require('ffmpeg-static')" >>update-log.txt 2>&1
if errorlevel 1 goto failed

echo [1/3] توليد فيديوهات للمشاريع اللي ملهاش فيديو (من صورها) ...
node scripts\generate-videos.js > update-log.txt 2>&1
:tools_ready
echo [1/3] Generating project videos. This may take a while...
node scripts\generate-videos.js >>update-log.txt 2>&1
if errorlevel 1 goto failed

echo [2/3] ضغط الصور والفيديوهات ...
node scripts\optimize-media.js >> update-log.txt 2>&1
echo [2/3] Optimizing images and videos. This may take a while...
node scripts\optimize-media.js >>update-log.txt 2>&1
if errorlevel 1 goto failed

echo [3/3] تحديث بيانات المشاريع ...
node scripts\build-projects.js >> update-log.txt 2>&1
set BUILD_RESULT=%errorlevel%
echo [3/3] Rebuilding the project list...
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
if %BUILD_RESULT% neq 0 (
    echo ================================================
    echo   حصل خطأ أثناء التحديث. الرسالة اللي فوق دي بتوضح
    echo   المشكلة. لو مش فاهمها، ابعت صورة من النافذة دي.
    echo   (الرسالة كمان محفوظة في ملف update-log.txt جنب
    echo    الملف ده لو حبيت تبعتها بعدين^)
    echo ================================================
) else (
    echo ================================================
    echo   تم التحديث بنجاح! افتح ملف index.html في المتصفح
    echo   عشان تشوف الموقع بالتعديلات الجديدة.
    echo   ^(لو الموقع كان فاتح أصلاً، اعمل Ctrl+Shift+R
    echo    عشان يتأكد إنه مش بيعرض نسخة قديمة محفوظة^)
    echo ================================================
)
type update-log.txt
echo.
echo اضغط أي زرار عشان تقفل النافذة دي...
pause >nul
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