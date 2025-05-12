import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { getWalletTransactions, SwapTransaction } from '../utils/transactionStorage';
import { formatDistanceToNow } from 'date-fns';

export default function TransactionHistory() {
  const { address } = useAccount();
  const [transactions, setTransactions] = useState<SwapTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (address) {
      const walletTxs = getWalletTransactions(address);
      setTransactions(walletTxs);
    } else {
      setTransactions([]);
    }
    setIsLoading(false);
  }, [address]);

  // Listen for localStorage changes to update swap transactions in real time
  useEffect(() => {
    if (!address) return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === 'neda_pay_swap_transactions') {
        const walletTxs = getWalletTransactions(address);
        setTransactions(walletTxs);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [address]);

  // Refresh transactions every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (address) {
        const walletTxs = getWalletTransactions(address);
        setTransactions(walletTxs);
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [address]);

  if (isLoading) return <div>Loading transaction history...</div>;
  
  if (!address) return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
      <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
      <p className="text-gray-500 dark:text-gray-400">Connect your wallet to view transaction history</p>
    </div>
  );

  if (transactions.length === 0) return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
      <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
      <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
      <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                From
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                To
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Tx Hash
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  Swap
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {tx.fromAmount} {tx.fromToken}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {tx.toAmount} {tx.toToken}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    tx.status === 'completed' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                      : tx.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                        : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                  }`}>
                    {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {tx.txHash ? (
                    <a 
                      href={`https://basescan.org/tx/${tx.txHash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {tx.txHash.substring(0, 6)}...{tx.txHash.substring(tx.txHash.length - 4)}
                    </a>
                  ) : (
                    'N/A'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
