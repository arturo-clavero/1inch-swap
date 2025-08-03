import { getContract } from '../utils/contract';
import {createOrder, MAX_REFILLS} from './order';
import { hexlify} from "ethers";
import { chainMap } from '../utils/chainMap';
import axios from 'axios';

function toHexString(input) {
	if (typeof input === "string" && input.startsWith("0x")) {
		return input;
	}
	if (input?.type === "Buffer" && Array.isArray(input.data)) {
		return hexlify(Uint8Array.from(input.data));
	}
	return hexlify(input);
}

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
	//oldToken = "ERC20";//test erc20!
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
		const contract = await getContract(oldChain);//calling source contract
		const tx = await contract.createOrder(
			order.oldTokenAddress,
			BigInt(order.totalAmount),
			order.newTokenAddress,
			order.newChainId,
			BigInt(order.startReturnAmount),
			BigInt(order.minReturnAmount),
			BigInt(order.minRefills),
			BigInt(order.startTimestamp),
			BigInt(order.expirationTimestamp),
			toHexString(order.signature),
			toHexString(order.secretHash),
			BigInt(order.id),
			{
				value: order.oldToken === "ETH" ? BigInt(order.totalAmount) : 0n,
				gasLimit: 1000000
			}
		);
		const receipt = await tx.wait();
		if (receipt.status == 1){
			console.log("Tx ok", order.id);
			axios.post('http://localhost:3000/api/broadcastVerifiedOrder', { id: order.id });
		}
	} catch (err) {
		console.error("Tx failed:", err);
	}

};