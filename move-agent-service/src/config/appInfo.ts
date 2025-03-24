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

// Detectar idioma a partir del mensaje usando el LLM
// Función para detectar si un mensaje está en español o inglés
export const detectLanguage = (message: string): 'es' | 'en' => {
  // No hay mensaje o mensaje muy corto
  if (!message || message.length < 2) return 'en';

  // Método heurístico rápido para casos obvios (para no usar el LLM innecesariamente)
  // Patrones comunes en español que son difíciles de encontrar en inglés
  const spanishPatterns = [
    /\b(hola|qué|cómo|cuánto|cuándo|dónde|por qué|quién|gracias)\b/i,
    /[¿¡]/,  // Caracteres especiales españoles
    /\b(á|é|í|ó|ú|ü|ñ)\b/i  // Acentos y caracteres especiales
  ];

  // Patrones comunes en inglés que son difíciles de encontrar en español
  const englishPatterns = [
    /\b(hi|hello|hey|what|how|when|where|why|who|thanks)\b/i
  ];

  // Verificación rápida para casos obvios
  for (const pattern of spanishPatterns) {
    if (pattern.test(message)) {
      return 'es';
    }
  }
  
  for (const pattern of englishPatterns) {
    if (pattern.test(message)) {
      return 'en';
    }
  }

  // Para casos ambiguos, usamos el método heurístico completo como fallback
  // ya que el LLM se usará en el controlador
  const fullSpanishPatterns = [
    /\b(enviar|recibir|saldo|ayuda|quiero|necesito|puedo)\b/i,
    /\b(mi|tu|su|nuestro|vuestro)\b/i,
    /\b(el|la|los|las|un|una|unos|unas)\b/i,
    /\b(y|o|pero|porque|aunque|si|cuando)\b/i
  ];

  const fullEnglishPatterns = [
    /\b(send|receive|balance|help|want|need|can)\b/i,
    /\b(my|your|his|her|our|their)\b/i,
    /\b(the|a|an|some)\b/i,
    /\b(and|or|but|because|although|if|when)\b/i
  ];

  let spanishScore = 0;
  let englishScore = 0;

  // Verificar patrones españoles
  fullSpanishPatterns.forEach(pattern => {
    if (pattern.test(message)) {
      spanishScore += 1;
    }
  });

  // Verificar patrones ingleses
  fullEnglishPatterns.forEach(pattern => {
    if (pattern.test(message)) {
      englishScore += 1;
    }
  });

  if (spanishScore > englishScore) {
    return 'es';
  } else {
    return 'en';
  }
};

// Función asíncrona para detectar idioma usando el LLM
export const detectLanguageWithLLM = async (message: string): Promise<'es' | 'en'> => {
  try {
    // Primero intentamos con el método heurístico rápido
    const heuristicResult = detectLanguage(message);
    
    // Si no hay API key configurada, usamos el método heurístico
    if (!process.env.OPENROUTER_API_KEY) {
      console.log('No hay API key para OpenRouter, usando detección heurística');
      return heuristicResult;
    }
    
    // Preparamos la solicitud para el LLM
    const apiKey = process.env.OPENROUTER_API_KEY;
    const modelName = process.env.MODEL_NAME || 'openrouter/anthropic/claude-3-opus-20240229';
    
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.APP_URL || "https://moveai.app",
      "X-Title": "Move AI Assistant - Language Detection"
    };
    
    // Prompt específico para detección de idioma
    const systemPrompt = `Eres un detector de idiomas. Tu única tarea es determinar si el siguiente mensaje está en español (es) o inglés (en). Responde ÚNICAMENTE con el código de idioma: 'es' o 'en'.`;
    
    // Configuración para respuesta en formato JSON
    const data = {
      "model": modelName,
      "messages": [
        { "role": "system", "content": systemPrompt },
        { "role": "user", "content": message }
      ],
      "temperature": 0.1,
      "max_tokens": 10,
      "response_format": { "type": "json_object" }
    };
    
    // Importamos axios solo cuando sea necesario
    const axios = require('axios');
    
    // Establecemos un timeout corto para no retrasar la respuesta
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      data,
      { 
        headers,
        timeout: 2000 // 2 segundos de timeout
      }
    );
    
    // Extraer la respuesta del modelo
    const reply = response.data.choices[0]?.message?.content || "";
    
    // Intentar parsear la respuesta como JSON
    try {
      const parsedReply = JSON.parse(reply);
      if (parsedReply.language === 'es' || parsedReply.language === 'en') {
        console.log(`Idioma detectado por LLM: ${parsedReply.language}`);
        return parsedReply.language;
      }
    } catch (error) {
      // Si no es JSON, verificamos si la respuesta contiene directamente 'es' o 'en'
      if (reply.includes('es')) {
        console.log('Idioma detectado por LLM: es');
        return 'es';
      } else if (reply.includes('en')) {
        console.log('Idioma detectado por LLM: en');
        return 'en';
      }
    }
    
    // Si no pudimos obtener una respuesta clara del LLM, usamos el método heurístico
    console.log(`No se pudo determinar el idioma con LLM, usando heurística: ${heuristicResult}`);
    return heuristicResult;
    
  } catch (error) {
    console.error('Error al detectar idioma con LLM:', error);
    // En caso de error, volvemos al método heurístico
    return detectLanguage(message);
  }
};