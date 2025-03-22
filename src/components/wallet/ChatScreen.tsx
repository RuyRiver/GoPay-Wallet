import React, { useState } from "react";
import { ChevronLeft, ThumbsUp, ThumbsDown, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";

interface ChatScreenProps {
  onClose: () => void;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
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

const UserMessage: React.FC<{ content: string }> = ({ content }) => (
  <div className="flex gap-3 p-4 bg-[#1E1E1E] text-white">
    <Avatar className="h-10 w-10 bg-gray-300">
      <div className="h-10 w-10 rounded-full bg-gray-300"></div>
    </Avatar>
    <div className="flex-1">
      <p className="text-white">{content}</p>
    </div>
  </div>
);

const BotMessage: React.FC<{ content: string }> = ({ content }) => (
  <div className="flex gap-3 p-4 bg-[#EEEEEE]">
    <Avatar className="h-10 w-10">
      <img 
        src="/lovable-uploads/3992c85c-5a2a-4d3f-8961-b8b8f7f07838.png" 
        alt="Bot" 
        className="h-10 w-10"
      />
    </Avatar>
    <div className="flex-1">
      <p className="text-gray-800">{content}</p>
    </div>
    <div className="flex gap-2 mt-2">
      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
        <ThumbsUp className="h-5 w-5 text-gray-500" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
        <ThumbsDown className="h-5 w-5 text-gray-500" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full ml-4">
        <Copy className="h-5 w-5 text-gray-500" />
        <span className="sr-only">Copy to clipboard</span>
      </Button>
    </div>
  </div>
);

const ChatScreen: React.FC<ChatScreenProps> = ({ onClose }) => {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatStarted, setChatStarted] = useState(false);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setChatStarted(true);
    
    // Simulate bot response
    setTimeout(() => {
      let response = "";
      
      if (inputValue.toLowerCase().includes("usdt") || inputValue.toLowerCase().includes("send")) {
        response = `Hello, of course yes. 100 USDT will be sent to ${inputValue.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0] || "the recipient"}`;
        
        // Add second message after a delay
        setTimeout(() => {
          const followUpMessage: Message = {
            id: (Date.now() + 1000).toString(),
            content: `The 100 USDT have already been sent to ${inputValue.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0] || "the recipient"}\nWould you like something more?`,
            sender: 'bot',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, followUpMessage]);
        }, 2000);
      } else {
        response = "How can I help you with your wallet today?";
      }
      
      const botMessage: Message = {
        id: (Date.now() + 100).toString(),
        content: response,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    }, 1000);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    
    // Auto-send the suggestion
    setTimeout(() => {
      const userMessage: Message = {
        id: Date.now().toString(),
        content: suggestion,
        sender: 'user',
        timestamp: new Date()
      };
      
      setMessages([userMessage]);
      setChatStarted(true);
      
      // Simulate bot response
      setTimeout(() => {
        const botMessage: Message = {
          id: (Date.now() + 100).toString(),
          content: `Hello, of course yes. 100 USDT will be sent to elias.soria.juan.manuel@gmail.com`,
          sender: 'bot',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, botMessage]);
        
        // Add second message after a delay
        setTimeout(() => {
          const followUpMessage: Message = {
            id: (Date.now() + 1000).toString(),
            content: `The 100 USDT have already been sent to elias.soria.juan.manuel@gmail.com\nWould you like something more?`,
            sender: 'bot',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, followUpMessage]);
        }, 2000);
      }, 1000);
    }, 100);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center border-b border-gray-200">
        <button onClick={onClose} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7"></path>
          </svg>
        </button>
        <h2 className="text-lg font-semibold mx-auto">Wallet Chat</h2>
        <div className="w-8"></div>
      </div>

      {/* Content with scroll */}
      <div className="flex-1 overflow-y-auto">
        {!chatStarted ? (
          <div className="p-5 flex flex-col">
            {/* Bot avatar for welcome screen */}
            <div className="flex justify-center mt-4 mb-10">
              <img 
                src="/lovable-uploads/3992c85c-5a2a-4d3f-8961-b8b8f7f07838.png" 
                alt="Wallet Bot" 
                className="w-24 h-24"
              />
            </div>

            {/* Suggestions */}
            <p className="text-gray-400 text-center mb-6">
              These are just a few examples of what I can do.
            </p>
            
            <ChatSuggestion 
              title="Send a currency to a friend" 
              description="Send 200 APT to Jeremy" 
              onClick={() => handleSuggestionClick("Hello, assistant. You can send 100 USDT to the following person elias.soria.juan.manuel@gmail.com Thank you!")}
            />
            
            <ChatSuggestion 
              title="Ask for money" 
              description="Request Jeremy to pay me 100 APT" 
              onClick={() => handleSuggestionClick("I need Jeremy to send me 100 APT")}
            />
            
            <ChatSuggestion 
              title="Sent a currency to an address" 
              description="Send 100 APT to an address" 
              onClick={() => handleSuggestionClick("Please send 100 USDT to elias.soria.juan.manuel@gmail.com")}
            />
          </div>
        ) : (
          <div className="flex flex-col">
            {messages.map((message) => (
              message.sender === 'user' ? (
                <UserMessage key={message.id} content={message.content} />
              ) : (
                <BotMessage key={message.id} content={message.content} />
              )
            ))}
          </div>
        )}
      </div>

      {/* Chat input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-4 bg-gray-100 p-3 px-5 rounded-full">
          <img 
            src="/lovable-uploads/3992c85c-5a2a-4d3f-8961-b8b8f7f07838.png" 
            alt="Bot" 
            className="w-6 h-6"
          />
          <Input 
            placeholder="How can help you?" 
            className="border-none bg-transparent shadow-none focus-visible:ring-0 flex-1 p-0 h-auto text-base"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSendMessage();
              }
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 p-2 rounded-full hover:bg-gray-200"
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`${!inputValue.trim() ? "text-gray-300" : "text-blue-500"}`}
            >
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;
