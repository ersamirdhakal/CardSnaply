# Language Data Files

This folder contains Tesseract.js language training data files.

## Required File

**en.traineddata** - English language training data
- Size: ~4-5 MB
- Source: https://tessdata.projectnaptha.com/4.0.0/eng.traineddata.gz
- Save as: `tessdata/en.traineddata`

**Important**: Place the real `en.traineddata` (Tesseract 4 compatible) into `/tessdata`. The app works fully offline once this file is present.

## Setup Instructions

### Option 1: Download via Browser Console

Run this in your browser console:

```javascript
fetch('https://tessdata.projectnaptha.com/4.0.0/eng.traineddata.gz')
  .then(r => r.arrayBuffer())
  .then(buffer => {
    // Decompress gzip (requires pako library or manual extraction)
    // For now, download manually
    console.log('Download manually from:', 'https://tessdata.projectnaptha.com/4.0.0/eng.traineddata.gz');
  });
```

### Option 2: Manual Download

1. Visit: https://tessdata.projectnaptha.com/4.0.0/
2. Download `eng.traineddata.gz`
3. Extract the `.gz` file (use 7-Zip, WinRAR, or online extractor)
4. Rename extracted file to `en.traineddata` (to match the language code used in ocr.js)
5. Place in `tessdata/` folder

### Option 3: Using npm (if Node.js available)

```bash
npm install tesseract.js-core@4
# Then copy from node_modules/tesseract.js-core/tessdata/eng.traineddata
# Rename to en.traineddata
```

## Verification

After adding `en.traineddata`, OCR will work completely offline with no network requests for language models.

## File Structure

```
tessdata/
└── en.traineddata  (required - Tesseract 4 compatible)
```

**Note**: The OCR code uses 'en' language code which expects `en.traineddata`. If you download `eng.traineddata`, rename it to `en.traineddata` or update ocr.js to use 'eng' language code.

