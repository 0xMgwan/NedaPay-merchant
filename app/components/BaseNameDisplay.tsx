'use client';

import { useState, useEffect } from 'react';
import { Name } from '@coinbase/onchainkit/identity';
import { base } from 'viem/chains';
import { resolveBaseName } from '../utils/directBaseName';

interface BaseNameDisplayProps {
  address: string;
  className?: string;
}

/**
 * A component that displays a wallet's Base name, ENS name, or formatted address
 * Uses both the Name component from OnchainKit and a custom hook for Base name resolution
 */
export default function BaseNameDisplay({ address, className = '' }: BaseNameDisplayProps) {
  const [baseName, setBaseName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Format address for display as fallback
  const formatAddress = (addr: string): string => {
    if (!addr || typeof addr !== 'string' || !addr.startsWith('0x') || addr.length < 10) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Fetch Base name on component mount
  useEffect(() => {
    if (!address) {
      setBaseName(null);
      setIsLoading(false);
      return;
    }
    
    let cancelled = false;
    
    const fetchBaseName = async () => {
      try {
        setIsLoading(true);
        
        // Try direct Base name resolution first
        const directName = await resolveBaseName(address);
        
        if (!cancelled) {
          console.log('[BaseNameDisplay] Direct resolved name:', directName);
          if (directName) {
            setBaseName(directName);
            setIsLoading(false);
            return;
          }
          
          // If direct resolution failed, set to null and continue to fallback
          setBaseName(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('[BaseNameDisplay] Error fetching name:', error);
        if (!cancelled) {
          setBaseName(null);
          setIsLoading(false);
        }
      }
    };
    
    fetchBaseName();
    
    return () => { cancelled = true; };
  }, [address]);

  // If we have a Base name, show it directly
  if (baseName) {
    return <span className={className}>{baseName}</span>;
  }
  
  // Otherwise, use a simplified approach that just shows the formatted address
  // This is more reliable than depending on external services that might fail
  return (
    <span className={className}>
      {isLoading ? (
        <span className="animate-pulse">Loading...</span>
      ) : (
        formatAddress(address)
      )}
    </span>
  );
}
