#!/bin/bash

echo "TrustDAI Environment Tester"
echo "==========================="
echo

# Test if required files exist
if [ ! -f .env ] || [ ! -f .env-ai ]; then
    echo "Error: Missing environment files. Run setup.sh first."
    exit 1
fi

# Function to start the dev environment and run tests
test_env() {
    local env_file=$1
    local env_name=$2
    
    echo "Testing $env_name environment..."
    echo "--------------------------------"
    
    # Export environment variables
    export $(grep -v '^#' $env_file | xargs)
    
    echo "Chain ID: $VITE_CHAIN_ID"
    echo "Contract: $VITE_CONTRACT_ADDRESS"
    echo "Lit Protocol Enabled: $VITE_LIT_PROTOCOL_ENABLED"
    
    # Check connection to Ethereum RPC
    echo -n "Testing Ethereum RPC connection... "
    curl -s -X POST -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        $VITE_RPC_URL > /dev/null
    
    if [ $? -eq 0 ]; then
        echo "Success"
    else 
        echo "Failed"
    fi
    
    # Check connection to Lit Protocol RPC if enabled
    if [ "$VITE_LIT_PROTOCOL_ENABLED" = "true" ]; then
        echo -n "Testing Lit Protocol RPC connection... "
        curl -s -X POST -H "Content-Type: application/json" \
            --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
            $VITE_LIT_PROTOCOL_RPC_URL > /dev/null
            
        if [ $? -eq 0 ]; then
            echo "Success"
        else 
            echo "Failed"
        fi
    fi
    
    # Check connection to QuarkChain RPC
    echo -n "Testing QuarkChain RPC connection... "
    curl -s -X POST -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        $VITE_QUARKCHAIN_RPC_URL > /dev/null
            
    if [ $? -eq 0 ]; then
        echo "Success"
    else 
        echo "Failed"
    fi
    
    echo
}

# Test both environments
test_env ".env" "Primary (dev)"
test_env ".env-ai" "AI (dev-ai)"

echo "For live testing with wallets, run the application:"
echo "  npm run dev"
echo
echo "Then visit:"
echo "  http://localhost:8080/live-test.html"
echo
echo "Test complete!" 