#!/bin/bash

# Repair script for Vite/React development environment
echo "TrustDAI Vite/React Environment Repair Script"
echo "============================================="
echo ""

# Stop any running Vite servers
echo "Step 1: Stopping any running Vite processes..."
pkill -f vite || true
echo "Done!"
echo ""

# Clear Vite cache
echo "Step 2: Clearing Vite cache..."
rm -rf node_modules/.vite || true
echo "Done!"
echo ""

# Reinstall dependencies
echo "Step 3: Reinstalling dependencies (this may take a while)..."
echo "Do you want to perform a clean reinstall (delete node_modules and package-lock.json)? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
  echo "Removing node_modules and package-lock.json..."
  rm -rf node_modules
  rm -f package-lock.json
  echo "Running npm install..."
  npm install
else
  echo "Running npm install --force to refresh packages..."
  npm install --force
fi
echo "Done!"
echo ""

# Update Vite config
echo "Step 4: Ensuring Vite config is optimal..."
if grep -q "optimizeDeps.*include.*react" vite.config.ts; then
  echo "Vite configuration looks good!"
else
  echo "Your Vite configuration might need updates. Please check vite.config.ts."
fi
echo ""

# Start dev server
echo "Step 5: Ready to start development server"
echo "Would you like to start the dev server now? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
  echo "Starting development server..."
  npm run dev
else
  echo "You can start the server manually with: npm run dev"
fi

echo ""
echo "============================================="
echo "Repair process completed! If you still have issues:"
echo "1. Visit http://localhost:8080/custom-test.html to run module diagnostics"
echo "2. Try running with different browsers"
echo "3. Check your browser console for specific errors"
echo "=============================================" 