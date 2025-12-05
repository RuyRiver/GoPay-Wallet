import React, { useEffect } from "react";
import WalletScreen from "@/components/wallet/WalletScreen";
import { useGoogleAuth } from "@/context/GoogleAuthContext";
import { useNavigate } from "react-router-dom";
import Spinner from "@/components/common/Spinner";

const WalletPage: React.FC = () => {
  const { isLoggedIn, isInitialized, isLoading } = useGoogleAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isInitialized && !isLoggedIn && !isLoading) {
      navigate("/");
    }
  }, [isLoggedIn, isInitialized, isLoading, navigate]);

  // Show loading spinner while checking login state
  if (isLoading || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[932px]">
        <Spinner />
      </div>
    );
  }

  // Only render the wallet screen if the user is logged in
  if (!isLoggedIn) {
    return null; // Will redirect via useEffect
  }

  return <WalletScreen />;
};

export default WalletPage;
