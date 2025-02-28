import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import EthereumCheck from '@/services/EthereumCheck';
import NetworkCheck, { NETWORKS, REQUIRED_NETWORKS } from '@/utils/NetworkCheck';
import { ethers } from 'ethers';

const DebugPage = () => {
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState<boolean>(false);
  const [account, setAccount] = useState<string | null>(null);
  const [networkId, setNetworkId] = useState<number | null>(null);
  const [networkName, setNetworkName] = useState<string>('Unknown');
  const [isTestingTrustDAI, setIsTestingTrustDAI] = useState<boolean>(false);
  const [trustDAIResult, setTrustDAIResult] = useState<string>('');
  const [isTestingEthStorage, setIsTestingEthStorage] = useState<boolean>(false);
  const [ethStorageResult, setEthStorageResult] = useState<string>('');
  const [envVariables, setEnvVariables] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check MetaMask installation
    const metaMaskInstalled = EthereumCheck.isMetaMaskInstalled();
    setIsMetaMaskInstalled(metaMaskInstalled);

    // Get environment variables
    setEnvVariables({
      CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || 'Not set',
      ETHSTORAGE_CONTRACT_ADDRESS: process.env.ETHSTORAGE_CONTRACT_ADDRESS || 'Not set',
      NETWORK: process.env.NETWORK || 'Not set',
      RPC_URL: process.env.RPC_URL || 'Not set',
      ETHSTORAGE_RPC_URL: process.env.ETHSTORAGE_RPC_URL || 'Not set',
      BLOB_ARCHIVER_API_URL: process.env.BLOB_ARCHIVER_API_URL || 'Not set',
    });

    if (metaMaskInstalled) {
      // Check connected account
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          }
        })
        .catch(console.error);

      // Get network info
      NetworkCheck.getCurrentNetworkId()
        .then(id => {
          setNetworkId(id);
          if (id) {
            setNetworkName(NETWORKS[id] || `Chain ID: ${id}`);
          }
        })
        .catch(console.error);

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        setAccount(accounts.length > 0 ? accounts[0] : null);
      });

      // Listen for network changes
      window.ethereum.on('chainChanged', () => {
        NetworkCheck.getCurrentNetworkId()
          .then(id => {
            setNetworkId(id);
            if (id) {
              setNetworkName(NETWORKS[id] || `Chain ID: ${id}`);
            }
          })
          .catch(console.error);
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  const handleConnect = async () => {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      }
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
    }
  };

  const switchToSepolia = async () => {
    await NetworkCheck.switchToNetwork(REQUIRED_NETWORKS.TRUSTDAI);
  };

  const switchToQuarkChain = async () => {
    try {
      const success = await NetworkCheck.switchToNetwork(REQUIRED_NETWORKS.ETHSTORAGE);
      if (!success) {
        await NetworkCheck.addQuarkChainL2Network();
      }
    } catch (error) {
      console.error('Error switching to QuarkChain:', error);
    }
  };

  const testTrustDAIContract = async () => {
    setIsTestingTrustDAI(true);
    setTrustDAIResult('Testing TrustDAI contract connection...');
    
    try {
      const contractAddress = process.env.CONTRACT_ADDRESS;
      if (!contractAddress) {
        setTrustDAIResult('Error: CONTRACT_ADDRESS not set in environment variables');
        setIsTestingTrustDAI(false);
        return;
      }
      
      // Check if we're on the right network
      const isOnSepolia = await NetworkCheck.isConnectedToNetwork(REQUIRED_NETWORKS.TRUSTDAI);
      if (!isOnSepolia) {
        setTrustDAIResult(`Error: Not connected to Sepolia. Please switch networks.`);
        setIsTestingTrustDAI(false);
        return;
      }
      
      // Simple call to check contract
      const provider = new ethers.BrowserProvider(window.ethereum);
      const code = await provider.getCode(contractAddress);
      
      if (code === '0x') {
        setTrustDAIResult(`Error: No contract found at address ${contractAddress}`);
      } else {
        setTrustDAIResult(`Success: Contract found at ${contractAddress}`);
      }
    } catch (error) {
      setTrustDAIResult(`Error: ${error.message}`);
    }
    
    setIsTestingTrustDAI(false);
  };

  const testEthStorageContract = async () => {
    setIsTestingEthStorage(true);
    setEthStorageResult('Testing EthStorage contract connection...');
    
    try {
      const contractAddress = process.env.ETHSTORAGE_CONTRACT_ADDRESS;
      if (!contractAddress) {
        setEthStorageResult('Error: ETHSTORAGE_CONTRACT_ADDRESS not set in environment variables');
        setIsTestingEthStorage(false);
        return;
      }
      
      // This test is more tricky since it's on another network
      // We'll just report the address information for now
      setEthStorageResult(`EthStorage contract address: ${contractAddress}
RPC URL: ${process.env.ETHSTORAGE_RPC_URL || 'Not set'}
Blob Archiver URL: ${process.env.BLOB_ARCHIVER_API_URL || 'Not set'}

Note: Full testing requires switching to QuarkChain network.`);
    } catch (error) {
      setEthStorageResult(`Error: ${error.message}`);
    }
    
    setIsTestingEthStorage(false);
  };

  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">TrustDAI Debug Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>MetaMask Status</CardTitle>
            <CardDescription>Information about your MetaMask connection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>MetaMask Installed:</strong> {isMetaMaskInstalled ? 'Yes ✅' : 'No ❌'}
            </div>
            
            {isMetaMaskInstalled && (
              <>
                <div>
                  <strong>Connected Account:</strong> {account ? `${account} ✅` : 'Not connected ❌'}
                </div>
                <div>
                  <strong>Current Network:</strong> {networkName} {networkId === REQUIRED_NETWORKS.TRUSTDAI ? '✅' : '❓'}
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col items-start space-y-2">
            {isMetaMaskInstalled && !account && (
              <Button onClick={handleConnect}>Connect to MetaMask</Button>
            )}
            {isMetaMaskInstalled && account && (
              <div className="space-y-2 w-full">
                <Button onClick={switchToSepolia} className="w-full">Switch to Sepolia</Button>
                <Button onClick={switchToQuarkChain} className="w-full">Switch to QuarkChain L2</Button>
              </div>
            )}
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
            <CardDescription>Current environment configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded overflow-auto max-h-48">
              <pre className="text-xs">
                {JSON.stringify(envVariables, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>TrustDAI Contract Test</CardTitle>
            <CardDescription>Test connection to TrustDAI contract</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded overflow-auto max-h-48">
              <pre className="text-xs">{trustDAIResult || 'Click "Test Connection" to begin'}</pre>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={testTrustDAIContract} 
              disabled={isTestingTrustDAI || !account}
              className="w-full"
            >
              {isTestingTrustDAI ? 'Testing...' : 'Test TrustDAI Connection'}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>EthStorage Contract Test</CardTitle>
            <CardDescription>Test connection to EthStorage contract</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded overflow-auto max-h-48">
              <pre className="text-xs">{ethStorageResult || 'Click "Test Connection" to begin'}</pre>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={testEthStorageContract} 
              disabled={isTestingEthStorage || !account}
              className="w-full"
            >
              {isTestingEthStorage ? 'Testing...' : 'Test EthStorage Connection'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default DebugPage; 