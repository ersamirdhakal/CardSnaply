# Validation Checklist

Run this checklist to verify all features work correctly.

## Pre-requisites

1. Ensure you have:
   - `tesseract/worker.min.js` (downloaded)
   - `tesseract/tesseract-core.wasm.js` (downloaded)
   - `tessdata/en.traineddata` (downloaded and extracted)

2. Start the server:
   ```bash
   node server.js
   # or
   npx http-server -p 8000
   ```

3. Open: http://localhost:8000

---

## Validation Checklist

### ✅ 1. Confirm Tesseract.js v4
**Check:** Open browser DevTools → Network tab → Reload page
- [ ] Look for: `tesseract.js@4/dist/tesseract.min.js` loaded from CDN
- [ ] Open `index.html` in editor and verify line contains: `tesseract.js@4`

**Expected:** Should see `tesseract.js@4` in the script tag

---

### ✅ 2. Offline OCR Test (Wi-Fi OFF)
**Steps:**
1. Load the app with internet (allows initial caching)
2. Open DevTools → Network tab
3. Check "Offline" checkbox (simulates no internet)
4. Upload a business card image
5. Verify OCR processing works

**Checklist:**
- [ ] Service worker registered (check Console)
- [ ] Files cached: `tesseract/worker.min.js`, `tesseract/tesseract-core.wasm.js`, `tessdata/en.traineddata`
- [ ] OCR works offline (no network requests for worker/core/lang files)
- [ ] Contact information extracted successfully

**Expected:** OCR should work completely offline. Check Network tab - no requests should fail.

---

### ✅ 3. Image Compression Test (3-5 MB image)
**Steps:**
1. Prepare a large image (3-5 MB) - can use any high-resolution photo
2. Upload the image
3. Watch for compression badge and console logs

**Checklist:**
- [ ] Image size > 2MB detected
- [ ] Compression badge appears: "⚡ Compressed for speed"
- [ ] Console shows: "Image compressed: X MB → Y MB"
- [ ] Compressed image < 2MB
- [ ] OCR processing proceeds successfully
- [ ] Contact information extracted

**Expected:** Large images should auto-compress to under 2MB, badge shows, OCR works.

---

### ✅ 4. IndexedDB Contact Persistence
**Steps:**
1. Add 2-3 contacts:
   - Upload a card or fill form manually
   - Click "Save Contact"
   - Repeat 2-3 times
2. Verify contacts appear in list
3. Refresh the page (F5)
4. Verify contacts still appear

**Checklist:**
- [ ] First contact saved successfully
- [ ] Second contact saved successfully
- [ ] Third contact saved successfully
- [ ] All contacts appear in "Saved Contacts" list
- [ ] After page refresh, contacts still visible
- [ ] Contacts sorted by date (newest first)

**Expected:** All contacts persist after refresh. Check DevTools → Application → IndexedDB → BusinessCardScanner → contacts store.

---

### ✅ 5. Clear All Contacts
**Steps:**
1. Ensure you have at least 2 contacts saved
2. Click "🗑️ Clear All" button
3. Confirm deletion in dialog
4. Verify list is empty

**Checklist:**
- [ ] Confirmation dialog appears
- [ ] After confirming, toast shows: "✓ All contacts cleared"
- [ ] Contact list shows: "No contacts saved yet"
- [ ] Event filter dropdown is empty (no event tags)
- [ ] IndexedDB store is empty (check DevTools)

**Expected:** All contacts deleted, list empty, IndexedDB cleared.

---

### ✅ 6. Dark Mode Persistence
**Steps:**
1. Click theme toggle button (🌙) to enable dark mode
2. Verify dark theme applied
3. Refresh the page (F5)
4. Verify dark theme persists

**Checklist:**
- [ ] Click 🌙 button → dark mode activated
- [ ] Theme icon changes to ☀️
- [ ] All UI elements have dark background/text
- [ ] Refresh page → dark mode still active
- [ ] Check localStorage: `localStorage.getItem('theme')` returns `'dark'`
- [ ] Toggle back to light mode → refresh → persists

**Expected:** Theme preference saved in localStorage and persists across refreshes.

---

## Console Verification Commands

Run these in browser console to verify:

```javascript
// 1. Check Tesseract version
console.log('Tesseract version:', typeof Tesseract !== 'undefined' ? 'Loaded' : 'Not loaded');

// 2. Check IndexedDB
(async () => {
    const db = await contactManager.getAllContacts();
    console.log('Contacts in DB:', db.length);
})();

// 3. Check theme
console.log('Current theme:', localStorage.getItem('theme'));
console.log('Dark mode active:', document.documentElement.classList.contains('dark'));

// 4. Check service worker cache
caches.keys().then(keys => console.log('Cache names:', keys));
caches.open('business-card-scanner-v1').then(cache => {
    cache.keys().then(keys => console.log('Cached files:', keys.map(k => k.url)));
});
```

---

## Expected Results Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Tesseract.js v4 | ✅ | Check script tag |
| Offline OCR | ✅ | Works with Wi-Fi OFF |
| Image Compression | ✅ | Auto-compresses >2MB images |
| IndexedDB Persistence | ✅ | Contacts survive refresh |
| Clear All | ✅ | Deletes all contacts |
| Dark Mode Persistence | ✅ | Theme saved in localStorage |

---

## Troubleshooting

### OCR not working offline:
- Check service worker is registered
- Verify files are cached: `tesseract/worker.min.js`, `tesseract/tesseract-core.wasm.js`, `tessdata/en.traineddata`
- Check Network tab for failed requests

### Compression not working:
- Check console for errors
- Verify image is actually > 2MB
- Check `ensureUnder2MB` function is called

### Contacts not persisting:
- Check IndexedDB in DevTools → Application
- Verify IndexedDB is initialized
- Check console for errors

### Dark mode not persisting:
- Check localStorage: `localStorage.getItem('theme')`
- Verify `initTheme()` is called on page load
- Check console for errors

