const { ethers } = require("ethers");
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const abi = require(path.resolve(__dirname, '../../abi/HTLC.json'));

const ETH_RPC_URL = process.env.ETH_RPC_URL;
const SCROLL_RPC_URL = process.env.SCROLL_RPC_URL;
const ETH_CONTRACT_ADDRESS = process.env.ETH_CONTRACT_ADDRESS;
const SCROLL_CONTRACT_ADDRESS = process.env.SCROLL_CONTRACT_ADDRESS;

//providers
const ethProvider = new ethers.JsonRpcProvider(ETH_RPC_URL);
const scrollProvider = new ethers.JsonRpcProvider(SCROLL_RPC_URL);

//contracts connected to the relayer wallet
const ethContract = new ethers.Contract(ETH_CONTRACT_ADDRESS, abi, ethProvider );
const scrollContract = new ethers.Contract(SCROLL_CONTRACT_ADDRESS, abi, scrollProvider);

module.exports = {ethContract, scrollContract};