// This script checks if specific files exist in the FlatDirectory contract
import { ethers } from 'ethers';

// FlatDirectory ABI (Just the functions we need)
const ABI = [
  "function getFileInfo(string calldata path) external view returns (uint256 size, string memory contentType, address uploader, uint256 timestamp, uint8 uploadType)"
];

// List of files to check
const filesToCheck = [
  "hello.txt",
  "index.html",
  "README.md",
  "test.txt",
  "files/example.txt",
  "test-uploads/sample.pdf",
  "static/logo.png",
  "uploads/test-file.txt"
];

async function main() {
  // Sepolia RPC (public endpoint from Ankr to avoid rate limits)
  const provider = new ethers.JsonRpcProvider('https://rpc.ankr.com/eth_sepolia');
  
  // FlatDirectory contract address
  const contractAddress = '0x64003adbdf3014f7E38FC6BE752EB047b95da89A';
  
  // Create contract instance
  const contract = new ethers.Contract(contractAddress, ABI, provider);
  
  console.log(`Checking files in FlatDirectory contract at ${contractAddress}...`);
  
  // Check each file
  for (const file of filesToCheck) {
    try {
      const info = await contract.getFileInfo(file);
      console.log(`✅ File exists: ${file}`);
      console.log(`  Size: ${info[0]} bytes`);
      console.log(`  Content Type: ${info[1]}`);
      console.log(`  Uploader: ${info[2]}`);
      console.log(`  Timestamp: ${new Date(Number(info[3]) * 1000).toISOString()}`);
      console.log(`  Upload Type: ${info[4]}`);
      console.log();
      
      // Generate Web3URLs for this file
      console.log(`  Web3URLs:`);
      const contractNoPrefix = contractAddress.substring(2).toLowerCase();
      console.log(`  - https://${contractNoPrefix}.sep.w3link.io/${file}`);
      console.log(`  - https://eth.sep.w3link.io/ethereum:${contractAddress}/${file}`);
      console.log();
      
      // Try to access the file with curl
      console.log(`  Testing access with curl...`);
      const curlCmd = `curl -s -I "https://${contractNoPrefix}.sep.w3link.io/${file}"`;
      console.log(`  $ ${curlCmd}`);
      console.log();
    } catch (error) {
      console.log(`❌ File does not exist: ${file}`);
    }
  }
}

main().catch(console.error); 