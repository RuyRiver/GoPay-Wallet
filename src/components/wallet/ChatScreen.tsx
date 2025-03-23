import React, { useState, useEffect } from "react";
import { ChevronLeft, ThumbsUp, ThumbsDown, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import moveAgentService from "@/services/moveAgentService";
import { useWeb3Auth } from "@/context/Web3AuthContext";
import { createDefaultAgentLimits } from "@/utils/supabase";
import { createClient } from '@supabase/supabase-js';
import ChatInput from "./ChatInput";

interface ChatScreenProps {
  onClose: () => void;
  walletAddress?: string;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  transactionHash?: string;
}

interface SuggestionProps {
  title: string;
  description: string;
  onClick?: () => void;
}

const ChatSuggestion: React.FC<SuggestionProps> = ({ title, description, onClick }) => (
  <div 
    className="p-6 border border-gray-200 rounded-3xl mb-4 cursor-pointer hover:bg-gray-50 transition-colors"
    onClick={onClick}
  >
    <h3 className="text-center font-bold text-lg mb-1">{title}</h3>
    <p className="text-center text-gray-400 text-base">{description}</p>
  </div>
);

const UserMessage: React.FC<{ content: string }> = ({ content }) => {
  const { userInfo } = useWeb3Auth();
  // Determinar si el contenido puede contener una transacción a partir del texto
  const mayContainTransaction = content.toLowerCase().includes('transfer') || 
                               content.toLowerCase().includes('send') || 
                               content.toLowerCase().includes('payment');
                               
  return (
    <div className="flex justify-end gap-3 p-4">
      <div className="max-w-[80%] bg-[#1E1E1E] text-white p-4 rounded-2xl rounded-tr-none">
        <p className="whitespace-pre-wrap break-words text-sm">{content}</p>
      </div>
      <Avatar className="h-10 w-10 bg-gray-300 self-start">
        {userInfo?.profileImage ? (
          <img src={userInfo.profileImage} alt="User" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
            {userInfo?.name?.charAt(0) || 'U'}
          </div>
        )}
      </Avatar>
    </div>
  );
}

// Extraer hash de transacción del mensaje si existe
const extractTransactionHash = (content: string): string | undefined => {
  // Buscar patrón que parece un hash de transacción (0x seguido de hex)
  const matches = content.match(/0x[a-fA-F0-9]{64}/);
  return matches ? matches[0] : undefined;
};

const BotMessage: React.FC<{ content: string }> = ({ content }) => {
  // Determinar si es una notificación de transacción
  const isTransactionNotification = content.includes("¡Transferencia exitosa!") || 
                                   content.includes("Hash de la transacción");
  
  // Extraer hash de transacción si existe
  const transactionHash = extractTransactionHash(content);
  
  return (
    <div className="flex gap-3 p-4">
      <Avatar className="h-10 w-10 self-start">
        <img 
          src="/lovable-uploads/3992c85c-5a2a-4d3f-8961-b8b8f7f07838.png" 
          alt="Bot" 
          className="h-10 w-10 rounded-full"
        />
      </Avatar>
      <div className={`max-w-[80%] p-4 rounded-2xl rounded-tl-none ${isTransactionNotification ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-[#EEEEEE] text-gray-800'}`}>
        <div className="whitespace-pre-wrap break-words text-sm">{content}</div>
        
        {transactionHash && (
          <div className="mt-2 text-xs overflow-hidden text-ellipsis">
            <a 
              href={`https://explorer.aptoslabs.com/txn/${transactionHash}?network=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Ver en explorador
            </a>
          </div>
        )}
        
        <div className="flex gap-2 mt-2 justify-end">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <ThumbsUp className="h-5 w-5 text-gray-500" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <ThumbsDown className="h-5 w-5 text-gray-500" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full ml-4">
            <Copy className="h-5 w-5 text-gray-500" />
            <span className="sr-only">Copy to clipboard</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

const ChatScreen: React.FC<ChatScreenProps> = ({ onClose, walletAddress }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatStarted, setChatStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);
  const [hasAgentLimits, setHasAgentLimits] = useState(false);
  const { getPrivateKey } = useWeb3Auth();

  // Verificar estado del servicio y comprobar si el usuario necesita ver la pantalla de bienvenida
  useEffect(() => {
    const initChat = async () => {
      try {
        // Verificar estado del servicio
        const status = await moveAgentService.checkStatus();
        setServiceStatus(status.status === 'ok' ? 'online' : 'offline');
        
        // Si hay una dirección de wallet, verificar si existen límites de agente
        if (walletAddress) {
          // Verificar si existen límites de agente para este usuario
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          const { data: existingLimits, error } = await supabase
            .from('agent_limits')
            .select('*')
            .eq('user_address', walletAddress)
            .single();
          
          if (existingLimits) {
            // El usuario ya tiene límites configurados, mostrar chat directamente
            setHasAgentLimits(true);
            setShowWelcomeScreen(false);
            console.log('Usuario ya tiene límites configurados');
          } else {
            // El usuario no tiene límites configurados, mostrar pantalla de bienvenida
            setHasAgentLimits(false);
            setShowWelcomeScreen(true);
            console.log('Usuario no tiene límites configurados, mostrando bienvenida');
          }
        }
      } catch (error) {
        console.error('Error al inicializar el chat:', error);
        setServiceStatus('offline');
      }
    };

    initChat();
  }, [walletAddress]);

  // Función para crear los límites del agente y continuar al chat
  const handleContinue = async () => {
    if (walletAddress) {
      try {
        setIsLoading(true);
        await createDefaultAgentLimits(walletAddress);
        setHasAgentLimits(true);
        setShowWelcomeScreen(false);
        console.log('Límites creados exitosamente al hacer clic en continuar');
      } catch (error) {
        console.error('Error al crear límites de agente:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;
    
    // Verificar si el servicio está disponible
    if (serviceStatus === 'offline') {
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "Lo siento, el servicio de Move Agent no está disponible en este momento. Por favor, inténtalo más tarde.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }
    
    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setChatStarted(true);
    setIsLoading(true);
    
    try {
      // Obtener la clave privada y dividirla
      let clientHalf = '';
      if (walletAddress) {
        const privateKey = await getPrivateKey();
        if (privateKey && privateKey.length >= 2) {
          const halfLength = Math.floor(privateKey.length / 2);
          clientHalf = privateKey.substring(halfLength); // Solo usamos la segunda mitad
        }
      }
      
      // Llamar al servicio de Move Agent con la mitad de la clave
      const response = await moveAgentService.processMessage(
        userMessage.content, 
        walletAddress,
        clientHalf // Enviar la mitad de la clave del cliente
      );
      
      // Agregar respuesta del bot
      const botMessage: Message = {
        id: (Date.now() + 100).toString(),
        content: response.success && response.data?.response.content 
          ? response.data.response.content 
          : response.message || "No pude procesar tu solicitud.",
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error en el flujo de chat:', error);
      
      // Agregar mensaje de error
      const errorMessage: Message = {
        id: (Date.now() + 100).toString(),
        content: "Lo siento, encontré un error al procesar tu solicitud.",
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center border-b border-gray-200">
        <button onClick={onClose} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7"></path>
          </svg>
        </button>
        <h2 className="text-lg font-semibold mx-auto">Move AI Wallet</h2>
        <div className="w-8">
          {serviceStatus === 'checking' && (
            <div className="h-3 w-3 rounded-full bg-yellow-500 mx-auto animate-pulse" title="Verificando estado del servicio" />
          )}
          {serviceStatus === 'online' && (
            <div className="h-3 w-3 rounded-full bg-green-500 mx-auto" title="Servicio en línea" />
          )}
          {serviceStatus === 'offline' && (
            <div className="h-3 w-3 rounded-full bg-red-500 mx-auto" title="Servicio fuera de línea" />
          )}
        </div>
      </div>

      {/* Contenido del chat */}
      <div className="flex-1 overflow-hidden">
        {showWelcomeScreen ? (
          // Pantalla de bienvenida
          <div className="h-full flex flex-col items-center justify-center p-6">
            <img 
              src="/lovable-uploads/3992c85c-5a2a-4d3f-8961-b8b8f7f07838.png" 
              alt="Move Agent" 
              className="w-24 h-24 mb-6" 
            />
            <h3 className="text-xl font-bold mb-4 text-center">¡Hola! Soy tu asistente financiero</h3>
            <p className="text-gray-500 mb-8 text-center">
              Puedo ayudarte a gestionar tus finanzas, realizar transacciones y responder tus preguntas sobre criptomonedas.
            </p>
            <Button 
              className="w-full max-w-xs" 
              onClick={handleContinue}
              disabled={isLoading}
            >
              {isLoading ? "Configurando..." : "Empezar a Chatear"}
            </Button>
          </div>
        ) : serviceStatus === 'offline' ? (
          // Mensaje de servicio fuera de línea
          <div className="h-full flex flex-col items-center justify-center p-6">
            <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-4">
              <p className="text-center">
                Lo sentimos, el servicio de Move Agent no está disponible en este momento. Por favor, inténtalo más tarde.
              </p>
            </div>
          </div>
        ) : !chatStarted ? (
          // Sugerencias iniciales
          <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 p-6">
              <h3 className="text-lg font-semibold mb-6">¿En qué puedo ayudarte hoy?</h3>
              <ChatSuggestion 
                title="Ver balance" 
                description="Consulta el saldo de tu cuenta"
                onClick={() => handleSuggestionClick("Muéstrame el balance de mi cuenta")}
              />
              <ChatSuggestion 
                title="Enviar dinero" 
                description="Transfiere fondos a otra cuenta"
                onClick={() => handleSuggestionClick("Quiero enviar dinero a un amigo")}
              />
              <ChatSuggestion 
                title="Información" 
                description="Aprende sobre criptomonedas"
                onClick={() => handleSuggestionClick("Explícame qué es Aptos")}
              />
            </ScrollArea>
          </div>
        ) : (
          // Mensajes de chat
          <ScrollArea className="h-full p-0 overflow-y-auto">
            <div className="flex flex-col">
              {messages.map((message) => (
                <div key={message.id}>
                  {message.sender === 'user' ? (
                    <UserMessage content={message.content} />
                  ) : (
                    <BotMessage content={message.content} />
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 p-4">
                  <Avatar className="h-10 w-10">
                    <img 
                      src="/lovable-uploads/3992c85c-5a2a-4d3f-8961-b8b8f7f07838.png" 
                      alt="Bot" 
                      className="h-10 w-10 rounded-full"
                    />
                  </Avatar>
                  <div className="flex items-center space-x-2 p-4 bg-[#EEEEEE] rounded-2xl rounded-tl-none max-w-[80%]">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-75"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-150"></div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Input de chat */}
      {(!showWelcomeScreen && serviceStatus !== 'offline') && (
        <ChatInput 
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default ChatScreen;
