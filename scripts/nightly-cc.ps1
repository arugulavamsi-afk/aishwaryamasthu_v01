# nightly-cc.ps1 — Coffee Can nightly refresh + deploy
# Registered in Windows Task Scheduler (task: "AishwaryaMasthu CC Nightly").
# Runs scripts/compute-cc-data.js; deploys hosting ONLY if the screen succeeds
# (the script refuses to overwrite cc-data.json on bad/partial data, exit 1).
# Log: output\cc-nightly.log (kept to last ~2000 lines)

$ErrorActionPreference = 'Continue'
$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo

$log = Join-Path $repo 'output\cc-nightly.log'
New-Item -ItemType Directory -Force (Join-Path $repo 'output') | Out-Null

function Log($msg) {
    $line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $msg
    Add-Content -Path $log -Value $line -Encoding utf8
}

Log '=== nightly run start ==='
& node (Join-Path $repo 'scripts\compute-cc-data.js') 2>&1 | Add-Content -Path $log -Encoding utf8

if ($LASTEXITCODE -ne 0) {
    Log "compute-cc-data.js FAILED (exit $LASTEXITCODE) - skipping deploy, previous cc-data.json stays live"
} else {
    Log 'screen OK - deploying hosting'
    $firebase = Join-Path $env:APPDATA 'npm\firebase.cmd'
    if (-not (Test-Path $firebase)) { $firebase = 'firebase' }
    & $firebase deploy --only hosting --non-interactive 2>&1 | Add-Content -Path $log -Encoding utf8
    if ($LASTEXITCODE -ne 0) { Log "deploy FAILED (exit $LASTEXITCODE)" } else { Log 'deploy OK' }
}

# Trim log to last 2000 lines
$lines = Get-Content $log -ErrorAction SilentlyContinue
if ($lines.Count -gt 2000) { $lines | Select-Object -Last 2000 | Set-Content -Path $log -Encoding utf8 }
Log '=== nightly run end ==='
