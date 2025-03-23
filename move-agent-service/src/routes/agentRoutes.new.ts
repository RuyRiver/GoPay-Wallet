/**
 * Rutas para el agente de lenguaje natural
 */
import { Router } from 'express';
import { agentController } from '../controllers/agentController';

// Crear el router
const router = Router();

// Ruta para procesar mensajes en lenguaje natural
router.post('/process-message', agentController.processMessage);

// Ruta para obtener el balance de una dirección
router.get('/balance', agentController.getBalance);

// Ruta para enviar tokens
router.post('/send-tokens', agentController.sendTokens);

export default router; 