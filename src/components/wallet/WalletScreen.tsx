
import React, { useState } from "react";
import Header from "./Header";
import Tabs from "./Tabs";
import TokensList from "./TokensList";
import ActionButtons from "./ActionButtons";
import ChatInput from "./ChatInput";
import ChatScreen from "./ChatScreen";

const WalletScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState("tokens");
  const [showChatScreen, setShowChatScreen] = useState(false);

  // Mock data for tokens
  const tokens = [{
    id: "1",
    icon: "https://cdn.builder.io/api/v1/image/assets/20e65f047558427aa511c5569cf902c1/334029914a8c29600c1f322abbafa179fc0f317b?placeholderIfAbsent=true",
    name: "APTOS",
    price: "$6.34",
    priceChange: "2.5%",
    amount: "0",
    symbol: "APT",
    value: "$0",
    isPositive: true
  }
  // Additional tokens could be added here
  ];

  const handleSendMessage = (message: string) => {
    console.log("Sending message:", message);
    // Implement message sending logic here
  };

  const handleActionButton = (action: string) => {
    console.log(`${action} button clicked`);
    // Implement action button logic here
  };

  if (showChatScreen) {
    return (
      <div className="bg-white h-screen max-w-[480px] w-full overflow-hidden mx-auto">
        <ChatScreen onClose={() => setShowChatScreen(false)} />
      </div>
    );
  }

  return (
    <div className="bg-[rgba(243,245,246,1)] flex max-w-[480px] w-full flex-col overflow-hidden mx-auto h-screen pt-[53px] relative">
      <Header username="Username" balance="$2,663.56" />

      <div className="bg-white border flex w-full flex-col items-center pt-5 pb-36 px-[27px] rounded-[20px] border-[rgba(237,237,237,1)] border-solid flex-1 overflow-y-auto">
        <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "tokens" ? <>
            <TokensList tokens={tokens} />
            <ActionButtons onSend={() => handleActionButton("Send")} onReceive={() => handleActionButton("Receive")} onDeposit={() => handleActionButton("Deposit")} onSwap={() => handleActionButton("Swap")} />
          </> : <div className="flex items-center justify-center h-full w-full">
            <p className="text-gray-500">
              Transaction history will appear here
            </p>
          </div>}
      </div>

      <ChatInput 
        onSendMessage={handleSendMessage} 
        onInputClick={() => setShowChatScreen(true)}
      />
    </div>
  );
};

export default WalletScreen;
