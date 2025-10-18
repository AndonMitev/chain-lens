import { formatUnits } from 'viem';
import {
  BLOCKSCOUT_SUBDOMAIN,
  VIEM_CHAINS,
  type ChainId,
} from '@/lib/config/chains';

/**
 * Generate BlockScout URL for a transaction
 */
export function getBlockScoutTxUrl(
  txHash: string,
  chainId: ChainId = 1,
): string {
  const subdomain = BLOCKSCOUT_SUBDOMAIN[chainId];
  return `https://${subdomain}.blockscout.com/tx/${txHash}`;
}

/**
 * Generate BlockScout URL for an address
 */
export function getBlockScoutAddressUrl(
  address: string,
  chainId: ChainId = 1,
): string {
  const subdomain = BLOCKSCOUT_SUBDOMAIN[chainId];
  return `https://${subdomain}.blockscout.com/address/${address}`;
}

/**
 * Generate BlockScout URL for a block
 */
export function getBlockScoutBlockUrl(
  blockNumber: string | number,
  chainId: ChainId = 1,
): string {
  const subdomain = BLOCKSCOUT_SUBDOMAIN[chainId];
  return `https://${subdomain}.blockscout.com/block/${blockNumber}`;
}

/**
 * FIXED: Enhanced linkify function that properly handles markdown links
 * Avoids double-wrapping links that are already in markdown format
 */
export function linkifyOnchain(
  text: string,
  chainId?: number | string,
  shorten: boolean = true,
): string {
  const chain = (
    typeof chainId === 'number' ? chainId : parseInt(String(chainId), 10)
  ) as ChainId;

  // First, protect existing markdown links by replacing them with placeholders
  const linkPlaceholders: { placeholder: string; original: string }[] = [];
  let linkCounter = 0;

  // Match existing markdown links: [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match) => {
    const placeholder = `__LINK_PLACEHOLDER_${linkCounter++}__`;
    linkPlaceholders.push({ placeholder, original: match });
    return placeholder;
  });

  // Now process raw addresses and tx hashes that aren't already in links

  // Replace transaction hashes with markdown links (but only if not in backticks)
  text = text.replace(/(?<!`)\b(0x[a-fA-F0-9]{64})\b(?!`)/g, (match) => {
    const url = getBlockScoutTxUrl(match, chain);
    const displayHash = shorten
      ? `${match.slice(0, 10)}...${match.slice(-8)}`
      : match;
    return `[${displayHash}](${url})`;
  });

  // Replace addresses with markdown links (but only if not in backticks or already part of a tx hash)
  text = text.replace(
    /(?<!`|[a-fA-F0-9])\b(0x[a-fA-F0-9]{40})\b(?!`|[a-fA-F0-9])/g,
    (match) => {
      const url = getBlockScoutAddressUrl(match, chain);
      const displayAddr = shorten
        ? `${match.slice(0, 6)}...${match.slice(-4)}`
        : match;
      return `[${displayAddr}](${url})`;
    },
  );

  // Restore original markdown links from placeholders
  linkPlaceholders.forEach(({ placeholder, original }) => {
    text = text.replace(placeholder, original);
  });

  return text;
}

/**
 * Format an address for display (first 6 + last 4 chars)
 */
export function formatAddress(address: string): string {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format a transaction hash for display
 */
export function formatTxHash(hash: string): string {
  if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) return hash;
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Format a timestamp to human-readable format
 */
export function formatTimestamp(timestamp: number | string): string {
  const date = new Date(
    typeof timestamp === 'number' ? timestamp * 1000 : timestamp,
  );
  return date.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  });
}
