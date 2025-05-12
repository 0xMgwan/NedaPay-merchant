'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';

export default function Footer() {
  const { theme } = useTheme();
  return (
    <footer className="bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 py-12">
      <div className="container mx-auto max-w-3xl px-4 flex flex-col items-center justify-center text-center">
        {/* Logo and Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-2xl">N</div>
          <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">NEDA Pay</span>
        </div>
        {/* Tagline */}
        <div className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-2xl">
          Empowering merchants to accept stablecoin payments easily and securely—anywhere, anytime.
        </div>
        {/* Social Links */}
        <div className="flex space-x-8 mt-2">
          {/* X (Twitter) */}
          <a href="https://x.com/NedaLabs" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition">
            <svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.26 3H21.5l-7.36 8.39L22.5 21h-6.69l-5.21-6.28L4.5 21H1.25l7.93-9.04L1.5 3h6.82l4.76 5.75L18.26 3zm-1.01 15.19h1.85L7.21 4.62H5.27l12.98 13.57z"/>
            </svg>
          </a>
          {/* Medium */}
          <a href="https://medium.com/@nedalabs" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition">
            <svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 6.61c.02-.2-.06-.4-.22-.53L.27 4.09V3.82h6.16l4.75 10.41L15.24 3.82h5.86v.27l-1.49 1.43c-.13.1-.19.26-.15.42v12.2c-.04.16.02.32.15.42l1.46 1.43v.27h-8.27v-.27l1.51-1.46c.15-.15.15-.19.15-.42V8.45l-4.21 10.41h-.57L3.19 8.45v7.89c-.04.3.06.6.28.81l1.96 2.39v.27H.23v-.27l1.96-2.39c.21-.21.31-.51.28-.81V6.61z"/>
            </svg>
          </a>
          {/* GitHub */}
          <a href="https://github.com/0xMgwan/NedaPay/tree/main/merchant-portal" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition">
            <svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.5 2.87 8.32 6.84 9.67.5.09.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.36-3.37-1.36-.45-1.17-1.1-1.48-1.1-1.48-.9-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.36-2.22-.26-4.56-1.14-4.56-5.05 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.28 2.75 1.05A9.18 9.18 0 0 1 12 7.62c.85.01 1.7.12 2.5.34 1.91-1.33 2.75-1.05 2.75-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.92-2.34 4.78-4.57 5.04.36.32.68.95.68 1.91 0 1.38-.01 2.5-.01 2.84 0 .27.18.58.69.48A10.02 10.02 0 0 0 22 12.26C22 6.58 17.52 2 12 2z"/>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
