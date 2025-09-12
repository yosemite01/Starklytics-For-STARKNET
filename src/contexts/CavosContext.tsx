import { createContext, useContext, ReactNode } from 'react';

// Mock Cavos types until real SDK is available
interface CavosUser {
  id: string;
  email: string;
  name: string;
  provider: string;
}

interface CavosWallet {
  address: string;
  isDeployed: boolean;
}

interface CavosContextType {
  user: CavosUser | null;
  wallet: CavosWallet | null;
  isLoading: boolean;
  login: (provider: 'google' | 'twitter' | 'apple' | 'email') => Promise<void>;
  logout: () => Promise<void>;
  signTransaction: (transaction: any) => Promise<string>;
}

const CavosContext = createContext<CavosContextType | undefined>(undefined);

export const useCavos = () => {
  const context = useContext(CavosContext);
  if (!context) {
    throw new Error('useCavos must be used within CavosProvider');
  }
  return context;
};

interface CavosProviderProps {
  children: ReactNode;
  clientId: string;
}

export const CavosProvider = ({ children, clientId }: CavosProviderProps) => {
  // Mock implementation - replace with real Cavos SDK
  const mockLogin = async (provider: string) => {
    console.log(`Logging in with ${provider} via Cavos...`);
    // Simulate login process
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const mockLogout = async () => {
    console.log('Logging out from Cavos...');
  };

  const mockSignTransaction = async (transaction: any) => {
    console.log('Signing transaction with Cavos wallet:', transaction);
    return '0x' + Math.random().toString(16).substr(2, 8);
  };

  const value: CavosContextType = {
    user: null, // Will be populated after real integration
    wallet: null,
    isLoading: false,
    login: mockLogin,
    logout: mockLogout,
    signTransaction: mockSignTransaction,
  };

  return (
    <CavosContext.Provider value={value}>
      {children}
    </CavosContext.Provider>
  );
};