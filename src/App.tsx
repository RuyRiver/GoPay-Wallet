import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Index from "./pages/Index";
import WalletPage from "./pages/WalletPage";
import SendPage from "./pages/SendPage";
import DemoPage from "./pages/DemoPage";
import NotFound from "./pages/NotFound";
import { GoogleAuthProvider } from "./context/GoogleAuthContext";
import MobileLayout from "./components/MobileLayout";

const queryClient = new QueryClient();

// Google OAuth Client ID from environment
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID || '';

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <GoogleAuthProvider>
        <BrowserRouter>
          <TooltipProvider>
            <MobileLayout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="wallet" element={<WalletPage />} />
                <Route path="send" element={<SendPage />} />
                <Route path="demo" element={<DemoPage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
              <Sonner />
            </MobileLayout>
          </TooltipProvider>
        </BrowserRouter>
      </GoogleAuthProvider>
    </GoogleOAuthProvider>
  </QueryClientProvider>
);

export default App;
