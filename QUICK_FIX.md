# Quick Fix: Download Missing Tesseract Files

The error indicates that Tesseract.js local files are missing. Here's how to fix it:

## Option 1: Quick Download Script (Recommended)

Open your browser console (F12) on the app page and run:

```javascript
// Download worker file
fetch('https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/worker.min.js')
  .then(r => r.blob())
  .then(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'worker.min.js';
    a.click();
    console.log('✓ worker.min.js downloaded');
  });

// Download core file  
fetch('https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract-core.wasm.js')
  .then(r => r.blob())
  .then(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tesseract-core.wasm.js';
    a.click();
    console.log('✓ tesseract-core.wasm.js downloaded');
  });
```

Then manually place:
- `worker.min.js` → `tesseract/worker.min.js`
- `tesseract-core.wasm.js` → `tesseract/tesseract-core.wasm.js`

For language data, download manually:
- Visit: https://tessdata.projectnaptha.com/4.0.0/eng.traineddata.gz
- Extract the `.gz` file
- Save as `tessdata/en.traineddata`

## Option 2: Manual Download

1. **worker.min.js**: https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/worker.min.js
   → Save to: `tesseract/worker.min.js`

2. **tesseract-core.wasm.js**: https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract-core.wasm.js
   → Save to: `tesseract/tesseract-core.wasm.js`

3. **en.traineddata**: https://tessdata.projectnaptha.com/4.0.0/eng.traineddata.gz
   → Extract and save to: `tessdata/en.traineddata`

## Current Status

After adding files, the app will:
- ✅ Use local files for 100% offline operation
- ✅ No network required for OCR processing
- ✅ Work completely offline

## Temporary Workaround

The app now includes a fallback that uses CDN if local files are missing, but this requires internet connection. For true offline operation, download the files above.

