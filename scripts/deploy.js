const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting FHE Credit Scoring Contract Deployment...");
  console.log("=".repeat(70));

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  // Display network info
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, "(Chain ID:", network.chainId + ")");

  // Deploy CreditScoring contract
  console.log("\n📦 Deploying CreditScoring contract...");
  const CreditScoring = await ethers.getContractFactory("CreditScoring");
  const creditScoring = await CreditScoring.deploy();
  
  await creditScoring.waitForDeployment();
  const contractAddress = await creditScoring.getAddress();
  
  console.log("✅ CreditScoring deployed to:", contractAddress);

  // Get deployment transaction details
  const deploymentTx = creditScoring.deploymentTransaction();
  console.log("📄 Transaction hash:", deploymentTx.hash);

  // Wait for a few confirmations
  console.log("⏳ Waiting for confirmations...");
  await deploymentTx.wait(2);

  // Verify contract (if on supported network)
  if (network.chainId === 11155111) { // Sepolia
    console.log("\n🔍 Contract deployed on Sepolia - ready for verification");
    console.log("   Run: npx hardhat verify --network sepolia", contractAddress);
  }

  // Save deployment information
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId,
    contract: "CreditScoring",
    address: contractAddress,
    deployer: deployer.address,
    transactionHash: deploymentTx.hash,
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber()
  };

  // Create deployments directory
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info
  const deploymentFile = path.join(deploymentsDir, `deployment-${network.name}-${Date.now()}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("💾 Deployment info saved to:", deploymentFile);

  // Generate frontend configuration
  const frontendConfig = {
    contractAddress: contractAddress,
    network: network.name,
    chainId: network.chainId,
    abi: require("../artifacts/contracts/CreditScoring.sol/CreditScoring.json").abi
  };

  const frontendConfigFile = path.join(__dirname, "../frontend/src/config/contract-config.json");
  const frontendConfigDir = path.dirname(frontendConfigFile);
  
  if (!fs.existsSync(frontendConfigDir)) {
    fs.mkdirSync(frontendConfigDir, { recursive: true });
  }
  
  fs.writeFileSync(frontendConfigFile, JSON.stringify(frontendConfig, null, 2));
  console.log("🎨 Frontend config generated:", frontendConfigFile);

  // Display deployment summary
  console.log("\n" + "=".repeat(70));
  console.log("🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
  console.log("=".repeat(70));
  
  console.log("\n📊 Deployment Summary:");
  console.log("   • Contract: CreditScoring");
  console.log("   • Address:", contractAddress);
  console.log("   • Network:", network.name);
  console.log("   • Deployer:", deployer.address);
  console.log("   • Transaction:", deploymentTx.hash);

  console.log("\n🎯 Next Steps:");
  console.log("   1. Verify contract: npx hardhat verify --network sepolia " + contractAddress);
  console.log("   2. Run tests: npx hardhat test");
  console.log("   3. Start frontend: cd frontend && npm start");
  console.log("   4. Interact with contract using the frontend dApp");

  console.log("\n🔗 Useful Links:");
  if (network.chainId === 11155111) {
    console.log("   • Etherscan: https://sepolia.etherscan.io/address/" + contractAddress);
  }
  
  console.log("   • Contract ABI: artifacts/contracts/CreditScoring.sol/CreditScoring.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });