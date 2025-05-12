'use client';

import { getSmartWalletAddress, createSmartWallet as createSmartWalletOnChain } from "../utils/smartWallet";
import { BASE_MAINNET_RPCS, getRandomRPC } from "../utils/rpcConfig";
import * as ethers from 'ethers';
import toast from 'react-hot-toast';
import { useState, useRef, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { metaMask, coinbaseWallet, walletConnect } from 'wagmi/connectors';
import { useRouter } from 'next/navigation';
// Import base chain and use type assertions to fix compatibility issues
import { base } from 'wagmi/chains';
import { Name } from '@coinbase/onchainkit/identity';
import BaseNameTest from './BaseNameTest';

// Use the Base chain with type assertions where needed

// Format address for display when no name is available
function formatAddress(address: string | undefined): string {
  if (!address || typeof address !== 'string' || !address.startsWith('0x') || address.length < 10) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

// Utility to detect mobile browsers
function isMobile() {
  return /android|iphone|ipad|ipod|opera mini|iemobile|mobile/i.test(
    typeof navigator === 'undefined' ? '' : navigator.userAgent
  );
}

export default function WalletSelector() {
  const [showOptions, setShowOptions] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCreatingSmartWallet, setIsCreatingSmartWallet] = useState(false);
  const [smartWalletAddress, setSmartWalletAddress] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  // Use wagmi hooks directly
  const { address, isConnected, connector } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

    // Helper function to ensure address is properly formatted for the Name component
  function isHexAddress(addr: string | undefined): addr is `0x${string}` {
    return typeof addr === 'string' && addr.startsWith('0x') && addr.length === 42;
  }

  
  // Format address for display
  const formatAddress = (address: string | undefined): string => {
    if (!address || typeof address !== 'string' || !address.startsWith('0x') || address.length < 10) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Close dropdown when clicking outside
  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setShowOptions(false);
    }
  };
  
  // Add event listener for clicking outside
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Always write the connected wallet address to localStorage on change
  useEffect(() => {
    if (isConnected && address) {
      localStorage.setItem('walletAddress', address);
    } else {
      localStorage.removeItem('walletAddress');
    }
  }, [isConnected, address]);

  useEffect(() => {
    if (address && isConnected) {
      localStorage.setItem('walletAddress', address);
    }
  }, [address, isConnected]);

  // Check for connected wallet and store in localStorage and cookie
  useEffect(() => {
    if (address && isConnected) {
      // Store wallet connection in localStorage
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletAddress', address);
      
      // Set a cookie for the middleware to check
      document.cookie = 'wallet_connected=true; path=/; max-age=86400'; // 24 hours
           // Always fetch the real smart wallet address from the on-chain factory
      const salt = 0; // Use 0 unless you support multiple smart wallets per EOA
      // Connect to the blockchain using our RPC configuration
      const rpcUrl = getRandomRPC(BASE_MAINNET_RPCS);
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      // Pass the provider to getSmartWalletAddress
      getSmartWalletAddress(address, salt, provider).then((realSmartWalletAddress) => {
        setSmartWalletAddress(realSmartWalletAddress);
        localStorage.setItem(`smartWallet_${address}`, JSON.stringify({
          address: realSmartWalletAddress,
          createdAt: new Date().toISOString()
        }));
      });
      
      // Immediately dispatch a custom event so dashboard can react instantly
      window.dispatchEvent(new CustomEvent('walletConnected', { detail: { address } }));
      
      // Redirect to dashboard immediately after successful connection
      // Only redirect to dashboard if on the homepage/root ('' or '/')
      let path = window.location.pathname.replace(/\/+$/, ''); // Remove all trailing slashes
      if (path === '' || path === '/') {
        console.log('[DEBUG] Redirecting to /dashboard from WalletSelector. Current path:', window.location.pathname);
        router.push('/dashboard');
      }
    } else {
      // Clear wallet connection from localStorage
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletAddress');
      
      // Clear the cookie
      document.cookie = 'wallet_connected=; path=/; max-age=0';
    }
  }, [address, isConnected, router]);
  

// Function to create a smart wallet (on-chain)
const createSmartWallet = async () => {
  console.log('Create Smart Wallet clicked', { address, isConnected });
  if (!address || !isConnected) return;
  setIsCreatingSmartWallet(true);
  try {
    // Use a fixed salt for demo, or generate a random one for production
    const salt = 1;
    // Get the provider from the injected wallet
    // Use window.ethereum if available, otherwise use our RPC configuration
    const provider = window.ethereum 
      ? new ethers.providers.Web3Provider(window.ethereum)
      : new ethers.providers.JsonRpcProvider(getRandomRPC(BASE_MAINNET_RPCS));

    // First, check if the smart wallet already exists
    console.log('Checking if smart wallet exists for', address, 'with salt', salt);
    // Get the wallet address using our provider
    const walletAddr = await getSmartWalletAddress(address, salt, provider);
    let code = '';
    if (walletAddr && walletAddr !== ethers.constants.AddressZero) {
      // Check if the wallet contract is deployed
      code = await provider.getCode(walletAddr);
    }
    // If the wallet contract is actually deployed, show it
    if (walletAddr && walletAddr !== ethers.constants.AddressZero && code !== '0x') {
      setSmartWalletAddress(walletAddr);
      localStorage.setItem(`smartWallet_${address}`, JSON.stringify({
        address: walletAddr,
        createdAt: new Date().toISOString()
      }));
      toast.success('Smart wallet already exists.');
      router.push('/dashboard');
      return; 
    }
    // Otherwise, create the wallet on-chain
    toast('Creating smart wallet on-chain...');
    // Updated to match new function signature without signer
    const result = await createSmartWalletOnChain(address, salt);
    setSmartWalletAddress(result.walletAddress);
    localStorage.setItem(`smartWallet_${address}`, JSON.stringify({
      address: result.walletAddress,
      createdAt: new Date().toISOString()
    }));
    toast.success('Smart wallet created!');
    router.push('/dashboard');
  } catch (error) {
    console.error('Error creating smart wallet:', error);
    toast.error('Failed to create smart wallet. See console for details.');
  } finally {
    setIsCreatingSmartWallet(false);
    setShowOptions(false);
  }
};
  
  // Function to handle MetaMask connection
  const handleConnectMetaMask = async () => {
    setIsConnecting(true);
    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum !== 'undefined') {
        try {
          // Try to connect with MetaMask
          const metaMaskConnector = metaMask();
          await connect({ connector: metaMaskConnector });
        } catch (error) {
          console.error('Error connecting to MetaMask:', error);
        }
      } else if (isMobile()) {
        // On mobile, open MetaMask deep link to this dapp
        const dappUrl = encodeURIComponent(window.location.href);
        window.open(`https://metamask.app.link/dapp/${window.location.host}`, '_blank');
      } else {
        // MetaMask not installed, open download page
        window.open('https://metamask.io/download/', '_blank');
        throw new Error('MetaMask not installed');
      }
    } catch (error) {
      console.error('Error connecting to MetaMask', error);
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Function to handle WalletConnect connection
  const handleConnectWalletConnect = async () => {
    setIsConnecting(true);
    try {
      const walletConnectConnector = walletConnect({
        projectId: 'b6c0c1f9f3a0c1f9f3a0c1f9f3a0c1f9'
      });
      
      await connect({ connector: walletConnectConnector });
      setShowOptions(false);
      // Note: The redirect will happen in the useEffect when isConnected changes
    } catch (error) {
      console.error('Error connecting with WalletConnect', error);
    } finally {
      setIsConnecting(false);
    }
  };


  // Function to handle Coinbase Wallet connection
  const handleConnectCoinbase = async () => {
    setIsConnecting(true);
    try {
      // Coinbase Wallet deep link for mobile
      if (isMobile() && typeof window.ethereum === 'undefined') {
        // Open Coinbase Wallet deep link to this dapp
        window.open(`https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(window.location.href)}`,'_blank');
        return;
      }
      // Create Coinbase Wallet connector (desktop or mobile in-app browser)
      const coinbaseConnector = coinbaseWallet({
        appName: 'NEDA Pay',
      });
      
      await connect({ connector: coinbaseConnector });
      setShowOptions(false);
      // Note: The redirect will happen in the useEffect when isConnected changes
    } catch (error) {
      console.error('Error connecting to Coinbase Wallet', error);
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Function to handle wallet disconnection
  const handleDisconnect = () => {
    disconnect();
    setShowOptions(false);
    
    // Clear wallet connection from localStorage
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAddress');
    
    // Clear the cookie
    document.cookie = 'wallet_connected=; path=/; max-age=0';
    
    // Redirect to home page using Next.js router
    router.push('/');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {isConnected ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowOptions(!showOptions);
          }}
          className="flex items-center space-x-2 bg-white/80 dark:bg-slate-900/60 hover:bg-blue-50 dark:hover:bg-blue-800 text-slate-800 dark:text-white border-2 border-blue-400 dark:border-blue-300 px-2 sm:px-3 py-1 rounded-lg transition-all duration-200 shadow-sm"
        >
          <div className="w-6 h-6 rounded-full flex items-center justify-center mr-2 bg-blue-100 dark:bg-blue-900">
  {connector?.id === 'coinbaseWallet' || connector?.name === 'Coinbase Wallet' ? (
    // Coinbase Wallet Logo
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill="#0052FF" />
      <circle cx="12" cy="12" r="7.2" fill="#fff" />
      <rect x="8" y="11" width="8" height="2" rx="1" fill="#0052FF" />
    </svg>
  ) : (
    // MetaMask Logo (default)
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21.3622 2L13.3622 8.4L14.9622 4.56L21.3622 2Z" fill="#E17726"/>
      <path d="M2.63782 2L10.5378 8.46L9.03782 4.56L2.63782 2Z" fill="#E27625"/>
    </svg>
  )}
</div>
          <div className="text-xs sm:text-sm font-bold">
            {address ? (
              <>
                <Name 
                  address={address as `0x${string}`} 
                  chain={base as any}
                />
                <span className="ml-1 text-xs text-gray-500">
                  ({formatAddress(address)})
                </span>
              </>
            ) : (
              'Connect Wallet'
            )}
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowOptions(!showOptions);
          }}
          className="bg-white/80 dark:bg-slate-900/60 hover:bg-blue-50 dark:hover:bg-blue-800 text-slate-800 dark:text-white border-2 border-blue-400 dark:border-blue-300 px-2 sm:px-3 py-1 rounded-lg transition-all duration-200 shadow-sm flex items-center"
          disabled={isConnecting}
        >
          <span className="text-xs sm:text-sm font-bold">{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1 inline">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      )}
      
      {showOptions && (
        <div 
          className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          {isConnected ? (
            <>
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-300">Connected Wallet</h3>
                  <span className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">Active</span>
                </div>
                <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  {address ? (
                    <>
                      <Name 
                        address={address as `0x${string}`} 
                        chain={base as any}
                      />
                    </>
                  ) : (
                    'Not connected'
                  )}
                </div>
              </div>
              
              <div className="p-2 space-y-1">
                <button 
                  onClick={createSmartWallet}
                  disabled={isCreatingSmartWallet}
                  className="block w-full text-left px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingSmartWallet ? 'Creating Smart Wallet...' : 'Create Smart Wallet'}
                </button>
                
                <button 
                  onClick={handleDisconnect}
                  className="block w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-300">Select Wallet</h3>
              </div>
              <div className="p-2 space-y-2">
                {/* WalletConnect Option */}
                <button
                  onClick={handleConnectWalletConnect}
                  disabled={isConnecting}
                  className="w-full flex items-center space-x-2 p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-700 transition-colors text-left"
                >
                  <div className="w-6 h-6 flex-shrink-0 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8zm3.536-10.95a1 1 0 0 1 1.415 1.415l-4.95 4.95a1 1 0 0 1-1.415 0l-2.121-2.122a1 1 0 1 1 1.415-1.415l1.414 1.415 4.242-4.243z" fill="#3396FF"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-300">WalletConnect</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Connect with WalletConnect
                    </div>
                  </div>
                </button>

                {/* Coinbase Wallet Option */}
                <div>
                  <button
                    onClick={handleConnectCoinbase}
                    disabled={isConnecting}
                    className="w-full flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className="w-6 h-6 flex-shrink-0 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z" fill="#0052FF"/>
                        <path d="M12.0002 4.80005C8.0002 4.80005 4.8002 8.00005 4.8002 12C4.8002 16 8.0002 19.2 12.0002 19.2C16.0002 19.2 19.2002 16 19.2002 12C19.2002 8.00005 16.0002 4.80005 12.0002 4.80005ZM9.6002 14.4C8.8002 14.4 8.0002 13.6 8.0002 12.8C8.0002 12 8.8002 11.2 9.6002 11.2C10.4002 11.2 11.2002 12 11.2002 12.8C11.2002 13.6 10.4002 14.4 9.6002 14.4ZM14.4002 14.4C13.6002 14.4 12.8002 13.6 12.8002 12.8C12.8002 12 13.6002 11.2 14.4002 11.2C15.2002 11.2 16.0002 12 16.0002 12.8C16.0002 13.6 15.2002 14.4 14.4002 14.4Z" fill="white"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-white">Coinbase Wallet</div>
<div className="text-xs text-white/80">
  {isConnecting ? 'Connecting...' : 'Connect'}
</div>
                    </div>
                  </button>
                </div>
                
                {/* MetaMask Option */}
                <button
                  onClick={handleConnectMetaMask}
                  disabled={isConnecting}
                  className="w-full flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="w-6 h-6 flex-shrink-0 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21.3622 2L13.3622 8.4L14.9622 4.56L21.3622 2Z" fill="#E17726"/>
                      <path d="M2.63782 2L10.5378 8.46L9.03782 4.56L2.63782 2Z" fill="#E27625"/>
                      <path d="M18.4378 16.86L16.2378 20.46L20.9378 21.84L22.3378 16.92L18.4378 16.86Z" fill="#E27625"/>
                      <path d="M1.67782 16.92L3.05782 21.84L7.75782 20.46L5.55782 16.86L1.67782 16.92Z" fill="#E27625"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-medium text-white">MetaMask</div>
<div className="text-xs text-white/80">
  {isConnecting ? 'Connecting...' : 'Connect'}
</div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
