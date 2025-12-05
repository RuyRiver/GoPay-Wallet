import React from "react";
import { Send, ArrowDownToLine } from "lucide-react";

interface ActionButtonsProps {
  onSend?: () => void;
  onReceive?: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onSend,
  onReceive,
}) => {
  return (
    <div className="flex gap-3 my-4 justify-end w-full pr-2">
      {/* Send Button - matches Android style */}
      <button
        onClick={onSend}
        className="flex items-center gap-2 py-2.5 px-4 bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow"
      >
        <Send className="w-5 h-5 text-[#0461F0]" />
        <span className="text-[#0461F0] font-bold text-sm">Send</span>
      </button>

      {/* Receive Button - matches Android style */}
      <button
        onClick={onReceive}
        className="flex items-center gap-2 py-2.5 px-4 bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow"
      >
        <ArrowDownToLine className="w-5 h-5 text-[#0461F0]" />
        <span className="text-[#0461F0] font-bold text-sm">Receive</span>
      </button>
    </div>
  );
};

export default ActionButtons;
