/**
 * Utilidades para integración con modelos de IA vía OpenRouter
 */
import axios from 'axios';

// Tipo para la memoria de la IA
interface ConversationMemory {
  userAddress?: string;
  lastMessages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
  detectedIntent?: {
    type: string;
    params: Record<string, any>;
    timestamp: number;
  };
}

// Mapa de conversaciones por usuario
const conversationMemories = new Map<string, ConversationMemory>();

// Cliente para OpenRouter
export const aiClient = {
  /**
   * Inicializar o recuperar la memoria de conversación
   * @param userIdentifier Identificador único del usuario
   * @returns Memoria de conversación
   */
  getMemory(userIdentifier: string): ConversationMemory {
    if (!conversationMemories.has(userIdentifier)) {
      conversationMemories.set(userIdentifier, {
        lastMessages: [],
      });
    }
    return conversationMemories.get(userIdentifier)!;
  },

  /**
   * Guardar la memoria de conversación
   * @param userIdentifier Identificador único del usuario
   * @param memory Memoria de conversación
   */
  saveMemory(userIdentifier: string, memory: ConversationMemory): void {
    conversationMemories.set(userIdentifier, memory);
  },

  /**
   * Procesar un mensaje usando OpenRouter con formato de respuesta estructurado
   * @param message Mensaje del usuario
   * @param systemPrompt Prompt del sistema
   * @param userIdentifier Identificador único del usuario
   * @returns Respuesta estructurada del modelo
   */
  async processStructuredMessage(
    message: string, 
    systemPrompt: string, 
    userIdentifier: string,
    userAddress?: string
  ): Promise<{
    content: string;
    intent?: {
      type: string;
      params: Record<string, any>;
    };
  }> {
    try {
      const apiKey = process.env.OPENROUTER_API_KEY;
      
      if (!apiKey) {
        console.warn('¡ADVERTENCIA! OPENROUTER_API_KEY no está configurada.');
        return {
          content: "Lo siento, no puedo procesar tu consulta porque no hay una API key configurada para el servicio de IA."
        };
      }
      
      // Usar el modelo configurado o valor por defecto
      const modelName = process.env.MODEL_NAME || 'openrouter/anthropic/claude-3-opus-20240229';
      console.log(`Utilizando modelo IA: ${modelName}`);
      
      // Recuperar o inicializar la memoria de conversación
      const memory = this.getMemory(userIdentifier);
      
      // Actualizar la dirección del usuario si se proporciona
      if (userAddress) {
        memory.userAddress = userAddress;
      }
      
      // Preparar los mensajes para el historial de conversación
      const messages = [...memory.lastMessages];
      
      // Si no hay un mensaje del sistema en la memoria, agregarlo
      if (messages.length === 0 || messages[0].role !== 'system') {
        messages.unshift({
          role: 'system',
          content: systemPrompt
        });
      } else {
        // Actualizar el mensaje del sistema si ya existe
        messages[0].content = systemPrompt;
      }
      
      // Agregar el nuevo mensaje del usuario
      messages.push({
        role: 'user',
        content: message
      });
      
      // Limitar el historial a los últimos 10 mensajes para evitar tokens excesivos
      const limitedMessages = messages.slice(-10);
      
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.APP_URL || "https://moveai.app",
        "X-Title": "Move AI Assistant"
      };
      
      // Agregar instrucciones específicas para devolver JSON cuando se detecta una intención de acción
      const enhancedSystemPrompt = `${systemPrompt}

INSTRUCCIONES DE FORMATO DE RESPUESTA:
Cuando detectes que el usuario quiere realizar una acción específica como transferir tokens, consultar balance, etc.,
DEBES responder en el siguiente formato JSON, manteniendo un mensaje conversacional normal como valor de "content":

{
  "content": "Tu respuesta conversacional normal aquí",
  "intent": {
    "type": "transfer_tokens | check_balance | etc",
    "params": {
      // Parámetros específicos según el tipo de intención
      // Para transfer_tokens: amount, currency, recipient
      // Para check_balance: no necesita parámetros adicionales
    }
  }
}

Ejemplos de intents: 
1. transfer_tokens: Cuando el usuario quiere enviar tokens
2. check_balance: Cuando el usuario quiere consultar su balance
3. explain_concept: Cuando el usuario quiere una explicación de un concepto
4. general_question: Para preguntas generales sin acción específica

La parte de "intent" SOLO debe incluirse cuando detectes una intención clara de acción. Para respuestas informativas generales, solo incluye "content".

IMPORTANTE: Si el usuario pide enviar tokens, debes extraer:
- amount: la cantidad (número)
- currency: "APT" o "USD" 
- recipient: la dirección o email de destino

Las cantidades en USD se convertirán automáticamente a APT con una tasa de 1 APT = $6.34 USD.`;
      
      // Reemplazar el mensaje del sistema con la versión mejorada
      limitedMessages[0].content = enhancedSystemPrompt;
      
      // Preparar la solicitud para OpenRouter
      const data = {
        "model": modelName,
        "messages": limitedMessages,
        "temperature": 0.7,
        "max_tokens": 1024,
        "response_format": { "type": "json_object" }
      };
      
      console.log('Enviando solicitud a OpenRouter con mensajes:', JSON.stringify(limitedMessages));
      
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        data,
        { headers }
      );
      
      // Extraer la respuesta del modelo
      const reply = response.data.choices[0]?.message?.content || "No se pudo obtener una respuesta.";
      console.log('Respuesta de OpenRouter:', reply);
      
      // Intentar parsear la respuesta como JSON
      let parsedReply: {
        content: string;
        intent?: {
          type: string;
          params: Record<string, any>;
        };
      };
      
      try {
        parsedReply = JSON.parse(reply);
        console.log('Respuesta JSON parseada correctamente:', parsedReply);
        
        // Si hay una intención detectada, guardarla en la memoria
        if (parsedReply.intent) {
          memory.detectedIntent = {
            ...parsedReply.intent,
            timestamp: Date.now()
          };
        }
      } catch (error) {
        console.warn('La respuesta no es un JSON válido, utilizando como contenido normal:', reply);
        parsedReply = { content: reply };
      }
      
      // Agregar la respuesta del asistente al historial
      limitedMessages.push({
        role: 'assistant',
        content: parsedReply.content
      });
      
      // Actualizar la memoria con los mensajes más recientes
      memory.lastMessages = limitedMessages;
      this.saveMemory(userIdentifier, memory);
      
      return parsedReply;
    } catch (error) {
      console.error('Error al llamar a OpenRouter:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        console.error('Detalles del error de la API:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      
      throw new Error(`Error al procesar mensaje con IA: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  },
  
  /**
   * Método de compatibilidad hacia atrás
   * @param message Mensaje del usuario
   * @param systemPrompt Prompt del sistema
   * @returns Respuesta del modelo
   */
  async processMessage(message: string, systemPrompt: string): Promise<string> {
    const result = await this.processStructuredMessage(message, systemPrompt, 'default-user');
    return result.content;
  }
}; 