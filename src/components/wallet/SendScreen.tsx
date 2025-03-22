import React, { useState, useEffect } from "react";
import { useWeb3Auth } from "@/context/Web3AuthContext";
import { sendTransaction } from "@/utils/aptos";

interface SendScreenProps {
  onClose: () => void;
  initialAddress?: string | null;
}

const SendScreen: React.FC<SendScreenProps> = ({ onClose, initialAddress = null }) => {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  
  const { aptosAccount, getBalance, aptosBalance } = useWeb3Auth();

  useEffect(() => {
    if (initialAddress) {
      setRecipient(initialAddress);
    }
  }, [initialAddress]);

  const handleSend = async () => {
    if (!recipient || !amount || !aptosAccount) {
      setError("Please enter a valid recipient address and amount");
      return;
    }

    // Check if amount is more than balance
    const balanceInApt = aptosBalance / 100000000;
    if (parseFloat(amount) > balanceInApt) {
      setError("Insufficient balance");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      
      // Convert amount to octas (APT * 10^8)
      const amountInOctas = Math.floor(parseFloat(amount) * 100000000).toString();
      
      const txHash = await sendTransaction(aptosAccount, recipient, amountInOctas);
      console.log("Transaction hash:", txHash);
      
      setSuccess(true);
      getBalance(); // Update balance after transaction
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setSuccess(false);
        setAmount("");
        setRecipient("");
      }, 3000);
    } catch (error) {
      console.error("Error sending transaction:", error);
      setError("Failed to send transaction. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatMaxBalance = () => {
    const balanceInApt = aptosBalance / 100000000;
    return balanceInApt.toFixed(4);
  };

  const handleSetMax = () => {
    const balanceInApt = aptosBalance / 100000000;
    setAmount(balanceInApt.toString());
  };

  return (
    <div className="fixed inset-0 bg-gray-100 flex items-center justify-center overflow-hidden">
      <div className="relative w-full max-w-md h-[85vh] bg-gray-100 flex flex-col overflow-hidden rounded-xl shadow-lg">
        {/* Header */}
        <div className="p-4 flex items-center border-b border-gray-200 bg-white">
          <button 
            onClick={onClose}
            className="text-gray-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"></path>
            </svg>
          </button>
          <h2 className="text-lg font-semibold mx-auto">Send Tokens</h2>
          <div className="w-8"></div>
        </div>

        {/* Content with scroll */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 flex flex-col">
            <div className="flex flex-col items-center mb-5">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path>
                </svg>
              </div>
              <div className="text-center">
                <h3 className="font-medium text-lg">Send APT Tokens</h3>
                <p className="text-gray-500 text-sm">Available: {formatMaxBalance()} APT</p>
              </div>
            </div>
            
            <div className="space-y-4 mt-2">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Recipient Address</label>
                <div className="relative">
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="0x..."
                    className="w-full p-3 border border-gray-300 rounded-lg pr-10 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowQrScanner(true)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7"></rect>
                      <rect x="14" y="3" width="7" height="7"></rect>
                      <rect x="14" y="14" width="7" height="7"></rect>
                      <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                  </button>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Amount (APT)</label>
                  <button 
                    onClick={handleSetMax}
                    className="text-blue-500 text-sm font-medium"
                  >
                    Use max
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    APT
                  </div>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="p-3 mt-4 bg-red-50 text-red-500 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            {success && (
              <div className="p-3 mt-4 bg-green-50 text-green-500 rounded-lg text-sm">
                Transaction sent successfully!
              </div>
            )}
          </div>
        </div>
        
        {/* Fixed Button at bottom */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <button
            onClick={handleSend}
            disabled={isLoading || !recipient || !amount}
            className={`w-full p-4 rounded-xl text-white font-medium ${
              isLoading || !recipient || !amount
                ? "bg-gray-400"
                : "bg-blue-500"
            }`}
          >
            {isLoading ? "Processing..." : "Send Tokens"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendScreen; 