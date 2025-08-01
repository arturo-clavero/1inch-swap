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
	console.log("hello");
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
	console.log("created order");
	try {
		console.log("hi");

		const contract = await getContract(oldToken);
		console.log("hu");
		console.log("contract:", contract);
		console.log("contract.interface:", contract?.interface);
		//console.log(contract.interface.getFunctionNames());

		console.log("hey");
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
			1
		);
		//await tx.wait();
		//DEBUGGING
		const receipt = await tx.wait();
		console.log("Transaction hash:", receipt.transactionHash);
		console.log("Status:", receipt.status); 
		console.log("Events emitted:");
		for (const event of receipt.events) {
		console.log(event.event, event.args);
		}
		console.log("logs: ");
		for (const log of receipt.logs) {
			console.log(log); // raw log data (topics, data, etc.)
		}
	} catch (err) {
		console.error("Tx failed:", err);
	}
};