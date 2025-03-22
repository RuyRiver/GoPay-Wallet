import React, { useState } from "react";

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
    <div className="z-10 flex mt-[-109px] w-full items-center gap-6 pt-5 pb-[41px] px-7 border-[rgba(244,244,244,1)] border-t">
      <div 
        className="bg-[rgba(232,232,232,1)] shadow-[20px_20px_60px_rgba(197,197,197,1)] self-stretch flex min-w-60 items-center gap-2.5 text-[13px] text-[rgba(117,117,117,1)] font-normal flex-1 shrink basis-[0%] my-auto px-4 py-[15px] rounded-2xl"
      >
        <img
          src="/lovable-uploads/3992c85c-5a2a-4d3f-8961-b8b8f7f07838.png"
          className="aspect-[1] object-contain w-4 self-stretch shrink-0 my-auto"
          alt="Bot"
        />
        <input
          type="text"
          className="bg-transparent outline-none w-full"
          placeholder="How can help you?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          onClick={(e) => {
            e.stopPropagation();
            if (onInputClick) onInputClick();
          }}
        />
      </div>
      <button
        className={`shadow-[-2px_-7px_10px_rgba(241,241,241,1)] self-stretch flex items-center justify-center gap-2.5 w-12 my-auto p-3 rounded-[30px] ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={handleSend}
        disabled={isLoading}
        aria-label="Send message"
      >
        {isLoading ? (
          <div className="h-6 w-6 rounded-full border-2 border-t-transparent border-blue-500 animate-spin" />
        ) : (
          <img
            src="https://cdn.builder.io/api/v1/image/assets/20e65f047558427aa511c5569cf902c1/a6cc5e478f9e2b60db24893cea89233c8dea549b?placeholderIfAbsent=true"
            className="aspect-[1] object-contain w-6 self-stretch my-auto"
            alt="Send"
          />
        )}
      </button>
    </div>
  );
};

export default ChatInput;
