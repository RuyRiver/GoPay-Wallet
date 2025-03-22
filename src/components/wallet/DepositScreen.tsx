import React, { useState } from "react";
import { useWeb3Auth } from "@/context/Web3AuthContext";
import { requestAirdrop } from "@/utils/aptos";
import AddCardScreen from "./AddCardScreen";

interface DepositScreenProps {
  onClose: () => void;
}

const DepositScreen: React.FC<DepositScreenProps> = ({ onClose }) => {
  const { aptosAddress, getBalance } = useWeb3Auth();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string | null>("aptos");
  const [showAddCard, setShowAddCard] = useState(false);

  const handleAirdrop = async () => {
    if (!aptosAddress) {
      setError("Wallet address not available.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      
      const result = await requestAirdrop(aptosAddress);
      
      if (result) {
        setSuccess(true);
        // Set a timer to check the balance after airdrop
        setTimeout(() => {
          getBalance();
        }, 5000);
      } else {
        setError("Failed to request test tokens. Please try again later.");
      }
    } catch (error) {
      console.error("Error requesting airdrop:", error);
      setError("An error occurred while requesting tokens. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const paymentMethods = [
    {
      id: "aptos",
      name: "Aptos Pay",
      icon: "A",
      iconBg: "#E8415B",
      last4: "",
    },
    {
      id: "credit",
      name: "Credit Card",
      icon: "💳",
      iconBg: "transparent",
      last4: "",
    },
    {
      id: "visa1",
      name: "Visa",
      icon: "💳",
      iconBg: "#1434CB",
      last4: "7058",
    },
    {
      id: "visa2",
      name: "Visa",
      icon: "💳",
      iconBg: "#1434CB",
      last4: "2322",
    },
    {
      id: "google",
      name: "Google Pay",
      icon: "G",
      iconBg: "#4285F4",
      last4: "",
    },
    {
      id: "paypal",
      name: "PayPal",
      icon: "P",
      iconBg: "#003087",
      last4: "",
    },
    {
      id: "wise",
      name: "Wise",
      icon: "W",
      iconBg: "#48D494",
      last4: "",
    },
  ];

  const handleAddNewCard = () => {
    setShowAddCard(true);
  };

  const handleCardAdded = () => {
    // In a real app, you would save the card details
    setShowAddCard(false);
    // Simulate a new card being added
    setSelectedMethod("newCard");
  };

  if (showAddCard) {
    return <AddCardScreen onClose={() => setShowAddCard(false)} onAddCard={handleCardAdded} />;
  }

  return (
    <div className="fixed inset-0 bg-gray-100 flex items-center justify-center overflow-hidden">
      <div className="relative w-full max-w-md h-[85vh] bg-gray-100 flex flex-col overflow-hidden rounded-xl shadow-lg">
        {/* Header */}
        <div className="p-4 flex items-center border-b border-gray-200 bg-white">
          <button onClick={onClose} className="text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7"></path>
            </svg>
          </button>
          <h2 className="text-lg font-semibold mx-auto">Deposit</h2>
          <div className="w-8 flex justify-end">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
          </div>
        </div>

        {/* Content with scroll */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 flex flex-col">
            <h3 className="text-sm font-medium text-gray-600 mb-3">Payment Method</h3>
            
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div 
                  key={method.id}
                  className={`flex items-center p-3 rounded-xl border ${selectedMethod === method.id ? 'border-blue-500' : 'border-gray-200'} bg-white`}
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <div className="mr-3">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm"
                      style={{ background: method.iconBg }}
                    >
                      {method.icon}
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <div className="text-sm font-medium">
                      {method.name}
                      {method.last4 && <span className="text-gray-500 ml-2">**** {method.last4}</span>}
                    </div>
                    <div 
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedMethod === method.id ? 'border-blue-500' : 'border-gray-300'
                      }`}
                    >
                      {selectedMethod === method.id && (
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="flex items-center justify-center py-3 mt-2">
                <button 
                  className="flex items-center text-blue-500 font-medium"
                  onClick={handleAddNewCard}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Add new card
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 mb-4 mt-4 bg-red-50 text-red-500 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 mb-4 mt-4 bg-green-50 text-green-500 rounded-lg text-sm">
                Airdrop requested successfully! Tokens should arrive in your wallet shortly.
              </div>
            )}
          </div>
        </div>
        
        {/* Fixed Button at bottom */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <button
            onClick={handleAirdrop}
            disabled={isLoading || !selectedMethod}
            className={`w-full p-4 rounded-xl text-white font-medium ${
              isLoading || !selectedMethod
                ? "bg-gray-400"
                : "bg-blue-500"
            }`}
          >
            {isLoading ? "Processing..." : "Purchase Now"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepositScreen; 