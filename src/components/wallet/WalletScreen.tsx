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
import { useWeb3Auth } from "@/context/Web3AuthContext";
import { requestAirdrop } from "@/utils/aptos";

const WalletScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState("tokens");
  const [showChatScreen, setShowChatScreen] = useState(false);
  const [currentView, setCurrentView] = useState<"main" | "send" | "receive" | "deposit" | "swap" | "settings">("main");
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

  // Handle sending message in chat
  const handleSendMessage = (message: string) => {
    console.log("Sending message:", message);
    // Implement message sending logic here
  };

  // Handle wallet action buttons
  const handleActionButton = async (action: string) => {
    console.log(`${action} button clicked`);
    
    switch (action) {
      case "Send":
        setCurrentView("send");
        break;
      case "Receive":
        setCurrentView("receive");
        break;
      case "Deposit":
        setCurrentView("deposit");
        break;
      case "Swap":
        setCurrentView("swap");
        break;
      case "Settings":
        setCurrentView("settings");
        break;
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
  };

  // Render the appropriate view based on currentView state
  const renderView = () => {
    if (showChatScreen) {
      return <ChatScreen onClose={() => setShowChatScreen(false)} />;
    }

    switch (currentView) {
      case "send":
        return <SendScreen onClose={() => setCurrentView("main")} />;
      case "receive":
        return <ReceiveScreen onClose={() => setCurrentView("main")} />;
      case "deposit":
        return <DepositScreen onClose={() => setCurrentView("main")} />;
      case "swap":
        return <SwapScreen onClose={() => setCurrentView("main")} />;
      case "settings":
        return <SettingsScreen onClose={() => setCurrentView("main")} onLogout={handleLogout} />;
      default:
        return (
          <>
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
                <div className="relative self-stretch flex items-center justify-center h-full w-full py-0">
                  <p className="text-gray-500">
                    Transaction history will appear here
                  </p>
                </div>
              )}
            </div>

            <ChatInput onSendMessage={handleSendMessage} onInputClick={() => setShowChatScreen(true)} />
          </>
        );
    }
  };

  return (
    <div className="bg-[rgba(243,245,246,1)] flex max-w-[480px] w-full flex-col overflow-hidden items-stretch mx-auto pt-[53px] h-full">
      {renderView()}
    </div>
  );
};

export default WalletScreen;