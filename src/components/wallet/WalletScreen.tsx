import React, { useState } from "react";
import Header from "./Header";
import Tabs from "./Tabs";
import TokensList from "./TokensList";
import ActionButtons from "./ActionButtons";
import ChatInput from "./ChatInput";
const WalletScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState("tokens");

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
  return <div className="bg-[rgba(243,245,246,1)] flex max-w-[480px] w-full flex-col overflow-hidden items-stretch mx-auto pt-[53px]">
      <Header username="Username" balance="$2,663.56" />

      <div className="bg-white border flex min-h-[625px] w-full flex-col items-center pt-5 pb-[132px] px-[27px] rounded-[20px] border-[rgba(237,237,237,1)] border-solid">
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

      <ChatInput onSendMessage={handleSendMessage} />
    </div>;
};
export default WalletScreen;