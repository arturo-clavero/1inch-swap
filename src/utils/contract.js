import { ethers, BrowserProvider } from "ethers";
import contractAbiEth from "../../out/EthereumRouter.sol/EthereumRouter.json";
import contractAbiScr from "../../abi/Scr.json";

const contractAddressEth = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
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
  