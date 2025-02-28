import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { ethers } from 'ethers';

// Define context type
interface WalletContextType {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  provider: ethers.Provider | null;
  signer: ethers.Signer | null;
  networkName: string | null;
  chainId: number | null;
  isCorrectNetwork: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
}

// Create context with default values
const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  isConnecting: false,
  address: null,
  provider: null,
  signer: null,
  networkName: null,
  chainId: null,
  isCorrectNetwork: false,
  error: null,
  connect: async () => {},
  disconnect: () => {},
  switchNetwork: async () => {}
});

// Network configuration
const SUPPORTED_NETWORKS = {
  // Sepolia testnet
  11155111: {
    chainId: '0xaa36a7',
    name: 'sepolia',
    displayName: 'Sepolia Testnet',
    rpcUrl: 'https://sepolia.infura.io/v3/your-infura-key',
    blockExplorer: 'https://sepolia.etherscan.io'
  },
  // QuarkChain L2 TestNet (for EthStorage)
  3335: {
    chainId: '0xd07',
    name: 'quarkchain',
    displayName: 'QuarkChain L2 TestNet',
    rpcUrl: 'https://rpc.beta.testnet.l2.quarkchain.io:8545/',
    blockExplorer: 'https://mainnet.quarkchain.io'
  }
};

// The target network chainId
const TARGET_CHAIN_ID = 11155111; // Sepolia

// Provider component
export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [networkName, setNetworkName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if the current network is the target network
  const isCorrectNetwork = chainId === TARGET_CHAIN_ID;

  // Initialize - check if already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          // Get current accounts
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          
          if (accounts && accounts.length > 0) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const network = await provider.getNetwork();
            const signer = await provider.getSigner();
            
            setProvider(provider);
            setSigner(signer);
            setAddress(accounts[0]);
            setChainId(Number(network.chainId));
            setNetworkName(getNetworkName(Number(network.chainId)));
            setIsConnected(true);
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };
    
    checkConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
          // Disconnected
          setIsConnected(false);
          setAddress(null);
          setSigner(null);
        } else if (accounts[0] !== address) {
          // Account changed
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          
          setAddress(accounts[0]);
          setSigner(signer);
          setIsConnected(true);
        }
      };
      
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [address]);

  // Listen for network changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleChainChanged = async (chainIdHex: string) => {
        const chainId = Number(chainIdHex);
        setChainId(chainId);
        setNetworkName(getNetworkName(chainId));
        
        // Reload the provider with the new network
        if (window.ethereum) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          setProvider(provider);
          
          if (isConnected && address) {
            const signer = await provider.getSigner();
            setSigner(signer);
          }
        }
      };
      
      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [isConnected, address]);

  // Connect wallet
  const connect = async () => {
    setError(null);
    
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('MetaMask is not installed. Please install MetaMask to connect.');
      return;
    }
    
    setIsConnecting(true);
    
    try {
      // Request accounts
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts && accounts.length > 0) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        const signer = await provider.getSigner();
        
        setProvider(provider);
        setSigner(signer);
        setAddress(accounts[0]);
        setChainId(Number(network.chainId));
        setNetworkName(getNetworkName(Number(network.chainId)));
        setIsConnected(true);
        
        // Check if on the correct network
        if (Number(network.chainId) !== TARGET_CHAIN_ID) {
          await switchNetwork();
        }
      }
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      if (error.code === 4001) {
        // User rejected the request
        setError('You rejected the connection request. Please approve the connection to use this application.');
      } else {
        setError(`Failed to connect wallet: ${error.message}`);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet (local state only, doesn't actually disconnect MetaMask)
  const disconnect = () => {
    setIsConnected(false);
    setAddress(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setNetworkName(null);
    setError(null);
  };

  // Switch to the target network
  const switchNetwork = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('MetaMask is not installed.');
      return;
    }
    
    const targetNetwork = SUPPORTED_NETWORKS[TARGET_CHAIN_ID];
    
    if (!targetNetwork) {
      setError('Target network configuration not found.');
      return;
    }
    
    try {
      // Try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetNetwork.chainId }]
      });
    } catch (switchError: any) {
      // If the network is not available, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: targetNetwork.chainId,
              chainName: targetNetwork.displayName,
              rpcUrls: [targetNetwork.rpcUrl],
              blockExplorerUrls: [targetNetwork.blockExplorer],
              nativeCurrency: {
                name: 'Ether',
                symbol: 'ETH',
                decimals: 18
              }
            }]
          });
        } catch (addError) {
          console.error('Error adding network:', addError);
          setError('Failed to add the network to MetaMask.');
        }
      } else {
        console.error('Error switching network:', switchError);
        setError('Failed to switch network. Please manually switch to the target network in MetaMask.');
      }
    }
  };
  
  // Helper function to get network name
  const getNetworkName = (id: number): string => {
    if (SUPPORTED_NETWORKS[id]) {
      return SUPPORTED_NETWORKS[id].name;
    }
    
    // Handle common networks not in our supported list
    switch (id) {
      case 1:
        return 'mainnet';
      case 5:
        return 'goerli';
      case 80001:
        return 'mumbai';
      case 421613:
        return 'arbitrum-goerli';
      default:
        return 'unknown';
    }
  };

  // Context value
  const value: WalletContextType = {
    isConnected,
    isConnecting,
    address,
    provider,
    signer,
    networkName,
    chainId,
    isCorrectNetwork,
    error,
    connect,
    disconnect,
    switchNetwork
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

// Custom hook to use wallet context
export const useWallet = () => useContext(WalletContext); 