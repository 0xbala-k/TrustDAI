#!/usr/bin/env node

/**
 * EthStorage Web3URL Test Script
 * 
 * This script tests the complete flow of:
 * 1. Uploading a file to a FlatDirectory contract
 * 2. Generating various Web3URL formats for the file
 * 3. Testing accessibility of each format
 * 
 * Run with: node scripts/web3url-test.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ethers } from 'ethers';
import fetch from 'node-fetch';
import crypto from 'crypto';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Configuration (modify as needed)
const config = {
  // FlatDirectory contract address
  contractAddress: '0x64003adbdf3014f7E38FC6BE752EB047b95da89A',
  
  // RPC URL for QuarkChain L2 (use env var if available)
  rpcUrl: process.env.RPC_URL || 'https://rpc.beta.testnet.l2.quarkchain.io:8545/',
  
  // EthStorage gateway URL
  gatewayUrl: process.env.GATEWAY_URL || 'https://eth.sep.w3link.io',
  
  // Path to private key file (if you want to use a real wallet)
  // If not provided, will use a random wallet (upload will be simulated)
  privateKeyPath: process.env.PRIVATE_KEY_PATH || '',
  
  // Test file options
  testFile: {
    // Directory to create the test file in
    dir: 'test-files',
    // Prefix for the filename
    prefix: 'test-file',
    // File size in bytes (default 1KB)
    size: 1024,
  },
  
  // Path prefix in FlatDirectory
  pathPrefix: 'cli-test',
};

// FlatDirectory ABI (simplified for our needs)
const FLAT_DIRECTORY_ABI = [
  "function store(string path, bytes data) external returns (string)",
  "function retrieve(string path) external view returns (bytes)",
  "function remove(string path) external",
  "function list() external view returns (string[])"
];

/**
 * Logs a message to the console with colors
 */
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  let color;
  
  switch (type) {
    case 'error':
      color = colors.red;
      break;
    case 'success':
      color = colors.green;
      break;
    case 'warning':
      color = colors.yellow;
      break;
    case 'info':
    default:
      color = colors.blue;
  }
  
  console.log(`${color}[${timestamp}]${colors.reset} ${message}`);
}

/**
 * Creates a test file with random content
 */
async function createTestFile() {
  const testDir = path.resolve(config.testFile.dir);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
    log(`Created test directory: ${testDir}`, 'info');
  }
  
  // Generate random content
  const content = crypto.randomBytes(config.testFile.size);
  
  // Create a unique filename
  const timestamp = Date.now();
  const fileName = `${config.testFile.prefix}-${timestamp}.txt`;
  const filePath = path.join(testDir, fileName);
  
  // Write the file
  fs.writeFileSync(filePath, content);
  log(`Created test file: ${filePath} (${config.testFile.size} bytes)`, 'success');
  
  return {
    path: filePath,
    name: fileName,
    size: config.testFile.size,
  };
}

/**
 * Initialize wallet from private key or create a random one
 */
function initializeWallet(provider) {
  if (config.privateKeyPath && fs.existsSync(config.privateKeyPath)) {
    const privateKey = fs.readFileSync(config.privateKeyPath, 'utf8').trim();
    const wallet = new ethers.Wallet(privateKey, provider);
    log(`Using wallet from private key file: ${wallet.address}`, 'info');
    return wallet;
  }
  
  // Create a random wallet for testing
  const wallet = ethers.Wallet.createRandom().connect(provider);
  log(`Created random test wallet: ${wallet.address}`, 'warning');
  log('Note: Using a random wallet, uploads will be simulated', 'warning');
  return wallet;
}

/**
 * Upload a file to FlatDirectory contract
 */
async function uploadFile(filePath) {
  log(`Starting upload for file: ${filePath}`, 'info');
  
  try {
    // Initialize provider
    log(`Connecting to RPC: ${config.rpcUrl}`, 'info');
    const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    
    // Initialize wallet
    const wallet = initializeWallet(provider);
    
    // Initialize contract
    const contract = new ethers.Contract(
      config.contractAddress,
      FLAT_DIRECTORY_ABI,
      wallet
    );
    
    // Create a unique path for the file
    const fileName = path.basename(filePath);
    const timestamp = Date.now();
    const filePath2 = `${config.pathPrefix}/${timestamp}_${fileName}`;
    log(`Generated file path: ${filePath2}`, 'info');
    
    // Read file data
    log('Reading file data...', 'info');
    const fileData = fs.readFileSync(filePath);
    
    // Convert to Uint8Array
    const fileBytes = new Uint8Array(fileData);
    log(`File data loaded (${fileBytes.length} bytes)`, 'info');
    
    // Check if we're using a random wallet (simulate upload)
    if (wallet.address.startsWith('0x')) {
      const walletBalance = await provider.getBalance(wallet.address);
      
      if (walletBalance.eq(0)) {
        log('Wallet has no balance, simulating upload...', 'warning');
        // Simulate a successful upload
        const simulatedCid = `QmSimulated${crypto.randomBytes(16).toString('hex').substring(0, 16)}`;
        
        return {
          success: true,
          path: filePath2,
          cid: simulatedCid,
          simulated: true,
        };
      }
    }
    
    // Attempt to store file in FlatDirectory contract
    log('Storing file in FlatDirectory contract...', 'info');
    const tx = await contract.store(filePath2, fileBytes);
    log(`Transaction sent: ${tx.hash}`, 'info');
    
    // Wait for transaction to be mined
    log('Waiting for transaction to be mined...', 'info');
    const receipt = await tx.wait();
    log(`Transaction confirmed in block ${receipt.blockNumber}`, 'success');
    
    // Find CID from logs or events (this will depend on your contract)
    // For now, we'll use a placeholder
    const cid = `QmUploaded${crypto.randomBytes(16).toString('hex').substring(0, 16)}`;
    
    return {
      success: true,
      path: filePath2,
      cid,
      txHash: tx.hash,
      simulated: false,
    };
    
  } catch (error) {
    log(`Upload error: ${error.message}`, 'error');
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Generate different Web3URL formats for testing
 */
function generateWeb3Urls(path, cid) {
  // Ensure gateway URL doesn't end with a slash
  const gatewayUrl = config.gatewayUrl.replace(/\/$/, '');
  
  // Extract contract address (lowercase without 0x prefix for subdomains)
  const contractAddress = config.contractAddress;
  const contractAddressNoPrefix = contractAddress.toLowerCase().replace('0x', '');
  
  // Parse the gateway URL to get base domain
  const gatewayUrlObj = new URL(gatewayUrl);
  const baseDomain = gatewayUrlObj.hostname.split('.').slice(-2).join('.');
  
  // Generate various URL formats
  return {
    // Format 1: Pure subdomain format (contractaddress.w3link.io/path)
    pureSubdomain: `https://${contractAddressNoPrefix}.w3link.io/${path}`,
    
    // Format 2: Subdomain format with sep (contractaddress.sep.w3link.io/path)
    subdomainWithSep: `https://${contractAddressNoPrefix}.sep.w3link.io/${path}`,
    
    // Format 3: Subdomain format directly from gateway URL
    subdomainFromGateway: `${gatewayUrl.replace('eth.sep', contractAddressNoPrefix)}/${path}`,
    
    // Format 4: Subdomain with w3s gateway (contractaddress.w3s.link/path)
    w3sSubdomain: `https://${contractAddressNoPrefix}.w3s.link/${path}`,
    
    // Format 5: Path-based format with ethereum: prefix
    pathWithEthereumPrefix: `${gatewayUrl}/ethereum:${contractAddress}/${path}`,
    
    // Format 6: Path-based format with slash syntax
    pathWithSlashSyntax: `${gatewayUrl}/ethereum/${contractAddress}/${path}`,
    
    // Format 7: DWeb format (dweb:/ipfs/...)
    dwebFormat: `dweb:/ipfs/${cid}`,
    
    // Format 8: Direct IPFS gateway (gateway.ipfs.io/ipfs/...)
    ipfsGateway: `https://gateway.ipfs.io/ipfs/${cid}`,
  };
}

/**
 * Test if a URL is accessible
 */
async function testUrl(url, method = 'GET') {
  log(`Testing ${method} ${url}`, 'info');
  
  try {
    // Attempt to fetch the URL
    const response = await fetch(url, { method });
    
    // Check if the response is successful
    if (response.ok) {
      log(`✅ ${method} ${url} -> ${response.status} ${response.statusText}`, 'success');
      
      // Get and log content type
      const contentType = response.headers.get('content-type');
      log(`Content-Type: ${contentType || 'Unknown'}`, 'info');
      
      // Read content if GET request
      if (method === 'GET') {
        // Handle binary data
        const buffer = await response.buffer();
        log(`Retrieved ${buffer.length} bytes of data`, 'success');
      }
      
      return {
        success: true,
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
      };
    } else {
      // Log error details
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = 'Could not read error response';
      }
      
      log(`❌ ${method} ${url} -> ${response.status} ${response.statusText}`, 'error');
      log(`Error response: ${errorText}`, 'error');
      
      return {
        success: false,
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      };
    }
  } catch (error) {
    // Network errors, etc.
    log(`❌ ${method} ${url} -> Network error: ${error.message}`, 'error');
    
    return {
      success: false,
      status: 'Error',
      statusText: error.message,
      error: error.message,
    };
  }
}

/**
 * Test accessibility of all URL formats
 */
async function testAllUrls(urls) {
  log('\n--- Testing URL accessibility ---', 'info');
  
  const results = {};
  
  // Test each URL format
  for (const [formatName, url] of Object.entries(urls)) {
    if (!url) continue;
    
    // Test with GET method
    results[formatName] = await testUrl(url, 'GET');
    
    // Add a small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return results;
}

/**
 * Display test results summary
 */
function displayResults(results) {
  log('\n--- Test Results Summary ---', 'info');
  
  // Count successes
  const successCount = Object.values(results).filter(r => r.success).length;
  const totalCount = Object.values(results).length;
  
  log(`${successCount} of ${totalCount} URLs accessible`, successCount > 0 ? 'success' : 'error');
  
  // Display each result
  for (const [formatName, result] of Object.entries(results)) {
    const statusSymbol = result.success ? '✅' : '❌';
    const statusColor = result.success ? colors.green : colors.red;
    console.log(`${statusColor}${statusSymbol}${colors.reset} ${formatName}: ${result.status} ${result.statusText}`);
  }
  
  // If any URL was successful, display it prominently
  const successfulFormats = Object.entries(results)
    .filter(([_, result]) => result.success)
    .map(([formatName, _]) => formatName);
  
  if (successfulFormats.length > 0) {
    log('\n--- Working URL Formats ---', 'success');
    successfulFormats.forEach(format => {
      console.log(`${colors.green}✅${colors.reset} ${format}`);
    });
  } else {
    log('\n❌ No working URL formats found', 'error');
    log('Suggestions:', 'warning');
    log('1. Check that the contract address is correct', 'warning');
    log('2. Verify that the file exists at the specified path', 'warning');
    log('3. Check connectivity to the EthStorage gateway', 'warning');
    log('4. Try a different gateway URL', 'warning');
  }
}

/**
 * Main function to run the test
 */
async function main() {
  try {
    console.log(`\n${colors.cyan}=== EthStorage Web3URL Test Script ===${colors.reset}\n`);
    
    // Create a test file
    log('Step 1: Creating test file...', 'info');
    const testFile = await createTestFile();
    
    // Upload the file to FlatDirectory
    log('\nStep 2: Uploading file to FlatDirectory...', 'info');
    const uploadResult = await uploadFile(testFile.path);
    
    if (!uploadResult.success) {
      log(`Upload failed: ${uploadResult.error}`, 'error');
      return;
    }
    
    log(`\nUpload successful! Path: ${uploadResult.path}${uploadResult.simulated ? ' (simulated)' : ''}`, 'success');
    
    // Generate Web3URLs for testing with the uploaded file
    log('\nStep 3: Generating Web3URLs for uploaded file...', 'info');
    const urls = generateWeb3Urls(uploadResult.path, uploadResult.cid);
    
    // Display generated URLs
    console.log('\nGenerated URLs for uploaded file:');
    for (const [formatName, url] of Object.entries(urls)) {
      if (url) console.log(`${formatName}: ${url}`);
    }
    
    // Test URL accessibility
    log('\nStep 4: Testing URL accessibility for uploaded file...', 'info');
    const results = await testAllUrls(urls);
    
    // Display results
    displayResults(results);
    
    // Also test some known paths that might already exist in the contract
    log('\n--- Testing known paths that might exist in the contract ---', 'info');
    const knownPaths = [
      'files/example.txt',
      'test-uploads/sample.pdf',
      'static/logo.png',
      'README.md',
      'index.html',
      'hello.txt'
    ];
    
    log('\nTesting each known path with different URL formats...', 'info');
    let foundWorkingPath = false;
    
    for (const knownPath of knownPaths) {
      log(`\nTesting path: ${knownPath}`, 'info');
      const knownPathUrls = generateWeb3Urls(knownPath, null);
      const knownPathResults = await testAllUrls(knownPathUrls);
      
      // Count successes
      const successCount = Object.values(knownPathResults).filter(r => r.success).length;
      
      if (successCount > 0) {
        log(`Found working path: ${knownPath}`, 'success');
        foundWorkingPath = true;
        
        // Display working URLs for this path
        console.log('\nWorking URLs for this path:');
        for (const [formatName, result] of Object.entries(knownPathResults)) {
          if (result.success) {
            console.log(`${colors.green}✅${colors.reset} ${formatName}: ${knownPathUrls[formatName]}`);
          }
        }
        
        // Save these working URLs for reference
        const workingKnownUrls = Object.entries(knownPathUrls)
          .filter(([formatName, _]) => knownPathResults[formatName]?.success)
          .map(([_, url]) => url);
        
        if (workingKnownUrls.length > 0) {
          const resultPath = path.resolve('working-known-urls.txt');
          fs.writeFileSync(resultPath, `Path: ${knownPath}\n${workingKnownUrls.join('\n')}`);
          log(`Working URLs for path "${knownPath}" saved to: ${resultPath}`, 'success');
        }
        
        // Break after finding at least one working path
        break;
      }
    }
    
    if (!foundWorkingPath) {
      log('No working paths found among the known test paths', 'error');
    }
    
    // If any URL was successful from our upload test, save it to a file
    const workingUrls = Object.entries(urls)
      .filter(([formatName, _]) => results[formatName]?.success)
      .map(([_, url]) => url);
    
    if (workingUrls.length > 0) {
      const resultPath = path.resolve('working-urls.txt');
      fs.writeFileSync(resultPath, workingUrls.join('\n'));
      log(`\nWorking URLs saved to: ${resultPath}`, 'success');
    }
    
  } catch (error) {
    log(`Test error: ${error.message}`, 'error');
    console.error(error);
  }
}

// Run the main function
main().catch(console.error); 