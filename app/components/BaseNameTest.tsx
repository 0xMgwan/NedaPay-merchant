'use client';

import { Name } from '@coinbase/onchainkit/identity';
import { base } from 'viem/chains';

interface BaseNameTestProps {
  address: string;
}

/**
 * A test component that follows the Base documentation exactly
 * https://docs.base.org/builderkits/onchainkit/identity/name
 */
export default function BaseNameTest({ address }: BaseNameTestProps) {
  // This is exactly as shown in the documentation
  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-bold mb-2">Base Name Test Component</h3>
      <p className="mb-2">Address: {address}</p>
      <div className="mb-2">
        <strong>Name Component Output:</strong>
        <div className="p-2 bg-gray-100 rounded">
          <Name address={address as `0x${string}`} chain={base} />
        </div>
      </div>
    </div>
  );
}
