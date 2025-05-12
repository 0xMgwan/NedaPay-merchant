'use client';
export const dynamic = "force-dynamic";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Footer from './components/Footer';
// Using regular anchor tags instead of next/link and next/navigation
import Header from './components/Header';
import { stablecoins } from './data/stablecoins';

// Client component with search params
function HomeContent() {
  const [mounted, setMounted] = useState(false);
  const [showWalletPrompt, setShowWalletPrompt] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [expandedFaqs, setExpandedFaqs] = useState<{[key: number]: boolean}>({});
  
  const toggleFaq = (index: number) => {
    setExpandedFaqs(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Using window.location for navigation instead of useRouter
  const prevConnected = useRef(isConnected);
  
  // Check for wallet connection
  useEffect(() => {
    const checkWalletConnection = async () => {
      try {
        // Check if ethereum is available in window
        if (typeof window !== 'undefined' && window.ethereum) {
          try {
            // Check if any accounts are connected
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts && accounts.length > 0) {
              setAddress(accounts[0]);
              setIsConnected(true);
            }
            
            // Listen for account changes
            window.ethereum.on('accountsChanged', (newAccounts: string[]) => {
              if (newAccounts.length === 0) {
                // User disconnected their wallet
                setAddress('');
                setIsConnected(false);
              } else {
                // User switched accounts
                setAddress(newAccounts[0]);
                setIsConnected(true);
              }
            });
            
            // Listen for chain changes
            window.ethereum.on('chainChanged', (chainId: string) => {
              console.log('Chain changed to:', chainId);
              // Instead of reloading, we'll just update the state
              // This prevents unnecessary page reloads
              // You can add chain-specific logic here if needed
            });
          } catch (error) {
            console.error('Error checking wallet connection:', error);
            // Don't set error state - just log it
          }
        }
      } catch (error) {
        console.error('Error checking wallet:', error);
      }
    };
    
    checkWalletConnection();
    
    // Cleanup function to remove event listeners
    return () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);
  
  useEffect(() => {
    setMounted(true);
    // Check if redirected from a protected route
    const urlParams = new URLSearchParams(window.location.search);
    const walletRequired = urlParams.get('walletRequired');
    if (walletRequired === 'true') {
      setShowWalletPrompt(true);
    }
  }, []);

  useEffect(() => {
    // Only redirect if the wallet just became connected and not already redirected
    if (
      mounted &&
      isConnected &&
      address &&
      !window.location.pathname.startsWith('/dashboard') &&
      !window.location.pathname.startsWith('/payment-link') &&
      !window.location.pathname.startsWith('/invoice') &&
      !localStorage.getItem('redirectedToDashboard')
    ) {
      localStorage.setItem('redirectedToDashboard', 'true');
      window.location.href = '/dashboard';
    }
  }, [mounted, isConnected, address]);

  // Clear the flag on dashboard mount
  useEffect(() => {
    if (window.location.pathname.startsWith('/dashboard')) {
      localStorage.removeItem('redirectedToDashboard');
    }
  }, []);

  if (!mounted) return null;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-900 dark:text-white" style={{"--tw-text-opacity": "1"} as React.CSSProperties}>
      <style jsx global>{`
        .dark h2, .dark h3, .dark p, .dark span, .dark summary, .dark div {
          color: white !important;
        }
        .dark .text-gray-300, .dark .text-gray-500, .dark .text-gray-600, .dark .text-gray-700 {
          color: white !important;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .animate-pulse-slow {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        /* Mobile-specific styles for stablecoins and hero section */
        @media (max-width: 640px) {
          .stablecoin-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 4px !important;
          }
          .stablecoin-item {
            padding: 4px !important;
            font-size: 0.7rem !important;
            border-width: 1px !important;
          }
          .stablecoin-flag {
            font-size: 1.25rem !important;
            margin-bottom: 1px !important;
          }
          .stablecoin-name {
            font-size: 0.65rem !important;
            font-weight: bold !important;
            margin-bottom: 0 !important;
          }
          .stablecoin-region {
            font-size: 0.55rem !important;
            text-align: center !important;
            line-height: 1 !important;
          }
          .hero-feature-item {
            padding: 8px !important;
            font-size: 0.85rem !important;
          }
          .hero-feature-icon {
            font-size: 1.25rem !important;
            margin-right: 8px !important;
          }
        }
        
        /* Desktop styles to ensure original layout */
        @media (min-width: 641px) {
          .stablecoin-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
          }
          .stablecoin-item {
            padding: 12px;
          }
          .stablecoin-flag {
            font-size: 2rem;
            margin-bottom: 4px;
          }
          .stablecoin-name {
            font-size: 0.875rem;
            font-weight: bold;
          }
          .stablecoin-region {
            font-size: 0.75rem;
          }
        }
      `}</style>
      <Header />
      
      <div className="container mx-auto max-w-7xl px-4 py-8 md:py-12">
        {/* Hero Section */}
        <div className="flex flex-col-reverse lg:flex-row items-center justify-between mb-16 gap-4 sm:gap-8 p-4 sm:p-6 bg-white/20 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800 shadow-lg">
          <div className="w-full lg:w-1/2 text-left">
            <h1 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300 leading-tight">
              The Future of Payments is Here
            </h1>
            <p className="text-xl md:text-2xl font-medium text-slate-700 dark:text-blue-100 mb-8 leading-relaxed">
              Accept local stablecoins for your business, manage payments, and swap between currencies instantly with ease
            </p>
            
            <div className="flex flex-wrap gap-2 sm:gap-4 mb-6 sm:mb-8">
              <div className="hero-feature-item flex items-center bg-white/80 dark:bg-blue-900/30 px-3 sm:px-4 py-2 sm:py-3 rounded-xl shadow-md border border-blue-50 dark:border-blue-800">
                <span className="hero-feature-icon text-xl sm:text-2xl mr-2 sm:mr-3">🌍</span>
                <span className="font-medium">Global Stablecoins</span>
              </div>
              <div className="hero-feature-item flex items-center bg-white/80 dark:bg-blue-900/30 px-3 sm:px-4 py-2 sm:py-3 rounded-xl shadow-md border border-blue-50 dark:border-blue-800">
                <span className="hero-feature-icon text-xl sm:text-2xl mr-2 sm:mr-3">⚡</span>
                <span className="font-medium">Instant Settlement</span>
              </div>
              <div className="hero-feature-item flex items-center bg-white/80 dark:bg-blue-900/30 px-3 sm:px-4 py-2 sm:py-3 rounded-xl shadow-md border border-blue-50 dark:border-blue-800">
                <span className="hero-feature-icon text-xl sm:text-2xl mr-2 sm:mr-3">🔒</span>
                <span className="font-medium">Secure Payments</span>
              </div>
              <div className="hero-feature-item flex items-center bg-white/80 dark:bg-blue-900/30 px-3 sm:px-4 py-2 sm:py-3 rounded-xl shadow-md border border-blue-50 dark:border-blue-800">
                <span className="hero-feature-icon text-xl sm:text-2xl mr-2 sm:mr-3">💲</span>
                <span className="font-medium">Zero Fees</span>
              </div>
            </div>
            
            {!isConnected ? (
              <button
                onClick={async () => {
                  document.cookie = 'wallet_connected=true; path=/; max-age=86400';
                  if (window.ethereum) {
                    try {
                      // Request accounts using await for better error handling
                      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                      if (accounts && accounts.length > 0) {
                        setAddress(accounts[0]);
                        setIsConnected(true);
                      }
                    } catch (error: any) {
                      console.error('Error connecting wallet:', error);
                      // More user-friendly error message based on error type
                      if (error.code === 4001) {
                        // User rejected the request
                        alert('You rejected the connection request. Please approve it to continue.');
                      } else {
                        alert('Error connecting wallet. Please try again.');
                      }
                    }
                  } else {
                    alert('Please install a compatible wallet like MetaMask or Coinbase Wallet');
                  }
                }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center border-2 border-blue-400/30 w-full sm:w-auto justify-center"
              >
                <span className="mr-2">Connect Wallet</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            ) : (
              <a href="/dashboard" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center border-2 border-blue-400/30 w-full sm:w-auto justify-center">
                <span className="mr-2">Go to Dashboard</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </a>
            )}
          </div>
          
          <div className="w-full lg:w-1/2 relative">
            <div className="relative bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 p-3 sm:p-6 rounded-2xl shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-white/20 dark:bg-blue-500/10 backdrop-blur-sm rounded-2xl"></div>
              <div className="stablecoin-grid relative z-10 grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                {stablecoins.map((coin: any, index: number) => (
                  <div key={index} className={`stablecoin-item bg-white/80 dark:bg-gray-800/80 p-3 rounded-xl shadow-lg border border-blue-200 dark:border-blue-700 flex flex-col items-center justify-center animate-float`} style={{animationDelay: `${index * 0.1}s`}}>
                    <div className="stablecoin-flag text-2xl mb-1">{coin.flag}</div>
                    <div className="stablecoin-name font-bold text-sm">{coin.baseToken}</div>
                    <div className="stablecoin-region text-xs text-gray-500 dark:text-gray-400">{coin.region}</div>
                  </div>
                ))}
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-400/30 dark:bg-blue-600/30 rounded-full blur-2xl"></div>
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-indigo-400/30 dark:bg-indigo-600/30 rounded-full blur-2xl"></div>
            </div>
          </div>
        </div>
          
        {/* Features Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">
              Powerful Features for Modern Merchants
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Everything you need to accept, manage, and optimize your stablecoin payments
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/40 rounded-2xl p-6 shadow-xl border border-blue-100 dark:border-blue-800 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group">
              <div className="bg-blue-100 dark:bg-blue-900/50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                <span className="text-3xl">💸</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Accept Local Stablecoins
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Accept TSHC, cNGN, IDRX and other local stablecoins alongside USDC with ease
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-1 rounded-full">TSHC</span>
                <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-1 rounded-full">cNGN</span>
                <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-1 rounded-full">IDRX</span>
                <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-1 rounded-full">USDC</span>
              </div>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/40 rounded-2xl p-6 shadow-xl border border-blue-100 dark:border-blue-800 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group">
              <div className="bg-indigo-100 dark:bg-indigo-900/50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800 transition-colors">
                <span className="text-3xl">🔄</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Swap Stablecoins Instantly
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Swap between supported stablecoins in seconds, right from your dashboard
              </p>
              <div className="mt-4">
                <img src="/swap-screenshot.png" alt="Example of swapping stablecoins in NEDA Pay" className="rounded-lg shadow-md border border-gray-200 dark:border-gray-700 w-full object-cover h-32" />
              </div>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/40 rounded-2xl p-6 shadow-xl border border-blue-100 dark:border-blue-800 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group">
              <div className="bg-purple-100 dark:bg-purple-900/50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
                <span className="text-3xl">📊</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Track Performance
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Monitor your business performance with detailed analytics and reports
              </p>
              <div className="mt-4">
                <img src="/dashboard-screenshot.png" alt="Dashboard analytics example in NEDA Pay" className="rounded-lg shadow-md border border-gray-200 dark:border-gray-700 w-full object-cover h-32" />
              </div>
            </div>
            
            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/40 rounded-2xl p-6 shadow-xl border border-blue-100 dark:border-blue-800 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group">
              <div className="bg-cyan-100 dark:bg-cyan-900/50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-cyan-200 dark:group-hover:bg-cyan-800 transition-colors">
                <span className="text-3xl">⚙️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Automatic Settlement
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Automatically settle payments to your preferred stablecoin with customizable rules
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <div className="flex items-center bg-cyan-100 dark:bg-cyan-900/50 text-cyan-800 dark:text-cyan-200 text-xs font-medium px-2.5 py-1 rounded-full">
                  <span className="mr-1">⚡</span> Instant
                </div>
                <div className="flex items-center bg-cyan-100 dark:bg-cyan-900/50 text-cyan-800 dark:text-cyan-200 text-xs font-medium px-2.5 py-1 rounded-full">
                  <span className="mr-1">🔄</span> Automatic
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Removed redundant Global Stablecoins Network section as it's already at the top right */}
        
        {/* How It Works Section */}
        <div id="how-it-works" className="mb-24 scroll-mt-20 p-6 sm:p-8 bg-white/20 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800 shadow-lg relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute -left-16 top-1/4 w-32 h-32 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-2xl"></div>
          <div className="absolute -right-16 top-2/3 w-32 h-32 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-2xl"></div>
          <div className="absolute -left-24 bottom-1/4 w-48 h-48 bg-purple-400/5 dark:bg-purple-600/5 rounded-full blur-3xl"></div>
          <div className="absolute -right-24 top-1/4 w-48 h-48 bg-blue-400/5 dark:bg-blue-600/5 rounded-full blur-3xl"></div>
          
          <div className="relative">
            <h2 className="text-3xl font-bold mb-4 text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">
              How It Works
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto text-lg">
              Get started with NEDA Pay in just a few simple steps
            </p>
          
            <div className="relative w-full mx-auto">
              {/* Connection line with animated gradient */}
              <div className="absolute top-24 left-4 right-4 w-auto h-2 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 hidden md:block animate-gradient-x rounded-full"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {/* Step 1 */}
              <div className="relative group">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-blue-100 dark:border-blue-800 h-full hover:shadow-2xl transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-600">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 flex items-center justify-center text-white font-bold text-xl shadow-lg z-10 group-hover:scale-110 transition-transform duration-300 border-2 border-white dark:border-gray-800 mr-3">
                      <span className="relative z-10">1.</span>
                      <div className="absolute inset-0 rounded-full bg-blue-400 dark:bg-blue-500 blur-sm opacity-50 group-hover:opacity-70 transition-opacity"></div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Connect Your Wallet
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Connect your Base wallet to access the merchant dashboard and all features
                  </p>
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </div>
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        <svg className="mr-1.5 h-2 w-2 text-blue-500" fill="currentColor" viewBox="0 0 8 8">
                          <circle cx="4" cy="4" r="3" />
                        </svg>
                        MetaMask
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        <svg className="mr-1.5 h-2 w-2 text-blue-500" fill="currentColor" viewBox="0 0 8 8">
                          <circle cx="4" cy="4" r="3" />
                        </svg>
                        Coinbase
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Step 2 */}
              <div className="relative group">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-blue-100 dark:border-blue-800 h-full hover:shadow-2xl transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-600">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 flex items-center justify-center text-white font-bold text-xl shadow-lg z-10 group-hover:scale-110 transition-transform duration-300 border-2 border-white dark:border-gray-800 mr-3">
                      <span className="relative z-10">2.</span>
                      <div className="absolute inset-0 rounded-full bg-indigo-400 dark:bg-indigo-500 blur-sm opacity-50 group-hover:opacity-70 transition-opacity"></div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Create Payment Links
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Generate payment links or QR codes to share with your customers
                  </p>
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <div className="mt-3 flex flex-col items-center">
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2 w-full max-w-[180px] text-center text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                        nedapay.com/pay/yourstore
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-1 w-12 h-12">
                        {[...Array(9)].map((_, i) => (
                          <div key={i} className="bg-gray-800 dark:bg-gray-200 rounded-sm"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Step 3 */}
              <div className="relative group">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-blue-100 dark:border-blue-800 h-full hover:shadow-2xl transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-600">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 dark:from-green-600 dark:to-teal-700 flex items-center justify-center text-white font-bold text-xl shadow-lg z-10 group-hover:scale-110 transition-transform duration-300 border-2 border-white dark:border-gray-800 mr-3">
                      <span className="relative z-10">3.</span>
                      <div className="absolute inset-0 rounded-full bg-green-400 dark:bg-green-500 blur-sm opacity-50 group-hover:opacity-70 transition-opacity"></div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Receive Payments
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Customers pay using their NEDA Pay app and you receive stablecoins instantly
                  </p>
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex flex-col items-center">
                      <div>
                        <div className="w-16 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center text-green-800 dark:text-green-200 text-xs font-bold">
                          +100 USDC
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                        Transaction confirmed
                        <div className="ml-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                          ✓
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Step 4 */}
              <div className="relative group">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-blue-100 dark:border-blue-800 h-full hover:shadow-2xl transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-600">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700 flex items-center justify-center text-white font-bold text-xl shadow-lg z-10 group-hover:scale-110 transition-transform duration-300 border-2 border-white dark:border-gray-800 mr-3">
                      <span className="relative z-10">4.</span>
                      <div className="absolute inset-0 rounded-full bg-purple-400 dark:bg-purple-500 blur-sm opacity-50 group-hover:opacity-70 transition-opacity"></div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Swap Stablecoins
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Instantly swap between TSHC, cNGN, IDRX, USDC, and more—no third-party required
                  </p>
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
                      <span className="text-3xl" role="img" aria-label="swap">🔄</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center bg-green-100 dark:bg-green-900 rounded-lg px-2 py-1">
                        <span className="text-sm mr-1">💵</span>
                        <span className="text-xs font-medium">USDC</span>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                      <div className="flex items-center bg-blue-100 dark:bg-blue-900 rounded-lg px-2 py-1">
                        <span className="text-sm mr-1">🇳🇬</span>
                        <span className="text-xs font-medium">cNGN</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* FAQ section */}
            <div id="faq" className="mt-16 mb-8 px-4 lg:px-12">
              <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-8 rounded-2xl border border-blue-100 dark:border-blue-800 shadow-lg overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl"></div>
                
                <div className="relative">
                  <div className="flex justify-center mb-6">
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100/50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-sm font-medium">
                      <span className="mr-2">❓</span>
                      <span>FAQ</span>
                    </div>
                  </div>
                  
                  <h4 className="text-2xl font-bold text-center mb-8 text-gray-800 dark:text-white bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">
                    Frequently Asked Questions
                  </h4>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* FAQ Section removed to avoid duplication */}
        


    {/* FAQ Items with toggle functionality */}
    <div className="px-1 sm:px-4 mb-8">
      <ul className="rounded-xl overflow-hidden shadow-lg m-0 p-0">
        {/* FAQ Item 1 */}
        <li className="bg-blue-500 dark:bg-blue-600 border-b border-blue-400 dark:border-blue-500 rounded-t-xl">
          <button 
            onClick={() => toggleFaq(0)} 
            className="w-full py-3 px-4 flex items-center justify-between focus:outline-none text-white"
          >
            <div className="flex items-center">
              <span className="text-xl mr-3">❓</span>
              <h3 className="text-base font-semibold text-white text-left m-0">What is NEDA Pay?</h3>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-white transform transition-transform duration-300 ${expandedFaqs[0] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className={`px-4 py-3 bg-white dark:bg-gray-800 transition-all duration-300 ${expandedFaqs[0] ? 'block' : 'hidden'}`}>
            <p className="text-gray-600 dark:text-gray-300 m-0">
              NEDA Pay is a platform that enables merchants to accept and manage local stablecoin payments easily and securely on the Base blockchain.
            </p>
          </div>
        </li>

        {/* FAQ Item 2 */}
        <li className="bg-blue-500 dark:bg-blue-600 border-b border-blue-400 dark:border-blue-500">
          <button 
            onClick={() => toggleFaq(1)} 
            className="w-full py-3 px-4 flex items-center justify-between focus:outline-none text-white"
          >
            <div className="flex items-center">
              <span className="text-xl mr-3">💰</span>
              <h3 className="text-base font-semibold text-white text-left m-0">How do I receive stablecoin payments?</h3>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-white transform transition-transform duration-300 ${expandedFaqs[1] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className={`px-4 py-3 bg-white dark:bg-gray-800 transition-all duration-300 ${expandedFaqs[1] ? 'block' : 'hidden'}`}>
            <p className="text-gray-600 dark:text-gray-300 m-0">
              Simply connect your Base wallet, generate payment links or QR codes, and share them with your customers. Payments are settled instantly to your wallet in local stablecoins.
            </p>
          </div>
        </li>

        {/* FAQ Item 3 */}
        <li className="bg-blue-500 dark:bg-blue-600 border-b border-blue-400 dark:border-blue-500">
          <button 
            onClick={() => toggleFaq(2)} 
            className="w-full py-3 px-4 flex items-center justify-between focus:outline-none text-white"
          >
            <div className="flex items-center">
              <span className="text-xl mr-3">🔒</span>
              <h3 className="text-base font-semibold text-white text-left m-0">Is NEDA Pay secure?</h3>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-white transform transition-transform duration-300 ${expandedFaqs[2] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className={`px-4 py-3 bg-white dark:bg-gray-800 transition-all duration-300 ${expandedFaqs[2] ? 'block' : 'hidden'}`}>
            <p className="text-gray-600 dark:text-gray-300 m-0">
              Yes! NEDA Pay uses secure wallet connections and never stores your private keys. All transactions happen directly on the blockchain for full transparency and safety.
            </p>
          </div>
        </li>

        {/* FAQ Item 4 */}
        <li className="bg-blue-500 dark:bg-blue-600 border-b border-blue-400 dark:border-blue-500">
          <button 
            onClick={() => toggleFaq(3)} 
            className="w-full py-3 px-4 flex items-center justify-between focus:outline-none text-white"
          >
            <div className="flex items-center">
              <span className="text-xl mr-3">🌎</span>
              <h3 className="text-base font-semibold text-white text-left m-0">Can I use NEDA Pay internationally?</h3>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-white transform transition-transform duration-300 ${expandedFaqs[3] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className={`px-4 py-3 bg-white dark:bg-gray-800 transition-all duration-300 ${expandedFaqs[3] ? 'block' : 'hidden'}`}>
            <p className="text-gray-600 dark:text-gray-300 m-0">
              Yes, NEDA Pay enables merchants to accept stablecoin payments from customers around the world, as long as they use supported wallets and stablecoins on the Base blockchain.
            </p>
          </div>
        </li>

        {/* FAQ Item 5 */}
        <li className="bg-blue-500 dark:bg-blue-600 rounded-b-xl">
          <button 
            onClick={() => toggleFaq(4)} 
            className="w-full py-3 px-4 flex items-center justify-between focus:outline-none text-white"
          >
            <div className="flex items-center">
              <span className="text-xl mr-3">💸</span>
              <h3 className="text-base font-semibold text-white text-left m-0">What fees does NEDA Pay charge?</h3>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-white transform transition-transform duration-300 ${expandedFaqs[4] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className={`px-4 py-3 bg-white dark:bg-gray-800 transition-all duration-300 ${expandedFaqs[4] ? 'block' : 'hidden'}`}>
            <p className="text-gray-600 dark:text-gray-300 m-0">
              NEDA Pay charges low transaction fees for each payment processed. You can view the detailed fee structure in your merchant dashboard or on our website.
            </p>
          </div>
        </li>
      </ul>
    </div>
  </div>
</div>

{/* CTA Section */}
<div className="relative overflow-hidden rounded-3xl mb-12 shadow-2xl">
  <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-700 dark:via-indigo-700 dark:to-purple-700"></div>
  <div className="absolute inset-0 bg-blue-600/20 dark:bg-blue-900/30 backdrop-blur-sm"></div>
  <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-400/30 dark:bg-indigo-600/30 rounded-full blur-3xl animate-pulse-slow"></div>
  <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-400/30 dark:bg-blue-600/30 rounded-full blur-3xl animate-pulse-slow"></div>

  <div className="relative z-10 px-8 py-16 text-center text-white">
    <div className="mb-2 flex justify-center">
      <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium">
        <span className="mr-2">🚀</span>
        <span>Instant Setup</span>
      </div>
    </div>
    <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-white">Ready to accept stablecoin payments?</h2>
    <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto text-blue-100">
      Join thousands of merchants across the world who are already accepting local stablecoins through NEDA Pay
    </p>

    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
      {!isConnected ? (
        <button
          onClick={async () => {
            document.cookie = 'wallet_connected=true; path=/; max-age=86400';
            if (window.ethereum) {
              try {
                // Request accounts using await for better error handling
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                if (accounts && accounts.length > 0) {
                  setAddress(accounts[0]);
                  setIsConnected(true);
                }
              } catch (error: any) {
                console.error('Error connecting wallet:', error);
                // More user-friendly error message based on error type
                if (error.code === 4001) {
                  // User rejected the request
                  alert('You rejected the connection request. Please approve it to continue.');
                } else {
                  alert('Error connecting wallet. Please try again.');
                }
              }
            } else {
              alert('Please install a compatible wallet like MetaMask or Coinbase Wallet');
            }
          }}
          className="bg-white text-blue-600 hover:bg-blue-50 font-bold py-4 px-10 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center group relative overflow-hidden"
        >
          <span className="relative z-10 mr-2 group-hover:mr-4 transition-all duration-300">Connect Wallet</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="relative z-10 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
        </button>
      ) : (
        <a href="/dashboard" className="bg-white text-blue-600 hover:bg-blue-50 font-bold py-4 px-10 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center group relative overflow-hidden">
          <span className="relative z-10 mr-2 group-hover:mr-4 transition-all duration-300">Go to Dashboard</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="relative z-10 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
        </a>
      )}
    </div>

    <div className="mt-10 flex flex-wrap justify-center gap-4">
      <div className="flex items-center text-sm text-blue-100">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-200" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span>No setup fees</span>
      </div>
      <div className="flex items-center text-sm text-blue-100">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-200" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span>Instant settlements</span>
      </div>
      <div className="flex items-center text-sm text-blue-100">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-200" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span>Global stablecoins</span>
      </div>
    </div>
  </div>
</div>

{/* Footer intentionally removed here to avoid duplication. It should only be rendered globally (e.g., in layout.tsx). */}
</div>
);
}

export default function HomePage() {
  return <HomeContent />;
}
