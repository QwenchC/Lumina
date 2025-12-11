@echo off
chcp 65001 >nul
cd /d "%~dp0..\backend"

REM 加载用户环境变量
for /f "tokens=2*" %%a in ('reg query "HKCU\Environment" /v DEEPSEEK_API_KEY 2^>nul') do set DEEPSEEK_API_KEY=%%b

echo ==========================================
echo   Lumina 明见量化 - 后端服务
echo ==========================================
echo.
echo DEEPSEEK_API_KEY: %DEEPSEEK_API_KEY:~0,10%...
echo.

venv\Scripts\python.exe main.py
