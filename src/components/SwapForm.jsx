import { useEffect, useState } from 'react';
import { fetchQuote } from '../hooks/useQuoteFetcher';

import HTLC_abi from "../../abi/HTLC.json";
import { ethers, Contract } from "ethers";
import axios from "axios";
import { generateSecret } from './Handling';

const ethHtlc = import.meta.env.VITE_ETH_CONTRACT_ADDRESS;
const scrollHtlc = import.meta.env.VITE_SCROLL_CONTRACT_ADDRESS;
const relayer_address = import.meta.env.VITE_RELAYER_ADDRESS;
console.log("relayer", relayer_address);
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
      const {hash, secret } = generateSecret();
      const bytesHashlock = hash.startsWith("0x") ? hash : "0x" + hash;
      
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
      const txn = await htlcContract.createSwap(
          walletAddress,
          bytesHashlock, 
          timelock,
          { value: amount }
      );
      console.log("Tx sent:", txn.hash);
      await txn.wait();
      let tryes = 0;
      const maxTryes = 10;
      while (tryes < maxTryes){
        const response = await axios.get(`http://localhost:3000/api/ready/${hash}`);
        console.log("response is:", response);
        if (response.data.ready){
          await withdraw();
          break;
        }
        else{
          console.log("Relayer still locking, try in the moment");
          await new Promise(r => setTimeout(r, 2000));
          tryes++;
        }

      }
      alert("Swap was simulated successfully");
    } catch (error) {
        console.error("error generating secret", error);
        alert('failed to start swap');
        alert(`Pretending to swap ${amount} ETH for USDC!`);
    }
    finally{
      setIsSwapping(false);
    }
  }
  const withdraw = async () => {
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        //define htlc
        const  contract = oldCurrency.toLowerCase() === "eth" ? ethHtlc : scrollHtlc;
          const htlcContract = new ethers.Contract(contract, HTLC_abi, signer);
          //hetting secret hash swapid
          const hash = localStorage.getItem('hash') || '';
          const response = await axios.get(`http://localhost:3000/api/swap/${hash}`);
          const swapId = response.data.swapId;
          console.log("the swap Id is ", swapId);
          const secret = localStorage.getItem('secret') || '';
          console.log("the secret is", secret);
          const txn = await htlcContract.withdraw(swapId, secret);
          await txn.wait();
          alert ("Withdraw successful");
          localStorage.removeItem('secret', secret);
          localStorage.removeItem('hash', hash);
        } catch (err){
          console.error("Withdraw unseccessfull", err);
          alert ("Withdraw failed: " + err.message);
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
