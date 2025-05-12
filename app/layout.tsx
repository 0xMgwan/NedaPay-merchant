import '@coinbase/onchainkit/styles.css';
import type { Metadata } from 'next';
import './globals.css';
import './components/name-fallback.css';
import { Providers } from './providers';
import Footer from './components/Footer';
import AppToaster from './components/Toaster';

export const metadata: Metadata = {
  title: 'NEDA Pay Merchant Portal',
  description: 'Merchant dashboard for NEDA Pay stablecoin ecosystem',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-white dark:bg-black text-black dark:text-white">
        <div className="flex flex-col min-h-screen">
          <Providers>
            <AppToaster />
            <main className="flex-grow">{children}</main>
          </Providers>
          <Footer />
        </div>
      </body>
    </html>
  );
}
