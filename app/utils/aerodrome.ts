import { ethers } from 'ethers';

// Aerodrome Router address on Base (replace with the official one if you have it)
// Official Aerodrome Router address on Base
export const AERODROME_ROUTER_ADDRESS = '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43';
// Official Aerodrome PoolFactory address on Base
export const AERODROME_FACTORY_ADDRESS = '0x420DD381b31aEf6683db6B902084cB0FFECe40Da';
// Official AERO token address on Base (for reference)
export const AERO_TOKEN_ADDRESS = '0x940181a94A35A4569E4529A3CDfB74e38FD98631';

// Minimal ABI for quoting and swapping (expand as needed)
export const AERODROME_ROUTER_ABI = [
  // getAmountsOut
  {
    "inputs": [
      { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
      { "components": [
        { "internalType": "address", "name": "from", "type": "address" },
        { "internalType": "address", "name": "to", "type": "address" },
        { "internalType": "bool", "name": "stable", "type": "bool" },
        { "internalType": "address", "name": "factory", "type": "address" }
      ], "internalType": "struct IRouter.Route[]", "name": "routes", "type": "tuple[]" }
    ],
    "name": "getAmountsOut",
    "outputs": [ { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" } ],
    "stateMutability": "view",
    "type": "function"
  },
  // swapExactTokensForTokens (typical signature, update if Aerodrome's is different)
  {
    "inputs": [
      { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
      { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
      { "components": [
        { "internalType": "address", "name": "from", "type": "address" },
        { "internalType": "address", "name": "to", "type": "address" },
        { "internalType": "bool", "name": "stable", "type": "bool" },
        { "internalType": "address", "name": "factory", "type": "address" }
      ], "internalType": "struct IRouter.Route[]", "name": "routes", "type": "tuple[]" },
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "deadline", "type": "uint256" }
    ],
    "name": "swapExactTokensForTokens",
    "outputs": [ { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" } ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Utility to get a quote for a swap
export async function getAerodromeQuote({
  provider,
  amountIn,
  fromToken,
  toToken,
  stable = true,
  factory
}: {
  provider: ethers.providers.Provider,
  amountIn: string,
  fromToken: string,
  toToken: string,
  stable?: boolean,
  factory: string
}) {
  const router = new ethers.Contract(AERODROME_ROUTER_ADDRESS, AERODROME_ROUTER_ABI, provider);
  const routes = [{ from: fromToken, to: toToken, stable, factory }];
  const amounts = await router.getAmountsOut(amountIn, routes);
  return amounts;
}

// Utility to perform the swap
export async function swapAerodrome({
  signer,
  amountIn,
  amountOutMin,
  fromToken,
  toToken,
  stable = true,
  factory,
  userAddress,
  deadline
}: {
  signer: ethers.Signer,
  amountIn: string,
  amountOutMin: string,
  fromToken: string,
  toToken: string,
  stable?: boolean,
  factory: string,
  userAddress: string,
  deadline: number
}) {
  const router = new ethers.Contract(AERODROME_ROUTER_ADDRESS, AERODROME_ROUTER_ABI, signer);
  const routes = [{ from: fromToken, to: toToken, stable, factory }];
  // Approve the router to spend fromToken if needed (handled outside this util)
  const tx = await router.swapExactTokensForTokens(
    amountIn,
    amountOutMin,
    routes,
    userAddress,
    deadline
  );
  return tx;
}
