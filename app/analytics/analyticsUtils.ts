import { stablecoins } from '../data/stablecoins';
import { ethers } from 'ethers';

export const processBalances = (balanceData: Record<string, string>, networkChainId?: number) => {
  const processed = stablecoins.map((coin) => {
    let balance = '0';
    if (!networkChainId || coin.chainId === networkChainId) {
      balance = balanceData[coin.baseToken] || '0';
    }
    return {
      symbol: coin.baseToken,
      name: coin.name,
      balance,
      flag: coin.flag || '🌐',
      region: coin.region || 'Unknown',
    };
  });
  const total = processed.reduce((sum, coin) => sum + parseInt(coin.balance.replace(/,/g, '')), 0);
  const processedCoins = processed.map(coin => ({
    ...coin,
    percentage: total > 0 ? Math.round((parseInt(coin.balance.replace(/,/g, '')) / total) * 100) : 0
  }));
  return {
    processedBalances: processed,
    totalReceived: total.toLocaleString(),
    processedStablecoins: processedCoins
  };
};

export async function fetchIncomingPayments(merchantAddress: string) {
  if (!merchantAddress) return [];
  const provider = new ethers.providers.JsonRpcProvider('https://base-rpc.publicnode.com');
  const ERC20_ABI = [
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
  ];
  const latestBlock = await provider.getBlockNumber();
  const fromBlock = Math.max(latestBlock - 10000, 0);
  let allTxs: any[] = [];
  for (const coin of stablecoins.filter(c => c.chainId === 8453 && c.address && /^0x[a-fA-F0-9]{40}$/.test(c.address))) {
    const contract = new ethers.Contract(coin.address, ERC20_ABI, provider);
    let logs;
    let decimals;
    try {
      decimals = await contract.decimals();
    } catch (e) {
      continue;
    }
    try {
      const { paginatedQueryFilter } = await import('../utils/paginatedQueryFilter');
      logs = await paginatedQueryFilter(
        contract,
        contract.filters.Transfer(null, merchantAddress),
        fromBlock,
        latestBlock
      );
    } catch (e) {
      continue;
    }
    const symbol = coin.baseToken;
    for (const log of logs) {
      const { transactionHash, args, blockNumber } = log as { transactionHash: string, args?: { from: string, to: string, value: any }, blockNumber: number };
      if (!args) continue;
      const from = args.from;
      const to = args.to;
      const value = ethers.utils.formatUnits(args.value, decimals);
      const block = await provider.getBlock(blockNumber);
      const date = new Date(block.timestamp * 1000);
      allTxs.push({
        id: transactionHash,
        shortId: transactionHash.slice(0, 6) + '...' + transactionHash.slice(-4),
        date: date.toISOString().replace('T', ' ').slice(0, 16),
        amount: value,
        currency: symbol,
        status: 'Completed',
        sender: from,
        senderShort: from.slice(0, 6) + '...' + from.slice(-4),
        blockExplorerUrl: `https://basescan.org/tx/${transactionHash}`
      });
    }
  }
  allTxs.sort((a, b) => b.date.localeCompare(a.date));
  return allTxs.slice(0, 10);
}

export const getPaymentMethodsData = (balanceData: Record<string, string>) => {
  const { processedStablecoins } = processBalances(balanceData);
  return {
    labels: processedStablecoins.map((coin: any) => coin.symbol),
    datasets: [
      {
        label: 'Payment Methods',
        data: processedStablecoins.map((coin: any) => coin.percentage),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',  // Blue
          'rgba(16, 185, 129, 0.8)',  // Green
          'rgba(245, 158, 11, 0.8)',  // Amber
          'rgba(139, 92, 246, 0.8)',  // Purple
          'rgba(239, 68, 68, 0.8)'    // Red
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 1
      }
    ]
  };
};
