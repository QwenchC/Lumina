# Lumina 明见量化 - Windows 启动脚本
# PowerShell

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $ProjectDir "backend"
$FrontendDir = Join-Path $ProjectDir "frontend"
$LogDir = Join-Path $ProjectDir "logs"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Lumina 明见量化 - Windows 启动脚本" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 创建日志目录
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir | Out-Null
}

# 检查 .env 文件
$EnvFile = Join-Path $ProjectDir ".env"
$EnvExample = Join-Path $ProjectDir ".env.example"
if (-not (Test-Path $EnvFile)) {
    Copy-Item $EnvExample $EnvFile
    Write-Host "请编辑 .env 文件配置 API 密钥" -ForegroundColor Yellow
}

# 启动后端
Write-Host "`n启动后端服务..." -ForegroundColor Green
Set-Location $BackendDir

# 检查虚拟环境
$VenvDir = Join-Path $BackendDir "venv"
if (-not (Test-Path $VenvDir)) {
    Write-Host "创建 Python 虚拟环境..."
    python -m venv venv
    & "$VenvDir\Scripts\Activate.ps1"
    pip install -r requirements.txt
} else {
    & "$VenvDir\Scripts\Activate.ps1"
}

# 启动后端 (新窗口)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$BackendDir'; .\venv\Scripts\Activate.ps1; python main.py" -WindowStyle Normal

Write-Host "后端服务已启动"

# 启动前端
Write-Host "`n启动前端服务..." -ForegroundColor Green
Set-Location $FrontendDir

# 检查 node_modules
if (-not (Test-Path (Join-Path $FrontendDir "node_modules"))) {
    Write-Host "安装前端依赖..."
    npm install
}

# 启动前端 (新窗口)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$FrontendDir'; npm run dev" -WindowStyle Normal

Write-Host "前端服务已启动"

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "  启动完成！" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "后端地址: http://localhost:8000" -ForegroundColor White
Write-Host "前端地址: http://localhost:5173" -ForegroundColor White
Write-Host "API 文档: http://localhost:8000/docs" -ForegroundColor White
