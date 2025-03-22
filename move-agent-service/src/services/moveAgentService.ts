/**
 * Servicio para interactuar con Move Agent Kit
 */
import { AptosClient } from 'aptos';
// Importación corregida para Move Agent Kit
import { ChatOpenAI } from '@langchain/openai';
import { BalanceResponse, TransactionResponse } from '../types';

// Obtener cliente de Aptos según la red configurada
export const getAptosClient = (): AptosClient => {
  const networkMap: Record<string, string> = {
    mainnet: 'https://fullnode.mainnet.aptoslabs.com/v1',
    testnet: 'https://fullnode.testnet.aptoslabs.com/v1',
    devnet: 'https://fullnode.devnet.aptoslabs.com/v1',
  };
  
  const network = process.env.NETWORK || 'testnet';
  return new AptosClient(networkMap[network]);
};

// Configurar el modelo de OpenRouter
export const getLLM = (): ChatOpenAI => {
  return new ChatOpenAI({
    temperature: 0.7,
    modelName: process.env.MODEL_NAME || 'openrouter/anthropic/claude-3-opus-20240229',
    openAIApiKey: process.env.OPENROUTER_API_KEY as string,
    configuration: {
      baseURL: 'https://openrouter.ai/api/v1'
    }
  });
};

// Simulación temporal de Move Agent Kit
// Esto es una implementación simulada hasta que resolvamos los problemas de importación
class SimulatedMoveAgent {
  private aptosClient: AptosClient;
  private userAccount?: string;

  constructor(options: { aptosClient: AptosClient }) {
    this.aptosClient = options.aptosClient;
  }

  async setUserAccount(address: string): Promise<void> {
    this.userAccount = address;
    console.log(`Cuenta de usuario establecida: ${address}`);
  }

  async getBalanceCoins(): Promise<BalanceResponse> {
    // Simulación de balance
    return {
      'APT': '10.5',
      'USDT': '100.0'
    };
  }

  async transferCoin(toAddress: string, amount: number, tokenType: string = 'APT'): Promise<string> {
    // Simulación de transacción
    console.log(`Simulando transferencia de ${amount} ${tokenType} a ${toAddress}`);
    return `0x${Math.random().toString(16).substring(2, 10)}`;
  }

  async chat(message: string): Promise<{ content: string }> {
    // Simulación de respuesta
    console.log(`Mensaje recibido: ${message}`);
    
    if (message.toLowerCase().includes('balance')) {
      return { content: `Tu balance actual es de 10.5 APT y 100.0 USDT.` };
    }
    
    if (message.toLowerCase().includes('enviar') || message.toLowerCase().includes('send')) {
      return { content: `He procesado tu solicitud para enviar tokens. La transacción ha sido simulada.` };
    }
    
    return { content: `He recibido tu mensaje: "${message}". ¿En qué más puedo ayudarte?` };
  }
}

// Inicializar Move Agent simulado
export const getMoveAgent = async (accountAddress?: string): Promise<SimulatedMoveAgent> => {
  const aptosClient = getAptosClient();
  
  const moveAgent = new SimulatedMoveAgent({
    aptosClient
  });
  
  if (accountAddress) {
    await moveAgent.setUserAccount(accountAddress);
  }
  
  return moveAgent;
};

// Servicio para operaciones blockchain
export const moveAgentService = {
  /**
   * Obtener el balance de una dirección
   * @param address Dirección blockchain
   * @returns Balance de tokens
   */
  async getBalance(address: string): Promise<BalanceResponse> {
    try {
      const moveAgent = await getMoveAgent(address);
      return await moveAgent.getBalanceCoins();
    } catch (error) {
      console.error('Error al obtener balance:', error);
      throw error;
    }
  },
  
  /**
   * Enviar tokens
   * @param fromAddress Dirección de origen
   * @param toAddress Dirección de destino
   * @param amount Cantidad a enviar
   * @param tokenType Tipo de token (por defecto APT)
   * @returns Información de la transacción
   */
  async sendTokens(
    fromAddress: string, 
    toAddress: string, 
    amount: number, 
    tokenType: string = 'APT'
  ): Promise<TransactionResponse> {
    try {
      const moveAgent = await getMoveAgent(fromAddress);
      const txHash = await moveAgent.transferCoin(toAddress, amount, tokenType);
      
      return {
        txHash,
        status: 'success'
      };
    } catch (error) {
      console.error('Error al enviar tokens:', error);
      throw error;
    }
  },
  
  /**
   * Procesar una instrucción en lenguaje natural
   * @param message Mensaje en lenguaje natural
   * @param address Dirección del usuario
   * @returns Respuesta del agente
   */
  async processMessage(message: string, address?: string): Promise<{ content: string }> {
    try {
      const moveAgent = await getMoveAgent(address);
      return await moveAgent.chat(message);
    } catch (error) {
      console.error('Error al procesar mensaje:', error);
      throw error;
    }
  }
}; 