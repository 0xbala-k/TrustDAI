// Test script for Lit Protocol functionality
import { isFeatureEnabled, enableFeature } from './src/config/features.js';
import LitProtocolService from './src/services/LitProtocolService.js';

async function testLitProtocol() {
  console.log('Starting Lit Protocol test...');
  
  // Enable Lit Protocol feature
  console.log('Enabling Lit Protocol feature...');
  enableFeature('LIT_PROTOCOL');
  
  // Verify feature is enabled
  console.log('Is Lit Protocol enabled?', isFeatureEnabled('LIT_PROTOCOL'));
  
  // Create Lit Protocol service instance
  const litService = new LitProtocolService();
  
  // Test data
  const testContent = 'This is a test file for Lit Protocol encryption';
  const testCid = 'QmTestCid' + Date.now();
  const testOwner = '0x1234567890abcdef1234567890abcdef12345678'; // Replace with actual wallet address
  
  try {
    // Test encryption
    console.log('Testing encryption...');
    const encryptResult = await litService.encryptFile(testContent, testCid, testOwner);
    console.log('Encryption result:', encryptResult);
    
    // Test decryption
    console.log('Testing decryption...');
    const decryptedContent = await litService.decryptFile(
      encryptResult.encryptedContent,
      encryptResult.encryptedSymmetricKey,
      encryptResult.accessControlConditions
    );
    console.log('Decrypted content:', decryptedContent);
    
    // Verify decryption
    if (decryptedContent === testContent) {
      console.log('Test PASSED: Content was successfully encrypted and decrypted');
    } else {
      console.error('Test FAILED: Decrypted content does not match original');
    }
  } catch (error) {
    console.error('Error during Lit Protocol test:', error);
  }
}

testLitProtocol().catch(console.error); 