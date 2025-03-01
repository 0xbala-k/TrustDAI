import { ethers } from "ethers";
import TrustDAIArtifact from "../contracts/artifacts/TrustDAI.json";

export class TrustDAIContract {
  private provider: ethers.BrowserProvider;
  private contract: ethers.Contract | null = null;

  constructor() {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("MetaMask is not installed");
    }
    this.provider = new ethers.BrowserProvider(window.ethereum);
  }

  // Initialize contract with a provided address
  async initializeContract(contractAddress: string) {
    if (!this.contract) {
      const signer = await this.provider.getSigner();
      this.contract = new ethers.Contract(contractAddress, TrustDAIArtifact.abi, signer);
    }
    return this.contract;
  }

  async getSigner() {
    return this.provider.getSigner();
  }

  async getSignerAddress() {
    const [account] = await window.ethereum.request({ method: "eth_accounts" });
    return account;
  }

  async requestAccount(forceSelection: boolean = false) {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }
    if (forceSelection) {
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
    }
    return await window.ethereum.request({ method: "eth_requestAccounts" });
  }

  async connect() {
    const [account] = await this.requestAccount(true);
    return account;
  }

  async disconnect() {
    this.contract = null;
  }

  async getUserFiles() {
    if (!this.contract) throw new Error("Contract not initialized");
    const [account] = await window.ethereum.request({ method: "eth_accounts" });
    return await this.contract.getUserFiles(account);
  }

  async getOwner(fileID: string) {
    if (!this.contract) throw new Error("Contract not initialized");
    const owner = await this.contract.fileOwner(fileID);
    return owner;
  }

  async getAccessList(fileID: string) {
    if (!this.contract) throw new Error("Contract not initialized");
    const accessList = await this.contract.getAccessList(fileID);
    return accessList; // Return as-is (array of addresses)
  }

  async addFile(fileID: string) {
    if (!this.contract) throw new Error("Contract not initialized");
    const transaction = await this.contract.addFile(fileID);
    const receipt = await transaction.wait();
    if (receipt.status !== 1) {
      throw new Error("Transaction failed");
    }
    return receipt;
  }

  async deleteFile(fileID: string) {
    if (!this.contract) throw new Error("Contract not initialized");
    const transaction = await this.contract.deleteFile(fileID);
    const receipt = await transaction.wait();
    if (receipt.status !== 1) {
      throw new Error("Transaction failed");
    }
    return receipt;
  }

  async updateFile(oldFileId: string, newFileID: string) {
    if (!this.contract) throw new Error("Contract not initialized");
    const transaction = await this.contract.updateFile(oldFileId, newFileID);
    const receipt = await transaction.wait();
    if (receipt.status !== 1) {
      throw new Error("Transaction failed");
    }
    return receipt;
  }

  async grantAccess(fileID: string, address: string) {
    if (!this.contract) throw new Error("Contract not initialized");
    const transaction = await this.contract.grantAccess(fileID, address);
    const receipt = await transaction.wait();
    if (receipt.status !== 1) {
      throw new Error("Transaction failed");
    }
    return receipt;
  }

  async revokeAccess(fileID: string, address: string) {
    if (!this.contract) throw new Error("Contract not initialized");
    const transaction = await this.contract.revokeAccess(fileID, address);
    const receipt = await transaction.wait();
    if (receipt.status !== 1) {
      throw new Error("Transaction failed");
    }
    return receipt;
  }

  async batchFileOperations(filesToAdd: string[], oldFilesToUpdate: string[], newFilesToUpdate: string[], filesToDelete: string[]) {
    if (!this.contract) throw new Error("Contract not initialized");
    const transaction = await this.contract.batchFileOperations(filesToAdd, oldFilesToUpdate, newFilesToUpdate, filesToDelete);
    const receipt = await transaction.wait();
    if (receipt.status !== 1) {
      throw new Error("Transaction failed");
    }
    return receipt;
  }
}

export const trustDAIContract = new TrustDAIContract();