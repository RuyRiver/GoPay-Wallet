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
          message: 'A message is required to proceed' 
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
        message: error.message || 'Error to process the instruction' 
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
          message: 'None message provided'
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
          processedMessage.toLowerCase().includes('history'))) {
        try {
          console.log('=== DIAGNÓSTICO DE CONSULTA DE TRANSACCIONES ===');
          console.log(`Usuario solicitó transacciones. Mensaje original: "${originalMessage}"`);
          console.log(`Dirección para consulta: ${resolvedAddress || 'NO HAY DIRECCIÓN DISPONIBLE'}`);
          
          // Número de transacciones a mostrar
          const limit = processedMessage.toLowerCase().includes('10') ? 10 : 5;
          console.log(`Número de transacciones solicitadas: ${limit}`);
          
          // Solo intentar consultar si tenemos una dirección
          if (resolvedAddress) {
            console.log(`Intentando consultar transacciones para dirección: ${resolvedAddress}`);
            
            // Verificar conexión a Supabase
            try {
              const { count, error: countError } = await supabase
                .from('transactions')
                .select('*', { count: 'exact', head: true });
              
              if (countError) {
                console.error('ERROR AL CONECTAR CON SUPABASE:', countError);
              } else {
                console.log(`Conexión con Supabase OK. Cantidad estimada de registros: ${count}`);
              }
            } catch (connError) {
              console.error('ERROR CRÍTICO CONECTANDO A SUPABASE:', connError);
            }
            
            // Obtener directamente las transacciones de la base de datos
            console.log('Ejecutando consulta SQL a la tabla "transactions"...');
            const { data, error } = await supabase
              .from('transactions')
              .select(`
                id,
                from_address,
                to_address,
                amount,
                token_type,
                tx_hash,
                status,
                created_at
              `)
              .or(`from_address.eq.${resolvedAddress},to_address.eq.${resolvedAddress}`)
              .order('created_at', { ascending: false })
              .limit(limit);
            
            console.log('Consulta SQL completada.');
            
            if (error) {
              console.error('ERROR AL CONSULTAR TRANSACCIONES:', error);
              if (error.code) console.error(`Código de error: ${error.code}`);
              if (error.message) console.error(`Mensaje de error: ${error.message}`);
              if (error.details) console.error(`Detalles de error: ${error.details}`);
              
              extraContext += language === 'es'
                ? "\nNo se pudieron obtener tus transacciones debido a un error en la base de datos.\n"
                : "\nCould not retrieve your transactions due to a database error.\n";
            }
            else if (!data || data.length === 0) {
              console.log('NO SE ENCONTRARON TRANSACCIONES para esta dirección');
              
              // Verificar si la dirección existe en alguna transacción
              const { data: checkData, error: checkError } = await supabase
                .from('transactions')
                .select('id')
                .or(`from_address.ilike.${resolvedAddress},to_address.ilike.${resolvedAddress}`)
                .limit(1);
              
              if (checkError) {
                console.error('Error al verificar la existencia de la dirección:', checkError);
              } else {
                console.log(`¿La dirección existe en alguna transacción? ${checkData && checkData.length > 0 ? 'SÍ' : 'NO'}`);
              }
              
              extraContext += language === 'es'
                ? "\nNo se encontraron transacciones recientes en tu cuenta.\n"
                : "\nNo recent transactions found in your account.\n";
            }
            else {
              console.log(`ÉXITO: Se encontraron ${data.length} transacciones`);
              console.log('Primera transacción:', JSON.stringify(data[0]));
              
              // Formatear transacciones de forma sencilla
              const sent = data.filter(tx => tx.from_address === resolvedAddress);
              const received = data.filter(tx => tx.to_address === resolvedAddress);
              
              console.log(`Transacciones enviadas: ${sent.length}, Transacciones recibidas: ${received.length}`);
              
              // Añadir instrucción especial para que el modelo no responda prematuramente
              extraContext += language === 'es'
                ? "\n\nINSTRUCCIÓN IMPORTANTE: El usuario ha pedido explícitamente un resumen de transacciones. DEBES proporcionar inmediatamente el resumen de transacciones que se detalla a continuación.\n\n"
                : "\n\nIMPORTANT INSTRUCTION: The user has explicitly asked for a transaction summary. You MUST immediately provide the transaction summary detailed below.\n\n";
              
              if (language === 'es') {
                extraContext += `📊 Resumen de tus ${data.length} transacciones más recientes:\n`;
                
                if (sent.length > 0) {
                  extraContext += `\n📤 Has enviado ${sent.length} transacciones:\n`;
                  sent.forEach((tx, index) => {
                    const date = new Date(tx.created_at).toLocaleDateString();
                    const shortAddress = tx.to_address.substring(0, 6) + '...' + tx.to_address.substring(tx.to_address.length - 4);
                    const tokenDisplay = tx.token_type ? (tx.token_type.includes('::') ? 'APT' : tx.token_type) : 'APT';
                    extraContext += `${index + 1}. $$${tx.amount} ${tokenDisplay} a ${shortAddress} el ${date}\n`;
                  });
                }
                
                if (received.length > 0) {
                  extraContext += `\n📥 Has recibido ${received.length} transacciones:\n`;
                  received.forEach((tx, index) => {
                    const date = new Date(tx.created_at).toLocaleDateString();
                    const shortAddress = tx.from_address.substring(0, 6) + '...' + tx.from_address.substring(tx.from_address.length - 4);
                    const tokenDisplay = tx.token_type ? (tx.token_type.includes('::') ? 'APT' : tx.token_type) : 'APT';
                    extraContext += `${index + 1}. $$${tx.amount} ${tokenDisplay} de ${shortAddress} el ${date}\n`;
                  });
                }
              } else {
                extraContext += `📊 Summary of your ${data.length} most recent transactions:\n`;
                
                if (sent.length > 0) {
                  extraContext += `\n📤 You've sent ${sent.length} transactions:\n`;
                  sent.forEach((tx, index) => {
                    const date = new Date(tx.created_at).toLocaleDateString();
                    const shortAddress = tx.to_address.substring(0, 6) + '...' + tx.to_address.substring(tx.to_address.length - 4);
                    const tokenDisplay = tx.token_type ? (tx.token_type.includes('::') ? 'APT' : tx.token_type) : 'APT';
                    extraContext += `${index + 1}. $$${tx.amount} ${tokenDisplay} to ${shortAddress} on ${date}\n`;
                  });
                }
                
                if (received.length > 0) {
                  extraContext += `\n📥 You've received ${received.length} transactions:\n`;
                  received.forEach((tx, index) => {
                    const date = new Date(tx.created_at).toLocaleDateString();
                    const shortAddress = tx.from_address.substring(0, 6) + '...' + tx.from_address.substring(tx.from_address.length - 4);
                    const tokenDisplay = tx.token_type ? (tx.token_type.includes('::') ? 'APT' : tx.token_type) : 'APT';
                    extraContext += `${index + 1}. $$${tx.amount} ${tokenDisplay} from ${shortAddress} on ${date}\n`;
                  });
                }
              }
              
              // Agregar enlace al explorador
              extraContext += language === 'es' 
                ? "\nVer en explorador: https://explorer.aptoslabs.com/account/" + resolvedAddress
                : "\nView in explorer: https://explorer.aptoslabs.com/account/" + resolvedAddress;
            }
          } else {
            console.error('NO HAY DIRECCIÓN DISPONIBLE para consultar transacciones');
            extraContext += language === 'es'
              ? "\nPara ver tus transacciones, necesito conocer tu dirección de wallet. Por favor, conecta tu wallet o proporciona tu dirección.\n"
              : "\nTo view your transactions, I need to know your wallet address. Please connect your wallet or provide your address.\n";
          }
          
          // Para asegurarse de que el modelo no responda con "te mostraré las transacciones" sino con el resumen directamente
          processedMessage = language === 'es' 
            ? "RESPONDE DIRECTAMENTE CON LA INFORMACIÓN DE TRANSACCIONES"
            : "RESPOND DIRECTLY WITH THE TRANSACTION INFORMATION";
          
          console.log('=== FIN DEL DIAGNÓSTICO ===');
        } catch (error) {
          console.error('ERROR CRÍTICO AL PROCESAR TRANSACCIONES:', error);
          if (error instanceof Error) {
            console.error('Mensaje de error:', error.message);
            console.error('Stack trace:', error.stack);
          }
          extraContext += language === 'es'
            ? "\nOcurrió un error al procesar tus transacciones. Por favor, inténtalo más tarde.\n"
            : "\nAn error occurred while processing your transactions. Please try again later.\n";
        }
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