'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getProvider } from '../utils/rpcProvider';

// ABI for ERC20 token (simplified version)
const erc20Abi = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
];

// ABI for Reserve contract (simplified version)
const reserveAbi = [
  'function getReserveRatio() view returns (uint256)',
  'function getTotalReserves() view returns (uint256)',
];

interface ContractIntegrationProps {
  tokenAddress: string;
  reserveAddress?: string;
  chainId?: number;
}

export default function ContractIntegration({ 
  tokenAddress, 
  reserveAddress,
  chainId = 8453 // Default to Base Mainnet
}: ContractIntegrationProps) {
  const [tokenInfo, setTokenInfo] = useState<{
    name: string;
    symbol: string;
    totalSupply: string;
    decimals: number;
  }>({
    name: '',
    symbol: '',
    totalSupply: '0',
    decimals: 18,
  });
  
  const [reserveInfo, setReserveInfo] = useState<{
    ratio: string;
    totalReserves: string;
  }>({
    ratio: '0',
    totalReserves: '0',
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchContractData = async () => {
      if (!tokenAddress) return;
      
      try {
        setLoading(true);
        setError('');
        
        // Always use our unified provider logic for Base network
        let provider;
        try {
          provider = await getProvider();
        } catch (providerError) {
          console.error('Failed to connect to any provider', providerError);
          setError('Failed to connect to the Base network. Please try again later.');
          setLoading(false);
          return;
        }
        
        // Get token info
        const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, provider);
        const [name, symbol, decimals, totalSupply] = await Promise.all([
          tokenContract.name(),
          tokenContract.symbol(),
          tokenContract.decimals(),
          tokenContract.totalSupply(),
        ]);
        
        setTokenInfo({
          name,
          symbol,
          decimals,
          totalSupply: ethers.utils.formatUnits(totalSupply, decimals),
        });
        
        // Get reserve info if available
        if (reserveAddress) {
          const reserveContract = new ethers.Contract(reserveAddress, reserveAbi, provider);
          const [ratio, totalReserves] = await Promise.all([
            reserveContract.getReserveRatio(),
            reserveContract.getTotalReserves(),
          ]);
          
          setReserveInfo({
            ratio: (Number(ratio) / 100).toFixed(2) + '%',
            totalReserves: ethers.utils.formatUnits(totalReserves, decimals),
          });
        }
      } catch (err) {
        console.error('Error fetching contract data:', err);
        setError('Failed to load contract data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchContractData();
  }, [tokenAddress, reserveAddress, chainId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-4"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-6 text-red-700 dark:text-red-300">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        {tokenInfo.name} ({tokenInfo.symbol})
      </h3>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-300">Total Supply:</span>
          <span className="font-medium text-gray-800 dark:text-white">
            {parseFloat(tokenInfo.totalSupply).toLocaleString()} {tokenInfo.symbol}
          </span>
        </div>
        
        {reserveAddress && (
          <>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Reserve Ratio:</span>
              <span className="font-medium text-gray-800 dark:text-white">
                {reserveInfo.ratio}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Total Reserves:</span>
              <span className="font-medium text-gray-800 dark:text-white">
                {parseFloat(reserveInfo.totalReserves).toLocaleString()} {tokenInfo.symbol}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
