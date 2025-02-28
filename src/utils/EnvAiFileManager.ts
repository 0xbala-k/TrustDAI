/**
 * EnvAiFileManager
 * 
 * Utility for the env-ai wallet to access files shared by the main user.
 * This helps enable collaboration between wallets/users.
 */

interface SharedFileMetadata {
  name?: string;
  size?: number;
  contentType?: string;
  timestamp: string;
  sharedBy: string;
  sharedTo: string;
}

interface SharedFile {
  cid: string;
  content: string;
  metadata: SharedFileMetadata;
}

export class EnvAiFileManager {
  /**
   * Get a list of all files shared with env-ai
   * @returns Array of shared files with metadata
   */
  static getSharedFiles(): SharedFile[] {
    const sharedFiles: SharedFile[] = [];
    
    if (typeof window === 'undefined') {
      return sharedFiles;
    }
    
    // Scan localStorage for shared files
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key && key.startsWith('trustdai_shared_') && !key.includes('metadata')) {
        // Extract CID from key
        const cid = key.replace('trustdai_shared_', '');
        
        // Get file content
        const content = localStorage.getItem(key) || '';
        
        // Get metadata
        const metadataKey = `trustdai_shared_metadata_${cid}`;
        const metadataJson = localStorage.getItem(metadataKey);
        
        if (metadataJson) {
          try {
            const metadata: SharedFileMetadata = JSON.parse(metadataJson);
            
            // Only include files shared with env-ai
            if (metadata.sharedTo === 'env-ai') {
              sharedFiles.push({
                cid,
                content,
                metadata
              });
            }
          } catch (err) {
            console.error(`Error parsing metadata for ${cid}:`, err);
          }
        }
      }
    }
    
    // Sort by timestamp, newest first
    return sharedFiles.sort((a, b) => {
      return new Date(b.metadata.timestamp).getTime() - new Date(a.metadata.timestamp).getTime();
    });
  }
  
  /**
   * Get a specific shared file by CID
   * @param cid - The CID of the file to retrieve
   * @returns The shared file or null if not found
   */
  static getSharedFile(cid: string): SharedFile | null {
    if (typeof window === 'undefined') {
      return null;
    }
    
    // Get file content
    const content = localStorage.getItem(`trustdai_shared_${cid}`);
    
    // Get metadata
    const metadataJson = localStorage.getItem(`trustdai_shared_metadata_${cid}`);
    
    if (content && metadataJson) {
      try {
        const metadata: SharedFileMetadata = JSON.parse(metadataJson);
        
        // Only return if shared with env-ai
        if (metadata.sharedTo === 'env-ai') {
          return {
            cid,
            content,
            metadata
          };
        }
      } catch (err) {
        console.error(`Error parsing metadata for ${cid}:`, err);
      }
    }
    
    return null;
  }
  
  /**
   * Save a shared file to the user's file system
   * @param cid - The CID of the file to save
   * @param directory - Optional directory to save to
   * @returns True if successful, false otherwise
   */
  static saveSharedFileToDirectory(cid: string, directory: string = './shared_files'): boolean {
    // This is a mock implementation since we can't directly access the file system
    // In a real implementation, this would use Node.js fs module or similar
    
    console.log(`[Mock] Saving file ${cid} to directory ${directory}`);
    
    const file = this.getSharedFile(cid);
    if (!file) {
      console.error(`File ${cid} not found or not shared with env-ai`);
      return false;
    }
    
    // Mock successful save
    console.log(`[Mock] Successfully saved ${file.metadata.name || cid} to ${directory}`);
    return true;
  }
  
  /**
   * Save all shared files to a directory
   * @param directory - Optional directory to save to
   * @returns Number of files successfully saved
   */
  static saveAllSharedFilesToDirectory(directory: string = './shared_files'): number {
    // Get all shared files
    const files = this.getSharedFiles();
    
    // Mock saving each file
    console.log(`[Mock] Saving ${files.length} files to directory ${directory}`);
    
    let savedCount = 0;
    for (const file of files) {
      if (this.saveSharedFileToDirectory(file.cid, directory)) {
        savedCount++;
      }
    }
    
    return savedCount;
  }
  
  /**
   * Delete a shared file
   * @param cid - The CID of the file to delete
   * @returns True if successful, false otherwise
   */
  static deleteSharedFile(cid: string): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    
    // Check if file exists and is shared with env-ai
    const file = this.getSharedFile(cid);
    if (!file) {
      return false;
    }
    
    // Remove file and metadata
    localStorage.removeItem(`trustdai_shared_${cid}`);
    localStorage.removeItem(`trustdai_shared_metadata_${cid}`);
    
    return true;
  }
  
  /**
   * Delete all shared files
   * @returns Number of files deleted
   */
  static deleteAllSharedFiles(): number {
    // Get all shared files
    const files = this.getSharedFiles();
    
    let deletedCount = 0;
    for (const file of files) {
      if (this.deleteSharedFile(file.cid)) {
        deletedCount++;
      }
    }
    
    return deletedCount;
  }
}

export default EnvAiFileManager; 