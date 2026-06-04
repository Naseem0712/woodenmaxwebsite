# Paste Razorpay LIVE keys into Cloudflare Worker (jolly-field-be49).
# Run in PowerShell from repo root after: npx wrangler login
# Usage: .\tools\set-razorpay-live-secrets.ps1

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host ''
Write-Host 'WoodenMax — Razorpay LIVE keys → Cloudflare Worker' -ForegroundColor Cyan
Write-Host 'Worker name: jolly-field-be49' -ForegroundColor DarkGray
Write-Host ''

if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
  Write-Error 'Node/npx not found. Install Node.js first.'
}

$kid = Read-Host 'Paste Key ID (rzp_live_...)'
if ($kid -notmatch '^rzp_live_') {
  Write-Warning 'Key ID should start with rzp_live_ (Live mode in Razorpay Dashboard).'
}

$ksec = Read-Host 'Paste Key Secret (long string, NOT rzp_...)' -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($ksec)
$secretPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

if ($secretPlain -match '^rzp_') {
  Write-Error 'You pasted Key ID into Secret. Secret is a different long random string from Dashboard.'
}

Write-Host ''
Write-Host 'Setting RAZORPAY_KEY_ID...' -ForegroundColor Yellow
$kid | npx wrangler secret put RAZORPAY_KEY_ID
Write-Host 'Setting RAZORPAY_KEY_SECRET...' -ForegroundColor Yellow
$secretPlain | npx wrangler secret put RAZORPAY_KEY_SECRET

Write-Host ''
Write-Host 'Deploying worker.js...' -ForegroundColor Yellow
npm run payments:deploy

Write-Host ''
Write-Host 'Health check:' -ForegroundColor Green
npm run payments:health

Write-Host ''
Write-Host 'Expected: razorpay_mode = live , upi_qr_real_apps = true' -ForegroundColor Cyan
Write-Host 'Then upload site JS (razorpay-checkout.js, calculator-mobile-ux.js) and Ctrl+F5 on site.' -ForegroundColor Cyan
