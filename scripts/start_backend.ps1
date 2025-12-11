# Lumina 后端启动脚本 (PowerShell)
# 从系统环境变量加载 API 密钥并启动服务

param(
    [switch]$Background = $false
)

# 加载用户级环境变量
$env:DEEPSEEK_API_KEY = [System.Environment]::GetEnvironmentVariable("DEEPSEEK_API_KEY", "User")
$env:GITHUB_TOKEN = [System.Environment]::GetEnvironmentVariable("GITHUB_TOKEN", "User")
$env:OPENAI_API_KEY = [System.Environment]::GetEnvironmentVariable("OPENAI_API_KEY", "User")

# 检查密钥
$provider = "DeepSeek"
$hasKey = $false

if ($env:DEEPSEEK_API_KEY) {
    Write-Host "✅ 已加载 DEEPSEEK_API_KEY" -ForegroundColor Green
    $hasKey = $true
}
if ($env:GITHUB_TOKEN) {
    Write-Host "✅ 已加载 GITHUB_TOKEN" -ForegroundColor Green
    $hasKey = $true
}
if ($env:OPENAI_API_KEY) {
    Write-Host "✅ 已加载 OPENAI_API_KEY" -ForegroundColor Green
    $hasKey = $true
}

if (-not $hasKey) {
    Write-Host "⚠️ 未检测到 LLM API 密钥，自动选股功能将不可用" -ForegroundColor Yellow
    Write-Host "   请设置系统环境变量: DEEPSEEK_API_KEY, GITHUB_TOKEN 或 OPENAI_API_KEY" -ForegroundColor Yellow
}

# 切换到后端目录
$backendPath = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $backendPath "backend"
Set-Location $backendPath

# 启动服务
$pythonExe = Join-Path $backendPath "venv\Scripts\python.exe"
$mainPy = Join-Path $backendPath "main.py"

Write-Host ""
Write-Host "🚀 启动 Lumina 后端服务..." -ForegroundColor Cyan
Write-Host "   路径: $mainPy" -ForegroundColor Gray
Write-Host ""

if ($Background) {
    Start-Process -FilePath $pythonExe -ArgumentList $mainPy -WorkingDirectory $backendPath -WindowStyle Hidden
    Write-Host "✅ 后端服务已在后台启动" -ForegroundColor Green
    Write-Host "   访问: http://localhost:8000/docs" -ForegroundColor Gray
} else {
    & $pythonExe $mainPy
}
