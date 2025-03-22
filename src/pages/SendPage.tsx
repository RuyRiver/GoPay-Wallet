import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import SendScreen from "@/components/wallet/SendScreen";
import { useWeb3Auth } from "@/context/Web3AuthContext";

const SendPage: React.FC = () => {
  const { isLoggedIn, isInitialized, isLoading } = useWeb3Auth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [addressParam, setAddressParam] = useState<string | null>(null);

  useEffect(() => {
    // Obtener la dirección de los parámetros de la URL si existe
    const address = searchParams.get("address");
    if (address) {
      setAddressParam(address);
    }
  }, [searchParams]);

  useEffect(() => {
    // Si no está logueado, redirigir a la página de inicio
    if (isInitialized && !isLoggedIn && !isLoading) {
      navigate("/");
    }
  }, [isLoggedIn, isInitialized, isLoading, navigate]);

  // Mostrar spinner mientras verifica inicio de sesión
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // No renderizar nada si no está logueado (redirigirá en el useEffect)
  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-[rgba(243,245,246,1)] flex max-w-[480px] w-full flex-col overflow-hidden items-stretch mx-auto h-full">
        <SendScreen 
          onClose={() => navigate("/wallet")} 
          initialAddress={addressParam}
        />
      </div>
    </div>
  );
};

export default SendPage; 