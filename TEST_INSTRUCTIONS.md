# Quick Test Instructions

## Server Status
The HTTP server should be running on port 8000.

## Testing Steps

1. **Open in Browser:**
   - Main app: http://localhost:8000/index.html
   - Test page: http://localhost:8000/test.html

2. **Test QR Code Detection:**
   - Generate a QR code vCard using any QR generator
   - Upload the QR code image
   - Should detect and parse automatically

3. **Test OCR:**
   - Upload a business card image (clear, well-lit)
   - Wait for OCR processing (first run downloads models)
   - Should extract name, phone, email, company

4. **Verify Offline:**
   - After first load, disable network in DevTools
   - Try uploading an image - should still work
   - OCR and QR detection both work offline

## Expected Behavior

- **First Load:** Downloads Tesseract.js models (~5MB) - may take 10-30 seconds
- **OCR:** Extracts text and parses into structured contact fields
- **QR:** Detects QR codes and parses vCard format automatically
- **Both:** Work completely offline after initial load

