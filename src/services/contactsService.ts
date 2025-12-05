import { storage } from '@/utils/storage';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://movya-wallet-backend-413658817628.us-central1.run.app';

export interface Contact {
  id: string;
  ownerId: string;
  nickname: string;
  type: 'address' | 'email';
  value: string;
  targetUserId?: string;
  createdAt?: string;
}

/**
 * Contacts Service
 * Manages user contacts with backend/Firestore integration
 */
class ContactsService {
  private static instance: ContactsService;
  private contacts: Contact[] = [];
  private isLoaded: boolean = false;

  private constructor() {}

  static getInstance(): ContactsService {
    if (!ContactsService.instance) {
      ContactsService.instance = new ContactsService();
    }
    return ContactsService.instance;
  }

  /**
   * Get user ID from storage
   */
  private getUserId(): string | null {
    return storage.getString('userId') || null;
  }

  /**
   * Get user token from storage
   */
  private getUserToken(): string | null {
    return storage.getString('userToken') || null;
  }

  /**
   * Fetch contacts from backend
   */
  async fetchContacts(): Promise<Contact[]> {
    try {
      const userId = this.getUserId();
      const token = this.getUserToken();

      if (!userId || !token) {
        console.error('[ContactsService] No user ID or token found');
        return [];
      }

      const response = await fetch(`${BACKEND_URL}/contacts/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch contacts: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data.contacts) {
        this.contacts = data.data.contacts;
        this.isLoaded = true;
        return this.contacts;
      }

      return [];
    } catch (error) {
      console.error('[ContactsService] Error fetching contacts:', error);
      return [];
    }
  }

  /**
   * Get all contacts (cached or fetch)
   */
  async getContacts(forceRefresh: boolean = false): Promise<Contact[]> {
    if (!this.isLoaded || forceRefresh) {
      return await this.fetchContacts();
    }
    return this.contacts;
  }

  /**
   * Add a new contact
   */
  async addContact(contact: Omit<Contact, 'id' | 'addedAt'>): Promise<Contact | null> {
    try {
      const userId = this.getUserId();
      const token = this.getUserToken();

      if (!userId || !token) {
        console.error('[ContactsService] No user ID or token found');
        return null;
      }

      const response = await fetch(`${BACKEND_URL}/contacts/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contact)
      });

      if (!response.ok) {
        throw new Error(`Failed to add contact: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data.contact) {
        const newContact = data.data.contact;
        this.contacts.push(newContact);
        return newContact;
      }

      return null;
    } catch (error) {
      console.error('[ContactsService] Error adding contact:', error);
      return null;
    }
  }

  /**
   * Update a contact
   */
  async updateContact(contactId: string, updates: Partial<Omit<Contact, 'id' | 'addedAt'>>): Promise<Contact | null> {
    try {
      const userId = this.getUserId();
      const token = this.getUserToken();

      if (!userId || !token) {
        console.error('[ContactsService] No user ID or token found');
        return null;
      }

      const response = await fetch(`${BACKEND_URL}/contacts/${userId}/${contactId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`Failed to update contact: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data.contact) {
        const updatedContact = data.data.contact;
        const index = this.contacts.findIndex(c => c.id === contactId);
        if (index !== -1) {
          this.contacts[index] = updatedContact;
        }
        return updatedContact;
      }

      return null;
    } catch (error) {
      console.error('[ContactsService] Error updating contact:', error);
      return null;
    }
  }

  /**
   * Delete a contact
   */
  async deleteContact(contactId: string): Promise<boolean> {
    try {
      const userId = this.getUserId();
      const token = this.getUserToken();

      if (!userId || !token) {
        console.error('[ContactsService] No user ID or token found');
        return false;
      }

      const response = await fetch(`${BACKEND_URL}/contacts/${userId}/${contactId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete contact: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        this.contacts = this.contacts.filter(c => c.id !== contactId);
        return true;
      }

      return false;
    } catch (error) {
      console.error('[ContactsService] Error deleting contact:', error);
      return false;
    }
  }

  /**
   * Search contacts by nickname or value
   */
  searchContacts(query: string): Contact[] {
    const lowerQuery = query.toLowerCase();
    return this.contacts.filter(contact =>
      contact.nickname.toLowerCase().includes(lowerQuery) ||
      contact.value?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get contact by ID
   */
  getContactById(contactId: string): Contact | null {
    return this.contacts.find(c => c.id === contactId) || null;
  }

  /**
   * Clear contacts cache
   */
  clearCache(): void {
    this.contacts = [];
    this.isLoaded = false;
  }
}

export default ContactsService;
