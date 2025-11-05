# Download Tesseract Files Script

## Quick Fix - Run This Script

Open PowerShell in the project root (`d:\cardscan`) and run:

```powershell
.\download-tesseract.ps1
```

This will automatically:
1. Create `tesseract/` and `tessdata/` folders if missing
2. Download `worker.min.js` → `tesseract/worker.min.js`
3. Download `tesseract-core.wasm.js` → `tesseract/tesseract-core.wasm.js`
4. Download `eng.traineddata.gz` → Extract to `tessdata/en.traineddata`

## Manual Alternative

If the script doesn't work, download manually:

1. **worker.min.js**: https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/worker.min.js
   → Save to: `tesseract/worker.min.js`

2. **tesseract-core.wasm.js**: https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract-core.wasm.js
   → Save to: `tesseract/tesseract-core.wasm.js`

3. **en.traineddata**: https://tessdata.projectnaptha.com/4.0.0/eng.traineddata.gz
   → Extract and save to: `tessdata/en.traineddata`

## After Downloading

The app will automatically detect the files and use them for 100% offline OCR operation.

## Current Status

✅ **Fixed**: App now checks for local files first
✅ **Fixed**: Falls back to CDN if files missing (with warning)
✅ **Fixed**: Better error messages with download links

After downloading the files, refresh the app and OCR will work offline!

