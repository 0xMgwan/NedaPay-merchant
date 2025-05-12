# NEDA Pay Merchant Portal Dashboard

A robust, multi-chain merchant dashboard for the NEDA Pay ecosystem. Built with Next.js, React, ethers.js, wagmi, and Coinbase OnchainKit, it allows merchants to view real-time balances, connect wallets, and manage stablecoins across supported EVM networks.

---

## Table of Contents
- [Features](#features)
- [Aerodrome Swaps](#aerodrome-swaps)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Wallet Connection & Persistence](#wallet-connection--persistence)
- [Stablecoin Management](#stablecoin-management)
- [Smart Wallets](#smart-wallets)
- [Error Handling](#error-handling)
- [Deployment](#deployment)
- [Security](#security)
- [Contributing](#contributing)
- [FAQ](#faq)

---

## Features

- **Aerodrome DEX Integration:**
  - Robust, direct integration with Aerodrome for on-chain swaps.
  - Supports both stable and volatile pools, with automatic pool selection.
  - Accurate quote fetching and swap execution, using the official Aerodrome router and factory addresses.
  - All token amounts and outputs are formatted with the correct decimals for each stablecoin.

- **Multi-Wallet Support:**
  - Connect with MetaMask or Coinbase Wallet (via wagmi connectors).
  - Persistent wallet connection state across all pages.
  - ENS (.eth) and Base Name (.base) resolution for user-friendly display.
- **Stablecoin Balances:**
  - Real-time fetching of ERC-20 balances for supported stablecoins (e.g., cNGN, ZARP, EURC, etc.).
  - Each stablecoin entry now includes an explicit `decimals` field for precise formatting and conversion.
  - Shows all stablecoins, but only fetches balances for tokens deployed on the connected network.
- **Network Detection:**
  - Detects the connected network and prompts users to switch if not on Base Mainnet.
  - Only fetches balances for tokens on the current chain (using `chainId`).
- **Smart Wallets:**
  - Create and manage smart wallets for enhanced security and lower fees.
- **Error Handling:**
  - Per-token error icons and tooltips for contract call failures (e.g., missing `decimals()` function).
  - Suppresses uncaught contract errors in the browser console.
- **User Experience:**
  - Clean, modern UI with clear feedback for network and token issues.
  - Swap modal displays user-friendly quotes and output estimates, clamped to the correct number of decimals for each token.
  - Always displays all tokens, with '0' balance for those not on the current network.

---

## Aerodrome Swaps

- The dashboard integrates directly with the Aerodrome DEX for token swaps.
- Supports both stable and volatile pools, using the official Aerodrome router and factory.
- Swap modal fetches quotes and executes swaps with proper decimals for every supported stablecoin.
- Output estimates are always formatted for human readability, based on each token's decimals.

---

## Architecture

- **Frontend:** Next.js (App Router), React, Tailwind CSS
- **Wallets:** wagmi, ethers.js, Coinbase OnchainKit
- **State Management:** React Context (GlobalWalletContext)
- **Stablecoin Data:** TypeScript config in `app/data/stablecoins.ts`
- **Smart Wallets:** Simulated and real support (see `WalletSelector.tsx`)

### Key Files
- `app/components/WalletSelector.tsx` — Wallet connection, ENS/Base Name display, smart wallet creation
- `app/data/stablecoins.ts` — Supported stablecoins and chain config
- `app/utils/getBaseName.ts` — Utility for Base Name (.base) resolution
- `app/providers.tsx` — App-wide providers (wagmi, OnchainKit, etc.)

---

## Getting Started

### Prerequisites
- Node.js (>=18)
- npm, yarn, or pnpm

### Installation
```bash
cd merchant-portal
npm install
# or
yarn install
```

### Running Locally
```bash
npm run dev
# or
yarn dev
```
Visit [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables
- Configure RPC endpoints and wallet connection settings in `.env.local` if needed.
- No sensitive keys are stored in the frontend.

---

## Wallet Connection & Persistence

- Wallet connection state is persistent across all pages (MetaMask and Coinbase Wallet supported via wagmi and Coinbase OnchainKit).
- Users only need to connect once for the entire merchant dashboard session.
- **Connect Wallet:**
  - Use MetaMask or Coinbase Wallet.
  - Connection state is managed globally via `GlobalWalletContext`.
  - Users only need to connect once; state persists across navigation.
  - Wallet connection is stored in both `localStorage` and cookies for SSR compatibility.
  - Disconnecting clears state and storage.
- **ENS & Base Name Resolution:**
  - ENS names are resolved using OnchainKit (`useName` with chainId 1).
  - Base names are resolved via a custom hook and utility (`getBaseName`).
  - Fallback logic: `.base` > `.eth` > address.

---

## Stablecoin Management

- Each supported stablecoin is defined in `app/data/stablecoins.ts` with its correct on-chain decimals for accurate display and conversion.
- If you add a new stablecoin, ensure you specify its `decimals` value to guarantee proper quoting and formatting in the UI.
- All supported stablecoins are listed in `app/data/stablecoins.ts`.
- Each token includes a `chainId` property (e.g., `8453` for Base Mainnet, `11155111` for Sepolia Testnet).
- Only tokens matching the connected network are queried for balances.
- Real-time fetching using ethers.js and wagmi.
- UI displays all tokens, with '0' balance for those not on the current network.

---

## Smart Wallets
- Users can create a smart wallet for enhanced security and lower fees.
- **Production Deployment:** The NedaPaySmartWalletFactory contract is deployed and verified on Base Mainnet at:
  - `0x46358DA741d3456dBAEb02995979B2722C3b8722` ([View on Basescan](https://basescan.org/address/0x46358DA741d3456dBAEb02995979B2722C3b8722#code))
- **Frontend Integration:**
  - Update your environment variables or frontend config to use this contract address for all mainnet interactions.
  - Example: Add `NEXT_PUBLIC_FACTORY_ADDRESS=0x46358DA741d3456dBAEb02995979B2722C3b8722` to your `.env.local` file.
  - The factory contract supports smart wallet creation and management for NEDA Pay users.
- Creation is handled in `WalletSelector.tsx`.
- UI shows smart wallet status and allows switching between EOA and smart wallet.

---

## Error Handling
- Token contract errors (e.g., failed `decimals()` or `balanceOf`) are handled gracefully.
- UI shows a warning icon and tooltip for affected tokens.
- Errors are logged as warnings (not as uncaught exceptions).
- Wallet connection errors are caught and surfaced in the UI.

---

## Deployment
- Deploy to Vercel, Netlify, or your preferred provider.
- Ensure environment variables are set for production RPC endpoints.
- Static assets and frontend code only; no backend required.

---

## Security
- No private keys or sensitive credentials are stored in the frontend.
- All wallet interactions occur client-side via injected providers (MetaMask, Coinbase Wallet).
- Always verify addresses and transactions before proceeding.
- Never expose your seed phrase or private key.

---

## Contributing
1. Fork the repo and create your branch (`git checkout -b feature/my-feature`).
2. Commit your changes (`git commit -am 'Add new feature'`).
3. Push to the branch (`git push origin feature/my-feature`).
4. Create a Pull Request.

---

## FAQ

**Q: Why doesn't my .base name show up?**
- Ensure your wallet address has a registered .base name. The dashboard uses a custom utility to resolve Base Names. If not found, it falls back to ENS or address.

**Q: How do I add a new stablecoin?**
- Edit `app/data/stablecoins.ts` and add your token config. Make sure to specify the correct `chainId`.

**Q: Can I use other wallets?**
- Only MetaMask and Coinbase Wallet are supported out of the box, but wagmi can be extended for more connectors.

**Q: Is my wallet safe?**
- All wallet interactions are client-side. Never enter your seed phrase or private key anywhere on the dashboard.

**Q: How do I report a bug or request a feature?**
- Open an issue or pull request on GitHub.

---

For further questions or support, please open an issue on GitHub or contact the NEDA Pay team.
---

## License
MIT

---

## Contact
For support or questions, contact the NEDA Pay team at [https://nedapay.app](https://nedapay.app)
