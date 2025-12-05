import { generateWallet, getStxAddress } from '@stacks/wallet-sdk';
import {
  makeSTXTokenTransfer,
  broadcastTransaction,
  AnchorMode,
} from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';
import { DEFAULT_NETWORK } from '@/constants/networks';

// Faucet amount in microSTX (20 STX = 20,000,000 microSTX)
const FAUCET_AMOUNT = 20_000_000n;

// Faucet seed phrase (testnet only - not sensitive)
const FAUCET_MNEMONIC = 'turn ready gentle congress tube vote answer tragic base dizzy elbow isolate';

/**
 * Custom faucet service that sends testnet STX from a funded wallet
 * Only works on testnet network
 */
export async function requestCustomFaucet(recipientAddress: string): Promise<{
  success: boolean;
  txId?: string;
  error?: string;
}> {
  // Only allow on testnet
  if (DEFAULT_NETWORK.id !== 'testnet') {
    console.log('[Faucet] Only available on testnet');
    return { success: false, error: 'Faucet only available on testnet' };
  }

  // Validate recipient address starts with ST (testnet)
  if (!recipientAddress.startsWith('ST')) {
    console.log('[Faucet] Invalid testnet address:', recipientAddress);
    return { success: false, error: 'Invalid testnet address' };
  }

  try {
    console.log('[Faucet] Generating faucet wallet from seed...');

    // Generate wallet from mnemonic
    const wallet = await generateWallet({
      secretKey: FAUCET_MNEMONIC,
      password: '',
    });

    // Get first account
    const account = wallet.accounts[0];
    const senderAddress = getStxAddress(account, 'testnet');

    console.log('[Faucet] Faucet address:', senderAddress);
    console.log('[Faucet] Sending 20 STX to:', recipientAddress);

    // Create STX transfer transaction
    const txOptions = {
      recipient: recipientAddress,
      amount: FAUCET_AMOUNT,
      senderKey: account.stxPrivateKey,
      network: STACKS_TESTNET,
      anchorMode: AnchorMode.Any,
      memo: 'Movya Wallet Faucet',
    };

    const transaction = await makeSTXTokenTransfer(txOptions);

    // Broadcast transaction
    const broadcastResponse = await broadcastTransaction({ transaction, network: STACKS_TESTNET });

    if ('error' in broadcastResponse) {
      console.error('[Faucet] Broadcast error:', broadcastResponse.error);
      return { success: false, error: broadcastResponse.error };
    }

    console.log('[Faucet] Transaction broadcast successful:', broadcastResponse.txid);

    return {
      success: true,
      txId: broadcastResponse.txid,
    };

  } catch (error: any) {
    console.error('[Faucet] Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send faucet transaction',
    };
  }
}

/**
 * Check faucet wallet balance
 */
export async function getFaucetBalance(): Promise<number> {
  try {
    const wallet = await generateWallet({
      secretKey: FAUCET_MNEMONIC,
      password: '',
    });

    const account = wallet.accounts[0];
    const address = getStxAddress(account, 'testnet');

    const response = await fetch(
      `https://api.testnet.hiro.so/extended/v1/address/${address}/balances`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch balance');
    }

    const data = await response.json();
    return parseInt(data.stx.balance) / 1_000_000;
  } catch (error) {
    console.error('[Faucet] Error getting faucet balance:', error);
    return 0;
  }
}
