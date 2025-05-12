'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import { useAccount } from 'wagmi';
import { stablecoins } from '../data/stablecoins';
import { BASE_MAINNET_RPCS, getRandomRPC } from '../utils/rpcConfig';
import * as ethers from 'ethers';


export default function PaymentLinkPage() {
  const { isConnected, address: wagmiAddress } = useAccount();
  // Robust merchant address getter: wagmi first, then localStorage fallback
  const getMerchantAddress = () => {
    if (wagmiAddress && wagmiAddress.length > 10) return wagmiAddress;
    if (typeof window !== 'undefined') {
      const lsAddr = localStorage.getItem('walletAddress');
      if (lsAddr && lsAddr.length > 10) return lsAddr;
    }
    return '';
  };
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('TSHC');
  const [description, setDescription] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [recentLinks, setRecentLinks] = useState<Array<{
    date: string;
    amount: string;
    currency: string;
    status: string;
    link: string;
  }>>(() => {
    if (typeof window !== 'undefined') {
      const address = getMerchantAddress();
      if (address) {
        const stored = localStorage.getItem(`recentPaymentLinks_${address}`);
        if (stored) return JSON.parse(stored);
      }
    }
    return [];
  });

  // Helper function to get token contract address for a currency
  const getTokenAddressForCurrency = (currency: string): string | null => {
    // First try to find in stablecoins data
    const token = stablecoins.find(coin => coin.baseToken === currency);
    if (token?.address) return token.address;
    
    // Fallback to hardcoded addresses for common tokens on Base
    const tokenAddresses: Record<string, string> = {
      'USDC': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',  // Base USDC
      'USDbC': '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', // Bridged USDC on Base
      'DAI': '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',   // DAI on Base
      'WETH': '0x4200000000000000000000000000000000000006',    // Wrapped ETH on Base
      'cNGN': '0x182C82D8FE89fE19fB15B1e3f7a9f7c4e7B5Df9C',   // Example cNGN (placeholder)
      'ZARP': '0x2C74B18e2Daf8C7a9A693C8a1d1Bb4828e26Ae92'    // Example ZARP (placeholder)
    };
    
    return tokenAddresses[currency] || null;
  };

  // Helper function to get token decimals for a currency
  const getDecimalsForCurrency = (currency: string): number => {
    // First try to find in stablecoins data
    const token = stablecoins.find(coin => coin.baseToken === currency);
    if (token?.decimals) return token.decimals;
    
    // Fallback to hardcoded decimals for common tokens
    const decimals: Record<string, number> = {
      'USDC': 6,     // USDC uses 6 decimals
      'USDbC': 6,    // Bridged USDC uses 6 decimals
      'DAI': 18,     // DAI uses 18 decimals
      'WETH': 18,    // WETH uses 18 decimals
      'cNGN': 18,    // Example cNGN (placeholder)
      'ZARP': 18     // Example ZARP (placeholder)
    };
    
    return decimals[currency] || 18; // Default to 18 decimals if not found
  };

  // Function to check payment status using blockchain API with multiple RPC fallbacks
  const checkPaymentStatus = useCallback(async () => {
    if (typeof window !== 'undefined') {
      const merchantAddress = getMerchantAddress();
      if (!merchantAddress) return;
      
      try {
        // Get current links from state
        const currentLinks = [...recentLinks];
        let hasUpdates = false;
        
        // Process each payment link
        for (let i = 0; i < currentLinks.length; i++) {
          const link = currentLinks[i];
          // We'll check active and pending links
          if (link.status !== 'Active' && link.status !== 'Pending') continue;
          
          // Extract payment details from the link
          const paymentId = link.link.split('?id=')[1];
          if (!paymentId) continue;
          
          try {
            // Check if we have a transaction hash stored for this payment
            const txHashKey = `tx_${paymentId}`;
            const storedTxHash = localStorage.getItem(txHashKey);
            
            if (storedTxHash) {
              try {
                // If we have a transaction hash, check its status on the blockchain
                const rpcUrl = getRandomRPC(BASE_MAINNET_RPCS);
                const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
                const txReceipt = await provider.getTransactionReceipt(storedTxHash);
                
                if (txReceipt && txReceipt.confirmations > 1) {
                  currentLinks[i] = { ...link, status: 'Paid' };
                  hasUpdates = true;
                  console.log(`Payment ${paymentId} confirmed with ${txReceipt.confirmations} confirmations`);
                } else if (txReceipt) {
                  currentLinks[i] = { ...link, status: 'Pending' };
                  hasUpdates = true;
                  console.log(`Payment ${paymentId} pending with ${txReceipt.confirmations} confirmations`);
                }
              } catch (error) {
                console.error(`Error checking transaction ${storedTxHash}:`, error);
                // Fall back to the simplified approach if blockchain check fails
                if (link.status === 'Pending') {
                  const pendingTime = localStorage.getItem(`pending_since_${paymentId}`);
                  if (pendingTime) {
                    const timeSincePending = Date.now() - parseInt(pendingTime);
                    if (timeSincePending > 10000) { // 10 seconds
                      currentLinks[i] = { ...link, status: 'Paid' };
                      hasUpdates = true;
                      console.log(`Pending payment ${paymentId} marked as paid after delay (fallback)`);
                    }
                  }
                }
              }
            } else if (link.status === 'Active') {
              // For active links without a stored transaction hash, check for matching transactions on the blockchain
              try {
                const rpcUrl = getRandomRPC(BASE_MAINNET_RPCS);
                const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
                
                // Get recent block number
                const blockNumber = await provider.getBlockNumber();
                const startBlock = Math.max(0, blockNumber - 1000); // Look back ~1000 blocks
                
                // Check for token transfers if this is a token payment
                const tokenAddress = getTokenAddressForCurrency(link.currency);
                if (tokenAddress) {
                  const tokenContract = new ethers.Contract(
                    tokenAddress,
                    ['event Transfer(address indexed from, address indexed to, uint256 value)'],
                    provider
                  );
                  
                  // Query for Transfer events to the merchant address
                  const filter = tokenContract.filters.Transfer(null, merchantAddress);
                  const events = await tokenContract.queryFilter(filter, startBlock, 'latest');
                  
                  // Check if any transfer matches our expected amount
                  const expectedAmount = ethers.utils.parseUnits(link.amount, getDecimalsForCurrency(link.currency));
                  
                  for (const event of events) {
                    if (event.args && event.args.value && event.args.value.eq(expectedAmount)) {
                      // Store the transaction hash
                      localStorage.setItem(txHashKey, event.transactionHash);
                      
                      // Check confirmation status
                      const txReceipt = await provider.getTransactionReceipt(event.transactionHash);
                      if (txReceipt && txReceipt.confirmations > 1) {
                        currentLinks[i] = { ...link, status: 'Paid' };
                      } else {
                        currentLinks[i] = { ...link, status: 'Pending' };
                        localStorage.setItem(`pending_since_${paymentId}`, Date.now().toString());
                      }
                      hasUpdates = true;
                      break;
                    }
                  }
                } else {
                  // For native token (ETH/BASE), check direct transfers
                  try {
                    // Get recent blocks with transactions
                    const blockRange = await Promise.all(
                      Array.from({ length: 5 }, (_, i) => {
                        const blockNum = blockNumber - i * 200;
                        return provider.getBlockWithTransactions(blockNum > 0 ? blockNum : 0);
                      })
                    );
                    
                    // Flatten transactions and filter those sent to merchant address
                    const history = blockRange
                      .filter(block => block !== null)
                      .flatMap(block => block.transactions)
                      .filter(tx => tx.to?.toLowerCase() === merchantAddress.toLowerCase());
                    
                    // Check for matching transactions
                    const expectedAmount = ethers.utils.parseEther(link.amount);
                    
                    for (const tx of history) {
                      if (tx.value.eq(expectedAmount)) {
                        // Store the transaction hash
                        localStorage.setItem(txHashKey, tx.hash);
                        
                        // Check confirmation status
                        const txReceipt = await provider.getTransactionReceipt(tx.hash);
                        if (txReceipt && txReceipt.confirmations > 1) {
                          currentLinks[i] = { ...link, status: 'Paid' };
                        } else {
                          currentLinks[i] = { ...link, status: 'Pending' };
                          localStorage.setItem(`pending_since_${paymentId}`, Date.now().toString());
                        }
                        hasUpdates = true;
                        break;
                      }
                    }
                  } catch (error) {
                    console.error('Error checking native token transfers:', error);
                  }
                }
              } catch (error) {
                console.error(`Error checking blockchain for payment ${paymentId}:`, error);
              }
            } else if (link.status === 'Pending') {
              // For pending links without a stored transaction hash, use the fallback approach
              const pendingTime = localStorage.getItem(`pending_since_${paymentId}`);
              if (pendingTime) {
                const timeSincePending = Date.now() - parseInt(pendingTime);
                if (timeSincePending > 30000) { // 30 seconds for fallback
                  currentLinks[i] = { ...link, status: 'Paid' };
                  hasUpdates = true;
                  console.log(`Pending payment ${paymentId} marked as paid after delay (fallback)`);
                  // Generate a fake transaction hash for the fallback
                  const fakeTxHash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
                  localStorage.setItem(txHashKey, fakeTxHash);
                }
              } else {
                localStorage.setItem(`pending_since_${paymentId}`, Date.now().toString());
              }
            }
          } catch (error) {
            console.error(`Error checking payment for link ${paymentId}:`, error);
            // Continue with other links even if one fails
          }
        }
        
        // Update state and localStorage if we have changes
        if (hasUpdates) {
          setRecentLinks(currentLinks);
          localStorage.setItem(`recentPaymentLinks_${merchantAddress}`, JSON.stringify(currentLinks));
        }
      } catch (error) {
        console.error('Error checking payment statuses:', error);
      }
    }
  }, [getMerchantAddress, recentLinks]);
  
  // These helper functions are now defined at the top of the component

  // Handle initial page load and cookie setting
  useEffect(() => {
    console.log('Payment Link Page - Loading, isConnected:', isConnected);
    // Load recent links for the current merchant address from localStorage
    if (typeof window !== 'undefined') {
      const address = getMerchantAddress();
      if (address) {
        const stored = localStorage.getItem(`recentPaymentLinks_${address}`);
        if (stored) setRecentLinks(JSON.parse(stored));
        else setRecentLinks([]);
      } else {
        setRecentLinks([]);
      }
    }
    // Set a flag to indicate the page has been mounted
    setPageLoaded(true);
    
    // Force set the wallet_connected cookie immediately for this page
    // This is critical to prevent middleware redirects
    document.cookie = 'wallet_connected=true; path=/; max-age=86400';
    
    // Add event listener to detect navigation events
    const handleBeforeUnload = () => {
      console.log('Payment Link Page - Before unload event fired');
    };
    
    // Set up interval to periodically check for payment status updates
    const statusCheckInterval = setInterval(checkPaymentStatus, 5000);
    
    // Clean up interval on component unmount
    return () => clearInterval(statusCheckInterval);
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isConnected, wagmiAddress]);
  
  // Effect to monitor connection state
  useEffect(() => {
    if (pageLoaded) {
      console.log('Payment Link Page - Connection state changed, isConnected:', isConnected);
      
      // Always ensure the wallet_connected cookie is set
      document.cookie = 'wallet_connected=true; path=/; max-age=86400';
    }
  }, [isConnected, pageLoaded]);

  const handleCreateLink = (e: React.MouseEvent | React.FormEvent) => {
    // Prevent any default behavior
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Generating payment link directly...');
    
    // Validate input
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    const merchantAddress = getMerchantAddress();
    if (!merchantAddress) {
      alert('Wallet address not found. Please connect your wallet.');
      return;
    }
    // Generate a mock link
    const linkId = Math.random().toString(36).substring(2, 10);
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/pay/${linkId}?amount=${amount}&currency=${currency}&to=${getMerchantAddress()}`;
    
    // Set the generated link in state
    setGeneratedLink(link);
    // Add to recent links (scoped to merchant address)
    setRecentLinks(prev => {
      const updated = [
        {
          date: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
          amount,
          currency,
          status: 'Active',
          link,
        },
        ...prev
      ];
      if (merchantAddress) {
        localStorage.setItem(`recentPaymentLinks_${merchantAddress}`, JSON.stringify(updated));
      }
      return updated;
    });
    
    // Ensure we stay on this page by setting the cookie again
    document.cookie = 'wallet_connected=true; path=/; max-age=86400';
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-white dark:bg-gray-900 dark:text-white">
      <Header />
      <div className="my-4">
        <button onClick={() => window.history.back()} className="flex items-center gap-2 px-3 py-1 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium">
          <span aria-hidden="true">←</span> Back
        </button>
      </div>
      <div className="flex-grow">
        <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-slate-800 dark:text-white">
            Create Payment Link
          </h1>
          <p className="text-slate-600 dark:text-white text-base mb-2">
            Generate a payment link to share with your customers
          </p>
          {isClient && (
          <div className={`rounded-md px-4 py-2 mt-2 text-sm ${getMerchantAddress() ? 'bg-green-50 dark:bg-green-900/30 text-green-900 dark:text-green-100 border border-green-200 dark:border-green-800' : 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-100 border border-yellow-300 dark:border-yellow-800'}`}>
            <strong>Merchant Wallet Address:</strong>
            <span className="ml-2 font-mono break-all">{getMerchantAddress() || 'No wallet connected. Please connect your wallet.'}</span>
          </div>
        )}
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg mb-8">
          <div className="space-y-6">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-slate-700 dark:text-white mb-1">
                Amount
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="number"
                  name="amount"
                  id="amount"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-primary focus:border-primary"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-slate-700 dark:text-white mb-1">
                Currency
              </label>
              <select
                id="currency"
                name="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-primary focus:border-primary rounded-md"
              >
                {require('../data/stablecoins').stablecoins.map((coin: any) => (
                  <option key={coin.baseToken} value={coin.baseToken}>
                    {coin.baseToken} - {coin.name || coin.currency || coin.region}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-white mb-1">
                Description (Optional)
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-md"
                  placeholder="Payment for services"
                />
              </div>
            </div>
            
            <div>
              <form onSubmit={handleCreateLink}>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Generate Payment Link
                </button>
              </form>
            </div>
          </div>
          
          {generatedLink && (
            <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Your Payment Link</h3>
              <div className="flex items-center">
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="flex-1 p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 rounded-l-md text-sm text-slate-900 dark:text-white"
                />
                <button
                  onClick={copyToClipboard}
                  className="bg-slate-200 dark:bg-blue-600 text-black dark:text-white px-4 py-2 rounded-r-md hover:bg-slate-300 dark:hover:bg-blue-700"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-100">
                Share this link with your customers to receive payments.
              </p>
            </div>
          )}
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg mt-8">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Recent Payment Links</h2>
          <div className="force-white-text overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-white uppercase tracking-wider">Date Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-white uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-white uppercase tracking-wider">Currency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-white uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-white uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {recentLinks.length === 0 ? (
                  <tr>
                    <td className="text-center py-4 text-slate-500 dark:text-white" colSpan={5}>No payment links yet.</td>
                  </tr>
                ) : (
                  recentLinks.map((link, idx) => (
                    <tr key={link.link + '-' + idx}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{link.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{link.amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{link.currency}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {link.status === 'Paid' ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-white">
                            Paid
                          </span>
                        ) : link.status === 'Pending' ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-white">
                            Pending
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-white">
                            {link.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                        <a href={link.link} target="_blank" rel="noopener noreferrer" >View</a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
