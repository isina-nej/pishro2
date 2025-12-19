# Migrate Upload Storage
# این script فایل‌های آپلود را بین دایرکتوری‌ها منتقل می‌کند

param(
    [Parameter(Mandatory = $true)]
    [string]$FromPath,
    
    [Parameter(Mandatory = $true)]
    [string]$ToPath,
    
    [switch]$DryRun = $true,
    [switch]$DeleteSource = $false
)

Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "   📁 Upload Storage Migration Tool" -ForegroundColor Yellow
Write-Host "=" * 60 -ForegroundColor Cyan

# بررسی مسیرهای ورودی
if (-not (Test-Path $FromPath)) {
    Write-Host "❌ Error: Source path does not exist: $FromPath" -ForegroundColor Red
    exit 1
}

Write-Host "`n📊 Migration Details:" -ForegroundColor Cyan
Write-Host "  From: $FromPath"
Write-Host "  To:   $ToPath"
Write-Host "  Dry-Run: $($DryRun ? 'Yes (Test Only)' : 'No (Execute)')" -ForegroundColor $(if ($DryRun) { "Yellow" } else { "Red" })

# شمارش فایل‌ها
$files = Get-ChildItem -Path $FromPath -Recurse -File
$totalFiles = $files.Count
Write-Host "`n📈 Statistics:" -ForegroundColor Cyan
Write-Host "  Total Files: $totalFiles"
Write-Host "  Total Size: $(([long]($files | Measure-Object -Property Length -Sum).Sum / 1GB).ToString('N2')) GB"

if ($totalFiles -eq 0) {
    Write-Host "`n⚠️  No files found to migrate!" -ForegroundColor Yellow
    exit 0
}

# تأیید
if (-not $DryRun) {
    Write-Host "`n⚠️  This will ACTUALLY move files!" -ForegroundColor Red
    $confirm = Read-Host "Type 'YES' to continue"
    if ($confirm -ne 'YES') {
        Write-Host "❌ Cancelled" -ForegroundColor Red
        exit 1
    }
}

# مهاجرت
Write-Host "`n⏳ Starting migration..." -ForegroundColor Cyan
$copiedFiles = 0
$failedFiles = 0

foreach ($file in $files) {
    $relativePath = $file.FullName.Substring($FromPath.Length).TrimStart('\')
    $destFile = Join-Path $ToPath $relativePath
    $destDir = Split-Path $destFile -Parent

    try {
        if (-not $DryRun) {
            # ایجاد دایرکتوری مقصد
            if (-not (Test-Path $destDir)) {
                New-Item -ItemType Directory -Path $destDir -Force | Out-Null
            }

            # کپی فایل
            Copy-Item -Path $file.FullName -Destination $destFile -Force -ErrorAction Stop
        }
        
        $copiedFiles++
        Write-Host "  ✅ $relativePath" -ForegroundColor Green -NoNewline
        if ($DryRun) { Write-Host " [TEST]" -ForegroundColor Yellow } else { Write-Host " [DONE]" -ForegroundColor Green }
    }
    catch {
        $failedFiles++
        Write-Host "  ❌ $relativePath - Error: $_" -ForegroundColor Red
    }

    # Progress bar
    $percent = [int](($copiedFiles + $failedFiles) / $totalFiles * 100)
    Write-Progress -Activity "Migrating files" -Status "$percent% complete" -PercentComplete $percent
}

Write-Progress -Activity "Migrating files" -Completed

# حذف فایل‌های منبع (اختیاری)
if (-not $DryRun -and $DeleteSource -and $failedFiles -eq 0) {
    Write-Host "`n🗑️  Removing source files..." -ForegroundColor Yellow
    foreach ($file in $files) {
        Remove-Item -Path $file.FullName -Force -ErrorAction SilentlyContinue
    }
    
    # سعی برای حذف دایرکتوری‌های خالی
    $directories = Get-ChildItem -Path $FromPath -Recurse -Directory | Sort-Object -Property FullName -Descending
    foreach ($dir in $directories) {
        if ((Get-ChildItem $dir.FullName -ErrorAction SilentlyContinue | Measure-Object).Count -eq 0) {
            Remove-Item -Path $dir.FullName -Force -ErrorAction SilentlyContinue
        }
    }
    
    Write-Host "✅ Source files deleted" -ForegroundColor Green
}

# خلاصه
Write-Host "`n" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "   📊 Migration Summary" -ForegroundColor Yellow
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "  Total Files:  $totalFiles"
Write-Host "  Copied:       $copiedFiles" -ForegroundColor Green
Write-Host "  Failed:       $failedFiles" -ForegroundColor $(if ($failedFiles -gt 0) { "Red" } else { "Green" })
Write-Host "  Status:       $(if ($DryRun) { 'TEST ONLY - NO CHANGES MADE' } else { 'COMPLETED' })" -ForegroundColor $(if ($DryRun) { "Yellow" } else { "Green" })
Write-Host "=" * 60 -ForegroundColor Cyan

if ($failedFiles -eq 0) {
    Write-Host "`n✅ Migration completed successfully!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Migration completed with $failedFiles errors!" -ForegroundColor Yellow
}
