import { ethers } from 'ethers';
import TrustDAIArtifact from "../contracts/artifacts/TrustDAI.json";
import dotenv from 'dotenv';

dotenv.config();

// Use the CONTRACT_ADDRESS from environment variables or set a default
const contractAddress = process.env.CONTRACT_ADDRESS;

// Make sure we have a contract address
if (!contractAddress) {
  console.warn('CONTRACT_ADDRESS not set in environment variables. TrustDAI functionality may not work properly.');
}

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
      if (!contractAddress) {
        throw new Error('TrustDAI contract address not configured. Please set CONTRACT_ADDRESS in your .env file.');
      }
      
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
    const contract = await this.initializeContract();
    const files = await contract.getUserFiles(account);
    return files;
  }

  async getAccessList(fileID: string) {
    const contract = await this.initializeContract();
    const accessList = await contract.getAccessList(fileID);
    return accessList;
  }

  // Method to check if user has access to a file
  async hasAccess(fileID: string) {
    const contract = await this.initializeContract();
    const hasAccess = await contract.hasAccess(fileID);
    return hasAccess;
  }

  // Method to get the owner of a file
  async getFileOwner(fileID: string) {
    const contract = await this.initializeContract();
    const owner = await contract.fileOwner(fileID);
    return owner;
  }

  async addFile(fileID: string){
    const contract = await this.initializeContract();
    const transaction = await contract.addFile(fileID);
    await transaction.wait();
    return transaction;
  }

  async deleteFile(fileID: string){
    const contract = await this.initializeContract();
    const transaction = await contract.deleteFile(fileID);
    await transaction.wait();
    return transaction;
  }

  async updateFile(oldFileId: string, newFileID: string){
    const contract = await this.initializeContract();
    const transaction = await contract.updateFile(oldFileId, newFileID);
    await transaction.wait();
    return transaction;
  }

  async grantAccess(fileID: string, address: string){
    const contract = await this.initializeContract();
    const transaction = await contract.grantAccess(fileID, address);
    await transaction.wait();
    return transaction;
  }

  async revokeAccess(fileID: string, address: string){
    const contract = await this.initializeContract();
    const transaction = await contract.revokeAccess(fileID, address);
    await transaction.wait();
    return transaction;
  }

  async batchFileOperations(filesToAdd: string[], oldFilesToUpdate: string[], newFilesToUpdate: string[], filesToDelete: string[]){
    const contract = await this.initializeContract();
    const transaction = await contract.batchFileOperations(filesToAdd, oldFilesToUpdate, newFilesToUpdate, filesToDelete);
    await transaction.wait();
    return transaction;
  }
}

export const trustDAIContract = new TrustDAIContract();
