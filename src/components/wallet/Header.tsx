import React from "react";

interface HeaderProps {
  username: string;
  balance: string;
}

const Header: React.FC<HeaderProps> = ({ username, balance }) => {
  return (
    <div className="flex flex-col self-center relative aspect-[0.975] w-full max-w-[312px] text-center pb-[149px]">
      <img
        src="https://cdn.builder.io/api/v1/image/assets/20e65f047558427aa511c5569cf902c1/f9927576fb062199e2c461e3868414cd8527b166?placeholderIfAbsent=true"
        className="absolute h-full w-full object-cover inset-0"
        alt="Background"
      />
      <div className="relative flex mr-[-58px] w-full items-center gap-[40px_99px] text-2xl text-black font-bold whitespace-nowrap justify-between px-7">
        <div
          className="self-stretch flex w-6 shrink-0 h-6 my-auto"
          aria-label="Filter"
        />
        <div className="self-stretch my-auto">{username}</div>
        <img
          src="https://cdn.builder.io/api/v1/image/assets/20e65f047558427aa511c5569cf902c1/46c3929bbc69e7d9fc3be401e53909958a06af18?placeholderIfAbsent=true"
          className="aspect-[1] object-contain w-6 self-stretch shrink-0 my-auto"
          alt="Profile"
        />
      </div>
      <div className="relative self-center flex mb-[-30px] flex-col items-center text-white tracking-[0.2px] mt-[78px]">
        <div className="text-sm font-medium">Total Balance</div>
        <div className="text-[32px] font-bold whitespace-nowrap mt-2">
          {balance}
        </div>
      </div>
    </div>
  );
};

export default Header;
