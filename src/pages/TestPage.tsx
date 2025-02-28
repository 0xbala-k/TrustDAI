import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { runAllTests, testWalletConnection, testTrustDAIContract, testEthStorageConnection, testFileUpload } from '@/utils/blockchain-tester';
import { AlertCircle, CheckCircle2, Upload, Wallet, FileText, Code } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

type TestResult = {
  success: boolean;
  error?: string;
  account?: string;
  fileCount?: number;
  files?: string[];
  cid?: string;
};

type TestResults = {
  [key: string]: TestResult;
};

export default function TestPage() {
  const [results, setResults] = useState<TestResults>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

  const runTest = async (testName: string, testFn: () => Promise<TestResult>) => {
    setLoading(prev => ({ ...prev, [testName]: true }));
    try {
      const result = await testFn();
      setResults(prev => ({ ...prev, [testName]: result }));
      return result;
    } catch (error) {
      setResults(prev => ({ ...prev, [testName]: { success: false, error: error.message } }));
      return { success: false, error: error.message };
    } finally {
      setLoading(prev => ({ ...prev, [testName]: false }));
    }
  };

  const runAllTestsSequentially = async () => {
    setLoading(prev => ({ ...prev, 'all': true }));
    
    // Clear previous results
    setResults({});
    
    // Run tests in sequence
    const walletResult = await runTest('walletConnection', testWalletConnection);
    
    // Only continue if wallet connection succeeded
    if (walletResult.success) {
      const trustDAIResult = await runTest('trustDAIContract', testTrustDAIContract);
      const ethStorageResult = await runTest('ethStorageConnection', testEthStorageConnection);
      
      // Only test file upload if all previous tests passed
      if (trustDAIResult.success && ethStorageResult.success) {
        await runTest('fileUpload', testFileUpload);
      }
    }
    
    setLoading(prev => ({ ...prev, 'all': false }));
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Blockchain Integration Tests</h1>
      
      <div className="grid gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Code className="mr-2 h-5 w-5" />
              Test Environment
            </CardTitle>
            <CardDescription>
              Run tests to verify your blockchain configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                Make sure you have set up your .env file with the correct contract addresses and have MetaMask installed.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="default" 
              onClick={runAllTestsSequentially}
              disabled={loading['all']}
            >
              {loading['all'] ? 'Running Tests...' : 'Run All Tests'}
            </Button>
          </CardFooter>
        </Card>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Wallet Connection Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wallet className="mr-2 h-5 w-5" />
                Wallet Connection
              </CardTitle>
              <CardDescription>
                Test connection to MetaMask
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.walletConnection && (
                <div className="mb-4">
                  {results.walletConnection.success ? (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <AlertTitle className="text-green-700">Connected</AlertTitle>
                      <AlertDescription className="text-green-700">
                        Account: {results.walletConnection.account}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="bg-red-50 border-red-200">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <AlertTitle className="text-red-700">Failed</AlertTitle>
                      <AlertDescription className="text-red-700">
                        {results.walletConnection.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={() => runTest('walletConnection', testWalletConnection)}
                disabled={loading['walletConnection']}
              >
                {loading['walletConnection'] ? 'Connecting...' : 'Test Connection'}
              </Button>
            </CardFooter>
          </Card>

          {/* TrustDAI Contract Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                TrustDAI Contract
              </CardTitle>
              <CardDescription>
                Test TrustDAI contract connection
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.trustDAIContract && (
                <div className="mb-4">
                  {results.trustDAIContract.success ? (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <AlertTitle className="text-green-700">Connected</AlertTitle>
                      <AlertDescription className="text-green-700">
                        Files: {results.trustDAIContract.fileCount}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="bg-red-50 border-red-200">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <AlertTitle className="text-red-700">Failed</AlertTitle>
                      <AlertDescription className="text-red-700">
                        {results.trustDAIContract.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={() => runTest('trustDAIContract', testTrustDAIContract)}
                disabled={loading['trustDAIContract']}
              >
                {loading['trustDAIContract'] ? 'Testing...' : 'Test Contract'}
              </Button>
            </CardFooter>
          </Card>

          {/* EthStorage Connection Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                EthStorage Connection
              </CardTitle>
              <CardDescription>
                Test EthStorage contract connection
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.ethStorageConnection && (
                <div className="mb-4">
                  {results.ethStorageConnection.success ? (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <AlertTitle className="text-green-700">Connected</AlertTitle>
                      <AlertDescription className="text-green-700">
                        EthStorage contract connected successfully
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="bg-red-50 border-red-200">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <AlertTitle className="text-red-700">Failed</AlertTitle>
                      <AlertDescription className="text-red-700">
                        {results.ethStorageConnection.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={() => runTest('ethStorageConnection', testEthStorageConnection)}
                disabled={loading['ethStorageConnection']}
              >
                {loading['ethStorageConnection'] ? 'Testing...' : 'Test Connection'}
              </Button>
            </CardFooter>
          </Card>

          {/* File Upload Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="mr-2 h-5 w-5" />
                File Upload
              </CardTitle>
              <CardDescription>
                Test uploading a file to EthStorage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.fileUpload && (
                <div className="mb-4">
                  {results.fileUpload.success ? (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <AlertTitle className="text-green-700">Uploaded</AlertTitle>
                      <AlertDescription className="text-green-700">
                        CID: {results.fileUpload.cid}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="bg-red-50 border-red-200">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <AlertTitle className="text-red-700">Failed</AlertTitle>
                      <AlertDescription className="text-red-700">
                        {results.fileUpload.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={() => runTest('fileUpload', testFileUpload)}
                disabled={loading['fileUpload']}
              >
                {loading['fileUpload'] ? 'Uploading...' : 'Test Upload'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <Separator className="my-8" />

      <div className="prose max-w-none">
        <h2>TrustDAI Contract Deployment</h2>
        <p>
          If the TrustDAI contract test fails, you may need to deploy the contract to the Sepolia testnet.
          Follow these steps:
        </p>
        
        <ol>
          <li>
            <strong>Install Hardhat:</strong>
            <pre>npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox</pre>
          </li>
          <li>
            <strong>Create a Hardhat project:</strong>
            <pre>npx hardhat init</pre>
          </li>
          <li>
            <strong>Copy TrustDAI.sol to the contracts folder</strong>
          </li>
          <li>
            <strong>Create a deployment script in scripts/deploy.js:</strong>
            <pre>{`const { ethers } = require("hardhat");

async function main() {
  const TrustDAI = await ethers.getContractFactory("TrustDAI");
  const trustDAI = await TrustDAI.deploy();
  await trustDAI.deployed();
  console.log("TrustDAI deployed to:", trustDAI.address);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});`}</pre>
          </li>
          <li>
            <strong>Configure Sepolia in hardhat.config.js:</strong>
            <pre>{`require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.17",
  networks: {
    sepolia: {
      url: "https://rpc.sepolia.org",
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};`}</pre>
          </li>
          <li>
            <strong>Deploy to Sepolia:</strong>
            <pre>npx hardhat run scripts/deploy.js --network sepolia</pre>
          </li>
          <li>
            <strong>Update your .env file with the new contract address</strong>
          </li>
        </ol>
        
        <h2>EthStorage Configuration</h2>
        <p>
          For EthStorage to work correctly, you need:
        </p>
        <ul>
          <li>A wallet with ETH on QuarkChain L2 TestNet (Chain ID: 3335)</li>
          <li>The correct EthStorage contract address in your .env file</li>
          <li>A properly configured RPC URL for EthStorage</li>
        </ul>
        <p>
          You can bridge ETH from Sepolia to QuarkChain L2 using the <a href="https://beta.testnet.ethstorage.io/bridge" target="_blank">EthStorage bridge</a>.
        </p>
      </div>
    </div>
  );
} 