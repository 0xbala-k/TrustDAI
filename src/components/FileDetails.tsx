import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { isFeatureEnabled } from '../config/features';
import { FileMetadata } from '../services/TrustDAIService';

interface FileDetailsProps {
  selectedCid: string | null;
}

const FileDetails: React.FC<FileDetailsProps> = ({ selectedCid }) => {
  const { isConnected, isCorrectNetwork, trustDAIService } = useWallet();
  const [accessList, setAccessList] = useState<string[]>([]);
  const [newAddress, setNewAddress] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isLoadingAccess, setIsLoadingAccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fileOwner, setFileOwner] = useState<string | null>(null);
  
  // File metadata and decryption states
  const [fileMetadata, setFileMetadata] = useState<FileMetadata | null>(null);
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [showDecryptedContent, setShowDecryptedContent] = useState<boolean>(false);

  // Load access list and metadata when selected file changes
  useEffect(() => {
    if (selectedCid && isConnected && isCorrectNetwork && trustDAIService) {
      loadAccessList();
      loadFileMetadata();
    } else {
      // Reset if no file selected
      setAccessList([]);
      setFileOwner(null);
      setFileMetadata(null);
      setDecryptedContent(null);
      setShowDecryptedContent(false);
    }
  }, [selectedCid, isConnected, isCorrectNetwork, trustDAIService]);

  const loadAccessList = async () => {
    if (!selectedCid || !trustDAIService) return;
    
    setIsLoadingAccess(true);
    setError(null);
    
    try {
      // Get access list for file
      const list = await trustDAIService.getAccessList(selectedCid);
      setAccessList(list);
      
      // Get file owner
      const owner = await trustDAIService.contract.fileOwner(selectedCid);
      setFileOwner(owner);
    } catch (err) {
      console.error('Error loading access list:', err);
      setError('Failed to load access information.');
    } finally {
      setIsLoadingAccess(false);
    }
  };
  
  const loadFileMetadata = () => {
    if (!selectedCid || !trustDAIService) return;
    
    // Get metadata from TrustDAIService
    const metadata = trustDAIService.getFileMetadata(selectedCid);
    if (metadata) {
      setFileMetadata(metadata);
    } else {
      setFileMetadata(null);
    }
  };

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCid || !trustDAIService) {
      setError('No file selected or wallet not connected');
      return;
    }
    
    if (!newAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError('Please enter a valid Ethereum address');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Grant access to the address
      await trustDAIService.grantAccess(selectedCid, newAddress);
      
      // Update access list
      loadAccessList();
      
      // Clear form and show success message
      setNewAddress('');
      setSuccess(`Access granted to ${newAddress}`);
    } catch (err) {
      console.error('Error granting access:', err);
      setError('Failed to grant access. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = async (address: string) => {
    if (!selectedCid || !trustDAIService) {
      setError('No file selected or wallet not connected');
      return;
    }
    
    // Confirm with the user
    if (!window.confirm(`Are you sure you want to revoke access for ${address}?`)) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Revoke access
      await trustDAIService.revokeAccess(selectedCid, address);
      
      // Update access list
      loadAccessList();
      
      // Show success message
      setSuccess(`Access revoked from ${address}`);
    } catch (err) {
      console.error('Error revoking access:', err);
      setError('Failed to revoke access. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDecryptFile = async () => {
    if (!selectedCid || !trustDAIService || !isFeatureEnabled('LIT_PROTOCOL')) {
      setError('Cannot decrypt file. Encryption feature is not enabled.');
      return;
    }
    
    setIsDecrypting(true);
    setError(null);
    
    try {
      // Decrypt the file
      const content = await trustDAIService.decryptFile(selectedCid);
      
      if (content) {
        setDecryptedContent(content);
        setShowDecryptedContent(true);
        setSuccess('File decrypted successfully');
      } else {
        setError('Failed to decrypt file. You may not have access to this file.');
      }
    } catch (err) {
      console.error('Error decrypting file:', err);
      setError('Failed to decrypt file. You may not have access to this file.');
    } finally {
      setIsDecrypting(false);
    }
  };
  
  const handleDownloadDecrypted = () => {
    if (!decryptedContent || !fileMetadata) return;
    
    // Create a blob from the decrypted content
    const blob = new Blob([decryptedContent], {
      type: fileMetadata.contentType || 'text/plain'
    });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileMetadata.name || `decrypted_${selectedCid}.txt`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleExportToEnvAi = async () => {
    if (!decryptedContent || !fileMetadata) {
      setError('No decrypted content available for export');
      return;
    }
    
    // For this simulation, we'll just create a file in localStorage that env-ai can access
    try {
      // Save decrypted content to a shared storage
      localStorage.setItem(`trustdai_shared_${selectedCid}`, decryptedContent);
      
      // Also store metadata for the file
      localStorage.setItem(`trustdai_shared_metadata_${selectedCid}`, JSON.stringify({
        name: fileMetadata.name,
        size: fileMetadata.size,
        contentType: fileMetadata.contentType,
        timestamp: new Date().toISOString(),
        sharedBy: trustDAIService?.getConnectedAddress() || 'unknown',
        sharedTo: 'env-ai'
      }));
      
      setSuccess('File exported to env-ai successfully');
    } catch (err) {
      console.error('Error exporting file:', err);
      setError('Failed to export file to env-ai');
    }
  };

  // Helper to truncate address
  const truncateAddress = (addr: string): string => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  if (!selectedCid) {
    return (
      <div className="bg-gray-50 p-8 text-center rounded-lg">
        <p className="text-gray-600">Select a file to view details</p>
      </div>
    );
  }

  // If wallet not connected, show message
  if (!isConnected) {
    return (
      <div className="bg-gray-50 p-8 text-center rounded-lg">
        <p className="text-gray-600">Connect your wallet to view file details</p>
      </div>
    );
  }

  // If on wrong network, show message
  if (!isCorrectNetwork) {
    return (
      <div className="bg-yellow-50 p-8 text-center rounded-lg">
        <p className="text-yellow-700">Please switch to the Sepolia Testnet to view file details</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4">File Details</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">File CID</h3>
        <div className="font-mono text-sm bg-gray-50 p-2 rounded break-all">
          {selectedCid}
        </div>
      </div>
      
      {fileMetadata && (
        <div className="mb-4 p-3 bg-blue-50 rounded">
          <h3 className="text-lg font-medium mb-2">File Information</h3>
          {fileMetadata.name && (
            <p className="text-sm"><span className="font-medium">Name:</span> {fileMetadata.name}</p>
          )}
          {fileMetadata.size !== undefined && (
            <p className="text-sm"><span className="font-medium">Size:</span> {(fileMetadata.size / 1024).toFixed(2)} KB</p>
          )}
          {fileMetadata.contentType && (
            <p className="text-sm"><span className="font-medium">Type:</span> {fileMetadata.contentType}</p>
          )}
          <p className="text-sm">
            <span className="font-medium">Encryption:</span> 
            {fileMetadata.isEncrypted ? (
              <span className="text-green-700 ml-1">Enabled</span>
            ) : (
              <span className="text-gray-500 ml-1">Not encrypted</span>
            )}
          </p>
          
          {fileMetadata.isEncrypted && isFeatureEnabled('LIT_PROTOCOL') && (
            <div className="mt-3">
              {!decryptedContent ? (
                <button
                  onClick={handleDecryptFile}
                  disabled={isDecrypting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDecrypting ? 'Decrypting...' : 'Decrypt File'}
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={handleDownloadDecrypted}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition"
                  >
                    Download Decrypted File
                  </button>
                  <button
                    onClick={handleExportToEnvAi}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded transition"
                  >
                    Export to env-ai
                  </button>
                  <button
                    onClick={() => setShowDecryptedContent(!showDecryptedContent)}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded transition"
                  >
                    {showDecryptedContent ? 'Hide Content' : 'Show Content'}
                  </button>
                  
                  {showDecryptedContent && (
                    <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                      <h4 className="font-medium mb-1">File Content:</h4>
                      <pre className="text-xs overflow-auto max-h-40 p-2 bg-gray-100 rounded">
                        {decryptedContent}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {fileOwner && (
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Owner</h3>
          <div className="font-mono text-sm bg-gray-50 p-2 rounded">
            {fileOwner}
          </div>
        </div>
      )}
      
      <h3 className="text-lg font-medium mb-2">Access List</h3>
      {isLoadingAccess ? (
        <p className="text-gray-500 text-center py-3">Loading access list...</p>
      ) : accessList.length === 0 ? (
        <p className="text-gray-500 text-center py-3">No one has access to this file yet</p>
      ) : (
        <ul className="divide-y divide-gray-200 mb-4">
          {accessList.map((address) => (
            <li key={address} className="py-3 flex justify-between items-center">
              <div className="font-mono">
                <span className={fileOwner && address === fileOwner ? 'font-bold' : ''}>
                  {truncateAddress(address)}
                </span>
                {fileOwner && address === fileOwner && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    Owner
                  </span>
                )}
              </div>
              {fileOwner && address !== fileOwner && (
                <button
                  onClick={() => handleRevokeAccess(address)}
                  disabled={loading}
                  className="text-red-500 hover:bg-red-50 px-2 py-1 rounded transition"
                >
                  Revoke
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      
      <h3 className="text-lg font-medium mb-2">Grant Access</h3>
      <form onSubmit={handleGrantAccess} className="space-y-3">
        <div>
          <input
            type="text"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            placeholder="0x... Ethereum Address"
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Grant Access'}
        </button>
      </form>
    </div>
  );
};

export default FileDetails; 