"use client";
import { QRCodeSVG } from "qrcode.react";
import { stablecoins } from "../../data/stablecoins";
import { utils } from "ethers";

export default function PaymentQRCode({ to, amount, currency }: { to: string; amount: string; currency: string }) {
  // Validate recipient address
  let isValidAddress = false;
  try {
    isValidAddress = !!to && utils.isAddress(to);
  } catch {
    isValidAddress = false;
  }

  if (!isValidAddress) {
    return (
      <div className="flex flex-col items-center my-6">
        <div className="text-red-600 dark:text-red-400 font-semibold">Invalid merchant address</div>
      </div>
    );
  }

  // Find token address for ERC-20 tokens
  const token = stablecoins.find(
    (sc) => sc.baseToken.toLowerCase() === currency?.toLowerCase() || sc.currency.toLowerCase() === currency?.toLowerCase()
  );
  let qrValue = "";
  if (token && token.address && token.address !== "0x0000000000000000000000000000000000000000") {
    // ERC-20 EIP-681 format
    // Default decimals to 18 for now
    const decimals = 18;
    let amountInWei = "";
    try {
      amountInWei = utils.parseUnits(amount || "0", decimals).toString();
    } catch {
      amountInWei = "0";
    }
    qrValue = `ethereum:${token.address}/transfer?address=${to}&uint256=${amountInWei}`;
  } else {
    // Fallback to native ETH/coin transfer
    let amountInWei = "";
    try {
      amountInWei = utils.parseEther(amount || "0").toString();
    } catch {
      amountInWei = "0";
    }
    qrValue = `ethereum:${to}?value=${amountInWei}`;
  }

  return (
    <div className="flex flex-col items-center my-6">
      <QRCodeSVG value={qrValue} size={160} level="M" includeMargin />
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Scan with wallet app</div>
    </div>
  );
}

