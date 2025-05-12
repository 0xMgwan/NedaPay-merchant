import React, { useState, useEffect, useRef } from 'react';
import { stablecoins } from '../data/stablecoins';
import './SwapModalFix.css';
import { addTransaction } from '../utils/transactionStorage';
import { getAerodromeQuote, swapAerodrome, AERODROME_ROUTER_ADDRESS, AERODROME_FACTORY_ADDRESS } from '../utils/aerodrome';
import { checkAllowance, approveToken } from '../utils/erc20';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';


interface SwapModalProps {
  open: boolean;
  fromSymbol: string;
  onClose: () => void;
  onSwap: (from: string, to: string, amount: string) => void;
  maxAmount: string;
  onReverse?: (newFrom: string) => void; // add prop to allow parent to update fromSymbol
}

const SwapModal: React.FC<SwapModalProps> = ({ open, fromSymbol, onClose, onSwap, maxAmount, onReverse }) => {
  // Helper to safely truncate to allowed decimals
  function truncateToDecimals(value: string, decimals: number) {
    if (!value.includes('.')) return value;
    const [whole, frac] = value.split('.');
    return frac.length > decimals
      ? `${whole}.${frac.slice(0, decimals)}`
      : value;
  }

  const { address, isConnected } = useAccount();
  const [toSymbol, setToSymbol] = useState('');
  const [amount, setAmount] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [quote, setQuote] = useState<string | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [swapError, setSwapError] = useState<string | null>(null);
  const [swapSuccess, setSwapSuccess] = useState<string | null>(null);
  const [poolType, setPoolType] = useState<'stable' | 'volatile'>('stable');
  const swapInProgress = useRef(false);

  // New: callback to update fromSymbol in parent
  const handleReverseTokens = () => {
    if (!toSymbol) return;
    // Swap fromSymbol in parent, toSymbol in modal
    if (typeof onReverse === 'function') {
      onReverse(toSymbol); // ask parent to update fromSymbol
    }
    setToSymbol(fromSymbol); // swap modal's toSymbol
    setAmount(quote || ''); // use last quote as new amount
    setQuote(null); // clear quote to force refresh
    setQuoteError(null);
  };




  // Get token and factory addresses
  const fromToken = stablecoins.find(c => c.baseToken === fromSymbol)?.address;
  const toToken = stablecoins.find(c => c.baseToken === toSymbol)?.address;
  // Get decimals for input and output tokens
  const fromTokenObj = stablecoins.find(c => c.baseToken === fromSymbol);
  const toTokenObj = stablecoins.find(c => c.baseToken === toSymbol);
  const fromDecimals = fromTokenObj?.decimals ?? 18;
  const toDecimals = toTokenObj?.decimals ?? 18;
  // Use the official Aerodrome PoolFactory address for Base
  const factory = AERODROME_FACTORY_ADDRESS;

  // Update quote when amount or toSymbol changes


  useEffect(() => {
    setQuote(null);
    setQuoteError(null);
    if (!fromToken || !toToken || fromToken === toToken || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setQuoteError('Select two different tokens and enter a valid amount.');
      return;
    }
    const fetchQuote = async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const safeAmount = truncateToDecimals(amount, fromDecimals);
        const parsedAmount = ethers.utils.parseUnits(safeAmount, fromDecimals).toString();
        if (!parsedAmount || parsedAmount === '0') {
          setQuoteError('Enter a valid amount.');
          return;
        }
        try {
          const amounts = await getAerodromeQuote({
            provider,
            amountIn: parsedAmount,
            fromToken,
            toToken,
            stable: poolType === 'stable',
            factory
          });
          setQuote(ethers.utils.formatUnits(amounts[amounts.length - 1], toDecimals));
        } catch (err: any) {
          setQuoteError('No pool exists for this pair or insufficient liquidity.');
          return;
        }
      } catch (err: any) {
        console.error('[Quote] Error fetching quote:', err);
        setQuoteError('Unable to fetch quote');
      }
    };
    fetchQuote();
  }, [fromToken, toToken, amount, fromSymbol, toSymbol, factory, poolType, fromDecimals, toDecimals]);

  const handleSwap = async () => {
    setSwapError(null);
    if (!fromToken || !toToken || fromToken === toToken || !address || !amount) {
      setSwapError('Missing or invalid swap details');
      return;
    }
    const safeAmount = truncateToDecimals(amount, fromDecimals);
    const parsedAmount = ethers.utils.parseUnits(safeAmount, fromDecimals).toString();
    const safeQuote = quote ? truncateToDecimals((Number(quote) * 0.995).toFixed(toDecimals), toDecimals) : '0';
    const minOut = quote ? ethers.utils.parseUnits(safeQuote, toDecimals).toString() : '0'; // 0.5% slippage
    const deadline = Math.floor(Date.now() / 1000) + 600; // 10 min
    try {
      setIsSwapping(true);
      swapInProgress.current = true;
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      // Check allowance
      const allowance = await checkAllowance({
        token: fromToken,
        owner: address,
        spender: AERODROME_ROUTER_ADDRESS,
        provider
      });
      if (ethers.BigNumber.from(allowance).lt(parsedAmount)) {
        // Approve only the exact amount needed for this swap
        const approveTx = await approveToken({
          token: fromToken,
          spender: AERODROME_ROUTER_ADDRESS,
          amount: parsedAmount, // Only approve the needed amount
          signer
        });
        await approveTx.wait();
      }
      // Swap
      const tx = await swapAerodrome({
        signer,
        amountIn: parsedAmount,
        amountOutMin: minOut,
        fromToken,
        toToken,
        stable: poolType === 'stable',
        factory,
        userAddress: address,
        deadline
      });
      
      // Generate a unique transaction ID
      const txId = `swap-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Add transaction to history as pending
      addTransaction({
        id: txId,
        fromToken: fromSymbol,
        toToken: toSymbol,
        fromAmount: amount,
        toAmount: quote || '0',
        txHash: tx.hash,
        timestamp: Date.now(),
        status: 'pending',
        walletAddress: address || ''
      });
      
      // Wait for transaction confirmation
      await tx.wait();
      
      // Update transaction status to completed
      addTransaction({
        id: txId,
        fromToken: fromSymbol,
        toToken: toSymbol,
        fromAmount: amount,
        toAmount: quote || '0',
        txHash: tx.hash,
        timestamp: Date.now(),
        status: 'completed',
        walletAddress: address || ''
      });
      
      setIsSwapping(false);
      swapInProgress.current = false;
      setSwapSuccess(`Successfully swapped ${amount} ${fromSymbol} to ${quote} ${toSymbol}`);
      onSwap(fromSymbol, toSymbol, amount); // callback to parent
    } catch (err: any) {
      setSwapError(err?.reason || err?.message || 'Swap failed');
      setIsSwapping(false);
      swapInProgress.current = false;
    }
  };

  useEffect(() => {
    setToSymbol('');
    setAmount('');
    setIsSwapping(false);
    setQuote(null);
    setQuoteError(null);
    setSwapError(null);
    setSwapSuccess(null);
  }, [open, fromSymbol]);

  const availableToCoins = stablecoins.filter(c => c.baseToken !== fromSymbol);

  // Live balances for from and to tokens
  const [fromBalance, setFromBalance] = useState('0');
  const [toBalance, setToBalance] = useState('0');

  useEffect(() => {
    const fetchBalances = async () => {
      if (!address) {
        setFromBalance('0');
        setToBalance('0');
        return;
      }
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      if (fromToken) {
        try {
          const contract = new ethers.Contract(fromToken, ["function balanceOf(address owner) view returns (uint256)", "function decimals() view returns (uint8)"], provider);
          const bal = await contract.balanceOf(address);
          const dec = fromTokenObj?.decimals ?? 18;
          setFromBalance(Number(ethers.utils.formatUnits(bal, dec)).toLocaleString());
        } catch (e) { setFromBalance('0'); }
      }
      if (toToken) {
        try {
          const contract = new ethers.Contract(toToken, ["function balanceOf(address owner) view returns (uint256)", "function decimals() view returns (uint8)"], provider);
          const bal = await contract.balanceOf(address);
          const dec = toTokenObj?.decimals ?? 18;
          setToBalance(Number(ethers.utils.formatUnits(bal, dec)).toLocaleString());
        } catch (e) { setToBalance('0'); }
      }
    };
    fetchBalances();
  }, [address, fromToken, toToken, open, fromSymbol, toSymbol]);

  if (!open) return null;


  return (
    <div className="swap-modal-container fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300">
      <div className="relative bg-[#181A20] rounded-2xl shadow-2xl w-full max-w-md flex flex-col border border-slate-700 p-0 animate-fadeInScale">
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-blue-400 text-2xl focus:outline-none" aria-label="Close">
          &times;
        </button>
        <div className="flex-1 p-6 text-white space-y-4">
          <h2 className="text-xl font-bold mb-4">Swap</h2>

          {/* Sell Panel */}
          <div className="bg-[#23263B] rounded-xl p-4 mb-2 text-white">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-white">Sell</span>
              <span className="text-xs text-white">Balance: {fromBalance} {fromSymbol}</span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{fromTokenObj?.flag ?? ''}</span>
              <span className="font-semibold text-white">{fromSymbol}</span>
              <span className="text-xs text-white">{fromTokenObj?.name ?? ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="flex-grow bg-transparent text-white text-5xl font-extrabold outline-none border-none"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                max={maxAmount}
                min="0"
                placeholder="0.0"
                style={{ color: 'white', fontWeight: 800, fontSize: '3rem', lineHeight: 1.1, WebkitTextFillColor: 'white' }}
              />
              <button
                className="bg-blue-700 text-white px-3 py-1 rounded font-semibold text-xs"
                onClick={() => setAmount(maxAmount)}
                type="button"
              >
                Max
              </button>
            </div>
            <div className="text-xs text-white mt-1">${/* Fiat value placeholder */}0.00</div>
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center items-center my-2">
  <button
    className="rounded-full bg-[#23263B] p-2 text-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
    aria-label="Switch tokens"
    onClick={handleReverseTokens}
    disabled={!toSymbol}
    type="button"
    title="Switch tokens"
  >
    <span>↓</span>
  </button>
</div>

          {/* Buy Panel */}
          <div className="bg-[#23263B] rounded-xl p-4 mb-2 text-white">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-white">Buy</span>
              <span className="text-xs text-white">Balance: {toBalance} {toSymbol}</span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <select
                className="bg-[#181A20] text-white rounded px-2 py-1 appearance-none"
                value={toSymbol}
                onChange={e => setToSymbol(e.target.value)}
                style={{ color: 'white', WebkitTextFillColor: 'white' }}
              >
                <option value="" style={{ color: 'white', background: '#23263B' }}>Select token</option>
                {availableToCoins.map(c => (
                  <option key={c.baseToken} value={c.baseToken} style={{ color: 'white', background: '#23263B' }}>
                    {c.flag ?? ''} {c.baseToken} - {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="flex-grow text-white text-5xl font-extrabold select-text"
                style={{ color: 'white !important', fontWeight: 800, fontSize: '3rem', lineHeight: 1.1, WebkitTextFillColor: 'white !important' }}
              >
                {quote ?? '0.0'}
              </span>
            </div>
            <div className="text-xs text-white mt-1">${/* Fiat value placeholder */}0.00</div>
          </div>

          {/* Pool type selector */}
          <div className="mb-2 flex items-center gap-3">
            <span className="text-xs text-gray-400">Pool Type:</span>
            <select
              className="border rounded px-2 py-1 text-xs bg-[#23263B] text-white border-slate-700 appearance-none"
              value={poolType}
              onChange={e => setPoolType(e.target.value as 'stable' | 'volatile')}
              style={{ color: 'white', WebkitTextFillColor: 'white' }}
            >
              <option value="stable" style={{ color: 'white', background: '#23263B' }}>Stable</option>
              <option value="volatile" style={{ color: 'white', background: '#23263B' }}>Volatile</option>
            </select>
          </div>

          {/* Swap Details Section */}
          <div className="bg-[#23263B] rounded-xl p-4 mb-2 space-y-2 text-xs text-white">
            <div className="flex justify-between">
              <span>Fees</span>
              <span>0.05% {/* token icons placeholder */}</span>
            </div>
            <div className="flex justify-between">
              <span>Exchange rate</span>
              <span>1 {fromSymbol} = {/* Exchange rate calc */} {quote && amount ? (Number(quote) / Number(amount)).toFixed(6) : '--'} {toSymbol}</span>
            </div>
            <div className="flex justify-between">
              <span>Price impact</span>
              <span> {/* Placeholder */}0.77%</span>
            </div>
            <div className="flex justify-between">
              <span>Minimum received</span>
              <span>{quote ? (Number(quote) * 0.995).toFixed(toDecimals) : '--'} {toSymbol}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-row gap-2 mt-4">
            <button
              className="flex-1 px-4 py-2 rounded bg-gray-700 text-white font-semibold hover:bg-gray-600"
              onClick={() => window.location.reload()}
              type="button"
            >
              Refresh
            </button>
            <button
              className="flex-1 px-4 py-2 rounded bg-blue-600 text-white font-bold text-lg shadow-md hover:bg-blue-700 transition disabled:opacity-60"
              onClick={handleSwap}
              disabled={isSwapping || !amount || !toSymbol || !quote}
              type="button"
            >
              {isSwapping ? 'Swapping...' : 'Swap'}
            </button>
          </div>
          {swapError && (
            <div className="mt-4 text-red-500 text-center text-sm">
              {swapError}
            </div>
          )}
          {swapSuccess && (
            <div className="mt-4 text-green-500 text-center text-sm font-semibold">
              {swapSuccess}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SwapModal;
