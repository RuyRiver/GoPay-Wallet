import * as React from "react";
import { cn } from "@/lib/utils";

interface SocialButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  iconAlt?: string;
}

const SocialButton = React.forwardRef<HTMLButtonElement, SocialButtonProps>(
  ({ className, icon, iconAlt = "icon", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "justify-center items-center border border-[#EDEDED] flex min-h-12 w-full gap-2 px-5 py-3 rounded-xl border-solid transition-colors hover:bg-gray-50",
          className,
        )}
        {...props}
      >
        <img
          src={icon}
          alt={iconAlt}
          className="aspect-[1] object-contain w-6 self-stretch shrink-0 my-auto"
        />
        <span className="self-stretch my-auto">{children}</span>
      </button>
    );
  },
);

SocialButton.displayName = "SocialButton";

interface SocialLoginProps {
  className?: string;
}

export function SocialLogin({ className }: SocialLoginProps) {
  return (
    <div className={cn("w-full text-[#1E1E1E] text-center", className)}>
      <SocialButton
        icon="https://cdn.builder.io/api/v1/image/assets/20e65f047558427aa511c5569cf902c1/26f237a5d98957bf23644bdde3e7fcc237dc199d?placeholderIfAbsent=true"
        iconAlt="Google logo"
      >
        Continue with Google
      </SocialButton>
      <SocialButton
        icon="https://cdn.builder.io/api/v1/image/assets/20e65f047558427aa511c5569cf902c1/fe21fb5edecbe36e43c8c767231312459a09abca?placeholderIfAbsent=true"
        iconAlt="Facebook logo"
        className="mt-5"
      >
        Continue with Facebook
      </SocialButton>
    </div>
  );
}
