/**
 * Servicio para interactuar con Supabase
 */
import { supabase } from '../config/supabase';
import { User } from '../types';

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
  }
}; 