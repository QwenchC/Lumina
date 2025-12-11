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

# 加载用户级环境变量中的 API 密钥
Write-Host "`n检查 LLM API 密钥..." -ForegroundColor Yellow
$env:DEEPSEEK_API_KEY = [System.Environment]::GetEnvironmentVariable("DEEPSEEK_API_KEY", "User")
$env:GITHUB_TOKEN = [System.Environment]::GetEnvironmentVariable("GITHUB_TOKEN", "User")
$env:OPENAI_API_KEY = [System.Environment]::GetEnvironmentVariable("OPENAI_API_KEY", "User")

$hasKey = $false
if ($env:DEEPSEEK_API_KEY) { 
    Write-Host "  ✅ 已加载 DEEPSEEK_API_KEY" -ForegroundColor Green
    $hasKey = $true
}
if ($env:GITHUB_TOKEN) { 
    Write-Host "  ✅ 已加载 GITHUB_TOKEN" -ForegroundColor Green
    $hasKey = $true
}
if ($env:OPENAI_API_KEY) { 
    Write-Host "  ✅ 已加载 OPENAI_API_KEY" -ForegroundColor Green
    $hasKey = $true
}

if (-not $hasKey) {
    Write-Host "  ⚠️ 未检测到 API 密钥，自动选股功能将不可用" -ForegroundColor Yellow
    Write-Host "  💡 请设置系统环境变量: DEEPSEEK_API_KEY" -ForegroundColor Gray
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

# 启动后端 (新窗口，传递环境变量)
$envVars = ""
if ($env:DEEPSEEK_API_KEY) { $envVars += "`$env:DEEPSEEK_API_KEY='$($env:DEEPSEEK_API_KEY)'; " }
if ($env:GITHUB_TOKEN) { $envVars += "`$env:GITHUB_TOKEN='$($env:GITHUB_TOKEN)'; " }
if ($env:OPENAI_API_KEY) { $envVars += "`$env:OPENAI_API_KEY='$($env:OPENAI_API_KEY)'; " }

Start-Process powershell -ArgumentList "-NoExit", "-Command", "$envVars cd '$BackendDir'; .\venv\Scripts\Activate.ps1; python main.py" -WindowStyle Normal

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
