import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { isHex, isAddress as viemIsAddress, getAddress } from 'viem';
import {
  VIEM_CHAINS,
  BLOCKSCOUT_SUBDOMAIN,
  CHAIN_NAMES,
  SUPPORTED_CHAINS,
  type ChainId,
} from '@/lib/config/chains';

// Re-export formatters
export {
  formatAddress,
  formatTxHash,
  capitalize,
  formatTimestamp,
  linkifyOnchain,
  getBlockScoutTxUrl,
  getBlockScoutAddressUrl,
  getBlockScoutBlockUrl,
} from './formatters';

// Re-export chain config
export {
  VIEM_CHAINS,
  BLOCKSCOUT_SUBDOMAIN,
  CHAIN_NAMES,
  SUPPORTED_CHAINS,
  type ChainId,
} from '@/lib/config/chains';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get chain object from chain ID
 */
export function getChainFromId(chainId: ChainId): any {
  return VIEM_CHAINS[chainId] || VIEM_CHAINS[1];
}

/**
 * Get BlockScout subdomain for a chain
 */
export function getBlockScoutSubdomain(chainId: ChainId): string {
  return BLOCKSCOUT_SUBDOMAIN[chainId] || 'eth';
}

/**
 * Get chain name from chain ID
 */
export function getChainName(chainId: ChainId): string {
  return CHAIN_NAMES[chainId] || 'Unknown Chain';
}
