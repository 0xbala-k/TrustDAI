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
VITE_CLIENT_PRIV_KEY="kjdbsjbfladf....."
VITE_CLIENT_SWA="skdjbfvjkdsv......."

# Google OAuth credentials (Required only if you want to enable Google Sign-In)
VITE_GOOGLE_CLIENT_ID="10.....apps.googleusercontent.com"
```
4. `npm run dev`
