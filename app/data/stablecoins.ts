// Stablecoins data from stablecoins.earth
export const stablecoins = [
  {
    region: 'Tanzania',
    flag: '🇹🇿',
    currency: 'TZS',
    baseToken: 'TSHC',
    name: 'Tanzania Shilling Coin',
    address: '0x123456789abcdef123456789abcdef123456789a', // Placeholder address
    issuer: 'NEDA Pay',
    description: 'Stablecoin pegged 1:1 to the Tanzania Shilling (TZS)',
    website: 'https://nedapay.app',
    chainId: 11155111 // Sepolia Testnet
  },
  {
    region: 'Nigeria',
    flag: '🇳🇬',
    currency: 'NGN',
    baseToken: 'cNGN',
    name: 'Nigerian Naira Coin',
    address: '0x46C85152bFe9f96829aA94755D9f915F9B10EF5F', // Updated to correct cNGN address
    issuer: 'Convexity',
    description: 'Stablecoin pegged 1:1 to the Nigerian Naira (NGN)',
    website: 'https://stablecoins.earth',
    chainId: 8453, // Base Mainnet
    decimals: 6
  },
  {
    region: 'Nigeria',
    flag: '🇳🇬',
    currency: 'NGN',
    baseToken: 'NGNC',
    decimals: 18,
    name: 'Nigerian Naira Coin',
    address: '0xe743f13623e000261b634f0e5676f294475ec24d', // Updated NGNC address
    issuer: 'Link',
    description: 'Stablecoin pegged 1:1 to the Nigerian Naira (NGN)',
    website: 'https://stablecoins.earth',
    chainId: 8453 // Base Mainnet
  },
  {
    region: 'South Africa',
    flag: '🇿🇦',
    currency: 'ZAR',
    baseToken: 'ZARP',
    decimals: 18,
    name: 'South African Rand Coin',
    address: '0xb755506531786C8aC63B756BaB1ac387bACB0C04', // Updated ZARP address
    issuer: 'inv.es',
    description: 'Stablecoin pegged 1:1 to the South African Rand (ZAR)',
    website: 'https://stablecoins.earth',
    chainId: 8453 // Base Mainnet
  },
  {
    region: 'Indonesia',
    flag: '🇮🇩',
    currency: 'IDR',
    baseToken: 'IDRX',
    name: 'Indonesian Rupiah Coin',
    address: '0x18Bc5bcC660cf2B9cE3cd51a404aFe1a0cBD3C22', // Updated to correct IDRX address
    issuer: 'IDRX.co',
    description: 'Stablecoin pegged 1:1 to the Indonesian Rupiah (IDR)',
    website: 'https://stablecoins.earth',
    chainId: 8453, // Base Mainnet
    decimals: 2
  },
  {
    region: 'Europe',
    flag: '🇪🇺',
    currency: 'EUR',
    baseToken: 'EURC',
    decimals: 6,
    name: 'Euro Coin',
    address: '0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42', // EURC address confirmed
    issuer: 'Circle',
    description: 'Stablecoin pegged 1:1 to the Euro (EUR)',
    website: 'https://stablecoins.earth',
    chainId: 8453 // Base Mainnet
  },
  {
    region: 'Canada',
    flag: '🇨🇦',
    currency: 'CAD',
    baseToken: 'CADC',
    decimals: 18,
    name: 'Canadian Dollar Coin',
    address: '0x043eB4B75d0805c43D7C834902E335621983Cf03', // CADC address confirmed
    issuer: 'PayTrie',
    description: 'Stablecoin pegged 1:1 to the Canadian Dollar (CAD)',
    website: 'https://stablecoins.earth',
    chainId: 8453 // Base Mainnet
  },
  {
    region: 'Brazil',
    flag: '🇧🇷',
    currency: 'BRL',
    baseToken: 'BRL',
    decimals: 18,
    name: 'Brazilian Real Coin',
    address: '0x043eB4B75d0805c43D7C834902E335621983Cf03', // CADC address confirmed
    issuer: 'Transfero',
    description: 'Stablecoin pegged 1:1 to the Brazilian Real (BRL)',
    website: 'https://stablecoins.earth',
    chainId: 8453 // Base Mainnet
  },
  {
    region: 'Turkey',
    flag: '🇹🇷',
    currency: 'TRY',
    baseToken: 'TRYB',
    decimals: 6,
    name: 'Turkish Lira Coin',
    address: '0x043eB4B75d0805c43D7C834902E335621983Cf03', // CADC address confirmed
    issuer: 'BiLira',
    description: 'Stablecoin pegged 1:1 to the Turkish Lira (TRY)',
    website: 'https://stablecoins.earth',
    chainId: 8453 // Base Mainnet
  },
  {
    region: 'New Zealand',
    flag: '🇳🇿',
    currency: 'NZD',
    baseToken: 'NZDD',
    decimals: 6,
    name: 'New Zealand Dollar Coin',
    address: '0x2dD087589ce9C5b2D1b42e20d2519B3c8cF022b7', // NZD address confirmed
    issuer: 'Easy Crypto',
    description: 'Stablecoin pegged 1:1 to the New Zealand Dollar (NZD)',
    website: 'https://stablecoins.earth',
    chainId: 8453 // Base Mainnet
  },
  {
    region: 'Mexico',
    flag: '🇲🇽',
    currency: 'MXN',
    baseToken: 'MXNe',
    decimals: 6,
    name: 'Mexican Peso Coin',
    address: '0x043eB4B75d0805c43D7C834902E335621983Cf03', // CADC address confirmed
    issuer: 'Etherfuse/Brale',
    description: 'Stablecoin pegged 1:1 to the Mexican Peso (MXN)',
    website: 'https://stablecoins.earth',
    decimals: 6
  },
  {
    region: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    baseToken: 'USDC',
    name: 'USD Coin',
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base Mainnet
    issuer: 'Circle',
    description: 'USD-backed stablecoin by Circle (Base Mainnet)',
    website: 'https://www.circle.com/usdc',
    chainId: 8453, // Base Mainnet
    decimals: 6
  }
];

// Mock balances for demonstration purposes
export const mockBalances = {
  'TSHC': '25,000',
  'cNGN': '8,500',
  'IDRX': '12,000'
};

// Mock transaction data
export const mockTransactions = [
  { 
    id: '0x123abc456def789ghi0123456789abcdef0123', 
    shortId: '0x123...abc',
    date: '2025-04-11 10:23', 
    amount: '5,000', 
    currency: 'TSHC', 
    status: 'Completed', 
    customer: 'John Doe',
    sender: '0x7890abcdef123456789abcdef123456789abcde',
    senderShort: '0x789...cde',
    blockExplorerUrl: 'https://basescan.org/tx/0x123abc456def789ghi0123456789abcdef0123'
  },
  { 
    id: '0x456def789ghi0123456789abcdef0123456789', 
    shortId: '0x456...def',
    date: '2025-04-10 15:45', 
    amount: '2,500', 
    currency: 'cNGN', 
    status: 'Completed', 
    customer: 'Jane Smith',
    sender: '0xabcdef123456789abcdef123456789abcdef01',
    senderShort: '0xabc...f01',
    blockExplorerUrl: 'https://basescan.org/tx/0x456def789ghi0123456789abcdef0123456789'
  },
  { 
    id: '0x789ghi0123456789abcdef0123456789abcdef', 
    shortId: '0x789...ghi',
    date: '2025-04-10 09:12', 
    amount: '10,000', 
    currency: 'TSHC', 
    status: 'Completed', 
    customer: 'Acme Corp',
    sender: '0xdef123456789abcdef123456789abcdef01234',
    senderShort: '0xdef...234',
    blockExplorerUrl: 'https://basescan.org/tx/0x789ghi0123456789abcdef0123456789abcdef'
  },
  { 
    id: '0xabc0123456789abcdef0123456789abcdef0123', 
    shortId: '0xabc...123',
    date: '2025-04-09 14:30', 
    amount: '1,200', 
    currency: 'IDRX', 
    status: 'Completed', 
    customer: 'Bob Johnson',
    sender: '0x123456789abcdef123456789abcdef12345678',
    senderShort: '0x123...678',
    blockExplorerUrl: 'https://basescan.org/tx/0xabc0123456789abcdef0123456789abcdef0123'
  },
  { 
    id: '0xdef0123456789abcdef0123456789abcdef0123', 
    shortId: '0xdef...456',
    date: '2025-04-09 11:05', 
    amount: '7,500', 
    currency: 'TSHC', 
    status: 'Completed', 
    customer: 'Tech Solutions Ltd',
    sender: '0x456789abcdef123456789abcdef123456789ab',
    senderShort: '0x456...9ab',
    blockExplorerUrl: 'https://basescan.org/tx/0xdef0123456789abcdef0123456789abcdef0123'
  },
  { 
    id: '0xghi0123456789abcdef0123456789abcdef0123', 
    shortId: '0xghi...789',
    date: '2025-04-08 16:20', 
    amount: '3,800', 
    currency: 'cNGN', 
    status: 'Completed', 
    customer: 'Sarah Williams',
    sender: '0x789abcdef123456789abcdef123456789abcde',
    senderShort: '0x789...cde',
    blockExplorerUrl: 'https://basescan.org/tx/0xghi0123456789abcdef0123456789abcdef0123'
  },
  { 
    id: '0xjkl0123456789abcdef0123456789abcdef0123', 
    shortId: '0xjkl...012',
    date: '2025-04-08 09:45', 
    amount: '4,200', 
    currency: 'TSHC', 
    status: 'Completed', 
    customer: 'Global Traders',
    sender: '0xabcdef123456789abcdef123456789abcdef01',
    senderShort: '0xabc...f01',
    blockExplorerUrl: 'https://basescan.org/tx/0xjkl0123456789abcdef0123456789abcdef0123'
  },
  { 
    id: '0xmno0123456789abcdef0123456789abcdef0123', 
    shortId: '0xmno...345',
    date: '2025-04-07 14:15', 
    amount: '6,300', 
    currency: 'IDRX', 
    status: 'Completed', 
    customer: 'Local Market',
    sender: '0xdef123456789abcdef123456789abcdef01234',
    senderShort: '0xdef...234',
    blockExplorerUrl: 'https://basescan.org/tx/0xmno0123456789abcdef0123456789abcdef0123'
  },
  { 
    id: '0xpqr0123456789abcdef0123456789abcdef0123', 
    shortId: '0xpqr...678',
    date: '2025-04-07 10:30', 
    amount: '9,100', 
    currency: 'TSHC', 
    status: 'Completed', 
    customer: 'David Miller',
    sender: '0x123456789abcdef123456789abcdef12345678',
    senderShort: '0x123...678',
    blockExplorerUrl: 'https://basescan.org/tx/0xpqr0123456789abcdef0123456789abcdef0123'
  },
  { 
    id: '0xstu0123456789abcdef0123456789abcdef0123', 
    shortId: '0xstu...901',
    date: '2025-04-06 17:40', 
    amount: '1,800', 
    currency: 'cNGN', 
    status: 'Completed', 
    customer: 'Emma Davis',
    sender: '0x456789abcdef123456789abcdef123456789ab',
    senderShort: '0x456...9ab',
    blockExplorerUrl: 'https://basescan.org/tx/0xstu0123456789abcdef0123456789abcdef0123'
  }
];
