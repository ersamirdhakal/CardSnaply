# Business Card Scanner

A 100% offline, cross-platform business card scanner application that extracts contact information using OCR and QR code detection.

## Features

- **100% Offline**: No API calls or cloud dependencies
- **OCR Extraction**: Uses Tesseract.js to extract text from business card images
- **QR Code Detection**: Automatically detects and parses vCard QR codes
- **Contact Management**: Save contacts locally using IndexedDB
- **Event Tagging**: Tag contacts by event name (e.g., "Edu Summit 2025")
- **Batch Processing**: Process multiple cards at once
- **One-Tap Sharing**: Share contacts via WhatsApp or Email
- **PWA Support**: Works offline, installable on mobile and desktop
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Dark Mode**: Toggle between light and dark themes with persistence

## Tech Stack

- **Frontend**: HTML5, JavaScript (ES6+)
- **OCR**: Tesseract.js v4 (with local worker/core/lang files)
- **QR Detection**: jsQR
- **Storage**: IndexedDB
- **Styling**: Tailwind CSS (CDN)
- **PWA**: Service Worker + Web App Manifest

## Installation

### Web Version

1. Clone or download this repository

2. **Download Tesseract.js local files** (required for offline OCR):
   
   **Option A: Using browser console** (recommended):
   - Open `http://localhost:8000` (after starting server)
   - Open browser console (F12)
   - Copy and run the download scripts from `tesseract/README.md` and `tessdata/README.md`
   
   **Option B: Manual download**:
   - Download `worker.min.js` from: https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/worker.min.js
     → Save to `tesseract/worker.min.js`
   - Download `tesseract-core.wasm.js` from: https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract-core.wasm.js
     → Save to `tesseract/tesseract-core.wasm.js`
   - Download language data from: https://tessdata.projectnaptha.com/4.0.0/eng.traineddata.gz
     → Extract and save to `tessdata/en.traineddata`

   **Important**: Place the real `en.traineddata` (Tesseract 4 compatible) into `/tessdata`. The app works fully offline once this file is present.

3. **Generate PWA icons**:
   - Open `icons/generate-icons.html` in your browser
   - Click "Download 192x192" and "Download 512x512"
   - Save the files as `icons/icon-192x192.png` and `icons/icon-512x512.png`

4. **Serve the files** using a local web server (required for PWA and IndexedDB):

   **Using Python:**
   ```bash
   python -m http.server 8000
   ```

   **Using Node.js:**
   ```bash
   node server.js
   # or
   npx http-server -p 8000
   ```

5. Open `http://localhost:8000` in your browser

### Offline Operation

**100% Offline OCR**: The app uses local Tesseract.js files (worker, core, and language data). After initial setup:
- ✅ No network required for OCR processing
- ✅ All OCR models stored locally
- ✅ Works completely offline after first load
- ✅ Service worker caches all required files

**Note**: Initial setup requires internet to download Tesseract.js files. Once downloaded and `en.traineddata` is placed in `/tessdata`, everything works fully offline with no network requests for OCR processing.

### PWA Installation

1. Open the app in a modern browser (Chrome, Edge, Safari, Firefox)
2. Look for the install prompt in the address bar
3. Click "Install" to add to home screen
4. The app will work offline once installed

## Usage

### Scanning a Single Card

1. Click "📸 Capture or Upload Card" or use the camera button
2. Select an image file or take a photo
3. Wait for OCR/QR processing (may take 10-30 seconds)
4. Review extracted information in the form
5. Add/edit any fields as needed
6. Optionally add an event tag (e.g., "Edu Summit 2025")
7. Click "💾 Save Contact" to save locally

### Batch Scanning

1. Enable "Batch Mode" checkbox
2. Select multiple image files
3. Cards will be processed sequentially
4. Review and save each contact individually

### Sharing Contacts

- **WhatsApp**: Click "📱 Share via WhatsApp" to share contact as formatted message
- **Email**: Click "📧 Share via Email" to open email client with contact info
- **Download .vcf**: Click "Download .vcf" in contact list to download vCard file

### Managing Contacts

- **Search**: Use the search box to find contacts by name, email, phone, or company
- **Filter by Event**: Select an event tag from the dropdown to filter contacts
- **Delete**: Click "Delete" button on any contact card
- **Clear All**: Use the "Clear All" button to delete all saved contacts at once

### Dark Mode

- Click the theme toggle button (🌙/☀️) in the header to switch between light and dark modes
- Theme preference is saved in localStorage and persists across sessions
- On first visit, automatically detects system preference

## File Structure

```
cardscan/
├── index.html              # Main HTML structure
├── app.js                  # Main application logic
├── contacts.js             # IndexedDB contact management
├── ocr.js                  # Tesseract.js OCR processing
├── qr.js                   # jsQR QR code detection
├── vcard.js                # vCard format generation/parsing
├── share.js                # WhatsApp/Email sharing
├── styles.css              # Custom styles
├── manifest.json           # PWA manifest
├── service-worker.js       # Service worker for offline support
├── server.js               # Node.js web server (optional)
├── tesseract/              # Tesseract.js local files
│   ├── worker.min.js       # Worker file (download required)
│   └── tesseract-core.wasm.js  # Core WASM file (download required)
├── tessdata/               # Language training data
│   └── en.traineddata      # English language data (download required, Tesseract 4 compatible)
├── icons/                  # PWA icons (192x192, 512x512)
└── README.md               # This file
```

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 11.3+)
- Opera: Full support

## Limitations

- **OCR Accuracy**: OCR accuracy depends on image quality. Better lighting and focus improve results.
- **Initial Setup**: Requires internet to download Tesseract.js files (one-time setup).
- **Mobile Camera**: Camera access requires HTTPS (or localhost for development).
- **IndexedDB**: Storage limits vary by browser (typically 50MB-1GB).
- **File Size**: `en.traineddata` is ~4-5 MB (one-time download).

## Troubleshooting

### OCR not working
- Ensure image is clear and well-lit
- Check browser console for errors
- Verify `tesseract/worker.min.js`, `tesseract/tesseract-core.wasm.js`, and `tessdata/en.traineddata` are present
- Ensure `en.traineddata` is the real Tesseract 4 compatible file (not placeholder)
- Check network tab to ensure files are loading from local paths (not CDN)
- First initialization may take a few seconds to load local files

### Contacts not saving
- Check browser console for IndexedDB errors
- Ensure you're using a web server (not file:// protocol)
- Try clearing browser cache and reloading

### Service Worker not registering
- Ensure you're using HTTPS or localhost
- Check browser console for errors
- Try unregistering old service workers in DevTools

## Privacy

- All processing happens locally in your browser
- No data is sent to external servers
- Contacts are stored only in your browser's IndexedDB
- You can clear all data by clearing browser storage

## License

This project is open source and available for personal and commercial use.

## Future Enhancements

- React Native mobile app version
- Export contacts to CSV
- Import contacts from vCard files
- Contact editing after saving
- Image cropping/rotation tools
- Multiple language OCR support

