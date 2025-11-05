# Download Tesseract.js Files for Offline Operation
# Run this script from the project root directory

Write-Host "Downloading Tesseract.js files for offline operation..." -ForegroundColor Cyan

# Create directories if they don't exist
if (-not (Test-Path "tesseract")) {
    New-Item -ItemType Directory -Path "tesseract" | Out-Null
    Write-Host "Created tesseract/ directory" -ForegroundColor Green
}

if (-not (Test-Path "tessdata")) {
    New-Item -ItemType Directory -Path "tessdata" | Out-Null
    Write-Host "Created tessdata/ directory" -ForegroundColor Green
}

# Download worker.min.js
Write-Host "Downloading worker.min.js..." -ForegroundColor Yellow
try {
    $workerUrl = "https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/worker.min.js"
    $workerPath = "tesseract/worker.min.js"
    Invoke-WebRequest -Uri $workerUrl -OutFile $workerPath -UseBasicParsing
    Write-Host "✓ Downloaded worker.min.js" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to download worker.min.js: $_" -ForegroundColor Red
}

# Download tesseract-core.wasm.js
Write-Host "Downloading tesseract-core.wasm.js..." -ForegroundColor Yellow
try {
    $coreUrl = "https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract-core.wasm.js"
    $corePath = "tesseract/tesseract-core.wasm.js"
    Invoke-WebRequest -Uri $coreUrl -OutFile $corePath -UseBasicParsing
    Write-Host "✓ Downloaded tesseract-core.wasm.js" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to download tesseract-core.wasm.js: $_" -ForegroundColor Red
}

# Download en.traineddata (compressed)
Write-Host "Downloading en.traineddata.gz..." -ForegroundColor Yellow
try {
    $langUrl = "https://tessdata.projectnaptha.com/4.0.0/eng.traineddata.gz"
    $langPathGz = "tessdata/en.traineddata.gz"
    Invoke-WebRequest -Uri $langUrl -OutFile $langPathGz -UseBasicParsing
    Write-Host "✓ Downloaded en.traineddata.gz" -ForegroundColor Green
    
    # Extract .gz file
    Write-Host "Extracting en.traineddata.gz..." -ForegroundColor Yellow
    $langPath = "tessdata/en.traineddata"
    
    # Check if 7-Zip is available (common on Windows)
    $sevenZip = Get-Command "7z" -ErrorAction SilentlyContinue
    if ($sevenZip) {
        & 7z e $langPathGz -o"tessdata" -y | Out-Null
        Rename-Item -Path "tessdata/eng.traineddata" -NewName "en.traineddata" -Force -ErrorAction SilentlyContinue
        Write-Host "✓ Extracted en.traineddata" -ForegroundColor Green
    } else {
        # Try PowerShell 5.1+ native decompression
        try {
            $bytes = [System.IO.File]::ReadAllBytes($langPathGz)
            $ms = New-Object System.IO.MemoryStream(, $bytes)
            $gzip = New-Object System.IO.Compression.GZipStream($ms, [System.IO.Compression.CompressionMode]::Decompress)
            $output = New-Object System.IO.FileStream($langPath, [System.IO.FileMode]::Create)
            $gzip.CopyTo($output)
            $output.Close()
            $gzip.Close()
            $ms.Close()
            Write-Host "✓ Extracted en.traineddata" -ForegroundColor Green
        } catch {
            Write-Host "⚠ Could not extract .gz file automatically. Please extract manually:" -ForegroundColor Yellow
            Write-Host "  - File: $langPathGz" -ForegroundColor Yellow
            Write-Host "  - Extract to: $langPath" -ForegroundColor Yellow
            Write-Host "  - Or use 7-Zip/WinRAR to extract" -ForegroundColor Yellow
        }
    }
    
    # Clean up .gz file
    Remove-Item $langPathGz -ErrorAction SilentlyContinue
} catch {
    Write-Host "✗ Failed to download en.traineddata: $_" -ForegroundColor Red
}

Write-Host "`nDownload complete!" -ForegroundColor Cyan
Write-Host "Verify files:" -ForegroundColor Cyan
Write-Host "  - tesseract/worker.min.js" -ForegroundColor White
Write-Host "  - tesseract/tesseract-core.wasm.js" -ForegroundColor White
Write-Host "  - tessdata/en.traineddata" -ForegroundColor White

