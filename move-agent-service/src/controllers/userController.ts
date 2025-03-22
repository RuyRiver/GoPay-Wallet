/**
 * Controlador para gestionar usuarios
 */
import { Request, Response } from 'express';
import { userService } from '../services/supabaseService';
import { ApiResponse, User } from '../types';

export const userController = {
  /**
   * Registrar un nuevo usuario o actualizar uno existente
   * @param req Request
   * @param res Response
   */
  async registerUser(req: Request, res: Response): Promise<void> {
    try {
      const { email, address } = req.body;
      
      if (!email || !address) {
        res.status(400).json({
          success: false,
          message: 'Se requiere email y address'
        } as ApiResponse);
        return;
      }
      
      const user = await userService.registerUser(email, address);
      
      if (user) {
        res.json({
          success: true,
          message: 'Usuario registrado correctamente',
          data: user
        } as ApiResponse<User>);
      } else {
        res.status(500).json({
          success: false,
          message: 'Error al registrar usuario'
        } as ApiResponse);
      }
    } catch (error) {
      console.error('Error en registerUser:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      } as ApiResponse);
    }
  },
  
  /**
   * Resolver un email a una dirección blockchain
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
          message: 'Dirección encontrada',
          data: { address }
        } as ApiResponse<{ address: string }>);
      } else {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        } as ApiResponse);
      }
    } catch (error) {
      console.error('Error en resolveAddress:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      } as ApiResponse);
    }
  },
  
  /**
   * Obtener todos los usuarios
   * @param req Request
   * @param res Response
   */
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await userService.getAllUsers();
      
      res.json({
        success: true,
        message: 'Usuarios obtenidos correctamente',
        data: users
      } as ApiResponse<User[]>);
    } catch (error) {
      console.error('Error en getAllUsers:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      } as ApiResponse);
    }
  }
}; 