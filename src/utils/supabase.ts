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