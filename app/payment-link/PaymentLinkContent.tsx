'use client';

import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { stablecoins } from '../data/stablecoins';

export default function PaymentLinkContent() {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('TSHC');
  const [description, setDescription] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isConnected, address: wagmiAddress } = useAccount();
  // Helper to get the freshest address at any moment
  const getMerchantAddress = () => {
    if (wagmiAddress && wagmiAddress.length > 10) return wagmiAddress;
    if (typeof window !== 'undefined') {
      const lsAddr = localStorage.getItem('walletAddress');
      if (lsAddr && lsAddr.length > 10) return lsAddr;
    }
    return '';
  };
  const merchantAddress = getMerchantAddress();
  // Remove router reference to prevent accidental navigations
  // const router = useRouter();

  // Add debugging to track component lifecycle
  useEffect(() => {
    console.log('Payment Link Page - Mounted, isConnected:', isConnected);
    
    // Add event listener to detect navigations
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isSubmitting) {
        console.log('Preventing navigation during form submission');
        event.preventDefault();
        return (event.returnValue = '');
      }
    };
    
    // Add event listener for navigation attempts
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      console.log('Payment Link Page - Unmounted');
    };
  }, [isConnected, isSubmitting]);
  

  const handleCreateLink = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Always get the freshest address at the moment of link creation
    const address = getMerchantAddress();
    if (!address || address.length < 10) {
      alert('Wallet address not found. Please connect your wallet using the selector at the top right, then try again.');
      return;
    }
    // Prevent link creation if wallet is not connected
    if (!merchantAddress) {
      alert('Please connect your wallet before generating a payment link.');
      return;
    }
    // Prevent the default form submission behavior
    e.preventDefault();
    
    // Stop event propagation to prevent any parent handlers from firing
    e.stopPropagation();
    
    console.log('merchantAddress in PaymentLinkContent:', merchantAddress);
    setIsSubmitting(true);
    
    try {
      // In a real implementation, this would call a backend API to create a payment link
      // For now, we'll just generate a mock link
      const linkId = Math.random().toString(36).substring(2, 10);
      const baseUrl = window.location.origin;
      // Always include merchant address in the payment link
      const link = `${baseUrl}/pay/${linkId}?amount=${amount}&currency=${currency}&to=${address}`;
      
      // Set the generated link in state
      setGeneratedLink(link);
      
      // Log success message
      console.log('Payment link generated:', link);
      
      // Force focus to the generated link to shift attention away from the form
      setTimeout(() => {
        const linkInput = document.querySelector('input[value="' + link + '"]') as HTMLInputElement;
        if (linkInput) {
          linkInput.focus();
          linkInput.select();
        }
      }, 100);
    } catch (error) {
      console.error('Error generating payment link:', error);
    } finally {
      setIsSubmitting(false);
    }
    
    // Return false to prevent any further form handling
    return false;
  };

  const copyToClipboard = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(generatedLink)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {
          fallbackCopyToClipboard(generatedLink);
        });
    } else {
      fallbackCopyToClipboard(generatedLink);
    }
  };

  // Fallback for browsers without clipboard API
  function fallbackCopyToClipboard(text: string) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed'; // Avoid scrolling to bottom
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      alert('Copy failed. Please copy manually.');
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-white dark:bg-gray-900 dark:text-white">
      <Header />
      <div className="flex-grow">
        <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-slate-800 dark:text-slate-100">
            Create Payment Link
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-base">
            Generate a payment link to share with your customers
          </p>
        </div>

        <div className="mb-4">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Merchant Wallet:</span>
          <span className="ml-2 font-mono dark:text-white bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded select-all">{merchantAddress ? merchantAddress : 'Not connected'}</span>
        </div>
        {!merchantAddress && (
          <div className="mb-4 text-red-600 dark:text-red-400 font-semibold">
            Please connect your wallet (MetaMask or Coinbase) using the Wallet Selector at the top right. Your address will appear here when connected.
          </div>
        )}
        {merchantAddress && (
          <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded">
            <div className="text-xs text-gray-500 dark:text-white mb-1">Payment link preview (with merchant address):</div>
            <div className="break-all font-mono text-xs dark:text-white">
              {`${window.location.origin}/pay/EXAMPLEID?amount=${amount || '<amount>'}&currency=${currency || '<currency>'}&to=${merchantAddress}`}
            </div>
          </div>
        )}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg mb-8">
          <form 
            onSubmit={handleCreateLink} 
            className="space-y-6" 
            action="javascript:void(0);" 
            data-prevent-redirect="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Amount
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="number"
                  name="amount"
                  id="amount"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-primary focus:border-primary"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Currency
              </label>
              <select
                id="currency"
                name="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-primary focus:border-primary rounded-md"
              >
                {stablecoins.map((coin: any) => (
                  <option key={coin.baseToken} value={coin.baseToken}>
                    {coin.baseToken} - {coin.name || coin.currency || coin.region}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Description (Optional)
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-md"
                  placeholder="Payment for services"
                />
              </div>
            </div>
            
            <div>
              <button
              type="button"
              disabled={!merchantAddress || isSubmitting}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCreateLink(e as unknown as React.FormEvent);
              }}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              Generate Payment Link
            </button>
            </div>
          </form>
          
          {generatedLink && merchantAddress && (
            <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Your Payment Link</h3>
              <div className="flex items-center">
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="flex-1 p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 rounded-l-md text-sm dark:text-white placeholder-white"
                />
                <button
                  onClick={copyToClipboard}
                  className="bg-primary text-white px-4 py-2 rounded-r-md hover:bg-primary-dark"
                  disabled={!merchantAddress}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="mt-2 text-sm dark:text-white">
                Share this link with your customers to receive payments.
              </p>
            </div>
          )}
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold dark:text-white mb-4">Recent Payment Links</h2>
          <div className="overflow-x-auto force-white-text">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium dark:text-white uppercase tracking-wider">Date Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium dark:text-white uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium dark:text-white uppercase tracking-wider">Currency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium dark:text-white uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium dark:text-white uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm force-white">May 1, 2025</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm force-white">5</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm force-white">TSHC</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full dark:bg-green-900/30 dark:text-white bg-green-100">Active</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm force-white">
                    <button className="font-bold force-white">View</button>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm force-white">May 1, 2025</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm force-white">5</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm force-white">cNGN</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full dark:bg-green-900/30 dark:text-white bg-green-100">Active</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm force-white">
                    <button className="font-bold force-white">View</button>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm force-white">May 1, 2025</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm force-white">3</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm force-white">TSHC</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full dark:bg-green-900/30 dark:text-white bg-green-100">Active</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm force-white">
                    <button className="font-bold force-white">View</button>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm force-white">May 1, 2025</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm force-white">2349</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm force-white">IDRX</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full dark:bg-green-900/30 dark:text-white bg-green-100">Active</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm force-white">
                    <button className="font-bold force-white">View</button>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm force-white">May 1, 2025</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm force-white">23</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm force-white">cNGN</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full dark:bg-red-900/30 dark:text-white bg-red-100">Expired</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm force-white">
                    <button className="font-bold force-white">View</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
