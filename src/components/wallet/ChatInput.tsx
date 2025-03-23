import React, { useState } from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSendMessage?: (message: string) => void;
  onInputClick?: () => void;
  isLoading?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onInputClick, isLoading = false }) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim() && onSendMessage) {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <div className="z-10 flex w-full items-center gap-3 p-4 border-t border-[rgba(244,244,244,1)] bg-white">
      <div 
        className="bg-[rgba(248,248,248,1)] self-stretch flex items-center gap-2.5 flex-1 px-4 py-3 rounded-full shadow-sm border border-gray-200"
      >
        <img
          src="/logo/logo@vector.svg"
          className="aspect-[1] object-contain w-5 h-5 shrink-0"
          alt="Bot"
        />
        <input
          type="text"
          className="bg-transparent outline-none w-full text-sm placeholder:text-gray-400"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          onClick={(e) => {
            e.stopPropagation();
            if (onInputClick) onInputClick();
          }}
          disabled={isLoading}
        />
      </div>
      <button
        className={`flex items-center justify-center gap-2.5 w-10 h-10 bg-primary text-white rounded-full shadow-sm transition-all
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/90 active:scale-95'}`}
        onClick={handleSend}
        disabled={isLoading || !message.trim()}
        aria-label="Send message"
      >
        {isLoading ? (
          <div className="h-5 w-5 rounded-full border-2 border-t-transparent border-white animate-spin" />
        ) : (
          <Send className="h-5 w-5" />
        )}
      </button>
    </div>
  );
};

export default ChatInput;
