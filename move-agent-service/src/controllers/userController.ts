/**
 * Controlador para gestionar usuarios
 */
import { Request, Response } from 'express';
import { userService } from '../services/supabaseService';
import { ApiResponse, RegisterUserWithKeyRequest, User } from '../types';

export const userController = {
  /**
   * Register a new user or update an existing one
   * @param req Request
   * @param res Response
   */
  async registerUser(req: Request, res: Response): Promise<void> {
    try {
      const { email, address } = req.body;
      
      if (!email || !address) {
        res.status(400).json({
          success: false,
          message: 'Email and address are required'
        } as ApiResponse);
        return;
      }
      
      const user = await userService.registerUser(email, address);
      
      if (user) {
        res.json({
          success: true,
          message: 'User registered successfully',
          data: user
        } as ApiResponse<User>);
      } else {
        res.status(500).json({
          success: false,
          message: 'Error registering user'
        } as ApiResponse);
      }
    } catch (error) {
      console.error('Error in registerUser:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      } as ApiResponse);
    }
  },

  /**
   * Register a user with half of their private key
   * @param req Request
   * @param res Response
   */
  async registerUserWithKey(req: Request, res: Response): Promise<void> {
    try {
      const { email, address, privateKeyHalf } = req.body as RegisterUserWithKeyRequest;
      
      if (!email || !address || !privateKeyHalf) {
        res.status(400).json({
          success: false,
          message: 'Email, address and privateKeyHalf are required'
        } as ApiResponse);
        return;
      }
      
      const user = await userService.registerUserWithKey(email, address, privateKeyHalf);
      
      if (user) {
        // For security, we don't return the private key in the response
        const { private_key_half, ...safeUser } = user;
        
        res.json({
          success: true,
          message: 'User with key registered successfully',
          data: safeUser
        } as ApiResponse<Omit<User, 'private_key_half'>>);
      } else {
        res.status(500).json({
          success: false,
          message: 'Error registering user with key'
        } as ApiResponse);
      }
    } catch (error) {
      console.error('Error in registerUserWithKey:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      } as ApiResponse);
    }
  },
  
  /**
   * Resolve an email to a blockchain address
   * @param req Request
   * @param res Response
   */
  async resolveAddress(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.params;
      
      const address = await userService.resolveAddress(email);
      
      if (address) {
        res.json({
          success: true,
          message: 'Address found',
          data: { address }
        } as ApiResponse<{ address: string }>);
      } else {
        res.status(404).json({
          success: false,
          message: 'User not found'
        } as ApiResponse);
      }
    } catch (error) {
      console.error('Error in resolveAddress:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      } as ApiResponse);
    }
  },
  
  /**
   * Get all users
   * @param req Request
   * @param res Response
   */
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await userService.getAllUsers();
      
      // Remove sensitive information before sending
      const safeUsers = users.map(user => {
        const { private_key_half, ...safeUser } = user;
        return safeUser;
      });
      
      res.json({
        success: true,
        message: 'Users retrieved successfully',
        data: safeUsers
      } as ApiResponse<Omit<User, 'private_key_half'>[]>);
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      } as ApiResponse);
    }
  },

  /**
   * Verify if an email is registered
   * @param req Request
   * @param res Response
   */
  async checkEmailExists(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.params;
      
      if (!email) {
        res.status(400).json({
          success: false,
          message: 'An email is required'
        } as ApiResponse);
        return;
      }
      
      const exists = await userService.userExists(email);
      const address = exists ? await userService.resolveAddress(email) : null;
      
      res.json({
        success: true,
        message: exists ? 'The email is registered' : 'The email is not registered',
        data: {
          exists,
          address
        }
      } as ApiResponse<{ exists: boolean, address: string | null }>);
    } catch (error: any) {
      console.error('Error verifying email:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error verifying email'
      } as ApiResponse);
    }
  },

  /**
   * Get a summary of the user's latest transactions
   * @param req Request
   * @param res Response
   */
  async getTransactionSummary(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.body;
      const limit = req.body.limit ? parseInt(req.body.limit) : 5;
      
      if (!address) {
        res.status(400).json({
          success: false,
          message: 'Wallet address is required'
        } as ApiResponse);
        return;
      }
      
      const summary = await userService.getTransactionSummary(address, limit);
      
      res.json({
        success: true,
        message: 'Transaction summary retrieved successfully',
        data: {
          summary
        }
      } as ApiResponse<{ summary: any[] }>);
    } catch (error: any) {
      console.error('Error getting transaction summary:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error getting transaction summary'
      } as ApiResponse);
    }
  }
};