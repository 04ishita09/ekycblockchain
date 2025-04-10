const express = require('express');
const multer = require('multer');
const axios = require('axios');
const Web3 = require('web3');
const fs = require('fs');
const FormData = require('form-data');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());  // Enable CORS for frontend requests
const port = process.env.PORT || 3001;
const upload = multer({ dest: 'uploads/' });

// Pinata credentials from .env
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;

// Initialize web3
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.POLYGON_AMOY_RPC_URL));

// Load the ABI from file (adjust the filename if needed)
const artifact = JSON.parse(fs.readFileSync('./KYCStorageABI.json', 'utf8'));
const contractABI = artifact.abi ? artifact.abi : artifact;
const contractAddress = process.env.CONTRACT_ADDRESS; // e.g., 0xAeaFb2AEc90070334Ad345d4Db0B93C956B107A9
const contract = new web3.eth.Contract(contractABI, contractAddress);

// Set up account from private key
const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

// Endpoint: Upload file and user details
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { name, email } = req.body;
    const file = req.file;
    if (!file || !name || !email) {
      return res.status(400).json({ error: 'Missing file or user details' });
    }
    const data = new FormData();
    data.append('file', fs.createReadStream(file.path));

    // Upload file to Pinata
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    const response = await axios.post(url, data, {
      maxContentLength: 'Infinity',
      headers: {
        ...data.getHeaders(),
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_API_KEY,
      },
    });

    const ipfsHash = response.data.IpfsHash;
    const publicURL = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

    // Record KYC details on blockchain
    const tx = contract.methods.uploadKYC(name, email, publicURL);
    const gas = await tx.estimateGas({ from: account.address });
    const gasPrice = await web3.eth.getGasPrice();
    const dataTx = tx.encodeABI();
    const txData = {
      from: account.address,
      to: contractAddress,
      data: dataTx,
      gas,
      gasPrice,
    };
    const receipt = await web3.eth.sendTransaction(txData);

    // Clean up the locally stored file
    fs.unlinkSync(file.path);

    res.json({ ipfsHash, publicURL, txReceipt: receipt });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

// Endpoint: Retrieve all KYC records
app.get('/records', async (req, res) => {
  try {
    const records = await contract.methods.getRecords().call();
    res.json({ records });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});