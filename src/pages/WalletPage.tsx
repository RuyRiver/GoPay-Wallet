import React from "react";
import WalletScreen from "@/components/wallet/WalletScreen";

const Index: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <WalletScreen />
    </div>
  );
};

export default WalletScreen;
