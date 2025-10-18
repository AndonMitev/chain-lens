import {
  mainnet,
  base,
  optimism,
  arbitrum,
  polygon,
  type Chain,
} from 'viem/chains';

// Chain ID type - use typeof to stay in sync with viem
export type ChainId =
  | typeof mainnet.id
  | typeof base.id
  | typeof optimism.id
  | typeof arbitrum.id
  | typeof polygon.id;

/**
 * Map of chain IDs to their viem chain objects
 */
export const VIEM_CHAINS: Record<ChainId, Chain> = {
  [mainnet.id]: mainnet,
  [base.id]: base,
  [optimism.id]: optimism,
  [arbitrum.id]: arbitrum,
  [polygon.id]: polygon,
};

/**
 * Map of chain IDs to BlockScout subdomains
 * Used for generating BlockScout explorer URLs
 */
export const BLOCKSCOUT_SUBDOMAIN: Record<ChainId, string> = {
  [mainnet.id]: 'eth',
  [base.id]: 'base',
  [optimism.id]: 'optimism',
  [arbitrum.id]: 'arbitrum',
  [polygon.id]: 'polygon',
};

/**
 * Map of chain IDs to human-readable chain names
 * Extracted from viem chain objects
 */
export const CHAIN_NAMES: Record<ChainId, string> = {
  [mainnet.id]: mainnet.name,
  [base.id]: base.name,
  [optimism.id]: optimism.name,
  [arbitrum.id]: arbitrum.name,
  [polygon.id]: polygon.name,
};

/**
 * Array of all supported chains
 * Useful for iterations and listings
 */
export const SUPPORTED_CHAINS = [
  { name: mainnet.name, id: mainnet.id },
  { name: base.name, id: base.id },
  { name: optimism.name, id: optimism.id },
  { name: arbitrum.name, id: arbitrum.id },
  { name: polygon.name, id: polygon.id },
] as { name: string; id: number }[];
