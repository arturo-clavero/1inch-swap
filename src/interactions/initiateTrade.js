import { getContract } from '../utils/contract';
import {createOrder} from './order';
import { ethers , parseUnits} from "ethers";
import { chainMap } from '../utils/chainMap';
import axios from 'axios';

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
	oldToken = "ERC20";//test erc20!
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
		const contract = await getContract(oldToken);//calling source contract
		const tx = await contract.createOrder(
			order.oldTokenAddress,
			order.totalAmount,
			order.newTokenAddress,
			order.newChainId,
			order.startReturnAmount,
			order.startTimestamp,
			order.minReturnAmount,
			order.expirationTimestamp,
			order.signature,
			order.secretHash,
			BigInt(order.id),
			{
				value: oldToken == "ETH" ? order.totalAmount : 0n,
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