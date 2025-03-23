/**
 * Controlador para el agente de lenguaje natural
 */
import { Request, Response } from 'express';
import { moveAgentService } from '../services/moveAgentService';
import { userService } from '../services/supabaseService';
import { ApiResponse, ProcessMessageRequest, SendTokenRequest } from '../types';
import { appInfo, detectLanguage, APT_PRICE_USD } from '../config/appInfo';
import { intentService, IntentType } from '../services/intentService';
import { supabase } from '../config/supabase';

export const agentController = {
  /**
   * Procesar una instrucción en lenguaje natural
   * @param req Request
   * @param res Response
   */
  async processInstruction(req: Request, res: Response): Promise<void> {
    try {
      const { message, address } = req.body as ProcessMessageRequest;
      
      if (!message) {
        res.status(400).json({ 
          success: false, 
          message: 'Se requiere un mensaje para procesar' 
        } as ApiResponse);
        return;
      }
      
      // Verificar si hay correos electrónicos en el mensaje
      const emailRegex = /\S+@\S+\.\S+/g;
      const emails = message.match(emailRegex);
      let processedMessage = message;
      
      // Si hay correos, intentar resolverlos a direcciones
      if (emails && emails.length > 0) {
        for (const email of emails) {
          const resolvedAddress = await userService.resolveAddress(email);
          if (resolvedAddress) {
            // Reemplazar el correo por la dirección en el mensaje
            processedMessage = processedMessage.replace(email, resolvedAddress);
            console.log(`Email ${email} resuelto a dirección ${resolvedAddress}`);
          } else {
            console.log(`No se pudo resolver el email ${email}`);
          }
        }
      }
      
      // Registrar información sobre la solicitud entrante
      console.log(`Solicitud de procesamiento recibida. Mensaje original: "${message}"`);
      console.log(`Mensaje procesado: "${processedMessage}"`);
      if (address) console.log(`Dirección de wallet: ${address}`);
      
      // Procesar la instrucción utilizando la versión procesada del mensaje
      const response = await moveAgentService.processMessage(processedMessage, address);
      
      // Registrar la respuesta del agente
      console.log(`Respuesta del agente: "${response.content}"`);
      
      res.json({ 
        success: true, 
        message: response.content,
        data: { 
          response,
          processedMessage,
          originalMessage: message 
        }
      } as ApiResponse);
    } catch (error: any) {
      console.error('Error al procesar la instrucción:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Error al procesar la instrucción' 
      } as ApiResponse);
    }
  },

  /**
   * Procesar un mensaje en lenguaje natural
   * @param req Solicitud con mensaje y dirección del usuario
   * @param res Respuesta con el contenido procesado
   */
  async processMessage(req: Request, res: Response): Promise<void> {
    try {
      const { message: originalMessage, address, privateKeyHalf } = req.body as ProcessMessageRequest;
      
      // Validar que se proporciona un mensaje
      if (!originalMessage) {
        res.status(400).json({ 
          success: false,
          error: 'Se requiere un mensaje',
          message: 'No se proporcionó ningún mensaje para procesar'
        });
        return;
      }
      
      console.log(`Procesando mensaje para: ${address || 'usuario sin dirección'}`);
      console.log(`Mensaje recibido: "${originalMessage}"`);
      
      // Detectar el idioma del mensaje
      const language = detectLanguage(originalMessage);
      console.log(`Idioma detectado: ${language}`);
      
      // Si tenemos un correo electrónico, intentamos resolverlo a una dirección
      let resolvedAddress = address;
      if (!resolvedAddress && req.body.email) {
        try {
          const user = await userService.getUserByEmail(req.body.email);
          if (user && user.address) {
            resolvedAddress = user.address;
            console.log(`Resolviendo email a dirección: ${resolvedAddress}`);
          }
        } catch (error) {
          console.error('Error al resolver email a dirección:', error);
        }
      }
      
      // Verificar configuración de OpenRouter
      if (!process.env.OPENROUTER_API_KEY) {
        console.warn('ADVERTENCIA: OPENROUTER_API_KEY no está configurada. Las respuestas de IA pueden ser limitadas.');
      }
      
      // Analizar la intención del usuario usando IA
      const intent = await intentService.analyzeIntent(originalMessage, language);
      console.log(`Intención detectada por IA: ${intent.primaryIntent} (confianza: ${intent.confidence})`);
      
      // Preparar contextos adicionales basados en la intención detectada
      let extraContext = "";
      
      // Si detectamos una intención de enviar tokens, agregar información sobre el destinatario y monto
      if (intent.primaryIntent === IntentType.SEND_TOKENS) {
        console.log('Intención de envío detectada con datos:', intent.entities);
        
        // Extraer entidades relevantes
        const recipient = intent.entities?.recipient;
        const amount = intent.entities?.amount;
        const token = intent.entities?.token || 'APT';
        const isEmail = intent.entities?.isEmail;
        
        if (recipient) {
          // Añadir información contextual sobre el destinatario
          if (language === 'es') {
            extraContext += `\nDetalles de la transacción solicitada:\n`;
            extraContext += `- Destinatario: ${recipient} (${isEmail ? 'email' : 'dirección'})\n`;
            if (amount) {
              extraContext += `- Cantidad: ${amount} ${token}\n`;
              if (token === 'USD') {
                const amountInApt = amount / APT_PRICE_USD;
                extraContext += `- Convertido a APT: ${amountInApt.toFixed(6)} APT\n`;
              }
            }
          } else {
            extraContext += `\nDetails of requested transaction:\n`;
            extraContext += `- Recipient: ${recipient} (${isEmail ? 'email' : 'address'})\n`;
            if (amount) {
              extraContext += `- Amount: ${amount} ${token}\n`;
              if (token === 'USD') {
                const amountInApt = amount / APT_PRICE_USD;
                extraContext += `- Converted to APT: ${amountInApt.toFixed(6)} APT\n`;
              }
            }
          }
        }
      }
      
      // Usar el mensaje original para procesamiento posterior
      let processedMessage = originalMessage;
      
      // 1. Si la intención es consultar transacciones o si el mensaje incluye palabras clave de transacciones
      if ((intent.primaryIntent === IntentType.TRANSACTIONS || 
          processedMessage.toLowerCase().includes('transacciones') || 
          processedMessage.toLowerCase().includes('transactions') ||
          processedMessage.toLowerCase().includes('historial') ||
          processedMessage.toLowerCase().includes('history')) && 
          resolvedAddress) {
        try {
          // Usar un límite simple de 10 transacciones por defecto
          const limit = processedMessage.toLowerCase().includes('10') ? 10 : 5;
          
          console.log(`Buscando ${limit} transacciones para la dirección: ${resolvedAddress}`);
          
          // Obtener directamente las transacciones de la base de datos
          const { data, error } = await supabase
            .from('transactions')
            .select(`
              id,
              from_address,
              to_address,
              amount,
              token,
              status,
              created_at
            `)
            .or(`from_address.eq.${resolvedAddress},to_address.eq.${resolvedAddress}`)
            .order('created_at', { ascending: false })
            .limit(limit);
          
          if (error) {
            console.error('Error al consultar transacciones:', error);
            extraContext += language === 'es'
              ? "\nINFORMACIÓN CRÍTICA: No se pudieron obtener tus transacciones debido a un error en la base de datos. DEBES informar esto al usuario.\n"
              : "\nCRITICAL INFORMATION: Could not retrieve your transactions due to a database error. You MUST inform this to the user.\n";
          }
          else if (!data || data.length === 0) {
            extraContext += language === 'es'
              ? "\nINFORMACIÓN CRÍTICA: No se encontraron transacciones recientes en tu cuenta. DEBES informar esto al usuario.\n"
              : "\nCRITICAL INFORMATION: No recent transactions found in your account. You MUST inform this to the user.\n";
          }
          else {
            console.log(`Se encontraron ${data.length} transacciones`);
            
            // Formatear transacciones de forma sencilla
            const sent = data.filter(tx => tx.from_address === resolvedAddress);
            const received = data.filter(tx => tx.to_address === resolvedAddress);
            
            // Añadir instrucción especial para que el modelo no responda prematuramente
            extraContext += language === 'es'
              ? "\n\nINSTRUCCIÓN IMPORTANTE: El usuario ha pedido explícitamente un resumen de transacciones. NO debes responder con mensajes como 'Claro, puedo hacer eso' o 'Déjame revisar'. DEBES proporcionar inmediatamente el resumen de transacciones que se detalla a continuación.\n\n"
              : "\n\nIMPORTANT INSTRUCTION: The user has explicitly asked for a transaction summary. DO NOT respond with messages like 'Sure, I can do that' or 'Let me check'. You MUST immediately provide the transaction summary detailed below.\n\n";
            
            if (language === 'es') {
              extraContext += `📊 Resumen de tus ${data.length} transacciones más recientes:\n`;
              
              if (sent.length > 0) {
                extraContext += `\n📤 Has enviado ${sent.length} transacciones:\n`;
                sent.forEach((tx, index) => {
                  const date = new Date(tx.created_at).toLocaleDateString();
                  extraContext += `${index + 1}. ${tx.amount} ${tx.token || 'APT'} a ${tx.to_address} el ${date}\n`;
                });
              }
              
              if (received.length > 0) {
                extraContext += `\n📥 Has recibido ${received.length} transacciones:\n`;
                received.forEach((tx, index) => {
                  const date = new Date(tx.created_at).toLocaleDateString();
                  extraContext += `${index + 1}. ${tx.amount} ${tx.token || 'APT'} de ${tx.from_address} el ${date}\n`;
                });
              }
            } else {
              extraContext += `📊 Summary of your ${data.length} most recent transactions:\n`;
              
              if (sent.length > 0) {
                extraContext += `\n📤 You've sent ${sent.length} transactions:\n`;
                sent.forEach((tx, index) => {
                  const date = new Date(tx.created_at).toLocaleDateString();
                  extraContext += `${index + 1}. ${tx.amount} ${tx.token || 'APT'} to ${tx.to_address} on ${date}\n`;
                });
              }
              
              if (received.length > 0) {
                extraContext += `\n📥 You've received ${received.length} transactions:\n`;
                received.forEach((tx, index) => {
                  const date = new Date(tx.created_at).toLocaleDateString();
                  extraContext += `${index + 1}. ${tx.amount} ${tx.token || 'APT'} from ${tx.from_address} on ${date}\n`;
                });
              }
            }
          }
        } catch (error) {
          console.error('Error al procesar transacciones:', error);
          extraContext += language === 'es'
            ? "\nINFORMACIÓN CRÍTICA: Ocurrió un error al procesar tus transacciones. DEBES informar al usuario que hubo un problema.\n"
            : "\nCRITICAL INFORMATION: An error occurred while processing your transactions. You MUST inform the user that there was a problem.\n";
        }
        
        // Cambiar el mensaje original para forzar una respuesta directa
        const actionPrefix = language === 'es' ? "Responde directamente con" : "Respond directly with";
        processedMessage = `${actionPrefix}: ${processedMessage}`;
      }
      
      // 2. Si la intención es ayuda sobre la aplicación
      if (intent.primaryIntent === IntentType.APP_HELP) {
        // Añadir información sobre la aplicación según el idioma
        if (language === 'es') {
          extraContext += `\nInformación sobre ${appInfo.name}:\n`;
          extraContext += `${appInfo.description}\n\n`;
          extraContext += "Funcionalidades principales:\n";
          appInfo.features.forEach((feature, index) => {
            extraContext += `${index + 1}. ${feature.name}: ${feature.description}\n`;
          });
          extraContext += "\nGuía rápida:\n" + appInfo.quickGuide.es;
        } else {
          extraContext += `\nInformation about ${appInfo.name}:\n`;
          extraContext += `${appInfo.description}\n\n`;
          extraContext += "Main features:\n";
          appInfo.features.forEach((feature, index) => {
            extraContext += `${index + 1}. ${feature.name}: ${feature.description}\n`;
          });
          extraContext += "\nQuick guide:\n" + appInfo.quickGuide.en;
        }
        
        console.log("Añadiendo contexto de ayuda sobre la aplicación según intención");
      }
      
      // 3. Si la intención es verificar saldo y tenemos la dirección
      if (intent.primaryIntent === IntentType.CHECK_BALANCE && resolvedAddress) {
        try {
          const balance = await moveAgentService.getBalance(resolvedAddress, privateKeyHalf);
          
          if (balance) {
            if (language === 'es') {
              extraContext += "\nInformación de tu saldo actual:\n";
              Object.entries(balance).forEach(([token, amount]) => {
                extraContext += `- ${token}: ${amount}\n`;
              });
            } else {
              extraContext += "\nYour current balance information:\n";
              Object.entries(balance).forEach(([token, amount]) => {
                extraContext += `- ${token}: ${amount}\n`;
              });
            }
            
            console.log("Añadiendo contexto de saldo según intención");
          }
        } catch (error) {
          console.error('Error al obtener saldo:', error);
          // Mensaje de error
          if (language === 'es') {
            extraContext += "\nNo se pudo obtener información de tu saldo en este momento.\n";
          } else {
            extraContext += "\nCould not retrieve your balance information at this time.\n";
          }
        }
      }
      
      // Preparar mensaje enriquecido con todos los contextos
      const enrichedMessage = extraContext.length > 0 
        ? `${processedMessage}\n\n${extraContext}` 
        : processedMessage;
      
      // Añadir instrucción para responder en el idioma del usuario
      const languageInstruction = language === 'es'
        ? "\nRECUERDA: Por favor responde SIEMPRE en español como lo está haciendo el usuario."
        : "\nREMEMBER: Please ALWAYS respond in English as the user is doing.";
      
      const finalMessage = `${enrichedMessage}\n${languageInstruction}`;
      
      // Procesar el mensaje usando el servicio move-agent-kit con OpenRouter
      const result = await moveAgentService.processMessage(
        finalMessage, 
        resolvedAddress,
        privateKeyHalf
      );
      
      console.log(`Respuesta generada: "${result.content.substring(0, 150)}..."`);
      
      // Enviar respuesta con formato completo
      res.json({
        success: true,
        message: 'Mensaje procesado correctamente con OpenRouter',
        data: {
          response: result,
          processedMessage: enrichedMessage,
          originalMessage: originalMessage,
          language: language,
          intent: intent.primaryIntent,
          model: process.env.MODEL_NAME || 'openrouter/anthropic/claude-3-opus-20240229'
        }
      });
    } catch (error) {
      console.error('Error en processMessage:', error);
      res.status(500).json({
        success: false,
        error: 'Error al procesar el mensaje',
        message: error instanceof Error ? error.message : String(error),
        details: error instanceof Error ? error.stack : undefined
      });
    }
  },
  
  /**
   * Obtener el balance de una dirección
   * @param req Solicitud con la dirección
   * @param res Respuesta con el balance
   */
  async getBalance(req: Request, res: Response): Promise<void> {
    try {
      const { address, privateKeyHalf } = req.query;
      
      if (!address || typeof address !== 'string') {
        res.status(400).json({ error: 'Se requiere una dirección válida' });
        return;
      }
      
      console.log(`Consultando balance para: ${address}`);
      
      const balance = await moveAgentService.getBalance(
        address,
        typeof privateKeyHalf === 'string' ? privateKeyHalf : undefined
      );
      
      res.json(balance);
    } catch (error) {
      console.error('Error en getBalance:', error);
      res.status(500).json({
        error: 'Error al obtener el balance',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  },
  
  /**
   * Enviar tokens a una dirección
   * @param req Solicitud con los detalles de la transacción
   * @param res Respuesta con el resultado
   */
  async sendTokens(req: Request, res: Response): Promise<void> {
    try {
      const { fromAddress, toAddress, amount, tokenType, privateKeyHalf } = req.body as SendTokenRequest;
      
      // Validar parámetros
      if (!fromAddress || !toAddress || amount === undefined) {
        res.status(400).json({
          error: 'Se requieren los campos fromAddress, toAddress y amount'
        });
        return;
      }
      
      if (isNaN(Number(amount)) || Number(amount) <= 0) {
        res.status(400).json({ error: 'El monto debe ser un número positivo' });
        return;
      }
      
      console.log(`Enviando ${amount} ${tokenType || 'APT'} desde ${fromAddress} a ${toAddress}`);
      
      // Llamar al servicio para realizar la transferencia
      const result = await moveAgentService.sendTokens(
        fromAddress,
        toAddress,
        Number(amount),
        tokenType || 'APT',
        privateKeyHalf
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error en sendTokens:', error);
      res.status(500).json({
        error: 'Error al enviar tokens',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
}; 