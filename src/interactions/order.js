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
	const network = await provider.getNetwork();
	const srcChainId = network.chainId;
	const types = [
		"uint256",   // orderId
		"address",   // maker
		"address",   // sourceToken
		"uint256",   // sourceAmount
		"address",   // destinationToken
		"uint32",   // sourceChainId
		"uint32",   // destinationChainId
		"uint256",   // startReturnAmount
		"uint256",   // startTimestamp
		"uint256",   // minReturnAmount
		"uint256"    // expirationTimestamp
	];
	
	const values = [
		order.id,                        // orderId
		maker,                           // maker (wallet address)
		order.oldToken,                 // sourceToken
		order.amount,                   // sourceAmount
		order.newToken,                 // destinationToken
		srcChainId,                 // sourceChainId
		order.newChain,                 // destinationChainId
		order.startReturnAmount,  // startReturnAmount
		order.startTimestamp,           // startTimestamp
		order.minReturnAmount,    // minReturnAmount
		order.expirationTimestamp       // expirationTimestamp
	];
	const packed = ethers.solidityPacked(types, values);
	const hash = ethers.keccak256(packed);
	const signatureHexString = await signer.signMessage(ethers.getBytes(hash))
	console.log(isHexString(signatureHexString));
	console.log("len: ", signatureHexString.length);
	const signature = ethers.getBytes(signatureHexString);
	console.log(isHexString(signature));
	console.log("len: ", signature.length);
	return signature;
}

function isHexString(value) {
	return typeof value === "string" && /^0x[0-9a-fA-F]+$/.test(value);
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
  
  