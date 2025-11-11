# Quick Android Deployment Script for Next Page Button Plugin
# Usage: .\deploy-android.ps1

$ErrorActionPreference = "Stop"

$PLUGIN_NAME = "next-page-button"
$PLUGIN_PATH = "/storage/emulated/0/Android/data/org.b3log.siyuan/files/siyuan/data/plugins/$PLUGIN_NAME"
$ADB_PATH = "D:\Program\platform-tools\adb.exe"

Write-Host "🚀 Starting Android deployment..." -ForegroundColor Cyan

# Build the plugin
Write-Host "`n📦 Building plugin..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Push files to temporary location
Write-Host "`n📤 Pushing files to device..." -ForegroundColor Yellow
& $ADB_PATH push "dist\index.js" /sdcard/index.js
& $ADB_PATH push "dist\index.css" /sdcard/index.css
& $ADB_PATH push "dist\plugin.json" /sdcard/plugin.json

# Copy to SiYuan plugins directory with root privileges
Write-Host "`n📁 Installing to SiYuan..." -ForegroundColor Yellow
& $ADB_PATH shell "su -c 'cp /sdcard/index.js $PLUGIN_PATH/index.js && cp /sdcard/index.css $PLUGIN_PATH/index.css && cp /sdcard/plugin.json $PLUGIN_PATH/plugin.json && chown -R u0_a39:ext_data_rw $PLUGIN_PATH'"

# Verify deployment
Write-Host "`n✅ Verifying installation..." -ForegroundColor Yellow
$result = & $ADB_PATH shell "su -c 'ls -lh $PLUGIN_PATH'"
Write-Host $result -ForegroundColor Gray

# Check version
$version = & $ADB_PATH shell "su -c 'cat $PLUGIN_PATH/plugin.json'" | Select-String "version" | Select-Object -First 1
Write-Host "`n📌 Deployed version: $version" -ForegroundColor Green

Write-Host "`n✨ Deployment completed successfully!" -ForegroundColor Green
Write-Host "🔄 Please restart SiYuan app or refresh the page to load the updated plugin." -ForegroundColor Cyan
