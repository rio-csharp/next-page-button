param(
    [string]$AdbPath = $(if ($env:ADB_PATH) { $env:ADB_PATH } else { "adb" })
)

# Quick Android Deployment Script for Next Page Button Plugin
# Usage: .\deploy-android.ps1 [-AdbPath "D:\Program\platform-tools\adb.exe"]

$ErrorActionPreference = "Stop"

$PLUGIN_NAME = "next-page-button"
$PLUGIN_PATH = "/storage/emulated/0/Android/data/org.b3log.siyuan/files/siyuan/data/plugins/$PLUGIN_NAME"
$TEMP_PATH = "/sdcard/$PLUGIN_NAME-dist"

Write-Host "🚀 Starting Android deployment..." -ForegroundColor Cyan

# Build the plugin
Write-Host "`n📦 Building plugin..." -ForegroundColor Yellow
corepack pnpm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Push files to temporary location
Write-Host "`n📤 Pushing files to device..." -ForegroundColor Yellow
& $AdbPath shell "rm -rf $TEMP_PATH && mkdir -p $TEMP_PATH"
& $AdbPath push "dist\." $TEMP_PATH

# Copy to SiYuan plugins directory with root privileges
Write-Host "`n📁 Installing to SiYuan..." -ForegroundColor Yellow
& $AdbPath shell "su -c 'mkdir -p $PLUGIN_PATH && cp -r $TEMP_PATH/. $PLUGIN_PATH/ && chown -R u0_a39:ext_data_rw $PLUGIN_PATH'"

# Verify deployment
Write-Host "`n✅ Verifying installation..." -ForegroundColor Yellow
$result = & $AdbPath shell "su -c 'ls -lh $PLUGIN_PATH'"
Write-Host $result -ForegroundColor Gray

# Check version
$version = & $AdbPath shell "su -c 'cat $PLUGIN_PATH/plugin.json'" | Select-String "version" | Select-Object -First 1
Write-Host "`n📌 Deployed version: $version" -ForegroundColor Green

Write-Host "`n✨ Deployment completed successfully!" -ForegroundColor Green
Write-Host "🔄 Please restart SiYuan app or refresh the page to load the updated plugin." -ForegroundColor Cyan
