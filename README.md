# TrustDAI

## SetUp and Run
1. Run helper server : https://github.com/0xbala-k/TrustDAI-helper
2. Deploy contract:
    Pass the storage contract address from helper sever to the constructor
3. SetUp .env
Use the deployed smart contract address and the helper sever api endpoint
```bash
VITE_CONTRACT_ADDRESS = "0xd0EBaF6bAc19AA239853D94ec0FC0639F27eA986"
VITE_API_ENDPOINT="http://localhost:3000/"
```
4. `npm run dev`
