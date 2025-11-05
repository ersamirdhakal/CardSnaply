# Tesseract.js Local Files Setup

This folder contains the Tesseract.js worker and core files needed for offline OCR processing.

## Required Files

You need to download and place these files in this folder:

1. **worker.min.js** - Tesseract.js worker file
   - Source: https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/worker.min.js
   - Save as: `tesseract/worker.min.js`

2. **tesseract-core.wasm.js** - Tesseract core WASM file
   - Source: https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract-core.wasm.js
   - Save as: `tesseract/tesseract-core.wasm.js`

## Quick Setup Script

Run this in your browser console (on the main app page) to download files:

```javascript
// Download worker file
fetch('https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/worker.min.js')
  .then(r => r.blob())
  .then(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'worker.min.js';
    a.click();
  });

// Download core file
fetch('https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract-core.wasm.js')
  .then(r => r.blob())
  .then(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tesseract-core.wasm.js';
    a.click();
  });
```

## Manual Download

Or download manually:
1. Visit: https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/
2. Download `worker.min.js` and `tesseract-core.wasm.js`
3. Place them in the `tesseract/` folder

## Verification

After adding files, the OCR should work completely offline (no network required for OCR processing).

