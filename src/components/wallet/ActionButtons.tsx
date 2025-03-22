import React from "react";
import ActionButton from "./ActionButton";

interface ActionButtonsProps {
  onSend?: () => void;
  onReceive?: () => void;
  onDeposit?: () => void;
  onSwap?: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onSend,
  onReceive,
  onDeposit,
  onSwap,
}) => {
  return (
    <div className="flex gap-[34px] mt-8">
      <ActionButton
        icon="https://cdn.builder.io/api/v1/image/assets/20e65f047558427aa511c5569cf902c1/385e4d382b635f90a186d9dcbc99c4e972a9dbcc?placeholderIfAbsent=true"
        label="Send"
        onClick={onSend}
      />
      <ActionButton
        icon="https://cdn.builder.io/api/v1/image/assets/20e65f047558427aa511c5569cf902c1/583bfdb9e9b7d6bfa262d869574a749ecc66e6ee?placeholderIfAbsent=true"
        label="Receive"
        onClick={onReceive}
      />
      <ActionButton
        icon="https://cdn.builder.io/api/v1/image/assets/20e65f047558427aa511c5569cf902c1/583bfdb9e9b7d6bfa262d869574a749ecc66e6ee?placeholderIfAbsent=true"
        label="Deposit"
        onClick={onDeposit}
      />
      <ActionButton
        icon="https://cdn.builder.io/api/v1/image/assets/20e65f047558427aa511c5569cf902c1/61a1e28565e84e5016c0eaf45ece7716c9d505b3?placeholderIfAbsent=true"
        label="Swap"
        onClick={onSwap}
      />
    </div>
  );
};

export default ActionButtons;
