import { AIResponse, ActionResultInput, AgentServiceResponse } from '../types/agent';
import { storage } from '../utils/storage';

// Backend URL from environment
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://movya-wallet-backend-413658817628.us-central1.run.app';

console.log('[agentApi] Using backend URL:', BACKEND_URL);

/**
 * Sends a message to the AI agent chat endpoint.
 * @param message The user's message.
 * @param currentState The previous conversation state (if any).
 * @returns The agent's response.
 */
export const sendMessageToAgent = async (
  message: string,
  currentState: AIResponse | null
): Promise<AgentServiceResponse> => {
  const token = storage.getString('userToken');
  const userId = storage.getString('userId');

  console.log(`[agentApi] Sending message to ${BACKEND_URL}/agent/chat`);
  console.log('[agentApi] Current state being sent:', currentState);
  console.log('[agentApi] Using userId:', userId);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add token if it exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    console.warn('[agentApi] No authentication token found. Proceeding without it.');
  }

  try {
    const response = await fetch(`${BACKEND_URL}/agent/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message,
        currentState,
        userId: userId || undefined,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[agentApi] Error ${response.status} from /agent/chat:`, errorBody);
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const data: AgentServiceResponse = await response.json();
    console.log('[agentApi] Received response from /agent/chat:', data);
    return data;
  } catch (error: any) {
    console.error(`[agentApi] Network error calling ${BACKEND_URL}/agent/chat:`, error.message || error);
    throw error;
  }
};

/**
 * Reports the result of a frontend action to the AI agent with enriched interactive elements.
 * @param userMessage The original user message
 * @param actionResult The action execution result
 * @param originalResponse The original AI response
 * @returns Enhanced response with interactive elements
 */
export const reportEnrichedActionResult = async (
  userMessage: string,
  actionResult: any,
  originalResponse: AIResponse
): Promise<{
  responseMessage: string;
  enrichedResponse?: {
    quickActions?: any[];
    richContent?: any;
    expectsResponse?: boolean;
  };
}> => {
  const token = storage.getString('userToken');
  const userId = storage.getString('userId');

  console.log(`[agentApi] Reporting enriched action result to ${BACKEND_URL}/agent/report_enriched_result`);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    console.warn('[agentApi] No authentication token found. Proceeding without it.');
  }

  const response = await fetch(`${BACKEND_URL}/agent/report_enriched_result`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      userMessage,
      actionResult,
      originalResponse,
      userId: userId || undefined,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[agentApi] Error ${response.status} from /agent/report_enriched_result:`, errorBody);
    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();
  console.log('[agentApi] Received enriched response from /agent/report_enriched_result:', data);
  return data;
};

/**
 * Reports the result of a frontend action to the AI agent.
 * @param resultData The structured result data.
 * @returns The agent's natural language response regarding the result.
 */
export const reportActionResult = async (
  resultData: ActionResultInput
): Promise<{ responseMessage: string }> => {
  const token = storage.getString('userToken');
  const userId = storage.getString('userId');

  console.log(`[agentApi] Reporting action result to ${BACKEND_URL}/agent/report_result:`, resultData);
  console.log('[agentApi] Using userId:', userId);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add token if it exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    console.warn('[agentApi] No authentication token found. Proceeding without it.');
  }

  const response = await fetch(`${BACKEND_URL}/agent/report_result`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ...resultData,
      userId: userId || undefined,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[agentApi] Error ${response.status} from /agent/report_result:`, errorBody);
    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const data: { responseMessage: string } = await response.json();
  console.log('[agentApi] Received response from /agent/report_result:', data);
  return data;
};
