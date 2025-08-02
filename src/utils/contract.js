import { ethers, BrowserProvider } from "ethers";
import contractAbiEth from "../../abi/Eth.json";
import contractAbiScr from "../../abi/Scr.json";

const contractAddressEth = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

const contractAddressScr = "0xYourDeployedContract";

export async function getContract(chain = ""){
	const provider = new BrowserProvider(window.ethereum);
	await provider.send("eth_requestAccounts", []);
	const signer = await provider.getSigner();

	if (chain == "ETH")
	{
		console.log("ETH Contract");
		return new ethers.Contract(contractAddressEth, contractAbiEth.abi, signer);
	}
	else
		return new ethers.Contract(contractAddressScr, contractAbiScr.abi, signer);

}

// window.ethereum.on("accountsChanged", (accounts) => {
// 	console.log("Selected accounts changed:", accounts);
// 	// Update your signer or reload page accordingly
//   });
  