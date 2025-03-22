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

export default router; 