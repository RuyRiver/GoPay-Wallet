/**
 * Información sobre la aplicación frontend para ayudar al agente a responder preguntas
 */

// Estructura de la aplicación y funcionalidades principales
export const appInfo = {
  name: "GoPayWallet",
  description: "Una billetera digital para gestionar tokens de Aptos/Move",
  
  // Páginas principales de la aplicación
  pages: {
    home: {
      path: "/",
      description: "Página inicial donde puedes iniciar sesión con Web3Auth"
    },
    wallet: {
      path: "/wallet",
      description: "Página principal de la billetera donde puedes ver tu saldo y tus tokens"
    },
    send: {
      path: "/send",
      description: "Página para enviar tokens a otras direcciones"
    }
  },
  
  // Funcionalidades principales
  features: [
    {
      name: "Login/Registro",
      description: "Los usuarios pueden iniciar sesión usando Web3Auth (correo electrónico, redes sociales, etc.)"
    },
    {
      name: "Ver saldo",
      description: "Puedes ver el saldo de tus tokens en la página de la billetera"
    },
    {
      name: "Enviar tokens",
      description: "Puedes enviar tokens a otras direcciones desde la página de envío"
    },
    {
      name: "Asistente IA",
      description: "Puedes conversar con un asistente de IA para realizar operaciones o resolver dudas"
    },
    {
      name: "Ver transacciones",
      description: "Puedes consultar el historial de tus transacciones"
    }
  ],
  
  // Guía rápida para nuevos usuarios
  quickGuide: {
    es: `
      1. Inicia sesión con tu correo electrónico o red social
      2. En la página de la billetera, verás tu saldo actual
      3. Para enviar tokens, haz clic en el botón "Enviar" o dile al asistente "Quiero enviar tokens"
      4. Para ver tu historial de transacciones, dile al asistente "Muéstrame mis transacciones"
    `,
    en: `
      1. Log in with your email or social network
      2. On the wallet page, you'll see your current balance
      3. To send tokens, click on the "Send" button or tell the assistant "I want to send tokens"
      4. To see your transaction history, tell the assistant "Show me my transactions"
    `
  }
};

// Precio actual de APT (hardcodeado)
export const APT_PRICE_USD = 6.34;

// Detectar idioma a partir del mensaje usando un enfoque mejorado
export const detectLanguage = (message: string): 'es' | 'en' => {
  // No hay mensaje o mensaje muy corto
  if (!message || message.length < 2) return 'en';

  // Patrones comunes en español que son difíciles de encontrar en inglés
  const spanishPatterns = [
    /\b(hola|qué|cómo|cuánto|cuándo|dónde|por qué|quién|gracias)\b/i,
    /\b(enviar|recibir|saldo|ayuda|quiero|necesito|puedo)\b/i,
    /\b(mi|tu|su|nuestro|vuestro)\b/i,
    /\b(el|la|los|las|un|una|unos|unas)\b/i,
    /\b(y|o|pero|porque|aunque|si|cuando)\b/i,
    /[¿¡]/,  // Caracteres especiales españoles
    /\b(á|é|í|ó|ú|ü|ñ)\b/i  // Acentos y caracteres especiales
  ];

  // Patrones comunes en inglés que son difíciles de encontrar en español
  const englishPatterns = [
    /\b(hi|hello|hey|what|how|when|where|why|who|thanks)\b/i,
    /\b(send|receive|balance|help|want|need|can)\b/i,
    /\b(my|your|his|her|our|their)\b/i,
    /\b(the|a|an|some)\b/i,
    /\b(and|or|but|because|although|if|when)\b/i
  ];

  let spanishScore = 0;
  let englishScore = 0;

  // Verificar patrones españoles
  spanishPatterns.forEach(pattern => {
    if (pattern.test(message)) {
      spanishScore += 1;
    }
  });

  // Verificar patrones ingleses
  englishPatterns.forEach(pattern => {
    if (pattern.test(message)) {
      englishScore += 1;
    }
  });

  // Si no hay suficiente información o hay ambigüedad, usamos el servicio de IA
  if (spanishScore > englishScore) {
    return 'es';
  } else {
    return 'en';
  }
}; 