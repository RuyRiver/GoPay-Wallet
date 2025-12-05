import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { sendMessageToAgent } from "@/services/agentApi";
import { useGoogleAuth } from "@/context/GoogleAuthContext";
import type { AIResponse, AgentServiceResponse } from "@/types/agent";
import ChatInput from "./ChatInput";
import PortfolioService from "@/services/portfolioService";
import { DEFAULT_NETWORK } from "@/constants/networks";
import { send } from "@/services/sendTransaction";
import { getExplorerUrl } from "@/constants/networks";

interface ChatScreenProps {
  onClose: () => void;
  initialMessage?: string | null;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  aiResponse?: AIResponse;
}

// Suggestion card component
const ChatSuggestion: React.FC<{
  title: string;
  description: string;
  onClick?: () => void;
}> = ({ title, description, onClick }) => (
  <div
    className="p-4 border border-gray-200 rounded-2xl mb-3 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
    onClick={onClick}
  >
    <h3 className="text-center font-semibold text-base mb-0.5">{title}</h3>
    <p className="text-center text-gray-400 text-sm">{description}</p>
  </div>
);

// User message bubble
const UserMessage: React.FC<{ content: string }> = ({ content }) => {
  const { userInfo } = useGoogleAuth();

  return (
    <div className="flex justify-end gap-2 px-4 py-2">
      <div className="max-w-[75%] bg-gradient-to-br from-[#0495FF] to-[#0461F0] text-white px-4 py-3 rounded-2xl rounded-tr-sm shadow-sm">
        <p className="whitespace-pre-wrap break-words text-sm">{content}</p>
      </div>
      <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-xs font-medium text-gray-600 self-end">
        {userInfo?.profileImage ? (
          <img src={userInfo.profileImage} alt="" className="w-8 h-8 rounded-full object-cover" />
        ) : (
          userInfo?.name?.charAt(0).toUpperCase() || 'U'
        )}
      </div>
    </div>
  );
};

// Bot message bubble
const BotMessage: React.FC<{
  content: string;
  aiResponse?: AIResponse;
  onQuickAction?: (text: string) => void;
}> = ({ content, aiResponse, onQuickAction }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Check for transaction hash in content
  const txHashMatch = content.match(/\b[a-fA-F0-9]{64}\b/);
  const txHash = txHashMatch ? txHashMatch[0] : null;

  return (
    <div className="flex gap-2 px-4 py-2">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0495FF] to-[#0461F0] flex-shrink-0 flex items-center justify-center self-end shadow-sm">
        <img src="/logo/logo@vector.svg" alt="" className="w-5 h-5" />
      </div>
      <div className="max-w-[75%] flex flex-col gap-2">
        {/* Message bubble */}
        <div className="bg-[#F5F5F7] px-4 py-3 rounded-2xl rounded-tl-sm">
          <p className="whitespace-pre-wrap break-words text-sm text-gray-800">{content}</p>

          {/* Transaction link if hash found */}
          {txHash && (
            <a
              href={`https://explorer.hiro.so/txid/${txHash}?chain=mainnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-xs text-blue-600 hover:underline"
            >
              View in Explorer →
            </a>
          )}

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        {/* Quick action buttons */}
        {aiResponse?.quickActions && aiResponse.quickActions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {aiResponse.quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => onQuickAction?.(action.label)}
                className="px-3 py-1.5 text-xs font-medium rounded-full border border-[#0461F0] text-[#0461F0] hover:bg-[#0461F0]/10 transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Rich content - Balance */}
        {aiResponse?.richContent?.type === 'balance_info' && aiResponse.richContent.data && (
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-4 rounded-xl text-white shadow-sm">
            <p className="text-xs opacity-80 mb-1">Your Balance</p>
            <p className="text-xl font-bold">
              {aiResponse.richContent.data.balance} {aiResponse.richContent.data.currency}
            </p>
            {aiResponse.richContent.data.usdValue && (
              <p className="text-sm opacity-90">≈ ${aiResponse.richContent.data.usdValue}</p>
            )}
          </div>
        )}

        {/* Rich content - Transaction */}
        {aiResponse?.richContent?.type === 'transaction_details' && aiResponse.richContent.data && (
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-xl text-white shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">Transaction Sent</span>
            </div>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="opacity-80">Amount:</span>
                <span>{aiResponse.richContent.data.amount} {aiResponse.richContent.data.currency}</span>
              </div>
              {aiResponse.richContent.data.recipient && (
                <div className="flex justify-between">
                  <span className="opacity-80">To:</span>
                  <span className="font-mono text-xs">
                    {aiResponse.richContent.data.recipient.slice(0, 6)}...{aiResponse.richContent.data.recipient.slice(-4)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Typing indicator
const TypingIndicator: React.FC = () => (
  <div className="flex gap-2 px-4 py-2">
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0495FF] to-[#0461F0] flex-shrink-0 flex items-center justify-center">
      <img src="/logo/logo@vector.svg" alt="" className="w-5 h-5" />
    </div>
    <div className="bg-[#F5F5F7] px-4 py-3 rounded-2xl rounded-tl-sm">
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
);

const ChatScreen: React.FC<ChatScreenProps> = ({ onClose, initialMessage }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatStarted, setChatStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentState, setCurrentState] = useState<AIResponse | null>(null);
  const [hasProcessedInitialMessage, setHasProcessedInitialMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Load saved messages
  useEffect(() => {
    try {
      const saved = localStorage.getItem('chat-messages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          setChatStarted(true);
        }
      }
    } catch (e) {
      console.error('[ChatScreen] Error loading messages:', e);
    }
  }, []);

  // Save messages
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chat-messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Process initial message
  useEffect(() => {
    if (initialMessage && !hasProcessedInitialMessage && !isLoading) {
      setHasProcessedInitialMessage(true);
      handleSendMessage(initialMessage);
    }
  }, [initialMessage, hasProcessedInitialMessage, isLoading]);

  // Execute action from backend response
  const executeAction = async (actionDetails: AgentServiceResponse['actionDetails']): Promise<string | null> => {
    if (!actionDetails?.type) return null;

    console.log('[ChatScreen] Executing action:', actionDetails.type);

    try {
      if (actionDetails.type === 'FETCH_BALANCE') {
        const portfolio = await PortfolioService.getPortfolio(DEFAULT_NETWORK.id);
        const lines = portfolio.tokens.map(t =>
          `• ${t.symbol}: ${parseFloat(t.balance).toFixed(4)} ($${t.valueUSD.toFixed(2)})`
        );
        return `Here's your current balance:\n\n${lines.join('\n')}\n\n💰 Total: $${portfolio.totalValueUSD.toFixed(2)} USD`;
      }

      if (actionDetails.type === 'SEND_TRANSACTION') {
        // actionDetails has fields directly, not nested in data
        const recipient = actionDetails.recipientAddress || actionDetails.recipientEmail;
        const amount = actionDetails.amount;
        const token = actionDetails.currency || 'STX';

        console.log('[ChatScreen] SEND_TRANSACTION actionDetails:', actionDetails);

        if (!recipient || !amount) {
          return '❌ Missing transaction details. Please try again.';
        }

        console.log('[ChatScreen] Executing SEND_TRANSACTION:', { recipient, amount, token });

        try {
          const txHash = await send(recipient, amount.toString(), token);
          const explorerUrl = getExplorerUrl(txHash, DEFAULT_NETWORK.id);

          return `✅ Transaction sent successfully!\n\n` +
            `Amount: ${amount} ${token}\n` +
            `To: ${recipient}\n` +
            `Tx: ${txHash.substring(0, 10)}...\n\n` +
            `View on explorer: ${explorerUrl}`;
        } catch (txError: any) {
          console.error('[ChatScreen] Transaction error:', txError);
          return `❌ Transaction failed: ${txError.message || 'Unknown error'}`;
        }
      }

      return null;
    } catch (error) {
      console.error('[ChatScreen] Action error:', error);
      return null;
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setChatStarted(true);
    setIsLoading(true);

    try {
      const response = await sendMessageToAgent(message, currentState);
      console.log('[ChatScreen] Response:', response);

      // Get the message content
      let content = response.responseMessage || "I couldn't process your request.";

      // Execute action if specified
      if (response.actionDetails?.type) {
        const result = await executeAction(response.actionDetails);
        if (result) {
          content = result;
        }
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        content,
        sender: 'bot',
        timestamp: new Date(),
        aiResponse: response.newState || undefined
      };

      setMessages(prev => [...prev, botMsg]);

      if (response.newState) {
        setCurrentState(response.newState);
      }
    } catch (error) {
      console.error('[ChatScreen] Error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        content: "Sorry, something went wrong. Please try again.",
        sender: 'bot',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setChatStarted(false);
    setCurrentState(null);
    localStorage.removeItem('chat-messages');
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
        <button onClick={onClose} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-base font-semibold">Movya Agent</h2>
        {chatStarted ? (
          <button onClick={clearChat} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1">
            Clear
          </button>
        ) : (
          <div className="w-10" />
        )}
      </div>

      {/* Content - single scrollable container */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {!chatStarted ? (
          <div className="p-4">
            <h3 className="text-base font-semibold mb-4 text-center text-gray-700">
              How can I help you today?
            </h3>
            <ChatSuggestion
              title="Check Balance"
              description="View your token balances"
              onClick={() => handleSendMessage("What's my balance?")}
            />
            <ChatSuggestion
              title="Send Tokens"
              description="Transfer STX, sBTC or USDA"
              onClick={() => handleSendMessage("I want to send some tokens")}
            />
            <ChatSuggestion
              title="Learn About Stacks"
              description="Blockchain information"
              onClick={() => handleSendMessage("What is Stacks?")}
            />
          </div>
        ) : (
          <div className="py-2">
            {messages.map(msg => (
              msg.sender === 'user' ? (
                <UserMessage key={msg.id} content={msg.content} />
              ) : (
                <BotMessage
                  key={msg.id}
                  content={msg.content}
                  aiResponse={msg.aiResponse}
                  onQuickAction={handleSendMessage}
                />
              )
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input - fixed at bottom */}
      <div className="flex-shrink-0">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default ChatScreen;
