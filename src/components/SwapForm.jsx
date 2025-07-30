import { useEffect, useState } from 'react';
import { fetchQuote } from '../hooks/useQuoteFetcher';
import HTLC_abi from "../../abi/HTLC.json";
import { ethers, Contract } from "ethers";
import axios from "axios";

const ethHtlc = import.meta.env.VITE_ETH_CONTRACT_ADDRESS;
const scrollHtlc = import.meta.env.VITE_SCROLL_CONTRACT_ADDRESS;
console.log("ethHtlc",ethHtlc );
console.log("scrollHtlc", scrollHtlc);

const SwapForm = ({
  connected, walletAddress, oldCurrency, newCurrency,
  amount, setAmount, convertedPrice, setConvertedPrice
}) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (connected && amount && Number(amount) > 0) {
      setIsLoading(true);
      fetchQuote(oldCurrency, amount, newCurrency, walletAddress)
        .then((price) => {
          setConvertedPrice(price);
        })
        .catch(() => {
          setConvertedPrice(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setConvertedPrice(null);
      setIsLoading(false);
    }
  }, [connected, amount, oldCurrency, newCurrency, walletAddress]);
  
  const [isSwapping, setIsSwapping] = useState(false); 
  
  
  
  //the lock triggers next event - relayer listens for the event - get swapId hashlock->
  //-> triggers the event for relayer/resolver "lock the same amount on the scroll"


  const handleSwap = async () => {
    if (isSwapping) return ;
    try {
      setIsSwapping(true);
      const response = await axios.post('http://localhost:3000/api/generate');
      const hash = response.data.hash; 
      const bytesHashlock = hash.startsWith("0x") ? hash : "0x" + hash;
      console.log("from backend hash is", hash);
      
      //user should sign the swap -> create instance with user signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      let contract;
        if (oldCurrency.toLowerCase() === "eth") {
            contract = ethHtlc;
        } else if ( oldCurrency.toLowerCase() === "scroll"){
            contract = scrollHtlc;
        } else {
            alert('unsupported chain');
        }
        console.log("the hg", HTLC_abi);
      const htlcContract = new ethers.Contract(contract, HTLC_abi, signer);  
      const amount = ethers.parseEther("0.00000001");
      const timelock =  Math.floor(Date.now() / 1000) + 60 * 5;
      console.log("im before the contract");
      const txn = await htlcContract.createSwap(
          walletAddress, 
          bytesHashlock, 
          timelock,
          { value: amount }
      );
      console.log("Tx sent:", txn.hash);
      await txn.wait();
      alert("Swap was simulated successfully");
    } catch (error) {
        console.error("error generating secret", error);
        alert('failed to start swap');
        alert(`Pretending to swap ${amount} ETH for USDC!`);
    }
    finally{
      setIsSwapping(false);
    }
  };

  return (
    <>
      <label>Amount in {oldCurrency}</label>
      <input
        type="number"
        placeholder="0.0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        min="0"
      />

		{amount && Number(amount) > 0 && (
		isLoading ? (
			<p>
			<span className="spinner" /> Getting quote...
			</p>
		) : (
			<p>
			You will receive ~ {convertedPrice || '...'} {newCurrency}
			</p>
		)
		)}


      <button onClick={handleSwap} disabled={!amount || Number(amount) <= 0}>
        Swap
      </button>

	  <p className="connected">
  Connected as{' '}
  <a
    href={`https://etherscan.io/address/${walletAddress}`}
    target="_blank"
    rel="noopener noreferrer"
    style={{color: 'white', textDecoration: 'underline' }}
  >
    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
  </a>
</p>
    </>
  );
};

export default SwapForm;
