/**
 * RPC configuration for blockchain connections
 * Provides multiple RPC endpoints with fallback support
 */

// Base Mainnet RPC endpoints
export const BASE_MAINNET_RPCS = [
  'https://mainnet.base.org',
  'https://base-rpc.publicnode.com',
  // Add more RPCs as needed
];

// Base Sepolia (testnet) RPC endpoints
export const BASE_SEPOLIA_RPCS = [
  'https://sepolia.base.org',
  // Add more RPCs as needed
];

/**
 * Get a random RPC endpoint from the provided list
 * This helps distribute load across multiple endpoints
 */
export function getRandomRPC(rpcs: string[]): string {
  const index = Math.floor(Math.random() * rpcs.length);
  return rpcs[index];
}

/**
 * Try to connect to an RPC endpoint, with fallback support
 * Returns the first successful RPC endpoint
 */
export async function getWorkingRPC(rpcs: string[]): Promise<string> {
  // First try a random one to distribute load
  const shuffledRpcs = [...rpcs].sort(() => Math.random() - 0.5);
  
  // Try each RPC endpoint
  for (const rpc of shuffledRpcs) {
    try {
      const response = await fetch(rpc, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_blockNumber',
          params: [],
        }),
      });
      
      if (response.ok) {
        console.log(`Using RPC endpoint: ${rpc}`);
        return rpc;
      }
    } catch (error) {
      console.warn(`RPC endpoint ${rpc} failed, trying next...`);
    }
  }
  
  // If all fail, return the first one as a last resort
  console.warn('All RPC endpoints failed, using first one as fallback');
  return rpcs[0];
}

// Default export for convenience
export default {
  BASE_MAINNET_RPCS,
  BASE_SEPOLIA_RPCS,
  getRandomRPC,
  getWorkingRPC,
};
