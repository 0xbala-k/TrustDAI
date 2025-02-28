// This script uploads a test file to the FlatDirectory contract
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

// FlatDirectory ABI (Just the functions we need)
const ABI = [
  "function store(string calldata path, bytes calldata content, string calldata contentType) external returns (uint256)",
  "function getFileInfo(string calldata path) external view returns (uint256 size, string memory contentType, address uploader, uint256 timestamp, uint8 uploadType)"
];

async function main() {
  // Check if private key is provided
  if (!process.env.PRIVATE_KEY) {
    console.error("Please set the PRIVATE_KEY environment variable");
    process.exit(1);
  }
  
  // Sepolia RPC (public endpoint from Ankr to avoid rate limits)
  const provider = new ethers.JsonRpcProvider('https://rpc.ankr.com/eth_sepolia');
  
  // Create wallet from private key
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log(`Using wallet address: ${wallet.address}`);
  
  // FlatDirectory contract address
  const contractAddress = '0x64003adbdf3014f7E38FC6BE752EB047b95da89A';
  
  // Create contract instance
  const contract = new ethers.Contract(contractAddress, ABI, wallet);
  
  // Create test file
  const testFilePath = path.join(process.cwd(), 'test-file.txt');
  const testFileContent = `Hello, this is a test file created at ${new Date().toISOString()}`;
  fs.writeFileSync(testFilePath, testFileContent);
  console.log(`Created test file at ${testFilePath}`);
  
  // Read file content
  const content = fs.readFileSync(testFilePath);
  
  // File path in the contract
  const filePath = 'test-file.txt';
  
  // Content type
  const contentType = 'text/plain';
  
  console.log(`Uploading file to FlatDirectory contract at ${contractAddress}...`);
  
  try {
    // Upload file
    const tx = await contract.store(filePath, content, contentType);
    console.log(`Transaction sent: ${tx.hash}`);
    console.log('Waiting for confirmation...');
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    
    // Get file info
    const info = await contract.getFileInfo(filePath);
    console.log(`File uploaded successfully: ${filePath}`);
    console.log(`  Size: ${info[0]} bytes`);
    console.log(`  Content Type: ${info[1]}`);
    console.log(`  Uploader: ${info[2]}`);
    console.log(`  Timestamp: ${new Date(Number(info[3]) * 1000).toISOString()}`);
    console.log(`  Upload Type: ${info[4]}`);
    
    // Generate Web3URLs for this file
    console.log(`\nWeb3URLs for accessing the file:`);
    const contractNoPrefix = contractAddress.substring(2).toLowerCase();
    console.log(`1. https://${contractNoPrefix}.sep.w3link.io/${filePath}`);
    console.log(`2. https://eth.sep.w3link.io/ethereum:${contractAddress}/${filePath}`);
    
    // Clean up
    fs.unlinkSync(testFilePath);
    console.log(`\nTest file deleted from local filesystem`);
  } catch (error) {
    console.error("Error uploading file:", error.message);
    // Clean up
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  }
}

main().catch(console.error); 