/**
 * Middleware de autenticación
 * 
 * Nota: Este es un middleware básico de ejemplo.
 * En producción, deberías implementar una autenticación más robusta.
 */
import { Request, Response, NextFunction } from 'express';

// Clave API de ejemplo (en producción, usa variables de entorno)
const API_KEY = process.env.API_KEY || 'test-api-key';

export const authMiddleware = {
  /**
   * Verificar la clave API
   * @param req Request
   * @param res Response
   * @param next NextFunction
   */
  verifyApiKey(req: Request, res: Response, next: NextFunction): void {
    const apiKey = req.headers['x-api-key'];
    
    // Si no se requiere autenticación en desarrollo
    if (process.env.NODE_ENV === 'development' && !process.env.REQUIRE_AUTH) {
      return next();
    }
    
    if (!apiKey || apiKey !== API_KEY) {
      res.status(401).json({
        success: false,
        message: 'Acceso no autorizado. Se requiere una clave API válida.'
      });
      return;
    }
    
    next();
  }
}; 