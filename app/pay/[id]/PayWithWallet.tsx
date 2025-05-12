"use client";
import { useState } from "react";
import { ethers } from "ethers";
import dynamic from "next/dynamic";
import { stablecoins } from "../../data/stablecoins";
import { utils } from "ethers";

const WalletConnectButton = dynamic(() => import("./WalletConnectButton"), { ssr: false });

function isMobile() {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export default function PayWithWallet({ to, amount, currency }: { to: string; amount: string; currency: string }) {
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [txStatus, setTxStatus] = useState<'idle' | 'preparing' | 'submitting' | 'pending' | 'confirming' | 'confirmed' | 'failed'>('idle');

  // Function to wait for transaction with timeout
  const waitForTransaction = async (txHash: string, maxAttempts = 30, delayMs = 2000) => {
    // Import the robust provider
    const { getProvider } = await import('../../utils/rpcProvider');
    const provider = await getProvider();
    
    let attempts = 0;
    while (attempts < maxAttempts) {
      try {
        setTxStatus('confirming');
        const receipt = await provider.getTransactionReceipt(txHash);
        if (receipt && receipt.blockNumber) {
          // Transaction confirmed
          setTxStatus('confirmed');
          return receipt;
        }
      } catch (error) {
        console.warn(`Error checking transaction status (attempt ${attempts + 1}/${maxAttempts}):`, error);
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delayMs));
      attempts++;
    }
    
    // If we get here, we've timed out waiting for confirmation
    throw new Error('Transaction may have been submitted, but confirmation timed out. Please check your wallet or explorer for status.');
  };

  const handlePay = async () => {
    setError(null);
    setLoading(true);
    setTxHash(null);
    setTxStatus('preparing');
    
    try {
      // Validate recipient address
      let isValidAddress = false;
      try {
        isValidAddress = !!to && utils.isAddress(to);
      } catch {
        isValidAddress = false;
      }
      if (!isValidAddress) {
        setError("Invalid merchant address. Please check the payment link.");
        setLoading(false);
        setTxStatus('failed');
        return;
      }
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        setError("Invalid amount.");
        setLoading(false);
        setTxStatus('failed');
        return;
      }
      if (!window.ethereum) {
        setError("No wallet detected. Please install a Web3 wallet.");
        setLoading(false);
        setTxStatus('failed');
        return;
      }
      
      // Request accounts
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // Find token info from stablecoins
      const token = stablecoins.find(
        (sc) => sc.baseToken.toLowerCase() === currency?.toLowerCase() || sc.currency.toLowerCase() === currency?.toLowerCase()
      );
      
      let tx;
      setTxStatus('submitting');
      
      if (token && token.address && token.address !== "0x0000000000000000000000000000000000000000") {
        // ERC-20 transfer (EIP-681 style)
        const erc20ABI = [
          "function transfer(address to, uint256 amount) public returns (bool)",
          "function decimals() public view returns (uint8)"
        ];
        const contract = new ethers.Contract(token.address, erc20ABI, signer);
        let decimals = 18;
        
        try {
          decimals = await contract.decimals();
        } catch (error) {
          console.warn("Failed to get token decimals, using default 18:", error);
          decimals = 18;
        }
        
        let value;
        try {
          value = utils.parseUnits(amount, decimals);
        } catch {
          setError("Invalid amount format.");
          setLoading(false);
          setTxStatus('failed');
          return;
        }
        
        // Submit transaction with gas price estimation
        try {
          const gasPrice = await provider.getGasPrice();
          const gasLimit = await contract.estimateGas.transfer(to, value);
          
          // Add 20% to gas limit for safety
          const safeGasLimit = gasLimit.mul(120).div(100);
          
          tx = await contract.transfer(to, value, {
            gasPrice,
            gasLimit: safeGasLimit
          });
        } catch (error: any) {
          // If gas estimation fails, try without it
          console.warn("Gas estimation failed, trying without gas parameters:", error);
          tx = await contract.transfer(to, value);
        }
      } else {
        // Native ETH/coin transfer
        let value;
        try {
          value = utils.parseEther(amount);
        } catch {
          setError("Invalid amount format.");
          setLoading(false);
          setTxStatus('failed');
          return;
        }
        
        // Submit transaction with gas price estimation
        try {
          const gasPrice = await provider.getGasPrice();
          const gasLimit = await provider.estimateGas({
            to,
            value
          });
          
          // Add 20% to gas limit for safety
          const safeGasLimit = gasLimit.mul(120).div(100);
          
          tx = await signer.sendTransaction({
            to,
            value,
            gasPrice,
            gasLimit: safeGasLimit
          });
        } catch (error: any) {
          // If gas estimation fails, try without it
          console.warn("Gas estimation failed, trying without gas parameters:", error);
          tx = await signer.sendTransaction({ to, value });
        }
      }
      
      // Transaction submitted successfully
      setTxHash(tx.hash);
      setTxStatus('pending');
      
      // Wait for transaction confirmation with timeout
      try {
        await waitForTransaction(tx.hash);
      } catch (error: any) {
        console.warn("Transaction confirmation error:", error);
        // Don't set error here as the transaction might still be processing
      }
    } catch (e: any) {
      console.error("Payment error:", e);
      setError(e.message || "Transaction failed");
      setTxStatus('failed');
    }
    
    setLoading(false);
  };


  // Helper function to get status message and color
  const getStatusInfo = () => {
    switch (txStatus) {
      case 'preparing':
        return { message: 'Preparing transaction...', color: 'text-blue-600 dark:text-blue-400' };
      case 'submitting':
        return { message: 'Submitting to blockchain...', color: 'text-blue-600 dark:text-blue-400' };
      case 'pending':
        return { message: 'Transaction submitted, waiting for confirmation...', color: 'text-yellow-600 dark:text-yellow-400' };
      case 'confirming':
        return { message: 'Confirming transaction...', color: 'text-yellow-600 dark:text-yellow-400' };
      case 'confirmed':
        return { message: 'Transaction confirmed!', color: 'text-green-600 dark:text-green-400' };
      case 'failed':
        return { message: error || 'Transaction failed', color: 'text-red-600 dark:text-red-400' };
      default:
        return { message: '', color: '' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="mt-4 text-center">
      <button
        onClick={handlePay}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-60"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {txStatus === 'idle' ? 'Processing...' : statusInfo.message}
          </span>
        ) : (
          `Pay with Wallet`
        )}
      </button>
      
      {/* Transaction status messages */}
      {txStatus !== 'idle' && txStatus !== 'confirmed' && !error && (
        <div className={`mt-2 ${statusInfo.color} text-sm font-medium`}>
          {statusInfo.message}
        </div>
      )}
      
      {/* Transaction hash with link */}
      {txHash && (
        <div className="mt-2 text-green-600 dark:text-green-400">
          <span className="block mb-1">Transaction sent!</span>
          <a 
            href={`https://basescan.org/tx/${txHash}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center space-x-1 underline"
          >
            <span>View on BaseScan</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="mt-2 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      
      {/* Mobile wallet options */}
      {!window.ethereum && isMobile() && (
        <div className="mt-4 text-center">
          <div className="mb-2 text-sm text-gray-600 dark:text-gray-300">No wallet detected. Open in your wallet app:</div>
          <div className="flex flex-col gap-2 items-center">
            <a
              href={`metamask://dapp/${typeof window !== 'undefined' ? window.location.host + window.location.pathname + window.location.search : ''}`}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition"
            >
              Open in MetaMask
            </a>
            <a
              href={`cbwallet://dapp?url=${typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : ''}`}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
            >
              Open in Coinbase Wallet
            </a>
            <WalletConnectButton to={to} amount={amount} currency={currency} />
          </div>
        </div>
      )}
      {error && <div className="mt-2 text-red-600 dark:text-red-400">{error}</div>}
    </div>
  );
}
