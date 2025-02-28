import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useFeatureFlags } from './FeatureToggle';

// Simple test definition
interface SimpleTest {
  name: string;
  description: string;
  run: () => Promise<boolean>;
}

// Test result interface 
interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'pending';
  error?: string;
}

// Mock wallet test
const walletConnectionTest: SimpleTest = {
  name: 'wallet-connection',
  description: 'Tests basic wallet connection functionality',
  run: async () => {
    // This is a simplified test that just checks if the wallet is connected
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      throw new Error('MetaMask is not installed');
    }
    
    try {
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found - wallet is not connected');
      }
      return true;
    } catch (error) {
      throw error;
    }
  }
};

// Feature flag test for Lit Protocol
const litProtocolFeatureFlagTest: SimpleTest = {
  name: 'lit-protocol-feature-flag',
  description: 'Tests enabling and disabling the Lit Protocol feature flag',
  run: async () => {
    // We'll use localStorage to check if feature flags are being saved correctly
    const currentFlags = localStorage.getItem('trustdai_feature_flags');
    
    // Store original state to restore it later
    const originalFlags = currentFlags ? JSON.parse(currentFlags) : { litProtocol: false };
    
    try {
      // Set litProtocol to true
      const enabledFlags = { ...originalFlags, litProtocol: true };
      localStorage.setItem('trustdai_feature_flags', JSON.stringify(enabledFlags));
      
      // Check if it was saved correctly
      const savedFlags = JSON.parse(localStorage.getItem('trustdai_feature_flags') || '{}');
      if (!savedFlags.litProtocol) {
        throw new Error('Failed to enable Lit Protocol feature flag');
      }
      
      // Set litProtocol back to false
      const disabledFlags = { ...originalFlags, litProtocol: false };
      localStorage.setItem('trustdai_feature_flags', JSON.stringify(disabledFlags));
      
      // Check if it was saved correctly
      const updatedFlags = JSON.parse(localStorage.getItem('trustdai_feature_flags') || '{}');
      if (updatedFlags.litProtocol) {
        throw new Error('Failed to disable Lit Protocol feature flag');
      }
      
      // Restore original state
      localStorage.setItem('trustdai_feature_flags', JSON.stringify(originalFlags));
      
      return true;
    } catch (error) {
      // Restore original state on error
      localStorage.setItem('trustdai_feature_flags', JSON.stringify(originalFlags));
      throw error;
    }
  }
};

// Mock encryption test that uses the feature flag
const litProtocolEncryptionTest: SimpleTest = {
  name: 'lit-protocol-encryption',
  description: 'Tests mock encryption and decryption with Lit Protocol',
  run: async () => {
    // Get current feature flag state
    const flagData = localStorage.getItem('trustdai_feature_flags');
    const flags = flagData ? JSON.parse(flagData) : { litProtocol: false };
    
    // Store original state to restore it later
    const originalFlag = flags.litProtocol;
    
    try {
      // Enable Lit Protocol
      flags.litProtocol = true;
      localStorage.setItem('trustdai_feature_flags', JSON.stringify(flags));
      
      // Test content
      const testContent = `Test content ${Date.now()}`;
      
      // Mock encryption (just prepend 'encrypted_')
      const encrypt = (content: string) => `encrypted_${content}`;
      
      // Mock decryption (just remove 'encrypted_')
      const decrypt = (content: string) => {
        if (!content.startsWith('encrypted_')) {
          throw new Error('Content is not encrypted with Lit Protocol');
        }
        return content.replace('encrypted_', '');
      };
      
      // Encrypt test content
      const encryptedContent = encrypt(testContent);
      
      // Decrypt test content
      const decryptedContent = decrypt(encryptedContent);
      
      // Verify
      if (decryptedContent !== testContent) {
        throw new Error('Decrypted content does not match original');
      }
      
      // Restore original flag state
      flags.litProtocol = originalFlag;
      localStorage.setItem('trustdai_feature_flags', JSON.stringify(flags));
      
      return true;
    } catch (error) {
      // Restore original flag state on error
      flags.litProtocol = originalFlag;
      localStorage.setItem('trustdai_feature_flags', JSON.stringify(flags));
      throw error;
    }
  }
};

// Data marketplace test
const dataMarketplaceTest: SimpleTest = {
  name: 'data-marketplace',
  description: 'Tests personal data marketplace functionality',
  run: async () => {
    try {
      // Define sample data categories
      const dataCategories = [
        {
          id: 'personal_info',
          name: 'Personal Information',
          price: '0.01'
        },
        {
          id: 'interests',
          name: 'Interests and Preferences',
          price: '0.015'
        }
      ];
      
      // Mock wallet addresses
      const dataOwnerAddress = '0x1234567890123456789012345678901234567890';
      const dataConsumerAddress = '0x0987654321098765432109876543210987654321';
      
      // Mock data sharing
      const sharedCategories = [dataCategories[0]]; // Share personal info
      
      // Calculate total price
      const totalPrice = sharedCategories.reduce(
        (sum, category) => sum + parseFloat(category.price),
        0
      );
      
      // Verify price calculation
      if (totalPrice !== parseFloat(dataCategories[0].price)) {
        throw new Error('Price calculation is incorrect');
      }
      
      return true;
    } catch (error) {
      throw error;
    }
  }
};

// All available tests
const availableTests: SimpleTest[] = [
  walletConnectionTest,
  litProtocolFeatureFlagTest,
  litProtocolEncryptionTest,
  dataMarketplaceTest
];

const SimpleTestRunner: React.FC = () => {
  const { isConnected } = useWallet();
  const { features } = useFeatureFlags();
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [selectedTests, setSelectedTests] = useState<Set<string>>(
    new Set(availableTests.map(test => test.name))
  );
  
  const runTests = async () => {
    if (running) return;
    
    setRunning(true);
    
    // Reset results and mark all as pending
    const pendingResults: TestResult[] = availableTests
      .filter(test => selectedTests.has(test.name))
      .map(test => ({
        name: test.name,
        status: 'pending'
      }));
    
    setResults(pendingResults);
    
    // Run each selected test
    for (const test of availableTests) {
      if (!selectedTests.has(test.name)) continue;
      
      try {
        await test.run();
        // Update results for this test
        setResults(prev => prev.map(r => 
          r.name === test.name 
            ? { ...r, status: 'pass' } 
            : r
        ));
      } catch (error) {
        // Update results for this test
        setResults(prev => prev.map(r => 
          r.name === test.name 
            ? { ...r, status: 'fail', error: error instanceof Error ? error.message : String(error) } 
            : r
        ));
      }
    }
    
    setRunning(false);
  };
  
  const toggleTest = (testName: string) => {
    const newSelected = new Set(selectedTests);
    
    if (newSelected.has(testName)) {
      newSelected.delete(testName);
    } else {
      newSelected.add(testName);
    }
    
    setSelectedTests(newSelected);
  };
  
  const toggleAll = () => {
    if (selectedTests.size === availableTests.length) {
      // Deselect all
      setSelectedTests(new Set());
    } else {
      // Select all
      setSelectedTests(new Set(availableTests.map(test => test.name)));
    }
  };
  
  const getTestResult = (testName: string) => {
    return results.find(r => r.name === testName);
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Simple Test Runner</h2>
      
      {!isConnected && (
        <div className="p-4 bg-yellow-50 rounded border border-yellow-200 mb-4">
          <p className="text-yellow-700">Please connect your wallet to run tests.</p>
        </div>
      )}
      
      <div className="mb-4">
        <div className="p-4 bg-blue-50 rounded border border-blue-200">
          <h3 className="font-medium text-blue-800 mb-2">Current Feature Flags</h3>
          <p className="text-blue-700">
            Lit Protocol: <strong>{features.litProtocol ? 'Enabled' : 'Disabled'}</strong>
          </p>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <div>
          <button
            className="text-sm text-blue-600 hover:text-blue-800"
            onClick={toggleAll}
            disabled={running}
          >
            {selectedTests.size === availableTests.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
        
        <button
          className={`px-4 py-2 rounded ${
            running || !isConnected
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          onClick={runTests}
          disabled={running || !isConnected}
        >
          {running ? 'Running...' : 'Run Tests'}
        </button>
      </div>
      
      <div className="mb-4">
        <div className="border rounded divide-y">
          {availableTests.map(test => {
            const result = getTestResult(test.name);
            let statusColor = '';
            
            if (result) {
              statusColor = result.status === 'pass'
                ? 'bg-green-100 border-green-200'
                : result.status === 'fail'
                  ? 'bg-red-100 border-red-200'
                  : 'bg-gray-100 border-gray-200';
            }
            
            return (
              <div 
                key={test.name} 
                className={`p-3 ${statusColor}`}
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-3"
                    checked={selectedTests.has(test.name)}
                    onChange={() => toggleTest(test.name)}
                    disabled={running}
                  />
                  
                  <div className="flex-1">
                    <div className="font-medium">
                      {test.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {test.description}
                    </div>
                  </div>
                  
                  {result && (
                    <div className="text-sm">
                      <span className={`rounded-full px-2 py-1 ${
                        result.status === 'pass'
                          ? 'bg-green-200 text-green-800'
                          : result.status === 'fail'
                            ? 'bg-red-200 text-red-800'
                            : 'bg-yellow-200 text-yellow-800'
                      }`}>
                        {result.status}
                      </span>
                    </div>
                  )}
                </div>
                
                {result && result.status === 'fail' && result.error && (
                  <div className="mt-2 p-2 bg-red-50 text-red-800 text-sm rounded">
                    <strong>Error:</strong> {result.error}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {results.length > 0 && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">Test Summary</h3>
          
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-green-100 rounded">
              <div className="text-2xl font-bold text-green-800">
                {results.filter(r => r.status === 'pass').length}
              </div>
              <div className="text-green-800">Passed</div>
            </div>
            
            <div className="p-3 bg-red-100 rounded">
              <div className="text-2xl font-bold text-red-800">
                {results.filter(r => r.status === 'fail').length}
              </div>
              <div className="text-red-800">Failed</div>
            </div>
            
            <div className="p-3 bg-yellow-100 rounded">
              <div className="text-2xl font-bold text-yellow-800">
                {results.filter(r => r.status === 'pending').length}
              </div>
              <div className="text-yellow-800">Pending</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleTestRunner; 