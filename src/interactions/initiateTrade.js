import { getContract } from '../utils/contract';
import { ethers } from "ethers";
import { chainMap } from '../utils/chainMap';



export const initiateTrade = async (
	oldCurrency,
	newCurrency,
	newChain,
	amount,
	startReturnAmount = 0,
	minReturnAmount = -1,
	maxDuration = 3600,
) => {
	const now = Math.floor(Date.now() / 1000);
	const startTimestamp = now + 60;
	const expirationTimestamp = now + maxDuration; 
	const provider = new ethers.BrowserProvider(window.ethereum); 
	await provider.send("eth_requestAccounts", []);
	const signer = await provider.getSigner();
	const messageHash = ethers.keccak256(ethers.toUtf8Bytes("sign this order"));
	const signature = await signer.signMessage(ethers.getBytes(messageHash));
	if (minReturnAmount == -1)
		minReturnAmount = startReturnAmount * 0.8;

	try {
		const contract = await getContract(oldCurrency);
		const tx = await contract.createOrder(
			chainMap[token][oldToken],
			amount,
			chainMap[token][newToken],
			chainMap[chainId][newChain],
			startReturnAmount,
			startTimestamp,
			minReturnAmount,
			expirationTimestamp,
			signature
		);
		await tx.wait();
		console.log("Success!");
		
	  } catch (err) {
		console.error("Tx failed:", err);
	  }
};