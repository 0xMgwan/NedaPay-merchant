'use client';

import { useState, useEffect, useRef } from 'react';
import { useOnchainKit } from '@coinbase/onchainkit';
import Header from '../components/Header';
import { stablecoins, mockTransactions } from '../data/stablecoins';

// Process payment history data
const mockPaymentHistory = mockTransactions.map(tx => {
  return {
    id: tx.id,
    date: tx.date,
    amount: tx.amount,
    currency: tx.currency,
    status: tx.status,
    customer: tx.customer,
    description: `Payment from ${tx.customer}`
  };
});


export default function PaymentsPage() {
  const [mounted, setMounted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [activeTab, setActiveTab] = useState('create'); // 'create', 'history'
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentCurrency, setPaymentCurrency] = useState('TSHC');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [paymentLink, setPaymentLink] = useState('');
  const [showQR, setShowQR] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  
  // Get wallet connection status from OnchainKit
  const { address } = useOnchainKit();
  
  useEffect(() => {
    setMounted(true);
    
    if (address) {
      setAccount(address);
      setIsConnected(true);
    }
    
    // Check if already connected to MetaMask
    if (typeof window !== 'undefined') {
      const ethereum = (window as any).ethereum;
      if (ethereum && ethereum.isMetaMask) {
        ethereum.request({ method: 'eth_accounts' })
          .then((accounts: string[]) => {
            if (accounts.length > 0 && !isConnected) {
              setAccount(accounts[0]);
              setIsConnected(true);
            }
          })
          .catch(console.error);
      }
    }
  }, [address, isConnected]);

  const generatePaymentLink = () => {
    if (!paymentAmount || !paymentCurrency) return;
    
    // In a real app, this would call the backend to generate a proper payment link
    const mockPaymentId = 'PAY-' + Math.floor(Math.random() * 10000000);
    const baseUrl = 'https://nedapay.app/pay';
    const link = `${baseUrl}?id=${mockPaymentId}&amount=${paymentAmount}&currency=${paymentCurrency}&description=${encodeURIComponent(paymentDescription || 'Payment')}`;
    
    setPaymentLink(link);
    setShowQR(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(paymentLink);
    alert('Payment link copied to clipboard!');
  };

  if (!mounted) return null;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:bg-gray-900 dark:text-white">
      <Header />
      
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 gradient-text">
            Payments
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Create and manage payment links for your business
          </p>
        </div>

        {/* Wallet Connection Prompt */}
        {!isConnected && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8 text-center">
            <h2 className="text-xl font-semibold text-blue-700 dark:text-blue-300 mb-2">Connect Your Wallet</h2>
            <p className="text-blue-600 dark:text-blue-400 mb-4">Connect your wallet to create payment links and view payment history</p>
          </div>
        )}

        {isConnected && (
          <>
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-8">
              <button
                className={`py-3 px-6 ${activeTab === 'create' 
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('create')}
              >
                Create Payment
              </button>
              <button
                className={`py-3 px-6 ${activeTab === 'history' 
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('history')}
              >
                Payment History
              </button>
            </div>

            {/* Create Payment */}
            {activeTab === 'create' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Payment Form */}
                <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Create Payment Link</h2>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Generate a payment link to share with your customers
                    </p>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 mb-2">Amount</label>
                        <div className="flex">
                          <input
                            type="text"
                            className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                            placeholder="0.00"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                          />
                          <select
                            className="p-2 border border-gray-300 dark:border-gray-600 border-l-0 rounded-r-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                            value={paymentCurrency}
                            onChange={(e) => setPaymentCurrency(e.target.value)}
                          >
                            {stablecoins.map((coin) => (
                              <option key={coin.baseToken} value={coin.baseToken}>
                                {coin.baseToken}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 mb-2">Description (Optional)</label>
                        <input
                          type="text"
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                          placeholder="What's this payment for?"
                          value={paymentDescription}
                          onChange={(e) => setPaymentDescription(e.target.value)}
                        />
                      </div>
                      
                      <div className="pt-4">
                        <button
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
                          onClick={generatePaymentLink}
                          disabled={!paymentAmount}
                        >
                          Generate Payment Link
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Payment QR Code */}
                <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Payment QR Code</h2>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Share this QR code with your customers
                    </p>
                  </div>
                  
                  <div className="p-6">
                    {showQR ? (
                      <div className="space-y-6">
                        <div className="flex justify-center" ref={qrRef}>
                          {/* This would be a real QR code in production */}
                          <div className="w-64 h-64 bg-white p-4 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-6xl mb-2">📱</div>
                              <div className="text-gray-800 font-medium">
                                {paymentAmount} {paymentCurrency}
                              </div>
                              <div className="text-gray-500 text-sm">
                                {paymentDescription || 'Payment'}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-750 p-3 rounded-lg">
                          <div className="text-gray-600 dark:text-gray-400 text-sm mb-1">Payment Link:</div>
                          <div className="flex">
                            <input
                              type="text"
                              className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm"
                              value={paymentLink}
                              readOnly
                            />
                            <button
                              className="p-2 bg-blue-600 text-white rounded-r-lg"
                              onClick={copyToClipboard}
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex justify-center space-x-4">
                          <button className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium py-2 px-4 rounded-lg transition">
                            Download QR
                          </button>
                          <button className="bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium py-2 px-4 rounded-lg transition">
                            Share Link
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center">
                        <div className="text-center text-gray-500 dark:text-gray-400">
                          <div className="text-5xl mb-4">🔄</div>
                          <p>Generate a payment link to see the QR code</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Payment History */}
            {activeTab === 'history' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Payment History</h2>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {mockPaymentHistory.map((payment, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">{payment.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{payment.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{payment.customer}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{payment.description}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                            {payment.amount} {payment.currency}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                            <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mr-3">
                              View
                            </button>
                            <button className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300">
                              Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing 5 of 42 payments
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                      Previous
                    </button>
                    <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Payment Analytics */}
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Payment Methods</h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Overview of payment methods used by your customers
                </p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {stablecoins.slice(0, 3).map((coin, index) => {
                    // Count transactions for this currency
                    const txCount = mockTransactions.filter(tx => tx.currency === coin.baseToken).length;
                    const percentage = Math.round((txCount / mockTransactions.length) * 100);
                    const totalAmount = mockTransactions
                      .filter(tx => tx.currency === coin.baseToken)
                      .reduce((sum, tx) => sum + parseInt(tx.amount.replace(/,/g, '')), 0)
                      .toLocaleString();
                    
                    return (
                      <div key={index} className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
                          <span className="mr-2">{coin.flag}</span>
                          {coin.baseToken} Payments
                        </div>
                        <div className="text-2xl font-bold text-gray-800 dark:text-white">{percentage || 0}%</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">{totalAmount || 0} {coin.baseToken} received</div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-6 text-center">
                  <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium">
                    View Detailed Analytics
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
