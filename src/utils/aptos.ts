import { Account, Aptos, AptosConfig, Ed25519PrivateKey, Network } from "@aptos-labs/ts-sdk";

// Initialize the Aptos SDK with Testnet configuration
const config = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(config);

/**
 * Create an Aptos account from a private key
 * @param privateKey - The private key from Web3Auth
 * @returns The Aptos account and address
 */
export const getAptosAccount = (privateKey: string, legacy: boolean = true) => {
    
    // Convert hex string to Uint8Array
    const privateKeyUint8Array = new Uint8Array(
      privateKey.match(/.{1,2}/g)!.map((byte: string) => parseInt(byte, 16))
    );
    
    // Create Ed25519PrivateKey from Uint8Array
    const ed25519PrivateKey = new Ed25519PrivateKey(privateKeyUint8Array);
    
    // Create Aptos account from private key with specified scheme
    const aptosAccount = Account.fromPrivateKey({ 
      privateKey: ed25519PrivateKey,
      legacy
    });
    const aptosAccountAddress = aptosAccount.accountAddress.toString();
    
    return { aptosAccount, aptosAccountAddress };
  };

/**
 * Get the balance of an Aptos account
 * @param accountAddress - The account address
 * @returns The account balance
 */
export const getAptosBalance = async (accountAddress: string) => {
  try {
    const resources = await aptos.account.getAccountResources({ 
      accountAddress 
    });
    
    const coinResource = resources.find(
      (resource) => resource.type.includes("0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>")
    );
    
    if (!coinResource) {
      return 0;
    }
    
    // @ts-ignore - We know the structure of the coin resource
    return parseInt(coinResource.data.coin.value);
  } catch (error) {
    console.error("Error getting Aptos balance:", error);
    return 0;
  }
};

/**
 * Request an airdrop of test tokens (only works on Testnet)
 * @param accountAddress - The account address to receive tokens
 */
export const requestAirdrop = async (accountAddress: string) => {
  try {
    // This is a simplified version - in a real app, you would call the faucet API
    const response = await fetch(
      `https://faucet.testnet.aptoslabs.com/mint?amount=100000000&address=${accountAddress}`,
      { method: "POST" }
    );
    
    return response.ok;
  } catch (error) {
    console.error("Error requesting airdrop:", error);
    return false;
  }
};

/**
 * Send a transaction on Aptos
 * @param aptosAccount - The sender's Aptos account
 * @param recipientAddress - The recipient's address
 * @param amount - The amount to send
 * @returns The transaction hash
 */
export const sendTransaction = async (
  aptosAccount: Account,
  recipientAddress: string,
  amount: string
) => {
  try {
    const transaction = await aptos.transaction.build.simple({
      sender: aptosAccount.accountAddress.toString(),
      data: {
        function: "0x1::coin::transfer",
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
        functionArguments: [recipientAddress, amount],
      },
    });

    const senderAuthenticator = await aptos.transaction.sign({
      signer: aptosAccount,
      transaction,
    });

    const committedTxn = await aptos.transaction.submit.simple({
      transaction,
      senderAuthenticator,
    });

    await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
    
    return committedTxn.hash;
  } catch (error) {
    console.error("Error sending transaction:", error);
    throw error;
  }
};