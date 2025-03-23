/**
 * Controlador para operaciones de wallet
 */
import { Request, Response } from 'express';
import { moveAgentService } from '../services/moveAgentService';
import { ApiResponse, BalanceResponse, SendTokenRequest, SendTokenByEmailRequest, TransactionResponse } from '../types';

export const walletController = {
  /**
   * Obtener el balance de una dirección
   * @param req Request
   * @param res Response
   */
  async getBalance(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      
      if (!address) {
        res.status(400).json({
          success: false,
          message: 'Se requiere una dirección'
        } as ApiResponse);
        return;
      }
      
      const balance = await moveAgentService.getBalance(address);
      
      res.json({
        success: true,
        message: 'Balance obtenido correctamente',
        data: balance
      } as ApiResponse<BalanceResponse>);
    } catch (error: any) {
      console.error('Error al obtener balance:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener balance'
      } as ApiResponse);
    }
  },
  
  /**
   * Enviar tokens
   * @param req Request
   * @param res Response
   */
  async sendTokens(req: Request, res: Response): Promise<void> {
    try {
      const { fromAddress, toAddress, amount, tokenType, privateKeyHalf } = req.body as SendTokenRequest;
      
      if (!fromAddress || !toAddress || amount === undefined) {
        res.status(400).json({
          success: false,
          message: 'Se requieren fromAddress, toAddress y amount'
        } as ApiResponse);
        return;
      }
      
      const result = await moveAgentService.sendTokens(
        fromAddress, 
        toAddress, 
        amount, 
        tokenType,
        privateKeyHalf
      );
      
      if (result.status === 'error') {
        res.status(400).json({
          success: false,
          message: result.message || 'Error al enviar tokens',
          data: result
        } as ApiResponse<TransactionResponse>);
        return;
      }
      
      res.json({
        success: true,
        message: `Se han enviado ${amount} ${tokenType || 'APT'} a ${toAddress}`,
        data: result
      } as ApiResponse<TransactionResponse>);
    } catch (error: any) {
      console.error('Error al enviar tokens:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al enviar tokens'
      } as ApiResponse);
    }
  },
  
  /**
   * Enviar tokens usando correo electrónico como destinatario
   * @param req Request
   * @param res Response
   */
  async sendTokensByEmail(req: Request, res: Response): Promise<void> {
    try {
      const { fromAddress, toEmail, amount, tokenType, privateKeyHalf } = req.body as SendTokenByEmailRequest;
      
      if (!fromAddress || !toEmail || amount === undefined) {
        res.status(400).json({
          success: false,
          message: 'Se requieren fromAddress, toEmail y amount'
        } as ApiResponse);
        return;
      }
      
      const result = await moveAgentService.sendTokensByEmail(
        fromAddress, 
        toEmail, 
        amount, 
        tokenType,
        privateKeyHalf
      );
      
      if (result.status === 'error') {
        res.status(400).json({
          success: false,
          message: result.message || 'Error al enviar tokens por correo electrónico',
          data: result
        } as ApiResponse<TransactionResponse>);
        return;
      }
      
      res.json({
        success: true,
        message: `Se han enviado ${amount} ${tokenType || 'APT'} a ${toEmail}`,
        data: result
      } as ApiResponse<TransactionResponse>);
    } catch (error: any) {
      console.error('Error al enviar tokens por correo electrónico:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al enviar tokens por correo electrónico'
      } as ApiResponse);
    }
  }
}; 