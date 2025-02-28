/**
 * Utility for checking Ethereum network connections
 */

// Network IDs and names
export const NETWORKS = {
  // Main networks
  1: 'Ethereum Mainnet',
  10: 'Optimism',
  137: 'Polygon Mainnet',
  42161: 'Arbitrum One',
  
  // Test networks
  5: 'Goerli Testnet',
  11155111: 'Sepolia Testnet',
  80001: 'Polygon Mumbai',
  421613: 'Arbitrum Goerli',
  
  // QuarkChain L2 for EthStorage
  3335: 'QuarkChain L2 TestNet'
};

export const REQUIRED_NETWORKS = {
  TRUSTDAI: 11155111, // Sepolia
  ETHSTORAGE: 3335     // QuarkChain L2
};

export class NetworkCheck {
  /**
   * Get the current Ethereum network ID
   */
  static async getCurrentNetworkId(): Promise<number | null> {
    if (typeof window === 'undefined' || !window.ethereum) {
      return null;
    }
    
    try {
      const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
      return parseInt(chainIdHex, 16);
    } catch (error) {
      console.error('Error getting chain ID:', error);
      return null;
    }
  }
  
  /**
   * Check if we're connected to a specific network
   */
  static async isConnectedToNetwork(networkId: number): Promise<boolean> {
    const currentNetwork = await this.getCurrentNetworkId();
    return currentNetwork === networkId;
  }
  
  /**
   * Switch to a specific network (works for popular networks that come with MetaMask)
   */
  static async switchToNetwork(networkId: number): Promise<boolean> {
    if (typeof window === 'undefined' || !window.ethereum) {
      return false;
    }
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${networkId.toString(16)}` }],
      });
      return true;
    } catch (error) {
      console.error('Error switching network:', error);
      return false;
    }
  }
  
  /**
   * Get the current network name
   */
  static async getCurrentNetworkName(): Promise<string> {
    const networkId = await this.getCurrentNetworkId();
    if (!networkId) return 'Unknown Network';
    
    return NETWORKS[networkId] || `Chain ID: ${networkId}`;
  }
  
  /**
   * Check if we need to add the custom QuarkChain L2 network
   */
  static async addQuarkChainL2Network(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.ethereum) {
      return false;
    }
    
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${REQUIRED_NETWORKS.ETHSTORAGE.toString(16)}`,
          chainName: NETWORKS[REQUIRED_NETWORKS.ETHSTORAGE],
          nativeCurrency: {
            name: 'QKC',
            symbol: 'QKC',
            decimals: 18
          },
          rpcUrls: ['https://rpc.beta.testnet.l2.quarkchain.io:8545/'],
          blockExplorerUrls: ['https://explorer.beta.testnet.l2.quarkchain.io']
        }]
      });
      return true;
    } catch (error) {
      console.error('Error adding QuarkChain L2 network:', error);
      return false;
    }
  }
}

export default NetworkCheck; 