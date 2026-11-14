# JobOrio UAT smoke - requires API at $ApiBase (default http://127.0.0.1:8000)
param(
    [string]$ApiBase = "http://127.0.0.1:8000",
    [string]$FrontendBase = "http://localhost:3000",
    [string]$AdminEmail = "admin@joborio.com",
    [string]$AdminPassword = "password"
)

$ErrorActionPreference = "Continue"
$results = [System.Collections.Generic.List[object]]::new()

function Add-Result($name, $ok, $detail) {
    $results.Add([pscustomobject]@{ Test = $name; Pass = $ok; Detail = $detail })
    $symbol = if ($ok) { "PASS" } else { "FAIL" }
    Write-Host "[$symbol] $name - $detail"
}

function Invoke-Api {
    param($Method, $Path, $Body = $null, $Token = $null)
    $headers = @{ Accept = "application/json" }
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    $uri = "$ApiBase$Path"
    if ($null -ne $Body) {
        return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers -ContentType "application/json" -Body ($Body | ConvertTo-Json)
    }
    return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers
}

try {
    $null = Invoke-RestMethod -Uri "$ApiBase/api/v1/auth/providers" -Headers @{ Accept = "application/json" }
    Add-Result "API reachable" $true "providers endpoint OK"
} catch {
    Add-Result "API reachable" $false $_.Exception.Message
}

$token = $null
try {
    $login = Invoke-Api -Method POST -Path "/api/v1/auth/login" -Body @{ email = $AdminEmail; password = $AdminPassword }
    $token = $login.data.token
    Add-Result "Admin login" ($null -ne $token) "token issued"
} catch {
    Add-Result "Admin login" $false $_.Exception.Message
}

if ($token) {
    foreach ($pair in @(
            @{ Name = "Admin overview"; Path = "/api/v1/admin/overview" },
            @{ Name = "Admin disputes"; Path = "/api/v1/admin/disputes" },
            @{ Name = "Syndication feeds"; Path = "/api/v1/admin/syndication-feeds" },
            @{ Name = "Fraud queue"; Path = "/api/v1/admin/fraud-queue" }
        )) {
        try {
            $r = Invoke-Api -Method GET -Path $pair.Path -Token $token
            Add-Result $pair.Name ($r.success -eq $true) "OK"
        } catch {
            Add-Result $pair.Name $false $_.Exception.Message
        }
    }
}

try {
    $listings = Invoke-RestMethod -Uri "$ApiBase/api/v1/listings?per_page=1" -Headers @{ Accept = "application/json" }
    Add-Result "Public listings" ($listings.success -eq $true) "catalog API"
} catch {
    Add-Result "Public listings" $false $_.Exception.Message
}

$fePaths = @("/", "/jobs", "/login", "/admin/dashboard")
foreach ($fePath in $fePaths) {
    $label = "Frontend $fePath"
    try {
        $fe = Invoke-WebRequest -Uri ($FrontendBase + $fePath) -UseBasicParsing -TimeoutSec 20
        Add-Result $label ($fe.StatusCode -eq 200) ("HTTP " + $fe.StatusCode)
    } catch {
        Add-Result $label $false $_.Exception.Message
    }
}

Write-Host ""
Write-Host "UAT smoke summary"
$results | Format-Table -AutoSize
$failed = @($results | Where-Object { -not $_.Pass }).Count
if ($failed -gt 0) { exit 1 }
exit 0
