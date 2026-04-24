# UzMarket - Ishga tushirish / URL yangilash scripti
# Ishlatish: PowerShell da o'ng klik -> "Run with PowerShell"

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$ComposeFile = "$PSScriptRoot\docker-compose.yml"

Write-Host "=== UzMarket ===" -ForegroundColor Cyan

# 1. Hamma containerlarni ishga tushir
Write-Host "[1/3] Containerlar ishga tushmoqda..." -ForegroundColor Yellow
docker compose up -d
Start-Sleep -Seconds 5

# 2. Cloudflare tunnel URL ni ol
Write-Host "[2/3] Tunnel URL kutilmoqda..." -ForegroundColor Yellow -NoNewline
$tunnelUrl = $null
$attempts = 0
while (-not $tunnelUrl -and $attempts -lt 30) {
    Start-Sleep -Seconds 2
    $attempts++
    Write-Host "." -NoNewline
    $logs = docker logs webappmarket-cloudflared-1 2>&1
    if ($logs -match 'https://[a-z0-9\-]+\.trycloudflare\.com') {
        $tunnelUrl = $Matches[0]
    }
}
Write-Host ""

if (-not $tunnelUrl) {
    Write-Host "XATO: Tunnel URL olinmadi!" -ForegroundColor Red
    Write-Host "cloudflared logini tekshiring:" -ForegroundColor Red
    Write-Host "  docker logs webappmarket-cloudflared-1" -ForegroundColor Gray
    exit 1
}

Write-Host "Tunnel URL: $tunnelUrl" -ForegroundColor Green

# 3. Agar URL o'zgargan bo'lsa bot ni yangilash
$currentContent = Get-Content $ComposeFile -Raw
if ($currentContent -notmatch [regex]::Escape($tunnelUrl)) {
    Write-Host "[3/3] URL o'zgangan - bot yangilanmoqda..." -ForegroundColor Yellow
    $newContent = $currentContent -replace 'WEBAPP_URL:\s*"[^"]*"', "WEBAPP_URL: `"$tunnelUrl`""
    Set-Content $ComposeFile $newContent -Encoding UTF8
    docker compose up -d bot
} else {
    Write-Host "[3/3] URL o'zgarmagan - bot restart shart emas." -ForegroundColor Green
}

# Natija
Write-Host ""
Write-Host "===============================" -ForegroundColor Cyan
Write-Host " HAMMA NARSA TAYYOR" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Lokal tarmoq:" -ForegroundColor White
Write-Host "  Admin:       http://10.100.104.114:3000/admin/login"
Write-Host "  SuperAdmin:  http://10.100.104.114:3000/superadmin/login"
Write-Host "  Do'kon:      http://10.100.104.114:3000"
Write-Host ""
Write-Host "Internet (Telegram WebApp):" -ForegroundColor White
Write-Host "  $tunnelUrl"
Write-Host ""
Write-Host "Loginlar:" -ForegroundColor Cyan
Write-Host "  SuperAdmin:  +998882641919 / admin882641919"
Write-Host "  Seller:      +998901234567 / seller123456"
