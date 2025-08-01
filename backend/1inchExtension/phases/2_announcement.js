

const ContractListener = require('../utils/ContractListener');
const contracts = require('../utils/contractData');
const {storeVerifiedOrder} = require('../order');

function announcement(value, sender){
	console.log("event emited new order: ", value);
	const id = Number(value);
	storeVerifiedOrder(id);
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