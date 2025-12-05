import React from "react";
import { X, ArrowUpRight, ArrowDownRight, ExternalLink, Copy, Check } from "lucide-react";
import { type Transaction } from "@/services/transactionHistoryService";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  isOpen: boolean;
}

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
  isOpen
}) => {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  if (!isOpen || !transaction) return null;

  const isSent = transaction.type === 'sent';

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatTime = (timestamp: number) => {
    try {
      const date = new Date(timestamp * 1000);
      return {
        relative: formatDistanceToNow(date, { addSuffix: true }),
        absolute: date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };
    } catch (e) {
      return { relative: "unknown date", absolute: "unknown date" };
    }
  };

  const formatAmount = (amount: string) => {
    if (!amount || amount === "0") return "0";
    if (!amount.includes('.')) return amount;
    const [whole, decimal] = amount.split('.');
    if (decimal.length <= 4) return amount;
    return `${whole}.${decimal.substring(0, 4)}`;
  };

  const shortenAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.substring(0, 10)}...${addr.substring(addr.length - 8)}`;
  };

  const time = formatTime(transaction.timestamp);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[430px] rounded-t-3xl shadow-xl animate-slide-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-lg font-semibold">Transaction Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Badge and Icon */}
          <div className="flex flex-col items-center space-y-4">
            <div
              className={`flex items-center justify-center h-16 w-16 rounded-full ${
                isSent ? "bg-rose-100" : "bg-emerald-100"
              }`}
            >
              {isSent ? (
                <ArrowUpRight className={`h-8 w-8 text-rose-500`} />
              ) : (
                <ArrowDownRight className={`h-8 w-8 text-emerald-500`} />
              )}
            </div>

            <div className="text-center">
              <div
                className={`text-3xl font-bold ${
                  isSent ? "text-rose-500" : "text-emerald-500"
                }`}
              >
                {isSent ? "-" : "+"}{formatAmount(transaction.amount)} {transaction.currency}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {isSent ? "Sent" : "Received"}
              </div>
            </div>

            {/* Status Badge */}
            {transaction.status === "success" ? (
              <span className="px-4 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Completed
              </span>
            ) : transaction.status === "pending" ? (
              <span className="px-4 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                Pending
              </span>
            ) : (
              <span className="px-4 py-1.5 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                Failed
              </span>
            )}
          </div>

          {/* Transaction Details */}
          <div className="space-y-4 bg-gray-50 rounded-xl p-4">
            {/* From */}
            {transaction.sender && (
              <div>
                <div className="text-xs text-gray-500 mb-1">From</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono text-gray-800">
                    {shortenAddress(transaction.sender)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(transaction.sender!, 'sender')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {copiedField === 'sender' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* To */}
            {transaction.recipient && (
              <div>
                <div className="text-xs text-gray-500 mb-1">To</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono text-gray-800">
                    {shortenAddress(transaction.recipient)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(transaction.recipient!, 'recipient')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {copiedField === 'recipient' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Time */}
            <div>
              <div className="text-xs text-gray-500 mb-1">Time</div>
              <div className="text-sm text-gray-800">
                {time.absolute}
                <div className="text-xs text-gray-500 mt-0.5">{time.relative}</div>
              </div>
            </div>

            {/* Block Height */}
            {transaction.blockHeight && (
              <div>
                <div className="text-xs text-gray-500 mb-1">Block Height</div>
                <div className="text-sm text-gray-800">#{transaction.blockHeight.toLocaleString()}</div>
              </div>
            )}

            {/* Fee */}
            {transaction.fee && (
              <div>
                <div className="text-xs text-gray-500 mb-1">Network Fee</div>
                <div className="text-sm text-gray-800">{transaction.fee} STX</div>
              </div>
            )}

            {/* Transaction ID */}
            <div>
              <div className="text-xs text-gray-500 mb-1">Transaction ID</div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono text-gray-800 truncate mr-2">
                  {transaction.txid.substring(0, 16)}...
                </span>
                <button
                  onClick={() => copyToClipboard(transaction.txid, 'txid')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {copiedField === 'txid' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                copyToClipboard(transaction.txid, 'txid');
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy TX ID
            </Button>
            <Button
              className="flex-1"
              onClick={() => window.open(transaction.explorerUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Explorer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailModal;
