import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';

interface FileListProps {
  onSelectFile: (cid: string) => void;
}

const FileList: React.FC<FileListProps> = ({ onSelectFile }) => {
  const { isConnected, isCorrectNetwork, trustDAIService } = useWallet();
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load files when wallet is connected and on correct network
    if (isConnected && isCorrectNetwork && trustDAIService) {
      loadFiles();
    } else {
      // Reset files if not connected
      setFiles([]);
    }
  }, [isConnected, isCorrectNetwork, trustDAIService]);

  const loadFiles = async () => {
    if (!trustDAIService) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const userFiles = await trustDAIService.getUserFiles();
      setFiles(userFiles);
    } catch (err) {
      console.error('Error loading files:', err);
      setError('Failed to load your files. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (cid: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selection when deleting
    
    if (!trustDAIService) return;
    
    if (window.confirm(`Are you sure you want to delete this file: ${cid}?`)) {
      setLoading(true);
      try {
        await trustDAIService.deleteFile(cid);
        // Remove file from list
        setFiles(files.filter(f => f !== cid));
      } catch (err) {
        console.error('Error deleting file:', err);
        setError('Failed to delete file. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Truncate CID for display
  const truncateCid = (cid: string): string => {
    if (!cid) return '';
    if (cid.length <= 16) return cid;
    return `${cid.substring(0, 8)}...${cid.substring(cid.length - 8)}`;
  };

  // If wallet not connected, show message
  if (!isConnected) {
    return (
      <div className="bg-gray-50 p-8 text-center rounded-lg">
        <p className="text-gray-600">Connect your wallet to view your files</p>
      </div>
    );
  }

  // If on wrong network, show message
  if (!isCorrectNetwork) {
    return (
      <div className="bg-yellow-50 p-8 text-center rounded-lg">
        <p className="text-yellow-700">Please switch to the Sepolia Testnet to view your files</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Your Files</h2>
        <button
          onClick={loadFiles}
          disabled={loading}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm py-1 px-3 rounded"
        >
          ↻ Refresh
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="py-8 text-center">
          <p className="text-gray-500">Loading files...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-gray-500">You don't have any files yet</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {files.map((cid) => (
            <li
              key={cid}
              onClick={() => onSelectFile(cid)}
              className="py-3 px-2 hover:bg-gray-50 rounded cursor-pointer flex justify-between items-center"
            >
              <div className="font-mono text-sm">
                {truncateCid(cid)}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={(e) => handleDeleteFile(cid, e)}
                  className="text-red-500 hover:bg-red-50 p-1 rounded"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FileList; 