/**
 * Controlador para gestionar usuarios
 */
import { Request, Response } from 'express';
import { userService } from '../services/supabaseService';
import { ApiResponse, RegisterUserWithKeyRequest, User } from '../types';

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
   * Registrar un usuario con la mitad de su clave privada
   * @param req Request
   * @param res Response
   */
  async registerUserWithKey(req: Request, res: Response): Promise<void> {
    try {
      const { email, address, privateKeyHalf } = req.body as RegisterUserWithKeyRequest;
      
      if (!email || !address || !privateKeyHalf) {
        res.status(400).json({
          success: false,
          message: 'Se requiere email, address y privateKeyHalf'
        } as ApiResponse);
        return;
      }
      
      const user = await userService.registerUserWithKey(email, address, privateKeyHalf);
      
      if (user) {
        // Por seguridad, no devolvemos la clave privada en la respuesta
        const { private_key_half, ...safeUser } = user;
        
        res.json({
          success: true,
          message: 'Usuario con clave registrado correctamente',
          data: safeUser
        } as ApiResponse<Omit<User, 'private_key_half'>>);
      } else {
        res.status(500).json({
          success: false,
          message: 'Error al registrar usuario con clave'
        } as ApiResponse);
      }
    } catch (error) {
      console.error('Error en registerUserWithKey:', error);
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
      
      // Eliminar la información sensible antes de enviar
      const safeUsers = users.map(user => {
        const { private_key_half, ...safeUser } = user;
        return safeUser;
      });
      
      res.json({
        success: true,
        message: 'Usuarios obtenidos correctamente',
        data: safeUsers
      } as ApiResponse<Omit<User, 'private_key_half'>[]>);
    } catch (error) {
      console.error('Error en getAllUsers:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      } as ApiResponse);
    }
  },

  /**
   * Verificar si un correo electrónico está registrado
   * @param req Request
   * @param res Response
   */
  async checkEmailExists(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.params;
      
      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Se requiere un correo electrónico'
        } as ApiResponse);
        return;
      }
      
      const exists = await userService.userExists(email);
      const address = exists ? await userService.resolveAddress(email) : null;
      
      res.json({
        success: true,
        message: exists ? 'El correo electrónico está registrado' : 'El correo electrónico no está registrado',
        data: {
          exists,
          address
        }
      } as ApiResponse<{ exists: boolean, address: string | null }>);
    } catch (error: any) {
      console.error('Error al verificar correo electrónico:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al verificar correo electrónico'
      } as ApiResponse);
    }
  }
}; 