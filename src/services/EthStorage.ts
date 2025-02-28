import { ethers } from 'ethers';
import { trustDAIContract } from './TrustDAI';
import dotenv from 'dotenv';

dotenv.config();

// EthStorage contract ABI - simplified version for our needs
const ETHSTORAGE_ABI = [
  "function uploadFile(bytes data, string name, string contentType) external returns (string)",
  "function downloadFile(string fileId) external view returns (bytes, string, string, uint)",
  "function listFiles() external view returns (string[])",
  "function deleteFile(string fileId) external returns (bool)"
];

// Read configuration from environment variables
const ETHSTORAGE_CONTRACT_ADDRESS = process.env.ETHSTORAGE_CONTRACT_ADDRESS || "0x64003adbdf3014f7E38FC6BE752EB047b95da89A";
const ETHSTORAGE_RPC_URL = process.env.ETHSTORAGE_RPC_URL || "https://rpc.beta.testnet.l2.quarkchain.io:8545/";

export interface FileMetadata {
  name: string;
  contentType: string;
  size: number;
  cid: string;
  owner: string;
  accessList: string[];
}

export interface UploadResult {
  success: boolean;
  cid?: string;
  error?: string;
}

export interface DownloadResult {
  success: boolean;
  data?: Uint8Array;
  metadata?: FileMetadata;
  error?: string;
}

export class EthStorageService {
  private provider: ethers.BrowserProvider;
  private ethStorageProvider: ethers.JsonRpcProvider;
  private contract: ethers.Contract | null = null;
  
  constructor() {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask is not installed');
    }
    this.provider = new ethers.BrowserProvider(window.ethereum);
    
    // Initialize the EthStorage-specific provider
    this.ethStorageProvider = new ethers.JsonRpcProvider(ETHSTORAGE_RPC_URL);
  }

  // Initialize the contract with browser provider (MetaMask)
  async initializeContractBrowser() {
    if (!this.contract) {
      const signer = await this.provider.getSigner();
      this.contract = new ethers.Contract(
        ETHSTORAGE_CONTRACT_ADDRESS,
        ETHSTORAGE_ABI,
        signer
      );
    }
    return this.contract;
  }

  // Initialize contract with the EthStorage provider
  // This is useful for read operations without requiring wallet signature
  async initializeContractReadOnly() {
    return new ethers.Contract(
      ETHSTORAGE_CONTRACT_ADDRESS,
      ETHSTORAGE_ABI,
      this.ethStorageProvider
    );
  }

  async uploadFile(file: File): Promise<UploadResult> {
    try {
      // 1. Upload to EthStorage
      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      
      const contract = await this.initializeContractBrowser();
      const cid = await contract.uploadFile(data, file.name, file.type);

      // 2. Register in TrustDAI contract
      await trustDAIContract.addFile(cid);
      
      return {
        success: true,
        cid
      };
    } catch (error) {
      console.error("Error uploading file:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async downloadFile(cid: string): Promise<DownloadResult> {
    try {
      // Check access in TrustDAI first
      const hasAccess = await trustDAIContract.hasAccess(cid);
      if (!hasAccess) {
        return {
          success: false,
          error: "You don't have access to this file"
        };
      }
      
      // Download from EthStorage
      // Use read-only contract for data retrieval to avoid prompting for MetaMask signature
      const contract = await this.initializeContractReadOnly();
      const [data, name, contentType, size] = await contract.downloadFile(cid);
      
      // Get metadata from TrustDAI
      const owner = await trustDAIContract.getFileOwner(cid);
      const accessList = await trustDAIContract.getAccessList(cid);
      
      return {
        success: true,
        data,
        metadata: {
          name,
          contentType,
          size: size.toNumber(),
          cid,
          owner,
          accessList
        }
      };
    } catch (error) {
      console.error("Error downloading file:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async listUserFiles(): Promise<FileMetadata[]> {
    try {
      // Get files CIDs from TrustDAI
      const cidList = await trustDAIContract.getUserFiles();
      
      // Get full metadata for each file
      const files: FileMetadata[] = [];
      for (const cid of cidList) {
        // Use read-only contract for data retrieval
        const contract = await this.initializeContractReadOnly();
        try {
          const [_, name, contentType, size] = await contract.downloadFile(cid);
          const owner = await trustDAIContract.getFileOwner(cid);
          const accessList = await trustDAIContract.getAccessList(cid);
          
          files.push({
            name,
            contentType,
            size: size.toNumber(),
            cid,
            owner,
            accessList
          });
        } catch (error) {
          console.warn(`Error fetching metadata for file ${cid}:`, error);
          // Continue with other files even if one fails
        }
      }
      
      return files;
    } catch (error) {
      console.error("Error listing files:", error);
      return [];
    }
  }

  async deleteFile(cid: string): Promise<boolean> {
    try {
      // Delete from TrustDAI first (this will check ownership)
      await trustDAIContract.deleteFile(cid);
      
      // Then delete from EthStorage
      const contract = await this.initializeContractBrowser();
      const success = await contract.deleteFile(cid);
      
      return success;
    } catch (error) {
      console.error("Error deleting file:", error);
      return false;
    }
  }
  
  async updateFile(oldCid: string, file: File): Promise<UploadResult> {
    try {
      // 1. Upload new file to EthStorage
      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      
      const contract = await this.initializeContractBrowser();
      const newCid = await contract.uploadFile(data, file.name, file.type);

      // 2. Update in TrustDAI contract
      await trustDAIContract.updateFile(oldCid, newCid);
      
      return {
        success: true,
        cid: newCid
      };
    } catch (error) {
      console.error("Error updating file:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  async grantAccess(cid: string, address: string): Promise<boolean> {
    try {
      await trustDAIContract.grantAccess(cid, address);
      return true;
    } catch (error) {
      console.error("Error granting access:", error);
      return false;
    }
  }
  
  async revokeAccess(cid: string, address: string): Promise<boolean> {
    try {
      await trustDAIContract.revokeAccess(cid, address);
      return true;
    } catch (error) {
      console.error("Error revoking access:", error);
      return false;
    }
  }
}

export const ethStorageService = new EthStorageService(); 