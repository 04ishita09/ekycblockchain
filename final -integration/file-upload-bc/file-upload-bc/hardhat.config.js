// require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-waffle");
require('dotenv').config();
POLYGON_AMOY_RPC_URL="https://rpc-amoy.polygon.technology"
PRIVATE_KEY="666b24cf34933135f76427c2c38e4c73f89b3b009f506e24d99c8c1a3d10bd3d"

console.log("Hardhat configuration is being loaded...");
console.log("RPC URL:", POLYGON_AMOY_RPC_URL || "Not provided");
console.log("Private Key:", PRIVATE_KEY ? "Loaded" : "Not Loaded");
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    polygonAmoy: {
     // url: "https://rpc.sepolia.org",

     // url:"https://eth-sepolia.g.alchemy.com/v2/ibYsvii6TgGk-t-qIz_Br0t6C3PmNaY1",
     url: "https://rpc-amoy.polygon.technology", // Replace with the correct RPC URL for Polygon Amoy
    // accounts: [PRIVATE_KEY],  accounts: [process.env.PRIVATE_KEY], 
      accounts: [PRIVATE_KEY],// Use your private key (stored in an environment variable)
    },
  },
};
