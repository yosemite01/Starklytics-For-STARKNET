import { useState, useEffect } from 'react';

interface DetectedWallets {
  argent: boolean;
  ready: boolean;
}

export function useWallet() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    // Check if wallet is already connected
    const savedAddress = localStorage.getItem('wallet_address');
    if (savedAddress) {
      setIsConnected(true);
      setWalletAddress(savedAddress);
    }
  }, []);

  const detectWallets = (): DetectedWallets => {
    // Check for wallet extensions in window object
    const hasArgent = !!(window as any).starknet_argentX;
    const hasReady = !!(window as any).starknet_braavos;
    
    return {
      argent: hasArgent,
      ready: hasReady
    };
  };

  const connectWallet = async (walletType: 'argent' | 'ready'): Promise<void> => {
    try {
      // Simulate wallet connection
      const mockAddress = `0x${Math.random().toString(16).substr(2, 40)}`;
      
      setIsConnected(true);
      setWalletAddress(mockAddress);
      localStorage.setItem('wallet_address', mockAddress);
      localStorage.setItem('wallet_type', walletType);
      
      console.log(`Connected to ${walletType} wallet:`, mockAddress);
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress(null);
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('wallet_type');
  };

  return {
    isConnected,
    walletAddress,
    detectWallets,
    connectWallet,
    disconnectWallet
  };
}