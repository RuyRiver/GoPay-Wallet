/**
 * Rutas para el agente de lenguaje natural
 */
import { Router } from 'express';
import { agentController } from '../controllers/agentController';

const router = Router();

// Procesar instrucción en lenguaje natural
router.post('/process', agentController.processInstruction);

export default router; 