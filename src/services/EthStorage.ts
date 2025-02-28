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
  url?: string;
  message: string;
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

  /**
   * Uploads a file to EthStorage
   * @param file The file to upload
   * @returns A promise that resolves to the upload result
   */
  async uploadFile(file: File): Promise<UploadResult> {
    try {
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);
      
      // Check if FlatDirectory is enabled
      const usingFlatDirectory = import.meta.env.VITE_WEB3URL_ENABLED === 'true';
      const flatDirectoryAddress = import.meta.env.VITE_FLAT_DIRECTORY_ADDRESS;
      
      if (usingFlatDirectory && flatDirectoryAddress) {
        // Using FlatDirectory on QuarkChain L2 testnet
        console.log('Using FlatDirectory for file upload');
        
        // Initialize contract
        const provider = new ethers.providers.JsonRpcProvider('https://rpc.beta.testnet.l2.quarkchain.io:8545/');
        const signer = new ethers.Wallet(this.privateKey, provider);
        
        // FlatDirectory ABI (simplified for our needs)
        const flatDirectoryAbi = [
          "function store(string path, bytes data, string contentType) external returns (uint256)",
          "function retrieve(string path) external view returns (bytes)",
          "function remove(string path) external",
          "function list() external view returns (string[])"
        ];
        
        const flatDirectory = new ethers.Contract(
          flatDirectoryAddress,
          flatDirectoryAbi,
          signer
        );
        
        // Create a unique path for the file
        const timestamp = Date.now();
        const filePath = `${timestamp}_${file.name}`;
        
        console.log(`Uploading file to FlatDirectory: ${filePath}`);
        
        // Upload file to FlatDirectory
        const tx = await flatDirectory.store(filePath, fileData, file.type);
        console.log(`Transaction sent: ${tx.hash}`);
        
        // Wait for transaction to be mined
        const receipt = await tx.wait();
        console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
        
        // Generate Web3URL for the file
        const web3Url = generateWeb3URL(filePath);
        
        // Register file in TrustDAI contract
        await this.trustDAIContract.registerFile(
          filePath,
          web3Url,
          file.type,
          fileData.length,
          timestamp
        );
        
        return {
          success: true,
          cid: '',
          path: filePath,
          url: web3Url,
          message: 'File uploaded successfully to FlatDirectory'
        };
      } else {
        // Legacy EthStorage upload (fallback)
        console.log('Using legacy EthStorage for file upload');
        
        // Initialize contract
        await this.initializeContract();
        
        if (!this.contract) {
          throw new Error('Contract not initialized');
        }
        
        // Upload file to EthStorage
        const tx = await this.contract.uploadFile(fileData, file.name, file.type);
        const receipt = await tx.wait();
        
        // Get CID from events
        const event = receipt.events?.find(e => e.event === 'FileUploaded');
        const cid = event?.args?.cid;
        
        if (!cid) {
          throw new Error('CID not found in transaction receipt');
        }
        
        // Register file in TrustDAI contract
        await this.trustDAIContract.registerFile(
          file.name,
          cid,
          file.type,
          fileData.length,
          Date.now()
        );
        
        return {
          success: true,
          cid,
          path: '',
          url: `https://ipfs.io/ipfs/${cid}`,
          message: 'File uploaded successfully to EthStorage'
        };
      }
    } catch (error) {
      console.error('Error uploading file to EthStorage:', error);
      return {
        success: false,
        cid: '',
        path: '',
        url: '',
        message: `Error uploading file: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Downloads a file from EthStorage
   * @param fileId The CID or path of the file to download
   * @returns A promise that resolves to the file data
   */
  async downloadFile(fileId: string): Promise<Uint8Array | null> {
    try {
      // Check if fileId is a path (for FlatDirectory) or CID (for legacy EthStorage)
      const isPath = !fileId.startsWith('Qm') && fileId.includes('/');
      
      if (isPath) {
        // Using FlatDirectory
        console.log(`Downloading file from FlatDirectory: ${fileId}`);
        
        // Check if user has access to this file
        const hasAccess = await this.trustDAIContract.hasAccess(fileId);
        if (!hasAccess) {
          throw new Error('Access denied');
        }
        
        // Initialize contract
        const flatDirectoryAddress = import.meta.env.VITE_FLAT_DIRECTORY_ADDRESS;
        if (!flatDirectoryAddress) {
          throw new Error('FlatDirectory contract address not configured');
        }
        
        const provider = new ethers.providers.JsonRpcProvider('https://rpc.beta.testnet.l2.quarkchain.io:8545/');
        
        // FlatDirectory ABI (simplified for our needs)
        const flatDirectoryAbi = [
          "function retrieve(string path) external view returns (bytes)"
        ];
        
        const flatDirectory = new ethers.Contract(
          flatDirectoryAddress,
          flatDirectoryAbi,
          provider
        );
        
        // Retrieve file from FlatDirectory
        const fileData = await flatDirectory.retrieve(fileId);
        return fileData;
      } else {
        // Legacy EthStorage download (using CID)
        console.log(`Downloading file from EthStorage: ${fileId}`);
        
        // Check if user has access to this file
        const hasAccess = await this.trustDAIContract.hasAccess(fileId);
        if (!hasAccess) {
          throw new Error('Access denied');
        }
        
        // Initialize contract
        await this.initializeContract();
        
        if (!this.contract) {
          throw new Error('Contract not initialized');
        }
        
        // Download file from EthStorage
        const fileData = await this.contract.downloadFile(fileId);
        return fileData;
      }
    } catch (error) {
      console.error('Error downloading file from EthStorage:', error);
      return null;
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

/**
 * Generates a Web3URL for accessing a file stored in EthStorage
 * @param path The path of the file in the FlatDirectory contract
 * @returns The Web3URL for accessing the file
 */
export function generateWeb3URL(path: string): string {
  const contractAddress = import.meta.env.VITE_FLAT_DIRECTORY_ADDRESS;
  const chainId = import.meta.env.VITE_FLAT_DIRECTORY_CHAIN_ID || '3337';
  const useSubdomainFormat = import.meta.env.VITE_USE_SUBDOMAIN_FORMAT === 'true';
  
  if (!contractAddress) {
    console.error('FlatDirectory contract address not configured');
    return '';
  }
  
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Generate the URL based on the format preference
  if (useSubdomainFormat) {
    // Subdomain format: https://<contract_address>.<chain_id>.w3link.io/<path>
    const contractAddressNoPrefix = contractAddress.toLowerCase().replace('0x', '');
    return `https://${contractAddressNoPrefix}.${chainId}.w3link.io/${cleanPath}`;
  } else {
    // Path format: https://eth.<chain_id>.w3link.io/ethereum:<contract_address>/<path>
    return `https://eth.${chainId}.w3link.io/ethereum:${contractAddress}/${cleanPath}`;
  }
} 