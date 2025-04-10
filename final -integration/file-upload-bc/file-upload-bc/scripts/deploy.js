const hre = require("hardhat");

async function main() {
  const KYCStorage = await hre.ethers.getContractFactory("KYCStorage");
  const fileStorage = await KYCStorage.deploy();
  await fileStorage.deployed();
  console.log("FileStorage deployed to:", fileStorage.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });