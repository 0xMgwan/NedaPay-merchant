'use client';

import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { processBalances, fetchIncomingPayments, getPaymentMethodsData } from './analyticsUtils';
import { stablecoins } from '../data/stablecoins';
import { ethers } from 'ethers';


// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

import CurrencyFilter from './CurrencyFilter';
import { exportTransactionsToCSV } from './ExportCSV';

export default function AnalyticsContent() {
  const [dateRange, setDateRange] = useState('7d');
  const { address, isConnected } = useAccount();
  const router = useRouter();

  // Check if wallet is connected using useEffect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const walletConnected = localStorage.getItem('walletConnected') === 'true';
      const cookieWalletConnected = document.cookie.includes('wallet_connected=true');
      
      if (!isConnected && !walletConnected && !cookieWalletConnected) {
        router.push('/?walletRequired=true');
      }
    }
  }, [isConnected, router]);

  // --- Real Data State ---
const [balances, setBalances] = useState<Record<string, string>>({});
const [transactions, setTransactions] = useState<any[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [isTransactionLoading, setIsTransactionLoading] = useState(false);
const [selectedCurrency, setSelectedCurrency] = useState<string>('');
// useAccount already declared above, so just use address and isConnected from there

// Fetch real balances and transactions
useEffect(() => {
  async function fetchData() {
    if (!address) return;
    setIsLoading(true);
    setIsTransactionLoading(true);
    // Fetch balances
    const { getProvider } = await import('../utils/rpcProvider');
    const provider = await getProvider();
    const ERC20_ABI = [
      'function balanceOf(address owner) view returns (uint256)',
      'function decimals() view returns (uint8)'
    ];
    const balancesObj: Record<string, string> = {};
    for (const coin of stablecoins.filter((c) => c.chainId === 8453 && c.address)) {
      try {
        const contract = new ethers.Contract(coin.address, ERC20_ABI, provider);
        const bal = await contract.balanceOf(address);
        const decimals = await contract.decimals();
        balancesObj[coin.baseToken] = ethers.utils.formatUnits(bal, decimals);
      } catch (e) {
        balancesObj[coin.baseToken] = '0';
      }
    }
    setBalances(balancesObj);
    // Fetch transactions
    const txs = await fetchIncomingPayments(address);
    setTransactions(txs);
    setIsLoading(false);
    setIsTransactionLoading(false);
  }
  if (isConnected && address) fetchData();
}, [isConnected, address]);

// --- Derived & Filtered Data ---
const now = new Date();
const getDateThreshold = () => {
  if (dateRange === '7d') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (dateRange === '30d') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (dateRange === '90d') return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  return new Date(0);
};
const dateThreshold = getDateThreshold();
const filteredTxs = transactions.filter(tx => {
  const txDate = new Date(tx.date);
  const currencyMatch = !selectedCurrency || tx.currency === selectedCurrency;
  return txDate >= dateThreshold && currencyMatch;
});
const filteredBalances = selectedCurrency
  ? Object.fromEntries(Object.entries(balances).filter(([k]) => k === selectedCurrency))
  : balances;
const { processedBalances, totalReceived, processedStablecoins } = processBalances(filteredBalances);
const revenueData = {
  labels: filteredTxs.map(tx => tx.date),
  datasets: [{
    label: 'Revenue',
    data: filteredTxs.map(tx => Number(tx.amount)),
    borderColor: 'rgb(59, 130, 246)',
    backgroundColor: 'rgba(59, 130, 246, 0.5)',
    tension: 0.3,
  }],
};
const transactionsData = {
  labels: filteredTxs.map(tx => tx.date),
  datasets: [{
    label: 'Transactions',
    data: filteredTxs.map(() => 1),
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    borderRadius: 6,
  }],
};
const currencyDistributionData = getPaymentMethodsData(filteredBalances);


  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#111', // Always black for visibility
          font: { size: 14, weight: 'bold' as const },
        },
      },
      tooltip: {
        titleColor: '#111',
        bodyColor: '#111',
        footerColor: '#111',
        backgroundColor: '#fff',
        borderColor: '#111',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#111',
          font: { size: 13, weight: 'bold' as const },
        },
        grid: {
          color: '#eee',
        },
      },
      y: {
        ticks: {
          color: '#111',
          font: { size: 13, weight: 'bold' as const },
        },
        grid: {
          color: '#eee',
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#111',
          font: { size: 14, weight: 'bold' as const },
        },
      },
      tooltip: {
        titleColor: '#111',
        bodyColor: '#111',
        footerColor: '#111',
        backgroundColor: '#fff',
        borderColor: '#111',
        borderWidth: 1,
      },
    },
  };


  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-white dark:bg-gray-900 dark:text-white">
      <Header />
      <div className="flex-grow">
      
      <div className="container mx-auto max-w-6xl px-4 py-12">
  {/* Controls */}
  <div className="flex flex-wrap gap-4 items-center mb-8">
    <CurrencyFilter
      currencies={[...new Set(transactions.map(tx => tx.currency))].filter(Boolean)}
      selected={selectedCurrency}
      onChange={setSelectedCurrency}
    />
    <button
      className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
      onClick={() => exportTransactionsToCSV(filteredTxs)}
      disabled={filteredTxs.length === 0}
    >
      Export CSV
    </button>
  </div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-slate-800 dark:text-slate-100">
            Analytics
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-base">
            Detailed reports and business insights
          </p>
        </div>
        
        {/* Date range selector */}
        <div className="mb-8">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setDateRange('7d')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                dateRange === '7d'
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              } border border-slate-200 dark:border-slate-600`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => setDateRange('30d')}
              className={`px-4 py-2 text-sm font-medium ${
                dateRange === '30d'
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              } border-t border-b border-slate-200 dark:border-slate-600`}
            >
              30 Days
            </button>
            <button
              type="button"
              onClick={() => setDateRange('90d')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                dateRange === '90d'
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              } border border-slate-200 dark:border-slate-600`}
            >
              90 Days
            </button>
          </div>
        </div>
        
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Total Revenue</h3>
            {(() => {
  if (!transactions.length) return <p className="text-3xl font-bold text-primary">0</p>;
  // Group by currency
  const sums: Record<string, number> = {};
  transactions.forEach(tx => {
    const amt = parseFloat((tx.amount || '0').replace(/,/g, '')) || 0;
    sums[tx.currency] = (sums[tx.currency] || 0) + amt;
  });
  const entries = Object.entries(sums);
  if (entries.length === 1) {
    const [currency, sum] = entries[0];
    return <p className="text-3xl font-bold text-primary">{sum.toLocaleString()} {currency}</p>;
  }
  // Multi-currency breakdown
  return (
    <div>
      {entries.map(([currency, sum]) => (
        <div key={currency} className="text-sm text-primary font-semibold">
          {sum.toLocaleString()} {currency}
        </div>
      ))}
    </div>
  );
})()}
            <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586l3.293-3.293A1 1 0 0112 7z" clipRule="evenodd" />
              </svg>
              +12.5% from last period
            </p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Transactions</h3>
            {(() => {
  // Show total number of transactions
  return <p className="text-3xl font-bold text-primary">{transactions.length}</p>;
})()}
            <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586l3.293-3.293A1 1 0 0112 7z" clipRule="evenodd" />
              </svg>
              +8.2% from last period
            </p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Average Transaction</h3>
            {(() => {
  if (!transactions.length) return <p className="text-3xl font-bold text-primary">0</p>;
  // Group by currency
  const sums: Record<string, { sum: number, count: number }> = {};
  transactions.forEach(tx => {
    const amt = parseFloat((tx.amount || '0').replace(/,/g, '')) || 0;
    if (!sums[tx.currency]) sums[tx.currency] = { sum: 0, count: 0 };
    sums[tx.currency].sum += amt;
    sums[tx.currency].count += 1;
  });
  const entries = Object.entries(sums);
  if (entries.length === 1) {
    const [currency, { sum, count }] = entries[0];
    return <p className="text-3xl font-bold text-primary">{(sum / count).toLocaleString(undefined, { maximumFractionDigits: 2 })} {currency}</p>;
  }
  // Multi-currency breakdown
  return (
    <div>
      {entries.map(([currency, { sum, count }]) => (
        <div key={currency} className="text-sm text-primary font-semibold">
          {(sum / count).toLocaleString(undefined, { maximumFractionDigits: 2 })} {currency}
        </div>
      ))}
    </div>
  );
})()}
            <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586l3.293-3.293A1 1 0 0112 7z" clipRule="evenodd" />
              </svg>
              +4.1% from last period
            </p>
          </div>
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Revenue Over Time</h3>
            <div className="h-64">
              <Line data={revenueData} options={chartOptions} />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Transactions Per Day</h3>
            <div className="h-64">
              <Bar data={transactionsData} options={chartOptions} />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Currency Distribution</h3>
            <div className="h-64">
              <Doughnut data={currencyDistributionData} options={doughnutOptions} />
            </div>
          </div>
          
          <div className="col-span-1 md:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Filtered Transactions</h3>
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
      <thead className="bg-slate-50 dark:bg-slate-700">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Date</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Amount</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Currency</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Status</th>
        </tr>
      </thead>
      <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
        {filteredTxs.length === 0 ? (
          <tr>
            <td colSpan={4} className="px-6 py-4 text-center text-slate-500 dark:text-slate-300">No transactions found</td>
          </tr>
        ) : (
          filteredTxs.map((tx, idx) => (
            <tr key={tx.id || idx}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">{tx.date}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">{tx.amount}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">{tx.currency}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  {tx.status}
                </span>
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
    </div>
  );
}
