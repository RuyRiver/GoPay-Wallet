/**
 * Servicio para interactuar con Supabase
 */
import { supabase } from '../config/supabase';
import { User, AgentLimits, DEFAULT_AGENT_LIMITS, UpdateAgentLimitsRequest } from '../types';

export const userService = {
  /**
   * Registrar un nuevo usuario o actualizar uno existente
   * @param email Email del usuario
   * @param address Dirección blockchain del usuario
   * @returns El usuario registrado o null si hubo un error
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
        console.error('Error al registrar usuario:', error);
        return null;
      }
      
      return data?.[0] as User || null;
    } catch (error) {
      console.error('Error inesperado al registrar usuario:', error);
      return null;
    }
  },
  
  /**
   * Registrar un nuevo usuario con la mitad de su clave privada
   * @param email Email del usuario
   * @param address Dirección blockchain del usuario
   * @param privateKeyHalf Mitad de la clave privada a almacenar
   * @returns El usuario registrado o null si hubo un error
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
        console.error('Error al registrar usuario con clave:', error);
        return null;
      }
      
      return data?.[0] as User || null;
    } catch (error) {
      console.error('Error inesperado al registrar usuario con clave:', error);
      return null;
    }
  },
  
  /**
   * Resolver un email a una dirección blockchain
   * @param email Email del usuario
   * @returns La dirección blockchain o null si no se encontró
   */
  async resolveAddress(email: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('address')
        .eq('email', email)
        .single();
      
      if (error || !data) {
        console.error('Error al buscar dirección:', error);
        return null;
      }
      
      return data.address;
    } catch (error) {
      console.error('Error inesperado al resolver dirección:', error);
      return null;
    }
  },
  
  /**
   * Obtener la mitad de la clave privada almacenada para una dirección
   * @param address Dirección blockchain
   * @returns Mitad de la clave privada o null si no se encontró
   */
  async getPrivateKeyHalf(address: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('private_key_half')
        .eq('address', address)
        .single();
      
      if (error || !data || !data.private_key_half) {
        console.error('Error al buscar mitad de clave privada:', error);
        return null;
      }
      
      return data.private_key_half;
    } catch (error) {
      console.error('Error inesperado al obtener mitad de clave privada:', error);
      return null;
    }
  },
  
  /**
   * Comprobar si existe un usuario
   * @param email Email del usuario
   * @returns true si existe, false si no
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
      console.error('Error inesperado al comprobar usuario:', error);
      return false;
    }
  },
  
  /**
   * Obtener todos los usuarios
   * @returns Lista de usuarios o array vacío si hubo un error
   */
  async getAllUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*');
      
      if (error) {
        console.error('Error al obtener usuarios:', error);
        return [];
      }
      
      return data as User[] || [];
    } catch (error) {
      console.error('Error inesperado al obtener usuarios:', error);
      return [];
    }
  },
  
  /**
   * Obtener usuario por email
   * @param email Email del usuario
   * @returns Usuario encontrado o null
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        console.error('Error al obtener usuario por email:', error);
        return null;
      }

      return data as User;
    } catch (error) {
      console.error('Error en getUserByEmail:', error);
      return null;
    }
  },
  
  /**
   * Obtener los límites del agente para un usuario
   * @param address Dirección del usuario
   * @returns Configuración de límites o null si no existe
   */
  async getAgentLimits(address: string): Promise<AgentLimits | null> {
    try {
      const { data, error } = await supabase
        .from('agent_limits')
        .select('*')
        .eq('user_address', address)
        .single();
      
      if (error) {
        // Si el error es "no rows returned", significa que no hay configuración para este usuario
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error al obtener límites del agente:', error);
        return null;
      }
      
      return data as AgentLimits;
    } catch (error) {
      console.error('Error en getAgentLimits:', error);
      return null;
    }
  },
  
  /**
   * Crear o actualizar los límites del agente para un usuario
   * @param address Dirección del usuario
   * @param limits Límites a establecer
   * @returns Configuración actualizada o null si hubo un error
   */
  async updateAgentLimits(address: string, limits: UpdateAgentLimitsRequest): Promise<AgentLimits | null> {
    try {
      // Obtener los límites actuales o aplicar los predeterminados
      const currentLimits = await this.getAgentLimits(address) || {
        ...DEFAULT_AGENT_LIMITS,
        user_address: address
      };
      
      // Aplicar las actualizaciones
      const updatedLimits = {
        ...currentLimits,
        ...limits,
        user_address: address,
        updated_at: new Date().toISOString()
      };
      
      // Guardar en la base de datos
      const { data, error } = await supabase
        .from('agent_limits')
        .upsert(updatedLimits)
        .select();
      
      if (error) {
        console.error('Error al actualizar límites del agente:', error);
        return null;
      }
      
      return data?.[0] as AgentLimits || null;
    } catch (error) {
      console.error('Error en updateAgentLimits:', error);
      return null;
    }
  },
  
  /**
   * Restablecer los límites del agente a los valores predeterminados
   * @param address Dirección del usuario
   * @returns Configuración actualizada o null si hubo un error
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
        console.error('Error al restablecer límites del agente:', error);
        return null;
      }
      
      return data?.[0] as AgentLimits || null;
    } catch (error) {
      console.error('Error en resetAgentLimits:', error);
      return null;
    }
  },
  
  /**
   * Verificar si una transacción está dentro de los límites permitidos
   * @param address Dirección del usuario
   * @param amount Cantidad a transferir
   * @param toAddress Dirección de destino (opcional, para verificar lista blanca)
   * @returns Objeto con resultado de verificación y mensaje
   */
  async checkTransactionLimits(address: string, amount: number, toAddress?: string): Promise<{allowed: boolean, message: string}> {
    try {
      // Obtener los límites del usuario o usar los predeterminados
      const limits = await this.getAgentLimits(address) || {
        ...DEFAULT_AGENT_LIMITS,
        user_address: address
      };
      
      // Verificar límite por transacción
      if (amount > limits.max_tokens_per_tx) {
        return {
          allowed: false,
          message: `La cantidad excede el límite máximo por transacción (${limits.max_tokens_per_tx})`
        };
      }
      
      // Verificar lista blanca si está configurada y no está vacía
      if (limits.whitelist_addresses && 
          limits.whitelist_addresses.length > 0 && 
          toAddress && 
          !limits.whitelist_addresses.includes(toAddress)) {
        return {
          allowed: false,
          message: `La dirección de destino no está en la lista blanca permitida`
        };
      }
      
      // Verificar límite diario de transacciones
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      const { data: todayTxs, error: txError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('from_address', address)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);
      
      if (txError) {
        console.error('Error al verificar transacciones diarias:', txError);
        // En caso de error, permitimos la transacción para no bloquear al usuario
        return { allowed: true, message: 'No se pudieron verificar los límites diarios' };
      }
      
      // Verificar número de transacciones diarias
      if (todayTxs.length >= limits.max_tx_per_day) {
        return {
          allowed: false,
          message: `Has alcanzado el número máximo de transacciones diarias (${limits.max_tx_per_day})`
        };
      }
      
      // Calcular total enviado hoy
      const todayTotal = todayTxs.reduce((sum, tx) => sum + Number(tx.amount), 0);
      
      if (todayTotal + amount > limits.daily_tx_limit) {
        return {
          allowed: false,
          message: `La transacción excede tu límite diario restante (${limits.daily_tx_limit - todayTotal})`
        };
      }
      
      // Verificar límite mensual
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      const { data: monthTxs, error: monthError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('from_address', address)
        .ilike('created_at', `${currentMonth}%`);
      
      if (monthError) {
        console.error('Error al verificar transacciones mensuales:', monthError);
        return { allowed: true, message: 'No se pudieron verificar los límites mensuales' };
      }
      
      const monthTotal = monthTxs.reduce((sum, tx) => sum + Number(tx.amount), 0);
      
      if (monthTotal + amount > limits.monthly_tx_limit) {
        return {
          allowed: false,
          message: `La transacción excede tu límite mensual restante (${limits.monthly_tx_limit - monthTotal})`
        };
      }
      
      return { allowed: true, message: 'Transacción dentro de los límites permitidos' };
    } catch (error) {
      console.error('Error en checkTransactionLimits:', error);
      // En caso de error, permitimos la transacción para no bloquear al usuario
      return { allowed: true, message: 'Error al verificar límites, transacción permitida' };
    }
  },

  /**
   * Obtener el historial de transacciones para una dirección
   * @param address Dirección del usuario
   * @param limit Número máximo de transacciones a devolver (opcional)
   * @returns Lista de transacciones o array vacío si hubo error
   */
  async getTransactionHistory(address: string, limit: number = 10): Promise<any[]> {
    try {
      console.log(`Buscando transacciones para la dirección: ${address}`);
      
      // Consulta principal de transacciones
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          from_address,
          to_address,
          amount,
          token,
          status,
          created_at
        `)
        .or(`from_address.eq.${address},to_address.eq.${address}`)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error al obtener historial de transacciones:', error);
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
      console.error('Error inesperado al obtener historial de transacciones:', error);
      return [];
    }
  },
  
  /**
   * Obtener un resumen de las últimas transacciones de un usuario
   * @param address Dirección del usuario
   * @param limit Número máximo de transacciones a incluir en el resumen (opcional)
   * @returns Resumen formateado de transacciones
   */
  async getTransactionSummary(address: string, limit: number = 5): Promise<any[]> {
    try {
      console.log(`Generando resumen de transacciones para: ${address} (límite: ${limit})`);
      
      // Sanitizar la dirección para la consulta
      const sanitizedAddress = address.trim();
      
      // Consulta directa a la base de datos para obtener transacciones
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          from_address,
          to_address,
          amount,
          token,
          status,
          created_at
        `)
        .or(`from_address.eq.${sanitizedAddress},to_address.eq.${sanitizedAddress}`)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error al obtener transacciones:', error);
        return [];
      }
      
      if (!data || data.length === 0) {
        console.log('No se encontraron transacciones para esta dirección');
        return [];
      }
      
      console.log(`Se encontraron ${data.length} transacciones para procesar`);
      
      // Obtener información de usuarios en paralelo para optimizar
      const userEmails = new Map<string, { email?: string, name?: string }>();
      
      // Recolectar todas las direcciones únicas
      const uniqueAddresses = [...new Set([
        ...data.map(tx => tx.from_address).filter(Boolean),
        ...data.map(tx => tx.to_address).filter(Boolean)
      ])];
      
      // Consultar información de usuarios en masa
      if (uniqueAddresses.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('address, email, name')
          .in('address', uniqueAddresses);
        
        if (!usersError && usersData) {
          // Almacenar datos de usuario por dirección
          usersData.forEach(user => {
            if (user.address) {
              userEmails.set(user.address, { 
                email: user.email, 
                name: user.name 
              });
            }
          });
          
          console.log(`Obtenida información para ${usersData.length} usuarios`);
        } else {
          console.error('Error al obtener información de usuarios:', usersError);
        }
      }
      
      // Formatear las transacciones para el resumen
      const summary = data.map(tx => {
        const isOutgoing = tx.from_address === sanitizedAddress;
        
        // Determinar la contraparte basada en si es saliente o entrante
        const counterpartyAddress = isOutgoing ? tx.to_address : tx.from_address;
        
        // Obtener información del usuario contraparte
        const counterpartyInfo = userEmails.get(counterpartyAddress || '');
        
        // Determinar el nombre o la dirección de la contraparte
        let counterpartyName = counterpartyAddress || 'Desconocido';
        let counterpartyEmail = 'Desconocido';
        
        if (counterpartyInfo) {
          if (counterpartyInfo.name) {
            counterpartyName = counterpartyInfo.name;
          } else if (counterpartyInfo.email) {
            counterpartyName = counterpartyInfo.email;
          }
          
          counterpartyEmail = counterpartyInfo.email || 'Desconocido';
        }
        
        console.log(`Procesando transacción ${tx.id}: ${isOutgoing ? 'enviada a' : 'recibida de'} ${counterpartyName}`);
        
        return {
          id: tx.id,
          type: isOutgoing ? 'enviada' : 'recibida',
          amount: tx.amount,
          token: tx.token || 'APT',
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
      console.error('Error inesperado al generar resumen de transacciones:', error);
      return [];
    }
  }
}; 