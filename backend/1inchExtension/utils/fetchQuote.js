const axios = require('axios');


async function fetchQuote(srcChain, dstChain, srcTokenAddress, dstTokenAddress, amount, walletAddress) {

	const url = "https://api.1inch.dev/swap/v6.1/1/quote";
 if (srcChain == 1 || srcChain == "1") srcTokenAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
 else if (dstChain == 1 || dstChain == "1") dstTokenAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

  const config = {
	headers: {
		Authorization: `Bearer ${process.env.ONEINCH_API_KEY}`, 
	  },    
	  params: {
      src: srcTokenAddress,
      dst: dstTokenAddress,
      amount: "10000000000000000",
    },
    paramsSerializer: {
      indexes: null,
    },
  };

  try {
    const response = await axios.get(url, config);
    console.log("->", response.data);
	console.log("!>", response.data["dstAmount"]);

	console.log("I GOT IT?")
	return response.data["dstAmount"]
  } catch (error) {
    console.error(error);
	console.log(srcTokenAddress)
  }
}


module.exports = {fetchQuote};

