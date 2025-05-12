import React from 'react';
import { useQuery } from '@tanstack/react-query';

interface Transaction {
  id: string;
  merchantId: string;
  wallet: string;
  amount: number;
  currency: string;
  status: string;
  txHash: string;
  createdAt: string;
}

interface Props {
  merchantId: string;
}

export default function TransactionTable({ merchantId }: Props) {
  const {
    data: transactions,
    isLoading,
    error,
  } = useQuery<Transaction[], Error>([
    'transactions', merchantId
  ], async () => {
    if (!merchantId) return [];
    const res = await fetch(`/api/transactions?merchantId=${merchantId}`);
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  }, {
    enabled: !!merchantId,
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000, // 1 minute cache
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });

  if (!merchantId) return <div className="text-red-500">No merchantId provided.</div>;
  if (isLoading) return <div>Loading transactions...</div>;
  if (error) return <div className="text-red-500">{error.message}</div>;
  if (!transactions || transactions.length === 0) return <div>No transactions found.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white dark:bg-gray-900 border rounded shadow">
        <thead>
          <tr>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Amount</th>
            <th className="px-3 py-2">Currency</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Wallet</th>
            <th className="px-3 py-2">Tx Hash</th>
          </tr>
        </thead>
        <tbody>
          {(transactions ?? []).map((tx: Transaction) => (
            <tr key={tx.id} className="border-t">
              <td className="px-3 py-2 whitespace-nowrap">{new Date(tx.createdAt).toLocaleString()}</td>
              <td className="px-3 py-2">{tx.amount}</td>
              <td className="px-3 py-2">{tx.currency}</td>
              <td className="px-3 py-2">{tx.status}</td>
              <td className="px-3 py-2">{tx.wallet.slice(0, 6)}...{tx.wallet.slice(-4)}</td>
              <td className="px-3 py-2">
                <a href={`https://basescan.org/tx/${tx.txHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
