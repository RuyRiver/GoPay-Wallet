import React, { useState } from "react";
interface TabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}
const Tabs: React.FC<TabsProps> = ({
  activeTab,
  onTabChange
}) => {
  return <div className="relative self-stretch bg-[rgba(243,245,246,1)] flex items-center gap-[17px] text-sm font-semibold whitespace-nowrap text-center justify-center p-1 rounded-2xl px-[4px]">
      <button className={`self-stretch min-h-12 gap-2.5 w-[175px] my-auto px-2.5 py-4 rounded-2xl ${activeTab === "tokens" ? "bg-[rgba(39,39,41,1)] text-[rgba(227,223,223,1)]" : "text-[rgba(39,39,41,1)]"}`} onClick={() => onTabChange("tokens")}>
        Tokens
      </button>
      <button className={`self-stretch min-h-12 gap-2.5 w-[175px] my-auto px-2.5 py-4 rounded-2xl ${activeTab === "history" ? "bg-[rgba(39,39,41,1)] text-[rgba(227,223,223,1)]" : "text-[rgba(39,39,41,1)]"}`} onClick={() => onTabChange("history")}>
        History
      </button>
    </div>;
};
export default Tabs;