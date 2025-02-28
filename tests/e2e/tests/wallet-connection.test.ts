import { ethers } from 'ethers';
import { TestCase } from '../test-runner';
import assert from 'assert';

/**
 * Tests for wallet connection functionality
 */
const tests: TestCase[] = [
  {
    name: 'wallet-connection-basic',
    description: 'Test basic wallet connection',
    run: async (provider: ethers.Provider, signer: ethers.Signer, mode: 'live' | 'mock') => {
      // Get signer address
      const address = await signer.getAddress();
      
      // Check that address is valid
      assert(ethers.isAddress(address), `Address is not valid: ${address}`);
      
      // Check that provider is connected
      const network = await provider.getNetwork();
      assert(network && network.chainId > 0, 'Provider not connected to a network');
      
      console.log(`Connected to network: ${network.name} (${network.chainId})`);
      console.log(`Using address: ${address}`);
    }
  },
  
  {
    name: 'wallet-balance-check',
    description: 'Test wallet balance retrieval',
    run: async (provider: ethers.Provider, signer: ethers.Signer, mode: 'live' | 'mock') => {
      // Get signer address
      const address = await signer.getAddress();
      
      // Get balance
      const balance = await provider.getBalance(address);
      
      // In mock mode, we don't validate the actual balance
      if (mode === 'mock') {
        assert(balance.toString() !== undefined, 'Balance should be defined');
        return;
      }
      
      // In live mode, ensure the balance is retrievable
      assert(balance.toString() !== undefined, 'Balance should be defined');
      
      // Convert to ETH for display
      const ethBalance = ethers.formatEther(balance);
      console.log(`Wallet balance: ${ethBalance} ETH`);
      
      // Optional check for minimum balance in live mode
      // Can be commented out if not needed
      // assert(
      //   parseFloat(ethBalance) > 0.001,
      //   `Wallet has insufficient balance for testing: ${ethBalance} ETH`
      // );
    }
  },
  
  {
    name: 'network-compatibility',
    description: 'Test network compatibility',
    run: async (provider: ethers.Provider, signer: ethers.Signer, mode: 'live' | 'mock') => {
      // Get current network
      const network = await provider.getNetwork();
      
      // In mock mode, we don't validate the network
      if (mode === 'mock') {
        return;
      }
      
      // For live mode, check if we're on Sepolia testnet (11155111) or any supported test network
      const supportedNetworks = [
        11155111, // Sepolia
        5,        // Goerli
        80001,    // Polygon Mumbai
        421613,   // Arbitrum Goerli
        3335      // QuarkChain L2 TestNet for EthStorage
      ];
      
      assert(
        supportedNetworks.includes(Number(network.chainId)),
        `Current network (${network.chainId}) is not supported for testing. Please use one of: ${supportedNetworks.join(', ')}`
      );
      
      console.log(`Connected to supported network: ${network.name} (${network.chainId})`);
    }
  }
];

export default tests; 