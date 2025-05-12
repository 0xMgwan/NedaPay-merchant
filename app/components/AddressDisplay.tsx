'use client';

import { useState, useEffect } from 'react';

interface AddressDisplayProps {
  address: string;
  className?: string;
}

/**
 * A simplified component that displays a wallet address
 * with optional name resolution and reliable fallback
 */
export default function AddressDisplay({ address, className = '' }: AddressDisplayProps) {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Start with false to show address immediately
  
  // Format address for display as fallback
  const formatAddress = (addr: string): string => {
    if (!addr || typeof addr !== 'string' || !addr.startsWith('0x') || addr.length < 10) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Try to resolve name in the background, but show formatted address immediately
  useEffect(() => {
    if (!address) {
      setDisplayName(null);
      return;
    }
    
    let cancelled = false;
    
    // Attempt to fetch the name in the background
    const fetchNameInBackground = async () => {
      try {
        // This would be where we'd try to resolve the name
        // But for now, we'll just use the formatted address
        // to ensure reliable display without errors
        
        // If we successfully resolve a name in the future, we can update it here
        // setDisplayName(resolvedName);
      } catch (error) {
        console.error('[AddressDisplay] Error:', error);
      }
    };
    
    fetchNameInBackground();
    
    return () => { cancelled = true; };
  }, [address]);

  // Always show the formatted address or display name if available
  return (
    <span className={className}>
      {displayName || formatAddress(address)}
    </span>
  );
}
