import { ethers , parseUnits} from "ethers";
import { chainMap } from '../utils/chainMap';
import axios from 'axios';

export async function createOrder(
	oldToken,
	newToken,
	oldChain,
	newChain,
	amount,
	startReturnAmount,
	minReturnAmount,
	maxDuration
)
{
	if (minReturnAmount == null) minReturnAmount = startReturnAmount * 0.8;
	if (maxDuration == null) maxDuration = 3600;
	const now = Math.floor(Date.now() / 1000);
	const startTimestamp = now + 60;
	const expirationTimestamp = now + maxDuration; 
	const order = {
		oldToken: chainMap["token"][oldToken],
		amount: parseUnits(`${amount}`, chainMap["decimals"][oldToken]),
		newToken: chainMap["token"][newToken],
		oldChain: chainMap["chainId"][oldChain],
		newChain: chainMap["chainId"][newChain],
		startReturnAmount: parseUnits(`${startReturnAmount}`, chainMap["decimals"][newToken]),
		startTimestamp: startTimestamp,
		minReturnAmount: parseUnits(`${minReturnAmount}`, chainMap["decimals"][newToken]),
		expirationTimestamp: expirationTimestamp,
		signature: null,
		secretHash: null,
		id : null,
	};
	order.id = generate_id(order);
	order.signature = await signOrder(order)
	order.secretHash =  await generateSecret(order);
//	await axios.post('http://localhost:3000/api/storeTempOrder', serializeOrder(order));
	return order;
}

async function signOrder(order) {
	const provider = new ethers.BrowserProvider(window.ethereum); 
	await provider.send("eth_requestAccounts", []);
	const signer = await provider.getSigner();
	const maker = await signer.getAddress();

	const types = [
		"uint256",
		"address",
		"address",
		"uint256",
		"address",
		"uint32",
		"uint32",
		"uint256",
		"uint256",
		"uint256",
		"uint256"
	];

	const values = [
		order.id,
		maker,
		order.oldToken,
		order.amount,
		order.newToken,
		order.oldChain,
		order.newChain,
		order.amount,
		order.startTimestamp,
		order.minReturnAmount,
		order.expirationTimestamp
	];

	const packed = ethers.AbiCoder.defaultAbiCoder().encode(types, values);
	const messageHash = ethers.keccak256(packed);
	const signature = await signer.signMessage(ethers.getBytes(messageHash));
	return signature;
}


function generate_id(order){
	const defaultAbiCoder = new ethers.AbiCoder();
	const encodedOrder = defaultAbiCoder.encode(
		[
		  "address",
		  "uint256",
		  "address",
		  "uint256",
		  "uint256",
		  "uint256",
		  "uint256",
		  "uint256"
		],
		[
		  order.oldToken,
		  order.amount,
		  order.newToken,
		  order.newChain,
		  order.startReturnAmount,
		  order.startTimestamp,
		  order.minReturnAmount,
		  order.expirationTimestamp
		]
	  );
	return ethers.keccak256(encodedOrder);
}

async function generateSecret(){
	return "hash!"
}

function serializeOrder(obj) {
	if (typeof obj === "bigint" || (obj._isBigNumber && obj.toString)) {
	  return obj.toString();
	}
	if (Array.isArray(obj)) {
	  return obj.map(serializeOrder);
	}
	if (typeof obj === "object" && obj !== null) {
	  const newObj = {};
	  for (const key in obj) {
		newObj[key] = serializeOrder(obj[key]);
	  }
	  return newObj;
	}
	return obj;
  }
  
  