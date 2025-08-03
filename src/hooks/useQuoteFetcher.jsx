import { ethers, JsonRpcProvider } from 'ethers';
import axios from 'axios';
import { chainMap } from '../utils/chainMap';
import { aggregatorV3InterfaceABI } from '../utils/aggregatorV3InterfaceABI';

async function oneInchQuote(srcToken, amount, dstToken) {
	const srcDecimals = chainMap.decimals[srcToken];
	const dstDecimals = chainMap.decimals[dstToken];

	const baseAmount = BigInt(Math.floor(amount * 10 ** srcDecimals));
	try {
		const response = await axios.post('http://localhost:3000/api/1inchQuote', {
			srcTokenAddress: chainMap.token[srcToken],
			dstTokenAddress: chainMap.token[dstToken],
			amount: `${baseAmount}`,
		});

		const rawQuote = BigInt(response.data["quote"]);
		const quoteInHumanUnits = Number(rawQuote) / 10 ** dstDecimals;

		return quoteInHumanUnits;
	} catch (error) {
		console.error('Error fetching quote:', error);
	}
}


async function chainLinkPriceFeed(rpcUrl, feedAddress){
	const provider = new JsonRpcProvider(rpcUrl);
	const priceFeed = new ethers.Contract(feedAddress, aggregatorV3InterfaceABI, provider);
	const roundData = await priceFeed.latestRoundData();

	const rawDecimals = await priceFeed.decimals();
	const rawPrice = roundData[1];

	return Number(rawPrice) / Math.pow(10, Number(rawDecimals));
}

export const fetchQuote = async (oldToken, amount, newToken) => {
	try {
		let conversionResult;
		const unitCrossChainInStableCoin = await chainLinkPriceFeed(
			"https://scroll.drpc.org",
			"0x26f6F7C468EE309115d19Aa2055db5A74F8cE7A5"
		);
		console.log("1 SCR in USDC: ", unitCrossChainInStableCoin);
		console.log(newToken, oldToken);
		if (newToken == "ETH"){
			let totalCrossChainInStableCoin = unitCrossChainInStableCoin * amount;
			conversionResult = await oneInchQuote("USDC", totalCrossChainInStableCoin, newToken);
			console.log(" total SCR in USDC: ", totalCrossChainInStableCoin);
			console.log(" total ETH : ", conversionResult);
		}
		else if (oldToken == "ETH"){
			let ethInStableCoin = await oneInchQuote(oldToken, amount, "USDC");
			console.log("total ETH in USDC : ", ethInStableCoin);
			conversionResult = ethInStableCoin / unitCrossChainInStableCoin;
			console.log("total SCR: ", conversionResult);
		}
		return conversionResult;
	} 
	catch (err) {
		console.error("Error during price fetch or conversion:", err);
		throw err;
	}
};