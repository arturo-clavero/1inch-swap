import { ethers , parseUnits} from "ethers";
import { chainMap } from '../utils/chainMap';
import axios from 'axios';
import { contractAddress } from "../utils/contract";

const orderSecrets = {};

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
		oldChain: oldChain,
		newChain: newChain,
		oldToken: oldToken,
		newToken: newToken,
		oldTokenAddress: chainMap["token"][oldToken],
		totalAmount: parseUnits(`${amount}`, chainMap["decimals"][oldToken]),
		newTokenAddress: chainMap["token"][newToken],
		oldChainId: chainMap["chainId"][oldChain],
		newChainId: chainMap["chainId"][newChain],
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

	const { secret, secretHash } = await generateSecret();
	orderSecrets[order.id] = secret;//what to do with the secret????!!!!!!!
	order.secretHash = secretHash;

	axios.post('http://localhost:3000/api/storeTempOrder', serializeOrder(order));
	return order;
}


async function signOrder(order) {
	const provider = new ethers.BrowserProvider(window.ethereum);
	await provider.send("eth_requestAccounts", []);
	const signer = await provider.getSigner();
	
	const types = ["uint256"];
	const values = [BigInt(order.id)];
	const hash = ethers.keccak256(ethers.solidityPacked(types, values));

	const signatureHexString = await signer.signMessage(ethers.getBytes(hash))
	const signature = ethers.getBytes(signatureHexString);

	await allowTransfer(order, signer);

	return signature;
}



async function allowTransfer(order, signer) {
	if (order.oldToken == "ETH")
		return; //only for ERC20 tokens
	const ERC20_ABI = [
		"function approve(address spender, uint256 amount) external returns (bool)",
		"function allowance(address owner, address spender) external view returns (uint256)",
		"function balanceOf(address owner) view returns (uint256)",
		"function transfer(address to, uint amount) returns (bool)",
		"function decimals() view returns (uint8)"
	  ];	  
	const token = new ethers.Contract(order.oldTokenAddress, ERC20_ABI, signer);
	const user = await signer.getAddress();
	const thisContractAddress = contractAddress[order.oldChain];
	console.log(order.oldChain, thisContractAddress, user);
	const allowance = await token.allowance(user, thisContractAddress);
	
	// const allowanceBN = allowance.toBigInt();	const amountBN = BigInt(order.totalAmount);
	// console.log(allowance, allowanceBN, order.totalAmount, amountBN)
	
	// console.log(typeof allowance, typeof allowanceBN, typeof order.totalAmount, typeof amountBN);
	const allowanceBN = BigInt(allowance.toString());
const amountBN = BigInt(order.totalAmount.toString());

if (allowanceBN < amountBN) {
  const tx = await token.approve(thisContractAddress, order.totalAmount);
  await tx.wait();
}

}

function generate_id(order){
	const defaultAbiCoder = new ethers.AbiCoder();
	console.log(		  order.oldTokenAddress,
		order.totalAmount,
		order.newTokenAddress,
		order.newChain,
		order.startReturnAmount,
		order.startTimestamp,
		order.minReturnAmount,
		order.expirationTimestamp)
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
		  order.oldTokenAddress,
		  order.totalAmount,
		  order.newTokenAddress,
		  order.newChainId,
		  order.startReturnAmount,
		  order.startTimestamp,
		  order.minReturnAmount,
		  order.expirationTimestamp,
		]
	  );
	return ethers.keccak256(encodedOrder);
}

async function generateSecret(){
	const secret = ethers.randomBytes(32);
	const secretHash = ethers.keccak256(secret);
	return { secret, secretHash };

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
  
  