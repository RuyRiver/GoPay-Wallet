
import React, { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatScreenProps {
  onClose: () => void;
}

interface SuggestionProps {
  title: string;
  description: string;
  onClick?: () => void;
}

const ChatSuggestion: React.FC<SuggestionProps> = ({ title, description, onClick }) => (
  <div 
    className="p-6 border border-gray-200 rounded-3xl mb-4 cursor-pointer hover:bg-gray-50 transition-colors"
    onClick={onClick}
  >
    <h3 className="text-center font-bold text-lg mb-1">{title}</h3>
    <p className="text-center text-gray-400 text-base">{description}</p>
  </div>
);

const ChatScreen: React.FC<ChatScreenProps> = ({ onClose }) => {
  return (
    <div className="bg-white flex flex-col h-full w-full max-w-[480px] mx-auto animate-slide-in-up overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-6 py-8">
        <Button variant="ghost" size="icon" onClick={onClose} className="p-0 h-auto w-auto hover:bg-transparent">
          <ChevronLeft className="h-8 w-8 text-black" />
        </Button>
        <h1 className="text-2xl font-bold flex-1 text-center pr-8">Wallet Chat</h1>
      </div>

      {/* Bot avatar */}
      <div className="flex justify-center mt-4 mb-10">
        <img 
          src="/lovable-uploads/8ac68858-1bea-471b-82bf-d2fbb5c3b947.png" 
          alt="Wallet Bot" 
          className="w-24 h-24"
        />
      </div>

      {/* Suggestions */}
      <div className="flex-1 px-6 pb-6 overflow-y-auto">
        <p className="text-gray-400 text-center mb-6">
          These are just a few examples of what I can do.
        </p>
        
        <ChatSuggestion 
          title="Send a currency to a friend" 
          description="Send 200 APT to Jeremy" 
        />
        
        <ChatSuggestion 
          title="Ask for money" 
          description="Request Jeremy to pay me 100 APT" 
        />
        
        <ChatSuggestion 
          title="Sent a currency to an address" 
          description="Send 100 APT to an address" 
        />
      </div>

      {/* Chat input */}
      <div className="p-4 bg-white sticky bottom-0 border-t border-gray-100">
        <div className="flex items-center gap-4 bg-gray-100 p-4 px-6 rounded-full">
          <img 
            src="/lovable-uploads/8ac68858-1bea-471b-82bf-d2fbb5c3b947.png" 
            alt="Bot" 
            className="w-6 h-6"
          />
          <Input 
            placeholder="How can help you?" 
            className="border-none bg-transparent shadow-none focus-visible:ring-0 flex-1 p-0 h-auto text-base"
          />
          <Button variant="ghost" size="icon" className="rounded-full bg-white h-10 w-10 shadow-sm">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 12L4 4L6 12M20 12L4 20L6 12M20 12H6" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;
