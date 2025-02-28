// Type definitions for window.ethereum
interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on: (event: string, handler: (...args: any[]) => void) => void;
    removeListener: (event: string, handler: (...args: any[]) => void) => void;
    selectedAddress?: string;
    isConnected?: () => boolean;
    chainId?: string;
  };
}

// Type for a MetaMask provider error
interface ProviderRpcError extends Error {
  message: string;
  code: number;
  data?: unknown;
}

// Types for RPC responses
interface RequestAccountsResponse extends Array<string> {}

// Types for chain switching
interface AddEthereumChainParameter {
  chainId: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  iconUrls?: string[];
}
