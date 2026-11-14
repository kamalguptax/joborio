# Frontend route smoke - Next.js must be running (npm run start or dev)
param([string]$Base = "http://localhost:3000")

$ErrorActionPreference = "Continue"
$routes = @(
    "/",
    "/jobs",
    "/login",
    "/signup",
    "/about",
    "/how-it-works",
    "/faq",
    "/contact",
    "/privacy",
    "/terms",
    "/onboarding",
    "/employer/onboarding",
    "/employer/programs",
    "/creator/dashboard",
    "/creator/ai-studio",
    "/creator/trust-tier",
    "/creator/notifications",
    "/admin/dashboard",
    "/admin/disputes",
    "/admin/syndication-feeds",
    "/api/public-jobs?limit=1"
)

$results = [System.Collections.Generic.List[object]]::new()
foreach ($route in $routes) {
    $label = $route
    try {
        $r = Invoke-WebRequest -Uri ($Base + $route) -UseBasicParsing -TimeoutSec 45
        $ok = $r.StatusCode -ge 200 -and $r.StatusCode -lt 400
        $results.Add([pscustomobject]@{ Route = $label; Pass = $ok; Status = $r.StatusCode })
        $sym = if ($ok) { "PASS" } else { "FAIL" }
        Write-Host "[$sym] $label HTTP $($r.StatusCode)"
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if (-not $code) { $code = "error" }
        $results.Add([pscustomobject]@{ Route = $label; Pass = $false; Status = $code })
        Write-Host "[FAIL] $label $code"
    }
}

Write-Host ""
$results | Format-Table -AutoSize
$failed = @($results | Where-Object { -not $_.Pass }).Count
exit $(if ($failed -gt 0) { 1 } else { 0 })
