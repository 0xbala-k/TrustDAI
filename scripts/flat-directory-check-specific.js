// This script checks for a specific file in the FlatDirectory contract
import { ethers } from 'ethers';

// FlatDirectory ABI (Just the functions we need)
const ABI = [
  "function retrieve(string calldata path) external view returns (bytes)",
  "function getEntries() external view returns (string[] memory)"
];

async function main() {
  // Sepolia RPC (public endpoint from Ankr to avoid rate limits)
  const provider = new ethers.JsonRpcProvider('https://rpc.ankr.com/eth_sepolia');
  
  // FlatDirectory contract address
  const contractAddress = '0x64003adbdf3014f7E38FC6BE752EB047b95da89A';
  
  // Create contract instance
  const contract = new ethers.Contract(contractAddress, ABI, provider);
  
  // File path to check
  const filePath = 'test-file.txt';
  
  console.log(`Checking for specific file '${filePath}' in FlatDirectory contract at ${contractAddress}...`);
  
  try {
    // Try to call getEntries() to get list of files
    console.log('Trying to get list of files using getEntries()...');
    const entries = await contract.getEntries();
    console.log(`Found ${entries.length} entries:`);
    for (const entry of entries) {
      console.log(`- ${entry}`);
    }
    
    // Check if our file exists in the list
    if (entries.includes(filePath)) {
      console.log(`✅ File exists in entries list: ${filePath}`);
    } else {
      console.log(`❌ File not found in entries list: ${filePath}`);
    }
  } catch (error) {
    console.log(`Error calling getEntries(): ${error.message}`);
    console.log('getEntries() method might not exist, trying alternative...');
  }
  
  try {
    // Try to retrieve the specific file
    console.log(`\nTrying to retrieve file '${filePath}'...`);
    const fileContent = await contract.retrieve(filePath);
    
    if (fileContent && fileContent.length > 0) {
      console.log(`✅ Retrieved file successfully!`);
      console.log(`  Size: ${fileContent.length} bytes`);
      
      // Try to convert to text if it's small enough
      if (fileContent.length < 1000) {
        const text = new TextDecoder().decode(fileContent);
        console.log(`  Content: ${text}`);
      }
      
      // Generate Web3URLs for this file
      console.log(`\nWeb3URLs for accessing the file:`);
      const contractNoPrefix = contractAddress.substring(2).toLowerCase();
      console.log(`1. https://${contractNoPrefix}.sep.w3link.io/${filePath}`);
      console.log(`2. https://eth.sep.w3link.io/ethereum:${contractAddress}/${filePath}`);
      
      // Use curl to test these URLs
      console.log('\nYou can test these URLs with:');
      console.log(`curl -v https://${contractNoPrefix}.sep.w3link.io/${filePath}`);
      console.log(`curl -v https://eth.sep.w3link.io/ethereum:${contractAddress}/${filePath}`);
      
      return true;
    } else {
      console.log(`❌ File exists but is empty`);
    }
  } catch (error) {
    console.log(`❌ Error retrieving file: ${error.message}`);
    if (error.message.includes('revert')) {
      console.log('   This suggests the file does not exist on the contract');
    } else if (error.message.includes('BAD_DATA')) {
      console.log('   This suggests the retrieve method returned unexpected data format');
    }
  }
  
  console.log('\nAttempting to generate Web3URLs anyway for testing:');
  const contractNoPrefix = contractAddress.substring(2).toLowerCase();
  console.log(`1. https://${contractNoPrefix}.sep.w3link.io/${filePath}`);
  console.log(`2. https://eth.sep.w3link.io/ethereum:${contractAddress}/${filePath}`);
  console.log(`3. https://${contractNoPrefix}.w3link.io/${filePath}`);
  console.log(`4. https://${contractNoPrefix}.w3s.link/${filePath}`);
  
  return false;
}

main().catch(console.error); 