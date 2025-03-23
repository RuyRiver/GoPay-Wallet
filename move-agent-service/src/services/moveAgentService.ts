/**
 * Servicio para interactuar con Move Agent Kit
 */
import { Account, Aptos, AptosConfig, Network, AccountAddress, Ed25519PrivateKey } from '@aptos-labs/ts-sdk';
import { 
  AgentRuntime, 
  AptosBalanceTool, 
  AptosTransferTokenTool,
  LocalSigner,
  WalletSigner
} from 'move-agent-kit';
import { BalanceResponse, TransactionResponse } from '../types';
import { userService } from './supabaseService';
import { supabase } from '../config/supabase';

// Extendemos la interfaz para agregar el método adicional
declare module 'move-agent-kit' {
  interface AgentRuntime {
    transferTokens(
      toAddress: string | AccountAddress,
      amount: number,
      tokenType?: string
    ): Promise<string>;
  }
}

// Obtener cliente de Aptos según la red configurada
export const getAptosClient = (): Aptos => {
  const network = process.env.NETWORK || 'devnet';
  const networkType = network.toUpperCase() as keyof typeof Network;
  
  // Crear configuración adecuada para AptosConfig
  const config = new AptosConfig({ 
    network: Network[networkType] 
  });
  
  return new Aptos(config);
};

// Función para reconstruir la clave privada completa
async function reconstructPrivateKey(address: string, clientHalf: string): Promise<string | null> {
  if (!address || !clientHalf) {
    console.error('Se requiere address y clientHalf para reconstruir la clave privada');
    return null;
  }
  
  // Obtener la mitad de la clave almacenada en la base de datos
  const serverHalf = await userService.getPrivateKeyHalf(address);
  
  if (!serverHalf) {
    console.error(`No se encontró la mitad de la clave para la dirección ${address}`);
    return null;
  }
  
  // Reconstruir la clave completa (concatenación simple, podría ser más complejo en un caso real)
  return serverHalf + clientHalf;
}

// Crear cuenta de Aptos (delegando a move-agent-kit)
export const createAptosAccount = (privateKey?: string): Account => {
  try {
    if (privateKey) {
      // Aquí estamos asumiendo que move-agent-kit maneja la creación de la cuenta
      // En un caso real, debemos consultar la documentación de move-agent-kit o @aptos-labs/ts-sdk
      console.log('Se encontró clave privada, creando cuenta Aptos');
      
      // NOTA: Este es un enfoque provisional 
      // Dependerá de la implementación específica de la biblioteca en uso
      return {
        address: () => 'dirección derivada', // Esto será reemplazado por move-agent-kit
        publicKey: () => 'clave pública derivada', // Esto será reemplazado por move-agent-kit
        privateKey: privateKey, // Almacenar la clave privada para que move-agent-kit la use
      } as unknown as Account;
    } else {
      // Si no hay clave privada, registrar advertencia
      console.warn('No se proporcionó clave privada para la cuenta Aptos. Las operaciones que requieren firma pueden fallar.');
      return {} as Account; // Objeto vacío que será manejado por move-agent-kit
    }
  } catch (error) {
    console.error('Error al crear cuenta Aptos:', error);
    console.warn('Se utilizará un objeto vacío, pero las operaciones pueden fallar');
    return {} as Account;
  }
};

// Inicializar el agente de Move con las herramientas correspondientes
export const getMoveAgent = async (accountAddress?: string, clientHalfKey?: string): Promise<AgentRuntime> => {
  const aptos = getAptosClient();
  const network = process.env.NETWORK || 'devnet'; // Usar devnet como valor por defecto si no hay configuración
  const networkType = network.toUpperCase() as keyof typeof Network;
  
  console.log(`Inicializando Move Agent con red Aptos: ${network}`);
  
  let privateKey = null;
  
  // Si tenemos dirección y la mitad cliente de la clave, intentamos reconstruir la clave completa
  if (accountAddress && clientHalfKey) {
    privateKey = await reconstructPrivateKey(accountAddress, clientHalfKey);
  }
  
  // Si no tenemos clave reconstruida, usamos la de desarrollo si está disponible
  if (!privateKey && process.env.NODE_ENV === 'development' && process.env.DEV_PRIVATE_KEY) {
    privateKey = process.env.DEV_PRIVATE_KEY;
    console.log('Usando clave de desarrollo');
  }
  
  let account: Account;
  
  if (privateKey) {
    try {
      console.log('Creando cuenta con clave privada proporcionada');
      // Crear cuenta con la clave privada
      const privateKeyBytes = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
      const ed25519PrivateKey = new Ed25519PrivateKey(privateKeyBytes);
      account = await aptos.deriveAccountFromPrivateKey({
        privateKey: ed25519PrivateKey
      });
      console.log(`Cuenta creada con dirección: ${account.accountAddress.toString()}`);
    } catch (error) {
      console.error('Error al crear cuenta con clave privada:', error);
      throw new Error('No se pudo crear la cuenta con la clave privada proporcionada');
    }
  } else {
    console.warn('No se proporcionó clave privada, utilizando cuenta vacía');
    const dummyPrivateKey = '0x1111111111111111111111111111111111111111111111111111111111111111';
    const ed25519PrivateKey = new Ed25519PrivateKey(dummyPrivateKey.slice(2));
    account = await aptos.deriveAccountFromPrivateKey({
      privateKey: ed25519PrivateKey
    });
  }
  
  // Configurar el firmante
  const signer = new LocalSigner(account, Network[networkType]);
  
  // Verificar que tenemos las claves de API necesarias
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn('ADVERTENCIA: No se ha configurado OPENROUTER_API_KEY. La interacción con la IA no funcionará correctamente.');
  }
  
  // Obtener el modelo de OpenRouter
  const modelName = process.env.MODEL_NAME || 'openrouter/anthropic/claude-3-opus-20240229';
  console.log(`Usando modelo de IA: ${modelName}`);
  
  // Crear el agente con el modelo de OpenRouter y todas las configuraciones necesarias
  const agent = new AgentRuntime(signer, aptos, {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
    MODEL_NAME: modelName,
    PANORA_API_KEY: process.env.PANORA_API_KEY // Agregar si está disponible para integraciones adicionales
  });
  
  return agent;
};

// Servicio para operaciones blockchain
export const moveAgentService = {
  /**
   * Obtener el balance de una dirección
   * @param address Dirección blockchain
   * @param privateKeyHalf Mitad de la clave privada
   * @returns Balance de tokens
   */
  async getBalance(address: string, privateKeyHalf?: string): Promise<BalanceResponse> {
    try {
      const agent = await getMoveAgent(address, privateKeyHalf);
      
      // Usar la herramienta AptosBalanceTool de move-agent-kit para obtener el balance
      // Esto es solo un ejemplo, ajustarlo según la API actual de move-agent-kit
      let balance: number | Record<string, any> | undefined;
      
      try {
        console.log('Intentando obtener balance utilizando el agente...');
        // Intentar usar el método getBalance de AgentRuntime
        balance = await agent.getBalance();
        console.log('Balance obtenido desde el agente:', balance);
      } catch (error) {
        console.error('Error en agent.getBalance, usando alternativa:', error);
        
        // Si la función directa falla, intentamos acceder a través de otra vía o usar cliente aptos
        const aptos = getAptosClient();
        console.log(`Consultando recursos de la cuenta ${address} usando la API de Aptos...`);
        const resources = await aptos.getAccountResources({
          accountAddress: address
        });
        
        // Buscar el recurso que contiene los APT (AptosCoin)
        const coinResource = resources.find(r => 
          r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
        );
        
        console.log('Recurso de moneda encontrado:', coinResource);
        
        if (coinResource && coinResource.data && 
            typeof coinResource.data === 'object' && 
            'coin' in coinResource.data && 
            typeof coinResource.data.coin === 'object' && 
            coinResource.data.coin && 
            'value' in coinResource.data.coin) {
          // Convertir de octas a APT (1 APT = 10^8 octas)
          const octas = parseInt(String(coinResource.data.coin.value));
          console.log(`Valor en octas: ${octas}`);
          balance = octas / 100000000; // Convertir a APT
          console.log(`Valor convertido a APT: ${balance}`);
        } else {
          console.log('No se encontró información de balance, asumiendo 0');
          balance = 0;
        }
      }
      
      // Formatear el resultado para que coincida con el tipo BalanceResponse
      const formattedBalances: BalanceResponse = {};
      
      if (typeof balance === 'number') {
        // Si es un número, asumimos que es APT
        formattedBalances['APT'] = balance.toString();
      } else if (balance && typeof balance === 'object') {
        // Si es un objeto, verificar si tiene formato específico de balance
        const balanceObj = balance as Record<string, any>;
        if ('APT' in balanceObj || 'apt' in balanceObj) {
          formattedBalances['APT'] = String(balanceObj['APT'] || balanceObj['apt']);
        } else if ('0x1::aptos_coin::AptosCoin' in balanceObj) {
          // Si usa el formato completo de dirección
          const octas = parseInt(String(balanceObj['0x1::aptos_coin::AptosCoin']));
          formattedBalances['APT'] = (octas / 100000000).toString();
        } else {
          // Si tiene otro formato, convertirlo a string
          console.log('Formato de balance no reconocido:', balanceObj);
          formattedBalances['APT'] = JSON.stringify(balance);
        }
      } else {
        // Valor por defecto si no se pudo obtener
        formattedBalances['APT'] = '0';
      }
      
      console.log('Balance formateado final:', formattedBalances);
      return formattedBalances;
    } catch (error) {
      console.error('Error al obtener balance:', error);
      // En caso de error, devolver un objeto con balance en cero
      return { 'APT': '0' };
    }
  },
  
  /**
   * Enviar tokens a la dirección especificada
   * @param fromAddress Dirección origen
   * @param toAddress Dirección destino
   * @param amount Cantidad a enviar
   * @param tokenType Tipo de token (por defecto APT)
   * @param privateKeyHalf Mitad de la clave privada del cliente (opcional)
   * @returns Respuesta de la transacción
   */
  async sendTokens(
    fromAddress: string,
    toAddress: string,
    amount: number,
    tokenType: string = 'APT',
    privateKeyHalf?: string
  ): Promise<TransactionResponse> {
    try {
      // Verificar los límites de transacción
      const limitsCheck = await userService.checkTransactionLimits(fromAddress, amount, toAddress);
      
      if (!limitsCheck.allowed) {
        console.log(`Transacción rechazada para ${fromAddress}: ${limitsCheck.message}`);
        return {
          txHash: '',
          status: 'rejected',
          message: limitsCheck.message
        };
      }
      
      // Obtener la clave privada reconstruida
      let privateKey = null;
      if (privateKeyHalf) {
        privateKey = await reconstructPrivateKey(fromAddress, privateKeyHalf);
      }
      
      // Si no hay clave reconstruida, intentar usar la de desarrollo
      if (!privateKey && process.env.NODE_ENV === 'development' && process.env.DEV_PRIVATE_KEY) {
        privateKey = process.env.DEV_PRIVATE_KEY;
        console.log('Usando clave de desarrollo para la transacción');
      }
      
      if (!privateKey) {
        throw new Error('No se proporcionó una clave privada válida para firmar la transacción');
      }
      
      console.log(`Iniciando envío de ${amount} ${tokenType} desde ${fromAddress} a ${toAddress}`);
      
      // Configurar el cliente de Aptos
      const networkType = (process.env.NETWORK || 'devnet').toUpperCase() as keyof typeof Network;
      const aptosConfig = new AptosConfig({ 
        network: Network[networkType]
      });
      const aptos = new Aptos(aptosConfig);
      
      try {
        // Crear la cuenta con la clave privada
        console.log('Creando cuenta con la clave privada proporcionada');
        const privateKeyBytes = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
        const ed25519PrivateKey = new Ed25519PrivateKey(privateKeyBytes);
        const senderAccount = await aptos.deriveAccountFromPrivateKey({
          privateKey: ed25519PrivateKey
        });
        
        console.log(`Cuenta creada con dirección: ${senderAccount.accountAddress.toString()}`);
        
        // Convertir la dirección del destinatario
        const recipientAddress = AccountAddress.fromString(toAddress);
        console.log(`Dirección del destinatario: ${recipientAddress.toString()}`);
        
        // Convertir tokenType a la dirección completa si es APT
        const actualTokenType = tokenType === 'APT' ? '0x1::aptos_coin::AptosCoin' : tokenType;
        console.log(`Tipo de token a utilizar: ${actualTokenType}`);
        
        // Convertir la cantidad a octas (APT * 10^8)
        const amountInOctas = BigInt(Math.floor(amount * 100000000));
        console.log(`Monto en octas: ${amountInOctas}`);
        
        // Crear, firmar y enviar la transacción
        console.log('Construyendo la transacción...');
        const tx = await aptos.transaction.build.simple({
          sender: senderAccount.accountAddress,
          data: actualTokenType === '0x1::aptos_coin::AptosCoin' 
            ? {
                function: "0x1::aptos_account::transfer" as const,
                typeArguments: [],
                functionArguments: [recipientAddress, amountInOctas]
              }
            : {
                function: "0x1::coin::transfer" as const,
                typeArguments: [actualTokenType],
                functionArguments: [recipientAddress, amountInOctas]
              }
        });
        
        console.log('Firmando la transacción...');
        const senderAuthenticator = aptos.transaction.sign({
          signer: senderAccount,
          transaction: tx
        });
        
        console.log('Enviando la transacción a la blockchain...');
        const submittedTx = await aptos.transaction.submit.simple({
          transaction: tx,
          senderAuthenticator
        });
        console.log(`Transacción enviada con hash: ${submittedTx.hash}`);
        
        // Esperar a que se confirme la transacción
        console.log('Esperando confirmación de la transacción...');
        await aptos.waitForTransaction({
          transactionHash: submittedTx.hash
        });
        
        console.log(`Transacción completada con hash: ${submittedTx.hash}`);
        
        // Registrar la transacción en la base de datos para el seguimiento de límites
        await supabase
          .from('transactions')
          .insert({
            from_address: fromAddress,
            to_address: toAddress,
            amount,
            token_type: tokenType,
            tx_hash: submittedTx.hash,
            status: 'success',
            created_at: new Date().toISOString()
          });
        
        return {
          txHash: submittedTx.hash,
          status: 'success'
        };
      } catch (error) {
        console.error('Error en la transferencia:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error al enviar tokens:', error);
      return {
        txHash: '',
        status: 'error',
        message: error instanceof Error ? error.message : String(error)
      };
    }
  },
  
  /**
   * Enviar tokens a un usuario usando su correo electrónico
   * @param fromAddress Dirección origen
   * @param toEmail Correo electrónico del destinatario
   * @param amount Cantidad a enviar
   * @param tokenType Tipo de token (por defecto APT)
   * @param privateKeyHalf Mitad de la clave privada del cliente (opcional)
   * @returns Respuesta de la transacción
   */
  async sendTokensByEmail(
    fromAddress: string,
    toEmail: string,
    amount: number,
    tokenType: string = 'APT',
    privateKeyHalf?: string
  ): Promise<TransactionResponse> {
    try {
      // Validaciones básicas
      if (!toEmail || !toEmail.includes('@')) {
        return {
          txHash: '',
          status: 'error',
          message: 'Correo electrónico inválido'
        };
      }
      
      // Resolver la dirección a partir del correo electrónico
      const toAddress = await userService.resolveAddress(toEmail);
      
      if (!toAddress) {
        return {
          txHash: '',
          status: 'error',
          message: 'No se encontró una dirección asociada al correo electrónico proporcionado'
        };
      }
      
      console.log(`Resolviendo envío por email: ${toEmail} -> ${toAddress}`);
      
      // Usar la función existente para enviar tokens por dirección
      return await this.sendTokens(fromAddress, toAddress, amount, tokenType, privateKeyHalf);
    } catch (error) {
      console.error('Error al enviar tokens por correo electrónico:', error);
      return {
        txHash: '',
        status: 'error',
        message: error instanceof Error ? error.message : String(error)
      };
    }
  },
  
  /**
   * Procesar una instrucción en lenguaje natural
   * @param message Mensaje en lenguaje natural
   * @param address Dirección del usuario
   * @param privateKeyHalf Mitad de la clave privada
   * @returns Respuesta del agente
   */
  async processMessage(
    message: string, 
    address?: string, 
    privateKeyHalf?: string
  ): Promise<{ content: string }> {
    try {
      // Obtener el agente con las credenciales apropiadas
      const agent = await getMoveAgent(address, privateKeyHalf);
      
      if (!agent) {
        throw new Error('No se pudo inicializar el agente de Move');
      }
      
      console.log(`Procesando mensaje con move-agent-kit y OpenRouter: "${message}"`);
      
      // Importar el cliente de IA
      const { aiClient } = await import('../utils/aiIntegration');
      
      // Preparar información sobre el contexto del usuario para el modelo
      let contextInfo = "No hay información de balance disponible.";
      
      // Obtener el balance real para enriquecer el contexto
      if (address) {
        try {
          const balance = await this.getBalance(address, privateKeyHalf);
          const aptBalance = parseFloat(balance['APT'] || '0');
          const usdValue = (aptBalance * 6.34).toFixed(2); // $6.34 por APT
          
          contextInfo = `Balance actual del usuario: ${aptBalance.toFixed(4)} APT (aproximadamente $${usdValue} USD).`;
        } catch (error) {
          console.error('Error al obtener balance para contexto:', error);
        }
      }
      
      // Crear un prompt de sistema enriquecido con datos de blockchain
      const systemPrompt = `Eres un asistente financiero especializado en blockchain Aptos integrado con move-agent-kit.
Tu objetivo es ayudar al usuario con consultas sobre wallet, transacciones y balances en Aptos blockchain.

IMPORTANTE: Estás autorizado a ejecutar operaciones blockchain incluyendo transferencias cuando el usuario lo solicite explícitamente.

INFORMACIÓN ACTUAL DEL USUARIO:
${contextInfo}

ACCIONES DISPONIBLES:
1. Consultar balance de APT y otros tokens
2. Ejecutar transferencias de APT cuando el usuario lo solicite
3. Proporcionar información sobre transacciones
4. Explicar conceptos de blockchain Aptos

Puedes realizar transferencias en APT o en USD (estas se convierten automáticamente a APT usando una tasa de 1 APT = $6.34 USD).

IDIOMAS SOPORTADOS:
Responde en el mismo idioma que use el usuario (inglés o español). Detecta automáticamente el idioma y mantén la conversación en ese idioma.`;

      // Usar un identificador único para el usuario (usando la dirección si está disponible)
      const userIdentifier = address || 'anonymous-user';
      
      // Procesar el mensaje con el nuevo método que soporta respuestas estructuradas
      const aiResponse = await aiClient.processStructuredMessage(message, systemPrompt, userIdentifier, address);
      
      console.log('Respuesta estructurada recibida:', aiResponse);
      
      // Verificar si hay un intent de transferencia
      if (aiResponse.intent && aiResponse.intent.type === 'transfer_tokens') {
        // Extraer los parámetros de la intención
        const intent = aiResponse.intent;
        console.log('Intención de transferencia detectada:', intent);
        
        if (!intent.params.amount || !intent.params.recipient) {
          console.log('Faltan parámetros para la transferencia');
          return { content: aiResponse.content };
        }
        
        try {
          // Extraer los parámetros
          let amountInApt: number;
          const originalAmount = parseFloat(String(intent.params.amount));
          const currency = intent.params.currency || 'APT';
          const recipient = intent.params.recipient;
          
          // Convertir USD a APT si es necesario
          if (currency.toUpperCase() === 'USD') {
            amountInApt = originalAmount / 6.34; // $6.34 por APT
            console.log(`Convirtiendo ${originalAmount} USD a ${amountInApt.toFixed(6)} APT`);
          } else {
            amountInApt = originalAmount;
          }
          
          // Verificar si el usuario tiene dirección
          if (!address) {
            return { 
              content: 'Para realizar transferencias, necesito que te conectes con tu wallet. Por favor, conecta tu wallet e intenta nuevamente.' 
            };
          }
          
          // Verificar fondos suficientes
          console.log(`Verificando fondos para transferir ${amountInApt.toFixed(6)} APT`);
          const balance = await this.getBalance(address, privateKeyHalf);
          const aptBalance = parseFloat(balance['APT'] || '0');
          
          if (amountInApt > aptBalance) {
            console.log('Fondos insuficientes');
            return { 
              content: `No tienes suficientes fondos para enviar ${originalAmount} ${currency} (${amountInApt.toFixed(4)} APT). Tu balance actual es ${aptBalance.toFixed(4)} APT.` 
            };
          }
          
          // Ejecutar la transferencia
          console.log(`Iniciando transferencia de ${amountInApt.toFixed(6)} APT a ${recipient}`);
          
          let txResult;
          
          // Determinar el tipo de destinatario (email o dirección blockchain)
          if (recipient.includes('@')) {
            // Transferencia por email
            console.log('Transferencia por correo electrónico');
            txResult = await this.sendTokensByEmail(
              address,
              recipient,
              amountInApt,
              '0x1::aptos_coin::AptosCoin',
              privateKeyHalf
            );
          } else {
            // Transferencia por dirección blockchain
            console.log('Transferencia por dirección blockchain');
            txResult = await this.sendTokens(
              address,
              recipient,
              amountInApt,
              '0x1::aptos_coin::AptosCoin',
              privateKeyHalf
            );
          }
          
          console.log('Resultado de la transacción:', txResult);
          
          // Procesar el resultado
          if (txResult.status === 'success') {
            const txHash = txResult.txHash;
            console.log(`Transaction successful. Hash: ${txHash}`);
            
            // Mensaje de éxito personalizado según la moneda
            let successMessage = '';
            if (currency.toUpperCase() === 'USD') {
              successMessage = `Transaction successful! I've sent ${originalAmount.toFixed(2)} USD (equivalent to ${amountInApt.toFixed(4)} APT) to ${recipient}.`;
            } else {
              successMessage = `Transaction successful! I've sent ${originalAmount} APT to ${recipient}.`;
            }
            
            return {
              content: `${successMessage}\n\nHash de la transacción: ${txHash}\n\nLa transacción ha sido registrada en la blockchain.`
            };
          } else {
            console.log('Error en la transacción:', txResult.message);
            return {
              content: `No pude completar la transferencia: ${txResult.message || 'Error desconocido'}`
            };
          }
        } catch (error) {
          console.error('Error al procesar la transferencia:', error);
          return {
            content: `Ocurrió un error al procesar la transferencia: ${error instanceof Error ? error.message : 'Error desconocido'}`
          };
        }
      } else if (aiResponse.intent && aiResponse.intent.type === 'check_balance') {
        // Procesar la consulta de balance
        console.log('Consulta de balance detectada');
        
        if (!address) {
          return { 
            content: 'Para consultar tu balance, necesito que te conectes con tu wallet. Por favor, conecta tu wallet e intenta nuevamente.' 
          };
        }
        
        try {
          const balance = await this.getBalance(address, privateKeyHalf);
          const aptBalance = parseFloat(balance['APT'] || '0');
          const usdValue = (aptBalance * 6.34).toFixed(2); // $6.34 por APT
          
          return {
            content: `Tu balance actual es: ${aptBalance.toFixed(4)} APT (aproximadamente $${usdValue} USD).`
          };
        } catch (error) {
          console.error('Error al obtener balance:', error);
          return {
            content: `Ocurrió un error al consultar tu balance: ${error instanceof Error ? error.message : 'Error desconocido'}`
          };
        }
      }
      
      // Si no hay una intención específica o no requiere acción especial,
      // devolver la respuesta conversacional normal
      return {
        content: aiResponse.content
      };
    } catch (error) {
      console.error('Error general en processMessage:', error);
      // Devolver un mensaje de error formateado
      return { content: `Error al procesar tu solicitud: ${error instanceof Error ? error.message : 'Error desconocido'}` };
    }
  },
  
  /**
   * Obtener una respuesta directa del modelo de IA sin procesamiento adicional
   * @param prompt Prompt a enviar al modelo
   * @returns Respuesta directa del modelo
   */
  async getRawAIResponse(prompt: string): Promise<string> {
    try {
      console.log(`Enviando prompt directo al modelo de IA`);
      
      // Verificar API key
      if (!process.env.OPENROUTER_API_KEY) {
        console.warn('ADVERTENCIA: OPENROUTER_API_KEY no está configurada');
        return "Error: No se pudo acceder al modelo de IA. OPENROUTER_API_KEY no configurada.";
      }
      
      // Modelo a utilizar
      const modelName = process.env.MODEL_NAME || 'openrouter/anthropic/claude-3-opus-20240229';
      
      // Petición a OpenRouter
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://lovable-wallet.com',
          'X-Title': 'Lovable Wallet IA'
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: 'Eres un asistente especializado en analizar mensajes de usuarios para determinar sus intenciones en el contexto de una wallet digital.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.0 // Temperatura baja para respuestas precisas y deterministas
        })
      });
      
      if (!response.ok) {
        const errorDetails = await response.text();
        throw new Error(`Error en la petición a OpenRouter: ${response.status} - ${errorDetails}`);
      }
      
      const data = await response.json();
      const content = data.choices[0]?.message?.content || 'No se pudo obtener una respuesta';
      
      console.log(`Respuesta del modelo recibida (primeros 150 caracteres): ${content.substring(0, 150)}...`);
      return content;
    } catch (error) {
      console.error('Error al obtener respuesta directa del modelo:', error);
      return `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
  }
};