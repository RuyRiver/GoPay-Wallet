import { DEFAULT_NETWORK } from '@/constants/networks';
import {
  findToken,
  formatTokenAmount,
  getTokensByNetwork,
  parseContractPrincipal,
  type TokenInfo
} from '@/constants/tokens';
import { getWalletAddress } from './walletService';

export interface TokenBalance {
  symbol: string;
  name: string;
  balance: string; // Formatted balance (e.g., "10.5")
  balanceRaw: bigint; // Raw balance in smallest unit
  decimals: number;
  contractAddress?: string; // SIP-010 contract principal (undefined for native STX)
  isNative: boolean;
  networkId: string;
}

/**
 * Balance Service for Stacks Blockchain
 * Connects to Hiro API to get actual wallet balances
 */
class BalanceService {
  /**
   * Get the current wallet address
   */
  private static async getAddress(): Promise<string> {
    const address = await getWalletAddress();
    if (!address) {
      throw new Error('No wallet found. Please log in again.');
    }
    return address;
  }

  /**
   * Get STX (native token) balance from Hiro API
   */
  static async getSTXBalance(networkId: string = 'mainnet'): Promise<TokenBalance> {
    try {
      const address = await this.getAddress();
      const network = DEFAULT_NETWORK;

      const response = await fetch(`${network.url}/extended/v1/address/${address}/balances`);

      if (!response.ok) {
        throw new Error(`Failed to fetch balance: ${response.statusText}`);
      }

      const data = await response.json();

      // Balance is in microSTX (6 decimals)
      const balanceRaw = BigInt(data.stx.balance || '0');
      const stxToken = findToken('STX', networkId);

      if (!stxToken) {
        throw new Error('STX token not configured');
      }

      const balanceFormatted = formatTokenAmount(balanceRaw, stxToken);

      return {
        symbol: 'STX',
        name: 'Stacks',
        balance: balanceFormatted,
        balanceRaw,
        decimals: 6,
        isNative: true,
        networkId,
        contractAddress: undefined
      };
    } catch (error) {
      console.error('[BalanceService] Error getting STX balance:', error);
      throw error;
    }
  }

  /**
   * Get SIP-010 token balance (like sBTC, USDA)
   */
  static async getTokenBalance(
    tokenSymbol: string,
    networkId: string = 'mainnet'
  ): Promise<TokenBalance | null> {
    try {
      const address = await this.getAddress();
      const token = findToken(tokenSymbol, networkId);

      if (!token) {
        console.warn(`[BalanceService] Token ${tokenSymbol} not found for network ${networkId}`);
        return null;
      }

      if (token.isNative) {
        return this.getSTXBalance(networkId);
      }

      if (!token.contractAddress) {
        console.warn(`[BalanceService] Token ${tokenSymbol} has no contract address`);
        return null;
      }

      const network = DEFAULT_NETWORK;
      const { address: contractAddr, contractName } = parseContractPrincipal(token.contractAddress);

      // Convert address to hex for Clarity value
      const addressHex = Buffer.from(address).toString('hex');

      // Call read-only function get-balance on the SIP-010 token contract
      const readOnlyFunctionArgs = {
        sender: address,
        arguments: [`0x${addressHex}`]
      };

      const response = await fetch(
        `${network.url}/v2/contracts/call-read/${contractAddr}/${contractName}/get-balance`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(readOnlyFunctionArgs)
        }
      );

      if (!response.ok) {
        console.warn(`[BalanceService] Failed to fetch ${tokenSymbol} balance:`, response.statusText);
        return null;
      }

      const data = await response.json();

      // Parse Clarity value response
      let balanceRaw: bigint;

      if (data.okay === true && data.result) {
        // Parse hex result
        const resultHex = data.result.replace('0x', '');

        try {
          balanceRaw = BigInt(`0x${resultHex}`);
        } catch {
          console.warn(`[BalanceService] Could not parse balance for ${tokenSymbol}`);
          balanceRaw = 0n;
        }
      } else {
        balanceRaw = 0n;
      }

      const balanceFormatted = formatTokenAmount(balanceRaw, token);

      return {
        symbol: token.symbol,
        name: token.name,
        balance: balanceFormatted,
        balanceRaw,
        decimals: token.decimals,
        contractAddress: token.contractAddress,
        isNative: false,
        networkId
      };
    } catch (error) {
      console.error(`[BalanceService] Error getting ${tokenSymbol} balance:`, error);
      return null;
    }
  }

  /**
   * Get sBTC balance specifically
   */
  static async getSBTCBalance(networkId: string = 'mainnet'): Promise<TokenBalance | null> {
    return this.getTokenBalance('sBTC', networkId);
  }

  /**
   * Get USDA balance specifically
   */
  static async getUSDABalance(networkId: string = 'mainnet'): Promise<TokenBalance | null> {
    return this.getTokenBalance('USDA', networkId);
  }

  /**
   * Get all token balances for the current wallet
   * Always returns all configured tokens (STX, sBTC, USDA) even if balance is 0
   */
  static async getAllBalances(networkId: string = 'mainnet'): Promise<TokenBalance[]> {
    try {
      const balances: TokenBalance[] = [];

      // Get STX balance
      const stxBalance = await this.getSTXBalance(networkId);
      balances.push(stxBalance);

      // Get SIP-010 token balances - always include them even with 0 balance
      const tokens = getTokensByNetwork(networkId);
      const sip010Tokens = tokens.filter(t => !t.isNative);

      for (const token of sip010Tokens) {
        try {
          const tokenBalance = await this.getTokenBalance(token.symbol, networkId);
          if (tokenBalance) {
            balances.push(tokenBalance);
          } else {
            // If fetch failed, still add token with 0 balance
            balances.push({
              symbol: token.symbol,
              name: token.name,
              balance: '0',
              balanceRaw: 0n,
              decimals: token.decimals,
              contractAddress: token.contractAddress,
              isNative: false,
              networkId
            });
          }
        } catch (error) {
          // On error, add token with 0 balance so it still appears in UI
          console.warn(`[BalanceService] Error fetching ${token.symbol}, showing 0 balance:`, error);
          balances.push({
            symbol: token.symbol,
            name: token.name,
            balance: '0',
            balanceRaw: 0n,
            decimals: token.decimals,
            contractAddress: token.contractAddress,
            isNative: false,
            networkId
          });
        }
      }

      console.log(`[BalanceService] Retrieved ${balances.length} balances for network ${networkId}`);
      return balances;
    } catch (error) {
      console.error('[BalanceService] Error getting all balances:', error);
      throw error;
    }
  }

  /**
   * Get total portfolio value in USD (requires price service)
   */
  static async getPortfolioValue(networkId: string = 'mainnet'): Promise<{
    totalUSD: number;
    balances: TokenBalance[];
  }> {
    const balances = await this.getAllBalances(networkId);

    // For now, return 0 USD value - this would integrate with PriceService
    console.log('[BalanceService] Portfolio value calculation would integrate with PriceService');

    return {
      totalUSD: 0,
      balances
    };
  }

  /**
   * Check if wallet has sufficient balance for a transaction
   */
  static async hasSufficientBalance(
    tokenSymbol: string,
    amount: number,
    networkId: string = 'mainnet'
  ): Promise<{ sufficient: boolean; currentBalance: string; required: string }> {
    try {
      const balance = await this.getTokenBalance(tokenSymbol, networkId);

      if (!balance) {
        throw new Error(`Could not retrieve balance for ${tokenSymbol}`);
      }

      const currentBalance = parseFloat(balance.balance);
      const sufficient = currentBalance >= amount;

      return {
        sufficient,
        currentBalance: balance.balance,
        required: amount.toString()
      };
    } catch (error) {
      console.error('[BalanceService] Error checking sufficient balance:', error);
      return {
        sufficient: false,
        currentBalance: '0',
        required: amount.toString()
      };
    }
  }

  /**
   * Get wallet address (public method)
   */
  static async getWalletAddress(): Promise<string> {
    return this.getAddress();
  }
}

export default BalanceService;
