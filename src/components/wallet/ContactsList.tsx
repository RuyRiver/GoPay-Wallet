import React, { useState, useEffect } from "react";
import { User, Search, X } from "lucide-react";
import ContactsService, { type Contact } from "@/services/contactsService";

interface ContactsListProps {
  onSelectContact?: (contact: Contact) => void;
  onClose?: () => void;
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

const ContactsList: React.FC<ContactsListProps> = ({ onSelectContact, onClose }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const service = ContactsService.getInstance();
      const results = service.searchContacts(searchQuery);
      setFilteredContacts(results);
    } else {
      setFilteredContacts(contacts);
    }
  }, [searchQuery, contacts]);

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      const service = ContactsService.getInstance();
      const data = await service.getContacts();
      setContacts(data);
      setFilteredContacts(data);
    } catch (error) {
      console.error("Error loading contacts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactClick = (contact: Contact) => {
    if (onSelectContact) {
      onSelectContact(contact);
    }
  };

  const shortenAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.substring(0, 8)}...${addr.substring(addr.length - 6)}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with search */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Select Contact</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-500">Loading contacts...</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <User className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">
              {searchQuery ? "No contacts found" : "No contacts yet"}
            </p>
            {!searchQuery && (
              <p className="text-sm text-gray-400">
                Contacts will appear here once you add them
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => handleContactClick(contact)}
                className="flex items-center p-4 bg-white rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                {/* Avatar */}
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold mr-4">
                  <span className="text-lg">{getInitials(contact.nickname, contact.value, contact.type)}</span>
                </div>

                {/* Contact Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900">{contact.nickname}</div>
                  {contact.type === 'email' && (
                    <div className="text-sm text-gray-500">{contact.value}</div>
                  )}
                  {contact.type === 'address' && (
                    <div className="text-xs text-gray-400 font-mono">
                      {shortenAddress(contact.value)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactsList;
