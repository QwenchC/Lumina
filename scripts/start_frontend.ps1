# Lumina 前端启动脚本 (PowerShell)

param(
    [switch]$Build = $false
)

# 切换到前端目录
$frontendPath = Split-Path -Parent $PSScriptRoot
$frontendPath = Join-Path $frontendPath "frontend"
Set-Location $frontendPath

Write-Host ""
Write-Host "🎨 启动 Lumina 前端服务..." -ForegroundColor Cyan
Write-Host ""

if ($Build) {
    Write-Host "📦 构建生产版本..." -ForegroundColor Yellow
    npm run build
} else {
    npm run dev
}
