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

// FlatDirectory contract ABI
const FLAT_DIRECTORY_ABI = [
  "function store(string path, bytes data) external returns (string)",
  "function retrieve(string path) external view returns (bytes)",
  "function remove(string path) external",
  "function list() external view returns (string[])"
];

// Read configuration from environment variables
const ETHSTORAGE_CONTRACT_ADDRESS = import.meta.env.VITE_ETHSTORAGE_CONTRACT_ADDRESS || "0x64003adbdf3014f7E38FC6BE752EB047b95da89A";
const ETHSTORAGE_RPC_URL = import.meta.env.VITE_ETHSTORAGE_RPC_URL || "https://rpc.beta.testnet.l2.quarkchain.io:8545/";
const FLAT_DIRECTORY_ADDRESS = import.meta.env.VITE_FLAT_DIRECTORY_ADDRESS;
const WEB3URL_ENABLED = import.meta.env.VITE_WEB3URL_ENABLED === 'true';

export interface FileMetadata {
  name: string;
  contentType: string;
  size: number;
  cid: string;
  path?: string; // Added path for FlatDirectory support
  owner: string;
  accessList: string[];
}

export interface UploadResult {
  success: boolean;
  cid?: string;
  path?: string; // Added path for FlatDirectory support
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
  private ethStorageContract: ethers.Contract | null = null;
  private flatDirectoryContract: ethers.Contract | null = null;
  private usingFlatDirectory: boolean = false;
  
  constructor() {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask is not installed');
    }
    
    this.provider = new ethers.BrowserProvider(window.ethereum);
    this.ethStorageProvider = new ethers.JsonRpcProvider(ETHSTORAGE_RPC_URL);
    
    // Determine if we're using FlatDirectory based on config
    this.usingFlatDirectory = WEB3URL_ENABLED && !!FLAT_DIRECTORY_ADDRESS;
    
    console.log(`EthStorage Service initialized. Using FlatDirectory: ${this.usingFlatDirectory}`);
  }

  // Initialize the EthStorage contract with browser provider (for transactions that require signing)
  async initializeEthStorageContract() {
    if (!this.ethStorageContract) {
      const signer = await this.provider.getSigner();
      this.ethStorageContract = new ethers.Contract(
        ETHSTORAGE_CONTRACT_ADDRESS,
        ETHSTORAGE_ABI,
        signer
      );
    }
    return this.ethStorageContract;
  }
  
  // Initialize the FlatDirectory contract with browser provider
  async initializeFlatDirectoryContract() {
    if (!this.flatDirectoryContract && FLAT_DIRECTORY_ADDRESS) {
      const signer = await this.provider.getSigner();
      this.flatDirectoryContract = new ethers.Contract(
        FLAT_DIRECTORY_ADDRESS,
        FLAT_DIRECTORY_ABI,
        signer
      );
    }
    return this.flatDirectoryContract;
  }

  // Initialize read-only contract (for view operations)
  async initializeContractReadOnly() {
    return new ethers.Contract(
      ETHSTORAGE_CONTRACT_ADDRESS,
      ETHSTORAGE_ABI,
      this.ethStorageProvider
    );
  }
  
  // Initialize read-only FlatDirectory contract
  async initializeFlatDirectoryReadOnly() {
    if (!FLAT_DIRECTORY_ADDRESS) {
      throw new Error("FlatDirectory address not configured");
    }
    
    return new ethers.Contract(
      FLAT_DIRECTORY_ADDRESS,
      FLAT_DIRECTORY_ABI,
      this.ethStorageProvider
    );
  }

  async uploadFile(file: File): Promise<UploadResult> {
    try {
      // Convert file to binary data
      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      
      let cid: string;
      let path: string;
      
      // Use FlatDirectory if enabled, otherwise fall back to regular EthStorage
      if (this.usingFlatDirectory) {
        // Create a unique path using timestamp and filename
        const timestamp = Date.now();
        path = `files/${timestamp}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
        
        // Store the file in FlatDirectory
        const flatDirContract = await this.initializeFlatDirectoryContract();
        
        // Store returns the CID
        cid = await flatDirContract.store(path, data);
        console.log(`File uploaded to FlatDirectory at path: ${path}, CID: ${cid}`);
        
        // Register in TrustDAI contract with additional metadata
        await trustDAIContract.addFile(cid, {
          path,
          name: file.name,
          contentType: file.type
        });
        
        return {
          success: true,
          cid,
          path
        };
      } else {
        // Legacy approach: Upload directly to EthStorage
        const contract = await this.initializeEthStorageContract();
        cid = await contract.uploadFile(data, file.name, file.type);

        // Register in TrustDAI contract
        await trustDAIContract.addFile(cid);
        
        return {
          success: true,
          cid
        };
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async downloadFile(cidOrPath: string): Promise<DownloadResult> {
    try {
      // Check if this is a path or a CID
      const isPath = cidOrPath.includes('/');
      
      if (this.usingFlatDirectory && isPath) {
        // This is a path for FlatDirectory
        
        // Check access in TrustDAI first (need to get CID from path)
        // This would require a mapping from paths to CIDs in TrustDAI
        // For now, we'll just proceed with the download
        
        const flatDirContract = await this.initializeFlatDirectoryReadOnly();
        const data = await flatDirContract.retrieve(cidOrPath);
        
        // Extract filename from path
        const name = cidOrPath.split('/').pop() || '';
        
        // Infer content type from filename (simplified)
        const contentType = this.inferContentType(name);
        
        // Without size information from FlatDirectory, use data length
        const size = data.length;
        
        // We don't have owner information directly from FlatDirectory
        // In a real implementation, we'd look this up from TrustDAI using the CID
        const owner = "unknown"; // Placeholder
        
        return {
          success: true,
          data,
          metadata: {
            name,
            contentType,
            size,
            cid: "unknown", // We don't have the CID from FlatDirectory retrieve
            path: cidOrPath,
            owner,
            accessList: []
          }
        };
      } else {
        // Legacy CID-based approach
        
        // Check access in TrustDAI first
        const hasAccess = await trustDAIContract.hasAccess(cidOrPath);
        if (!hasAccess) {
          return {
            success: false,
            error: "You don't have access to this file"
          };
        }
        
        // Download from EthStorage
        const contract = await this.initializeContractReadOnly();
        const [data, name, contentType, size] = await contract.downloadFile(cidOrPath);
        
        // Get metadata from TrustDAI
        const owner = await trustDAIContract.getFileOwner(cidOrPath);
        const accessList = await trustDAIContract.getAccessList(cidOrPath);
        
        return {
          success: true,
          data,
          metadata: {
            name,
            contentType,
            size: size.toNumber(),
            cid: cidOrPath,
            owner,
            accessList
          }
        };
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Helper method to infer content type from filename
  private inferContentType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    
    const mimeTypes: Record<string, string> = {
      'txt': 'text/plain',
      'html': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'json': 'application/json',
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'mp3': 'audio/mpeg',
      'mp4': 'video/mp4',
      'zip': 'application/zip'
    };
    
    return mimeTypes[extension] || 'application/octet-stream';
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
      const contract = await this.initializeEthStorageContract();
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
      
      const contract = await this.initializeEthStorageContract();
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