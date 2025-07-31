const axios = require('axios');


async function fetchQuote(srcChain, dstChain, srcTokenAddress, dstTokenAddress, amount) {
//   const srcChain = '1'; // Example: Ethereum
//   const dstChain = '137'; // Example: Polygon
//   const srcTokenAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'; // ETH
//   const dstTokenAddress = '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'; // WETH on Polygon
//   const amount = '1000000000000000000'; // 1 ETH in wei
  const walletAddress = '0x0000000000000000000000000000000000000001';
  const enableEstimate = true;

  try {
    const response = await axios.get(
      'https://api.1inch.dev/fusion-plus/quoter/v1.0/quote/receive',
      {
        headers: {
          Authorization: `Bearer ${process.env.ONEINCH_API_KEY}`,
        },
        params: {
          srcChain,
          dstChain,
          srcTokenAddress,
          dstTokenAddress,
          amount,
          walletAddress,
          enableEstimate,
        },
      }
    );

    console.log('Quote result:', response.data);
  } catch (error) {
    console.error('1inch API error:', error.response?.status, error.response?.data);
  }
  return response.data;
}

module.exports = {fetchQuote};

