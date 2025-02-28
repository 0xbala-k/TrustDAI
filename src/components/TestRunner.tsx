import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import TestSuite from '../../tests/e2e/test-runner';

// Load tests dynamically
const loadTestFiles = async () => {
  const walletConnectionTests = (await import('../../tests/e2e/tests/wallet-connection.test')).default;
  const contractInteractionTests = (await import('../../tests/e2e/tests/contract-interaction.test')).default;
  const litProtocolTests = (await import('../../tests/e2e/tests/lit-protocol.test')).default;
  const personalDataMarketTests = (await import('../../tests/e2e/tests/personal-data-market.test')).default;
  
  return [
    ...walletConnectionTests,
    ...contractInteractionTests,
    ...litProtocolTests,
    ...personalDataMarketTests
  ];
};

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  error?: Error;
}

const TestRunner: React.FC = () => {
  const { isConnected, isCorrectNetwork } = useWallet();
  const [mode, setMode] = useState<'live' | 'mock'>('mock');
  const [running, setRunning] = useState<boolean>(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [availableTests, setAvailableTests] = useState<any[]>([]);
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());
  
  // Load test files
  useEffect(() => {
    loadTestFiles().then(tests => {
      setAvailableTests(tests);
      
      // Select all tests by default
      const allTestNames = new Set(tests.map(test => test.name));
      setSelectedTests(allTestNames);
    });
  }, []);
  
  const runTests = async () => {
    if (running) return;
    
    setRunning(true);
    setResults([]);
    
    // Filter tests to run
    const testsToRun = availableTests.filter(test => selectedTests.has(test.name));
    
    // Create test suite
    const testSuite = new TestSuite(mode);
    
    // Set UI callback
    testSuite.setUICallback(results => {
      setResults([...results]);
    });
    
    // Add selected tests
    testsToRun.forEach(test => testSuite.addTest(test));
    
    try {
      // Run tests
      await testSuite.initialize();
      await testSuite.runTests();
    } catch (error) {
      console.error('Test runner error:', error);
    } finally {
      setRunning(false);
    }
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
  
  const toggleExpanded = (testName: string) => {
    const newExpanded = new Set(expandedTests);
    
    if (newExpanded.has(testName)) {
      newExpanded.delete(testName);
    } else {
      newExpanded.add(testName);
    }
    
    setExpandedTests(newExpanded);
  };
  
  const getTestResult = (testName: string) => {
    return results.find(r => r.name === testName);
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">End-to-End Test Runner</h2>
      
      {!isConnected ? (
        <div className="p-4 bg-yellow-50 rounded border border-yellow-200 mb-4">
          <p className="text-yellow-700">Please connect your wallet to run tests.</p>
        </div>
      ) : !isCorrectNetwork && mode === 'live' ? (
        <div className="p-4 bg-yellow-50 rounded border border-yellow-200 mb-4">
          <p className="text-yellow-700">Please switch to the correct network to run live tests.</p>
        </div>
      ) : null}
      
      <div className="flex items-center justify-between mb-4">
        <div>
          <label className="inline-flex items-center mr-4">
            <input
              type="radio"
              className="form-radio"
              name="test-mode"
              value="mock"
              checked={mode === 'mock'}
              onChange={() => setMode('mock')}
              disabled={running}
            />
            <span className="ml-2">Mock Mode</span>
          </label>
          
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio"
              name="test-mode"
              value="live"
              checked={mode === 'live'}
              onChange={() => setMode('live')}
              disabled={running || !isConnected || !isCorrectNetwork}
            />
            <span className="ml-2">Live Mode</span>
          </label>
        </div>
        
        <button
          className={`px-4 py-2 rounded ${
            running
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          onClick={runTests}
          disabled={running || (mode === 'live' && (!isConnected || !isCorrectNetwork))}
        >
          {running ? 'Running...' : 'Run Tests'}
        </button>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Available Tests</h3>
          <button
            className="text-sm text-blue-600 hover:text-blue-800"
            onClick={toggleAll}
            disabled={running}
          >
            {selectedTests.size === availableTests.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
        
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
                className={`p-3 ${statusColor} ${expandedTests.has(test.name) ? 'border-b' : ''}`}
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
                    <div 
                      className="font-medium cursor-pointer"
                      onClick={() => toggleExpanded(test.name)}
                    >
                      {test.name}
                      <span className="ml-2 text-gray-500 text-sm">
                        {expandedTests.has(test.name) ? '▼' : '▶'}
                      </span>
                    </div>
                    
                    {expandedTests.has(test.name) && (
                      <div className="mt-2 text-sm text-gray-600">
                        <p>{test.description}</p>
                      </div>
                    )}
                  </div>
                  
                  {result && (
                    <div className="text-sm">
                      <span className={`rounded-full px-2 py-1 ${
                        result.status === 'pass'
                          ? 'bg-green-200 text-green-800'
                          : result.status === 'fail'
                            ? 'bg-red-200 text-red-800'
                            : 'bg-gray-200 text-gray-800'
                      }`}>
                        {result.status}
                      </span>
                      {result.duration && (
                        <span className="ml-2 text-gray-500">
                          {result.duration}ms
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {expandedTests.has(test.name) && result && result.status === 'fail' && (
                  <div className="mt-2 p-2 bg-red-50 text-red-800 text-sm rounded">
                    <strong>Error:</strong> {result.error?.message || 'Unknown error'}
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
            
            <div className="p-3 bg-gray-100 rounded">
              <div className="text-2xl font-bold text-gray-800">
                {selectedTests.size - results.length}
              </div>
              <div className="text-gray-800">Pending</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestRunner; 