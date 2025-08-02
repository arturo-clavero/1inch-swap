const ethers = require('ethers');

const ContractListener = require('../utils/ContractListener');
const contracts = require('../utils/contractData');
const {storeVerifiedOrder} = require('../order');


async function announcement(orderId){
	console.log("event emited new order: ",  orderId);
	await storeVerifiedOrder(orderId);
}

module.exports =  function listenVerifiedOrder() {
	const listenerETH = new ContractListener(
		contracts["ETH"],
		"OrderCreated",
		announcement
	);
	listenerETH.start();

	//TODO!!!
	
	// const listenerSCR = new ContractListener(
	// 	contracts["SCR"],
	// 	"OrderVerified",
	// 	announcement
	// );
	// listenerSCR.start();
}