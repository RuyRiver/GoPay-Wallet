import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", fullWidth = true, children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "self-stretch shadow-[-2px_-7px_10px_rgba(241,241,241,1)] w-full gap-2.5 p-5 rounded-xl font-bold transition-colors",
          variant === "primary"
            ? "bg-black text-white hover:bg-gray-800"
            : "bg-white text-black hover:bg-gray-100",
          fullWidth ? "w-full" : "",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

interface AuthButtonsProps {
  className?: string;
}

export function AuthButtons({ className }: AuthButtonsProps) {
  return (
    <div className={cn("w-full text-base font-bold text-center", className)}>
      <Button variant="primary">Sign Up</Button>
      <Button variant="secondary" className="mt-5">
        Log In
      </Button>
    </div>
  );
}

export { Button };
