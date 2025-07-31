import { ethers, JsonRpcProvider } from 'ethers';
import axios from 'axios';
import { chainMap } from '../utils/chainMap';

export const fetchQuote = async (oldToken, amount, newToken) => {
	console.log("hello???");
	const provider = new JsonRpcProvider("https://scroll.drpc.org");
	
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
	const feedAddress = "0x26f6F7C468EE309115d19Aa2055db5A74F8cE7A5";
	const priceFeed = new ethers.Contract(feedAddress, aggregatorV3InterfaceABI, provider);
	priceFeed.latestRoundData().then((roundData) => {
		console.log("Latest Round Data", roundData);
	  
		priceFeed.decimals().then((rawDecimals) => {
		  const rawPrice = roundData[1];
		  console.log("raw price: ", rawPrice);
		  console.log("raw decime", rawDecimals);

		  const price = Number(rawPrice) / Math.pow(10, Number(rawDecimals));
	  
		  console.log("Price with decimals:", price);
		  return (calculateConversion("USD", price, amount, oldToken, newToken))
		  //price is 1 scroll in usd...
		});
	  });
	  
};

async function calculateConversion(stableToken, crossChainRate, amount, oldToken, newToken){
	if (newToken == "ETH"){
		let crossChainInStableCoin = crossChainRate * amount;
		let quote = await oneInchQuote(stableToken, crossChainInStableCoin, newToken);
		console.log("quote: ", quote);
		return (quote);
	}
	else if (oldToken == "ETH"){
		let quote = await oneInchQuote(stableToken, amount, oldToken);
		let price = quote / crossChainRate;
		console.log("quote: ", price);
		return price;
	}
}

// async function oneInchQuote(src, amount, dst){

async function oneInchQuote(src, amount, dst) {
	let quote;


  try {
    const response = await axios.post('http://localhost:3001/api/1inchQuote', {
      srcChain: chainMap["chainId"][src],
      dstChain: chainMap["chainId"][dst],
      srcTokenAddress: chainMap["token"][src],
      dstTokenAddress:  chainMap["token"][dst],
      amount: '1000000000000000000', 
      walletAddress: '0x0000000000000000000000000000000000000000',
      enableEstimate: true
    });

    console.log('Backend response:', response.data);
	quote = response.data;
  } catch (error) {
    console.error('Error fetching quote:', error);
  }
  return quote;
}
