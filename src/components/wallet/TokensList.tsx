import React from "react";
import TokenItem from "./TokenItem";

interface Token {
  id: string;
  icon: string;
  name: string;
  price: string;
  priceChange: string;
  amount: string;
  symbol: string;
  value: string;
  isPositive?: boolean;
}

interface TokensListProps {
  tokens: Token[];
  onTokenSend?: (token: Token) => void;
  onTokenDeposit?: (token: Token) => void;
  onTokenSwap?: (token: Token) => void;
  onTokenChat?: (token: Token) => void;
}

const TokensList: React.FC<TokensListProps> = ({
  tokens,
  onTokenSend,
  onTokenDeposit,
  onTokenSwap,
  onTokenChat
}) => {
  return (
    <div className="flex flex-col w-full flex-1 overflow-y-auto px-1 py-2 space-y-2">
      {tokens.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-gray-400">
          <span className="text-sm">No tokens found</span>
        </div>
      ) : (
        tokens.map((token) => (
          <TokenItem
            key={token.id}
            icon={token.icon}
            name={token.name}
            price={token.price}
            priceChange={token.priceChange}
            amount={token.amount}
            symbol={token.symbol}
            value={token.value}
            isPositive={token.isPositive}
            onSend={onTokenSend ? () => onTokenSend(token) : undefined}
            onDeposit={onTokenDeposit ? () => onTokenDeposit(token) : undefined}
            onSwap={onTokenSwap ? () => onTokenSwap(token) : undefined}
            onChat={onTokenChat ? () => onTokenChat(token) : undefined}
          />
        ))
      )}
    </div>
  );
};

export default TokensList;
