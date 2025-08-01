const Redis = require("ioredis");
const redis = new Redis();

async function setupOrderWatcher(self) {
	console.log("order watch set up")

	const sub = redis.duplicate();
	const channel = '__keyspace@0__:orders';
  
	await sub.subscribe(channel);
	console.log("Watching for LPUSH on 'orders'...");
  
	sub.on('message', async (chan, event) => {
	  if (event === 'lpush') {
		console.log(`New order detected via LPUSH!`);
		const order = await redis.lindex('orders', -1);
		if (order)
		{
			console.log('Newest order:', order);
			await self.nextAction();
			return;
		}
	}
	});
}

module.exports = {setupOrderWatcher};