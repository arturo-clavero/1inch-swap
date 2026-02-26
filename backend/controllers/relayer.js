const { ethers } = require("ethers");
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const htlcAbi = require(path.resolve(__dirname, '../../abi/HTLC.json'));
//MAKE HTLC BE CONTROLLED BY RELAYER
//predefined keys
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETH_WC_URL = process.env.ETH_WC_URL;
const SCROLL_WC_URL = process.env.SCROLL_WC_URL;
const ETH_CONTRACT_ADDRESS = process.env.ETH_CONTRACT_ADDRESS;
const SCROLL_CONTRACT_ADDRESS = process.env.SCROLL_CONTRACT_ADDRESS;

//providers
const ethereumProvider = new ethers.WebSocketProvider(ETH_WC_URL);
const scrollProvider = new ethers.WebSocketProvider(SCROLL_WC_URL);

//walllets
const ethereumWallet = new ethers.Wallet(PRIVATE_KEY, ethereumProvider);
const scrollWallet =  new ethers.Wallet(PRIVATE_KEY, scrollProvider);

//contracts connected to the relayer wallet
const ethereumHtlcContract = new ethers.Contract(ETH_CONTRACT_ADDRESS, htlcAbi, ethereumWallet);
const scrollHtlcContract = new ethers.Contract(SCROLL_CONTRACT_ADDRESS, htlcAbi, scrollWallet);

module.exports = {
	ethereumHtlcContract,
	scrollHtlcContract,
	ethereumWallet,
	scrollWallet,
	ethereumProvider,
	scrollProvider,
};