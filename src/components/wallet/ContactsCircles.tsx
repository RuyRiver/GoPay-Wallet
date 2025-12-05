import React, { useEffect, useState } from 'react';
import ContactsService, { type Contact } from '@/services/contactsService';
import { Plus, Loader2 } from 'lucide-react';

interface ContactsCirclesProps {
  onContactClick?: (contact: Contact) => void;
  onAddContact?: () => void;
}

/**
 * Get initials from a contact's nickname or value
 */
const getInitials = (nickname?: string, value?: string, type?: 'address' | 'email'): string => {
  const name = nickname?.trim() || "";
  if (!name) {
    if (type === 'email' && value && value.length >= 2) {
      return value.substring(0, 2).toUpperCase();
    }
    return "??";
  }

  const words = name.split(' ').filter(Boolean);

  if (words.length === 0) {
    if (type === 'email' && value && value.length >= 2) {
      return value.substring(0, 2).toUpperCase();
    }
    return "??";
  }

  if (words.length >= 2) {
    return (words[0][0] + (words[1][0] || '')).toUpperCase();
  }
  if (name.length === 1) {
    return (name[0] + name[0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

/**
 * Horizontal scrollable contacts circles component
 * Matches the Android app design with circular avatars showing initials
 */
const ContactsCircles: React.FC<ContactsCirclesProps> = ({ onContactClick, onAddContact }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const contactsService = ContactsService.getInstance();
      const result = await contactsService.getContacts(true);
      setContacts(result);
    } catch (err: any) {
      console.error('[ContactsCircles] Error loading contacts:', err);
      setError(err.message || 'Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full px-4 py-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-white/80">Contacts</span>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {/* Add Contact Button */}
        <button
          onClick={onAddContact}
          className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors backdrop-blur-sm"
          aria-label="Add contact"
        >
          <Plus className="w-4 h-4 text-white" />
        </button>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center px-2">
            <Loader2 className="w-4 h-4 text-white/80 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <span className="text-xs text-red-300">{error}</span>
        )}

        {/* Contacts */}
        {!isLoading && !error && contacts.length > 0 && (
          contacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => onContactClick?.(contact)}
              className="flex-shrink-0 flex flex-col items-center gap-0.5 group"
            >
              <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center hover:bg-white hover:scale-105 transition-all shadow-sm">
                <span className="text-blue-600 font-bold text-[10px]">
                  {getInitials(contact.nickname, contact.value, contact.type)}
                </span>
              </div>
              <span className="text-[9px] text-white/80 max-w-[40px] truncate group-hover:text-white transition-colors">
                {contact.nickname}
              </span>
            </button>
          ))
        )}

        {/* Empty State - only show if not loading and no contacts */}
        {!isLoading && !error && contacts.length === 0 && (
          <span className="text-xs text-white/60">Add contacts</span>
        )}
      </div>
    </div>
  );
};

export default ContactsCircles;
