import React, { useState, useEffect } from "react";
import Header from "./Header";
import Tabs from "./Tabs";
import TokensList from "./TokensList";
import ActionButtons from "./ActionButtons";
import ChatInput from "./ChatInput";
import ChatScreen from "./ChatScreen";
import SendScreen from "./SendScreen";
import ReceiveScreen from "./ReceiveScreen";
import DepositScreen from "./DepositScreen";
import SwapScreen from "./SwapScreen";
import SettingsScreen from "./SettingsScreen";
import AnimatedView from "@/components/ui/AnimatedView";
import { useGoogleAuth } from "@/context/GoogleAuthContext";
import PortfolioService, { type Portfolio } from "@/services/portfolioService";
import TransactionDetectionService from "@/services/transactionDetectionService";
import TransactionHistory from "./TransactionHistory";
import { type Contact } from "@/services/contactsService";

const WalletScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState("tokens");
  const [currentView, setCurrentView] = useState<"main" | "send" | "receive" | "deposit" | "swap" | "settings" | "chat">("main");
  const [exitingView, setExitingView] = useState("");
  const [mainViewVisible, setMainViewVisible] = useState(true);
  const { userInfo, logout } = useGoogleAuth();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(true);
  const [selectedTokenSymbol, setSelectedTokenSymbol] = useState<string | null>(null);
  const [initialChatMessage, setInitialChatMessage] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Load portfolio from PortfolioService
  const loadPortfolio = async () => {
    try {
      setIsLoadingPortfolio(true);
      const portfolioData = await PortfolioService.getPortfolio('mainnet');
      setPortfolio(portfolioData);
      console.log('[WalletScreen] Portfolio loaded:', portfolioData);
    } catch (error) {
      console.error('[WalletScreen] Error loading portfolio:', error);
    } finally {
      setIsLoadingPortfolio(false);
    }
  };

  useEffect(() => {
    // Load portfolio when component mounts
    loadPortfolio();

    // Set up interval to refresh portfolio every 30 seconds
    const intervalId = setInterval(() => {
      loadPortfolio();
    }, 30000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Set up transaction detection service
  useEffect(() => {
    const detectionService = TransactionDetectionService.getInstance();

    // Handler for when new transaction is detected
    const handleNewTransaction = (tx: any) => {
      console.log('[WalletScreen] New transaction detected:', tx);
      // Refresh portfolio to show updated balances
      loadPortfolio();
      // Could also show a notification here
    };

    // Start monitoring for new transactions (poll every 30 seconds)
    detectionService.startMonitoring(handleNewTransaction, 30000);

    // Stop monitoring on unmount
    return () => {
      detectionService.stopMonitoring();
    };
  }, []);

  // Effect to show the main view animation when mounted
  useEffect(() => {
    setMainViewVisible(true);
  }, []);

  // Map portfolio tokens to UI format
  const tokens = portfolio?.tokens.map((token, index) => ({
    id: index.toString(),
    icon: `https://cdn.builder.io/api/v1/image/assets/20e65f047558427aa511c5569cf902c1/334029914a8c29600c1f322abbafa179fc0f317b?placeholderIfAbsent=true`,
    name: token.name,
    price: `$${token.priceUSD.toFixed(2)}`,
    priceChange: `${token.change24h > 0 ? '+' : ''}${token.change24h.toFixed(2)}%`,
    amount: token.balance,
    symbol: token.symbol,
    value: `$${token.valueUSD.toFixed(2)}`,
    isPositive: token.change24h >= 0
  })) || [];

  const totalUsdBalance = portfolio?.totalValueUSD.toFixed(2) || "0.00";

  // Enhanced view transition management
  const handleShowView = (view: "main" | "send" | "receive" | "deposit" | "swap" | "settings" | "chat") => {
    if (view === "main") {
      // Hide current view (non-main)
      setExitingView(currentView);
      setMainViewVisible(false);
      
      // After a brief delay, update view and show main
      setTimeout(() => {
        setExitingView("");
        setCurrentView("main");
        setMainViewVisible(true);
      }, 20); // Increased duration for smoother transition
    } else if (currentView !== "main") {
      // If there's already a different view than main, first hide it with animation
      setExitingView(currentView);
      setCurrentView("main");
      setMainViewVisible(true);
      
      // After a brief delay for transition, show the new view
      setTimeout(() => {
        setExitingView("");
        setMainViewVisible(false);
        setCurrentView(view);
      }, 1200); // Increased duration for smoother transition
    } else {
      // If we're in the main view, animate exit and show new view
      setMainViewVisible(false);
      setTimeout(() => {
        setCurrentView(view);
      }, 20); // Increased duration for smoother transition
    }
  };

  // Handle sending message in chat
  const handleSendMessage = (message: string) => {
    console.log("Sending message:", message);
    handleShowView("chat");
  };

  // Handle wallet action buttons
  const handleActionButton = async (action: string) => {
    console.log(`${action} button clicked`);
    
    switch (action) {
      case "Send":
        handleShowView("send");
        break;
      case "Receive":
        handleShowView("receive");
        break;
      case "Deposit":
        handleShowView("deposit");
        break;
      case "Swap":
        handleShowView("swap");
        break;
      case "Settings":
        handleShowView("settings");
        break;
      case "Chat":
        handleShowView("chat");
        break;
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
  };

  // Handle token action buttons
  const handleTokenSend = (token: any) => {
    console.log('[WalletScreen] Token Send clicked:', token.symbol);
    setSelectedTokenSymbol(token.symbol);
    handleShowView("send");
  };

  const handleTokenDeposit = (token: any) => {
    console.log('[WalletScreen] Token Deposit clicked:', token.symbol);
    setSelectedTokenSymbol(token.symbol);
    handleShowView("deposit");
  };

  const handleTokenSwap = (token: any) => {
    console.log('[WalletScreen] Token Swap clicked:', token.symbol);
    setSelectedTokenSymbol(token.symbol);
    handleShowView("swap");
  };

  const handleTokenChat = (token: any) => {
    console.log('[WalletScreen] Token Chat clicked:', token.symbol);
    const message = `Tell me about ${token.name} (${token.symbol}). Current balance: ${token.amount} ${token.symbol}`;
    setInitialChatMessage(message);
    handleShowView("chat");
  };

  // Handle contact click - open send screen with contact pre-selected
  const handleContactClick = (contact: Contact) => {
    console.log('[WalletScreen] Contact clicked:', contact.nickname);
    setSelectedContact(contact);
    handleShowView("send");
  };

  // Handle add contact - for now just log, can open a modal later
  const handleAddContact = () => {
    console.log('[WalletScreen] Add contact clicked');
    // TODO: Open add contact modal
  };

  // Check if a view is active or exiting (for animations)
  const isViewActive = (view: string) => {
    return currentView === view || exitingView === view;
  };

  return (
    <div className="bg-gray-50 flex flex-col h-full w-full overflow-hidden relative">
      {/* Video Background */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/bg/header-bg.webm" type="video/webm" />
        </video>
      </div>

      {/* Main view with animation */}
      <div className={`relative z-10 flex flex-col items-center w-full h-full transition-opacity duration-300 ${currentView === "main" ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <Header
            username={userInfo?.name || "User"}
            balance={`$${totalUsdBalance}`}
            onSettingsClick={() => handleActionButton("Settings")}
            onContactClick={handleContactClick}
            onAddContact={handleAddContact}
          />

          <div className="bg-white border flex flex-1 w-full flex-col items-center p-3 rounded-t-[1.5rem] border-[rgba(237,237,237,1)] border-solid overflow-y-auto">
            <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

            {activeTab === "tokens" ? (
              <div className="w-full flex-1 flex flex-col">
                <TokensList
                  tokens={tokens}
                  onTokenSend={handleTokenSend}
                  onTokenDeposit={handleTokenDeposit}
                  onTokenSwap={handleTokenSwap}
                  onTokenChat={handleTokenChat}
                />
                <ActionButtons
                  onSend={() => handleActionButton("Send")}
                  onReceive={() => handleActionButton("Receive")}
                />
              </div>
            ) : (
              <div className="self-stretch flex-1 w-full overflow-auto">
                <TransactionHistory address={portfolio?.walletAddress || ''} />
              </div>
            )}
          </div>

          <ChatInput
            onSendMessage={handleSendMessage}
            onInputClick={() => handleActionButton("Chat")}
          />
      </div>

      {/* Animated views */}
      <AnimatedView show={isViewActive("send")} direction="right">
        <SendScreen
          onClose={() => {
            handleShowView("main");
            setSelectedTokenSymbol(null);
            setSelectedContact(null);
          }}
          initialTokenSymbol={selectedTokenSymbol}
          initialContact={selectedContact}
        />
      </AnimatedView>
      
      <AnimatedView show={isViewActive("receive")} direction="right">
        <ReceiveScreen onClose={() => handleShowView("main")} />
      </AnimatedView>
      
      <AnimatedView show={isViewActive("deposit")} direction="right">
        <DepositScreen
          onClose={() => {
            handleShowView("main");
            setSelectedTokenSymbol(null);
          }}
          tokenSymbol={selectedTokenSymbol || undefined}
        />
      </AnimatedView>
      
      <AnimatedView show={isViewActive("swap")} direction="right">
        <SwapScreen onClose={() => handleShowView("main")} />
      </AnimatedView>
      
      <AnimatedView show={isViewActive("settings")} direction="right">
        <SettingsScreen onClose={() => handleShowView("main")} onLogout={handleLogout} />
      </AnimatedView>
      
      <AnimatedView show={isViewActive("chat")} direction="right">
        <ChatScreen
          onClose={() => {
            handleShowView("main");
            setInitialChatMessage(null);
          }}
          initialMessage={initialChatMessage}
        />
      </AnimatedView>
    </div>
  );
};

export default WalletScreen;