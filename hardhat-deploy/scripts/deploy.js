// Script to deploy the TrustDAI contract
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying TrustDAI contract...");
  
  // Get the ContractFactory
  const TrustDAI = await ethers.getContractFactory("TrustDAI");
  
  // Deploy the contract
  const trustDAI = await TrustDAI.deploy();
  
  // Wait for deployment to complete
  await trustDAI.waitForDeployment();
  
  // Get the contract address
  const address = await trustDAI.getAddress();
  
  console.log(`TrustDAI contract deployed to: ${address}`);
  console.log("\nUpdate your .env file with this address:");
  console.log(`CONTRACT_ADDRESS=${address}`);
}

// Run the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  }); 