/**
 * Punto de entrada principal de la aplicación
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';
import walletRoutes from './routes/walletRoutes';
import agentRoutes from './routes/agentRoutes';
import { authMiddleware } from './middleware/auth';

// Cargar variables de entorno
dotenv.config();

// Inicializar Express
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Verificar estado del servidor
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Move Agent Service running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Aplicar middleware de autenticación a las rutas protegidas
// Descomenta estas líneas para habilitar la autenticación
// app.use('/api/users', authMiddleware.verifyApiKey);
// app.use('/api/wallet', authMiddleware.verifyApiKey);
// app.use('/api/agent', authMiddleware.verifyApiKey);

// Registrar rutas
app.use('/api/users', userRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/agent', agentRoutes);

// Manejador de errores global
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error no controlado:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Move Agent Service running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API Status: http://localhost:${PORT}/api/status`);
}); 