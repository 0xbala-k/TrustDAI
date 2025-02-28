/**
 * Utility functions for formatting values in the TrustDAI application
 */

/**
 * Truncates an Ethereum address for display
 * @param address Full Ethereum address
 * @param start Number of characters to show at the start
 * @param end Number of characters to show at the end
 * @returns Truncated address with ellipsis
 */
export const truncateAddress = (address?: string, start = 6, end = 4): string => {
  if (!address) return '';
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

/**
 * Formats a crypto balance with appropriate precision
 * @param balance Balance as a string or number
 * @param decimals Number of decimals to display
 * @param symbol Optional symbol to append
 * @returns Formatted balance string
 */
export const formatBalance = (balance?: string | number, decimals = 4, symbol?: string): string => {
  if (balance === undefined || balance === null) return '0';
  
  // Convert to number and handle scientific notation
  const num = typeof balance === 'string' ? parseFloat(balance) : balance;
  
  // Handle very small numbers differently
  if (num > 0 && num < 0.0001) {
    return `<0.0001${symbol ? ` ${symbol}` : ''}`;
  }
  
  // Format the number with fixed decimals
  const formatted = num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
  
  return symbol ? `${formatted} ${symbol}` : formatted;
};

/**
 * Formats a timestamp to a readable date
 * @param timestamp ISO string or epoch timestamp
 * @param includeTime Whether to include the time
 * @returns Formatted date string
 */
export const formatDate = (timestamp?: string | number, includeTime = false): string => {
  if (!timestamp) return '';
  
  const date = typeof timestamp === 'string' 
    ? new Date(timestamp) 
    : new Date(timestamp);
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime && { hour: '2-digit', minute: '2-digit' })
  };
  
  return date.toLocaleDateString(undefined, options);
};

/**
 * Creates a properly formatted web3 link using Web3URL standards
 * @param cid Content identifier or file path
 * @param filename Optional filename to use in the path
 * @returns Direct, clickable link to the file in EthStorage
 */
export const formatWeb3Link = (cid: string, filename?: string): string => {
  if (!cid) return '';
  return getShareableUrl(cid, filename);
};

/**
 * Generates a shareable URL for a file using Web3URL format
 * @param cid Content identifier or file path
 * @param filename Optional filename to use in the path
 * @returns Shareable Web3URL that can be opened in a browser
 */
export const getShareableUrl = (cid: string, filename?: string): string => {
  if (!cid) return '';
  
  // Get EthStorage gateway endpoint - ensure it DOES NOT end with a slash
  const ethStorageEndpoint = (import.meta.env.VITE_ETHSTORAGE_ENDPOINT || 'https://eth.sep.w3link.io').replace(/\/$/, '');
  
  // Get FlatDirectory contract address from environment variables
  const flatDirectoryAddress = import.meta.env.VITE_FLAT_DIRECTORY_ADDRESS;
  
  // For ENS names
  const ensName = import.meta.env.VITE_ENS_NAME;
  
  // Create file path - use filename if provided, otherwise use CID as filename
  const filePath = filename || cid;
  
  // W3link gateway has two formats:
  // 1. Subdomain format: https://[contractAddress].[network].w3link.io/[path]
  // 2. Path format: https://eth.sep.w3link.io/ethereum:[contractAddress]/[path]
  
  // First, try the subdomain format which may work better
  const useAlternateFormat = import.meta.env.VITE_USE_SUBDOMAIN_FORMAT === 'true';
  
  // If we have an ENS name, use that for more user-friendly URLs
  if (ensName) {
    return `${ethStorageEndpoint}/${ensName}/${filePath}`;
  }
  
  // If we have a FlatDirectory contract address, use the correct format
  if (flatDirectoryAddress) {
    if (useAlternateFormat) {
      // Try subdomain format: https://[contractAddress].sep.w3link.io/[path]
      // Extract parts from the endpoint
      const urlParts = ethStorageEndpoint.split('//');
      const protocol = urlParts[0] + '//';
      const domainParts = urlParts[1].split('.');
      
      // If the endpoint is eth.sep.w3link.io, we can use contract.sep.w3link.io
      if (domainParts.length >= 3 && domainParts[1] === 'sep' && domainParts[2] === 'w3link') {
        // Replace the first part (eth) with the contract address
        domainParts[0] = flatDirectoryAddress.toLowerCase().replace('0x', '');
        return `${protocol}${domainParts.join('.')}/${filePath}`;
      }
    }
    
    // Default to path format: https://eth.sep.w3link.io/ethereum:[address]/[path]
    return `${ethStorageEndpoint}/ethereum:${flatDirectoryAddress}/${filePath}`;
  }
  
  // Fallback: For IPFS CIDs, use the ipfs prefix
  if (cid.startsWith('Qm')) {
    return `${ethStorageEndpoint}/ipfs/${cid}`;
  }
  
  // Last resort fallback - direct gateway path
  return `${ethStorageEndpoint}/${cid}`;
};

/**
 * Opens a web3 link directly
 * @param cid Content identifier or file path
 * @param filename Optional filename to use in the path
 */
export const openWeb3Link = (cid: string, filename?: string): void => {
  const url = getShareableUrl(cid, filename);
  window.open(url, '_blank');
};

/**
 * Formats a file size in bytes to human-readable form
 * @param bytes Size in bytes
 * @param decimals Number of decimals to display
 * @returns Formatted file size
 */
export const formatFileSize = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}; 