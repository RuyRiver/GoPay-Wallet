/**
 * Rutas para usuarios
 */
import { Router } from 'express';
import { userController } from '../controllers/userController';

const router = Router();

// Registrar un usuario
router.post('/register', userController.registerUser);

// Registrar un usuario con mitad de la clave privada
router.post('/register-with-key', userController.registerUserWithKey);

// Resolver email a dirección
router.get('/resolve/:email', userController.resolveAddress);

// Obtener todos los usuarios
router.get('/', userController.getAllUsers);

// Verificar si un correo electrónico está registrado
router.get('/check-email/:email', userController.checkEmailExists);

// Obtener resumen de transacciones
router.post('/transaction-summary', userController.getTransactionSummary);

export default router; 