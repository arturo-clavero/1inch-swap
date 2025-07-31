import { ethers, JsonRpcProvider } from 'ethers';
import axios from 'axios';
import { chainMap } from '../utils/chainMap';

const aggregatorV3InterfaceABI = [
	{
	  inputs: [],
	  name: "decimals",
	  outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
	  stateMutability: "view",
	  type: "function",
	},
	{
	  inputs: [],
	  name: "description",
	  outputs: [{ internalType: "string", name: "", type: "string" }],
	  stateMutability: "view",
	  type: "function",
	},
	{
	  inputs: [{ internalType: "uint80", name: "_roundId", type: "uint80" }],
	  name: "getRoundData",
	  outputs: [
		{ internalType: "uint80", name: "roundId", type: "uint80" },
		{ internalType: "int256", name: "answer", type: "int256" },
		{ internalType: "uint256", name: "startedAt", type: "uint256" },
		{ internalType: "uint256", name: "updatedAt", type: "uint256" },
		{ internalType: "uint80", name: "answeredInRound", type: "uint80" },
	  ],
	  stateMutability: "view",
	  type: "function",
	},
	{
	  inputs: [],
	  name: "latestRoundData",
	  outputs: [
		{ internalType: "uint80", name: "roundId", type: "uint80" },
		{ internalType: "int256", name: "answer", type: "int256" },
		{ internalType: "uint256", name: "startedAt", type: "uint256" },
		{ internalType: "uint256", name: "updatedAt", type: "uint256" },
		{ internalType: "uint80", name: "answeredInRound", type: "uint80" },
	  ],
	  stateMutability: "view",
	  type: "function",
	},
	{
	  inputs: [],
	  name: "version",
	  outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
	  stateMutability: "view",
	  type: "function",
	},
]


export const fetchQuote = async (oldToken, srcChain, amount, newToken, dstChain) => {
	try {
	  console.log("hello???");
	  const provider = new JsonRpcProvider("https://scroll.drpc.org");
  
	  const feedAddress = "0x26f6F7C468EE309115d19Aa2055db5A74F8cE7A5";
	  const priceFeed = new ethers.Contract(feedAddress, aggregatorV3InterfaceABI, provider);
  
	  const roundData = await priceFeed.latestRoundData();
	  console.log("Latest Round Data", roundData);
  
	  const rawDecimals = await priceFeed.decimals();
	  const rawPrice = roundData[1];
	  console.log("raw price: ", rawPrice.toString());
	  console.log("raw decimals", rawDecimals);
  
	  const price = Number(rawPrice) / Math.pow(10, Number(rawDecimals));
	  console.log("Price with decimals:", price);
  
	  const conversionResult = await calculateConversion("USDC", price, amount, oldToken, srcChain, newToken, dstChain);
	  console.log("Conversion result:", conversionResult);
  
	  return conversionResult;
  
	} catch (err) {
	  	console.error("Error during price fetch or conversion:", err);
	  throw err;
	}
  };
  

async function calculateConversion(stableToken, crossChainRate, amount, oldToken, srcChain, newToken, dstChain){
	console.log("cross chain rate: ", crossChainRate);
	if (newToken == "ETH"){
		console.log("from cross chain");
		let crossChainInStableCoin = crossChainRate * amount;
		console.log("cross chain in stable coin: ", crossChainInStableCoin);
		let quote = await oneInchQuote(stableToken, srcChain, crossChainInStableCoin, newToken, dstChain);
		console.log("final: ", quote);
		return (quote);
	}
	else if (oldToken == "ETH"){
		console.log("from ETH");
		let quote = await oneInchQuote(stableToken, srcChain, amount, oldToken, dstChain);
		console.log("quote: ", quote);
		let price = quote / crossChainRate;
		console.log("final: ", price);
		return price;
	}
}

async function oneInchQuote(srcToken, srcChain, amount, dstToken, dstChain) {
	let quote;
	console.log("src chain: ", srcChain);
	console.log("res: ", chainMap["chainId"][srcChain])
  try {
    const response = await axios.post('http://localhost:3000/api/1inchQuote', {
      srcChain: chainMap["chainId"][srcChain],
      dstChain: chainMap["chainId"][dstChain],
      srcTokenAddress: chainMap["token"][srcToken],
      dstTokenAddress:  chainMap["token"][dstToken],
      amount: '1000000000000000000', 
      walletAddress: '0x0000000000000000000000000000000000000000',
      enableEstimate: true
    });

    console.log('Backend response:', response.data);
	console.log("lets see: ", response.data["quote"])
	quote = response.data["quote"];
  } catch (error) {
    console.error('Error fetching quote:', error);
  }
  return quote;
}
