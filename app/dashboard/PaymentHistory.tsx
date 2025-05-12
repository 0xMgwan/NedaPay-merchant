'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { getWalletPaymentTransactions, addMockPaymentData, PaymentTransaction } from '../utils/paymentStorage';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export default function PaymentHistory() {
  const { address } = useAccount();
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch payment transactions for the connected wallet
  const fetchPayments = async () => {
    if (!address) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Get payment transactions from local storage
      let paymentTxs = getWalletPaymentTransactions(address);
      
      // Add mock data if no payments exist (for demo purposes)
      if (paymentTxs.length === 0) {
        addMockPaymentData(address);
        paymentTxs = getWalletPaymentTransactions(address);
        toast.success('Demo payment data loaded successfully!');
      }
      
      // Sort payments by timestamp (newest first)
      const sortedPayments = paymentTxs.sort((a, b) => 
        b.timestamp - a.timestamp
      );
      
      setPayments(sortedPayments);
    } catch (err) {
      console.error('Error fetching payment transactions:', err);
      toast.error('Failed to load payment history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchPayments();
  }, [address]);

  // Listen for localStorage changes to update payments in real time
  useEffect(() => {
    if (!address) return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === 'neda_pay_payment_transactions') {
        fetchPayments();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [address]);

  // Refresh payments every 30 seconds
  useEffect(() => {
    if (!address) return;
    
    const interval = setInterval(() => {
      fetchPayments();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [address]);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex space-x-4 mb-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Payment History</h3>
        <div className="flex flex-col items-center justify-center py-8">
          <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 mb-4">No payment transactions found</p>
          <button
            onClick={fetchPayments}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment History</h3>
        <button
          onClick={fetchPayments}
          className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Transaction</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sender/Recipient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {payments.map((payment) => {
              const isIncoming = payment.recipient.toLowerCase() === address?.toLowerCase();
              return (
                <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a
                      href={`https://basescan.org/tx/${payment.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {payment.txHash.substring(0, 8)}...{payment.txHash.substring(payment.txHash.length - 6)}
                    </a>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{payment.description || 'Payment transaction'}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`font-medium ${isIncoming ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {isIncoming ? '+' : '-'}{payment.amount} {payment.currency}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {isIncoming ? 'From:' : 'To:'}
                    </div>
                    <a
                      href={`https://basescan.org/address/${isIncoming ? payment.sender : payment.recipient}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {isIncoming 
                        ? `${payment.sender.substring(0, 6)}...${payment.sender.substring(payment.sender.length - 4)}`
                        : `${payment.recipient.substring(0, 6)}...${payment.recipient.substring(payment.recipient.length - 4)}`
                      }
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(payment.timestamp), { addSuffix: true })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${payment.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 
                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' : 
                        'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'}`}>
                      {payment.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}