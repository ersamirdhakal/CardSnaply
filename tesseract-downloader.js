/**
 * Tesseract File Download Helper
 * Automatically downloads required Tesseract.js files for offline operation
 */

class TesseractFileDownloader {
    /**
     * Check if required Tesseract files exist
     * @returns {Promise<Object>} - Object with file existence status
     */
    async checkFiles() {
        const files = {
            worker: false,
            core: false,
            lang: false
        };

        try {
            // Check worker file
            const workerResponse = await fetch('./tesseract/worker.min.js', { method: 'HEAD' });
            files.worker = workerResponse.ok;
        } catch (e) {
            files.worker = false;
        }

        try {
            // Check core file
            const coreResponse = await fetch('./tesseract/tesseract-core.wasm.js', { method: 'HEAD' });
            files.core = coreResponse.ok;
        } catch (e) {
            files.core = false;
        }

        try {
            // Check language file
            const langResponse = await fetch('./tessdata/en.traineddata', { method: 'HEAD' });
            files.lang = langResponse.ok;
        } catch (e) {
            files.lang = false;
        }

        return files;
    }

    /**
     * Download a file and save it (triggers browser download)
     * @param {string} url - URL to download from
     * @param {string} filename - Filename to save as
     */
    async downloadFile(url, filename) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to download ${filename}: ${response.statusText}`);
            }
            
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = objectUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(objectUrl);
            
            return true;
        } catch (error) {
            console.error(`Error downloading ${filename}:`, error);
            return false;
        }
    }

    /**
     * Show download instructions if files are missing
     */
    async showDownloadInstructions() {
        const files = await this.checkFiles();
        const missingFiles = [];

        if (!files.worker) missingFiles.push({ name: 'worker.min.js', url: 'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/worker.min.js', path: 'tesseract/' });
        if (!files.core) missingFiles.push({ name: 'tesseract-core.wasm.js', url: 'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract-core.wasm.js', path: 'tesseract/' });
        if (!files.lang) missingFiles.push({ name: 'en.traineddata', url: 'https://tessdata.projectnaptha.com/4.0.0/eng.traineddata.gz', path: 'tessdata/', note: 'Extract the .gz file after downloading' });

        if (missingFiles.length === 0) {
            return null; // All files present
        }

        return missingFiles;
    }

    /**
     * Download all missing files automatically
     */
    async downloadAllMissing() {
        const missingFiles = await this.showDownloadInstructions();
        
        if (!missingFiles || missingFiles.length === 0) {
            return { success: true, message: 'All files are present' };
        }

        const results = [];
        
        for (const file of missingFiles) {
            if (file.name.endsWith('.gz')) {
                // For .gz files, just show instructions
                results.push({
                    file: file.name,
                    success: false,
                    message: 'Please download manually and extract: ' + file.url
                });
            } else {
                const success = await this.downloadFile(file.url, file.name);
                results.push({
                    file: file.name,
                    success: success,
                    message: success ? 'Downloaded successfully' : 'Download failed'
                });
            }
        }

        return { success: results.every(r => r.success), results: results };
    }
}

// Export for use in other modules
const tesseractDownloader = new TesseractFileDownloader();

