"use client";

export const dynamic = "force-dynamic";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import dynamicImport from "next/dynamic";
import { useAccount } from "wagmi";
import { utils } from "ethers";

const PaymentQRCode = dynamicImport(() => import("./QRCode"), { ssr: false });
const PayWithWallet = dynamicImport(() => import("./PayWithWallet"), { ssr: false });


export default function PayPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);
  const amount = searchParams.get("amount");
  const currency = searchParams.get("currency");
  const { address: connectedAddress } = useAccount();
  let to = searchParams.get("to");

  // Validate 'to', fallback to connected wallet if invalid
  if (!to || !utils.isAddress(to)) {
    to = connectedAddress || "";
  }

  useEffect(() => {
    setCopied(false);
  }, [to]);

  const handleCopy = () => {
    if (to) {
      navigator.clipboard.writeText(to);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white dark:bg-gray-900 dark:text-white">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-center text-blue-700 dark:text-blue-300">
          Pay Merchant
        </h1>
        <div className="mb-4 text-center">
          <span className="text-lg font-medium">Amount:</span>
          <span className="ml-2 text-xl font-bold">{amount} {currency}</span>
        </div>
        <div className="mb-6 text-center flex flex-col items-center gap-2">
          <span className="text-lg font-medium">Merchant Wallet:</span>
          <span className="font-mono text-blue-900 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded select-all">{to}</span>
          <button
            onClick={handleCopy}
            className="mt-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <PaymentQRCode to={to || ''} amount={amount || ''} currency={currency || ''} />
        <PayWithWallet to={to || ''} amount={amount || ''} currency={currency || ''} />
        <div className="text-center mt-4">
          <a
            href={`https://basescan.org/address/${to}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
          >
            View on BaseScan
          </a>
        </div>
        <div className="mt-6 text-center text-gray-500 dark:text-gray-400 text-sm">
          Please send exactly <span className="font-bold">{amount} {currency}</span> to the merchant wallet above. After payment, the merchant will confirm your transaction.
        </div>
      </div>
    </div>
  );
}
