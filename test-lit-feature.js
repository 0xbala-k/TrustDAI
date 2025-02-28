// Test script specifically for Lit Protocol feature flag
import { ethers } from 'ethers';

// Mock feature flag storage
const featureFlags = {
  litProtocol: false
};

// Mock localStorage for testing
const mockLocalStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  }
};

// Mock encryption function that uses the feature flag
async function encryptFile(content) {
  if (!featureFlags.litProtocol) {
    console.log('Lit Protocol is disabled, skipping encryption');
    return { content, encrypted: false };
  }
  
  console.log('Encrypting with Lit Protocol...');
  // Mock encryption by adding a prefix
  const encryptedContent = `encrypted_${content}`;
  return { content: encryptedContent, encrypted: true };
}

// Mock decryption function that uses the feature flag
async function decryptFile(content) {
  if (!featureFlags.litProtocol) {
    console.log('Lit Protocol is disabled, skipping decryption');
    return { content, decrypted: false };
  }
  
  console.log('Decrypting with Lit Protocol...');
  // Mock decryption by removing the prefix
  if (!content.startsWith('encrypted_')) {
    throw new Error('Content is not encrypted with Lit Protocol');
  }
  
  const decryptedContent = content.replace('encrypted_', '');
  return { content: decryptedContent, decrypted: true };
}

// Test the feature flag with encryption/decryption
async function testLitProtocolFeatureFlag() {
  console.log('=== Testing Lit Protocol Feature Flag ===');
  
  // Test with feature flag disabled (default)
  console.log('\n1. Testing with feature flag DISABLED:');
  const testContent = `Test content ${Date.now()}`;
  console.log(`Original content: ${testContent}`);
  
  // Try to encrypt with feature disabled
  const disabledResult = await encryptFile(testContent);
  console.log(`Result with feature disabled: ${JSON.stringify(disabledResult)}`);
  
  // Enable the feature flag
  console.log('\n2. Enabling Lit Protocol feature flag');
  featureFlags.litProtocol = true;
  console.log(`Feature flag state: ${featureFlags.litProtocol}`);
  
  // Try to encrypt with feature enabled
  console.log('\n3. Testing with feature flag ENABLED:');
  const enabledResult = await encryptFile(testContent);
  console.log(`Result with feature enabled: ${JSON.stringify(enabledResult)}`);
  
  // Try to decrypt the encrypted content
  console.log('\n4. Testing decryption with feature flag ENABLED:');
  const decryptResult = await decryptFile(enabledResult.content);
  console.log(`Decryption result: ${JSON.stringify(decryptResult)}`);
  
  // Verify the decrypted content matches the original
  if (decryptResult.content === testContent) {
    console.log('\n✅ SUCCESS: Decrypted content matches original');
  } else {
    console.log('\n❌ FAILURE: Decrypted content does not match original');
    console.log(`Expected: ${testContent}`);
    console.log(`Actual: ${decryptResult.content}`);
  }
  
  // Disable the feature flag again
  console.log('\n5. Disabling Lit Protocol feature flag');
  featureFlags.litProtocol = false;
  console.log(`Feature flag state: ${featureFlags.litProtocol}`);
  
  // Try to decrypt with feature disabled
  console.log('\n6. Testing decryption with feature flag DISABLED:');
  try {
    const disabledDecryptResult = await decryptFile(enabledResult.content);
    console.log(`Result with feature disabled: ${JSON.stringify(disabledDecryptResult)}`);
  } catch (error) {
    console.log(`Error with feature disabled: ${error.message}`);
  }
  
  console.log('\n=== Test Complete ===');
}

// Run the test
testLitProtocolFeatureFlag().catch(error => {
  console.error('Test error:', error);
}); 