import {
  makeSTXTokenTransfer,
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
} from '@stacks/transactions';
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import { DEFAULT_NETWORK } from '@/constants/networks';
import { findToken, parseTokenAmount } from '@/constants/tokens';
import { getPrivateKey } from './walletService';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://movya-wallet-backend-413658817628.us-central1.run.app';

/**
 * Get Stacks network instance
 */
function getNetwork() {
  return DEFAULT_NETWORK.isTestnet ? STACKS_TESTNET : STACKS_MAINNET;
}

/**
 * Send STX (native token)
 */
export async function sendSTX(
  recipientAddress: string,
  amount: string, // Amount in STX (e.g., "1.5")
  memo?: string
): Promise<string> {
  try {
    const privateKey = await getPrivateKey();
    if (!privateKey) {
      throw new Error('No private key found. Please log in again.');
    }

    // Parse amount to microSTX (6 decimals)
    const token = findToken('STX', DEFAULT_NETWORK.networkId);
    if (!token) {
      throw new Error('STX token not configured');
    }

    const amountInMicroSTX = parseTokenAmount(amount, token);
    const network = getNetwork();

    console.log('[sendSTX] Sending', amount, 'STX to', recipientAddress);
    console.log('[sendSTX] Amount in microSTX:', amountInMicroSTX.toString());

    const txOptions = {
      recipient: recipientAddress,
      amount: amountInMicroSTX,
      senderKey: privateKey,
      network,
      memo: memo || '',
      anchorMode: AnchorMode.Any,
    };

    const transaction = await makeSTXTokenTransfer(txOptions);
    const broadcastResponse = await broadcastTransaction(transaction, network);

    if (broadcastResponse.error) {
      throw new Error(broadcastResponse.error);
    }

    console.log('[sendSTX] Transaction broadcasted:', broadcastResponse.txid);
    return broadcastResponse.txid;
  } catch (error) {
    console.error('[sendSTX] Error:', error);
    throw error;
  }
}

/**
 * Send SIP-010 token (sBTC, USDA, etc.)
 */
export async function sendToken(
  tokenSymbol: string,
  recipientAddress: string,
  amount: string, // Amount in token units (e.g., "0.5" for 0.5 sBTC)
  memo?: string
): Promise<string> {
  try {
    const privateKey = await getPrivateKey();
    if (!privateKey) {
      throw new Error('No private key found. Please log in again.');
    }

    const token = findToken(tokenSymbol, DEFAULT_NETWORK.networkId);
    if (!token || !token.contractAddress) {
      throw new Error(`Token ${tokenSymbol} not found or has no contract address`);
    }

    if (token.isNative) {
      // If it's STX, use sendSTX instead
      return sendSTX(recipientAddress, amount, memo);
    }

    const amountInSmallestUnit = parseTokenAmount(amount, token);
    const network = getNetwork();

    // Parse contract principal
    const [contractAddress, contractName] = token.contractAddress.split('.');

    console.log('[sendToken] Sending', amount, tokenSymbol, 'to', recipientAddress);
    console.log('[sendToken] Amount in smallest unit:', amountInSmallestUnit.toString());

    // TODO: Add post conditions for better security
    // For now, using PostConditionMode.Allow for compatibility
    const txOptions = {
      contractAddress,
      contractName,
      functionName: 'transfer',
      functionArgs: [
        // amount
        amountInSmallestUnit,
        // sender (will be filled by makeContractCall)
        // recipient
        recipientAddress,
        // memo (optional for some tokens)
        memo ? Buffer.from(memo) : undefined,
      ].filter(Boolean),
      senderKey: privateKey,
      network,
      postConditionMode: PostConditionMode.Allow,
      anchorMode: AnchorMode.Any,
    };

    const transaction = await makeContractCall(txOptions as any);
    const broadcastResponse = await broadcastTransaction(transaction, network);

    if (broadcastResponse.error) {
      throw new Error(broadcastResponse.error);
    }

    console.log('[sendToken] Transaction broadcasted:', broadcastResponse.txid);
    return broadcastResponse.txid;
  } catch (error) {
    console.error('[sendToken] Error:', error);
    throw error;
  }
}

/**
 * Send transaction by email (resolves email to address via backend)
 */
export async function sendByEmail(
  recipientEmail: string,
  amount: string,
  tokenSymbol: string = 'STX',
  memo?: string
): Promise<string> {
  try {
    console.log('[sendByEmail] Resolving email to address:', recipientEmail);

    // Get recipient's address from backend
    const response = await fetch(
      `${BACKEND_URL}/user/address-by-email/${encodeURIComponent(recipientEmail)}`
    );

    if (!response.ok) {
      throw new Error('Failed to resolve email to address');
    }

    const data = await response.json();
    if (!data.success || !data.data.address) {
      throw new Error('Email not found in system');
    }

    const recipientAddress = data.data.address;
    console.log('[sendByEmail] Resolved to address:', recipientAddress);

    // Send transaction to the resolved address
    if (tokenSymbol === 'STX') {
      return sendSTX(recipientAddress, amount, memo);
    } else {
      return sendToken(tokenSymbol, recipientAddress, amount, memo);
    }
  } catch (error) {
    console.error('[sendByEmail] Error:', error);
    throw error;
  }
}

/**
 * Check if email exists in the system
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/user/check-email/${encodeURIComponent(email)}`
    );

    const data = await response.json();
    return data.success && data.data.exists;
  } catch (error) {
    console.error('[checkEmailExists] Error:', error);
    return false;
  }
}

/**
 * Generic send function that handles both email and address
 */
export async function send(
  recipient: string,
  amount: string,
  tokenSymbol: string = 'STX',
  memo?: string
): Promise<string> {
  // Check if recipient is an email
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient);

  if (isEmail) {
    return sendByEmail(recipient, amount, tokenSymbol, memo);
  } else {
    // It's a Stacks address
    if (tokenSymbol === 'STX') {
      return sendSTX(recipient, amount, memo);
    } else {
      return sendToken(tokenSymbol, recipient, amount, memo);
    }
  }
}

export default {
  sendSTX,
  sendToken,
  sendByEmail,
  checkEmailExists,
  send,
};
