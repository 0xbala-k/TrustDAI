# Lit Protocol Setup Guide for TrustDAI

This guide will help you set up Lit Protocol for encrypted file sharing in TrustDAI.

## What is Lit Protocol?

[Lit Protocol](https://litprotocol.com/) is a decentralized key management network that enables access control for encrypted content. It allows for blockchain-based conditions to determine who can decrypt files.

## Prerequisites

- MetaMask wallet installed
- Node.js 14+ and npm/yarn
- TrustDAI application set up and running

## Installation Steps

### 1. Install Lit Protocol SDK

```bash
npm install @lit-protocol/lit-node-client @lit-protocol/constants
```

### 2. Replace Mock Implementation

In this demo, we've implemented a mock version of Lit Protocol. To use the real implementation:

1. Edit `src/services/LitProtocolService.ts`:
   - Uncomment the real imports from `@lit-protocol/lit-node-client`
   - Replace the mock implementation with the real Lit Protocol client

### 3. Configure Lit Protocol Network

By default, Lit Protocol points to the Serrano testnet. For production use, you'll want to point to the Habanero mainnet:

```typescript
// In src/services/LitProtocolService.ts
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LitNetwork } from '@lit-protocol/constants';

const litNodeClient = new LitNodeClient({
  litNetwork: LitNetwork.Habanero, // Use LitNetwork.Serrano for testnet
});
```

### 4. Setup Access Control Conditions

The current implementation uses TrustDAI's `hasAccess` function as the access control condition. You may want to customize this for your specific needs:

```typescript
private generateAccessControlConditions(fileCid: string): AccessControlConditions[] {
  return [
    {
      contractAddress: CONTRACT_ADDRESS,
      standardContractType: 'ERC20',
      chain: 'ethereum',
      method: 'hasAccess',
      parameters: [fileCid],
      returnValueTest: {
        comparator: '=',
        value: 'true'
      }
    }
  ];
}
```

## Wallet Setup for Lit Protocol

Lit Protocol uses the same wallet as your Ethereum interactions. There's no separate wallet setup required.

When a user attempts to encrypt or decrypt content:

1. Lit Protocol will request a signature from the user's MetaMask wallet
2. This signature is used to authenticate with the Lit nodes
3. If the access conditions are met, the encryption/decryption will proceed

## Testing the Setup

1. Enable the Lit Protocol feature via the toggle in the UI
2. Upload a file and ensure the "Encrypt with Lit Protocol" option is checked
3. Share the file with another wallet
4. Connect with the other wallet and verify you can decrypt the file

## Environment Specific Configurations

### Env to Env-AI Sharing

For sharing between the primary wallet (env) and the secondary wallet (env-ai):

1. The primary wallet encrypts a file using Lit Protocol
2. It sets access control conditions allowing the env-ai wallet address to decrypt
3. The env-ai wallet can then decrypt and access the file through the UI

When using the "Export to env-ai" button:

1. The file is decrypted by the primary wallet
2. The decrypted content is stored in a shared location
3. The env-ai wallet can access and process this content

### Batch Processing in Env-AI

To process multiple files at once in the env-ai environment:

1. Use the `EnvAiFileManager` utility:
   ```typescript
   import EnvAiFileManager from '../utils/EnvAiFileManager';
   
   // Get all shared files
   const files = EnvAiFileManager.getSharedFiles();
   
   // Save to a directory for processing
   const savedCount = EnvAiFileManager.saveAllSharedFilesToDirectory('./processing_folder');
   console.log(`Saved ${savedCount} files for processing`);
   ```

## Troubleshooting

### Common Issues

1. **Signature Request Fails**: Ensure the user's MetaMask is unlocked and connected to the correct network.

2. **Access Denied**: Verify that the access control conditions are correctly set and that the user has been granted access in the TrustDAI contract.

3. **Network Errors**: Check if the Lit Protocol network is reachable. Try switching between testnet and mainnet.

### Debug Mode

Enable debug logging for more detailed output:

```typescript
const litNodeClient = new LitNodeClient({
  litNetwork: LitNetwork.Serrano,
  debug: true
});
```

## Production Considerations

1. **Backup Strategies**: Consider implementing a backup mechanism for encryption keys in case users lose access to their wallets.

2. **Performance Optimization**: Large files should be chunked before encryption to improve performance.

3. **Cost Management**: Each encryption/decryption operation on Lit Protocol has a small cost. Consider implementing batching for multiple operations.

## Resources

- [Lit Protocol Documentation](https://developer.litprotocol.com/)
- [Access Control Conditions Guide](https://developer.litprotocol.com/v3/access-control/intro)
- [Lit JS SDK Reference](https://github.com/LIT-Protocol/js-sdk)

## Support

For issues with Lit Protocol integration, consult:
- [Lit Protocol Discord](https://discord.com/invite/34KZxmF7m9)
- [Lit Protocol GitHub Issues](https://github.com/LIT-Protocol/js-sdk/issues) 