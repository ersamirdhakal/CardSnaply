/**
 * Local Storage Manager
 * Uses AsyncStorage to persist contacts locally
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@CardSnaply:contacts';

export class LocalStorage {
  /**
   * Save a contact
   */
  async saveContact(contact, imageUri = null) {
    try {
      const contacts = await this.getAllContacts();
      const newContact = {
        id: Date.now().toString(),
        ...contact,
        imageUri,
        createdAt: new Date().toISOString(),
      };
      contacts.push(newContact);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
      return newContact.id;
    } catch (error) {
      console.error('Error saving contact:', error);
      throw error;
    }
  }

  /**
   * Get all contacts
   */
  async getAllContacts() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const contacts = JSON.parse(data);
      return contacts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Error getting contacts:', error);
      return [];
    }
  }

  /**
   * Get a contact by ID
   */
  async getContact(id) {
    const contacts = await this.getAllContacts();
    return contacts.find(c => c.id === id);
  }

  /**
   * Update a contact
   */
  async updateContact(id, updates) {
    try {
      const contacts = await this.getAllContacts();
      const index = contacts.findIndex(c => c.id === id);
      if (index === -1) throw new Error('Contact not found');
      contacts[index] = { ...contacts[index], ...updates };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
      return contacts[index];
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  }

  /**
   * Delete a contact
   */
  async deleteContact(id) {
    try {
      const contacts = await this.getAllContacts();
      const filtered = contacts.filter(c => c.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  }

  /**
   * Clear all contacts
   */
  async clearAllContacts() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing contacts:', error);
      throw error;
    }
  }

  /**
   * Search contacts
   */
  async searchContacts(query) {
    const contacts = await this.getAllContacts();
    if (!query.trim()) return contacts;
    const lowerQuery = query.toLowerCase();
    return contacts.filter(
      contact =>
        contact.name?.toLowerCase().includes(lowerQuery) ||
        contact.email?.toLowerCase().includes(lowerQuery) ||
        contact.company?.toLowerCase().includes(lowerQuery) ||
        contact.phone?.includes(query)
    );
  }

  /**
   * Filter by event tag
   */
  async filterByEvent(eventTag) {
    const contacts = await this.getAllContacts();
    if (!eventTag) return contacts;
    return contacts.filter(contact => contact.eventTag === eventTag);
  }

  /**
   * Get all unique event tags
   */
  async getEventTags() {
    const contacts = await this.getAllContacts();
    const tags = [...new Set(contacts.map(c => c.eventTag).filter(t => t))];
    return tags.sort();
  }
}

export const localStorage = new LocalStorage();

