'use client';

import { base } from 'wagmi/chains';
import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';
import { WagmiProvider, createConfig, http, fallback } from 'wagmi';
import { coinbaseWallet, metaMask } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
    [base.id]: fallback([
      http(process.env.NEXT_PUBLIC_COINBASE_BASE_RPC || 'https://api.developer.coinbase.com/rpc/v1/base/n4RnEAzBQtErAI53dP6DCa6l6HRGODgV'),
      http('https://mainnet.base.org'),
      http('https://base-mainnet.g.alchemy.com/v2/demo'),
      http('https://base.llamarpc.com'),
      http('https://1rpc.io/base')
    ]),
  },
});

export function Providers(props: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {props.children}
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
