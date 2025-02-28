
import { ethers } from 'ethers';
import TrustDAIArtifact from "../contracts/artifacts/TrustDAI.json";
import dotenv from 'dotenv';

dotenv.config();

const contractAddress = process.env.CONTRACT_ADDRESS;

export class TrustDAIContract {
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
        contractAddress,
        TrustDAIArtifact.abi,
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

  async getUserFiles() {
    const [account] = await window.ethereum.request({ method: 'eth_accounts' });
    const files = await this.contract.getUserFiles(account);
    return files;
  }

  async getAccessList(fileID: string) {
    const balance = await this.contract.getAccessList(fileID);
    return balance.toString();
  }


  async addFile(fileID: string){
    const transaction = await this.contract.addFile(fileID);
    await transaction.wait();
    return transaction;
  }

  async deleteFile(fileID: string){
    const transaction = await this.contract.deleteFile(fileID);
    await transaction.wait();
    return transaction;
  }

  async updateFile(oldFileId: string, newFileID: string){
    const transaction = await this.contract.deleteFile(oldFileId, newFileID);
    await transaction.wait();
    return transaction;
  }

  async grantAccess(fileID: string, address: string){
    const transaction = await this.contract.grantAccess(fileID, address);
    await transaction.wait();
    return transaction;
  }

  async revokeAccess(fileID: string, address: string){
    const transaction = await this.contract.revokeAccess(fileID, address);
    await transaction.wait();
    return transaction;
  }

  async batchFileOperations(filesToAdd: string[], oldFilesToUpdate: string[], newFilesToUpdate: string[], filesToDelete: string[]){
    const transaction = await this.contract.batchFileOperations(filesToAdd, oldFilesToUpdate, newFilesToUpdate, filesToDelete);
    await transaction.wait();
    return transaction;
  }
}

export const trustDAIContract = new TrustDAIContract();
