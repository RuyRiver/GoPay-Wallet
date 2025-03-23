/**
 * Servicio para analizar intenciones del usuario usando IA
 */
import { moveAgentService } from './moveAgentService';
import { APT_PRICE_USD } from '../config/appInfo';

/**
 * Tipos de intenciones que el usuario puede tener
 */
export enum IntentType {
  TRANSACTIONS = 'transactions', // Consultar historial de transacciones
  APP_HELP = 'app_help',         // Ayuda sobre cómo usar la aplicación
  SEND_TOKENS = 'send_tokens',   // Enviar tokens a alguien
  CHECK_BALANCE = 'check_balance', // Verificar saldo
  GENERAL_QUESTION = 'general_question' // Preguntas generales no clasificadas
}

/**
 * Resultado del análisis de intención
 */
export interface IntentAnalysis {
  primaryIntent: IntentType;
  confidence: number; // 0-1
  entities?: {
    recipient?: string; // Posible destinatario para envíos (email o dirección)
    amount?: number;    // Posible cantidad para envíos
    token?: string;     // Posible token para envíos/consultas (APT o USD)
    timeframe?: string; // Posible marco temporal ("últimas", "recientes", etc.)
    isEmail?: boolean;  // Indica si el destinatario es un email
    transactionCount?: number; // Número de transacciones solicitadas
  };
  needsMoreInfo: boolean;
  suggestedResponse?: string;
}

/**
 * Servicio para analizar las intenciones del usuario utilizando el modelo de IA
 */
export const intentService = {
  /**
   * Analizar la intención del usuario a partir de su mensaje
   * @param message Mensaje del usuario
   * @returns Análisis de intención
   */
  async analyzeIntent(message: string, language: 'es' | 'en' = 'es'): Promise<IntentAnalysis> {
    try {
      console.log(`Analizando intención del mensaje: "${message}"`);
      
      // Crear un prompt para que la IA analice la intención
      const prompt = language === 'es' 
        ? `Analiza la siguiente consulta de un usuario de una wallet digital y determina su intención principal:
          
Mensaje del usuario: "${message}"

CONTEXTO IMPORTANTE:
- El usuario puede enviar tokens a otros usuarios usando email o dirección blockchain
- El usuario puede especificar montos en APT (criptomoneda nativa) o USD
- La tasa de conversión actual es: 1 APT = $${APT_PRICE_USD} USD
- Si el usuario menciona transacciones, determina si está solicitando un número específico (5, 10, todas)

Responde con un objeto JSON con esta estructura exacta, sin explicaciones adicionales:
{
  "primaryIntent": "transactions" | "app_help" | "send_tokens" | "check_balance" | "general_question",
  "confidence": [número entre 0 y 1],
  "entities": {
    "recipient": [nombre, email o dirección del destinatario si es relevante],
    "amount": [cantidad numérica a enviar si es relevante],
    "token": ["APT" o "USD" según la moneda especificada],
    "timeframe": [marco temporal si es relevante, como "últimas", "recientes", "todas"],
    "isEmail": [true si el destinatario parece ser un email],
    "transactionCount": [número de transacciones solicitadas: 5, 10, etc]
  },
  "needsMoreInfo": [true/false],
  "suggestedResponse": [sugerencia breve de respuesta]
}

Solo responde con el objeto JSON, nada más.`
        : `Analyze the following query from a digital wallet user and determine their main intention:
          
User message: "${message}"

IMPORTANT CONTEXT:
- The user can send tokens to other users using email or blockchain address
- The user can specify amounts in APT (native cryptocurrency) or USD
- The current conversion rate is: 1 APT = $${APT_PRICE_USD} USD
- If the user mentions transactions, determine if they're requesting a specific number (5, 10, all)

Respond with a JSON object with this exact structure, without additional explanations:
{
  "primaryIntent": "transactions" | "app_help" | "send_tokens" | "check_balance" | "general_question",
  "confidence": [number between 0 and 1],
  "entities": {
    "recipient": [recipient name, email or address if relevant],
    "amount": [numeric amount to send if relevant],
    "token": ["APT" or "USD" depending on specified currency],
    "timeframe": [time frame if relevant, such as "last", "recent", "all"],
    "isEmail": [true if recipient appears to be an email],
    "transactionCount": [number of transactions requested: 5, 10, etc]
  },
  "needsMoreInfo": [true/false],
  "suggestedResponse": [brief response suggestion]
}

Only respond with the JSON object, nothing else.`;
      
      // Usar directamente el modelo para analizar la intención
      const intentResult = await moveAgentService.getRawAIResponse(prompt);
      
      try {
        // Intentar extraer el objeto JSON de la respuesta
        const jsonMatch = intentResult.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error("No se pudo extraer JSON de la respuesta:", intentResult);
          return this.getDefaultIntentAnalysis();
        }
        
        const jsonStr = jsonMatch[0];
        const analysis = JSON.parse(jsonStr) as IntentAnalysis;
        
        // Procesamiento adicional para validar y normalizar la información
        this.normalizeIntentAnalysis(analysis);
        
        console.log(`Intención detectada: ${analysis.primaryIntent} (confianza: ${analysis.confidence})`);
        
        // Validar si es email
        if (analysis.entities?.recipient) {
          const isEmail = this.validateIsEmail(analysis.entities.recipient);
          analysis.entities.isEmail = isEmail;
          console.log(`Destinatario ${analysis.entities.recipient} es email: ${isEmail}`);
        }
        
        // Verificar moneda y aplicar conversión si es necesario
        if (analysis.entities?.amount && analysis.entities?.token) {
          console.log(`Cantidad detectada: ${analysis.entities.amount} ${analysis.entities.token}`);
          
          // Asegurarse de que el token esté en mayúsculas y sea válido
          analysis.entities.token = analysis.entities.token.toUpperCase();
          if (analysis.entities.token !== 'APT' && analysis.entities.token !== 'USD') {
            analysis.entities.token = 'APT'; // Default a APT si no es válido
          }
        }
        
        return analysis;
      } catch (parseError) {
        console.error("Error al analizar la respuesta JSON:", parseError);
        console.log("Respuesta completa:", intentResult);
        return this.getDefaultIntentAnalysis();
      }
    } catch (error) {
      console.error("Error al analizar la intención:", error);
      return this.getDefaultIntentAnalysis();
    }
  },
  
  /**
   * Validar si una cadena parece ser un email
   */
  validateIsEmail(text: string): boolean {
    return /\S+@\S+\.\S+/.test(text);
  },
  
  /**
   * Normalizar el análisis de intención para asegurar valores consistentes
   */
  normalizeIntentAnalysis(analysis: IntentAnalysis): void {
    // Asegurar que confidence sea un número entre 0 y 1
    if (typeof analysis.confidence !== 'number' || isNaN(analysis.confidence)) {
      analysis.confidence = 0.5;
    } else {
      analysis.confidence = Math.max(0, Math.min(1, analysis.confidence));
    }
    
    // Asegurar que entities existe
    if (!analysis.entities) {
      analysis.entities = {};
    }
    
    // Asegurar que amount es un número si existe
    if (analysis.entities.amount !== undefined && typeof analysis.entities.amount !== 'number') {
      const parsed = parseFloat(String(analysis.entities.amount));
      analysis.entities.amount = isNaN(parsed) ? undefined : parsed;
    }
  },
  
  /**
   * Obtener un análisis de intención por defecto en caso de error
   */
  getDefaultIntentAnalysis(): IntentAnalysis {
    return {
      primaryIntent: IntentType.GENERAL_QUESTION,
      confidence: 0.5,
      needsMoreInfo: false
    };
  }
}; 