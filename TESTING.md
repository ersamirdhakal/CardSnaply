# Testing Guide - Business Card Scanner

## Server Status
✅ HTTP server should be running on port 8000

## Test URLs

1. **Main App**: http://localhost:8000/index.html
2. **Module Tests**: http://localhost:8000/test.html  
3. **Offline Tests**: http://localhost:8000/test-offline.html

## Testing OCR Functionality

### Steps:
1. Open http://localhost:8000/index.html
2. Click "📸 Capture or Upload Card"
3. Select a business card image (clear, well-lit works best)
4. Wait for processing:
   - **First run**: Downloads Tesseract.js models (~5MB, takes 10-30 seconds)
   - **Subsequent runs**: Much faster (models cached)
5. Review extracted data in the form fields

### Expected Results:
- ✅ Extracts name, phone, email, company from image
- ✅ Works offline after first load (models cached locally)
- ✅ Shows progress indicator during processing

## Testing QR Code Detection

### Steps:
1. Generate a QR code vCard:
   - Use any QR code generator
   - Format: vCard (BEGIN:VCARD...END:VCARD)
   - Or use test data: Name, Phone, Email, Company
2. Open http://localhost:8000/index.html
3. Upload the QR code image
4. Wait for detection (usually instant)

### Expected Results:
- ✅ Detects QR code automatically
- ✅ Parses vCard format
- ✅ Populates form fields with contact info
- ✅ Works offline (jsQR library cached)

## Testing Offline Mode

### Steps:
1. **First Load** (with internet):
   - Open app in browser
   - Allow service worker to register
   - Wait for libraries to load
   - OCR models download automatically

2. **Go Offline**:
   - Open Chrome DevTools (F12)
   - Go to Network tab
   - Check "Offline" checkbox
   - Refresh page

3. **Test Functionality**:
   - Upload an image (OCR should work)
   - Upload QR code (Detection should work)
   - Save contacts (IndexedDB works offline)
   - View saved contacts (Works offline)

### Expected Results:
- ✅ OCR works offline (models cached in IndexedDB)
- ✅ QR detection works offline (library cached)
- ✅ Contact management works offline (IndexedDB)
- ✅ All UI functions work offline

## Quick Verification

Run the test page: http://localhost:8000/test-offline.html

This page will:
- ✅ Check service worker status
- ✅ Verify all libraries loaded
- ✅ Test QR code detection
- ✅ Test OCR extraction
- ✅ Verify offline capability

## Notes

1. **First Load Requires Internet**: 
   - Tesseract.js downloads models (~5MB)
   - CDN libraries download
   - Service worker registers

2. **After First Load**:
   - Everything works offline
   - Models cached in browser storage
   - Libraries cached by browser

3. **Best Results**:
   - Clear, well-lit images for OCR
   - High-resolution QR codes
   - Proper lighting reduces OCR errors

## Troubleshooting

- **Service Worker not registering**: Check browser console, ensure HTTPS or localhost
- **OCR not working**: Check console for errors, ensure models downloaded
- **QR not detected**: Ensure QR code is clear and properly formatted
- **Offline not working**: Clear cache and reload with internet first

