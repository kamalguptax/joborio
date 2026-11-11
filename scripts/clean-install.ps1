# Full reinstall when node_modules is corrupted (Windows-safe delete)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

function Remove-DirForce([string]$target) {
    if (-not (Test-Path $target)) { return }
    Write-Host "Removing $target ..." -ForegroundColor Cyan
    $empty = Join-Path $env:TEMP ("empty_" + [guid]::NewGuid().ToString())
    New-Item -ItemType Directory -Path $empty -Force | Out-Null
    & robocopy $empty $target /MIR /R:1 /W:1 /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
    Remove-Item -LiteralPath $empty -Force -Recurse -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $target -Force -Recurse -ErrorAction SilentlyContinue
    if (Test-Path $target) {
        cmd /c "rmdir /s /q `"$target`"" 2>$null
    }
    if (Test-Path $target) {
        throw "Could not delete $target. Close Cursor, stop all node.exe in Task Manager, then delete the folder in Explorer."
    }
}

Write-Host "Tip: Use Node 20 LTS (nvm use 20) if install keeps failing." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "Stopping node.exe (PID $($_.Id)) ..." -ForegroundColor Yellow
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 2

Remove-DirForce "node_modules"
Remove-DirForce ".next"

Write-Host "Running npm install ..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$hook = "node_modules\next\dist\server\require-hook.js"
$cli = "node_modules\next\dist\bin\next"
if (-not ((Test-Path $hook) -and (Test-Path $cli))) {
    Write-Host "Next.js still incomplete. Use Node.js 20 LTS and run this script again." -ForegroundColor Red
    exit 1
}

Write-Host "OK. Run: npm run build:dist" -ForegroundColor Green
