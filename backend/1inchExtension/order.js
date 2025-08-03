const Redis = require('ioredis');
const redis = new Redis();

async function storeTempOrder(order) {
	const key = `unverified:order:${order.id}`;
	await redis.setex(key, 30, JSON.stringify(order)); // 30s TTL
	console.log("temporary stored ", key);
}

async function storeVerifiedOrder(orderId) {
	const tempKey = `unverified:order:${orderId}`;
	const rawOrder = await redis.get(tempKey);
	if (!rawOrder) return console.log("Order expired or invalid");
  
	const order = JSON.parse(rawOrder);
  
	await redis.multi()
	  .del(tempKey)
	  .hset("orders:map", orderId, JSON.stringify(order))
	  .lpush("orders:active", orderId)
	  .publish("orders:verified", orderId)
	  .exec();
  
	console.log("Order stored permanently:", orderId);
}

async function getAllOrders() {
	const orderIds = await redis.lrange("orders:active", 0, -1);
	if (!orderIds.length) return [];
  
	const rawOrders = await redis.hmget("orders:map", ...orderIds);
  
	const parsed = rawOrders.map((raw, i) => ({
	  id: orderIds[i],
	  ...JSON.parse(raw),
	}));
  
	return parsed;
  }
  
async function removeOrder(orderId) {
	const rawOrder = await redis.hget("orders:map", orderId);
	if (!rawOrder) return false;
  
	await redis.multi()
	  .hdel("orders:map", orderId)
	  .lrem("orders:active", 0, orderId)
	  .publish("orders:taken", orderId)
	  .exec();
  
	console.log("Order taken:", orderId);
	return true;
}

async function updateOrder(orderId, updates) {
	const raw = await redis.hget("orders:map", orderId);
	if (!raw) return console.log("Order not found");
  
	const order = JSON.parse(raw);
	Object.assign(order, updates);
  
	await redis.multi()
	  .hset("orders:map", orderId, JSON.stringify(order))
	  .publish("orders:updated", orderId)
	  .exec();
  
	console.log("Order updated:", orderId);
  }
  
  
module.exports = {
	storeTempOrder,
	storeVerifiedOrder,
	removeOrder,
	updateOrder,
	getAllOrders
};