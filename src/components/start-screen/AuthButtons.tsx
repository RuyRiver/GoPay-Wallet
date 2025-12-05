import * as React from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

interface AuthButtonsProps {
  className?: string;
}

export function AuthButtons({ className }: AuthButtonsProps) {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    // Navigate to wallet page after successful login
    navigate("/wallet");
  };

  return (
    <div className={cn("w-full text-base font-bold text-center", className)}>
      <GoogleSignInButton onSuccess={handleLoginSuccess} />
      <p className="mt-4 text-sm font-normal text-gray-500">
        Sign in with Google to access your Stacks wallet
      </p>
    </div>
  );
}
