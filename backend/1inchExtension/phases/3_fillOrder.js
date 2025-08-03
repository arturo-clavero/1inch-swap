const {getAllOrders, removeOrder} = require('../order.js');
const { setupOrderWatcher } = require('../resolvers/orderWatcher.js');
const { WebSocketProvider, Contract, Wallet } = require('ethers');
const {contracts, providers, address} = require('../utils/contractData.js');
const ERC20_ABI = require('../../../abi/ERC20.json');

function getDutchPrice(order){
	const now = Math.floor(Date.now() / 1000);
	const elapsed = now - order.startTimestamp;
	const totalDuration = order.expirationTimestamp - order.startTimestamp;
	const amountRange = order.startReturnAmount - order.minReturnAmount;
	
	if (elapsed >= totalDuration) {
		return order.minReturnAmount;
	}
	
	const reduction = (amountRange * elapsed) / totalDuration;
	return Math.floor(order.startReturnAmount - reduction);
}

async function dutchAuction(self) {
	console.log(`[resolver ${self.id} in Auction ...`);
	const allOrders = await getAllOrders();
	for (i = 0; i < allOrders.length; i++){
		const order = allOrders[i];
		if (getDutchPrice(order) > self.minPrice)
		{
			const succeess = await attemptToFill(self, order);
			if (succeess) return;
		}
	}
	self.resolverStep -=1;
	setupOrderWatcher(self);
}

async function attemptToFill(self, order){
	const takerAmount = self.refillPercentRate * order.startReturnAmount
	const contract = contracts[order.oldChain];
	if (order.newToken != "ETH"){
		console.log("verifying token ...");
		// const signer = new Wallet(process.env.WALLET_PRIVATE_KEY, providers[order.newChain]);
		// const token = new Contract(order.newTokenAddress, ERC20_ABI, signer);
		// await token.approve(address[order.oldChain], takerAmount);
	}
	try {
		console.log("going to order...");
		const tx = await contract.fillOrder(
			BigInt(order.id),
			self.refillPercentRate == 1 ? true : false,
			BigInt(takerAmount),
		{
			value: order.newToken == "ETH" ? takerAmount : 0,
			gasLimit: 1_000_000  // just for debugging
		});
		const receipt = await tx.wait();
		if (receipt.status === 1) {
			console.log("Fill-Transaction succeeded");
			self.order = order;
			await self.nextAction();
			return true;
		} else {
			console.log("Fill-Transaction failed or reverted");
		}
	} catch(error){
		console.log("ERROR!: ", error);
		console.log("Fill-Transaction failed or reverted");
	}
	return false;
}
module.exports = {dutchAuction};