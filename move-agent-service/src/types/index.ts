/**
 * Tipos compartidos para la aplicación
 */

// Tipo para las respuestas de la API
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// Tipo para los usuarios
export interface User {
  email: string;
  address: string;
  private_key_half?: string; // Mitad de la clave privada almacenada en BD
  createdAt?: string;
  updatedAt?: string;
}

// Tipo para las operaciones blockchain
export enum BlockchainOperation {
  GET_BALANCE = 'GET_BALANCE',
  SEND_TOKEN = 'SEND_TOKEN',
  GET_ADDRESS = 'GET_ADDRESS',
  NATURAL_LANGUAGE = 'NATURAL_LANGUAGE'
}

// Tipo para las solicitudes de envío de tokens
export interface SendTokenRequest {
  fromAddress: string;
  toAddress: string;
  amount: number;
  tokenType?: string;
  privateKeyHalf?: string; // La otra mitad de la clave privada
}

// Tipo para las solicitudes de envío de tokens por correo electrónico
export interface SendTokenByEmailRequest {
  fromAddress: string;
  toEmail: string;
  amount: number;
  tokenType?: string;
  privateKeyHalf?: string; // La otra mitad de la clave privada
}

// Tipo para las solicitudes de procesamiento de lenguaje natural
export interface ProcessMessageRequest {
  message: string;
  address?: string;
  privateKeyHalf?: string; // La otra mitad de la clave privada
}

// Tipo para las respuestas de balance
export interface BalanceResponse {
  [tokenSymbol: string]: string;
}

// Tipo para las respuestas de transacciones
export interface TransactionResponse {
  txHash: string;
  status?: string;
  message?: string; // Mensaje de error o rechazo
}

// Tipo para registrar un usuario con clave privada dividida
export interface RegisterUserWithKeyRequest {
  email: string;
  address: string;
  privateKeyHalf: string; // Primera mitad de la clave privada para almacenar
}

// Tipo para la configuración de límites del agente
export interface AgentLimits {
  id?: number;
  user_address: string;              // Dirección del usuario dueño de esta configuración
  max_tokens_per_tx: number;         // Cantidad máxima de tokens por transacción
  daily_tx_limit: number;            // Límite diario de transacciones
  max_tx_per_day: number;            // Número máximo de transacciones por día
  monthly_tx_limit: number;          // Límite mensual de transacciones
  whitelist_addresses: string[];     // Lista blanca de direcciones permitidas
  created_at?: string;
  updated_at?: string;
}

// Tipo para la solicitud de actualización de límites
export interface UpdateAgentLimitsRequest {
  max_tokens_per_tx?: number;
  daily_tx_limit?: number;
  max_tx_per_day?: number;
  monthly_tx_limit?: number;
  whitelist_addresses?: string[];
}

// Valores predeterminados para los límites del agente
export const DEFAULT_AGENT_LIMITS: Omit<AgentLimits, 'user_address'> = {
  max_tokens_per_tx: 100,            // 100 tokens máximo por transacción
  daily_tx_limit: 1000,              // 1000 tokens máximo por día
  max_tx_per_day: 5,                 // 5 transacciones máximo por día
  monthly_tx_limit: 10000,           // 10000 tokens máximo por mes
  whitelist_addresses: [],           // Sin direcciones en lista blanca por defecto
}; 