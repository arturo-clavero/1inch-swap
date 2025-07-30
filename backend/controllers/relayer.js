const { ethers } = require("ethers");
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const abi = require(path.resolve(__dirname, '../../abi/HTLC.json'));
//MAKE HTLC BE CONTROLLED BY RELAYER
//predefined keys
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETH_WC_URL = process.env.ETH_WC_URL;
const SCROLL_WC_URL = process.env.SCROLL_WC_URL;
const ETH_CONTRACT_ADDRESS = process.env.ETH_CONTRACT_ADDRESS;
const SCROLL_CONTRACT_ADDRESS = process.env.SCROLL_CONTRACT_ADDRESS;

//providers
const ethProvider = new ethers.WebSocketProvider(ETH_WC_URL);
const scrollProvider = new ethers.WebSocketProvider(SCROLL_WC_URL);

//walllets
const ethWallet = new ethers.Wallet(PRIVATE_KEY, ethProvider);
const scrollWallet =  new ethers.Wallet(PRIVATE_KEY, scrollProvider);

//contracts connected to the relayer wallet
const ethHTLC = new ethers.Contract(ETH_CONTRACT_ADDRESS, abi, ethWallet);
const scrollHTLC = new ethers.Contract(SCROLL_CONTRACT_ADDRESS, abi, scrollWallet);

module.exports = { ethHTLC, scrollHTLC, ethWallet, scrollWallet, ethProvider, scrollProvider};