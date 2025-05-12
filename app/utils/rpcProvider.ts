// RPC Provider Service
// This utility manages multiple RPC endpoints and handles failover

import { ethers } from 'ethers';

// Define RPC endpoints with priorities
// List of endpoints known to NOT support eth_getLogs (expand as needed)
const NON_LOG_COMPATIBLE_ENDPOINTS = [
  'https://1rpc.io/base',
  // Add more here if needed
];

const RPC_ENDPOINTS = [
  {
    url: process.env.NEXT_PUBLIC_COINBASE_BASE_RPC || 'https://api.developer.coinbase.com/rpc/v1/base/n4RnEAzBQtErAI53dP6DCa6l6HRGODgV',
    priority: 0,
    name: 'CoinbaseCDP'
  },
  {
    url: 'https://base-rpc.publicnode.com/',
    priority: 1,
    name: 'PublicNode'
  },
  {
    url: 'https://base.llamarpc.com',
    priority: 2,
    name: 'LlamaRPC'
  },
  {
    url: 'https://1rpc.io/base',
    priority: 3,
    name: '1RPC'
  },
  {
    url: 'https://base-mainnet.g.alchemy.com/v2/demo',
    priority: 4,
    name: 'Alchemy'
  },
  {
    url: 'https://mainnet.base.org',
    priority: 5,
    name: 'Base Mainnet'
  },
  {
    url: 'https://base.drpc.org',
    priority: 6,
    name: 'DRPC'
  },
  {
    url: 'https://rpc.ankr.com/base',
    priority: 7,
    name: 'Ankr'
  }
];

// Utility to filter endpoints compatible with eth_getLogs
function getLogCompatibleEndpoints() {
  return RPC_ENDPOINTS.filter(ep => !NON_LOG_COMPATIBLE_ENDPOINTS.includes(ep.url));
}

// Get a provider compatible with eth_getLogs for log/event queries
export const getLogCompatibleProvider = async (): Promise<ethers.providers.JsonRpcProvider> => {
  // Shuffle compatible endpoints by priority
  const compatibleEndpoints = getLogCompatibleEndpoints().sort((a, b) => a.priority - b.priority);

  for (const endpoint of compatibleEndpoints) {
    try {
      console.log(`[LOGS] Trying RPC endpoint: ${endpoint.name}`);
      const provider = createProviderWithTimeout(endpoint.url);
      const isHealthy = await isProviderHealthy(provider);
      if (isHealthy) {
        console.log(`[LOGS] Successfully connected to: ${endpoint.name}`);
        return provider;
      }
    } catch (error) {
      console.error(`[LOGS] Failed to connect to ${endpoint.name}:`, error);
    }
  }
  throw new Error('No compatible RPC endpoints available for log/event queries.');
}


// Cache for providers with timestamp to track freshness
interface ProviderCache {
  provider: ethers.providers.JsonRpcProvider;
  timestamp: number;
  endpoint: string;
  failCount: number;
}

let providerCache: ProviderCache | null = null;

// Constants for provider management
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_FAIL_COUNT = 3;
const DEFAULT_TIMEOUT = 10000; // 10 seconds

// Health check function with timeout
const isProviderHealthy = async (provider: ethers.providers.JsonRpcProvider, timeout = DEFAULT_TIMEOUT): Promise<boolean> => {
  try {
    // Create a promise that rejects after the timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Provider health check timeout')), timeout);
    });
    
    // Try to get the latest block number as a health check
    const blockPromise = provider.getBlockNumber();
    
    // Race the promises
    const blockNumber = await Promise.race([blockPromise, timeoutPromise]);
    return typeof blockNumber === 'number' && blockNumber > 0;
  } catch (error) {
    console.error(`Provider health check failed:`, error);
    return false;
  }
};

// Function to create a provider with timeout
const createProviderWithTimeout = (url: string): ethers.providers.JsonRpcProvider => {
  const provider = new ethers.providers.JsonRpcProvider(url);
  
  // Override the send method to add timeout
  const originalSend = provider.send.bind(provider);
  provider.send = async (method: string, params: any[]) => {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('RPC request timeout')), DEFAULT_TIMEOUT);
      });
      
      const requestPromise = originalSend(method, params);
      return await Promise.race([requestPromise, timeoutPromise]);
    } catch (error) {
      console.error(`RPC request failed for method ${method}:`, error);
      throw error;
    }
  };
  
  return provider;
};

// Get a working provider with improved caching and failover
export const getProvider = async (): Promise<ethers.providers.JsonRpcProvider> => {
  // Check if we have a valid cached provider
  if (providerCache) {
    const { provider, timestamp, endpoint, failCount } = providerCache;
    const cacheAge = Date.now() - timestamp;
    
    // If cache is fresh and hasn't failed too many times, try it
    if (cacheAge < CACHE_TTL && failCount < MAX_FAIL_COUNT) {
      try {
        const isHealthy = await isProviderHealthy(provider);
        if (isHealthy) {
          console.log(`Using cached provider: ${endpoint}`);
          return provider;
        } else {
          // Increment fail count
          providerCache.failCount++;
        }
      } catch (error) {
        console.warn(`Cached provider failed health check, trying alternatives`);
        providerCache.failCount++;
      }
    }
  }

  // Shuffle endpoints to avoid always hitting the same ones first
  const shuffledEndpoints = [...RPC_ENDPOINTS]
    .sort((a, b) => a.priority - b.priority)
    .sort(() => Math.random() > 0.3 ? 1 : -1); // Add some randomness while respecting priority

  // Try each endpoint until one works
  for (const endpoint of shuffledEndpoints) {
    try {
      console.log(`Trying RPC endpoint: ${endpoint.name}`);
      const provider = createProviderWithTimeout(endpoint.url);
      
      // Check if the provider is healthy with timeout
      const isHealthy = await isProviderHealthy(provider);
      if (isHealthy) {
        console.log(`Successfully connected to: ${endpoint.name}`);
        // Cache the working provider
        providerCache = {
          provider,
          timestamp: Date.now(),
          endpoint: endpoint.url,
          failCount: 0
        };
        return provider;
      }
    } catch (error) {
      console.error(`Failed to connect to ${endpoint.name}:`, error);
    }
  }

  // If all endpoints fail, throw a user-friendly error
  throw new Error('Network connection issues. Please check your internet connection and try again later.');
};

// Get transaction receipt with retries and exponential backoff
export const getTransactionReceipt = async (txHash: string, maxRetries = 5): Promise<ethers.providers.TransactionReceipt | null> => {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const provider = await getProvider();
      
      // Create a promise that rejects after the timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Transaction receipt request timeout')), DEFAULT_TIMEOUT);
      });
      
      // Try to get the receipt
      const receiptPromise = provider.getTransactionReceipt(txHash);
      
      // Race the promises
      const receipt = await Promise.race([receiptPromise, timeoutPromise]);
      if (receipt) {
        return receipt;
      }
      
      // If receipt is null, transaction might be pending, so retry
      retries++;
      
      // Exponential backoff
      const backoffTime = Math.min(1000 * Math.pow(2, retries), 10000); // Max 10 seconds
      console.log(`Transaction receipt not found, retrying in ${backoffTime/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    } catch (error) {
      console.error(`Failed to get transaction receipt (attempt ${retries + 1}/${maxRetries}):`, error);
      retries++;
      
      if (retries >= maxRetries) {
        console.error(`Max retries reached for transaction receipt:`, txHash);
        return null;
      }
      
      // Exponential backoff
      const backoffTime = Math.min(1000 * Math.pow(2, retries), 10000); // Max 10 seconds
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    }
  }
  
  return null;
};

// Execute a contract call with retries and fallbacks
export const executeContractCall = async <T>(callback: (provider: ethers.providers.JsonRpcProvider) => Promise<T>, maxRetries = 3): Promise<T> => {
  let lastError: Error | null = null;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      // Get a fresh provider for each attempt
      const provider = await getProvider();
      
      // Execute the callback with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Contract call timeout')), DEFAULT_TIMEOUT);
      });
      
      const resultPromise = callback(provider);
      const result = await Promise.race([resultPromise, timeoutPromise]);
      return result;
    } catch (error: any) {
      lastError = error;
      console.error(`Contract call failed (attempt ${retries + 1}/${maxRetries}):`, error);
      
      // Check for specific error types that indicate we should retry
      const errorMessage = error.message?.toLowerCase() || '';
      const shouldRetry = (
        errorMessage.includes('timeout') ||
        errorMessage.includes('network') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('server error') ||
        errorMessage.includes('call exception') ||
        errorMessage.includes('backend') ||
        error.code === 'SERVER_ERROR' ||
        error.code === 'TIMEOUT' ||
        error.code === 'CALL_EXCEPTION'
      );
      
      if (!shouldRetry) {
        console.error('Non-retryable error encountered:', error);
        throw error; // Don't retry for non-network related errors
      }
      
      retries++;
      
      if (retries >= maxRetries) {
        console.error(`Max retries reached for contract call`);
        throw new Error('Network connection issues. Please try again later.');
      }
      
      // Clear provider cache to force a new provider on next attempt
      providerCache = null;
      
      // Exponential backoff
      const backoffTime = Math.min(1000 * Math.pow(2, retries), 10000); // Max 10 seconds
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    }
  }
  
  throw lastError || new Error('Unknown error during contract call');
};

// Get transaction data with retries
export const getTransaction = async (txHash: string, maxRetries = 3): Promise<ethers.providers.TransactionResponse | null> => {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const provider = await getProvider();
      const tx = await provider.getTransaction(txHash);
      return tx;
    } catch (error) {
      console.error(`Failed to get transaction (attempt ${retries + 1}/${maxRetries}):`, error);
      retries++;
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
    }
  }
  
  return null;
};

// Get block data with retries
export const getBlock = async (blockNumber: number, maxRetries = 3): Promise<ethers.providers.Block | null> => {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const provider = await getProvider();
      const block = await provider.getBlock(blockNumber);
      return block;
    } catch (error) {
      console.error(`Failed to get block (attempt ${retries + 1}/${maxRetries}):`, error);
      retries++;
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
    }
  }
  
  return null;
};
