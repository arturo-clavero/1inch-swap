const axios = require('axios');

async function fetchQuote(srcTokenAddress, dstTokenAddress, amount) {
	const url = "https://api.1inch.dev/swap/v6.1/1/quote";
	console.log("hello for m backend");
	const config = {
		headers: {
			Authorization: `Bearer ${process.env.ONEINCH_API_KEY}`, 
			},    
			params: {
			src: srcTokenAddress,
			dst: dstTokenAddress,
			amount: amount,
		},
		paramsSerializer: {
			indexes: null,
		},
	};

	try {
		const response = await axios.get(url, config);
		return response.data["dstAmount"]
	} catch (error) {
		console.error(error);
		console.log("src token: ", srcTokenAddress);
		console.log("dst token: ", dstTokenAddress);
		console.log("amount: ", amount);
	}
}


module.exports = fetchQuote;

