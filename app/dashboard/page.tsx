'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Connector } from 'wagmi';
import { Name } from '@coinbase/onchainkit/identity';
import { base } from 'viem/chains';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { Toaster, toast } from 'react-hot-toast';
import TransactionTable from './TransactionTable';
import { stablecoins } from '../data/stablecoins';
import { ethers } from 'ethers';
import { getProvider } from '../utils/rpcProvider';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  ArcElement
);

// Function to process balances data
const processBalances = (balanceData: Record<string, string>, networkChainId?: number) => {
  // Always show all stablecoins, but only real balances for tokens on the current network
  const processed = stablecoins.map((coin) => {
    let balance = '0';
    if (!networkChainId || coin.chainId === networkChainId) {
      balance = balanceData[coin.baseToken] || '0';
    }
    return {
      symbol: coin.baseToken,
      name: coin.name,
      balance,
      flag: coin.flag || '🌐',
      region: coin.region || 'Unknown',
    };
  });

  // Calculate total received
  const total = processed.reduce((sum, coin) => sum + parseInt(coin.balance.replace(/,/g, '')), 0);

  // Calculate percentages
  const processedCoins = processed.map(coin => ({
    ...coin,
    percentage: total > 0 ? Math.round((parseInt(coin.balance.replace(/,/g, '')) / total) * 100) : 0
  }));

  // Ensure we have all stablecoins represented for display
  const allStablecoins = stablecoins.map(coin => {
    // Find if this coin exists in processed data
    const existingCoin = processed.find(p => p.symbol === coin.baseToken);
    if (existingCoin) {
      return existingCoin;
    }
    // If not found, create a default entry with zero balance
    return {
      symbol: coin.baseToken,
      name: coin.name,
      balance: '0',
      flag: coin.flag || '🌐',
      region: coin.region || 'Unknown',
    };
  });

  return {
    processedBalances: allStablecoins, // Use the complete list to ensure all coins are shown
    totalReceived: total.toLocaleString(),
    processedStablecoins: processedCoins
  };
};

// Format transactions for display with links and currency
// Utility to fetch real incoming payments (ERC20 Transfer events) for all stablecoins on Base
async function fetchIncomingPayments(merchantAddress: string) {
  if (!merchantAddress) return [];
  
  // Check cache first
  const { getCachedTransactions, setCachedTransactions } = await import('../utils/transactionCache');
  const cachedTransactions = getCachedTransactions(merchantAddress);
  
  // If we have cached transactions, use them
  if (cachedTransactions) {
    console.log('Using cached transactions for', merchantAddress);
    return cachedTransactions;
  }
  
  console.log('Fetching fresh transactions for', merchantAddress);
  const ethers = (await import('ethers')).ethers;
  // Use robust fallback provider logic
  const { getProvider } = await import('../utils/rpcProvider');
  const provider = await getProvider();
  const ERC20_ABI = [
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
  ];
  
  // Use a larger block range to ensure we capture more transactions
  const latestBlock = await provider.getBlockNumber();
  const fromBlock = Math.max(latestBlock - 20000, 0); // Increased to 20000 blocks to show more historical data
  
  let allTxs: any[] = [];
  const baseTokens = stablecoins.filter(c => c.chainId === 8453 && c.address && /^0x[a-fA-F0-9]{40}$/.test(c.address));
  
  // Process tokens in parallel for better performance
  await Promise.all(baseTokens.map(async (coin) => {
    try {
      const contract = new ethers.Contract(coin.address, ERC20_ABI, provider);
      
      // Fetch decimals
      let decimals;
      try {
        decimals = await contract.decimals();
      } catch (e) {
        console.warn(`Skipping token ${coin.baseToken} at ${coin.address}: decimals() call failed.`);
        return;
      }
      
      // Fetch transfer events
      const { paginatedQueryFilter } = await import('../utils/paginatedQueryFilter');
      const logs = await paginatedQueryFilter(
        contract,
        contract.filters.Transfer(null, merchantAddress),
        fromBlock,
        latestBlock
      );
      
      // Process logs
      const symbol = coin.baseToken;
      const txPromises = logs.map(async (log) => {
        const { transactionHash, args, blockNumber } = log;
        if (!args) return null;
        
        const from = args.from;
        const to = args.to;
        const value = ethers.utils.formatUnits(args.value, decimals);
        
        // Get block details
        const block = await provider.getBlock(blockNumber);
        const date = new Date(block.timestamp * 1000);
        
        return {
          id: transactionHash,
          shortId: transactionHash.slice(0, 6) + '...' + transactionHash.slice(-4),
          date: date.toISOString().replace('T', ' ').slice(0, 16),
          amount: value,
          currency: symbol,
          status: 'Completed',
          sender: from,
          senderShort: from.slice(0, 6) + '...' + from.slice(-4),
          blockExplorerUrl: `https://basescan.org/tx/${transactionHash}`,
          timestamp: block.timestamp // For sorting
        };
      });
      
      const transactions = (await Promise.all(txPromises)).filter(tx => tx !== null) as any[];
      allTxs = [...allTxs, ...transactions];
    } catch (e) {
      console.warn(`Error processing token ${coin.baseToken}:`, e);
    }
  }));
  
  // Sort by most recent
  allTxs.sort((a, b) => b.timestamp - a.timestamp);
  const result = allTxs.slice(0, 50); // Increased from 20 to 50 to show more historical transactions
  
  // Cache the results
  setCachedTransactions(merchantAddress, result);
  
  return result;
}

// Function to get payment methods data for charts (per stablecoin, using transactions)
const getPaymentMethodsData = (transactions: any[]) => {
  // Count transactions per stablecoin
  const grouped: Record<string, { count: number, flag: string }> = {};
  transactions.forEach(tx => {
    const symbol = tx.currency;
    if (!grouped[symbol]) {
      // Find the flag from stablecoins
      const coin = stablecoins.find(c => c.baseToken === symbol);
      grouped[symbol] = { count: 0, flag: coin?.flag || '🌐' };
    }
    grouped[symbol].count++;
  });
  const entries = Object.entries(grouped).filter(([sym, data]) => data.count > 0);
  const labels = entries.map(([symbol]) => symbol);
  const data = entries.map(([_, d]) => d.count);
  // Cycle colors for all currencies
  const baseColors = [
    'rgba(59, 130, 246, 0.8)',  // Blue
    'rgba(16, 185, 129, 0.8)',  // Green
    'rgba(245, 158, 11, 0.8)',  // Amber
    'rgba(139, 92, 246, 0.8)',  // Purple
    'rgba(239, 68, 68, 0.8)'    // Red
  ];
  const backgroundColor = labels.map((_, i) => baseColors[i % baseColors.length]);
  const borderColor = [
    'rgba(59, 130, 246, 1)',
    'rgba(16, 185, 129, 1)',
    'rgba(245, 158, 11, 1)',
    'rgba(139, 92, 246, 1)',
    'rgba(239, 68, 68, 1)'
  ];
  return {
    labels,
    datasets: [
      {
        label: 'Payment Methods',
        data,
        backgroundColor,
        borderColor: borderColor,
        borderWidth: 1
      }
    ]
  };
};

// Daily revenue data
// Generate daily revenue data from real transactions
function getDailyRevenueData(transactions: any[]) {
  // Determine the most common currency symbol
  const currencyCounts: Record<string, number> = {};
  transactions.forEach(tx => {
    if (tx.currency) currencyCounts[tx.currency] = (currencyCounts[tx.currency] || 0) + 1;
  });
  const mainSymbol = Object.entries(currencyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

  // Build a map of YYYY-MM-DD to total revenue
  const dayMap: Record<string, number> = {};
  transactions.forEach(tx => {
    // Defensive: ensure tx.date is valid and amount is a number
    let day = '';
    if (tx.date) {
      try {
        // Accept both ISO and Date objects
        day = typeof tx.date === 'string' ? tx.date.slice(0, 10) : new Date(tx.date).toISOString().slice(0, 10);
      } catch {}
    }
    const amount = parseFloat((tx.amount || '0').toString().replace(/,/g, ''));
    if (day && !isNaN(amount)) {
      dayMap[day] = (dayMap[day] || 0) + amount;
    }
  });

  // Always show the last 7 days including today
  const today = new Date('2025-04-24'); // Use current local time from user context
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  return {
    labels: days,
    datasets: [
      {
        label: `Daily Revenue${mainSymbol ? ' (' + mainSymbol + ')' : ''}`,
        data: days.map(day => dayMap[day] || 0),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true,
      }
    ]
  };
}

// Daily revenue data
// Generate daily revenue data for each stablecoin separately
function getMultiStablecoinDailyRevenueData(transactions: any[]) {
  // Get all dates in the data
  const dateSet = new Set<string>();
  const stablecoinSymbols = Array.from(new Set(transactions.map(tx => tx.currency)));
  transactions.forEach(tx => {
    const d = tx.date.split('T')[0];
    dateSet.add(d);
  });
  const dates = Array.from(dateSet).sort();

  // Check if we're in dark mode
  const isDarkMode = typeof window !== 'undefined' && 
                    window.matchMedia && 
                    window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Define chart line colors - darker colors for light mode, bright colors for dark mode
  const lightModeColors = ['#1e40af', '#065f46', '#9a3412', '#5b21b6', '#be185d']; // Dark, saturated colors for light mode
  const darkModeColors = ['#60a5fa', '#34d399', '#fb923c', '#a78bfa', '#f472b6']; // Bright, vibrant colors for dark mode
  
  // Prepare a dataset for each stablecoin
  const datasets = stablecoinSymbols.map((symbol, index) => {
    // Find the flag from stablecoins
    const coin = stablecoins.find(c => c.baseToken === symbol);
    const flag = coin?.flag || '🌐';
    
    // Use bright colors in dark mode, dark colors in light mode
    const lineColor = isDarkMode ? darkModeColors[index % darkModeColors.length] : lightModeColors[index % lightModeColors.length];
    
    return {
      label: `${flag} ${symbol}`,
      data: dates.map(date => {
        // Sum for this date and stablecoin
        return transactions
          .filter(tx => tx.currency === symbol && tx.date.startsWith(date))
          .reduce((sum, tx) => sum + (parseFloat((tx.amount || '0').replace(/,/g, '')) || 0), 0);
      }),
      borderColor: lineColor,
      backgroundColor: lineColor,
      fill: false,
      tension: 0.2,
    };
  });
  return {
    labels: dates,
    datasets,
  };
}

// Transactions by day data
// Generate transactions by day data from real transactions
function getTransactionsByDayData(transactions: any[]) {
  // Group by weekday
  const dayMap: Record<string, number> = { 'Sun': 0, 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0 };
  transactions.forEach(tx => {
    const dateObj = new Date(tx.date);
    const day = dateObj.toLocaleDateString(undefined, { weekday: 'short' });
    dayMap[day] = (dayMap[day] || 0) + 1;
  });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return {
    labels: weekDays,
    datasets: [
      {
        label: 'Transactions',
        data: weekDays.map(day => dayMap[day] || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.8)'
      }
    ]
  };
}

import Balances from './Balances';
import SwapModal from './SwapModal';
import TransactionHistory from './TransactionHistory';

export default function MerchantDashboard() {
  // Wallet switching state
  const [selectedWalletType, setSelectedWalletType] = useState<'eoa' | 'smart'>('eoa');
  const [smartWalletAddress, setSmartWalletAddress] = useState<string | null>(null);
  const [smartWalletLoading, setSmartWalletLoading] = useState(false);
  // ...existing state and hooks...
  const { address, isConnected, connector } = useAccount();
  
  // Only show and use the correct address for the selected wallet type
  const selectedWalletAddress = selectedWalletType === 'eoa'
    ? address
    : (smartWalletAddress && smartWalletAddress !== address ? smartWalletAddress : undefined);
  const [copied, setCopied] = useState(false);
  const [networkWarning, setNetworkWarning] = useState(false);
  const [balanceError, setBalanceError] = useState(false);
  const [errorTokens, setErrorTokens] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapFromSymbol, setSwapFromSymbol] = useState<string>('');
  // Fix: Add missing state for transactions and loading
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isTransactionLoading, setIsTransactionLoading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Currency filter state
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');

  // Prepare balances for Balances component
  const { processedBalances } = processBalances(balances);

  // Handler for Swap button
  const handleSwapClick = (fromSymbol: string) => {
    setSwapFromSymbol(fromSymbol);
    setSwapModalOpen(true);
  };

  // Handler for SwapModal swap action
  const handleSwap = (from: string, to: string, amount: string) => {
    setSwapModalOpen(false);
    toast.success(`Swap successful! ${amount} ${from} swapped to ${to}.`);
    // Optionally refresh balances
  };

  // ... existing code ...
  const router = useRouter();
  
  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Dynamically fetch smart wallet address when EOA or wallet type changes
  useEffect(() => {
    async function updateSmartWalletAddress() {
      if (selectedWalletType !== 'smart' || !address) {
        setSmartWalletAddress(null);
        return;
      }
      setSmartWalletLoading(true);
      // Try cache/localStorage first
      const cacheKey = `smartWallet_${address}`;
      let smartAddr: string | null = null;
      if (typeof window !== 'undefined') {
        const storedWallet = localStorage.getItem(cacheKey);
        if (storedWallet) {
          try {
            const wallet = JSON.parse(storedWallet);
            if (wallet && wallet.address) {
              smartAddr = wallet.address;
              setSmartWalletAddress(wallet.address);
              setSmartWalletLoading(false);
              return;
            }
          } catch {}
        }
      }
      // If not in cache, compute using getSmartWalletAddress
      try {
        const { getSmartWalletAddress } = await import('../utils/smartWallet');
        const { ethers } = await import('ethers');
        const provider = new ethers.providers.JsonRpcProvider('https://base-rpc.publicnode.com');
        const salt = 0; // Use 0 unless you support multiple smart wallets per EOA
        const realSmartWallet = await getSmartWalletAddress(address, salt, provider);
        setSmartWalletAddress(realSmartWallet);
        // Cache for next time
        if (typeof window !== 'undefined') {
          localStorage.setItem(cacheKey, JSON.stringify({ address: realSmartWallet }));
        }
      } catch (err) {
        setSmartWalletAddress(null);
        console.error('Failed to fetch smart wallet address', err);
      }
      setSmartWalletLoading(false);
    }
    updateSmartWalletAddress();
  }, [address, selectedWalletType]);

  // Fetch balances and info for the correct wallet after selectedWalletAddress is set
  useEffect(() => {
    // Only fetch balances if the correct address is loaded
    if (
      isConnected &&
      ((selectedWalletType === 'eoa' && address && connector) ||
       (selectedWalletType === 'smart' && smartWalletAddress && smartWalletAddress !== address && connector))
    ) {
      fetchRealBalances(selectedWalletAddress!);
    }
  }, [isConnected, selectedWalletAddress, connector, selectedWalletType, smartWalletAddress, address]);

  // Fetch real incoming payments with optimized loading
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (!isConnected || !selectedWalletAddress) return;
      
      // Show loading state
      setIsTransactionLoading(true);
      
      try {
        // Check if we have cached data first
        const { getCachedTransactions } = await import('../utils/transactionCache');
        const cachedTxs = getCachedTransactions(selectedWalletAddress);
        
        // If we have cached data, show it immediately while we fetch fresh data
        if (cachedTxs && cachedTxs.length > 0 && isMounted) {
          setTransactions(cachedTxs);
          // Keep loading indicator on to show we're refreshing in the background
        }
        
        // Fetch fresh data
        const txs = await fetchIncomingPayments(selectedWalletAddress);
        
        // Update state if component is still mounted
        if (isMounted) {
          setTransactions(txs);
          setIsTransactionLoading(false);
        }
        
        // Save transactions to database in the background
        if (txs.length > 0) {
          // Fetch existing transactions from the DB for this merchant
          const res = await fetch(`/api/transactions?merchantId=${selectedWalletAddress}`);
          const dbTxs = res.ok ? await res.json() : [];
          const dbHashes = new Set(dbTxs.map((t: any) => t.txHash));
          
          // Only POST transactions that aren't already in DB
          // Use Promise.all to parallelize the requests
          const newTxs = txs.filter(tx => !dbHashes.has(tx.id));
          if (newTxs.length > 0) {
            await Promise.all(newTxs.map(tx => {
              return fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  merchantId: selectedWalletAddress,
                  wallet: tx.sender,
                  amount: parseFloat(tx.amount),
                  currency: tx.currency,
                  status: tx.status,
                  txHash: tx.id,
                })
              });
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
        if (isMounted) {
          setIsTransactionLoading(false);
        }
      }
    };
    
    fetchData();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [address, isConnected, selectedWalletType, selectedWalletAddress, connector]);

  // --- Live Blockchain Event Listeners for Instant Updates ---
  useEffect(() => {
    if (!isConnected || !address) return;
    let listeners: Array<() => void> = [];
    let cancelled = false;
    (async () => {
      const ethersLib = (await import('ethers')).ethers;
      // Use public Base Mainnet RPC
      const provider = new ethersLib.providers.JsonRpcProvider('https://base-rpc.publicnode.com');
      const ERC20_ABI = [
        "event Transfer(address indexed from, address indexed to, uint256 value)",
        "function decimals() view returns (uint8)",
        "function symbol() view returns (string)"
      ];
      // For each supported stablecoin on Base
      for (const coin of stablecoins.filter(c => c.chainId === 8453 && c.address && /^0x[a-fA-F0-9]{40}$/.test(c.address))) {
        try {
          const contract = new ethersLib.Contract(coin.address, ERC20_ABI, provider);
          const decimals = await contract.decimals();
          const symbol = coin.baseToken;
          // Listener callback
          const onTransfer = async (from: string, to: string, value: ethers.BigNumber, event: any) => {
            if (cancelled) return;
            if (to.toLowerCase() === address.toLowerCase()) {
              const txHash = event.transactionHash;
              // Check if already in DB
              const res = await fetch(`/api/transactions?merchantId=${address}`);
              const dbTxs = res.ok ? await res.json() : [];
              const dbHashes = new Set(dbTxs.map((t: any) => t.txHash));
              if (!dbHashes.has(txHash)) {
                await fetch('/api/transactions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    merchantId: address,
                    wallet: from,
                    amount: parseFloat(ethersLib.utils.formatUnits(value, decimals)),
                    currency: symbol,
                    status: 'Completed',
                    txHash,
                  })
                });
                // Show toast notification for new payment
                const shortSender = from.slice(0, 6) + '...' + from.slice(-4);
                (await import('react-hot-toast')).toast.success(
                  `Payment received: ${parseFloat(ethersLib.utils.formatUnits(value, decimals))} ${symbol} from ${shortSender}`
                );
                // Dispatch notification event for NotificationTab
                window.dispatchEvent(new CustomEvent('neda-notification', {
                  detail: {
                    message: `Payment received: ${parseFloat(ethersLib.utils.formatUnits(value, decimals))} ${symbol} from ${shortSender}`
                  }
                }));
                // Optionally, refresh the UI
                fetchIncomingPayments(address).then(setTransactions);
              }
            }
          };
          contract.on('Transfer', onTransfer);
          listeners.push(() => contract.off('Transfer', onTransfer));
        } catch (e) {
          // Ignore tokens that can't be listened to
        }
      }
    })();
    return () => {
      cancelled = true;
      listeners.forEach(off => off());
    };
  }, [isConnected, address]);
  
  // Check wallet connection and redirect if needed
  useEffect(() => {
    if (!mounted) return;
    
    // Check if wallet is connected via localStorage
    const walletConnected = localStorage.getItem('walletConnected') === 'true';
    const cookieWalletConnected = document.cookie.includes('wallet_connected=true');
    
    // If not connected, redirect to home
    if (!walletConnected && !cookieWalletConnected) {
      router.push('/?walletRequired=true');
    } else if (walletConnected && !cookieWalletConnected) {
      // If localStorage has connection but cookie doesn't, sync them
      document.cookie = 'wallet_connected=true; path=/; max-age=86400'; // 24 hours
    } else if (cookieWalletConnected && !walletConnected) {
      // If cookie exists but localStorage doesn't, sync them
      localStorage.setItem('walletConnected', 'true');
    }
    
    // Check for smart wallet
    if (address && typeof window !== 'undefined') {
      const storedWallet = localStorage.getItem(`smartWallet_${address}`);
      if (storedWallet) {
        try {
          const wallet = JSON.parse(storedWallet);
          setSmartWalletAddress(wallet.address);
        } catch (e) {
          console.error('Error parsing smart wallet data', e);
        }
      }
    }
    
    // Fetch real balances when connected
    if (isConnected && address && connector) {
      fetchRealBalances(address);
    }
    
    // Set up real blockchain event listeners
    if (typeof window !== 'undefined' && isConnected) {
      // In a production environment, we would set up real blockchain event listeners
      // For example using ethers.js to listen for Transfer events:
      
      // const provider = new ethers.providers.Web3Provider(window.ethereum);
      // const tokenAddresses = stablecoins.map(coin => coin.address);
      // 
      // // Set up listeners for each token
      // tokenAddresses.forEach(address => {
      //   const tokenContract = new ethers.Contract(address, ERC20_ABI, provider);
      //   const filter = tokenContract.filters.Transfer(null, walletAddress);
      //   
      //   tokenContract.on(filter, (from, to, amount, event) => {
      //     // Refresh balances and transactions when we receive a transfer
      //     fetchRealBalances(walletAddress);
      //   });
      // });
      // 
      // // Clean up
      // return () => {
      //   tokenAddresses.forEach(address => {
      //     const tokenContract = new ethers.Contract(address, ERC20_ABI, provider);
      //     tokenContract.removeAllListeners();
      //   });
      // };
      
      // For this demo, we'll set up a periodic refresh
      const refreshInterval = setInterval(() => {
        if (address) {
          fetchRealBalances(address);
        }
      }, 30000); // Refresh every 30 seconds
      
      // Clean up
      return () => {
        clearInterval(refreshInterval);
      }
    }
  }, [address, isConnected, router]);
  
  // Function to fetch real balances from wallet
  const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const BASE_MAINNET_CHAIN_ID = 8453;

const fetchRealBalances = async (walletAddress: string) => {
  let filteredCoins: any[] = [];

  console.log('[DEBUG] fetchRealBalances called', { walletAddress, connector });
  try {
    setIsLoading(true);
    let provider;
    // Always use window.ethereum for both MetaMask and Coinbase Wallet
    // Using connector.getProvider() for Coinbase Wallet is unreliable for ethers.js
    // See: https://github.com/coinbase/coinbase-wallet-sdk/issues/119
    if (typeof window !== 'undefined' && window.ethereum) {
      provider = new ethers.providers.Web3Provider(window.ethereum);
      console.log('[DEBUG] Using window.ethereum as provider', provider);
      // Check network
      const network = await provider.getNetwork();
      if (network.chainId !== BASE_MAINNET_CHAIN_ID) {
        setNetworkWarning(true);
        setIsLoading(false);
        filteredCoins = [];
        return;
      } else {
        setNetworkWarning(false);
        filteredCoins = stablecoins.filter((coin: any) => coin.chainId === network.chainId);
      }
    } else {
      console.error('[DEBUG] No wallet provider found');
      throw new Error('No wallet provider found');
    }
    const realBalances: Record<string, string> = {};
    let anyError = false;
    const tokenErrors: Record<string, string> = {};
    // Only fetch balances for tokens on the current network
    for (const coin of filteredCoins) {
      try {
        console.log(`[DEBUG] Fetching balance for coin`, { coin, walletAddress });
        const tokenContract = new ethers.Contract(coin.address, ERC20_ABI, provider);
        let balance = '0';
        let decimals = 18;
        try {
          [balance, decimals] = await Promise.all([
            tokenContract.balanceOf(walletAddress),
            tokenContract.decimals()
          ]);
        } catch (tokenErr: any) {
          // Suppress error, log for debugging only
          console.warn(`[WARN] Could not fetch balance/decimals for ${coin.baseToken}:`, tokenErr?.message);
          tokenErrors[coin.baseToken] = tokenErr?.message || 'Error fetching balance';
          anyError = true;
        }
        let formatted = '0';
        try {
          formatted = ethers.utils.formatUnits(balance, decimals);
        } catch {}
        realBalances[coin.baseToken] = parseFloat(formatted).toLocaleString();
        if (!tokenErrors[coin.baseToken]) {
          console.log(`[DEBUG] Balance fetched`, { coin: coin.baseToken, formatted });
        }
      } catch (err: any) {
        // Suppress error, do not propagate
      }
    }
    setBalanceError(anyError);
    setErrorTokens(tokenErrors);
    setBalances(realBalances);
    // Also fetch transactions
    setIsTransactionLoading(true);
    // ...existing transaction code...
  } catch (error) {
    console.error('Error fetching balances:', error);
  } finally {
    setIsTransactionLoading(false);
    setIsLoading(false);
  }
};

  if (!mounted) return null;

  // Ensure Toaster is rendered for toast notifications
  // (should be near the root of your component tree)
    
  return (
    <>
      <Toaster position="top-right" />
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-white dark:bg-gray-900 dark:text-white">
      <Header />
      {/* Wallet Switcher */}
      <div className="flex gap-4 mb-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          className={`px-4 py-2 rounded-lg border font-semibold ${selectedWalletType === 'eoa' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
          onClick={() => setSelectedWalletType('eoa')}
        >
          EOA Wallet
        </button>
        <button
          className={`px-4 py-2 rounded-lg border font-semibold ${selectedWalletType === 'smart' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
          onClick={() => setSelectedWalletType('smart')}
        >
          Smart Wallet
        </button>
      </div>
      <div className="my-4">
        <button onClick={() => window.history.back()} className="flex items-center gap-2 px-3 py-1 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium">
          <span aria-hidden="true">←</span> Back
        </button>
      </div>
      {networkWarning && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative m-4">
          <strong className="font-bold">Network Error:</strong>
          <span className="block sm:inline"> Please switch your wallet to <b>Base Mainnet</b> (chainId 8453) to view your balances.</span>
        </div>
      )}
      {/* No generic warning, handled per-token below */}
      <div className="flex-grow">
        <div className="container mx-auto max-w-6xl px-4 py-12">
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-2 text-slate-800 dark:text-slate-100">
                  Merchant Dashboard
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-base">
                  Manage your stablecoin payments and track business performance
                </p>
              </div>
              {isTransactionLoading && (
                <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-lg">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  <span className="text-sm text-blue-600 dark:text-blue-300">Loading data...</span>
                </div>
              )}
            </div>
            
            {/* Welcome Message with Animation */}
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-lg shadow-lg transform transition-all duration-500 hover:scale-102 hover:shadow-xl">
              <div className="flex items-start">
                <div className="flex-1">
                  <h2 className="text-white text-xl font-bold mb-2 animate-fadeIn">
                    {(() => {
                      const hour = new Date().getHours();
                      if (hour < 12) return '☀️ Good Morning';
                      if (hour < 18) return '🌤️ Good Afternoon';
                      return '🌙 Good Evening';
                    })()} {selectedWalletAddress ? (
                      <span className="inline-flex items-center">
                        <Name 
                          address={selectedWalletAddress as `0x${string}`} 
                          chain={base as any}
                        />
                        !
                      </span>
                    ) : 'Merchant'}!
                  </h2>
                  <p className="text-white text-opacity-90 animate-fadeIn animation-delay-200">
                    {(() => {
                      const messages = [
                        "Today is a great day to grow your business with NEDA Pay!",
                        "Your dashboard is looking great! Ready to accept more payments?",
                        "Crypto payments made simple - that's the NEDA Pay promise!",
                        "Need help? We're just a click away to support your business journey.",
                        "Your success is our success. Let's make today count!"
                      ];
                      return messages[Math.floor(Math.random() * messages.length)];
                    })()}
                  </p>
                  <div className="mt-3 flex space-x-3 animate-fadeIn animation-delay-300">
                    <button 
                      onClick={() => router.push('/payment-link')}
                      className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-md text-sm font-medium transition-all duration-200">
                      Create Payment Link
                    </button>
                    <button 
                      onClick={() => router.push('/settings')}
                      className="px-4 py-2 bg-white bg-opacity-10 hover:bg-opacity-20 text-white rounded-md text-sm font-medium transition-all duration-200">
                      Customize Dashboard
                    </button>
                  </div>
                </div>
                <div className="hidden md:block animate-pulse">
                  <div className="w-16 h-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                    <span className="text-3xl">💰</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Smart Wallet Info */}
          <div className="bg-primary dark:bg-primary-dark border border-primary-light dark:border-blue-800 rounded-xl p-6 mb-8">
  <h2 className="text-xl font-semibold text-white mb-2">
    {selectedWalletType === 'smart' ? 'Smart Wallet Connected' : 'EOA Wallet Connected'}
  </h2>
  <p className="text-white mb-4">
    {selectedWalletType === 'smart'
      ? "You're using a smart wallet for enhanced security and lower fees"
      : "You're using your externally owned account (EOA) wallet"}
  </p>
  <div className="flex items-center space-x-2">
    <div className="text-sm font-medium text-white">
      {selectedWalletType === 'smart' ? 'Smart Wallet Address:' : 'EOA Wallet Address:'}
    </div>
    <div className="text-sm text-white/90">
      {selectedWalletType === 'smart' && smartWalletLoading && (
  <span>Loading smart wallet address...</span>
)}
{selectedWalletType === 'smart' && !smartWalletLoading && (!smartWalletAddress || smartWalletAddress === address) && (
  <span className="text-yellow-200">Smart wallet address not found. Please create or connect your smart wallet.</span>
)}
{selectedWalletType === 'smart' && !smartWalletLoading && smartWalletAddress && smartWalletAddress !== address && (
  <span className="inline-flex items-center gap-2">
    {`${smartWalletAddress.substring(0, 10)}...${smartWalletAddress.substring(smartWalletAddress.length - 8)}`}
    <button
      className="ml-1 px-2 py-0.5 rounded bg-slate-600 text-xs text-white hover:bg-slate-800 focus:outline-none"
      onClick={() => {
        navigator.clipboard.writeText(smartWalletAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      title="Copy address"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  </span>
)}
{selectedWalletType !== 'smart' && selectedWalletAddress && (
  <span className="inline-flex items-center gap-2">
    {`${selectedWalletAddress.substring(0, 10)}...${selectedWalletAddress.substring(selectedWalletAddress.length - 8)}`}
    <button
      className="ml-1 px-2 py-0.5 rounded bg-slate-600 text-xs text-white hover:bg-slate-800 focus:outline-none"
      onClick={() => {
        navigator.clipboard.writeText(selectedWalletAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      title="Copy address"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  </span>
)}
{selectedWalletType !== 'smart' && !selectedWalletAddress && 'Not Connected'}
    </div>
  </div>
</div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
              <div className="text-sm text-slate-700 dark:text-slate-300 mb-1 font-semibold">Total Received</div>
              <div className="flex flex-col gap-1 text-2xl font-bold text-slate-900 dark:text-white">
                {(() => {
                  const processed = processBalances(balances).processedBalances;
                  const nonZero = processed.filter(c => parseFloat(c.balance.replace(/,/g, '')) > 0);
                  if (!nonZero.length) return '0';
                  return nonZero.map(c => (
                    <div key={c.symbol} className="flex items-center gap-2">
                      <span>{c.flag}</span>
                      <span className="font-semibold">{c.balance}</span>
                      <span className="ml-1">{c.symbol}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
              <div className="text-sm text-slate-700 dark:text-slate-300 mb-1 font-semibold">Total Transactions</div>
              <div className="flex flex-col gap-1 text-2xl font-bold text-slate-900 dark:text-white">
                {(() => {
                  // Group transactions by currency
                  const grouped: Record<string, { count: number, flag: string }> = {};
                  transactions.forEach(tx => {
                    const symbol = tx.currency;
                    if (!grouped[symbol]) {
                      // Find the flag from stablecoins
                      const coin = stablecoins.find(c => c.baseToken === symbol);
                      grouped[symbol] = { count: 0, flag: coin?.flag || '🌐' };
                    }
                    grouped[symbol].count++;
                  });
                  const entries = Object.entries(grouped).filter(([sym, data]) => data.count > 0);
                  if (!entries.length) return '0';
                  return entries.map(([symbol, data]) => (
                    <div key={symbol} className="flex items-center gap-2">
                      <span>{data.flag}</span>
                      <span className="font-semibold">{data.count.toLocaleString()}</span>
                      <span className="ml-1">{symbol}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
              <div className="text-sm text-slate-700 dark:text-slate-300 mb-1 font-semibold">Average Transaction</div>
              <div className="flex flex-col gap-1 text-2xl font-bold text-slate-900 dark:text-white">
                {(() => {
                  // Group transactions by currency
                  const grouped: Record<string, { sum: number, count: number, flag: string }> = {};
                  transactions.forEach(tx => {
                    const symbol = tx.currency;
                    if (!grouped[symbol]) {
                      // Find the flag from stablecoins
                      const coin = stablecoins.find(c => c.baseToken === symbol);
                      grouped[symbol] = { sum: 0, count: 0, flag: coin?.flag || '🌐' };
                    }
                    grouped[symbol].sum += parseFloat((tx.amount || '0').replace(/,/g, '')) || 0;
                    grouped[symbol].count++;
                  });
                  const entries = Object.entries(grouped).filter(([sym, data]) => data.count > 0);
                  if (!entries.length) return '0';
                  return entries.map(([symbol, data]) => (
                    <div key={symbol} className="flex items-center gap-2">
                      <span>{data.flag}</span>
                      <span className="font-semibold">{Math.round(data.sum / data.count).toLocaleString()}</span>
                      <span className="ml-1">{symbol}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
              <div className="text-sm text-slate-700 dark:text-slate-300 mb-1 font-semibold">Monthly Growth</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {(() => {
                  // Compute monthly growth based on real transactions
                  const now = new Date();
                  const thisMonth = now.getMonth();
                  const thisYear = now.getFullYear();
                  // Previous month (handle January)
                  const prevMonth = thisMonth === 0 ? 11 : thisMonth - 1;
                  const prevYear = thisMonth === 0 ? thisYear - 1 : thisYear;
                  // Sum revenue for this and previous month
                  let thisMonthSum = 0;
                  let prevMonthSum = 0;
                  transactions.forEach(tx => {
                    const txDate = new Date(tx.date);
                    const amt = parseFloat((tx.amount || '0').replace(/,/g, '')) || 0;
                    if (txDate.getFullYear() === thisYear && txDate.getMonth() === thisMonth) {
                      thisMonthSum += amt;
                    } else if (txDate.getFullYear() === prevYear && txDate.getMonth() === prevMonth) {
                      prevMonthSum += amt;
                    }
                  });
                  if (prevMonthSum === 0 && thisMonthSum === 0) return 'N/A';
                  if (prevMonthSum === 0) return '+100%'; // All new growth
                  const growth = ((thisMonthSum - prevMonthSum) / prevMonthSum) * 100;
                  const sign = growth >= 0 ? '+' : '';
                  return `${sign}${growth.toFixed(1)}%`;
                })()}
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
              <div className="text-sm text-slate-700 dark:text-slate-300 mb-1 font-semibold">Payment Methods</div>
              <div className="flex flex-col gap-1 text-2xl font-bold text-slate-900 dark:text-white">
                {(() => {
                  // List payment methods (stablecoins with nonzero transactions)
                  const usedSymbols = Array.from(new Set(transactions.map(tx => tx.currency)));
                  if (!usedSymbols.length) return 'None';
                  return usedSymbols.map(symbol => {
                    const coin = stablecoins.find(c => c.baseToken === symbol);
                    return (
                      <div key={symbol} className="flex items-center gap-2">
                        <span>{coin?.flag || '🌐'}</span>
                        <span className="font-semibold">{symbol}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Daily Revenue Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Daily Revenue</h3>
                <select 
                  className="border rounded px-2 py-1 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white" 
                  value={selectedCurrency} 
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                >
                  <option value="all" className="text-slate-800 dark:text-white">All Currencies</option>
                  {stablecoins.map(coin => (
                    <option key={coin.baseToken} value={coin.baseToken} className="text-slate-800 dark:text-white">{coin.flag} {coin.baseToken}</option>
                  ))}
                </select>
              </div>
              <div className="h-64">
                <Line
  data={getMultiStablecoinDailyRevenueData(selectedCurrency === 'all' ? transactions : transactions.filter(tx => tx.currency === selectedCurrency))}
  options={{
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(156, 163, 175, 0.1)'
        },
        ticks: {
          color:
            typeof window !== 'undefined' &&
            window.matchMedia &&
            window.matchMedia('(prefers-color-scheme: dark)').matches
              ? '#9ca3af'
              : '#4b5563',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color:
            typeof window !== 'undefined' &&
            window.matchMedia &&
            window.matchMedia('(prefers-color-scheme: dark)').matches
              ? '#9ca3af'
              : '#4b5563',
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color:
            typeof window !== 'undefined' &&
            window.matchMedia &&
            window.matchMedia('(prefers-color-scheme: dark)').matches
              ? '#ffffff'
              : '#222222',
          usePointStyle: true, // Enable colored boxes to match line colors
          boxWidth: 15,
          boxHeight: 15,
          padding: 15,
          generateLabels: (chart) => {
            // Custom legend: show flag and currency code
            const { datasets } = chart.data;
            if (!datasets || !datasets.length) return [];
            return datasets.map((ds, i) => {
              // Expect label to be in the format: `${flag} ${symbol}`
              const labelString = ds.label || '';
              // Split into flag and code
              const match = labelString.match(/^(\S+)\s+(.+)$/);
              let flag = '', code = '';
              if (match) {
                flag = match[1];
                code = match[2];
              } else {
                code = labelString;
              }
              return {
  text: `${flag} ${code}`.trim(),
  hidden: chart.isDatasetVisible(i) === false,
  index: i,
};
            });
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            // Show value with currency symbol in tooltip
            const ds = context.dataset;
            const label = ds.label || '';
            const match = label.match(/^(\S+)\s+(.+)$/);
            let flag = '', code = '';
            if (match) {
              flag = match[1];
              code = match[2];
            } else {
              code = label;
            }
            return `${flag} ${code}: ${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
  }}
/>
              </div>
            </div>
            
            {/* Payment Methods Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Methods</h3>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="border rounded px-2 py-1 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                >
                  <option value="all" className="text-slate-800 dark:text-white">All Currencies</option>
                  {stablecoins.map(coin => (
                    <option key={coin.baseToken} value={coin.baseToken} className="text-slate-800 dark:text-white">
                      {coin.flag} {coin.baseToken}
                    </option>
                  ))}
                </select>
              </div>
              <div className="h-64">
                <Doughnut 
                  data={getPaymentMethodsData(selectedCurrency === 'all' ? transactions : transactions.filter(tx => tx.currency === selectedCurrency))} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          color: typeof window !== 'undefined' && 
                                window.matchMedia && 
                                window.matchMedia('(prefers-color-scheme: dark)').matches ? 
                                '#9ca3af' : '#4b5563',
                          padding: 20,
                          font: {
                            size: 12
                          }
                        }
                      }
                    }
                  }} 
                />
              </div>
            </div>
          </div>
          
          {/* Transactions and Balances */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Recent Transactions */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 transform hover:shadow-xl">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Recent Transactions
                  </h3>
                  <select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    className="border rounded px-2 py-1 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                  >
                    <option value="all" className="text-slate-800 dark:text-white">All Currencies</option>
                    {stablecoins.map(coin => (
                      <option key={coin.baseToken} value={coin.baseToken} className="text-slate-800 dark:text-white">
                        {coin.flag} {coin.baseToken}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Tx Hash</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Sender</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {isTransactionLoading ? (
                      // Loading skeleton for transactions with shimmer effect
                      Array(5).fill(0).map((_, index) => (
                        <tr key={`loading-${index}`} className="animate-pulse">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded relative overflow-hidden">
                              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded relative overflow-hidden">
                              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded relative overflow-hidden">
                              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded relative overflow-hidden">
                              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded relative overflow-hidden">
                              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (selectedCurrency === 'all' ? transactions : transactions.filter(tx => tx.currency === selectedCurrency)).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex flex-col items-center justify-center space-y-3">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p>No transactions found</p>
                            <button 
                              onClick={() => router.push('/payment-link')} 
                              className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              Create Payment Link
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      (selectedCurrency === 'all' ? transactions : transactions.filter(tx => tx.currency === selectedCurrency)).map((tx, index) => (
                        <tr 
                          key={tx.id} 
                          className={`hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-slate-50 dark:bg-gray-750'}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <a 
                              href={tx.blockExplorerUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium flex items-center"
                            >
                              <span className="mr-1.5 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 py-1 px-2 rounded-md">
                                <svg className="w-3 h-3 inline mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Tx
                              </span>
                              {tx.shortId}
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <a 
                              href={`https://basescan.org/address/${tx.sender}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium flex items-center"
                            >
                              <span className="inline-block w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 mr-2 flex items-center justify-center text-xs">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </span>
                              {tx.senderShort}
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-slate-800 dark:text-slate-200">
                              <svg className="w-4 h-4 text-slate-500 dark:text-slate-400 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {tx.date}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium">
                              <span className="text-green-600 dark:text-green-400 font-bold">{tx.amount}</span>
                              <span className="ml-1.5 text-xs px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                                {tx.currency}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1.5 inline-flex items-center text-xs font-medium rounded-full ${
                              tx.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800' : 
                              tx.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800' : 
                              'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'
                            }`}>
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                {tx.status === 'Completed' ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                ) : tx.status === 'Pending' ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                ) : (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                )}
                              </svg>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/20 dark:to-purple-900/20">
                <div className="flex justify-center mt-2">
                  <a 
                    href="/transactions" 
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/30 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-800/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    View All Transactions
                  </a>
                </div>
              </div>
            </div>
            
            {/* --- Custom Stablecoin Balances Table --- */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 transform hover:shadow-xl">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Stablecoin Balances
                </h2>
              </div>
              
              <div className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Coin</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Balance</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {processedBalances.map((coin, index) => {
                        const balanceNum = parseFloat(String(coin.balance).replace(/,/g, ''));
                        const hasBalance = balanceNum > 0;
                        
                        return (
                          <tr 
                            key={coin.symbol} 
                            className={`hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-lg">
                                  {coin.flag}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">{coin.symbol}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">{coin.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`text-sm font-semibold ${hasBalance ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                {coin.balance}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {/* Identical Swap button for all coins */}
                              <button
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm bg-blue-500 text-white hover:bg-blue-600 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                onClick={() => hasBalance && handleSwapClick(coin.symbol)}
                                disabled={!hasBalance}
                                title={hasBalance ? `Swap ${coin.symbol}` : `No ${coin.symbol} balance to swap`}
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                                Swap
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            {/* --- Swap Modal --- */}
            <SwapModal
              open={swapModalOpen}
              fromSymbol={swapFromSymbol}
              onClose={() => setSwapModalOpen(false)}
              onSwap={handleSwap}
              maxAmount={
                processedBalances.find((b: any) => b.symbol === swapFromSymbol)?.balance || '0'
              }
            />
          </div>
          
          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Quick Actions</h3>
            
            <div className="space-y-4">
              <button 
                onClick={() => {
  document.cookie = 'wallet_connected=true; path=/; max-age=86400';
  setTimeout(() => {
    window.location.href = '/payment-link';
  }, 100);
}} 
                className="p-4 w-full bg-gray-100 dark:bg-blue-900/30 rounded-lg border border-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
              >
                <h3 className="font-bold text-blue-900 dark:text-blue-300">Create Payment Link</h3>
                <p className="text-sm text-blue-900 dark:text-blue-400 mt-1 font-medium">Generate a payment link to share with customers</p>
              </button>

              <button 
                onClick={() => router.push('/invoice')} 
                className="p-4 w-full bg-gray-100 dark:bg-green-900/30 rounded-lg border border-green-300 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/50 transition"
              >
                <h3 className="font-bold text-green-900 dark:text-green-300">Generate Invoice</h3>
                <p className="text-sm text-green-900 dark:text-green-400 mt-1 font-medium">Send an invoice to your customer for payment</p>
              </button>

              <button 
                onClick={() => router.push('/analytics')} 
                className="p-4 w-full bg-gray-100 dark:bg-purple-900/30 rounded-lg border border-purple-300 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition"
              >
                <h3 className="font-bold text-purple-900 dark:text-purple-300">View Analytics</h3>
                <p className="text-sm text-purple-900 dark:text-purple-400 mt-1 font-medium">Detailed reports and business insights</p>
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
    </>
  );
}
