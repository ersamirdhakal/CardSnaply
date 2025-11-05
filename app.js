/**
 * Main Application Module
 * Orchestrates all functionality: OCR, QR detection, contact management, UI updates
 */

// Application state
const AppState = {
    currentImage: null,
    currentImageData: null,
    currentContact: null,
    batchQueue: [],
    batchResults: [], // Store batch processing results for review
    batchProcessing: false,
    batchIndex: 0
};

// DOM elements
const elements = {
    fileInput: document.getElementById('fileInput'),
    cameraBtn: document.getElementById('cameraBtn'),
    batchMode: document.getElementById('batchMode'),
    imagePreview: document.getElementById('imagePreview'),
    previewImg: document.getElementById('previewImg'),
    contactForm: document.getElementById('contactForm'),
    nameInput: document.getElementById('nameInput'),
    phoneInput: document.getElementById('phoneInput'),
    emailInput: document.getElementById('emailInput'),
    companyInput: document.getElementById('companyInput'),
    eventTagInput: document.getElementById('eventTagInput'),
    saveBtn: document.getElementById('saveBtn'),
    shareWhatsAppBtn: document.getElementById('shareWhatsAppBtn'),
    shareEmailBtn: document.getElementById('shareEmailBtn'),
    contactsList: document.getElementById('contactsList'),
    searchInput: document.getElementById('searchInput'),
    eventFilter: document.getElementById('eventFilter'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    loadingText: document.getElementById('loadingText'),
    batchProgress: document.getElementById('batchProgress'),
    batchCurrent: document.getElementById('batchCurrent'),
    batchTotal: document.getElementById('batchTotal'),
    batchProgressBar: document.getElementById('batchProgressBar'),
    compressionBadge: document.getElementById('compressionBadge'),
    btnClearAll: document.getElementById('btnClearAll'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage'),
    batchReviewSection: document.getElementById('batchReviewSection'),
    batchReviewList: document.getElementById('batchReviewList'),
    btnSaveAllBatch: document.getElementById('btnSaveAllBatch')
};

/**
 * Initialize theme from localStorage or system preference
 */
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.classList.add('dark');
        updateThemeIcon(true);
    } else {
        document.documentElement.classList.remove('dark');
        updateThemeIcon(false);
    }
}

/**
 * Update theme toggle icon
 * @param {boolean} isDark - Whether dark mode is active
 */
function updateThemeIcon(isDark) {
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.textContent = isDark ? '☀️' : '🌙';
    }
}

/**
 * Initialize the application
 * Sets up event listeners and loads saved contacts
 */
async function init() {
    // Initialize theme
    initTheme();
    
    // Check for missing Tesseract files and show warning if needed
    try {
        const missingFiles = await tesseractDownloader.showDownloadInstructions();
        if (missingFiles && missingFiles.length > 0) {
            console.warn('Missing Tesseract files detected. OCR will use CDN fallback (requires internet).');
            console.warn('For offline operation, download missing files:', missingFiles);
        }
    } catch (error) {
        console.log('Could not check Tesseract files:', error);
    }
    
    // Initialize IndexedDB
    try {
        await contactManager.init();
        console.log('IndexedDB initialized');
    } catch (error) {
        console.error('Failed to initialize IndexedDB:', error);
        alert('Failed to initialize database. Some features may not work.');
    }

    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('service-worker.js');
            console.log('Service worker registered');
        } catch (error) {
            console.error('Service worker registration failed:', error);
        }
    }

    // Setup event listeners
    setupEventListeners();

    // Load saved contacts
    await loadContacts();

    // Load event tags for filter
    await loadEventTags();

    console.log('Application initialized');
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // File input change
    elements.fileInput.addEventListener('change', handleFileSelect);

    // Camera button
    elements.cameraBtn.addEventListener('click', () => {
        elements.fileInput.click();
    });

    // Batch mode toggle
    elements.batchMode.addEventListener('change', (e) => {
        if (e.target.checked) {
            elements.fileInput.setAttribute('multiple', 'multiple');
        } else {
            elements.fileInput.removeAttribute('multiple');
        }
    });

    // Form submission (save contact)
    elements.contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveCurrentContact();
    });

    // Share buttons
    elements.shareWhatsAppBtn.addEventListener('click', () => {
        const contact = getContactFromForm();
        if (contact.name) {
            shareHandler.shareViaWhatsApp(contact);
        } else {
            alert('Please fill in at least the name field');
        }
    });

    elements.shareEmailBtn.addEventListener('click', () => {
        const contact = getContactFromForm();
        if (contact.name) {
            shareHandler.shareViaEmail(contact);
        } else {
            alert('Please fill in at least the name field');
        }
    });

    // Search input
    elements.searchInput.addEventListener('input', async (e) => {
        await filterContacts(e.target.value, elements.eventFilter.value);
    });

    // Event filter
    elements.eventFilter.addEventListener('change', async (e) => {
        await filterContacts(elements.searchInput.value, e.target.value);
    });

    // Clear all contacts button
    elements.btnClearAll.addEventListener('click', async () => {
        await handleClearAllContacts();
    });

    // Theme toggle button
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateThemeIcon(isDark);
        });
    }
}

/**
 * Ensure image file is under 2MB by compressing if necessary
 * Downscales to max 1600px while maintaining aspect ratio
 * Uses JPEG quality 0.8 for compression
 * @param {File} file - Image file to compress
 * @returns {Promise<File>} - Original file if under 2MB, compressed file otherwise
 */
async function ensureUnder2MB(file) {
    // Return original file if already under 2MB
    if (file.size <= 2 * 1024 * 1024) {
        return file;
    }

    try {
        // Create ImageBitmap from file for efficient processing
        const imgBitmap = await createImageBitmap(file);
        
        // Calculate scale to fit max dimension of 1600px
        const maxDim = 1600;
        const scale = Math.min(maxDim / imgBitmap.width, maxDim / imgBitmap.height, 1);
        
        // Calculate new dimensions
        const w = Math.round(imgBitmap.width * scale);
        const h = Math.round(imgBitmap.height * scale);
        
        // Create canvas and draw scaled image
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imgBitmap, 0, 0, w, h);
        
        // Convert canvas to JPEG blob with quality 0.8
        const blob = await new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to create blob from canvas'));
                    }
                },
                'image/jpeg',
                0.8
            );
        });
        
        // Clean up ImageBitmap
        imgBitmap.close();
        
        // Create new File from blob, preserving original name (with .jpg extension)
        const newFileName = file.name.replace(/\.\w+$/, '') + '.jpg';
        const compressedFile = new File([blob], newFileName, { type: 'image/jpeg' });
        
        console.log(`Image compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
        
        return compressedFile;
    } catch (error) {
        console.error('Error compressing image:', error);
        // Return original file if compression fails
        return file;
    }
}

/**
 * Handle file selection (single or batch)
 * @param {Event} event - File input change event
 */
async function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) return;

    // Check if batch mode is enabled
    const isBatchMode = elements.batchMode.checked || files.length > 1;

    if (isBatchMode && files.length > 1) {
        // Batch processing
        await processBatch(files);
    } else {
        // Single file processing
        await processSingleFile(files[0]);
    }

    // Reset file input
    elements.fileInput.value = '';
}

/**
 * Process a single image file
 * @param {File} file - Image file to process
 */
async function processSingleFile(file) {
    try {
        showLoading('Processing image...');
        
        // Hide compression badge initially (will show if compression occurs)
        hideCompressionBadge();
        
        // Compress image if over 2MB for faster OCR processing
        const originalSize = file.size;
        const safeFile = await ensureUnder2MB(file);
        const wasCompressed = safeFile.size < originalSize;
        
        // Show compression badge if file was compressed
        if (wasCompressed) {
            showCompressionBadge();
        }
        
        // Store current image (use compressed version)
        AppState.currentImage = safeFile;
        
        // Create preview from compressed file
        const reader = new FileReader();
        reader.onload = (e) => {
            elements.previewImg.src = e.target.result;
            elements.imagePreview.classList.remove('hidden');
            AppState.currentImageData = e.target.result;
        };
        reader.readAsDataURL(safeFile);

        // Wait for image to load
        await new Promise(resolve => {
            const img = new Image();
            img.onload = resolve;
            img.src = URL.createObjectURL(safeFile);
        });

        // Process image: Try QR code first, then OCR
        let contact = null;

        // Try QR code detection first (faster and more accurate)
        showLoading('Detecting QR code...');
        const qrContact = await qrDetector.detectAndParseVCard(safeFile);
        
        if (qrContact && qrContact.name) {
            contact = qrContact;
            console.log('Contact extracted from QR code');
        } else {
            // Fall back to OCR if QR code not found
            showLoading('Extracting text with OCR...');
            try {
                contact = await ocrProcessor.processImage(safeFile);
                console.log('Contact extracted from OCR');
            } catch (error) {
                console.error('OCR error:', error);
                // Show user-friendly error message
                hideLoading();
                const errorMsg = error.message || 'Failed to process image with OCR';
                alert(`OCR Error: ${errorMsg}\n\nPlease ensure:\n- Tesseract files are in /tesseract folder\n- Language data is in /tessdata folder\n- Files are accessible via web server`);
                throw error;
            }
        }

        // Update form with extracted data
        if (contact) {
            fillForm(contact);
            AppState.currentContact = contact;
        } else {
            alert('Could not extract contact information. Please fill in manually.');
        }

    } catch (error) {
        console.error('Error processing file:', error);
        
        // Show user-friendly error message for OCR initialization failures
        let errorMessage = error.message || 'Unknown error occurred';
        
        // Check if it's an OCR initialization error
        if (errorMessage.includes('tesseract') || errorMessage.includes('OCR') || errorMessage.includes('worker') || errorMessage.includes('traineddata')) {
            errorMessage = `OCR Error: ${errorMessage}\n\nPlease verify:\n` +
                          `1. ./tesseract/worker.min.js exists\n` +
                          `2. ./tesseract/tesseract-core.wasm.js exists\n` +
                          `3. ./tessdata/en.traineddata exists\n\n` +
                          `Check the /tesseract and /tessdata folders.`;
        }
        
        alert(errorMessage);
    } finally {
        // Always hide loading overlay, even if there was an error
        hideLoading();
    }
}

/**
 * Process multiple files in batch mode
 * Collects results for review before saving
 * @param {Array<File>} files - Array of image files
 */
async function processBatch(files) {
    if (AppState.batchProcessing) {
        alert('Batch processing already in progress');
        return;
    }

    AppState.batchProcessing = true;
    AppState.batchQueue = files;
    AppState.batchResults = []; // Reset batch results
    AppState.batchIndex = 0;

    // Hide contact form during batch processing
    elements.contactForm.style.display = 'none';
    elements.imagePreview.classList.add('hidden');

    // Show batch progress
    elements.batchProgress.classList.remove('hidden');
    elements.batchTotal.textContent = files.length;

    // Process files sequentially
    for (let i = 0; i < files.length; i++) {
        AppState.batchIndex = i;
        elements.batchCurrent.textContent = i + 1;
        elements.batchProgressBar.style.width = `${((i + 1) / files.length) * 100}%`;

        const file = files[i];
        
        try {
            // Compress if needed
            const originalSize = file.size;
            const safeFile = await ensureUnder2MB(file);
            const wasCompressed = safeFile.size < originalSize;

            // Get image preview
            const imageData = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(safeFile);
            });

            // Try QR code first
            let contact = null;
            try {
                contact = await qrDetector.detectAndParseVCard(safeFile);
            } catch (error) {
                console.log('QR detection failed, trying OCR');
            }

            // Fall back to OCR
            if (!contact || !contact.name) {
                try {
                    contact = await ocrProcessor.processImage(safeFile);
                } catch (error) {
                    console.error(`Error processing file ${i + 1}:`, error);
                    // Add error entry to results
                    AppState.batchResults.push({
                        index: i,
                        fileName: file.name,
                        imageData: imageData,
                        contact: { name: '', phone: '', email: '', company: '', eventTag: '' },
                        error: error.message,
                        wasCompressed: wasCompressed
                    });
                    continue;
                }
            }

            // Add successful result
            AppState.batchResults.push({
                index: i,
                fileName: file.name,
                imageData: imageData,
                contact: contact || { name: '', phone: '', email: '', company: '', eventTag: '' },
                error: null,
                wasCompressed: wasCompressed
            });

            // Small delay between files
            await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
            console.error(`Error processing file ${i + 1}:`, error);
            // Add error entry
            AppState.batchResults.push({
                index: i,
                fileName: files[i].name,
                imageData: null,
                contact: { name: '', phone: '', email: '', company: '', eventTag: '' },
                error: error.message,
                wasCompressed: false
            });
        }
    }

    // Hide batch progress
    elements.batchProgress.classList.add('hidden');
    AppState.batchProcessing = false;
    AppState.batchQueue = [];

    // Show batch review screen
    showBatchReview();
}

/**
 * Fill form with contact data
 * @param {Object} contact - Contact object
 */
function fillForm(contact) {
    elements.nameInput.value = contact.name || '';
    elements.phoneInput.value = contact.phone || '';
    elements.emailInput.value = contact.email || '';
    elements.companyInput.value = contact.company || '';
    // Don't overwrite event tag if user already set it
    if (!elements.eventTagInput.value) {
        elements.eventTagInput.value = contact.eventTag || '';
    }
}

/**
 * Get contact data from form
 * @returns {Object} - Contact object
 */
function getContactFromForm() {
    return {
        name: elements.nameInput.value.trim(),
        phone: elements.phoneInput.value.trim(),
        email: elements.emailInput.value.trim(),
        company: elements.companyInput.value.trim(),
        eventTag: elements.eventTagInput.value.trim()
    };
}

/**
 * Save current contact to IndexedDB
 */
async function saveCurrentContact() {
    const contact = getContactFromForm();

    if (!contact.name) {
        alert('Please enter at least a name');
        return;
    }

    try {
        showLoading('Saving contact...');
        
        // Save to IndexedDB
        const contactId = await contactManager.saveContact(contact, AppState.currentImageData);
        
        console.log('Contact saved with ID:', contactId);
        
        // Clear form
        clearForm();
        
        // Clear preview
        elements.imagePreview.classList.add('hidden');
        AppState.currentImage = null;
        AppState.currentImageData = null;
        AppState.currentContact = null;

        hideLoading();

        // Reload contacts list
        await loadContacts();
        await loadEventTags();

        alert('Contact saved successfully!');
    } catch (error) {
        console.error('Error saving contact:', error);
        hideLoading();
        alert('Error saving contact: ' + error.message);
    }
}

/**
 * Clear the contact form
 */
function clearForm() {
    elements.nameInput.value = '';
    elements.phoneInput.value = '';
    elements.emailInput.value = '';
    elements.companyInput.value = '';
    elements.eventTagInput.value = '';
    // Hide compression badge when clearing form
    hideCompressionBadge();
}

/**
 * Load and display saved contacts
 */
async function loadContacts() {
    try {
        const contacts = await contactManager.getAllContacts();
        renderContacts(contacts);
    } catch (error) {
        console.error('Error loading contacts:', error);
    }
}

/**
 * Filter contacts by search query and event tag
 * @param {string} query - Search query
 * @param {string} eventTag - Event tag filter
 */
async function filterContacts(query, eventTag) {
    try {
        let contacts;

        if (eventTag) {
            contacts = await contactManager.filterByEvent(eventTag);
        } else {
            contacts = await contactManager.getAllContacts();
        }

        if (query) {
            contacts = await contactManager.searchContacts(query);
            // Apply event filter on search results
            if (eventTag) {
                contacts = contacts.filter(c => c.eventTag === eventTag);
            }
        }

        renderContacts(contacts);
    } catch (error) {
        console.error('Error filtering contacts:', error);
    }
}

/**
 * Render contacts list in UI
 * @param {Array<Object>} contacts - Array of contact objects
 */
function renderContacts(contacts) {
    const listElement = elements.contactsList;

    if (contacts.length === 0) {
        listElement.innerHTML = '<div class="text-center text-gray-500 dark:text-gray-400 py-8">No contacts found</div>';
        return;
    }

    listElement.innerHTML = contacts.map(contact => {
        const date = new Date(contact.createdAt).toLocaleDateString();
        
        return `
            <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div class="flex justify-between items-start mb-2">
                    <div class="flex-1">
                        <div class="font-semibold text-lg text-gray-800 dark:text-gray-100">${escapeHtml(contact.name || 'Unnamed')}</div>
                        ${contact.company ? `<div class="text-sm text-gray-600 dark:text-gray-400">${escapeHtml(contact.company)}</div>` : ''}
                    </div>
                    <button onclick="deleteContact(${contact.id})" class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium">
                        Delete
                    </button>
                </div>
                <div class="space-y-1 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    ${contact.phone ? `<div>📞 ${escapeHtml(contact.phone)}</div>` : ''}
                    ${contact.email ? `<div>📧 ${escapeHtml(contact.email)}</div>` : ''}
                    ${contact.eventTag ? `<div>🏷️ ${escapeHtml(contact.eventTag)}</div>` : ''}
                </div>
                <div class="flex gap-2 flex-wrap">
                    <button onclick="downloadContact(${contact.id})" class="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600">
                        Download .vcf
                    </button>
                    <button onclick="shareContactWhatsApp(${contact.id})" class="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600">
                        📱 WhatsApp
                    </button>
                    <button onclick="shareContactEmail(${contact.id})" class="px-3 py-1 bg-blue-400 text-white text-sm rounded hover:bg-blue-500">
                        📧 Email
                    </button>
                </div>
                <div class="text-xs text-gray-400 dark:text-gray-500 mt-2">Saved: ${date}</div>
            </div>
        `;
    }).join('');
}

/**
 * Load event tags and populate filter dropdown
 */
async function loadEventTags() {
    try {
        const tags = await contactManager.getEventTags();
        const filterElement = elements.eventFilter;
        
        // Clear existing options except "All Events"
        filterElement.innerHTML = '<option value="">All Events</option>';
        
        // Add event tags
        tags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            filterElement.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading event tags:', error);
    }
}

/**
 * Delete a contact
 * @param {number} id - Contact ID
 */
async function deleteContact(id) {
    if (!confirm('Are you sure you want to delete this contact?')) {
        return;
    }

    try {
        await contactManager.deleteContact(id);
        await loadContacts();
        await loadEventTags();
    } catch (error) {
        console.error('Error deleting contact:', error);
        alert('Error deleting contact: ' + error.message);
    }
}

/**
 * Download contact as vCard
 * @param {number} id - Contact ID
 */
async function downloadContact(id) {
    try {
        const contact = await contactManager.getContact(id);
        if (contact) {
            vCardHandler.download(contact);
        }
    } catch (error) {
        console.error('Error downloading contact:', error);
        alert('Error downloading contact: ' + error.message);
    }
}

/**
 * Share contact via WhatsApp
 * @param {number} id - Contact ID
 */
async function shareContactWhatsApp(id) {
    try {
        const contact = await contactManager.getContact(id);
        if (contact) {
            shareHandler.shareViaWhatsApp(contact);
        }
    } catch (error) {
        console.error('Error sharing contact:', error);
    }
}

/**
 * Share contact via Email
 * @param {number} id - Contact ID
 */
async function shareContactEmail(id) {
    try {
        const contact = await contactManager.getContact(id);
        if (contact) {
            shareHandler.shareViaEmail(contact);
        }
    } catch (error) {
        console.error('Error sharing contact:', error);
    }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Show loading overlay
 * @param {string} message - Loading message
 */
function showLoading(message = 'Processing...') {
    if (elements.loadingText) {
        elements.loadingText.textContent = message;
    }
    if (elements.loadingOverlay) {
        elements.loadingOverlay.classList.remove('hidden');
        // Force display in case CSS is overriding
        elements.loadingOverlay.style.display = 'flex';
    }
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    if (elements.loadingOverlay) {
        elements.loadingOverlay.classList.add('hidden');
        // Force hide in case CSS is overriding
        elements.loadingOverlay.style.display = 'none';
    }
}

/**
 * Show compression badge
 */
function showCompressionBadge() {
    if (elements.compressionBadge) {
        elements.compressionBadge.classList.remove('hidden');
    }
}

/**
 * Hide compression badge
 */
function hideCompressionBadge() {
    if (elements.compressionBadge) {
        elements.compressionBadge.classList.add('hidden');
    }
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
function showToast(message, duration = 3000) {
    if (!elements.toast || !elements.toastMessage) return;

    elements.toastMessage.textContent = message;
    elements.toast.classList.remove('hidden');
    elements.toast.classList.add('translate-y-0', 'opacity-100');
    elements.toast.classList.remove('-translate-y-2', 'opacity-0');

    // Hide toast after duration
    setTimeout(() => {
        elements.toast.classList.add('-translate-y-2', 'opacity-0');
        setTimeout(() => {
            elements.toast.classList.add('hidden');
        }, 300);
    }, duration);
}

/**
 * Show batch review screen with editable contact cards
 */
function showBatchReview() {
    if (!elements.batchReviewSection || !elements.batchReviewList) {
        // Fallback if elements don't exist yet
        alert(`Batch processing complete! Processed ${AppState.batchResults.length} card(s).\n\nPlease use the main form to review and save each contact.`);
        elements.contactForm.style.display = 'block';
        return;
    }

    // Hide main form
    elements.contactForm.style.display = 'none';
    
    // Show batch review section
    elements.batchReviewSection.classList.remove('hidden');
    
    // Render review cards
    renderBatchReviewCards();
}

/**
 * Render batch review cards with editable fields
 */
function renderBatchReviewCards() {
    if (!elements.batchReviewList) return;

    if (AppState.batchResults.length === 0) {
        elements.batchReviewList.innerHTML = '<div class="text-center text-gray-500 dark:text-gray-400 py-8">No contacts to review</div>';
        return;
    }

    elements.batchReviewList.innerHTML = AppState.batchResults.map((result, idx) => {
        const contact = result.contact || {};
        const hasError = !!result.error;
        
        return `
            <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4 ${hasError ? 'bg-red-50 dark:bg-red-900/20' : 'bg-white dark:bg-gray-800'}">
                <div class="flex items-start gap-4 mb-4">
                    ${result.imageData ? `
                        <img src="${escapeHtml(result.imageData)}" alt="Card ${idx + 1}" class="w-24 h-24 object-cover rounded border border-gray-300 dark:border-gray-600">
                    ` : '<div class="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-gray-400">No Image</div>'}
                    <div class="flex-1">
                        <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Card ${idx + 1}: ${escapeHtml(result.fileName)}</div>
                        ${result.wasCompressed ? '<div class="text-xs text-blue-600 dark:text-blue-400 mb-1">⚡ Compressed</div>' : ''}
                        ${hasError ? `<div class="text-xs text-red-600 dark:text-red-400 mb-1">⚠ Error: ${escapeHtml(result.error)}</div>` : ''}
                    </div>
                    <button onclick="removeBatchCard(${idx})" class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium">
                        ✕ Remove
                    </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                        <input type="text" id="batch-name-${idx}" value="${escapeHtml(contact.name || '')}" 
                            oninput="updateSaveAllButton()"
                            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Company</label>
                        <div class="flex gap-1">
                            <input type="text" id="batch-company-${idx}" value="${escapeHtml(contact.company || '')}" 
                                class="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <button onclick="swapNameCompany(${idx})" class="px-2 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" title="Swap Name ↔ Company">
                                ⇄
                            </button>
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                        <input type="tel" id="batch-phone-${idx}" value="${escapeHtml(contact.phone || '')}" 
                            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                        <input type="email" id="batch-email-${idx}" value="${escapeHtml(contact.email || '')}" 
                            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Event Tag</label>
                        <input type="text" id="batch-tag-${idx}" value="${escapeHtml(contact.eventTag || '')}" 
                            placeholder="e.g., Edu Summit 2025"
                            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Update save all button state
    updateSaveAllButton();
}

/**
 * Swap name and company for a batch card
 * @param {number} index - Index of the batch result
 */
function swapNameCompany(index) {
    if (index < 0 || index >= AppState.batchResults.length) return;

    const nameInput = document.getElementById(`batch-name-${index}`);
    const companyInput = document.getElementById(`batch-company-${index}`);

    if (nameInput && companyInput) {
        const temp = nameInput.value;
        nameInput.value = companyInput.value;
        companyInput.value = temp;
        // Update save button state after swap
        updateSaveAllButton();
    }
}

/**
 * Remove a card from batch review
 * @param {number} index - Index of the batch result to remove
 */
function removeBatchCard(index) {
    if (index < 0 || index >= AppState.batchResults.length) return;
    
    AppState.batchResults.splice(index, 1);
    renderBatchReviewCards();
}

/**
 * Update save all button state
 */
function updateSaveAllButton() {
    if (!elements.btnSaveAllBatch) return;
    
    const validContacts = AppState.batchResults.filter((r, idx) => {
        const nameInput = document.getElementById(`batch-name-${idx}`);
        return nameInput && nameInput.value.trim();
    });

    elements.btnSaveAllBatch.disabled = validContacts.length === 0;
    elements.btnSaveAllBatch.textContent = validContacts.length > 0 
        ? `💾 Save All Contacts (${validContacts.length})`
        : '💾 Save All Contacts (None selected)';
}

/**
 * Save all batch contacts to IndexedDB
 */
async function saveAllBatchContacts() {
    const contactsToSave = [];

    // Collect all valid contacts from review cards
    for (let i = 0; i < AppState.batchResults.length; i++) {
        const result = AppState.batchResults[i];
        const nameInput = document.getElementById(`batch-name-${i}`);
        const phoneInput = document.getElementById(`batch-phone-${i}`);
        const emailInput = document.getElementById(`batch-email-${i}`);
        const companyInput = document.getElementById(`batch-company-${i}`);
        const tagInput = document.getElementById(`batch-tag-${i}`);

        if (!nameInput || !nameInput.value.trim()) {
            continue; // Skip contacts without names
        }

        contactsToSave.push({
            contact: {
                name: nameInput.value.trim(),
                phone: phoneInput ? phoneInput.value.trim() : '',
                email: emailInput ? emailInput.value.trim() : '',
                company: companyInput ? companyInput.value.trim() : '',
                eventTag: tagInput ? tagInput.value.trim() : ''
            },
            imageData: result.imageData
        });
    }

    if (contactsToSave.length === 0) {
        alert('Please fill in at least the name field for at least one contact');
        return;
    }

    try {
        showLoading(`Saving ${contactsToSave.length} contact(s)...`);

        // Save all contacts
        for (const item of contactsToSave) {
            await contactManager.saveContact(item.contact, item.imageData);
        }

        hideLoading();
        showToast(`✓ Saved ${contactsToSave.length} contact(s) successfully`);

        // Hide batch review and show main form
        hideBatchReview();

        // Reload contacts list
        await loadContacts();
        await loadEventTags();

        // Clear batch results
        AppState.batchResults = [];
    } catch (error) {
        console.error('Error saving batch contacts:', error);
        hideLoading();
        alert('Error saving contacts: ' + error.message);
    }
}

/**
 * Hide batch review screen
 */
function hideBatchReview() {
    if (elements.batchReviewSection) {
        elements.batchReviewSection.classList.add('hidden');
    }
    if (elements.contactForm) {
        elements.contactForm.style.display = 'block';
    }
}

/**
 * Handle clear all contacts action
 */
async function handleClearAllContacts() {
    // Confirm action
    if (!confirm('Are you sure you want to delete ALL saved contacts? This action cannot be undone.')) {
        return;
    }

    try {
        // Clear all contacts from IndexedDB
        await contactManager.clearAllContacts();
        
        // Refresh contact list
        await loadContacts();
        
        // Refresh event tags (will be empty now)
        await loadEventTags();
        
        // Show success toast
        showToast('✓ All contacts cleared');
        
        console.log('All contacts cleared successfully');
    } catch (error) {
        console.error('Error clearing all contacts:', error);
        alert('Error clearing contacts: ' + error.message);
    }
}

// Make functions available globally for onclick handlers
window.deleteContact = deleteContact;
window.downloadContact = downloadContact;
window.shareContactWhatsApp = shareContactWhatsApp;
window.shareContactEmail = shareContactEmail;
window.swapNameCompany = swapNameCompany;
window.removeBatchCard = removeBatchCard;
window.saveAllBatchContacts = saveAllBatchContacts;
window.hideBatchReview = hideBatchReview;
window.updateSaveAllButton = updateSaveAllButton;

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

