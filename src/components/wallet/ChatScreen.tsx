import React, { useState, useEffect } from "react";
import { ChevronLeft, ThumbsUp, ThumbsDown, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import moveAgentService from "@/services/moveAgentService";
import { useWeb3Auth } from "@/context/Web3AuthContext";
import { createDefaultAgentLimits } from "@/utils/supabase";
import { createClient } from '@supabase/supabase-js';

interface ChatScreenProps {
  onClose: () => void;
  walletAddress?: string;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
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

const UserMessage: React.FC<{ content: string }> = ({ content }) => (
  <div className="flex gap-3 p-4 bg-[#1E1E1E] text-white">
    <Avatar className="h-10 w-10 bg-gray-300">
      <div className="h-10 w-10 rounded-full bg-gray-300"></div>
    </Avatar>
    <div className="flex-1">
      <p className="text-white">{content}</p>
    </div>
  </div>
);

const BotMessage: React.FC<{ content: string }> = ({ content }) => (
  <div className="flex gap-3 p-4 bg-[#EEEEEE]">
    <Avatar className="h-10 w-10">
      <img 
        src="/lovable-uploads/3992c85c-5a2a-4d3f-8961-b8b8f7f07838.png" 
        alt="Bot" 
        className="h-10 w-10"
      />
    </Avatar>
    <div className="flex-1">
      <p className="text-gray-800">{content}</p>
    </div>
    <div className="flex gap-2 mt-2">
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
);

const ChatScreen: React.FC<ChatScreenProps> = ({ onClose, walletAddress }) => {
  const [inputValue, setInputValue] = useState("");
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

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
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
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
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
    setInputValue(suggestion);
    
    setTimeout(() => {
      // Enviar el mensaje automáticamente
      handleSendMessage();
    }, 100);
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

      {/* Content with scroll */}
      <div className="flex-1 overflow-y-auto">
        {/* Pantalla de bienvenida - Solo se muestra la primera vez que el usuario accede al chat */}
        {showWelcomeScreen && (
          <div className="p-5 flex flex-col items-center">
            <div className="flex justify-center mt-4 mb-6">
              <img 
                src="/lovable-uploads/3992c85c-5a2a-4d3f-8961-b8b8f7f07838.png" 
                alt="Wallet Bot" 
                className="w-28 h-28"
              />
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6 w-full">
              <h3 className="font-bold text-blue-700 text-xl mb-3 text-center">¡Bienvenido a Move AI Wallet!</h3>
              <p className="text-gray-700 mb-3">
                Este asistente puede ayudarte a gestionar tus tokens mediante instrucciones en lenguaje natural, 
                permitiéndote realizar transacciones y consultas de forma sencilla.
              </p>
              <p className="text-gray-700 mb-3">
                Por tu seguridad, el agente operará con los siguientes límites predeterminados:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 mb-4 ml-2 space-y-1">
                <li>Máximo por transacción: <span className="font-medium">100 tokens</span></li>
                <li>Límite diario: <span className="font-medium">1000 tokens</span></li>
                <li>Transacciones por día: <span className="font-medium">5 transacciones</span></li>
                <li>Límite mensual: <span className="font-medium">10000 tokens</span></li>
              </ul>
              <p className="text-sm text-gray-500 mb-5">
                Estos límites están diseñados para proteger tus activos. Puedes personalizarlos más adelante 
                en la sección de Configuración.
              </p>
              
              <div className="flex justify-center mt-2">
                <Button 
                  onClick={handleContinue}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="h-5 w-5 rounded-full border-2 border-t-transparent border-white animate-spin mr-2" />
                      Configurando...
                    </>
                  ) : (
                    'Continuar'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Vista de chat normal - Se muestra después de la bienvenida o si el usuario ya tiene límites */}
        {!showWelcomeScreen && (
          <>
            {!chatStarted ? (
              <div className="p-5 flex flex-col">
                {/* Bot avatar for welcome screen */}
                <div className="flex justify-center mt-4 mb-8">
                  <img 
                    src="/lovable-uploads/3992c85c-5a2a-4d3f-8961-b8b8f7f07838.png" 
                    alt="Wallet Bot" 
                    className="w-24 h-24"
                  />
                </div>
                
                {/* Suggestions */}
                <p className="text-gray-400 text-center mb-6">
                  Here are some examples of what I can do with Move AI technology:
                </p>
                
                <ChatSuggestion 
                  title="Send Money" 
                  description="Send 100 USDT to a friend" 
                  onClick={() => handleSuggestionClick("Please send 100 USDT to example@email.com")}
                />
                
                <ChatSuggestion 
                  title="Check Balance" 
                  description="View your current token balances" 
                  onClick={() => handleSuggestionClick("What is my current balance?")}
                />
                
                <ChatSuggestion 
                  title="Transfer to Address" 
                  description="Send APT to a specific address" 
                  onClick={() => handleSuggestionClick("Transfer 5 APT to 0x123456789abcdef")}
                />
              </div>
            ) : (
              <div className="flex flex-col">
                {messages.map((message) => (
                  message.sender === 'user' ? (
                    <UserMessage key={message.id} content={message.content} />
                  ) : (
                    <BotMessage key={message.id} content={message.content} />
                  )
                ))}
                {isLoading && (
                  <div className="flex justify-center p-4">
                    <div className="h-6 w-6 rounded-full border-2 border-t-transparent border-gray-300 animate-spin" />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Chat input - Solo se muestra si no estamos en la pantalla de bienvenida */}
      {!showWelcomeScreen && (
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-4 bg-gray-100 p-3 px-5 rounded-full">
            <img 
              src="/lovable-uploads/3992c85c-5a2a-4d3f-8961-b8b8f7f07838.png" 
              alt="Bot" 
              className="w-6 h-6"
            />
            <Input 
              placeholder="How can help you?" 
              className="border-none bg-transparent shadow-none focus-visible:ring-0 flex-1 p-0 h-auto text-base"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSendMessage();
                }
              }}
              disabled={isLoading || serviceStatus === 'offline'}
            />
            <Button
              variant="ghost"
              size="icon"
              className={`text-gray-400 p-2 rounded-full hover:bg-gray-200 ${
                (isLoading || !inputValue.trim() || serviceStatus === 'offline') ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim() || serviceStatus === 'offline'}
            >
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
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatScreen;
