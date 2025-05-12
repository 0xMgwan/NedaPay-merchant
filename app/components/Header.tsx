'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { usePathname, useRouter } from 'next/navigation';
import WalletSelector from './WalletSelector';
import NotificationTab from './NotificationTab';

export default function Header() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [walletConnected, setWalletConnected] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMounted(true);
    // Check both cookie and localStorage on mount
    const checkWallet = () => {
      const cookieConnected = document.cookie.includes('wallet_connected=true');
      const storageConnected = localStorage.getItem('walletConnected') === 'true';
      setWalletConnected(cookieConnected || storageConnected);
    };
    checkWallet();
    window.addEventListener('storage', checkWallet);
    // Optionally poll cookie every second (cookies don't trigger events)
    const interval = setInterval(checkWallet, 1000);
    return () => {
      window.removeEventListener('storage', checkWallet);
      clearInterval(interval);
    };
  }, []);

  // Handle FAQ navigation
  const handleFAQClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (pathname === '/') {
      // If on homepage, scroll to FAQ section
      const faqSection = document.getElementById('faq');
      if (faqSection) {
        faqSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // If on another page, navigate to homepage and then to FAQ section
      router.push('/?scrollTo=faq');
    }
  };

  if (!mounted) return null;

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-md transition-all duration-300 ${scrolled ? 'bg-white/90 dark:bg-slate-900/90 shadow-md' : 'bg-white/70 dark:bg-slate-800/70 shadow-sm'} border-b border-gray-200/70 dark:border-gray-700/70`}>
      {/* Mobile-specific styles */}
      <style jsx>{`
        @media (max-width: 640px) {
          .mobile-nav-link {
            padding: 4px 8px !important;
            font-size: 0.7rem !important;
          }
          .mobile-nav-link svg {
            width: 12px !important;
            height: 12px !important;
          }
          .mobile-wallet-btn {
            padding: 4px 8px !important;
            font-size: 0.75rem !important;
          }
        }
      `}</style>
      {/* Decorative top border with gradient */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
      
      <div className="container mx-auto max-w-6xl px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex justify-between items-center gap-2 sm:gap-4">
          {/* Left: Logo */}
          <div className="flex items-center">
            <Link href="/" className="group flex items-center">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:shadow-blue-300/40 dark:group-hover:shadow-blue-500/20 transition-all duration-300 transform group-hover:scale-105 relative">
                  {/* Outer glow effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 blur-[2px] opacity-70 scale-110 animate-pulse"></div>
                  
                  {/* Shiny border */}
                  <div className="absolute inset-0 rounded-full border-2 border-white/50 dark:border-white/30"></div>
                  
                  {/* Shine effect */}
                  <div className="absolute inset-0 rounded-full overflow-hidden">
                    <div className="absolute -inset-[100%] top-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] animate-shine"></div>
                  </div>
                  
                  {/* Logo letter */}
                  <span className="relative z-10 transform -translate-y-0.5 text-2xl font-extrabold text-white drop-shadow-md">N</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-base sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 group-hover:from-blue-500 group-hover:to-purple-600 dark:group-hover:from-blue-300 dark:group-hover:to-purple-400 transition-all duration-300">
                    <span className="hidden sm:inline">NEDA Pay Merchant</span>
                    <span className="sm:hidden">NEDA Pay</span>
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline-block">Secure Stablecoin Payments</span>
                </div>
              </div>
            </Link>
          </div>
          
          {/* Right: Nav Buttons + Wallet */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <nav className="flex flex-wrap space-x-2 md:space-x-3">
              {pathname === '/' && (
                <>
                  <a 
                    href="#how-it-works" 
                    className="mobile-nav-link relative overflow-hidden px-3 sm:px-4 py-1.5 text-xs sm:text-sm rounded-lg text-slate-700 dark:text-slate-200 font-medium bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 hover:from-blue-200 hover:to-indigo-200 dark:hover:from-blue-800/40 dark:hover:to-indigo-800/40 transition-all duration-300 shadow-sm group"
                  >
                    <span className="relative z-10 flex items-center">
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                      </svg>
                      How It Works
                    </span>
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-300/20 to-indigo-300/20 dark:from-blue-600/20 dark:to-indigo-600/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                  </a>
                  <a 
                    href="#faq" 
                    onClick={handleFAQClick}
                    className="mobile-nav-link relative overflow-hidden px-3 sm:px-4 py-1.5 text-xs sm:text-sm rounded-lg text-slate-700 dark:text-slate-200 font-medium bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 hover:from-purple-200 hover:to-pink-200 dark:hover:from-purple-800/40 dark:hover:to-pink-800/40 transition-all duration-300 shadow-sm group"
                  >
                    <span className="relative z-10 flex items-center">
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      FAQ
                    </span>
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-300/20 to-pink-300/20 dark:from-purple-600/20 dark:to-pink-600/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                  </a>
                </>
              )}
              {walletConnected && (
                <Link 
                  href="/settings" 
                  className="relative overflow-hidden px-3 sm:px-4 py-1.5 text-xs sm:text-sm rounded-lg text-slate-700 dark:text-slate-200 font-medium bg-gradient-to-r from-green-100 to-teal-100 dark:from-green-900/30 dark:to-teal-900/30 hover:from-green-200 hover:to-teal-200 dark:hover:from-green-800/40 dark:hover:to-teal-800/40 transition-all duration-300 shadow-sm group"
                >
                  <span className="relative z-10 flex items-center">
                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    Settings
                  </span>
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-green-300/20 to-teal-300/20 dark:from-green-600/20 dark:to-teal-600/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                </Link>
              )}
            </nav>
            
            <div className="flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 shadow-md border border-slate-200/50 dark:border-slate-700/50">
              <NotificationTab />
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`p-2 rounded-full transition-all duration-300 ${theme === 'dark' 
                  ? 'bg-slate-700 text-amber-300 hover:bg-slate-600 hover:text-amber-200' 
                  : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"></path>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
                  </svg>
                )}
              </button>
              <WalletSelector />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

