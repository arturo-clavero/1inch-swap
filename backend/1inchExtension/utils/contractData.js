const { WebSocketProvider, Contract, Wallet } = require('ethers');

//providers TEST NET -> deployment
// const providerETH = new WebSocketProvider(process.env.RPC_WS_ETHEREUM);
// const providerSCR = new WebSocketProvider(process.env.RPC_WS_SCROLL);

//providers for DEVELOPMENT 
const providers = {
	"ethereum" : new WebSocketProvider(process.env.RPC_WS_ANVIL_ETH),
	"cross-chain" : new WebSocketProvider(process.env.RPC_WS_ANVIL_SRC),
}

const address = {
"ethereum" : "0xdEc4A424361e7Ae374A527571166085Dc4bDCd0c",
	"cross-chain" : "0x05B4CB126885fb10464fdD12666FEb25E2563B76",
}
const contractData = [
	{
		name: "ETH",
		address: address["ethereum"],
		abi: require('../../../abi/Eth.json').abi,
		provider: providers["ethereum"],
	},
	{
		name: "SCR",
		address: address["cross-chain"],
		abi: require('../../../abi/Scr.json').abi,
		provider: providers["cross-chain"],
	}
];

const pKey = process.env.WALLET_PRIVATE_KEY;

const contracts = {};

for (const { name, address, abi, provider } of contractData) {
	const signer = new Wallet(pKey, provider);
	contracts[name] = new Contract(address, abi, provider).connect(signer);
}

module.exports = {contracts, providers, address};
//import contracts 
//use contracts[name]
