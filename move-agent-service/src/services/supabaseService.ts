/**
 * Service for interacting with Supabase
 */
import { supabase } from '../config/supabase';
import { User, AgentLimits, DEFAULT_AGENT_LIMITS, UpdateAgentLimitsRequest } from '../types';

export const userService = {
  /**
   * Register a new user or update an existing one
   * @param email User's email
   * @param address User's blockchain address
   * @returns The registered user or null if there was an error
   */
  async registerUser(email: string, address: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .upsert({ 
          email, 
          address, 
          updated_at: new Date().toISOString() 
        })
        .select();
      
      if (error) {
        console.error('Error registering user:', error);
        return null;
      }
      
      return data?.[0] as User || null;
    } catch (error) {
      console.error('Unexpected error registering user:', error);
      return null;
    }
  },
  
  /**
   * Register a new user with half of their private key
   * @param email User's email
   * @param address User's blockchain address
   * @param privateKeyHalf Half of the private key to store
   * @returns The registered user or null if there was an error
   */
  async registerUserWithKey(email: string, address: string, privateKeyHalf: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .upsert({
          email,
          address,
          private_key_half: privateKeyHalf,
          updated_at: new Date().toISOString()
        })
        .select();
      
      if (error) {
        console.error('Error registering user with key:', error);
        return null;
      }
      
      return data?.[0] as User || null;
    } catch (error) {
      console.error('Unexpected error registering user with key:', error);
      return null;
    }
  },
  
  /**
   * Resolve an email to a blockchain address
   * @param email User's email
   * @returns The blockchain address or null if not found
   */
  async resolveAddress(email: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('address')
        .eq('email', email)
        .single();
      
      if (error || !data) {
        console.error('Error looking up address:', error);
        return null;
      }
      
      return data.address;
    } catch (error) {
      console.error('Unexpected error resolving address:', error);
      return null;
    }
  },
  
  /**
   * Get the stored half of the private key for an address
   * @param address Blockchain address
   * @returns Half of the private key or null if not found
   */
  async getPrivateKeyHalf(address: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('private_key_half')
        .eq('address', address)
        .single();
      
      if (error || !data || !data.private_key_half) {
        console.error('Error looking up private key half:', error);
        return null;
      }
      
      return data.private_key_half;
    } catch (error) {
      console.error('Unexpected error getting private key half:', error);
      return null;
    }
  },
  
  /**
   * Check if a user exists
   * @param email User's email
   * @returns true if exists, false if not
   */
  async userExists(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single();
      
      return !!data && !error;
    } catch (error) {
      console.error('Unexpected error checking user:', error);
      return false;
    }
  },
  
  /**
   * Get all users
   * @returns List of users or empty array if there was an error
   */
  async getAllUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*');
      
      if (error) {
        console.error('Error getting users:', error);
        return [];
      }
      
      return data as User[] || [];
    } catch (error) {
      console.error('Unexpected error getting users:', error);
      return [];
    }
  },
  
  /**
   * Get user by email
   * @param email User's email
   * @returns Found user or null
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        console.error('Error getting user by email:', error);
        return null;
      }

      return data as User;
    } catch (error) {
      console.error('Error en getUserByEmail:', error);
      return null;
    }
  },
  
  /**
   * Get agent limits for a user
   * @param address User's address
   * @returns Limits configuration or null if it doesn't exist
   */
  async getAgentLimits(address: string): Promise<AgentLimits | null> {
    try {
      const { data, error } = await supabase
        .from('agent_limits')
        .select('*')
        .eq('user_address', address)
        .single();
      
      if (error) {
        // If the error is "no rows returned", it means there's no configuration for this user
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error getting agent limits:', error);
        return null;
      }
      
      return data as AgentLimits;
    } catch (error) {
      console.error('Error en getAgentLimits:', error);
      return null;
    }
  },
  
  /**
   * Create or update agent limits for a user
   * @param address User's address
   * @param limits Limits to set
   * @returns Updated configuration or null if there was an error
   */
  async updateAgentLimits(address: string, limits: UpdateAgentLimitsRequest): Promise<AgentLimits | null> {
    try {
      // Get current limits or apply defaults
      const currentLimits = await this.getAgentLimits(address) || {
        ...DEFAULT_AGENT_LIMITS,
        user_address: address
      };
      
      // Apply updates
      const updatedLimits = {
        ...currentLimits,
        ...limits,
        user_address: address,
        updated_at: new Date().toISOString()
      };
      
      // Save to database
      const { data, error } = await supabase
        .from('agent_limits')
        .upsert(updatedLimits)
        .select();
      
      if (error) {
        console.error('Error updating agent limits:', error);
        return null;
      }
      
      return data?.[0] as AgentLimits || null;
    } catch (error) {
      console.error('Error en updateAgentLimits:', error);
      return null;
    }
  },
  
  /**
   * Reset agent limits to default values
   * @param address User's address
   * @returns Updated configuration or null if there was an error
   */
  async resetAgentLimits(address: string): Promise<AgentLimits | null> {
    try {
      const defaultLimits = {
        ...DEFAULT_AGENT_LIMITS,
        user_address: address,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('agent_limits')
        .upsert(defaultLimits)
        .select();
      
      if (error) {
        console.error('Error resetting agent limits:', error);
        return null;
      }
      
      return data?.[0] as AgentLimits || null;
    } catch (error) {
      console.error('Error en resetAgentLimits:', error);
      return null;
    }
  },
  
  /**
   * Verify if a transaction is within allowed limits
   * @param address User's address
   * @param amount Amount to transfer
   * @param toAddress Destination address (optional, to verify whitelist)
   * @returns Object with verification result and message
   */
  async checkTransactionLimits(address: string, amount: number, toAddress?: string): Promise<{allowed: boolean, message: string}> {
    try {
      // Get user limits or use defaults
      const limits = await this.getAgentLimits(address) || {
        ...DEFAULT_AGENT_LIMITS,
        user_address: address
      };
      
      // Verify per-transaction limit
      if (amount > limits.max_tokens_per_tx) {
        return {
          allowed: false,
          message: `The amount exceeds the maximum limit per transaction (${limits.max_tokens_per_tx})`
        };
      }
      
      // Verify whitelist if configured and not empty
      if (limits.whitelist_addresses && 
          limits.whitelist_addresses.length > 0 && 
          toAddress && 
          !limits.whitelist_addresses.includes(toAddress)) {
        return {
          allowed: false,
          message: `The destination address is not in the allowed whitelist`
        };
      }
      
      // Verify daily transaction limit
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      const { data: todayTxs, error: txError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('from_address', address)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);
      
      if (txError) {
        console.error('Error verifying daily transactions:', txError);
        // In case of error, we allow the transaction to avoid blocking the user
        return { allowed: true, message: 'Could not verify daily limits' };
      }
      
      // Verify number of daily transactions
      if (todayTxs.length >= limits.max_tx_per_day) {
        return {
          allowed: false,
          message: `You have reached the maximum number of daily transactions (${limits.max_tx_per_day})`
        };
      }
      
      // Calculate total sent today
      const todayTotal = todayTxs.reduce((sum, tx) => sum + Number(tx.amount), 0);
      
      if (todayTotal + amount > limits.daily_tx_limit) {
        return {
          allowed: false,
          message: `The transaction exceeds your remaining daily limit (${limits.daily_tx_limit - todayTotal})`
        };
      }
      
      // Verify monthly limit
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      const { data: monthTxs, error: monthError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('from_address', address)
        .ilike('created_at', `${currentMonth}%`);
      
      if (monthError) {
        console.error('Error verifying monthly transactions:', monthError);
        return { allowed: true, message: 'Could not verify monthly limits' };
      }
      
      const monthTotal = monthTxs.reduce((sum, tx) => sum + Number(tx.amount), 0);
      
      if (monthTotal + amount > limits.monthly_tx_limit) {
        return {
          allowed: false,
          message: `The transaction exceeds your remaining monthly limit (${limits.monthly_tx_limit - monthTotal})`
        };
      }
      
      return { allowed: true, message: 'Transaction within allowed limits' };
    } catch (error) {
      console.error('Error in checkTransactionLimits:', error);
      // In case of error, we allow the transaction to avoid blocking the user
      return { allowed: true, message: 'Error verifying limits, transaction allowed' };
    }
  },

  /**
   * Get transaction history for an address
   * @param address User's address
   * @param limit Maximum number of transactions to return (optional)
   * @returns List of transactions or empty array if there was an error
   */
  async getTransactionHistory(address: string, limit: number = 10): Promise<any[]> {
    try {
      console.log(`Buscando transacciones para la dirección: ${address}`);
      
      // Crear la consulta
      let query = supabase
        .from('transactions')
        .select(`
          id,
          from_address,
          to_address,
          amount,
          token_type,
          status,
          created_at
        `)
        .or(`from_address.eq.${address},to_address.eq.${address}`)
        .order('created_at', { ascending: false });
      
      // Aplicar límite si se especifica
      if (limit > 0) {
        query = query.limit(limit);
      }
      
      // Ejecutar la consulta
      const { data, error } = await query;
      
      if (error) {
        console.error('Error getting transaction history:', error);
        return [];
      }
      
      if (!data || data.length === 0) {
        console.log('No se encontraron transacciones para esta dirección');
        return [];
      }
      
      console.log(`Se encontraron ${data.length} transacciones`);
      
      // Enriquecer los datos con información de usuario
      const transactions = await Promise.all(data.map(async (tx) => {
        // Obtener información del remitente
        let fromUserInfo = null;
        if (tx.from_address) {
          const { data: fromData } = await supabase
            .from('users')
            .select('email, name')
            .eq('address', tx.from_address)
            .single();
          fromUserInfo = fromData;
        }
        
        // Obtener información del destinatario
        let toUserInfo = null;
        if (tx.to_address) {
          const { data: toData } = await supabase
            .from('users')
            .select('email, name')
            .eq('address', tx.to_address)
            .single();
          toUserInfo = toData;
        }
        
        return {
          ...tx,
          from_user: fromUserInfo,
          to_user: toUserInfo
        };
      }));
      
      return transactions;
    } catch (error) {
      console.error('Unexpected error getting transaction history:', error);
      return [];
    }
  },
  
  /**
   * Get a summary of the latest transactions of a user
   * @param address User's address
   * @param limit Maximum number of transactions to include in the summary (optional)
   * @returns Formatted transaction summary
   */
  async getTransactionSummary(address: string, limit: number = 5): Promise<any[]> {
    try {
      console.log(`Generando resumen de transacciones para: ${address} (límite: ${limit})`);
      
      // Obtener las transacciones utilizando la función getTransactionHistory
      const transactions = await this.getTransactionHistory(address, limit);
      
      if (!transactions || transactions.length === 0) {
        console.log('No se encontraron transacciones para esta dirección');
        return [];
      }
      
      console.log(`Se encontraron ${transactions.length} transacciones para procesar`);
      
      // Formatear las transacciones para el resumen
      const summary = transactions.map(tx => {
        const isOutgoing = tx.from_address === address;
        const counterpartyAddress = isOutgoing ? tx.to_address : tx.from_address;
        
        // Intentar obtener información de la contraparte
        const counterpartyInfo = isOutgoing ? tx.to_user : tx.from_user;
        const counterpartyEmail = counterpartyInfo ? counterpartyInfo.email : null;
        const counterpartyName = counterpartyInfo ? (counterpartyInfo.name || counterpartyInfo.email) : null;
        
        return {
          id: tx.id,
          type: isOutgoing ? 'sent' : 'received',
          amount: tx.amount,
          token: tx.token_type || 'APT',
          counterparty: counterpartyName,
          counterpartyEmail: counterpartyEmail,
          counterpartyAddress: counterpartyAddress || 'Desconocido',
          date: new Date(tx.created_at).toLocaleDateString(),
          status: tx.status || 'completada'
        };
      });
      
      console.log(`Resumen de transacciones generado: ${summary.length} transacciones`);
      return summary;
    } catch (error) {
      console.error('Error al generar resumen de transacciones:', error);
      return [];
    }
  }
}; 