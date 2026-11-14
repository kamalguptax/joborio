# JobOrio full validation: backend tests, frontend build, optional live smoke
param(
    [string]$ApiBase = "http://127.0.0.1:8000",
    [string]$FrontendBase = "http://localhost:3000",
    [switch]$SkipSmoke
)

$ErrorActionPreference = "Continue"
$failed = 0

Write-Host "=== Backend PHPUnit (SQLite in-memory) ===" -ForegroundColor Cyan
Push-Location "$PSScriptRoot\..\backend"
php artisan test
if ($LASTEXITCODE -ne 0) { $failed++ }
Pop-Location

Write-Host ""
Write-Host "=== Frontend production build ===" -ForegroundColor Cyan
Push-Location "$PSScriptRoot\..\frontend"
npm run build --if-present
if ($LASTEXITCODE -ne 0) { $failed++ }
Pop-Location

if (-not $SkipSmoke) {
    Write-Host ""
    Write-Host "=== Live API smoke (requires php artisan serve) ===" -ForegroundColor Cyan
    try {
        $null = Invoke-RestMethod -Uri "$ApiBase/api/v1/health" -TimeoutSec 5
        & "$PSScriptRoot\uat-smoke.ps1" -ApiBase $ApiBase -FrontendBase $FrontendBase
        if ($LASTEXITCODE -ne 0) { $failed++ }
        & "$PSScriptRoot\frontend-smoke.ps1" -Base $FrontendBase
        if ($LASTEXITCODE -ne 0) { $failed++ }
    } catch {
        Write-Host "[SKIP] API not reachable at $ApiBase - start MySQL + php artisan serve for live smoke" -ForegroundColor Yellow
    }
}

Write-Host ""
if ($failed -gt 0) {
    Write-Host "Validation finished with $failed failure(s)." -ForegroundColor Red
    exit 1
}
Write-Host "All validation steps passed." -ForegroundColor Green
exit 0
