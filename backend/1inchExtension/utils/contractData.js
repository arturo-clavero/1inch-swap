const { WebSocketProvider, Contract, Wallet } = require('ethers');

//providers TEST NET -> deployment
// const providerETH = new WebSocketProvider(process.env.RPC_WS_ETHEREUM);
// const providerSCR = new WebSocketProvider(process.env.RPC_WS_SCROLL);

//providers for DEVELOPMENT 
const providerAnvilETH = new WebSocketProvider(process.env.RPC_WS_ANVIL_ETH);
const providerAnvilSRC = new WebSocketProvider(process.env.RPC_WS_ANVIL_SRC);

const contractData = [
	{
		name: "ETH",
		address: "0xC7E8083Aa9248bC25906C2CFa3aF0cAF16ae42E8",
		abi: require('../../../abi/Eth.json').abi,
		provider: providerAnvilETH,
	},
	{
		name: "SCR",
		address: "0x05B4CB126885fb10464fdD12666FEb25E2563B76",
		abi: require('../../../abi/Scr.json').abi,
		provider: providerAnvilSRC,
	}
];

const pKey = process.env.WALLET_PRIVATE_KEY;

const contracts = {};

for (const { name, address, abi, provider } of contractData) {
	const signer = new Wallet(pKey, provider);
	contracts[name] = new Contract(address, abi, provider).connect(signer);
}

module.exports = contracts;
//import contracts 
//use contracts[name]
