# TrustDAI - Decentralized Data Sharing Platform

TrustDAI is a decentralized application for secure personal data sharing with AI systems. It leverages blockchain technology, encryption with Lit Protocol, and environment-based access controls to give users complete authority over their data.

![TrustDAI Interface](https://i.imgur.com/example.png)

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/TrustDAI.git
cd TrustDAI

# Install dependencies
npm install

# Set up environment files
cp .env.example .env
cp .env.example .env-ai

# Start the development server
npm run dev
```

The app will be available at http://localhost:8080 (or next available port if 8080 is in use).

## 📋 Setup Requirements

### Prerequisites

- Node.js v16+
- NPM v8+
- MetaMask or other Web3 wallet browser extension
- Sepolia Testnet ETH
- TestLPX tokens (for Lit Protocol encryption)
- QKC tokens (for QuarkChain L2 storage)

## ⚙️ Environment Setup

Create two environment files to simulate the main and AI environments:

### `.env` (Main Environment)

```
VITE_APP_ENV=dev
VITE_CHAIN_ID=11155111
VITE_CONTRACT_ADDRESS=0x123456789abcdef123456789abcdef12345678
VITE_IPFS_GATEWAY=https://ipfs.io/ipfs/
VITE_ETHSTORAGE_ENDPOINT=https://eth.sep.w3link.io/
VITE_LIT_PROTOCOL_ENABLED=true
VITE_RPC_URL=https://sepolia.infura.io/v3/your-infura-key
```

### `.env-ai` (AI Environment)

```
VITE_APP_ENV=dev-ai
VITE_CHAIN_ID=11155111
VITE_CONTRACT_ADDRESS=0x123456789abcdef123456789abcdef12345678
VITE_IPFS_GATEWAY=https://ipfs.io/ipfs/
VITE_ETHSTORAGE_ENDPOINT=https://eth.sep.w3link.io/
VITE_LIT_PROTOCOL_ENABLED=true
VITE_RPC_URL=https://sepolia.infura.io/v3/your-infura-key
```

## 🔐 Obtaining Testnet Tokens

### Lit Protocol Testnet Tokens (tstLPX)

TrustDAI uses [Lit Protocol's Chronicle Yellowstone](https://developer.litprotocol.com/connecting-to-a-lit-network/lit-blockchains/chronicle-yellowstone) testnet for encryption services.

1. Add Chronicle Yellowstone to MetaMask:
   - Network Name: `Chronicle Yellowstone - Lit Protocol Testnet`
   - RPC URL: `https://yellowstone-rpc.litprotocol.com/`
   - Chain ID: `175188`
   - Currency Symbol: `tstLPX`
   - Block Explorer: `https://yellowstone-explorer.litprotocol.com/`

2. Use the Lit Protocol faucet to obtain test tokens (accessible from their documentation)

3. Switch back to Sepolia network for using TrustDAI

### QuarkChain Testnet Tokens (QKC)

For EthStorage functionality, TrustDAI uses QuarkChain L2 testnet.

1. Visit the [QuarkChain faucet](https://qkc-l2-faucet.eth.sep.w3link.io/)
2. Connect your wallet (must have at least 0.01 ETH on Ethereum mainnet)
3. Request QKC tokens (options for 10, 25, or 62.5 QKC)

## 🧪 Testing Features

### Web3 Links

TrustDAI generates web3 links using the [Web3URL standard](https://docs.web3url.io/) for accessing content stored in EthStorage. The links follow these formats:

1. **Gateway URLs** (for browser compatibility):
   - FlatDirectory format: `https://eth.sep.w3link.io/ethereum:{CONTRACT_ADDRESS}/{PATH}`
   - ENS name format: `https://eth.sep.w3link.io/{ENS_NAME}/{PATH}`
   - Legacy IPFS format: `https://eth.sep.w3link.io/ipfs/{CID}` (for backward compatibility)

2. **Native Web3URLs** (for applications supporting the protocol):
   - `web3://ethereum:{CONTRACT_ADDRESS}/{PATH}`
   - `web3://{ENS_NAME}/{PATH}`

Files uploaded through TrustDAI are stored in a FlatDirectory contract on EthStorage, providing:
- Better organization with directory-like paths
- Improved access control through smart contracts
- Ability to use user-friendly ENS names instead of contract addresses

For testing web3 links:
1. Visit http://localhost:8080/link-tester.html
2. Use the built-in tools to generate and test different link formats
3. The diagnostics tab can help troubleshoot any link access issues

### LPX Integration

To test Lit Protocol encryption using LPX tokens:
1. Visit http://localhost:8080/lit-test.html or http://localhost:8080/lit-api-test.html
2. Connect your wallet
3. Enable LPX feature
4. Run the encryption/decryption tests

### Mock Data Generation

During tests, the platform automatically generates appropriate mock data based on the selected categories. For example:
- Personal Information: names, dates, contact details
- Purchasing Habits: shopping preferences, brand affiliations
- Travel History: locations, accommodations, dates

## 🔧 Troubleshooting

### LPX Balance Not Showing
If your LPX balance is not showing correctly:
1. Ensure you have tstLPX tokens in your wallet on Chronicle Yellowstone network
2. Check that your wallet is properly connected
3. Visit the `/features` page and toggle Lit Protocol on/off
4. Refresh the application

### Web3 Links Not Working
If web3 links to EthStorage files are returning a 400 error:

1. Ensure you're using the correct URL format for EthStorage files: `https://eth.sep.w3link.io/ipfs/{CID}`
2. Note that Qm-style CIDs must be prefixed with `ipfs/`
3. For files using the newer format, use them directly without the `ipfs/` prefix
4. Use the application's built-in "Open" button which handles the correct formatting automatically
5. If creating links manually, refer to EthStorage documentation for proper URL formatting

## 💻 For AI Agents/Tools

If you're an AI agent or tool like Cursor interacting with this codebase, here's a quick guide:

```
TrustDAI is a React+TypeScript application using Vite that enables secure personal data sharing with AI systems. Key features:

1. Environment-based access control (dev and dev-ai environments)
2. Lit Protocol integration for encryption (LPX tokens)
3. QuarkChain L2 for storage (QKC tokens)
4. Web3 link generation with fallback mechanism

Important components:
- src/components/CategoryFileUpload.tsx: Main data upload dialog
- src/components/WalletConnection.tsx: Wallet integration
- src/services/LitProtocolService.ts: Encryption service
- src/utils/formatters.ts: Utility functions for web3 links
- public/live-test.html: Comprehensive testing interface

Key concepts:
- Users can upload personal data in categorized files
- Data can be encrypted using Lit Protocol (requires LPX tokens)
- Files are stored on EthStorage (requires QKC tokens)
- Web3 links provide access to files with appropriate permissions
```

## 📱 Demo Links

- Main Application: http://localhost:8080/
- Feature Toggle: http://localhost:8080/features
- Test Pages:
  - Live Test: http://localhost:8080/live-test.html
  - LPX API Test: http://localhost:8080/lit-api-test.html 
  - LPX Basic Test: http://localhost:8080/lit-test.html
  - Web3 Link Tester: http://localhost:8080/link-tester.html

## 📄 License

[MIT License](LICENSE)
