import React, { useEffect } from "react";
import WalletScreen from "@/components/wallet/WalletScreen";
import { useWeb3Auth } from "@/context/Web3AuthContext";
import { useNavigate } from "react-router-dom";

const WalletPage: React.FC = () => {
  const { isLoggedIn, isInitialized } = useWeb3Auth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isInitialized && !isLoggedIn) {
      navigate("/");
    }
  }, [isLoggedIn, isInitialized, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <WalletScreen />
    </div>
  );
};

export default WalletPage;
