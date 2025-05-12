import { getName } from '@coinbase/onchainkit/identity';
import { base } from 'viem/chains';

/**
 * Fetches the Base Name for a given wallet address.
 * Returns the base name as a string or null if not found.
 */
export async function getBaseName(address: string): Promise<string | null> {
  try {
    // Ensure address is properly formatted as 0x-prefixed string
    if (!address || typeof address !== 'string' || !address.startsWith('0x')) {
      console.error('[BaseName] Invalid address format:', address);
      return null;
    }

    // Log the request for debugging
    console.log('[BaseName] Resolving name for address:', address);
    
    // Call the getName function from OnchainKit with the Base chain
    const result = await getName({ 
      address: address as `0x${string}`, 
      chain: base 
    });
    
    // Log the result for debugging
    console.log('[BaseName] getName result:', result);
    
    // Return the result if it's a valid string
    if (result && typeof result === 'string') {
      return result;
    }
    
    return null;
  } catch (error) {
    console.error('[BaseName] Error fetching Base Name:', error);
    return null;
  }
}
