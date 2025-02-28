import React, { useState, useRef } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { isFeatureEnabled } from '../config/features';

interface AddFileProps {
  onFileAdded: () => void;
}

const AddFile: React.FC<AddFileProps> = ({ onFileAdded }) => {
  const { isConnected, isCorrectNetwork, trustDAIService } = useWallet();
  const [cid, setCid] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // New states for file handling
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<number | undefined>(undefined);
  const [fileType, setFileType] = useState<string>('');
  const [fileContent, setFileContent] = useState<string | undefined>(undefined);
  const [uploadMethod, setUploadMethod] = useState<'cid' | 'file'>('cid');
  const [enableEncryption, setEnableEncryption] = useState<boolean>(true);
  
  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trustDAIService) {
      setError('Wallet not connected or service not initialized');
      return;
    }
    
    if (uploadMethod === 'cid' && !cid.trim()) {
      setError('Please enter a valid CID');
      return;
    }
    
    if (uploadMethod === 'file' && !fileContent) {
      setError('Please select a file to upload');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (uploadMethod === 'cid') {
        // Add file to the blockchain using just the CID
        await trustDAIService.addFile(cid);
      } else {
        // In a real app, you would upload to IPFS here and get a CID back
        // For this mock, we'll use a fake CID based on the file name
        const fakeCid = `Qm${Array.from(fileName).reduce((a, c) => a + c.charCodeAt(0), 0).toString(16).padStart(44, '0')}`;
        
        // Add file with content for encryption if enabled
        await trustDAIService.addFile(
          fakeCid,
          enableEncryption && isFeatureEnabled('LIT_PROTOCOL') ? fileContent : undefined,
          fileName,
          fileSize,
          fileType
        );
        
        // Update the CID field to show the generated CID
        setCid(fakeCid);
      }
      
      // Clear form and show success message
      if (uploadMethod === 'cid') {
        setCid('');
      } else {
        setFileName('');
        setFileSize(undefined);
        setFileType('');
        setFileContent(undefined);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
      
      setSuccess('File added successfully!');
      
      // Notify parent component
      onFileAdded();
    } catch (err) {
      console.error('Error adding file:', err);
      setError('Failed to add file. Please check the CID and try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    setFileSize(file.size);
    setFileType(file.type);
    
    // Read file content
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFileContent(event.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  // If wallet not connected, show message
  if (!isConnected) {
    return (
      <div className="bg-gray-50 p-8 text-center rounded-lg">
        <p className="text-gray-600">Connect your wallet to add files</p>
      </div>
    );
  }

  // If on wrong network, show message
  if (!isCorrectNetwork) {
    return (
      <div className="bg-yellow-50 p-8 text-center rounded-lg">
        <p className="text-yellow-700">Please switch to the Sepolia Testnet to add files</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4">Add New File</h2>
      
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
        <div className="flex space-x-4 mb-4">
          <button
            type="button"
            onClick={() => setUploadMethod('cid')}
            className={`flex-1 py-2 px-4 rounded ${
              uploadMethod === 'cid'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            Add by CID
          </button>
          <button
            type="button"
            onClick={() => setUploadMethod('file')}
            className={`flex-1 py-2 px-4 rounded ${
              uploadMethod === 'file'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            Upload File
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        {uploadMethod === 'cid' ? (
          <div className="mb-4">
            <label htmlFor="cid" className="block text-sm font-medium text-gray-700 mb-1">
              IPFS Content ID (CID)
            </label>
            <input
              id="cid"
              type="text"
              value={cid}
              onChange={(e) => setCid(e.target.value)}
              placeholder="QmExampleCID..."
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter the IPFS Content ID of your file
            </p>
          </div>
        ) : (
          <div className="mb-4">
            <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
              File to Upload
            </label>
            <input
              id="file"
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
            {fileName && (
              <div className="mt-2 text-sm text-gray-600">
                <p>Name: {fileName}</p>
                <p>Size: {fileSize ? `${(fileSize / 1024).toFixed(2)} KB` : 'Unknown'}</p>
                <p>Type: {fileType || 'Unknown'}</p>
              </div>
            )}
            
            {isFeatureEnabled('LIT_PROTOCOL') && (
              <div className="mt-3">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableEncryption}
                    onChange={(e) => setEnableEncryption(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    Encrypt with Lit Protocol
                  </span>
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  Encrypts your file content so only authorized users can access it
                </p>
              </div>
            )}
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding...' : 'Add File'}
        </button>
      </form>
    </div>
  );
};

export default AddFile; 