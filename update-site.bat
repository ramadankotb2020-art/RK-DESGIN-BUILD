@echo off
chcp 65001 >nul
title تحديث بيانات الموقع
cd /d "%~dp0"

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

echo بيحدّث بيانات المشاريع من الفولدرات اللي جوّه images\projects-by-name ...
echo هحوّل كمان كل صورة جديدة لـ WebP خفيف تلقائيًا ...
echo.

echo فحص مكتبات الضغط (sharp + ffmpeg-static) ...
node -e "require('sharp'); require('ffmpeg-static')" 2>nul
if %errorlevel% neq 0 (
    echo المكتبات مش متثبتة — بتثبّتها تلقائيًا مرة واحدة ...
    call npm install sharp ffmpeg-static
    echo.
)

echo [1/3] توليد فيديوهات للمشاريع اللي ملهاش فيديو (من صورها) ...
node scripts\generate-videos.js > update-log.txt 2>&1

echo [2/3] ضغط الصور والفيديوهات ...
node scripts\optimize-media.js >> update-log.txt 2>&1

echo [3/3] تحديث بيانات المشاريع ...
node scripts\build-projects.js >> update-log.txt 2>&1
set BUILD_RESULT=%errorlevel%

type update-log.txt

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
echo.
echo اضغط أي زرار عشان تقفل النافذة دي...
pause >nul
