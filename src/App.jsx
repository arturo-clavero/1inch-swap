
import { useState } from 'react';
import WalletConnector from './components/WalletConnector';
import SwapForm from './components/SwapForm';

import './App.css';

function App() {
  const [oldChain, setOldChain] = useState('ethereum');
  const [newChain, setNewChain] = useState('cross-chain');
  const [oldToken, setOldToken] = useState('ETH');
  const [newToken, setNewToken] = useState('SCR');
  const [amount, setAmount] = useState('');
  const [convertedPrice, setConvertedPrice] = useState(null);
  const [minReturn, setMinReturn] = useState(null);
  const [maxDuration, setMaxDuration] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [connected, setConnected] = useState(false);

  // Swap the currencies when clicking the button
  const swapCurrencies = () => {
	setOldChain(newChain);
	setNewChain(oldChain);
    setOldToken(newToken);
    setNewToken(oldToken);
    setConvertedPrice(null);
    setAmount('');
  };

  return (
    <div className="app">
     <div className="card">

{/* Main Title at top */}
<h1 style={{ textAlign: 'center', marginBottom: '1rem' }}>Swap</h1>

{/* Row with currencies and swap arrow */}
<div
  style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '40px',
    marginBottom: '2rem',
    userSelect: 'none',
  }}
>
  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{oldToken}</div>

  {/* Arrow button container to center precisely */}
  <button
    onClick={swapCurrencies}
    aria-label="Swap currencies"
    style={{
      fontSize: '2.5rem',
      cursor: 'pointer',
      border: 'none',
      background: 'none',
      padding: 0,
      lineHeight: 1,
      userSelect: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '50px',
      height: '50px',
      transition: 'transform 0.3s ease',
    }}
    onMouseDown={(e) => (e.currentTarget.style.transform = 'rotate(180deg)')}
    onMouseUp={(e) => (e.currentTarget.style.transform = 'rotate(0deg)')}
  >
    ↔️
  </button>

  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{newToken}</div>
</div>

{/* Wallet Connector and Swap Form go here */}
<WalletConnector
  connected={connected}
  setConnected={setConnected}
  setWalletAddress={setWalletAddress}
/>

{connected && (
  <SwapForm
	connected={connected}
	walletAddress={walletAddress}
	newChain={newChain}
	oldChain={oldChain}
	newToken={newToken}
	oldToken={oldToken}
	amount={amount}
	setAmount={setAmount}
	convertedPrice={convertedPrice}
	setConvertedPrice={setConvertedPrice}
	minReturn={minReturn}
	setMinReturn={setMinReturn}
	maxDuration={maxDuration}
	setMaxDuration={setMaxDuration}
  />
)}

</div>

    </div>
  );
}

export default App;
