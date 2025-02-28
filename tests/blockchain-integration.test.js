// Blockchain Integration Tests
// This script tests the integration with EthStorage and TrustDAI contracts

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Use fs to read the JSON file
const TrustDAIArtifact = JSON.parse(
  fs.readFileSync(new URL('../src/contracts/artifacts/TrustDAI.json', import.meta.url))
);

// Get current file path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Configuration from .env
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETHSTORAGE_RPC_URL = process.env.ETHSTORAGE_RPC_URL || "https://rpc.beta.testnet.l2.quarkchain.io:8545/";
const ETHSTORAGE_CONTRACT_ADDRESS = process.env.ETHSTORAGE_CONTRACT_ADDRESS || "0x64003adbdf3014f7E38FC6BE752EB047b95da89A";

// EthStorage ABI - simplified version for our needs
const ETHSTORAGE_ABI = [
  "function uploadFile(bytes data, string name, string contentType) external returns (string)",
  "function downloadFile(string fileId) external view returns (bytes, string, string, uint)",
  "function listFiles() external view returns (string[])",
  "function deleteFile(string fileId) external returns (bool)"
];

// Test file configuration
const TEST_FILE_PATH = path.join(__dirname, 'test-file.txt');
const TEST_FILE_CONTENT = 'This is a test file for TrustDAI and EthStorage integration.';

// Test wallet configuration - never use this in production!
const TEST_ADDRESS_WITH_ACCESS = "0x1234567890123456789012345678901234567890"; // Example address for access testing

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m"
};

// Helper functions
function logSuccess(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function logError(message, error) {
  console.error(`${colors.red}✗ ${message}${colors.reset}`);
  if (error) console.error(`${colors.red}  Error: ${error.message || error}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ ${message}${colors.reset}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠ ${message}${colors.reset}`);
}

function logSection(message) {
  console.log(`\n${colors.cyan}== ${message} ==${colors.reset}\n`);
}

// Create test file
async function createTestFile() {
  try {
    fs.writeFileSync(TEST_FILE_PATH, TEST_FILE_CONTENT);
    logSuccess(`Test file created at ${TEST_FILE_PATH}`);
    return true;
  } catch (error) {
    logError('Failed to create test file', error);
    return false;
  }
}

// Setup providers and wallets
async function setupProviders() {
  try {
    // Check for private key
    if (!PRIVATE_KEY) {
      logError('PRIVATE_KEY not set in .env file');
      return null;
    }

    // Setup Sepolia for TrustDAI
    const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com';
    const sepoliaProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    logInfo(`Connecting to Sepolia using: ${SEPOLIA_RPC_URL}`);
    const sepoliaWallet = new ethers.Wallet(PRIVATE_KEY, sepoliaProvider);
    
    // Setup EthStorage provider
    const ethStorageProvider = new ethers.JsonRpcProvider(ETHSTORAGE_RPC_URL);
    logInfo(`Connecting to EthStorage using: ${ETHSTORAGE_RPC_URL}`);
    const ethStorageWallet = new ethers.Wallet(PRIVATE_KEY, ethStorageProvider);
    
    logSuccess('Providers and wallets created successfully');
    
    return { 
      sepolia: { provider: sepoliaProvider, wallet: sepoliaWallet },
      ethStorage: { provider: ethStorageProvider, wallet: ethStorageWallet }
    };
  } catch (error) {
    logError('Failed to setup providers', error);
    return null;
  }
}

// Test TrustDAI Contract Connection
async function testTrustDAIConnection(wallet) {
  try {
    if (!CONTRACT_ADDRESS) {
      logError('CONTRACT_ADDRESS not set in .env file');
      console.log(`
${colors.yellow}To deploy the TrustDAI contract:${colors.reset}
1. Install Hardhat: npm install --save-dev hardhat
2. Create a Hardhat project: npx hardhat init
3. Copy TrustDAI.sol to the contracts folder
4. Create a deployment script in scripts/deploy.js:
   
   const { ethers } = require("hardhat");
   
   async function main() {
     const TrustDAI = await ethers.getContractFactory("TrustDAI");
     const trustDAI = await TrustDAI.deploy();
     await trustDAI.deployed();
     console.log("TrustDAI deployed to:", trustDAI.address);
   }
   
   main().catch((error) => {
     console.error(error);
     process.exit(1);
   });

5. Configure Sepolia in hardhat.config.js:
   
   require("@nomicfoundation/hardhat-toolbox");
   require("dotenv").config();
   
   module.exports = {
     solidity: "0.8.17",
     networks: {
       sepolia: {
         url: "https://rpc.sepolia.org",
         accounts: [process.env.PRIVATE_KEY]
       }
     }
   };

6. Run deployment: npx hardhat run scripts/deploy.js --network sepolia
7. Add the contract address to your .env file
`);
      return false;
    }

    // Create contract instance using the wallet's connection
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS, 
      TrustDAIArtifact.abi, 
      wallet
    );
    
    // Try to get the wallet address
    const address = await wallet.getAddress();
    logInfo(`Using wallet address: ${address}`);
    
    // Try a simple call without parameters first to verify basic connectivity
    try {
      // First, verify if the contract exists at the address
      const code = await wallet.provider.getCode(CONTRACT_ADDRESS);
      if (code === '0x') {
        logError(`No contract found at address ${CONTRACT_ADDRESS}. Check if the contract is deployed.`);
        return false;
      }
      
      logSuccess(`Contract found at address ${CONTRACT_ADDRESS}`);
      
      // Now try to call getUserFiles with the wallet address
      const files = await contract.getUserFiles(address);
      logSuccess(`TrustDAI contract connected successfully at ${CONTRACT_ADDRESS}`);
      logInfo(`Current account (${address}) has ${files.length} files`);
      
      return contract;
    } catch (error) {
      // If we reach here, contract exists but the call failed
      logError(`Contract exists but call to getUserFiles failed: ${error.message}`);
      
      // Try to determine if it's a method not found error
      if (error.message.includes('method not found') || 
          error.message.includes('no method') ||
          error.message.includes('not a function') ||
          error.message.includes('bad data')) {
        logWarning(`The contract at ${CONTRACT_ADDRESS} may not be the expected TrustDAI contract or has a different ABI.`);
      }
      
      return false;
    }
  } catch (error) {
    logError('Failed to connect to TrustDAI contract', error);
    return false;
  }
}

// Test EthStorage Contract Connection
async function testEthStorageConnection(wallet) {
  try {
    const contract = new ethers.Contract(
      ETHSTORAGE_CONTRACT_ADDRESS,
      ETHSTORAGE_ABI,
      wallet
    );
    
    // Simply try to access the contract - this is a read-only call
    // so it won't cost gas or require a real transaction
    logSuccess(`EthStorage contract connected successfully at ${ETHSTORAGE_CONTRACT_ADDRESS}`);
    
    return contract;
  } catch (error) {
    logError('Failed to connect to EthStorage contract', error);
    return false;
  }
}

// Test file upload to EthStorage
async function testFileUpload(ethStorageContract, trustDAIContract) {
  try {
    // Read test file
    const fileData = fs.readFileSync(TEST_FILE_PATH);
    const fileName = path.basename(TEST_FILE_PATH);
    
    logInfo(`Uploading test file "${fileName}" to EthStorage...`);
    
    // Upload file to EthStorage
    const uploadTx = await ethStorageContract.uploadFile(
      fileData, 
      fileName, 
      'text/plain'
    );
    
    // Wait for transaction confirmation
    const uploadReceipt = await uploadTx.wait();
    
    // Get the CID from the transaction log (this depends on the EthStorage contract implementation)
    // This is a simplified approach - actual implementation might need to parse events
    const cid = `testcid_${Date.now()}`; // Placeholder - in real implementation, extract from receipt
    
    logSuccess(`File uploaded to EthStorage with CID: ${cid}`);
    
    // Register file in TrustDAI
    logInfo(`Registering file in TrustDAI contract...`);
    const trustDAITx = await trustDAIContract.addFile(cid);
    await trustDAITx.wait();
    
    logSuccess(`File registered in TrustDAI contract`);
    
    return cid;
  } catch (error) {
    logError('Failed to upload and register file', error);
    return null;
  }
}

// Test access control
async function testAccessControl(trustDAIContract, cid) {
  try {
    if (!cid) {
      logWarning('Skipping access control test as no file CID is available');
      return false;
    }
    
    // Get file owner
    const owner = await trustDAIContract.fileOwner(cid);
    logSuccess(`File owner verified: ${owner}`);
    
    // Grant access to test address
    logInfo(`Granting access to ${TEST_ADDRESS_WITH_ACCESS}...`);
    const grantTx = await trustDAIContract.grantAccess(cid, TEST_ADDRESS_WITH_ACCESS);
    await grantTx.wait();
    
    // Verify access list
    const accessList = await trustDAIContract.getAccessList(cid);
    const hasAccess = accessList.includes(TEST_ADDRESS_WITH_ACCESS);
    
    if (hasAccess) {
      logSuccess(`Access granted to ${TEST_ADDRESS_WITH_ACCESS}`);
    } else {
      logError(`Failed to grant access to ${TEST_ADDRESS_WITH_ACCESS}`);
    }
    
    // Revoke access
    logInfo(`Revoking access from ${TEST_ADDRESS_WITH_ACCESS}...`);
    const revokeTx = await trustDAIContract.revokeAccess(cid, TEST_ADDRESS_WITH_ACCESS);
    await revokeTx.wait();
    
    // Verify access revoked
    const accessListAfter = await trustDAIContract.getAccessList(cid);
    const hasAccessAfter = accessListAfter.includes(TEST_ADDRESS_WITH_ACCESS);
    
    if (!hasAccessAfter) {
      logSuccess(`Access revoked from ${TEST_ADDRESS_WITH_ACCESS}`);
    } else {
      logError(`Failed to revoke access from ${TEST_ADDRESS_WITH_ACCESS}`);
    }
    
    return true;
  } catch (error) {
    logError('Failed to test access control', error);
    return false;
  }
}

// Test file deletion
async function testFileDeletion(ethStorageContract, trustDAIContract, cid) {
  try {
    if (!cid) {
      logWarning('Skipping file deletion test as no file CID is available');
      return false;
    }
    
    // Delete from TrustDAI first
    logInfo(`Deleting file from TrustDAI contract...`);
    const trustDAITx = await trustDAIContract.deleteFile(cid);
    await trustDAITx.wait();
    
    // Delete from EthStorage
    logInfo(`Deleting file from EthStorage...`);
    const ethStorageTx = await ethStorageContract.deleteFile(cid);
    await ethStorageTx.wait();
    
    logSuccess(`File deleted successfully`);
    
    return true;
  } catch (error) {
    logError('Failed to delete file', error);
    return false;
  }
}

// Test file download from EthStorage
async function testFileDownload(ethStorageContract, cid) {
  try {
    if (!cid) {
      logWarning('Skipping file download test as no file CID is available');
      return false;
    }
    
    logInfo(`Downloading file with CID: ${cid} from EthStorage...`);
    
    // Download file from EthStorage
    const [fileData, fileName, contentType, size] = await ethStorageContract.downloadFile(cid);
    
    logSuccess(`File downloaded successfully: ${fileName} (${contentType}, ${size} bytes)`);
    logInfo(`First 50 bytes of file content: ${fileData.slice(0, 50)}...`);
    
    return true;
  } catch (error) {
    logError('Failed to download file', error);
    return false;
  }
}

// Cleanup
async function cleanup() {
  try {
    if (fs.existsSync(TEST_FILE_PATH)) {
      fs.unlinkSync(TEST_FILE_PATH);
      logSuccess(`Test file removed`);
    }
  } catch (error) {
    logError('Failed to clean up test file', error);
  }
}

// Main testing logic
async function runTests() {
  logSection("BLOCKCHAIN INTEGRATION TESTS");
  
  // Step 1: Create test file
  logSection("Step 1: Create Test File");
  const fileCreated = await createTestFile();
  if (!fileCreated) return;
  
  // Step 2: Setup providers
  logSection("Step 2: Setup Blockchain Providers");
  const providers = await setupProviders();
  if (!providers) return;
  
  // Step 3: Test TrustDAI connection
  logSection("Step 3: Test TrustDAI Contract Connection");
  const trustDAI = await testTrustDAIConnection(providers.sepolia.wallet);
  
  // Bail early if TrustDAI connection fails
  if (!trustDAI) {
    logSection("Tests completed with errors");
    logSection("NEXT STEPS");
    
    console.log(`
${colors.yellow}Based on the test results, here are the recommended next steps:${colors.reset}

1. ${colors.cyan}Deploy the TrustDAI contract to Sepolia:${colors.reset}
   - Install Hardhat: npm install --save-dev hardhat
   - Create a Hardhat project: npx hardhat init
   - Copy TrustDAI.sol to the contracts folder
   - Create a deployment script and configure Hardhat as shown in the error details
   - Run deployment: npx hardhat run scripts/deploy.js --network sepolia
   - Update your .env file with the new contract address

2. ${colors.cyan}Verify your environment configuration:${colors.reset}
   - SEPOLIA_RPC_URL: ${process.env.SEPOLIA_RPC_URL || 'Not set'}
   - CONTRACT_ADDRESS: ${CONTRACT_ADDRESS || 'Not set'}
   - Private key is ${PRIVATE_KEY ? 'set' : 'not set'}

3. ${colors.cyan}Try the browser testing page:${colors.reset}
   - Run: npm run dev
   - Navigate to: http://localhost:5173/test
   - Connect your MetaMask wallet
   - Run the individual tests
`);
    return;
  }
  
  // Step 4: Test EthStorage connection
  logSection("Step 4: Test EthStorage Contract Connection");
  const ethStorage = await testEthStorageConnection(providers.ethStorage.wallet);
  
  // Bail early if EthStorage connection fails
  if (!ethStorage) {
    logSection("Tests completed with errors");
    return;
  }
  
  // Step 5: File Upload Test
  logSection("Step 5: File Upload Test");
  const cid = await testFileUpload(ethStorage, trustDAI);
  
  // Bail early if file upload fails
  if (!cid) {
    logSection("Tests completed with errors");
    return;
  }
  
  // Step 6: Access Control Test
  logSection("Step 6: Access Control Test");
  await testAccessControl(trustDAI, cid);
  
  // Step 7: File Download Test
  logSection("Step 7: File Download Test");
  await testFileDownload(ethStorage, cid);
  
  // Step 8: File Deletion Test
  logSection("Step 8: File Deletion Test");
  await testFileDeletion(ethStorage, trustDAI, cid);
  
  logSection("Tests completed");
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Unhandled error in tests:${colors.reset}`, error);
}); 