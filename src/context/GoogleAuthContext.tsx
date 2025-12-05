import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage } from '../utils/storage';

// Backend URL from environment
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://movya-wallet-backend-413658817628.us-central1.run.app';

// Network from environment
const NETWORK = import.meta.env.VITE_STACKS_NETWORK || 'mainnet';

/**
 * Request testnet STX from faucet
 * Only works on testnet network
 */
const requestFaucet = async (address: string, userId: string): Promise<boolean> => {
  if (NETWORK !== 'testnet') {
    console.log('Faucet only available on testnet');
    return false;
  }

  try {
    console.log('Requesting faucet for address:', address);
    const response = await fetch(`${BACKEND_URL}/faucet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        network: 'testnet',
        address,
        userId,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Faucet request successful:', data);
      return true;
    } else {
      const error = await response.json();
      console.log('Faucet request failed:', error.error || error.message);
      return false;
    }
  } catch (error) {
    console.error('Error requesting faucet:', error);
    return false;
  }
};

// User information interface
interface UserInfo {
  name: string;
  email: string;
  profileImage: string;
  userId: string;
}

// Auth context interface
interface GoogleAuthContextType {
  isInitialized: boolean;
  isLoading: boolean;
  isLoggedIn: boolean;
  walletAddress: string;
  balance: number;
  userInfo: UserInfo | null;
  login: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  getBalance: () => Promise<number | undefined>;
  refreshAuth: () => Promise<void>;
}

const GoogleAuthContext = createContext<GoogleAuthContextType>({} as GoogleAuthContextType);

export const useGoogleAuth = () => useContext(GoogleAuthContext);

interface GoogleAuthProviderProps {
  children: ReactNode;
}

export const GoogleAuthProvider = ({ children }: GoogleAuthProviderProps) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState(0);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // Initialize: Check if user is already logged in
  useEffect(() => {
    const init = async () => {
      try {
        const savedUserId = storage.getString('userId');
        const savedToken = storage.getString('userToken');
        const savedWalletAddress = storage.getString('walletAddress');

        if (savedUserId && savedToken && savedWalletAddress) {
          // User is already logged in, restore session
          setIsLoggedIn(true);
          setWalletAddress(savedWalletAddress);

          // Try to get user info from storage or fetch from backend
          const savedUserName = storage.getString('userName');
          const savedUserEmail = storage.getString('userEmail');
          const savedUserImage = storage.getString('userImage');

          if (savedUserName && savedUserEmail) {
            setUserInfo({
              userId: savedUserId,
              name: savedUserName,
              email: savedUserEmail,
              profileImage: savedUserImage || '',
            });
          }

          // Fetch balance and request faucet if 0
          const currentBalance = await getBalance();
          if (currentBalance === 0 && savedWalletAddress && savedUserId) {
            console.log('Balance is 0 on init, requesting faucet...');
            await requestFaucet(savedWalletAddress, savedUserId);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    init();
  }, []);

  /**
   * Login with Google ID token
   * Sends token to backend which validates it and returns wallet info
   */
  const login = async (idToken: string) => {
    setIsLoading(true);
    try {
      // Send ID token to backend
      const response = await fetch(`${BACKEND_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }

      const responseData = await response.json();

      // Backend returns: { success: true, data: { userId, userToken, walletAddress, email, name, picture } }
      const data = responseData.data || responseData;

      if (!data.userId || !data.userToken) {
        throw new Error('Invalid response from authentication server');
      }

      // Store credentials
      storage.set('userId', data.userId);
      storage.set('userToken', data.userToken);

      // Handle wallet address - may be null if user is new
      let finalWalletAddress = data.walletAddress;

      // If no wallet address, we need to generate one
      if (!finalWalletAddress) {
        console.log('No wallet found, generating new wallet...');
        const walletResponse = await fetch(`${BACKEND_URL}/wallet/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: data.userId }),
        });

        if (walletResponse.ok) {
          const walletData = await walletResponse.json();

          // Backend returns: { success: true, wallet: { mainnet: { address }, testnet: { address }, privateKey, mnemonic } }
          // Use address based on current network
          if (NETWORK === 'testnet') {
            finalWalletAddress = walletData.wallet?.testnet?.address;
          } else {
            finalWalletAddress = walletData.wallet?.mainnet?.address;
          }

          // Store private key and mnemonic securely (don't log these!)
          if (walletData.wallet?.privateKey) {
            storage.set('privateKey', walletData.wallet.privateKey);
          }
          if (walletData.wallet?.mnemonic) {
            storage.set('mnemonic', walletData.wallet.mnemonic);
          }

          console.log('Wallet generated successfully for address:', finalWalletAddress);

          // Request faucet for new wallet on testnet
          if (finalWalletAddress) {
            await requestFaucet(finalWalletAddress, data.userId);
          }
        }
      }

      if (finalWalletAddress) {
        storage.set('walletAddress', finalWalletAddress);
      }

      // Store user info if available
      if (data.email) storage.set('userEmail', data.email);
      if (data.name) storage.set('userName', data.name);
      if (data.picture) storage.set('userImage', data.picture);

      // Update state
      setWalletAddress(finalWalletAddress || '');
      setUserInfo({
        userId: data.userId,
        name: data.name || 'User',
        email: data.email || '',
        profileImage: data.picture || '',
      });

      setIsLoggedIn(true);

      // Fetch balance and request faucet if 0
      const currentBalance = await getBalance();
      if (currentBalance === 0 && finalWalletAddress) {
        console.log('Balance is 0, requesting faucet...');
        await requestFaucet(finalWalletAddress, data.userId);
      }

      console.log('Login successful:', data.walletAddress);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout: Clear all stored data
   */
  const logout = async () => {
    setIsLoading(true);
    try {
      // Clear storage
      storage.delete('userId');
      storage.delete('userToken');
      storage.delete('walletAddress');
      storage.delete('privateKey');
      storage.delete('userName');
      storage.delete('userEmail');
      storage.delete('userImage');

      // Reset state
      setIsLoggedIn(false);
      setWalletAddress('');
      setBalance(0);
      setUserInfo(null);

      console.log('Logout successful');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get STX balance from Hiro API
   */
  const getBalance = async () => {
    const address = storage.getString('walletAddress');
    if (!address) return;

    try {
      const apiUrl = import.meta.env.VITE_STACKS_API_URL || 'https://api.mainnet.hiro.so';
      const response = await fetch(`${apiUrl}/extended/v1/address/${address}/balances`);

      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }

      const data = await response.json();

      // STX balance is in microSTX (1 STX = 1,000,000 microSTX)
      const stxBalance = parseInt(data.stx.balance) / 1_000_000;
      setBalance(stxBalance);

      return stxBalance;
    } catch (error) {
      console.error('Error getting balance:', error);
      return 0;
    }
  };

  /**
   * Refresh authentication state
   * Useful after app comes back from background
   */
  const refreshAuth = async () => {
    const savedUserId = storage.getString('userId');
    const savedToken = storage.getString('userToken');

    if (!savedUserId || !savedToken) {
      // Not logged in
      await logout();
      return;
    }

    // Refresh balance
    await getBalance();
  };

  return (
    <GoogleAuthContext.Provider
      value={{
        isInitialized,
        isLoading,
        isLoggedIn,
        walletAddress,
        balance,
        userInfo,
        login,
        logout,
        getBalance,
        refreshAuth,
      }}
    >
      {children}
    </GoogleAuthContext.Provider>
  );
};
