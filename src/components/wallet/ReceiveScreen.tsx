import React, { useEffect, useState } from "react";
import { useGoogleAuth } from "@/context/GoogleAuthContext";
import { Copy, Check, ArrowLeft, QrCode } from "lucide-react";

interface ReceiveScreenProps {
  onClose: () => void;
}

const ReceiveScreen: React.FC<ReceiveScreenProps> = ({ onClose }) => {
  const { walletAddress } = useGoogleAuth();
  const [isCopied, setIsCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    if (walletAddress) {
      // Generate QR code using a free API - just the address
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(walletAddress)}`;
      setQrCodeUrl(qrUrl);
    }
  }, [walletAddress]);

  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    const start = address.substring(0, 10);
    const end = address.substring(address.length - 8);
    return `${start}...${end}`;
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="p-4 flex items-center border-b border-gray-200 bg-white">
        <button onClick={onClose} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold mx-auto">Receive</h2>
        <div className="w-8"></div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex flex-col items-center">
          {/* QR Code Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="w-48 h-48"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded-lg">
                <QrCode className="w-12 h-12 text-gray-400 animate-pulse" />
              </div>
            )}
          </div>

          <p className="text-sm text-gray-500 mb-2">Scan this QR code to receive tokens</p>

          {/* Address Display */}
          <div className="w-full bg-gray-50 rounded-xl p-4 mb-4">
            <p className="text-xs text-gray-500 mb-2 text-center">Your Stacks Wallet Address</p>
            <p className="text-sm text-center font-mono text-gray-800 break-all">
              {walletAddress || 'Loading...'}
            </p>
          </div>

          {/* Short Address Display */}
          <div className="text-center mb-4">
            <p className="text-gray-600 font-medium">
              {formatAddress(walletAddress || '')}
            </p>
          </div>
        </div>
      </div>

      {/* Fixed Button at bottom */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 p-3 bg-[#0461F0] rounded-xl text-white font-medium w-full hover:bg-[#0350D0] transition-colors"
        >
          {isCopied ? (
            <>
              <Check className="w-5 h-5" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" />
              Copy Address
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-500 mt-4">
          Share your address to receive STX, sBTC, or USDA tokens
        </p>
      </div>
    </div>
  );
};

export default ReceiveScreen;