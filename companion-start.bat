@echo off
chcp 65001 >nul
echo 🐱 启动小H（桌面透明悬浮伙伴）...
echo.

REM Check if dev server is already running
curl -s -o NUL http://localhost:3000 2>NUL
if errorlevel 1 (
    echo ⚠️  开发服务器未启动，正在启动...
    start "人生面板-Dev" cmd /c "cd /d %~dp0 && npx next dev -p 3000"
    echo ⏳ 等待服务器就绪...
    timeout /t 8 /nobreak >nul
)

pythonw "%~dp0desktop\companion.py"
echo ✅ 小H已退出
