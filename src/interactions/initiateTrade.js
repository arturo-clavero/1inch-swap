import { getContract } from '../utils/contract';
import {createOrder} from './order';
import { ethers , parseUnits} from "ethers";
import { chainMap } from '../utils/chainMap';

export const initiateTrade = async (
	oldToken,
	newToken,
	oldChain,
	newChain,
	amount,
	startReturnAmount,
	minReturnAmount = null,
	maxDuration = null,
) => {
	const order = await createOrder(
		oldToken,
		newToken,
		oldChain,
		newChain,
		amount,
		startReturnAmount,
		minReturnAmount,
		maxDuration
	)
	try {

		const contract = await getContract(oldToken);
		const tx = await contract.createOrder(
			order.oldToken,
			order.amount,
			order.newToken,
			order.newChain,
			order.startReturnAmount,
			order.startTimestamp,
			order.minReturnAmount,
			order.expirationTimestamp,
			order.signature,
			BigInt(order.id),
		);
		await tx.wait();
	} catch (err) {
		console.error("Tx failed:", err);
	}
};