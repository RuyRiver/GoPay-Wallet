/**
 * Controller for wallet operations
 */
import { Request, Response } from 'express';
import { moveAgentService } from '../services/moveAgentService';
import { ApiResponse, BalanceResponse, SendTokenRequest, SendTokenByEmailRequest, TransactionResponse } from '../types';

export const walletController = {
  /**
   * Get the balance of an address
   * @param req Request
   * @param res Response
   */
  async getBalance(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      
      if (!address) {
        res.status(400).json({
          success: false,
          message: 'An address is required'
        } as ApiResponse);
        return;
      }
      
      const balance = await moveAgentService.getBalance(address);
      
      res.json({
        success: true,
        message: 'Balance retrieved successfully',
        data: balance
      } as ApiResponse<BalanceResponse>);
    } catch (error: any) {
      console.error('Error getting balance:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error getting balance'
      } as ApiResponse);
    }
  },
  
  /**
   * Send tokens
   * @param req Request
   * @param res Response
   */
  async sendTokens(req: Request, res: Response): Promise<void> {
    try {
      const { fromAddress, toAddress, amount, tokenType, privateKeyHalf } = req.body as SendTokenRequest;
      
      if (!fromAddress || !toAddress || amount === undefined) {
        res.status(400).json({
          success: false,
          message: 'fromAddress, toAddress and amount are required'
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
          message: result.message || 'Error sending tokens',
          data: result
        } as ApiResponse<TransactionResponse>);
        return;
      }
      
      res.json({
        success: true,
        message: `${amount} ${tokenType || 'APT'} have been sent to ${toAddress}`,
        data: result
      } as ApiResponse<TransactionResponse>);
    } catch (error: any) {
      console.error('Error sending tokens:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error sending tokens'
      } as ApiResponse);
    }
  },
  
  /**
   * Send tokens using email as recipient
   * @param req Request
   * @param res Response
   */
  async sendTokensByEmail(req: Request, res: Response): Promise<void> {
    try {
      const { fromAddress, toEmail, amount, tokenType, privateKeyHalf } = req.body as SendTokenByEmailRequest;
      
      if (!fromAddress || !toEmail || amount === undefined) {
        res.status(400).json({
          success: false,
          message: 'fromAddress, toEmail and amount are required'
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
          message: result.message || 'Error sending tokens by email',
          data: result
        } as ApiResponse<TransactionResponse>);
        return;
      }
      
      res.json({
        success: true,
        message: `${amount} ${tokenType || 'APT'} have been sent to ${toEmail}`,
        data: result
      } as ApiResponse<TransactionResponse>);
    } catch (error: any) {
      console.error('Error sending tokens by email:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error sending tokens by email'
      } as ApiResponse);
    }
  }
};