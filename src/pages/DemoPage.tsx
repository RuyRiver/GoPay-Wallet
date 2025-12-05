import React from "react";
import WalletScreen from "@/components/wallet/WalletScreen";

/**
 * Demo page to view the wallet interface without authentication
 * Useful for UI testing and development
 */
const DemoPage: React.FC = () => {
  return <WalletScreen />;
};

export default DemoPage;
