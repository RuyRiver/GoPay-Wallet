import { send } from './sendTransaction';
import PortfolioService from './portfolioService';
import TransactionHistoryService from './transactionHistoryService';
import type { AIResponse } from '@/types/agent';

/**
 * Wallet Action Handler
 * Executes wallet actions based on AI agent responses
 */

export interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  txHash?: string;
}

/**
 * Execute SEND action
 */
async function executeSendAction(params: AIResponse['parameters']): Promise<ActionResult> {
  try {
    const { recipientEmail, recipientAddress, amount, currency } = params;

    if (!amount || (!recipientEmail && !recipientAddress)) {
      return {
        success: false,
        message: 'Missing required parameters: amount and recipient'
      };
    }

    const recipient = recipientEmail || recipientAddress || '';
    const tokenSymbol = currency || 'STX';

    console.log('[walletActionHandler] Sending', amount, tokenSymbol, 'to', recipient);

    // Execute transaction
    const txHash = await send(recipient, amount.toString(), tokenSymbol);

    return {
      success: true,
      message: `Successfully sent ${amount} ${tokenSymbol} to ${recipient}`,
      txHash,
      data: { amount, currency: tokenSymbol, recipient, txHash }
    };
  } catch (error) {
    console.error('[walletActionHandler] Error executing SEND:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send transaction'
    };
  }
}

/**
 * Execute CHECK_BALANCE action
 */
async function executeCheckBalanceAction(params: AIResponse['parameters']): Promise<ActionResult> {
  try {
    const { currency } = params;
    const tokenSymbol = currency || 'STX';

    console.log('[walletActionHandler] Checking balance for', tokenSymbol);

    const tokenBalance = await PortfolioService.getTokenBalance(tokenSymbol, 'mainnet');

    if (!tokenBalance) {
      return {
        success: false,
        message: `Could not retrieve balance for ${tokenSymbol}`
      };
    }

    return {
      success: true,
      message: `Your ${tokenSymbol} balance is ${tokenBalance.balance} ${tokenSymbol} ($${tokenBalance.valueUSD.toFixed(2)})`,
      data: {
        balance: tokenBalance.balance,
        valueUSD: tokenBalance.valueUSD,
        currency: tokenSymbol,
        priceUSD: tokenBalance.priceUSD,
        change24h: tokenBalance.change24h
      }
    };
  } catch (error) {
    console.error('[walletActionHandler] Error checking balance:', error);
    return {
      success: false,
      message: 'Failed to retrieve balance'
    };
  }
}

/**
 * Execute VIEW_HISTORY action
 */
async function executeViewHistoryAction(): Promise<ActionResult> {
  try {
    console.log('[walletActionHandler] Fetching transaction history');

    const service = TransactionHistoryService.getInstance();
    const transactions = await service.fetchTransactionHistory(10);

    if (transactions.length === 0) {
      return {
        success: true,
        message: 'No transactions found in your history',
        data: { transactions: [] }
      };
    }

    const summary = transactions.slice(0, 5).map(tx =>
      `${tx.type === 'sent' ? '→' : '←'} ${tx.amount} ${tx.currency} (${tx.status})`
    ).join('\n');

    return {
      success: true,
      message: `Recent transactions:\n${summary}`,
      data: { transactions }
    };
  } catch (error) {
    console.error('[walletActionHandler] Error fetching history:', error);
    return {
      success: false,
      message: 'Failed to retrieve transaction history'
    };
  }
}

/**
 * Execute GET_PORTFOLIO action
 */
async function executeGetPortfolioAction(): Promise<ActionResult> {
  try {
    console.log('[walletActionHandler] Fetching portfolio');

    const portfolio = await PortfolioService.getPortfolio('mainnet');

    const summary = portfolio.tokens
      .map(token => `${token.symbol}: ${token.balance} ($${token.valueUSD.toFixed(2)})`)
      .join('\n');

    return {
      success: true,
      message: `Your portfolio (Total: $${portfolio.totalValueUSD.toFixed(2)}):\n${summary}`,
      data: {
        totalValueUSD: portfolio.totalValueUSD,
        tokens: portfolio.tokens
      }
    };
  } catch (error) {
    console.error('[walletActionHandler] Error fetching portfolio:', error);
    return {
      success: false,
      message: 'Failed to retrieve portfolio'
    };
  }
}

/**
 * Main action handler
 * Routes actions to appropriate handlers
 */
export async function executeWalletAction(aiResponse: AIResponse): Promise<ActionResult> {
  const { action, parameters } = aiResponse;

  console.log('[walletActionHandler] Executing action:', action, parameters);

  try {
    switch (action) {
      case 'SEND':
        return await executeSendAction(parameters);

      case 'CHECK_BALANCE':
        return await executeCheckBalanceAction(parameters);

      case 'VIEW_HISTORY':
        return await executeViewHistoryAction();

      case 'GET_PORTFOLIO':
        return await executeGetPortfolioAction();

      case 'SWAP':
        return {
          success: false,
          message: 'Swap functionality is not yet implemented'
        };

      case 'CLARIFY':
      case 'GREETING':
      case 'ERROR':
        // These actions don't require wallet operations
        return {
          success: true,
          message: aiResponse.message || 'Action acknowledged'
        };

      default:
        return {
          success: false,
          message: `Unknown action: ${action}`
        };
    }
  } catch (error) {
    console.error('[walletActionHandler] Unexpected error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred while executing the action'
    };
  }
}

/**
 * Check if an action requires confirmation
 */
export function requiresConfirmation(aiResponse: AIResponse): boolean {
  return aiResponse.confirmationRequired || false;
}

/**
 * Validate action parameters
 */
export function validateActionParameters(aiResponse: AIResponse): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const { action, parameters } = aiResponse;

  switch (action) {
    case 'SEND':
      if (!parameters.amount) {
        errors.push('Amount is required for SEND action');
      }
      if (!parameters.recipientEmail && !parameters.recipientAddress) {
        errors.push('Recipient email or address is required for SEND action');
      }
      break;

    case 'CHECK_BALANCE':
      // Currency is optional (defaults to STX)
      break;

    case 'VIEW_HISTORY':
    case 'GET_PORTFOLIO':
      // No parameters required
      break;
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export default {
  executeWalletAction,
  requiresConfirmation,
  validateActionParameters
};
