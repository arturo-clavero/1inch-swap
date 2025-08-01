import { getContract } from '../utils/contract';
import { ethers , parseUnits} from "ethers";
import { chainMap } from '../utils/chainMap';

export const initiateTrade = async (
	oldToken,
	newToken,
	newChain,
	amount,
	startReturnAmount,
	minReturnAmount = null,
	maxDuration = null,
) => {
	if (minReturnAmount == null) minReturnAmount = startReturnAmount * 0.8;
	if (maxDuration == null) maxDuration = 3600;
	
	const now = Math.floor(Date.now() / 1000);
	const startTimestamp = now + 60;
	const expirationTimestamp = now + maxDuration; 
	const provider = new ethers.BrowserProvider(window.ethereum); 
	await provider.send("eth_requestAccounts", []);
	const signer = await provider.getSigner();
	const messageHash = ethers.keccak256(ethers.toUtf8Bytes("sign this order"));
	const signature = await signer.signMessage(ethers.getBytes(messageHash));
	
	try {
		const contract = await getContract(oldToken);
		console.log(contract.interface.fragments.map(f => f.name));

		console.log("before tx")
		console.log("Old Token Address:", chainMap["token"][oldToken]);
		console.log("Amount:", amount);
		console.log("New Token Address:", chainMap["token"][newToken]);
		console.log("New Chain ID:", chainMap["chainId"][newChain]);
		console.log("Start Return Amount:", startReturnAmount);
		console.log("Start Timestamp:", startTimestamp);
		console.log("Minimum Return Amount:", minReturnAmount);
		console.log("max duration: ", maxDuration)
		console.log("now: ", now);
		console.log("Expiration Timestamp:", expirationTimestamp);
		console.log("Signature:", signature);
		
		const tx = await contract.createOrder(
			chainMap["token"][oldToken],
			parseUnits(`${amount}`, chainMap["decimals"][oldToken]),
			chainMap["token"][newToken],
			chainMap["chainId"][newChain],
			parseUnits(`${startReturnAmount}`, chainMap["decimals"][newToken]),
			startTimestamp,
			parseUnits(`${minReturnAmount}`, chainMap["decimals"][newToken]),
			expirationTimestamp,
			signature
		);
		await tx.wait();
		console.log("tx done");
	} catch (err) {
		console.error("Tx failed:", err);
	}
};