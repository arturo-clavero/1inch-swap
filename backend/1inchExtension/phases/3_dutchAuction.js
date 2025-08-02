const {getAllOrders, removeOrder} = require('../order.js');
const { setupOrderWatcher } = require('../resolvers/orderWatcher.js');

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
// 	const allOrders = await getAllOrders();
// 	for (i = 0; i < allOrders.length; i++){
// 		if (getDutchPrice(allOrders[i]) > self.minPrice)
// 		{
// 			const success = await fillOrder(self, allOrders[i]);
// 			if (success)
// 			{
// 				self.order = allOrders[i];
// 				removeOrder(allOrders[i]);
// 				await self.nextAction();
// 				return;
// 			}
// 		}
// 	}
// 	self.resolverStep -=1;
// 	setupOrderWatcher(self);
}

module.exports = {dutchAuction};