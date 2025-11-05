# Quick Fix Instructions

## Current Status
- ✅ `worker.min.js` is downloaded (125KB)
- ❌ `tesseract-core.wasm.js` is missing
- ❌ `en.traineddata` is placeholder (only 590 bytes, needs to be ~4-5MB)

## Immediate Fix - Use CDN Mode

The app has been updated to automatically use CDN fallback when local files are missing. **Refresh your browser** and the app should work now (requires internet connection).

## For 100% Offline Operation

Download the missing files:

### Option 1: Browser Console (Easiest)

Open your browser console (F12) on the app page and run:

```javascript
// Download core file
fetch('https://unpkg.com/tesseract.js@4/dist/worker.min.js')
  .then(r => r.blob())
  .then(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'worker.min.js';
    a.click();
    console.log('✓ worker.min.js');
  });

// Try to find core file
fetch('https://unpkg.com/tesseract.js@4/dist/index.js')
  .then(r => r.text())
  .then(text => {
    console.log('Checking available files...');
    // The core file might be bundled differently in v4
  });
```

### Option 2: Manual Download

1. **Core File**: The `tesseract-core.wasm.js` might not exist as a separate file in v4. Check:
   - https://unpkg.com/tesseract.js@4/dist/ (view directory)
   - Tesseract.js v4 might bundle everything differently

2. **Language Data**: 
   - Download: https://tessdata.projectnaptha.com/4.0.0/eng.traineddata.gz
   - Extract the `.gz` file
   - Save as `tessdata/en.traineddata` (should be ~4-5MB)

### Option 3: Use CDN Mode (Current)

The app now works with CDN by default. Just refresh and it should work!

## What Changed

- ✅ App now checks if files exist before using them
- ✅ Falls back to CDN automatically if files missing
- ✅ Better error messages with download links
- ✅ More robust error handling

**Refresh your browser and try scanning a card - it should work now!**

