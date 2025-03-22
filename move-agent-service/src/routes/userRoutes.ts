/**
 * Rutas para usuarios
 */
import { Router } from 'express';
import { userController } from '../controllers/userController';

const router = Router();

// Registrar un usuario
router.post('/register', userController.registerUser);

// Resolver email a dirección
router.get('/resolve/:email', userController.resolveAddress);

// Obtener todos los usuarios
router.get('/', userController.getAllUsers);

export default router; 