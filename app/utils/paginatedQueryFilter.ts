import { Contract, EventFilter } from 'ethers';

/**
 * Paginated queryFilter utility for ethers.js contracts.
 * Fetches logs in chunks to avoid provider block range limits.
 *
 * @param contract ethers.Contract instance
 * @param filter EventFilter for contract.queryFilter
 * @param fromBlock Start block (inclusive)
 * @param toBlock End block (inclusive)
 * @param blockStep Max block range per query (default: 1000)
 * @returns Aggregated array of logs/events
 */
import { getLogCompatibleProvider } from './rpcProvider';

export async function paginatedQueryFilter(
  contract: Contract,
  filter: EventFilter,
  fromBlock: number,
  toBlock: number,
  blockStep: number = 500
) {
  let logs: any[] = [];
  let start = fromBlock;
  // Always use a compatible provider for log/event queries
  const provider = await getLogCompatibleProvider();
  const contractWithProvider = contract.connect(provider);

  // Function to handle retries with exponential backoff
  const queryWithRetry = async (start: number, end: number, retries = 3, delay = 1000): Promise<any[]> => {
    try {
      return await contractWithProvider.queryFilter(filter, start, end);
    } catch (e: any) {
      // Check if it's a rate limit error
      const isRateLimit = e.message && (
        e.message.includes('timeout') || 
        e.message.includes('rate limit') ||
        e.message.includes('SERVER_ERROR') ||
        e.message.includes('Request timeout')
      );
      
      if (isRateLimit && retries > 0) {
        console.log(`Rate limit hit, retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return queryWithRetry(start, end, retries - 1, delay * 2); // Exponential backoff
      }
      
      // If it's not a rate limit or we're out of retries, try with a smaller chunk
      if (retries > 0 && (end - start) > 100) {
        console.log('Reducing block range and retrying...');
        const mid = Math.floor((start + end) / 2);
        const firstHalf = await queryWithRetry(start, mid, retries - 1, delay);
        const secondHalf = await queryWithRetry(mid + 1, end, retries - 1, delay);
        return [...firstHalf, ...secondHalf];
      }
      
      // If all else fails, log the error and return empty array
      console.error(`Failed to query logs from ${start} to ${end} after retries:`, e);
      return [];
    }
  };
  
  while (start <= toBlock) {
    const end = Math.min(start + blockStep - 1, toBlock);
    try {
      console.log(`Querying logs from ${start} to ${end}...`);
      const chunk = await queryWithRetry(start, end);
      logs = [...logs, ...chunk];
      console.log(`Found ${chunk.length} logs from blocks ${start}-${end}`);
    } catch (e) {
      console.error(`Error querying logs from ${start} to ${end}:`, e);
    }
    
    // Add a small delay between requests to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
    start = end + 1;
  }
  
  return logs;
}
