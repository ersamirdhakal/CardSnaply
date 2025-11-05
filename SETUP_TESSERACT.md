# Download Tesseract.js Files

This script helps download the required Tesseract.js v4 files for offline operation.

## Quick Setup

Run these commands in your browser console (on the main app page):

### 1. Download Worker File

```javascript
fetch('https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/worker.min.js')
  .then(r => r.blob())
  .then(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'worker.min.js';
    a.click();
    console.log('✓ worker.min.js downloaded');
  })
  .catch(err => console.error('Error:', err));
```

### 2. Download Core File

```javascript
fetch('https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract-core.wasm.js')
  .then(r => r.blob())
  .then(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tesseract-core.wasm.js';
    a.click();
    console.log('✓ tesseract-core.wasm.js downloaded');
  })
  .catch(err => console.error('Error:', err));
```

### 3. Download Language Data

**Note**: The language data is gzipped. You'll need to extract it manually.

```javascript
// This will download the gzipped file
fetch('https://tessdata.projectnaptha.com/4.0.0/eng.traineddata.gz')
  .then(r => r.blob())
  .then(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'eng.traineddata.gz';
    a.click();
    console.log('✓ eng.traineddata.gz downloaded - extract manually');
  })
  .catch(err => console.error('Error:', err));
```

## After Download

1. Place `worker.min.js` in `tesseract/` folder
2. Place `tesseract-core.wasm.js` in `tesseract/` folder  
3. Extract `eng.traineddata.gz` → `eng.traineddata` and place in `tessdata/` folder

## Verify Setup

After placing files, check browser console for:
- ✅ "OCR initialized with local files"
- ✅ No network requests for worker/core/lang files during OCR

## Manual Alternative

If browser download doesn't work, download manually:
- Worker: https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/worker.min.js
- Core: https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract-core.wasm.js
- Language: https://tessdata.projectnaptha.com/4.0.0/eng.traineddata.gz (extract first)

