/**
 * Rutas para operaciones de wallet
 */
import { Router } from 'express';
import { walletController } from '../controllers/walletController';

const router = Router();

// Obtener balance
router.get('/balance/:address', walletController.getBalance);

// Enviar tokens
router.post('/send', walletController.sendTokens);

// Enviar tokens por correo electrónico
router.post('/send-by-email', walletController.sendTokensByEmail);

export default router; 