'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { base } from 'wagmi/chains';
import { coinbaseWallet, metaMask } from 'wagmi/connectors';
import AnalyticsContent from './AnalyticsContent';

// Create a query client for React Query
const queryClient = new QueryClient();

// Configure wagmi with all supported wallet connectors
const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      appName: 'NEDA Pay Merchant',
    }),
    metaMask()
  ],
  ssr: true,
  transports: {
    [base.id]: http(),
  },
});

export default function AnalyticsWrapper() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AnalyticsContent />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
