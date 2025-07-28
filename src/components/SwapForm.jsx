import { useEffect, useState } from 'react';
import { fetchQuote } from '../hooks/useQuoteFetcher';
import axios from "axios";

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

  const handleSwap = async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/generate');
      const hash = response.data.hash;
      console.log("from backend hash is", hash);

      const lock = await axios.post('http://localhost:3000/api/lock', {
        receiver: walletAddress,
        hashlock: hash,
        timelock: 60 * 5,
        amount: "0.00001", //eth
        chain: oldCurrency.toLowerCase()
      });
      console.log("Lock transaction:", lock.data.txnHash);
      alert("Swap was simulated successfully");
    } catch (error) {
      console.error("error generating secret", error);
      alert('failed to start swap');
    }
    alert(`Pretending to swap ${amount} ETH for USDC!`);
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
