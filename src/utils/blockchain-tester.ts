/**
 * Blockchain Tester Utility
 * 
 * Simple utility functions to test blockchain connectivity and functionality
 * from the browser environment. This can be used to verify wallet connection,
 * contract interactions, and EthStorage operations before building UI components.
 */

import { trustDAIContract } from '../services/TrustDAI';
import { ethStorageService } from '../services/EthStorage';

/**
 * Tests wallet connection to Ethereum network
 */
export async function testWalletConnection() {
  try {
    const account = await trustDAIContract.connect();
    console.log('✅ Wallet connected:', account);
    return {
      success: true,
      account
    };
  } catch (error) {
    console.error('❌ Wallet connection failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Tests TrustDAI contract connection and basic functionality
 */
export async function testTrustDAIContract() {
  try {
    await testWalletConnection();
    
    // Test getUserFiles
    const files = await trustDAIContract.getUserFiles();
    console.log('✅ TrustDAI contract connected successfully');
    console.log(`ℹ️ Current account has ${files.length} files`);
    
    return {
      success: true,
      fileCount: files.length,
      files
    };
  } catch (error) {
    console.error('❌ TrustDAI contract test failed:', error);
    
    // Check if the error indicates the contract is not deployed
    if (error.message.includes('no code at address') || 
        error.message.includes('contract not deployed') ||
        error.message.includes('contract address not configured')) {
      console.error('⚠️ TrustDAI contract may not be deployed. Please check the CONTRACT_ADDRESS in your .env file.');
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Tests EthStorage connection
 */
export async function testEthStorageConnection() {
  try {
    // This will initialize the contract and connect to it
    await ethStorageService.initializeContractReadOnly();
    console.log('✅ EthStorage contract connected successfully');
    
    return {
      success: true
    };
  } catch (error) {
    console.error('❌ EthStorage connection test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Creates and uploads a simple test file to EthStorage
 */
export async function testFileUpload() {
  try {
    // Create a simple text file
    const content = 'This is a test file for EthStorage upload.';
    const blob = new Blob([content], { type: 'text/plain' });
    const file = new File([blob], 'test-upload.txt', { type: 'text/plain' });
    
    console.log('ℹ️ Uploading test file to EthStorage...');
    const result = await ethStorageService.uploadFile(file);
    
    if (result.success) {
      console.log('✅ Test file uploaded successfully with CID:', result.cid);
    } else {
      console.error('❌ File upload failed:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ File upload test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Runs all tests and returns combined results
 */
export async function runAllTests() {
  const results = {
    walletConnection: await testWalletConnection(),
    trustDAIContract: await testTrustDAIContract(),
    ethStorageConnection: await testEthStorageConnection()
  };
  
  // Only test file upload if all previous tests passed
  if (results.walletConnection.success && 
      results.trustDAIContract.success && 
      results.ethStorageConnection.success) {
    results['fileUpload'] = await testFileUpload();
  }
  
  console.log('========== TEST SUMMARY ==========');
  for (const [testName, result] of Object.entries(results)) {
    console.log(`${result.success ? '✅' : '❌'} ${testName}: ${result.success ? 'Success' : 'Failed'}`);
  }
  
  return results;
}

// Expose the tester in the browser console for easy development testing
if (typeof window !== 'undefined') {
  (window as any).blockchainTester = {
    testWalletConnection,
    testTrustDAIContract,
    testEthStorageConnection,
    testFileUpload,
    runAllTests
  };
} 