/**
 * Controlador para el agente de lenguaje natural
 */
import { Request, Response } from 'express';
import { moveAgentService } from '../services/moveAgentService';
import { userService } from '../services/supabaseService';
import { ApiResponse, ProcessMessageRequest, SendTokenRequest } from '../types';

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
      const { message, address, privateKeyHalf } = req.body as ProcessMessageRequest;
      
      // Validar que se proporciona un mensaje
      if (!message) {
        res.status(400).json({ 
          success: false,
          error: 'Se requiere un mensaje',
          message: 'No se proporcionó ningún mensaje para procesar'
        });
        return;
      }
      
      console.log(`Procesando mensaje para: ${address || 'usuario sin dirección'}`);
      console.log(`Mensaje recibido: "${message}"`);
      
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
      
      // Procesar el mensaje usando el servicio move-agent-kit con OpenRouter
      const result = await moveAgentService.processMessage(
        message, 
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
          processedMessage: message,
          originalMessage: message,
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