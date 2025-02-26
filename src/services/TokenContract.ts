
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
      this.contract = new ethers.Contract(
        tokenAddress,
        TokenArtifact.abi,
        this.provider
      );
    }
    return this.contract;
  }

  async requestAccount() {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }
    return await window.ethereum.request({ method: 'eth_requestAccounts' });
  }

  async connect() {
    const [account] = await this.requestAccount();
    return account;
  }

  async disconnect() {
    // We don't actually disconnect from MetaMask here,
    // we just clean up our event listeners
  }

  async getTokenData() {
    const contract = await this.initializeContract();
    const name = await contract.name();
    const symbol = await contract.symbol();
    return { name, symbol };
  }

  async getBalance() {
    const [account] = await this.requestAccount();
    const contract = await this.initializeContract();
    const balance = await contract.balanceOf(account);
    return balance.toString();
  }

  async transfer(to: string, amount: string) {
    await this.requestAccount();
    const contract = await this.initializeContract();
    const transaction = await contract.transfer(to, amount);
    await transaction.wait();
    return transaction;
  }
}

export const tokenContract = new TokenContract();
