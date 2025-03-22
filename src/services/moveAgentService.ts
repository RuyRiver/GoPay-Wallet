/**
 * Servicio para interactuar con el Move Agent Service
 */
import { getEndpointUrl, moveAgentConfig } from '@/config/moveAgent';

// Tipos de datos para las respuestas
export interface AgentResponse {
  success: boolean;
  message: string;
  data?: {
    response: {
      content: string;
    };
    processedMessage: string;
    originalMessage: string;
  };
}

// Tipos de datos para solicitudes
export interface AgentRequest {
  message: string;
  address?: string;
}

// Servicio para comunicarse con el Move Agent
const moveAgentService = {
  /**
   * Procesar un mensaje a través del agent
   * @param message Mensaje a procesar
   * @param address Dirección de wallet opcional
   * @returns Respuesta del agente
   */
  async processMessage(message: string, address?: string): Promise<AgentResponse> {
    try {
      const response = await fetch(getEndpointUrl('process'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, address }),
        // Configurar timeout
        signal: AbortSignal.timeout(moveAgentConfig.timeout)
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error al procesar mensaje con Move Agent:', error);
      
      // Formatear el error en el formato de respuesta esperado
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido al conectar con el agente'
      };
    }
  },

  /**
   * Verificar el estado del servicio
   * @returns Estado del servicio
   */
  async checkStatus(): Promise<{ status: string; message: string; version: string; }> {
    try {
      const response = await fetch(getEndpointUrl('status'), {
        method: 'GET',
        // Timeout más corto para verificación de estado
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error al verificar estado del Move Agent Service:', error);
      return {
        status: 'error',
        message: 'No se pudo conectar con el servicio',
        version: 'desconocida'
      };
    }
  }
};

export default moveAgentService; 