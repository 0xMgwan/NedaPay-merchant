import { ethers } from 'ethers';

export const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function balanceOf(address owner) view returns (uint256)'
];

export async function checkAllowance({
  token,
  owner,
  spender,
  provider
}: {
  token: string,
  owner: string,
  spender: string,
  provider: ethers.providers.Provider
}) {
  const contract = new ethers.Contract(token, ERC20_ABI, provider);
  return await contract.allowance(owner, spender);
}

export async function approveToken({
  token,
  spender,
  amount,
  signer
}: {
  token: string,
  spender: string,
  amount: string,
  signer: ethers.Signer
}) {
  const contract = new ethers.Contract(token, ERC20_ABI, signer);
  const tx = await contract.approve(spender, amount);
  return tx;
}
