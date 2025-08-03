const ethers = require('ethers');

// const ContractListener = require('../utils/ContractListener');
// const {contracts, signer} = require('../utils/contractData');
const {storeVerifiedOrder} = require('../order');


async function announcement(orderId){
	console.log("event emited new order: ",  orderId);
	await storeVerifiedOrder(orderId);
}

module.exports =  announcement