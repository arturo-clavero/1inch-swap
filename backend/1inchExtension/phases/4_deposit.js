//const {contracts, signer} = require("../../contracts/contractData");

async function deposit(self) {
	console.log(`[resolver ${self.id}] deposit in escrows`);

	//contracts[self.order.srcContractName].deposit(
	// 	self.order.sourceToken, 
	// 	self.order.amount
	// );
	//contracts[self.order.dstContractName].deposit(
	//	self.order.destinationToken,
	// 	self.order.exchangeQuote
	//); 

	await self.nextAction();
}

module.exports = {deposit};