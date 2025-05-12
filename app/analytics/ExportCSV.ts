import { saveAs } from 'file-saver';

export function exportTransactionsToCSV(transactions: any[], filename = 'transactions.csv') {
  if (!transactions.length) return;
  const header = Object.keys(transactions[0]);
  const csvRows = [header.join(',')];
  for (const tx of transactions) {
    csvRows.push(header.map(key => `"${(tx[key] ?? '').toString().replace(/"/g, '""')}"`).join(','));
  }
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
}
