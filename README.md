# TrustDAI - Decentralized File Management

TrustDAI is a decentralized file management system that leverages EthStorage for distributed file storage and smart contracts for access control.

## Features

- Secure decentralized file storage using EthStorage
- Smart contract-based access control
- File sharing and permissions management
- Modern React UI with Tailwind and Shadcn UI

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- MetaMask browser extension
- Ethereum testnet tokens (Sepolia)
- EthStorage testnet tokens (QuarkChain L2)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/trustdai.git
   cd trustdai
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create your environment file
   ```
   cp .env-sample .env
   ```

4. Edit the `.env` file and add your contract addresses and private key

5. Start the development server
   ```
   npm run dev
   ```

## Configuration

The application requires configuration for both the TrustDAI contract (on Sepolia) and EthStorage (on QuarkChain L2). 

### Environment Variables

- `CONTRACT_ADDRESS`: Your deployed TrustDAI contract address on Sepolia
- `ETHSTORAGE_CONTRACT_ADDRESS`: The EthStorage contract address (default is provided)
- `ETHSTORAGE_RPC_URL`: RPC URL for the EthStorage network
- `PRIVATE_KEY`: Your wallet's private key (for backend/test operations)

## Testing Blockchain Integration

Before building the UI, it's important to verify that your blockchain integration is working correctly.

### Testing from the Browser

1. Start the development server
   ```
   npm run dev
   ```

2. Navigate to `/test` in your browser (or click the "Test Connection" button on the home page)

3. Connect your MetaMask wallet

4. Run tests individually or click "Run All Tests" to test:
   - Wallet connection
   - TrustDAI contract connection
   - EthStorage contract connection 
   - File upload functionality

### Backend Testing (Node.js)

For more detailed testing of blockchain integration:

1. Run the blockchain integration test script
   ```
   npm run test:blockchain
   ```

2. The test will:
   - Verify wallet connectivity
   - Check TrustDAI contract deployment
   - Test EthStorage connectivity
   - Perform file operations (upload, access control, deletion)

### Troubleshooting Common Issues

#### TrustDAI Contract Issues

If the TrustDAI contract test fails, you may need to deploy the contract to Sepolia:

1. Install Hardhat and setup a project
   ```
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
   npx hardhat init
   ```

2. Configure Hardhat for Sepolia in `hardhat.config.js`:
   ```javascript
   require("@nomicfoundation/hardhat-toolbox");
   require("dotenv").config();
   
   module.exports = {
     solidity: "0.8.17",
     networks: {
       sepolia: {
         url: "https://rpc.sepolia.org",
         accounts: [process.env.PRIVATE_KEY]
       }
     }
   };
   ```

3. Create a deployment script in `scripts/deploy.js`:
   ```javascript
   const { ethers } = require("hardhat");
   
   async function main() {
     const TrustDAI = await ethers.getContractFactory("TrustDAI");
     const trustDAI = await TrustDAI.deploy();
     await trustDAI.deployed();
     console.log("TrustDAI deployed to:", trustDAI.address);
   }
   
   main().catch((error) => {
     console.error(error);
     process.exit(1);
   });
   ```

4. Deploy the contract:
   ```
   npx hardhat run scripts/deploy.js --network sepolia
   ```

5. Update your `.env` file with the newly deployed contract address

#### EthStorage Issues

For EthStorage to work correctly, you need:

1. A wallet with ETH on QuarkChain L2 TestNet (Chain ID: 3335)
   - You can bridge ETH from Sepolia to QuarkChain L2 using the [EthStorage bridge](https://beta.testnet.ethstorage.io/bridge)

2. Make sure your MetaMask is configured for both networks:
   - Sepolia: https://rpc.sepolia.org (Chain ID: 11155111)
   - QuarkChain L2: https://rpc.beta.testnet.l2.quarkchain.io:8545/ (Chain ID: 3335)

## Usage

1. Connect your wallet using the "Connect Wallet" button
2. Navigate to the File Manager
3. Upload files using the upload tab
4. Manage file permissions in the files tab
5. Share access with other wallet addresses
6. Download or delete your files

## Architecture

- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI
- **Smart Contracts**: Solidity (TrustDAI.sol)
- **Storage**: EthStorage for decentralized file storage
- **Networks**: 
  - Sepolia: TrustDAI contract
  - QuarkChain L2: EthStorage operations

## License

This project is licensed under the MIT License - see the LICENSE file for details

## End-to-End Testing

TrustDAI includes comprehensive end-to-end tests that can be run in both command-line and UI modes. These tests verify blockchain connectivity, contract interactions, Lit Protocol encryption, and personal data marketplace functionality.

### Command-Line Tests

Run tests from the command line using the following npm scripts:

```bash
# Run all tests in mock mode (no blockchain transactions)
npm run test:e2e:mock

# Run all tests in live mode (using actual blockchain)
npm run test:e2e:live

# Run with custom options
npm run test:e2e -- --mode=live --output=results.json --export
```

### UI-Based Tests

The application includes a UI-based test runner accessible through the app at `/tests`. This provides an interactive way to:

1. Select which tests to run
2. Choose between mock and live modes
3. View detailed test results
4. Debug failures

### Test Organization

Tests are organized into several categories:

- **Wallet Connection**: Tests basic wallet functionality
- **Contract Interaction**: Tests TrustDAI contract operations
- **Lit Protocol**: Tests encryption and access control
- **Personal Data Market**: Tests data category sharing and ElizaOS integration

## Personal Data Marketplace

TrustDAI includes a personal data marketplace that allows users to securely share specific categories of their personal data with AI systems like ElizaOS, while maintaining control over what information is shared.

### Data Categories

The marketplace supports the following data categories:

1. **Personal Information**: Basic details like name, date of birth, etc.
2. **Addresses**: Current and historical address information
3. **Interests & Preferences**: Hobbies, preferences, and behavioral data
4. **Travel History**: Countries visited, travel preferences, etc.
5. **Purchasing Habits**: Shopping patterns, brand preferences, etc.

### How It Works

1. **Data Ownership**: Users maintain ownership of their personal data
2. **Selective Sharing**: Users choose exactly which categories to share
3. **Pricing Control**: Users set their own prices for each data category
4. **Encryption**: Data is encrypted using Lit Protocol with blockchain-based access control
5. **Integration with ElizaOS**: Shared data enhances AI interactions through RAG

### ElizaOS Integration

When data is shared with env-ai, it can be processed and used to enhance ElizaOS RAG capabilities. The integration:

1. Processes structured personal data for retrieval
2. Enhances AI responses with personalized context
3. Improves recommendation quality based on user preferences

## Lit Protocol Integration

TrustDAI uses Lit Protocol for end-to-end encryption of sensitive data. This ensures that only authorized wallets can access encrypted content.

### Configuration

Configure Lit Protocol by updating the environment variables in `.env` and `.env-ai` files. See `.env-sample` for all available options.

### Using Encrypted Data Sharing

1. Enable the Lit Protocol feature in the UI
2. Upload files with encryption enabled
3. Grant access to specific wallet addresses
4. Recipients can decrypt files if they have been granted access

For more details, see [LIT_PROTOCOL_SETUP.md](./LIT_PROTOCOL_SETUP.md).
