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
}

// Tipo para las solicitudes de procesamiento de lenguaje natural
export interface ProcessMessageRequest {
  message: string;
  address?: string;
}

// Tipo para las respuestas de balance
export interface BalanceResponse {
  [tokenSymbol: string]: string;
}

// Tipo para las respuestas de transacciones
export interface TransactionResponse {
  txHash: string;
  status?: string;
} 