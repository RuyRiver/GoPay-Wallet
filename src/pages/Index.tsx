import { StartScreen } from "@/components/start-screen/StartScreen";
import { useGoogleAuth } from "@/context/GoogleAuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { isLoggedIn, isInitialized } = useGoogleAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isInitialized && isLoggedIn) {
      navigate("/wallet");
    }
  }, [isLoggedIn, isInitialized, navigate]);

  return (
    <StartScreen />
  );
};

export default Index;
