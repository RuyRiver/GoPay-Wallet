import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// Using anon key from environment variables
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Save or update user data in Supabase
 * @param email User email
 * @param address User wallet address
 */
export const saveUserData = async (email: string, address: string): Promise<boolean> => {
  try {
    // Use upsert to either insert a new record or update an existing one
    const { error } = await supabase
      .from('users')
      .upsert(
        { 
          email, 
          address,
          updated_at: new Date().toISOString()
        }, 
        { 
          onConflict: 'email' // If email exists, update the record
        }
      );

    if (error) {
      console.error('Error saving user data to Supabase:', error);
      return false;
    }

    console.log('User data saved successfully to Supabase');
    return true;
  } catch (error) {
    console.error('Exception when saving user data to Supabase:', error);
    return false;
  }
};

/**
 * Get user data from Supabase by email
 * @param email User email
 */
export const getUserByEmail = async (email: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Error fetching user data from Supabase:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception when fetching user data from Supabase:', error);
    return null;
  }
};

/**
 * Get user data from Supabase by address
 * @param address User wallet address
 */
export const getUserByAddress = async (address: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('address', address)
      .single();

    if (error) {
      console.error('Error fetching user data from Supabase:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception when fetching user data from Supabase:', error);
    return null;
  }
};

/**
 * Save user data with private key half
 * @param email User email
 * @param address User wallet address
 * @param privateKeyHalf Half of the private key to store
 */
export const saveUserWithKey = async (email: string, address: string, privateKeyHalf: string): Promise<boolean> => {
  try {
    // Use upsert to either insert a new record or update an existing one
    const { error } = await supabase
      .from('users')
      .upsert(
        { 
          email, 
          address,
          private_key_half: privateKeyHalf,
          updated_at: new Date().toISOString()
        }, 
        { 
          onConflict: 'email' // If email exists, update the record
        }
      );

    if (error) {
      console.error('Error saving user data with key to Supabase:', error);
      return false;
    }

    console.log('User data with key saved successfully to Supabase');
    return true;
  } catch (error) {
    console.error('Exception when saving user data with key to Supabase:', error);
    return false;
  }
};

/**
 * Crea los límites de agente por defecto para un usuario si no existen
 * @param address Dirección de wallet del usuario
 * @returns true si se crearon los límites o ya existían, false si hubo error
 */
export const createDefaultAgentLimits = async (address: string): Promise<boolean> => {
  try {
    // Primero verificamos si ya existen límites para este usuario
    const { data: existingLimits, error: checkError } = await supabase
      .from('agent_limits')
      .select('*')
      .eq('user_address', address)
      .single();
    
    // Si ya existen límites, no hacemos nada
    if (existingLimits) {
      console.log('Los límites de agente ya existen para este usuario');
      return true;
    }

    // Si no existen, creamos los límites por defecto
    const { error } = await supabase
      .from('agent_limits')
      .insert({
        user_address: address,
        max_tokens_per_tx: 100,
        daily_tx_limit: 1000,
        max_tx_per_day: 5,
        monthly_tx_limit: 10000,
        whitelist_addresses: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error al crear límites de agente por defecto:', error);
      return false;
    }

    console.log('Límites de agente creados exitosamente');
    return true;
  } catch (error) {
    console.error('Exception al crear límites de agente:', error);
    return false;
  }
};

/**
 * Obtiene el historial de transacciones para una dirección
 * @param address Dirección de wallet del usuario
 * @returns Lista de transacciones o null si hay error
 */
export const getTransactionHistory = async (address: string) => {
  try {
    // Obtener transacciones donde la dirección es remitente o destinatario
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .or(`from_address.eq.${address},to_address.eq.${address}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transaction history from Supabase:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception when fetching transaction history:', error);
    return null;
  }
}; 