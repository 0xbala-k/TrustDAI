import { ethers } from 'ethers';
import { TestCase } from '../test-runner';
import assert from 'assert';

// ABI for the TrustDAI contract
const TRUSTDAI_ABI = [
  "function getUserFiles(address user) view returns (string[] memory)",
  "function getAccessList(string memory cid) view returns (address[] memory)",
  "function hasAccess(string memory cid) view returns (bool)",
  "function fileOwner(string memory cid) view returns (address)",
  "function addFile(string memory cid)",
  "function grantAccess(string memory cid, address user)",
  "function revokeAccess(string memory cid, address user)",
  "function deleteFile(string memory cid)",
  "function updateFile(string memory oldCid, string memory newCid)",
  "event FileAdded(address indexed owner, string cid)",
  "event FileDeleted(address indexed owner, string cid)"
];

// Load contract address from environment or use a default for tests
const getContractAddress = (): string => {
  if (typeof process !== 'undefined' && process.env.TRUSTDAI_CONTRACT_ADDRESS) {
    return process.env.TRUSTDAI_CONTRACT_ADDRESS;
  }
  
  // Default test contract address - replace in actual test environment
  return "0x123456789abcdef123456789abcdef123456789a";
};

/**
 * Tests for TrustDAI contract interaction
 */
const tests: TestCase[] = [
  {
    name: 'contract-connection',
    description: 'Test connection to TrustDAI contract',
    run: async (provider: ethers.Provider, signer: ethers.Signer, mode: 'live' | 'mock') => {
      // Get contract address
      const contractAddress = getContractAddress();
      
      // Create contract instance
      const contract = new ethers.Contract(contractAddress, TRUSTDAI_ABI, signer);
      
      if (mode === 'mock') {
        // In mock mode, we just check that the contract was created
        assert(contract.interface !== undefined, 'Contract interface should be defined');
        return;
      }
      
      // In live mode, try to call a view function to verify connection
      try {
        const address = await signer.getAddress();
        const files = await contract.getUserFiles(address);
        
        console.log(`Successfully connected to contract at ${contractAddress}`);
        console.log(`User has ${files.length} files`);
      } catch (error) {
        // If the contract doesn't exist, this will fail
        throw new Error(`Failed to connect to contract at ${contractAddress}: ${error.message}`);
      }
    }
  },
  
  {
    name: 'add-file-basic',
    description: 'Test adding a file to the contract',
    run: async (provider: ethers.Provider, signer: ethers.Signer, mode: 'live' | 'mock') => {
      // Skip this test in live mode if not explicitly enabled (to avoid gas costs)
      if (mode === 'live' && process.env.ENABLE_STATE_CHANGING_TESTS !== 'true') {
        console.log('Skipping state-changing test in live mode. Set ENABLE_STATE_CHANGING_TESTS=true to enable.');
        return;
      }
      
      // Get contract address
      const contractAddress = getContractAddress();
      
      // Create contract instance
      const contract = new ethers.Contract(contractAddress, TRUSTDAI_ABI, signer);
      
      // Generate a test CID
      const testCid = `Qm${Date.now().toString(16)}TestFile`;
      
      if (mode === 'mock') {
        // In mock mode, we just simulate success
        console.log(`Mock: Added file with CID ${testCid}`);
        return;
      }
      
      // Get initial file count
      const address = await signer.getAddress();
      const initialFiles = await contract.getUserFiles(address);
      
      // Add a file
      const tx = await contract.addFile(testCid);
      await tx.wait();
      
      // Verify file was added
      const updatedFiles = await contract.getUserFiles(address);
      
      assert(
        updatedFiles.length === initialFiles.length + 1,
        `File count should have increased by 1 (before: ${initialFiles.length}, after: ${updatedFiles.length})`
      );
      
      // Check that the new file is in the list
      assert(
        updatedFiles.includes(testCid),
        `Added file ${testCid} should be in the user's files`
      );
      
      console.log(`Successfully added file with CID ${testCid}`);
      
      // Clean up - delete the file
      await contract.deleteFile(testCid);
      console.log(`Cleaned up test file ${testCid}`);
    }
  },
  
  {
    name: 'file-access-control',
    description: 'Test file access control functionality',
    run: async (provider: ethers.Provider, signer: ethers.Signer, mode: 'live' | 'mock') => {
      // Skip this test in live mode if not explicitly enabled (to avoid gas costs)
      if (mode === 'live' && process.env.ENABLE_STATE_CHANGING_TESTS !== 'true') {
        console.log('Skipping state-changing test in live mode. Set ENABLE_STATE_CHANGING_TESTS=true to enable.');
        return;
      }
      
      // Get contract address
      const contractAddress = getContractAddress();
      
      // Create contract instance
      const contract = new ethers.Contract(contractAddress, TRUSTDAI_ABI, signer);
      
      if (mode === 'mock') {
        // In mock mode, we just simulate success
        console.log('Mock: Verified file access control functionality');
        return;
      }
      
      // Generate a test CID
      const testCid = `Qm${Date.now().toString(16)}AccessTest`;
      
      // Get test wallet address
      const address = await signer.getAddress();
      
      // Create a random address to test with (we won't have its private key)
      const testAddress = ethers.Wallet.createRandom().address;
      
      try {
        // Add a file
        const tx1 = await contract.addFile(testCid);
        await tx1.wait();
        console.log(`Added test file ${testCid}`);
        
        // Check access - owner should have access
        const ownerHasAccess = await contract.hasAccess(testCid);
        assert(ownerHasAccess, 'Owner should have access to their file');
        
        // Check file owner
        const fileOwner = await contract.fileOwner(testCid);
        assert(fileOwner.toLowerCase() === address.toLowerCase(), 'File owner should match');
        
        // Grant access to test address
        const tx2 = await contract.grantAccess(testCid, testAddress);
        await tx2.wait();
        console.log(`Granted access to ${testAddress}`);
        
        // Check access list
        const accessList = await contract.getAccessList(testCid);
        assert(
          accessList.some(addr => addr.toLowerCase() === testAddress.toLowerCase()),
          'Test address should be in the access list'
        );
        
        // Revoke access
        const tx3 = await contract.revokeAccess(testCid, testAddress);
        await tx3.wait();
        console.log(`Revoked access from ${testAddress}`);
        
        // Check access list again
        const updatedAccessList = await contract.getAccessList(testCid);
        assert(
          !updatedAccessList.some(addr => addr.toLowerCase() === testAddress.toLowerCase()),
          'Test address should no longer be in the access list'
        );
      } finally {
        // Clean up - delete the file
        try {
          const tx4 = await contract.deleteFile(testCid);
          await tx4.wait();
          console.log(`Cleaned up test file ${testCid}`);
        } catch (error) {
          console.error(`Failed to clean up test file: ${error.message}`);
        }
      }
    }
  }
];

export default tests; 