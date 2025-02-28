#!/bin/bash

echo "TrustDAI Setup Script"
echo "====================="
echo

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install
echo "Dependencies installed successfully."
echo

# Create environment files if they don't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo ".env file created. You may want to customize it."
else
    echo ".env file already exists."
fi

if [ ! -f .env-ai ]; then
    echo "Creating .env-ai file..."
    cp .env.example .env-ai
    # Update the environment value in .env-ai
    sed -i.bak 's/VITE_APP_ENV=dev/VITE_APP_ENV=dev-ai/' .env-ai
    rm -f .env-ai.bak 2>/dev/null
    echo ".env-ai file created and configured for AI environment."
else
    echo ".env-ai file already exists."
fi

echo
echo "Setup complete! You can now start the application:"
echo "  npm run dev"
echo
echo "Visit http://localhost:8080 to access TrustDAI"
echo
echo "For testnet tokens:"
echo "  - LPX tokens: https://developer.litprotocol.com/connecting-to-a-lit-network/lit-blockchains/chronicle-yellowstone"
echo "  - QKC tokens: https://qkc-l2-faucet.eth.sep.w3link.io/"
echo
echo "Happy building!" 