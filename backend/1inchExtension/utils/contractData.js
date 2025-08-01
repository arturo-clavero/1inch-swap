const { WebSocketProvider, Contract, Wallet } = require('ethers');

//providers TEST NET -> deployment
// const providerETH = new WebSocketProvider(process.env.RPC_WS_ETHEREUM);
// const providerSCR = new WebSocketProvider(process.env.RPC_WS_SCROLL);

//providers for DEVELOPMENT 
const providerAnvil = new WebSocketProvider(process.env.RPC_WS_ANVIL);
// const providerPublicTestnet = new WebSocketProvider(process.env.RPC_WS_PUBLIC_TESTNET);


//add your contract data here and get contract by importing contracts and getting it by name
const contractData = [
	// {
	// 	name: "test",
	// 	address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
	// 	abi: require('./abi/Test.json'),
	// 	provider: providerAnvil,
	// },
	{
		name: "router",
		address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
		abi: require('../../../abi/fake.json'),
		provider: providerAnvil,
	},
	{
		name: "ETH",
		address: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
		abi: require('../../../abi/Eth.json').abi,
		provider: providerAnvil,
	},
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
