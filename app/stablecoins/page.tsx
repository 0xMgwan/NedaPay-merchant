'use client';

import { useState, useEffect } from 'react';
import { useOnchainKit } from '@coinbase/onchainkit';
import Header from '../components/Header';
import ContractIntegration from '../components/ContractIntegration';
import { stablecoins, mockBalances } from '../data/stablecoins';

// Process stablecoins data for display
const processedStablecoins = stablecoins.map(coin => {
  const balance = coin.baseToken in mockBalances ? mockBalances[coin.baseToken as keyof typeof mockBalances] : '0';
  const value = coin.baseToken in mockBalances ? 
    '$' + (parseInt(mockBalances[coin.baseToken as keyof typeof mockBalances].replace(/,/g, '')) / 1000).toFixed(2) + 'K' : 
    '$0';
    
  return {
    symbol: coin.baseToken,
    name: coin.name,
    logo: coin.flag,
    address: coin.address,
    balance,
    value,
    description: coin.description,
    website: coin.website,
    issuer: coin.issuer,
    region: coin.region,
    currency: coin.currency
  };
});


export default function StablecoinsPage() {
  const [mounted, setMounted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'holding', 'available'
  const [acceptedCoins, setAcceptedCoins] = useState<{[key: string]: boolean}>({}); // Track which coins are accepted
  const [showContractInfo, setShowContractInfo] = useState<{[key: string]: boolean}>({}); // Track which coins show contract info
  
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
    
    // Initialize accepted coins (default first 3 coins to accepted)
    const initialAccepted: {[key: string]: boolean} = {};
    stablecoins.forEach((coin, index) => {
      initialAccepted[coin.baseToken] = index < 3;
    });
    setAcceptedCoins(initialAccepted);
  }, [address, isConnected]);

  // Filter stablecoins based on active tab
  const filteredStablecoins = processedStablecoins.filter(coin => {
    if (activeTab === 'all') return true;
    if (activeTab === 'holding') return parseFloat(coin.balance.replace(/,/g, '')) > 0;
    if (activeTab === 'available') return true; // All stablecoins are available
    return true;
  });

  if (!mounted) return null;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:bg-gray-900 dark:text-white">
      <Header />
      
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 gradient-text">
            Stablecoins
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage and view all supported local stablecoins for your business
          </p>
        </div>

        {/* Wallet Connection Prompt */}
        {!isConnected && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8 text-center">
            <h2 className="text-xl font-semibold text-blue-700 dark:text-blue-300 mb-2">Connect Your Wallet</h2>
            <p className="text-blue-600 dark:text-blue-400 mb-4">Connect your wallet to view your stablecoin balances and manage payments</p>
          </div>
        )}

        {isConnected && (
          <>
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-8">
              <button
                className={`py-3 px-6 ${activeTab === 'all' 
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('all')}
              >
                All Stablecoins
              </button>
              <button
                className={`py-3 px-6 ${activeTab === 'holding' 
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('holding')}
              >
                My Holdings
              </button>
              <button
                className={`py-3 px-6 ${activeTab === 'available' 
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('available')}
              >
                Available to Accept
              </button>
            </div>

            {/* Stablecoins Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStablecoins.map((coin, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-2xl mr-4">
                        {coin.logo}
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-on-light dark:text-white">{coin.symbol}</h2>
                        <p className="text-sm text-on-light dark:text-gray-400">{coin.name}</p>
                      </div>
                    </div>
                    
                    <p className="text-on-light dark:text-gray-300 text-sm mb-4">
                      {coin.description}
                    </p>
                    
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-on-light dark:text-gray-400">Balance:</span>
                      <span className="font-medium text-on-light dark:text-white">{coin.balance} {coin.symbol}</span>
                    </div>
                    
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-on-light dark:text-gray-400">USD Value:</span>
                      <span className="font-medium text-on-light dark:text-white">{coin.value}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-on-light dark:text-gray-400">Contract:</span>
                      <span className="font-mono text-on-light dark:text-gray-300">
                        {`${coin.address.substring(0, 6)}...${coin.address.substring(coin.address.length - 4)}`}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-750 flex justify-between">
                    <a 
                      href={coin.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
                    >
                      View on Stablecoins.earth
                    </a>
                    
                    <button 
                      className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
                      onClick={() => setShowContractInfo(prev => ({
                        ...prev,
                        [coin.symbol]: !prev[coin.symbol]
                      }))}
                    >
                      {showContractInfo[coin.symbol] ? 'Hide Details' : 'View Details'}
                    </button>
                  </div>
                  
                  {/* Contract Integration Component */}
                  {showContractInfo[coin.symbol] && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                      <ContractIntegration 
                        tokenAddress={coin.address} 
                        reserveAddress={coin.issuer === 'NEDA Pay' ? '0x987654321abcdef987654321abcdef98765432' : undefined}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Payment Settings */}
            <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Payment Settings</h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Configure which stablecoins you want to accept for your business
                </p>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {processedStablecoins.map((coin, index) => (
                    <div key={index} className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-lg mr-3">
                          {coin.logo}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-800 dark:text-white">{coin.symbol}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{coin.name}</p>
                        </div>
                      </div>
                      
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={acceptedCoins[coin.symbol] || false}
                          onChange={() => setAcceptedCoins(prev => ({
                            ...prev,
                            [coin.symbol]: !prev[coin.symbol]
                          }))}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 flex justify-between items-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {Object.values(acceptedCoins).filter(Boolean).length} stablecoins selected
                  </div>
                  <button 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
                    onClick={() => alert('Payment settings saved successfully!')}
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
            
            {/* Stablecoin Market Data */}
            <div className="mt-12 mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">Global Stablecoin Market</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Total Stablecoins</h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stablecoins.length}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">From {new Set(stablecoins.map(coin => coin.region)).size} regions</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Africa Stablecoins</h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stablecoins.filter(coin => ['Tanzania', 'Kenya', 'Uganda', 'Rwanda', 'Ethiopia', 'Nigeria', 'South Africa'].includes(coin.region)).length}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Growing ecosystem</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Your Holdings</h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {Object.keys(mockBalances).length}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Diversified portfolio</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Accepting</h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {Object.values(acceptedCoins).filter(Boolean).length}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">For your business</p>
                </div>
              </div>
            </div>
            
            {/* Auto-Conversion Settings */}
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Auto-Conversion</h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Configure automatic conversion between stablecoins
                </p>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">Convert all incoming payments to:</label>
                  <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
                    <option value="none">No auto-conversion</option>
                    {stablecoins.map((coin, index) => (
                      <option key={index} value={coin.baseToken} selected={coin.baseToken === 'TSHC'}>
                        {coin.baseToken} ({coin.name})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    A small fee may apply for auto-conversion between stablecoins
                  </p>
                </div>
                
                <div className="flex justify-end">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition">
                    Save Settings
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
