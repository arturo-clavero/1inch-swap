const Redis = require("ioredis");
const redis = new Redis();

async function setupOrderWatcher(self) {
	console.log("order watch set up");

	const sub = redis.duplicate();
	await sub.subscribe("orders:verified");

	console.log("Watching for verified orders...");

	sub.on("message", async (channel, orderId) => {
		console.log("Verified order received:", orderId);
		const order = await redis.hget("orders:map", orderId);
		if (order) {
			console.log("there are orders...");
			await self.nextAction();
		}
	});
}


module.exports = {setupOrderWatcher};