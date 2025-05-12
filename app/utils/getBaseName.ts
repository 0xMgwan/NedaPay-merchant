/**
 * Fetches the Base Name for a given wallet address using the Base API directly.
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
    
    // Direct call to Base name resolution API
    const response = await fetch(`https://api.base.org/v1/addresses/${address}/names`);
    
    if (!response.ok) {
      throw new Error(`Error fetching Base name: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Log the result for debugging
    console.log('[BaseName] API result:', data);
    
    // Return the first name if available
    if (data && data.names && data.names.length > 0) {
      return data.names[0];
    }
    
    return null;
  } catch (error) {
    console.error('[BaseName] Error fetching Base Name:', error);
    return null;
  }
}
