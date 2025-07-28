const { ethers } = require("ethers");
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });;

const abi = require("../abi/HTLC.json");

const ethProvider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);
const ethSingner = new ethers.Wallet(process.env.PRIVATE_KEY, ethProvider);
const ethContract = new ethers.Contract(process.env.ETH_CONTRACT_ADDRESS, abi, ethSingner);

const scrollProvider = new ethers.JsonRpcProvider(process.env.SCROLL_RPC_URL);
const scrollSigner =  new ethers.Wallet(process.env.PRIVATE_KEY, scrollProvider);
const scrollContract = new ethers.Contract(process.env.SCROLL_CONTRACT_ADDRESS, abi, scrollSigner);

module.exports = { ethContract, scrollContract};