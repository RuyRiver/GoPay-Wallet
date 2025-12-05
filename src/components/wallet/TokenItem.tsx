import React, { useState } from "react";
import { ArrowRightLeft, ChevronRight } from "lucide-react";

// Token colors matching the Android app design
const TOKEN_COLORS: Record<string, string> = {
  'STX': '#5546FF',   // Purple
  'sBTC': '#F7931A',  // Orange
  'USDA': '#2775CA',  // Blue
};

// Token logos - using real URLs
const TOKEN_LOGOS: Record<string, string> = {
  'STX': 'https://cryptologos.cc/logos/stacks-stx-logo.png?v=040',
  'sBTC': 'https://cryptologos.cc/logos/bitcoin-btc-logo.png?v=040',
  'USDA': 'https://app.arkadiko.finance/assets/tokens/usda.svg',
};

// Token Icon Component - tries to load logo, falls back to colored circle
const TokenIcon: React.FC<{ symbol: string; size?: number }> = ({ symbol, size = 48 }) => {
  const [imageError, setImageError] = useState(false);
  const color = TOKEN_COLORS[symbol] || '#999999';
  const logoUrl = TOKEN_LOGOS[symbol];

  // If no logo URL or image failed to load, show colored circle with symbol
  if (!logoUrl || imageError) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        }}
        className="flex items-center justify-center"
      >
        <span
          style={{ fontSize: size * 0.35 }}
          className="text-white font-bold"
        >
          {symbol}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      }}
      className="flex items-center justify-center overflow-hidden"
    >
      <img
        src={logoUrl}
        alt={symbol}
        style={{ width: size * 0.7, height: size * 0.7 }}
        className="object-contain"
        onError={() => setImageError(true)}
      />
    </div>
  );
};

interface TokenItemProps {
  icon: string;
  name: string;
  price: string;
  priceChange: string;
  amount: string;
  symbol: string;
  value: string;
  isPositive?: boolean;
  onSend?: () => void;
  onDeposit?: () => void;
  onSwap?: () => void;
  onChat?: () => void;
}

const TokenItem: React.FC<TokenItemProps> = ({
  name,
  amount,
  symbol,
  value,
  onSend,
  onDeposit,
  onSwap,
}) => {
  // Check if balance is 0 or very small - show deposit instead of send
  const numericAmount = parseFloat(amount) || 0;
  const showDeposit = numericAmount < 0.001;

  return (
    <div className="w-full bg-white rounded-xl p-3 shadow-[0_0_20px_rgba(0,0,0,0.08)]">
      {/* Main Content */}
      <div className="flex flex-col gap-1">
        {/* Top Row: Token Info and Balance */}
        <div className="flex items-center justify-between">
          {/* Left: Icon and Name */}
          <div className="flex items-center gap-3">
            <TokenIcon symbol={symbol} size={48} />
            <div className="flex flex-col">
              <span className="text-[#1b1b1b] font-bold text-sm">{name}</span>
              <span className="text-[#1b1b1b] text-[11px]">{symbol}</span>
            </div>
          </div>

          {/* Right: Balance */}
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[#1b1b1b] font-bold text-sm">{value}</span>
            <span className="text-[#1b1b1b]/50 text-xs font-medium">
              {amount} {symbol}
            </span>
          </div>
        </div>

        {/* Bottom Row: Action Buttons */}
        <div className="flex items-center gap-2 mt-1">
          {showDeposit && onDeposit ? (
            <button
              onClick={onDeposit}
              className="flex items-center gap-0.5 py-1 pl-3 pr-2 bg-[#0461F0]/10 rounded-full text-[#0461F0] text-xs font-bold hover:bg-[#0461F0]/20 transition-colors"
            >
              Deposit
              <ChevronRight className="w-3 h-3" />
            </button>
          ) : onSend && (
            <button
              onClick={onSend}
              className="flex items-center gap-0.5 py-1 pl-3 pr-2 bg-[#0461F0]/10 rounded-full text-[#0461F0] text-xs font-bold hover:bg-[#0461F0]/20 transition-colors"
            >
              Send
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
          {onSwap && !showDeposit && (
            <button
              onClick={onSwap}
              className="flex items-center gap-0.5 py-1 pl-3 pr-2 bg-gray-100 rounded-full text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors"
            >
              Swap
              <ArrowRightLeft className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TokenItem;
