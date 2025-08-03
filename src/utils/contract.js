import { ethers, BrowserProvider } from "ethers";
import contractAbiEth from "../../abi/Eth.json";
import contractAbiScr from "../../abi/Scr.json";

export const contractAddress = {
	"ethereum" : "0xC7E8083Aa9248bC25906C2CFa3aF0cAF16ae42E8",
	"cross-chain" : "0x05B4CB126885fb10464fdD12666FEb25E2563B76"
} 

export async function getContract(chain = ""){
	const provider = new BrowserProvider(window.ethereum);
	await provider.send("eth_requestAccounts", []);
	const signer = await provider.getSigner();

	if (chain == "ETH")
	{
		console.log("ETH Contract");
		return new ethers.Contract(contractAddress["ethereum"], contractAbiEth.abi, signer);
	}
	else
		return new ethers.Contract(contractAddress["cross-chain"], contractAbiScr.abi, signer);

}

// window.ethereum.on("accountsChanged", (accounts) => {
// 	console.log("Selected accounts changed:", accounts);
// 	// Update your signer or reload page accordingly
//   });
  