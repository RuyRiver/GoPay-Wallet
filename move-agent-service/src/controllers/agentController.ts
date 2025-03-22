/**
 * Controlador para el agente de lenguaje natural
 */
import { Request, Response } from 'express';
import { moveAgentService } from '../services/moveAgentService';
import { userService } from '../services/supabaseService';
import { ApiResponse, ProcessMessageRequest } from '../types';

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
      
      // Procesar la instrucción utilizando la versión procesada del mensaje
      const response = await moveAgentService.processMessage(processedMessage, address);
      
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
  }
}; 