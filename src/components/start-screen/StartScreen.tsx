
import * as React from "react";
import { Logo } from "./Logo";
import { AuthButtons } from "./AuthButtons";
import { SocialLogin } from "./SocialLogin";
import { Divider } from "@/components/ui/divider";

export function StartScreen() {
  return (
    <section className="bg-white flex max-w-[480px] w-full h-full flex-col overflow-hidden items-stretch justify-center mx-auto px-7">
      <div className="flex flex-col items-stretch">
        <Logo
          src="https://cdn.builder.io/api/v1/image/assets/20e65f047558427aa511c5569cf902c1/0ef61f3bc34107a4c5608a5e22cf30369cab5cdb?placeholderIfAbsent=true"
          alt="GoPay Logo"
        />

        <header className="flex w-full flex-col text-center mt-8">
          <h1 className="text-[rgba(32,34,38,1)] text-2xl font-bold leading-none">
            Welcome to GoPay
          </h1>
          <p className="text-[rgba(131,131,131,1)] text-sm font-normal leading-6 mt-1">
            Start your decentralised finances experience!
          </p>
        </header>

        <div className="w-full text-base font-bold mt-8">
          <AuthButtons />

          <Divider
            text="Or"
            className="text-[#838383] font-normal whitespace-nowrap mt-10"
          />

          <SocialLogin className="mt-10" />
        </div>
      </div>
    </section>
  );
}

export default StartScreen;
