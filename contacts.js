/**
 * Contact Management Module
 * Handles IndexedDB operations for storing and retrieving contacts
 */

class ContactManager {
    constructor() {
        this.dbName = 'BusinessCardScanner';
        this.dbVersion = 1;
        this.storeName = 'contacts';
        this.db = null;
    }

    /**
     * Initialize IndexedDB database
     * Creates object store if it doesn't exist
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = db.createObjectStore(this.storeName, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    
                    // Create indexes for searching
                    objectStore.createIndex('name', 'name', { unique: false });
                    objectStore.createIndex('email', 'email', { unique: false });
                    objectStore.createIndex('eventTag', 'eventTag', { unique: false });
                    objectStore.createIndex('createdAt', 'createdAt', { unique: false });
                }
            };
        });
    }

    /**
     * Save a contact to IndexedDB
     * @param {Object} contact - Contact object with name, phone, email, company, eventTag
     * @param {string} imageData - Base64 encoded image data (optional)
     * @returns {Promise<number>} - ID of saved contact
     */
    async saveContact(contact, imageData = null) {
        if (!this.db) await this.init();

        const contactData = {
            name: contact.name || '',
            phone: contact.phone || '',
            email: contact.email || '',
            company: contact.company || '',
            eventTag: contact.eventTag || '',
            imageData: imageData || '',
            createdAt: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.add(contactData);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get all contacts from IndexedDB
     * @returns {Promise<Array>} - Array of contact objects
     */
    async getAllContacts() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                // Sort by creation date (newest first)
                const contacts = request.result.sort((a, b) => 
                    new Date(b.createdAt) - new Date(a.createdAt)
                );
                resolve(contacts);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get a contact by ID
     * @param {number} id - Contact ID
     * @returns {Promise<Object>} - Contact object
     */
    async getContact(id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Delete a contact by ID
     * @param {number} id - Contact ID
     * @returns {Promise<void>}
     */
    async deleteContact(id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Search contacts by name or email
     * @param {string} query - Search query
     * @returns {Promise<Array>} - Array of matching contacts
     */
    async searchContacts(query) {
        if (!query.trim()) return this.getAllContacts();

        const contacts = await this.getAllContacts();
        const lowerQuery = query.toLowerCase();

        return contacts.filter(contact =>
            contact.name.toLowerCase().includes(lowerQuery) ||
            contact.email.toLowerCase().includes(lowerQuery) ||
            contact.company.toLowerCase().includes(lowerQuery) ||
            contact.phone.includes(query)
        );
    }

    /**
     * Filter contacts by event tag
     * @param {string} eventTag - Event tag to filter by
     * @returns {Promise<Array>} - Array of filtered contacts
     */
    async filterByEvent(eventTag) {
        if (!eventTag) return this.getAllContacts();

        const contacts = await this.getAllContacts();
        return contacts.filter(contact => contact.eventTag === eventTag);
    }

    /**
     * Get all unique event tags
     * @returns {Promise<Array>} - Array of unique event tags
     */
    async getEventTags() {
        const contacts = await this.getAllContacts();
        const tags = [...new Set(contacts.map(c => c.eventTag).filter(t => t))];
        return tags.sort();
    }

    /**
     * Update a contact
     * @param {number} id - Contact ID
     * @param {Object} updates - Object with fields to update
     * @returns {Promise<void>}
     */
    async updateContact(id, updates) {
        if (!this.db) await this.init();

        const contact = await this.getContact(id);
        if (!contact) throw new Error('Contact not found');

        const updatedContact = { ...contact, ...updates };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(updatedContact);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Clear all contacts from IndexedDB
     * @returns {Promise<boolean>} - True if successful
     */
    async clearAllContacts() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }
}

// Export for use in other modules
const contactManager = new ContactManager();

