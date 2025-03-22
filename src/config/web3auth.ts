import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { CommonPrivateKeyProvider } from "@web3auth/base-provider";

// Aptos Testnet chain configuration
export const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.OTHER,
  chainId: "0x2", // Testnet chain ID
  rpcTarget: "https://fullnode.testnet.aptoslabs.com/v1",
  displayName: "Aptos Testnet",
  blockExplorerUrl: "https://explorer.aptoslabs.com/?network=testnet",
  ticker: "APT",
  tickerName: "Aptos",
};

// Create the private key provider for Aptos
export const privateKeyProvider = new CommonPrivateKeyProvider({
  config: { chainConfig },
});


// Web3Auth client ID - Replace with your actual client ID from Web3Auth Dashboard
export const clientId = "BJftGzkpcR_Dg_tV9A0uvAWKMHcs-j2QzfD_v-ZYP1hA0DIqRg3v1npLxKnxFkhuFtpIZ06HRORWSo21bVlpcwg"; // Test client ID - replace with your own from https://dashboard.web3auth.io

// Web3Auth network configuration
export const web3AuthNetwork = WEB3AUTH_NETWORK.SAPPHIRE_DEVNET; // Use DEVNET for testing