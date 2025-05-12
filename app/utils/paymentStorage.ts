// Payment storage utility for NEDA Pay
// This utility stores payment transactions in localStorage for persistence

export interface PaymentTransaction {
  id: string;
  txHash: string;
  amount: string;
  currency: string;
  sender: string;
  recipient: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  walletAddress: string;
  description?: string;
  blockNumber?: number;
}

const STORAGE_KEY = 'neda_pay_payment_transactions';

// Get all payment transactions
export const getPaymentTransactions = (): PaymentTransaction[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to parse payment transactions:', error);
    return [];
  }
};

// Add a new payment transaction
export const addPaymentTransaction = (transaction: PaymentTransaction): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const transactions = getPaymentTransactions();
    transactions.unshift(transaction); // Add to beginning of array
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error('Failed to save payment transaction:', error);
  }
};

// Update a payment transaction
export const updatePaymentTransaction = (id: string, updates: Partial<PaymentTransaction>): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const transactions = getPaymentTransactions();
    const index = transactions.findIndex(tx => tx.id === id);
    
    if (index !== -1) {
      transactions[index] = { ...transactions[index], ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    }
  } catch (error) {
    console.error('Failed to update payment transaction:', error);
  }
};

// Get payment transactions for a specific wallet
export const getWalletPaymentTransactions = (walletAddress: string): PaymentTransaction[] => {
  const transactions = getPaymentTransactions();
  return transactions.filter(tx => tx.walletAddress.toLowerCase() === walletAddress.toLowerCase());
};

// Clear all payment transactions (for testing)
export const clearPaymentTransactions = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
};

// Add mock payment data for demonstration purposes
export const addMockPaymentData = (walletAddress: string): void => {
  if (typeof window === 'undefined') return;
  
  const now = Date.now();
  const mockTransactions: PaymentTransaction[] = [
    {
      id: 'payment-1',
      txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      amount: '100.00',
      currency: 'TSHC',
      sender: '0xabcdef1234567890abcdef1234567890abcdef12',
      recipient: walletAddress,
      timestamp: now - 86400000, // 1 day ago
      status: 'completed',
      walletAddress: walletAddress,
      description: 'Payment for services',
      blockNumber: 12345678
    },
    {
      id: 'payment-2',
      txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      amount: '50.00',
      currency: 'TSHC',
      sender: '0x1234567890abcdef1234567890abcdef12345678',
      recipient: walletAddress,
      timestamp: now - 172800000, // 2 days ago
      status: 'completed',
      walletAddress: walletAddress,
      description: 'Monthly subscription',
      blockNumber: 12345600
    },
    {
      id: 'payment-3',
      txHash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
      amount: '75.50',
      currency: 'TSHC',
      sender: walletAddress,
      recipient: '0x9876543210fedcba9876543210fedcba98765432',
      timestamp: now - 259200000, // 3 days ago
      status: 'completed',
      walletAddress: walletAddress,
      description: 'Utility payment',
      blockNumber: 12345500
    }
  ];
  
  mockTransactions.forEach(tx => addPaymentTransaction(tx));
};