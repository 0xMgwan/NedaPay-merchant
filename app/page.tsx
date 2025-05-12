'use client';
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, Suspense } from 'react';
import Footer from './components/Footer';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from './components/Header';
import { stablecoins } from './data/stablecoins';

// Client component with search params
function HomeContent() {
  const [mounted, setMounted] = useState(false);
  const [showWalletPrompt, setShowWalletPrompt] = useState(false);
  
  // Get wallet connection status from wagmi
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const prevConnected = useRef(isConnected);
  
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
    // Only redirect if the wallet just became connected
    // Do NOT redirect if on /payment-link
    if (
      mounted &&
      isConnected &&
      address &&
      !prevConnected.current &&
      window.location.pathname !== '/payment-link' &&
      !window.location.pathname.startsWith('/invoice')
    ) {
      console.log('[DEBUG] Redirecting to /dashboard from HomeContent. Current path:', window.location.pathname);
      router.push('/dashboard');
    }
    prevConnected.current = isConnected;
  }, [mounted, isConnected, address, router]);

  if (!mounted) return null;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:bg-gray-900 dark:text-white" style={{"--tw-text-opacity": "1 !important"}}>
      <style jsx global>{`
        .dark h2, .dark h3, .dark p, .dark span, .dark summary, .dark div {
          color: white !important;
        }
        .dark .text-gray-300, .dark .text-gray-500, .dark .text-gray-600, .dark .text-gray-700 {
          color: white !important;
        }
      `}</style>
      <Header />
      
      <div className="container mx-auto max-w-6xl px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <p className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white max-w-3xl mx-auto">
            Accept local stablecoins for your business, manage payments, and swap between stablecoins instantly with ease
          </p>
          
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-left">
              <div className="text-3xl mb-4">🚀</div>
              <h2 className="text-xl font-bold mb-4">Why Choose NEDA Pay?</h2>
              <div className="w-full bg-white/60 dark:bg-gray-800/80 border-2 border-blue-200 dark:border-blue-700 rounded-2xl shadow-xl p-6">
                <ul className="space-y-4 list-disc list-inside text-lg text-gray-700 dark:text-gray-200 custom-bullets">
                  <li className="flex items-start"><span className="mr-2 mt-1 text-blue-500">🌍</span><span><span className="font-semibold">Accept Local & Global Stablecoins:</span> TSHC, cNGN, IDRX, USDC, and more</span></li>
                  <li className="flex items-start"><span className="mr-2 mt-1 text-yellow-500">⚡</span><span><span className="font-semibold">Instant Settlement:</span> Receive funds instantly—no waiting for banks</span></li>
                  <li className="flex items-start"><span className="mr-2 mt-1 text-green-600">🔒</span><span><span className="font-semibold">No Chargebacks:</span> Crypto payments are final, reducing fraud risk</span></li>
                  <li className="flex items-start"><span className="mr-2 mt-1 text-pink-500">📈</span><span><span className="font-semibold">Analytics Built In:</span> Track sales, performance, and customer behavior</span></li>
                  <li className="flex items-start"><span className="mr-2 mt-1 text-cyan-600">🌐</span><span><span className="font-semibold">Global Reach:</span> Accept payments from customers worldwide</span></li>
                  <li className="flex items-start"><span className="mr-2 mt-1 text-indigo-500">🛠️</span><span><span className="font-semibold">Simple Integration:</span> Easy setup, no technical expertise required</span></li>
                  <li className="flex items-start"><span className="mr-2 mt-1 text-yellow-400">💡</span><span><span className="font-semibold">Transparent Fees:</span> Clear, low-cost pricing—no hidden charges</span></li>
                </ul>
              </div>
            </div>

          </div>
          
          {isConnected && (
            <div className="mt-8">
              <button 
                onClick={() => {
                  // Set cookie before navigation
                  document.cookie = 'wallet_connected=true; path=/; max-age=86400';
                  // Navigate to dashboard
                  if (window.location.pathname !== '/payment-link') {
  window.location.href = '/dashboard';
}
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
        
        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg text-center border-2 border-blue-200 dark:border-blue-600 hover:border-blue-400 dark:hover:border-blue-400 transition-all transform hover:scale-102">
            <div className="text-4xl mb-4 dark:text-white">💸</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2" style={{color: 'var(--foreground)'}}>
              Accept Local Stablecoins
            </h2>
            <p className="text-gray-700 dark:text-white" style={{color: 'var(--foreground)'}}>
              Accept TSHC, cNGN, IDRX and other local stablecoins alongside USDC
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg text-center border-2 border-blue-200 dark:border-blue-600 hover:border-blue-400 dark:hover:border-blue-400 transition-all transform hover:scale-102">
            <div className="text-4xl mb-4 dark:text-white">🔄</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2" style={{color: 'var(--foreground)'}}>
              Swap Stablecoins Instantly
            </h2>
            <p className="text-gray-700 dark:text-white" style={{color: 'var(--foreground)'}}>
              Swap between supported stablecoins in seconds, right from your dashboard
            </p>
            <div className="mt-4 flex flex-col items-center">
              <img src="/swap-screenshot.png" alt="Example of swapping stablecoins in NEDA Pay" className="rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-full md:max-w-xs" />
              <span className="text-xs text-gray-500 dark:text-white mt-2" style={{color: 'var(--foreground)'}}>
                Example: Swapping USDC to ZARP in seconds
              </span>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg text-center border-2 border-blue-200 dark:border-blue-600 hover:border-blue-400 dark:hover:border-blue-400 transition-all transform hover:scale-102">
            <div className="text-4xl mb-4 dark:text-white">📊</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2" style={{color: 'var(--foreground)'}}>
              Track Performance
            </h2>
            <p className="text-gray-700 dark:text-white" style={{color: 'var(--foreground)'}}>
              Monitor your business performance with detailed analytics and reports
            </p>
            <div className="mt-4 flex flex-col items-center">
              <img src="/dashboard-screenshot.png" alt="Dashboard analytics example in NEDA Pay" className="rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-full md:max-w-lg" />
              <span className="text-xs text-gray-500 dark:text-white mt-2" style={{color: 'var(--foreground)'}}>
                Example: Analytics and business performance dashboard
              </span>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg text-center border-2 border-blue-200 dark:border-blue-600 hover:border-blue-400 dark:hover:border-blue-400 transition-all transform hover:scale-102">
            <div className="text-4xl mb-4 dark:text-white">⚙️</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2" style={{color: 'var(--foreground)'}}>
              Automatic Settlement
            </h2>
            <p className="text-gray-700 dark:text-white" style={{color: 'var(--foreground)'}}>
              Automatically settle payments to your preferred stablecoin
            </p>
          </div>
        </div>
        
        {/* Stablecoins Section */}
        <div id="how-it-works" className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-center gradient-text dark:text-white !dark:text-white">
            Global Stablecoins Network
          </h2>
          <p className="text-center text-gray-600 dark:text-white !dark:text-white mb-6 max-w-2xl mx-auto">
            Accept and manage stablecoins from around the world on the Base blockchain
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {stablecoins.map((coin, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg text-center border-2 border-blue-200 dark:border-blue-600 hover:border-blue-400 dark:hover:border-blue-400 transition-all transform hover:scale-105">
                <div className="text-3xl mb-3 dark:text-white">{coin.flag}</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1" style={{color: 'var(--foreground)'}}>{coin.baseToken}</h3>
                <p className="text-sm text-gray-700 dark:text-white" style={{color: 'var(--foreground)'}}>{coin.region}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* How It Works Section */}
        <div id="how-it-works" className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center text-gray-800 dark:text-white">
            How It Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
  {/* Add border and background to each step */}
            <div className="flex flex-col items-center border border-blue-200 dark:border-blue-700 rounded-xl bg-white/70 dark:bg-gray-900/70 p-6 shadow-md transition hover:shadow-xl">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xl mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Connect Your Wallet</h3>
              <p className="text-center text-gray-600 dark:text-gray-300">
                Connect your Base wallet to access the merchant dashboard
              </p>
            </div>
            
            <div className="flex flex-col items-center border border-blue-200 dark:border-blue-700 rounded-xl bg-white/70 dark:bg-gray-900/70 p-6 shadow-md transition hover:shadow-xl">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xl mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Create Payment Links</h3>
              <p className="text-center text-gray-600 dark:text-gray-300">
                Generate payment links or QR codes to share with your customers
              </p>
            </div>
            
            <div className="flex flex-col items-center border border-blue-200 dark:border-blue-700 rounded-xl bg-white/70 dark:bg-gray-900/70 p-6 shadow-md transition hover:shadow-xl">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xl mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Receive Payments</h3>
              <p className="text-center text-gray-600 dark:text-gray-300">
                Customers pay using their NEDA Pay app and you receive stablecoins instantly
              </p>
            </div>
            <div className="flex flex-col items-center border border-blue-200 dark:border-blue-700 rounded-xl bg-white/70 dark:bg-gray-900/70 p-6 shadow-md transition hover:shadow-xl">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xl mb-4">
                <span role="img" aria-label="swap">🔄</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Swap Stablecoins</h3>
              <p className="text-center text-gray-600 dark:text-gray-300">
                Instantly swap between TSHC, cNGN, IDRX, USDC, and more—no third-party required
              </p>
            </div>
          </div>
        </div>
        
        {/* FAQ Section */}
        <div id="faq" className="max-w-3xl mx-auto mt-20 mb-20">
          <h2 className="text-2xl font-bold mb-8 text-center text-gray-800 dark:text-white !dark:text-white">Frequently Asked Questions</h2>
           <div className="space-y-4">
            <details className="border border-blue-200 dark:border-blue-700 rounded-lg bg-white/70 dark:bg-gray-900/70 p-4 group">
              <summary className="font-semibold text-lg cursor-pointer text-blue-700 dark:text-blue-300 !dark:text-white group-open:text-blue-900">Can I swap stablecoins using NEDA Pay?</summary>
              <div className="mt-2 text-gray-700 dark:text-white !dark:text-white">Yes! NEDA Pay lets you swap between supported stablecoins (TSHC, cNGN, IDRX, USDC, etc.) instantly and securely, right from your dashboard—no need for external exchanges.</div>
            </details>
            <details className="border border-blue-200 dark:border-blue-700 rounded-lg bg-white/70 dark:bg-gray-900/70 p-4 group">
              <summary className="font-semibold text-lg cursor-pointer text-blue-700 dark:text-blue-300 !dark:text-white group-open:text-blue-900">What is NEDA Pay?</summary>
              <div className="mt-2 text-gray-700 dark:text-white !dark:text-white">NEDA Pay is a platform that enables merchants to accept and manage local stablecoin payments easily and securely on the Base blockchain.</div>
            </details>
            <details className="border border-blue-200 dark:border-blue-700 rounded-lg bg-white/70 dark:bg-gray-900/70 p-4 group">
              <summary className="font-semibold text-lg cursor-pointer text-blue-700 dark:text-blue-300 !dark:text-white group-open:text-blue-900">How do I receive stablecoin payments?</summary>
              <div className="mt-2 text-gray-700 dark:text-white !dark:text-white">Simply connect your Base wallet, generate payment links or QR codes, and share them with your customers. Payments are settled instantly to your wallet in local stablecoins.</div>
            </details>
            <details className="border border-blue-200 dark:border-blue-700 rounded-lg bg-white/70 dark:bg-gray-900/70 p-4 group">
              <summary className="font-semibold text-lg cursor-pointer text-blue-700 dark:text-blue-300 !dark:text-white group-open:text-blue-900">Is NEDA Pay secure?</summary>
              <div className="mt-2 text-gray-700 dark:text-white !dark:text-white">Yes! NEDA Pay uses secure wallet connections and never stores your private keys. All transactions happen directly on the blockchain for full transparency and safety.</div>
            </details>
            <details className="border border-blue-200 dark:border-blue-700 rounded-lg bg-white/70 dark:bg-gray-900/70 p-4 group">
              <summary className="font-semibold text-lg cursor-pointer text-blue-700 dark:text-blue-300 !dark:text-white group-open:text-blue-900">Can I use NEDA Pay internationally?</summary>
              <div className="mt-2 text-gray-700 dark:text-white !dark:text-white">Yes, NEDA Pay enables merchants to accept stablecoin payments from customers around the world, as long as they use supported wallets and stablecoins on the Base blockchain.</div>
            </details>
            <details className="border border-blue-200 dark:border-blue-700 rounded-lg bg-white/70 dark:bg-gray-900/70 p-4 group">
              <summary className="font-semibold text-lg cursor-pointer text-blue-700 dark:text-blue-300 !dark:text-white group-open:text-blue-900">What fees does NEDA Pay charge?</summary>
              <div className="mt-2 text-gray-700 dark:text-white !dark:text-white">NEDA Pay charges low transaction fees for each payment processed. You can view the detailed fee structure in your merchant dashboard or on our website.</div>
            </details>
          </div>
        </div>
        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Ready to accept stablecoin payments?</h2>
          <p className="mb-6 max-w-2xl mx-auto">
            Join thousands of merchants across the world who are already accepting local stablecoins through NEDA Pay
          </p>
                    {!isConnected ? (
            <div className="flex flex-col items-center">
              <div className="border-t border-blue-200 dark:border-blue-700 w-full max-w-xs mx-auto mt-8 mb-4"></div>
              <button
                onClick={() => {
                  // Set cookie before wallet connection
                  document.cookie = 'wallet_connected=true; path=/; max-age=86400';
                  // Try to connect wallet
                  if (window.ethereum) {
                    window.ethereum.request({ method: 'eth_requestAccounts' });
                  } else {
                    alert('Please install a compatible wallet like MetaMask or Coinbase Wallet');
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg border-2 border-blue-400 dark:border-blue-300 transition shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                Connect Wallet
              </button>
            </div>
          ) : (
            <Link href="/dashboard" className="bg-white text-blue-600 hover:bg-blue-50 font-medium py-2 px-6 rounded-lg transition">
              Go to Dashboard
            </Link>
          )}
        </div>
      </div>
      
      {/* Footer intentionally removed here to avoid duplication. It should only be rendered globally (e.g., in layout.tsx). */}
    </div>
  );
}

// Export the page component without using Suspense for useSearchParams
export default function HomePage() {
  return (
    <HomeContent />
  );
}
