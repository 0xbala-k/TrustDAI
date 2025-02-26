
import { ethers } from 'ethers';
import TokenArtifact from "./Token.json";

const tokenAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

export class TokenContract {
  private provider: ethers.BrowserProvider;
  private contract: ethers.Contract | null = null;

  constructor() {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask is not installed');
    }
    this.provider = new ethers.BrowserProvider(window.ethereum);
  }

  private async initializeContract() {
    if (!this.contract) {
      const signer = await this.provider.getSigner();
      this.contract = new ethers.Contract(
        tokenAddress,
        TokenArtifact.abi,
        signer
      );
    }
    return this.contract;
  }

  async requestAccount(forceSelection: boolean = false) {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    if (forceSelection) {
      // Force MetaMask to show the account selection popup
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });
    }
    
    return await window.ethereum.request({ 
      method: 'eth_requestAccounts'
    });
  }

  async connect() {
    const [account] = await this.requestAccount(true);
    return account;
  }

  async disconnect() {
    this.contract = null;
  }

  async getTokenData() {
    const contract = await this.initializeContract();
    const name = await contract.name();
    const symbol = await contract.symbol();
    return { name, symbol };
  }

  async getBalance() {
    const [account] = await window.ethereum.request({ method: 'eth_accounts' });
    const contract = await this.initializeContract();
    const balance = await contract.balanceOf(account);
    return balance.toString();
  }

  async transfer(to: string, amount: string) {
    const [account] = await window.ethereum.request({ method: 'eth_accounts' });
    const contract = await this.initializeContract();
    const transaction = await contract.transfer(to, amount);
    await transaction.wait();
    return transaction;
  }
}

export const tokenContract = new TokenContract();
