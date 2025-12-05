import { DEFAULT_NETWORK } from '@/constants/networks';
import { storage } from '@/utils/storage';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://movya-wallet-backend-413658817628.us-central1.run.app';

export interface WalletData {
  address: string;
  privateKey?: string;
  mnemonic?: string;
}

/**
 * Generate a new Stacks wallet via backend endpoint
 * Backend uses @stacks/wallet-sdk which works properly in Node.js
 */
async function generateNewWallet(): Promise<WalletData> {
  try {
    console.log('[generateNewWallet] Calling backend to generate wallet...');

    const response = await fetch(`${BACKEND_URL}/wallet/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate wallet: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    if (!data.success || !data.wallet) {
      throw new Error('Backend failed to generate wallet');
    }

    console.log('[generateNewWallet] Wallet generated successfully by backend');

    // Use the appropriate network address (mainnet or testnet)
    const address = DEFAULT_NETWORK.isTestnet
      ? data.wallet.testnet.address
      : data.wallet.mainnet.address;

    console.log('[generateNewWallet] Address:', address);
    console.log('[generateNewWallet] Mnemonic generated:', !!data.wallet.mnemonic);

    return {
      address: address,
      privateKey: data.wallet.privateKey,
      mnemonic: data.wallet.mnemonic,
    };
  } catch (error) {
    console.error('[generateNewWallet] Error generating wallet via backend:', error);
    throw error;
  }
}

/**
 * Load wallet from storage or get from auth context
 * In the web version, wallet address comes from Google OAuth backend
 */
export async function loadWallet(): Promise<WalletData | null> {
  try {
    // Get wallet address from storage (set during Google OAuth)
    const address = storage.getString('walletAddress');
    const privateKey = storage.getString('privateKey');
    const mnemonic = storage.getString('mnemonic');

    if (!address) {
      console.log('[loadWallet] No wallet address found in storage');
      return null;
    }

    return {
      address,
      privateKey,
      mnemonic,
    };
  } catch (error) {
    console.error('[loadWallet] Error loading wallet:', error);
    return null;
  }
}

/**
 * Get wallet address
 */
export async function getWalletAddress(): Promise<string | null> {
  try {
    const address = storage.getString('walletAddress');
    return address || null;
  } catch (error) {
    console.error('[getWalletAddress] Error getting wallet address:', error);
    return null;
  }
}

/**
 * Get private key (use with caution - for signing transactions)
 */
export async function getPrivateKey(): Promise<string | null> {
  try {
    const privateKey = storage.getString('privateKey');
    return privateKey || null;
  } catch (error) {
    console.error('[getPrivateKey] Error getting private key:', error);
    return null;
  }
}

/**
 * Get mnemonic phrase (for backup/recovery)
 */
export async function getMnemonic(): Promise<string | null> {
  try {
    const mnemonic = storage.getString('mnemonic');
    return mnemonic || null;
  } catch (error) {
    console.error('[getMnemonic] Error getting mnemonic:', error);
    return null;
  }
}

/**
 * Get STX balance from Hiro API
 */
export async function getSTXBalance(address: string): Promise<number> {
  try {
    const apiUrl = DEFAULT_NETWORK.url;
    const response = await fetch(`${apiUrl}/extended/v1/address/${address}/balances`);

    if (!response.ok) {
      throw new Error(`Failed to fetch balance: ${response.statusText}`);
    }

    const data = await response.json();
    // Balance is in microSTX (6 decimals), convert to STX
    const microSTX = parseInt(data.stx.balance || '0');
    const stx = microSTX / 1_000_000;

    return stx;
  } catch (error) {
    console.error('[getSTXBalance] Error fetching STX balance:', error);
    throw error;
  }
}

/**
 * Clear wallet data (use with caution!)
 */
export async function clearWallet(): Promise<void> {
  try {
    storage.delete('walletAddress');
    storage.delete('privateKey');
    storage.delete('mnemonic');

    console.log('[clearWallet] Wallet data cleared successfully');
  } catch (error) {
    console.error('[clearWallet] Error clearing wallet:', error);
    throw error;
  }
}

/**
 * Request wallet generation (for future use if needed)
 */
export async function requestWalletGeneration(): Promise<WalletData> {
  try {
    const newWallet = await generateNewWallet();

    // Save to storage
    if (newWallet.address) {
      storage.set('walletAddress', newWallet.address);
    }
    if (newWallet.privateKey) {
      storage.set('privateKey', newWallet.privateKey);
    }
    if (newWallet.mnemonic) {
      storage.set('mnemonic', newWallet.mnemonic);
    }

    return newWallet;
  } catch (error) {
    console.error('[requestWalletGeneration] Error:', error);
    throw error;
  }
}
