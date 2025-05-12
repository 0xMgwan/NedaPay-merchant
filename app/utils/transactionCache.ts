// Local cache for transaction data to improve dashboard loading performance

interface CachedTransaction {
  id: string;
  shortId: string;
  date: string;
  amount: string;
  currency: string;
  status: string;
  sender: string;
  senderShort: string;
  blockExplorerUrl: string;
  timestamp: number; // For sorting and expiration
}

interface TransactionCache {
  transactions: CachedTransaction[];
  lastUpdated: number;
  address: string;
}

const CACHE_EXPIRY = 2 * 60 * 1000; // 2 minutes in milliseconds - reduced to ensure fresher data

export function getCachedTransactions(address: string): CachedTransaction[] | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cacheKey = `tx_cache_${address.toLowerCase()}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (!cachedData) return null;
    
    const cache: TransactionCache = JSON.parse(cachedData);
    
    // Check if cache is for the correct address
    if (cache.address.toLowerCase() !== address.toLowerCase()) return null;
    
    // Check if cache is expired
    if (Date.now() - cache.lastUpdated > CACHE_EXPIRY) return null;
    
    return cache.transactions;
  } catch (error) {
    console.error("Error reading transaction cache:", error);
    return null;
  }
}

export function setCachedTransactions(address: string, transactions: CachedTransaction[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    const cacheKey = `tx_cache_${address.toLowerCase()}`;
    const cache: TransactionCache = {
      transactions,
      lastUpdated: Date.now(),
      address
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cache));
  } catch (error) {
    console.error("Error saving transaction cache:", error);
  }
}

export function clearTransactionCache(address: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const cacheKey = `tx_cache_${address.toLowerCase()}`;
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error("Error clearing transaction cache:", error);
  }
}
