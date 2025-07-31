import { useEffect, useState } from 'react';
import { fetchQuote } from '../hooks/useQuoteFetcher';
import { initiateTrade } from '../interactions/initiateTrade';

const SwapForm = ({
  connected, walletAddress,
  newChain, oldChain, newToken, oldToken, 
  amount, setAmount, minReturn, setMinReturn,
  convertedPrice, setConvertedPrice, 

}) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
	console.log("useEffect triggered", { connected, amount, oldToken, newToken });
	
	if (connected && amount && Number(amount) > 0) {
	  setIsLoading(true);
  
	  async function fetchPrice() {
		try {
		  const price = await fetchQuote(oldToken, oldChain, amount, newToken, newChain);
		  console.log("Price fetched:", price);
		  setConvertedPrice(price);
		} catch (error) {
		  console.error("Fetch quote error:", error);
		  setConvertedPrice(null);
		} finally {
		  setIsLoading(false);
		}
	  }
  
	  fetchPrice();
	} else {
	  setConvertedPrice(null);
	  setIsLoading(false);
	}
  }, [connected, oldToken, amount, newToken]);
  

  return (
    <>
      <label>Amount in {oldToken}</label>
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
			You will receive ~ {convertedPrice || '...'} {newToken}
			</p>
		)
		)}

	<button
	onClick={() =>
		initiateTrade({
			oldToken,
			newToken,
			newChain,
			amount,
			convertedPrice,
			minReturn,
		})
	}
	disabled={!amount || Number(amount) <= 0}
	>
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
