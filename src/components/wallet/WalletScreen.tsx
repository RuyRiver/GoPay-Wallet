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
import { useWeb3Auth } from "@/context/Web3AuthContext";
import { requestAirdrop } from "@/utils/aptos";
import TransactionHistory from "./TransactionHistory";

const WalletScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState("tokens");
  const [currentView, setCurrentView] = useState<"main" | "send" | "receive" | "deposit" | "swap" | "settings" | "chat">("main");
  const [exitingView, setExitingView] = useState("");
  const [mainViewVisible, setMainViewVisible] = useState(true);
  const { aptosBalance, aptosAddress, userInfo, getBalance, aptosAccount, logout } = useWeb3Auth();

  // Format the balance to a human-readable format
  const formatBalance = (balance: number) => {
    // APT has 8 decimals
    const balanceInApt = balance / 100000000;
    return balanceInApt.toFixed(4);
  };

  // Format USD value (mock exchange rate: 1 APT = $6.34)
  const getUsdValue = (balance: number) => {
    const aptBalance = balance / 100000000;
    const usdValue = aptBalance * 6.34;
    return usdValue.toFixed(2);
  };

  useEffect(() => {
    // Refresh balance when component mounts
    getBalance();
    
    // Set up interval to refresh balance every 30 seconds
    const intervalId = setInterval(() => {
      getBalance();
    }, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [getBalance]);

  // Effect to show the main view animation when mounted
  useEffect(() => {
    setMainViewVisible(true);
  }, []);

  // Tokens data with real APT balance
  const tokens = [{
    id: "1",
    icon: "https://cdn.builder.io/api/v1/image/assets/20e65f047558427aa511c5569cf902c1/334029914a8c29600c1f322abbafa179fc0f317b?placeholderIfAbsent=true",
    name: "APTOS",
    price: "$6.34",
    priceChange: "2.5%",
    amount: formatBalance(aptosBalance),
    symbol: "APT",
    value: `$${getUsdValue(aptosBalance)}`,
    isPositive: true
  }];

  const totalUsdBalance = getUsdValue(aptosBalance);

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
      }, 400);
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
      }, 500);
    } else {
      // If we're in the main view, animate exit and show new view
      setMainViewVisible(false);
      setTimeout(() => {
        setCurrentView(view);
      }, 300);
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

  // Check if a view is active or exiting (for animations)
  const isViewActive = (view: string) => {
    return currentView === view || exitingView === view;
  };

  return (
    <div className="bg-[rgba(243,245,246,1)] flex max-w-[480px] w-full flex-col overflow-hidden items-center mx-auto pt-[53px] h-full">
      {/* Main view with animation */}
      {currentView === "main" && (
        <div className={`flex flex-col items-center w-full transition-all duration-500 transform ${mainViewVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <Header 
            username={userInfo?.name || "User"} 
            balance={`$${totalUsdBalance}`}
            onSettingsClick={() => handleActionButton("Settings")}
          />

          <div className="bg-white border flex min-h-[625px] w-full flex-col items-center pt-5 pb-[132px] px-[27px] rounded-[20px] border-[rgba(237,237,237,1)] border-solid">
            <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

            {activeTab === "tokens" ? (
              <>
                <TokensList tokens={tokens} />
                <ActionButtons 
                  onSend={() => handleActionButton("Send")} 
                  onReceive={() => handleActionButton("Receive")} 
                  onDeposit={() => handleActionButton("Deposit")} 
                  onSwap={() => handleActionButton("Swap")} 
                />
              </>
            ) : (
              <div className="self-stretch flex-1 w-full overflow-hidden">
                <TransactionHistory address={aptosAddress} />
              </div>
            )}
          </div>

          <ChatInput 
            onSendMessage={handleSendMessage} 
            onInputClick={() => handleActionButton("Chat")}
          />
        </div>
      )}

      {/* Animated views */}
      <AnimatedView show={isViewActive("send")} direction="right">
        <SendScreen onClose={() => handleShowView("main")} />
      </AnimatedView>
      
      <AnimatedView show={isViewActive("receive")} direction="right">
        <ReceiveScreen onClose={() => handleShowView("main")} />
      </AnimatedView>
      
      <AnimatedView show={isViewActive("deposit")} direction="right">
        <DepositScreen onClose={() => handleShowView("main")} />
      </AnimatedView>
      
      <AnimatedView show={isViewActive("swap")} direction="right">
        <SwapScreen onClose={() => handleShowView("main")} />
      </AnimatedView>
      
      <AnimatedView show={isViewActive("settings")} direction="right">
        <SettingsScreen onClose={() => handleShowView("main")} onLogout={handleLogout} />
      </AnimatedView>
      
      <AnimatedView show={isViewActive("chat")} direction="right">
        <ChatScreen onClose={() => handleShowView("main")} walletAddress={aptosAddress} />
      </AnimatedView>
    </div>
  );
};

export default WalletScreen;