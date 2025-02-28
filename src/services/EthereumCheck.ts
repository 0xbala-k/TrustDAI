/**
 * Utility to check Ethereum provider availability
 */

export class EthereumCheck {
  static isMetaMaskInstalled(): boolean {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }

  static getProviderStatus(): { available: boolean; errorMessage?: string } {
    if (typeof window === 'undefined') {
      return { 
        available: false, 
        errorMessage: 'Window object not available (server-side rendering)' 
      };
    }

    if (typeof window.ethereum === 'undefined') {
      return { 
        available: false, 
        errorMessage: 'MetaMask not installed. Please install MetaMask to use this application.' 
      };
    }

    return { available: true };
  }
}

export default EthereumCheck; 