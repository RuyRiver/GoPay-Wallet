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
  return <div className="flex flex-col w-full self-stretch text-center relative pb-4">
      <div className="absolute inset-0 overflow-hidden z-0 flex items-center justify-center">
        <img 
          src="/assets/gg_shape_01_1.webp" 
          className="max-w-full max-h-[450px] object-contain" 
          alt="Background" 
        />
      </div>
      <div className="relative z-10 self-stretch flex w-full items-center text-2xl text-black font-bold whitespace-nowrap justify-between px-5 py-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className="p-0 h-8 w-8" 
          aria-label="Account Settings"
          onClick={onSettingsClick}
        >
          <Settings className="w-5 h-5 stroke-[1.5px]" />
        </Button>
        <div className="self-stretch my-auto">{username}</div>
        <Button variant="ghost" size="icon" className="p-0 h-8 w-8" aria-label="Scan">
          <ScanSearch className="w-5 h-5 stroke-[1.5px]" />
        </Button>
      </div>
      <div className="relative z-10 py-12 self-stretch flex flex-col justify-center items-center text-white tracking-[0.2px]">
        <div className="text-sm font-medium">Total Balance</div>
        <div className="text-3xl font-bold whitespace-nowrap mt-1">
          {balance}
        </div>
      </div>
    </div>;
};

export default Header;