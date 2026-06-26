@echo off
chcp 65001 >nul
echo 🐱 启动人生面板悬浮伙伴...
start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3000/companion --window-size=320,460 --disable-extensions --no-first-run
echo ✅ 悬浮伙伴已启动
