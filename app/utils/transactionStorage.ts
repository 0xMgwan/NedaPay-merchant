// Transaction storage utility for NEDA Pay
// This utility stores swap transactions in localStorage for persistence

export interface SwapTransaction {
  id: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  txHash?: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  walletAddress: string;
}

const STORAGE_KEY = 'neda_pay_transactions';

// Get all transactions
export const getTransactions = (): SwapTransaction[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to parse transactions:', error);
    return [];
  }
};

// Add a new transaction
export const addTransaction = (transaction: SwapTransaction): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const transactions = getTransactions();
    transactions.unshift(transaction); // Add to beginning of array
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error('Failed to save transaction:', error);
  }
};

// Update a transaction
export const updateTransaction = (id: string, updates: Partial<SwapTransaction>): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const transactions = getTransactions();
    const index = transactions.findIndex(tx => tx.id === id);
    
    if (index !== -1) {
      transactions[index] = { ...transactions[index], ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    }
  } catch (error) {
    console.error('Failed to update transaction:', error);
  }
};

// Get transactions for a specific wallet
export const getWalletTransactions = (walletAddress: string): SwapTransaction[] => {
  const transactions = getTransactions();
  return transactions.filter(tx => 
    tx.walletAddress.toLowerCase() === walletAddress.toLowerCase()
  );
};

// Clear all transactions (for testing)
export const clearTransactions = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
};
