import React from "react";
import { Settings, ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  username: string;
  balance: string;
  onSettingsClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  username,
  balance,
  onSettingsClick
}) => {
  return <div className="flex flex-col relative w-full max-w-[312px] text-center pb-[149px] mx-auto">
      <img src="https://cdn.builder.io/api/v1/image/assets/20e65f047558427aa511c5569cf902c1/f9927576fb062199e2c461e3868414cd8527b166?placeholderIfAbsent=true" className="absolute h-full w-full object-cover inset-0" alt="Background" />
      <div className="relative self-stretch flex w-full items-center text-2xl text-black font-bold whitespace-nowrap justify-between px-5 py-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className="p-0 h-auto w-auto" 
          aria-label="Account Settings"
          onClick={onSettingsClick}
        >
          <Settings className="w-5 h-5 stroke-[1.5px]" />
        </Button>
        <div className="self-stretch my-auto">{username}</div>
        <Button variant="ghost" size="icon" className="p-0 h-auto w-auto" aria-label="Scan">
          <ScanSearch className="w-5 h-5 stroke-[1.5px]" />
        </Button>
      </div>
      <div className="relative self-center flex mb-[-30px] flex-col items-center text-white tracking-[0.2px] mt-[78px]">
        <div className="text-sm font-medium">Total Balance</div>
        <div className="text-[32px] font-bold whitespace-nowrap mt-2">
          {balance}
        </div>
      </div>
    </div>;
};

export default Header;