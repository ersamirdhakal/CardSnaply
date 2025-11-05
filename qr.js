/**
 * QR Code Detection Module
 * Uses jsQR library to detect and decode QR codes in images
 * Specifically handles vCard QR codes
 */

class QRDetector {
    /**
     * Detect QR code in an image
     * @param {HTMLImageElement|HTMLCanvasElement|ImageData} imageSource - Image element, canvas, or ImageData
     * @returns {Promise<Object|null>} - Decoded QR code data or null if not found
     */
    async detect(imageSource) {
        try {
            // Convert image source to ImageData if needed
            const imageData = await this.getImageData(imageSource);
            
            // Use jsQR to detect QR code
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert'
            });

            if (code) {
                return {
                    data: code.data,
                    location: code.location
                };
            }

            return null;
        } catch (error) {
            console.error('QR detection error:', error);
            return null;
        }
    }

    /**
     * Convert various image sources to ImageData
     * @param {HTMLImageElement|HTMLCanvasElement|ImageData|File} source - Image source
     * @returns {Promise<ImageData>} - ImageData object
     */
    async getImageData(source) {
        // If already ImageData, return it
        if (source instanceof ImageData) {
            return source;
        }

        // If it's a File, create an image element first
        if (source instanceof File) {
            const img = await this.fileToImage(source);
            return this.imageToImageData(img);
        }

        // If it's an HTMLImageElement, convert to ImageData
        if (source instanceof HTMLImageElement) {
            return this.imageToImageData(source);
        }

        // If it's a canvas, get ImageData from it
        if (source instanceof HTMLCanvasElement) {
            const ctx = source.getContext('2d');
            return ctx.getImageData(0, 0, source.width, source.height);
        }

        throw new Error('Unsupported image source type');
    }

    /**
     * Convert File to HTMLImageElement
     * @param {File} file - Image file
     * @returns {Promise<HTMLImageElement>} - Image element
     */
    fileToImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Convert HTMLImageElement to ImageData
     * @param {HTMLImageElement} img - Image element
     * @returns {ImageData} - ImageData object
     */
    imageToImageData(img) {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    /**
     * Detect QR code and parse if it's a vCard
     * @param {HTMLImageElement|HTMLCanvasElement|ImageData|File} imageSource - Image source
     * @returns {Promise<Object|null>} - Parsed contact object or null
     */
    async detectAndParseVCard(imageSource) {
        const qrResult = await this.detect(imageSource);
        
        if (!qrResult) {
            return null;
        }

        // Check if QR data looks like a vCard
        const qrData = qrResult.data.trim();
        
        if (qrData.startsWith('BEGIN:VCARD') || qrData.includes('BEGIN:VCARD')) {
            // Parse vCard from QR code
            const contact = vCardHandler.parse(qrData);
            return contact;
        }

        // If QR code contains URL, check if it's a vCard download link
        if (qrData.startsWith('http')) {
            // Could potentially fetch vCard from URL, but for offline app, we skip this
            return null;
        }

        return null;
    }

    /**
     * Check if image contains a QR code (without parsing)
     * @param {HTMLImageElement|HTMLCanvasElement|ImageData|File} imageSource - Image source
     * @returns {Promise<boolean>} - True if QR code detected
     */
    async hasQRCode(imageSource) {
        const result = await this.detect(imageSource);
        return result !== null;
    }
}

// Export for use in other modules
const qrDetector = new QRDetector();

