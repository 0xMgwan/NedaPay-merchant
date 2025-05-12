'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white dark:bg-gray-900">
      <div className="text-center max-w-md mx-auto px-4">
        <h1 className="text-6xl font-bold text-red-500 mb-6">Error</h1>
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-4">
          Something went wrong
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mb-8">
          We apologize for the inconvenience. Please try again later.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
          >
            Try Again
          </button>
          <Link 
            href="/"
            className="inline-flex items-center justify-center px-5 py-3 border border-primary text-base font-medium rounded-md text-primary bg-transparent hover:bg-primary/10"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
