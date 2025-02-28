import { ethers } from 'ethers';
import { isFeatureEnabled } from '../config/features';
import LitProtocolService from './LitProtocolService';

// File metadata interface
export interface FileMetadata {
  cid: string;
  name?: string;
  size?: number;
  contentType?: string;
  isEncrypted: boolean;
  encryptedCid?: string;
  encryptionData?: any;
}

// ABI for the TrustDAI contract - includes only the functions we need
const TRUSTDAI_ABI = [
  // View functions
  "function getUserFiles(address user) view returns (string[] memory)",
  "function getAccessList(string memory cid) view returns (address[] memory)",
  "function hasAccess(string memory cid) view returns (bool)",
  "function fileOwner(string memory cid) view returns (address)",
  
  // State-changing functions
  "function addFile(string memory cid)",
  "function grantAccess(string memory cid, address user)",
  "function revokeAccess(string memory cid, address user)",
  "function deleteFile(string memory cid)",
  "function updateFile(string memory oldCid, string memory newCid)",
  
  // Events
  "event FileAdded(address indexed owner, string cid)",
  "event FileDeleted(address indexed owner, string cid)",
  "event AccessGranted(address indexed owner, string cid, address indexed grantee)",
  "event AccessRevoked(address indexed owner, string cid, address indexed revoked)",
  "event FileUpdated(address indexed owner, string oldCid, string newCid)"
];

// TrustDAI contract address on Sepolia testnet
// TODO: Replace with your actual deployed contract address
const CONTRACT_ADDRESS = "0x123456789abcdef123456789abcdef123456789a";

export class TrustDAIService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private contract: ethers.Contract | null = null;
  private address: string | null = null;
  private litProtocolService: LitProtocolService | null = null;
  
  // In-memory storage for file metadata
  private fileMetadataCache: Map<string, FileMetadata> = new Map();
  
  constructor() {
    this.initializeEthers();
    // Initialize Lit Protocol service if feature is enabled
    if (isFeatureEnabled('LIT_PROTOCOL')) {
      this.litProtocolService = new LitProtocolService();
    }
  }
  
  /**
   * Initialize ethers with MetaMask
   */
  async initializeEthers() {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error("MetaMask is not installed");
    }
    
    try {
      // Create a provider
      this.provider = new ethers.BrowserProvider(window.ethereum);
      
      // Get the signer
      this.signer = await this.provider.getSigner();
      this.address = await this.signer.getAddress();
      
      // Create contract instance
      this.contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        TRUSTDAI_ABI,
        this.signer
      );
      
      console.log("Ethereum connection initialized");
      return true;
    } catch (error) {
      console.error("Error initializing ethers:", error);
      throw error;
    }
  }
  
  /**
   * Get the connected wallet address
   */
  getConnectedAddress(): string | null {
    return this.address;
  }
  
  /**
   * Get list of files owned by the current user
   */
  async getUserFiles(): Promise<string[]> {
    if (!this.contract || !this.address) {
      throw new Error("Contract or address not initialized");
    }
    
    try {
      const files = await this.contract.getUserFiles(this.address);
      return files;
    } catch (error) {
      console.error("Error getting user files:", error);
      throw error;
    }
  }
  
  /**
   * Add a new file to the blockchain
   * If Lit Protocol is enabled, encrypts the file first
   */
  async addFile(cid: string, fileContent?: string, fileName?: string, fileSize?: number, contentType?: string): Promise<void> {
    if (!this.contract) {
      throw new Error("Contract not initialized");
    }
    
    // Create metadata for the file
    const metadata: FileMetadata = {
      cid,
      name: fileName,
      size: fileSize,
      contentType,
      isEncrypted: false
    };

    try {
      // If Lit Protocol is enabled and file content is provided, encrypt the file
      if (isFeatureEnabled('LIT_PROTOCOL') && this.litProtocolService && fileContent) {
        // Encrypt the file content
        const encryptionResult = await this.litProtocolService.encryptFile(
          fileContent,
          cid,
          this.address || ''
        );
        
        // Update metadata with encryption information
        metadata.isEncrypted = true;
        metadata.encryptionData = {
          encryptedSymmetricKey: Array.from(encryptionResult.encryptedSymmetricKey),
          accessControlConditions: encryptionResult.accessControlConditions
        };
        
        // Store the encrypted content (in a real app, you would upload this to IPFS)
        // For this mock, we'll just store it in memory
        const encryptedCid = `encrypted_${cid}`;
        metadata.encryptedCid = encryptedCid;
        
        // Save metadata to cache
        this.fileMetadataCache.set(cid, metadata);
        
        // Save metadata to localStorage for persistence
        this.saveFileMetadataToStorage();
      }
      
      // Add the file to the blockchain (original CID, not encrypted CID)
      const tx = await this.contract.addFile(cid);
      await tx.wait();
      console.log("File added successfully:", cid);
    } catch (error) {
      console.error("Error adding file:", error);
      throw error;
    }
  }
  
  /**
   * Delete a file from the blockchain
   */
  async deleteFile(cid: string): Promise<void> {
    if (!this.contract) {
      throw new Error("Contract not initialized");
    }
    
    try {
      const tx = await this.contract.deleteFile(cid);
      await tx.wait();
      
      // Remove from metadata cache if exists
      this.fileMetadataCache.delete(cid);
      this.saveFileMetadataToStorage();
      
      console.log("File deleted successfully:", cid);
    } catch (error) {
      console.error("Error deleting file:", error);
      throw error;
    }
  }
  
  /**
   * Grant access to a file for another user
   */
  async grantAccess(cid: string, userAddress: string): Promise<void> {
    if (!this.contract) {
      throw new Error("Contract not initialized");
    }
    
    try {
      const tx = await this.contract.grantAccess(cid, userAddress);
      await tx.wait();
      console.log("Access granted successfully to:", userAddress);
    } catch (error) {
      console.error("Error granting access:", error);
      throw error;
    }
  }
  
  /**
   * Revoke access to a file from another user
   */
  async revokeAccess(cid: string, userAddress: string): Promise<void> {
    if (!this.contract) {
      throw new Error("Contract not initialized");
    }
    
    try {
      const tx = await this.contract.revokeAccess(cid, userAddress);
      await tx.wait();
      console.log("Access revoked successfully from:", userAddress);
    } catch (error) {
      console.error("Error revoking access:", error);
      throw error;
    }
  }
  
  /**
   * Get the list of addresses that have access to a file
   */
  async getAccessList(cid: string): Promise<string[]> {
    if (!this.contract) {
      throw new Error("Contract not initialized");
    }
    
    try {
      const accessList = await this.contract.getAccessList(cid);
      return accessList;
    } catch (error) {
      console.error("Error getting access list:", error);
      throw error;
    }
  }
  
  /**
   * Check if current user has access to a file
   */
  async hasAccess(cid: string): Promise<boolean> {
    if (!this.contract) {
      throw new Error("Contract not initialized");
    }
    
    try {
      const hasAccess = await this.contract.hasAccess(cid);
      return hasAccess;
    } catch (error) {
      console.error("Error checking access:", error);
      throw error;
    }
  }
  
  /**
   * Update a file's CID
   */
  async updateFile(oldCid: string, newCid: string): Promise<void> {
    if (!this.contract) {
      throw new Error("Contract not initialized");
    }
    
    try {
      const tx = await this.contract.updateFile(oldCid, newCid);
      await tx.wait();
      
      // Update metadata if present
      if (this.fileMetadataCache.has(oldCid)) {
        const metadata = this.fileMetadataCache.get(oldCid);
        if (metadata) {
          this.fileMetadataCache.delete(oldCid);
          this.fileMetadataCache.set(newCid, {
            ...metadata,
            cid: newCid
          });
          this.saveFileMetadataToStorage();
        }
      }
      
      console.log("File updated successfully:", oldCid, "->", newCid);
    } catch (error) {
      console.error("Error updating file:", error);
      throw error;
    }
  }
  
  /**
   * Get metadata for a file
   */
  getFileMetadata(cid: string): FileMetadata | undefined {
    return this.fileMetadataCache.get(cid);
  }
  
  /**
   * Get metadata for all files
   */
  getAllFileMetadata(): FileMetadata[] {
    return Array.from(this.fileMetadataCache.values());
  }
  
  /**
   * Decrypt a file using Lit Protocol
   */
  async decryptFile(cid: string): Promise<string | null> {
    if (!isFeatureEnabled('LIT_PROTOCOL') || !this.litProtocolService) {
      throw new Error("Lit Protocol is not enabled");
    }
    
    // Get metadata for the file
    const metadata = this.fileMetadataCache.get(cid);
    if (!metadata || !metadata.isEncrypted || !metadata.encryptionData) {
      throw new Error("File is not encrypted or missing encryption data");
    }
    
    try {
      // In a real app, you would fetch the encrypted content from IPFS using encryptedCid
      // Here we'll just simulate that
      const encryptedContent = `encrypted_This is the content of file ${cid}`;
      
      // Convert stored array back to Uint8Array
      const encryptedSymmetricKey = new Uint8Array(metadata.encryptionData.encryptedSymmetricKey);
      
      // Decrypt the file
      const decryptedContent = await this.litProtocolService.decryptFile(
        encryptedContent,
        encryptedSymmetricKey,
        metadata.encryptionData.accessControlConditions
      );
      
      return decryptedContent;
    } catch (error) {
      console.error("Error decrypting file:", error);
      return null;
    }
  }
  
  /**
   * Save file metadata to localStorage for persistence
   */
  private saveFileMetadataToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const metadataArray = Array.from(this.fileMetadataCache.entries());
      window.localStorage.setItem('trustdai_file_metadata', JSON.stringify(metadataArray));
    } catch (error) {
      console.error("Error saving file metadata to storage:", error);
    }
  }
  
  /**
   * Load file metadata from localStorage
   */
  loadFileMetadataFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const storedMetadata = window.localStorage.getItem('trustdai_file_metadata');
      if (storedMetadata) {
        const metadataArray = JSON.parse(storedMetadata) as [string, FileMetadata][];
        this.fileMetadataCache = new Map(metadataArray);
      }
    } catch (error) {
      console.error("Error loading file metadata from storage:", error);
    }
  }
}

export default TrustDAIService; 