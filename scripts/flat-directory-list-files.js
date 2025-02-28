// This script lists files in the FlatDirectory contract
import { ethers } from 'ethers';

// FlatDirectory ABI (Just the functions we need)
const ABI = [
  "function list() external view returns (string[] memory)",
  "function getFileInfo(string calldata path) external view returns (uint256 size, string memory contentType, address uploader, uint256 timestamp, uint8 uploadType)"
];

async function main() {
  // Sepolia RPC (public endpoint from Ankr to avoid rate limits)
  const provider = new ethers.JsonRpcProvider('https://rpc.ankr.com/eth_sepolia');
  
  // FlatDirectory contract address
  const contractAddress = '0x64003adbdf3014f7E38FC6BE752EB047b95da89A';
  
  // Create contract instance
  const contract = new ethers.Contract(contractAddress, ABI, provider);
  
  try {
    console.log(`Listing files in FlatDirectory contract at ${contractAddress}...`);
    
    // Get list of files
    const files = await contract.list();
    
    console.log(`Found ${files.length} files:`);
    
    // Get file info for each file
    for (const file of files) {
      try {
        const info = await contract.getFileInfo(file);
        console.log(`- ${file}`);
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
      } catch (error) {
        console.error(`Error getting info for file ${file}:`, error.message);
      }
    }
  } catch (error) {
    console.error("Error listing files:", error.message);
  }
}

main().catch(console.error); 