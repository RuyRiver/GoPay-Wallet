/**
 * Storage service for web (localStorage wrapper)
 * Mimics MMKV API from React Native for compatibility with movya-wallet patterns
 */

class StorageService {
  private readonly storageId: string;

  constructor(id: string = 'movya-wallet-storage') {
    this.storageId = id;
  }

  /**
   * Get a string value from storage
   */
  getString(key: string): string | undefined {
    try {
      const prefixedKey = `${this.storageId}:${key}`;
      const value = localStorage.getItem(prefixedKey);
      return value ?? undefined;
    } catch (error) {
      console.error(`Error getting string for key ${key}:`, error);
      return undefined;
    }
  }

  /**
   * Get a number value from storage
   */
  getNumber(key: string): number | undefined {
    try {
      const value = this.getString(key);
      if (value === undefined) return undefined;
      const num = Number(value);
      return isNaN(num) ? undefined : num;
    } catch (error) {
      console.error(`Error getting number for key ${key}:`, error);
      return undefined;
    }
  }

  /**
   * Get a boolean value from storage
   */
  getBoolean(key: string): boolean | undefined {
    try {
      const value = this.getString(key);
      if (value === undefined) return undefined;
      return value === 'true';
    } catch (error) {
      console.error(`Error getting boolean for key ${key}:`, error);
      return undefined;
    }
  }

  /**
   * Set a value in storage (accepts string, number, or boolean)
   */
  set(key: string, value: string | number | boolean): void {
    try {
      const prefixedKey = `${this.storageId}:${key}`;
      const stringValue = String(value);
      localStorage.setItem(prefixedKey, stringValue);
    } catch (error) {
      console.error(`Error setting value for key ${key}:`, error);
    }
  }

  /**
   * Delete a key from storage
   */
  delete(key: string): void {
    try {
      const prefixedKey = `${this.storageId}:${key}`;
      localStorage.removeItem(prefixedKey);
    } catch (error) {
      console.error(`Error deleting key ${key}:`, error);
    }
  }

  /**
   * Check if a key exists in storage
   */
  contains(key: string): boolean {
    try {
      const prefixedKey = `${this.storageId}:${key}`;
      return localStorage.getItem(prefixedKey) !== null;
    } catch (error) {
      console.error(`Error checking if key exists ${key}:`, error);
      return false;
    }
  }

  /**
   * Get all keys from this storage instance
   */
  getAllKeys(): string[] {
    try {
      const keys: string[] = [];
      const prefix = `${this.storageId}:`;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          // Remove prefix to return clean key names
          keys.push(key.substring(prefix.length));
        }
      }

      return keys;
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  }

  /**
   * Clear all data from this storage instance
   */
  clearAll(): void {
    try {
      const keys = this.getAllKeys();
      keys.forEach(key => this.delete(key));
    } catch (error) {
      console.error('Error clearing all storage:', error);
    }
  }
}

// Export singleton instance matching movya-wallet pattern
export const storage = new StorageService('movya-wallet-storage');

// Export class for testing or multiple instances if needed
export default StorageService;
