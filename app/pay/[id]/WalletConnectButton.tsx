"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Dynamically import WalletConnectProvider only on client
const WalletConnectProvider = dynamic(
  () => import("@walletconnect/web3-provider"),
  { ssr: false }
);

export default function WalletConnectButton({ to, amount, currency }: { to: string; amount: string; currency: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWalletConnect = async () => {
    setError(null);
    setLoading(true);
    try {
      const WalletConnectProvider = (await import("@walletconnect/web3-provider")).default;
      const provider = new WalletConnectProvider({
        rpc: {
          1: "https://mainnet.infura.io/v3/0ba1867b1fc0af11b0cf14a0ec8e5b0f", // User's Infura Project ID
        },
      });
      await provider.enable();
      // Use ethers.js with WalletConnect provider
      const { ethers } = await import("ethers");
      const web3Provider = new ethers.providers.Web3Provider(provider);
      const signer = web3Provider.getSigner();
      // Send transaction (native ETH for now)
      const tx = await signer.sendTransaction({
        to,
        value: ethers.utils.parseEther(amount || "0"),
      });
      await tx.wait();
      setLoading(false);
    } catch (e: any) {
      setError(e.message || "WalletConnect transaction failed");
      setLoading(false);
    }
  };

  return (
    <div className="mt-2 text-center">
      <button
        onClick={handleWalletConnect}
        disabled={loading}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition disabled:opacity-60"
      >
        {loading ? "Connecting..." : "Pay with WalletConnect"}
      </button>
      {error && <div className="mt-2 text-red-600 dark:text-red-400">{error}</div>}
    </div>
  );
}
