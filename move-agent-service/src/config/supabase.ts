/**
 * Configuración de Supabase
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Obtener las variables de entorno
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;

// Verificar que las variables de entorno estén definidas
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan variables de entorno de Supabase (SUPABASE_URL, SUPABASE_KEY)');
}

// Crear y exportar el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Estructura de la tabla users en Supabase:
 * 
 * CREATE TABLE users (
 *   email TEXT PRIMARY KEY,
 *   address TEXT NOT NULL,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 *   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 * 
 * Nota: Debes crear esta tabla manualmente en tu proyecto de Supabase
 */ 