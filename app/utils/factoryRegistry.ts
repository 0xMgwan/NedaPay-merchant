import { ethers } from 'ethers';

// Aerodrome Factory Registry address on Base
export const FACTORY_REGISTRY_ADDRESS = '0x5C3F18F06CC09CA1910767A34a20F771039E37C0';

export const FACTORY_REGISTRY_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "tokenA", "type": "address" },
      { "internalType": "address", "name": "tokenB", "type": "address" },
      { "internalType": "bool", "name": "stable", "type": "bool" }
    ],
    "name": "getFactory",
    "outputs": [ { "internalType": "address", "name": "factory", "type": "address" } ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "tokenA", "type": "address" },
      { "internalType": "address", "name": "tokenB", "type": "address" },
      { "internalType": "bool", "name": "stable", "type": "bool" }
    ],
    "name": "getPoolFactory",
    "outputs": [ { "internalType": "address", "name": "factory", "type": "address" } ],
    "stateMutability": "view",
    "type": "function"
  }
];

export async function getFactoryForPair({
  provider,
  tokenA,
  tokenB,
  stable
}: {
  provider: ethers.providers.Provider,
  tokenA: string,
  tokenB: string,
  stable: boolean
}): Promise<string> {
  const registry = new ethers.Contract(FACTORY_REGISTRY_ADDRESS, FACTORY_REGISTRY_ABI, provider);
  try {
    const factory = await registry.getFactory(tokenA, tokenB, stable);
    console.log('[FactoryRegistry] getFactory succeeded:', factory);
    return factory;
  } catch (err1) {
    console.warn('[FactoryRegistry] getFactory failed, trying getPoolFactory', err1);
    try {
      const factory = await registry.getPoolFactory(tokenA, tokenB, stable);
      console.log('[FactoryRegistry] getPoolFactory succeeded:', factory);
      return factory;
    } catch (err2) {
      console.error('[FactoryRegistry] Both getFactory and getPoolFactory failed', err1, err2);
      throw new Error('Unable to fetch pool factory from registry');
    }
  }
}
