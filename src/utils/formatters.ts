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
 * Creates a short web3 link from a CID
 * @param cid Content identifier
 * @param prefix Protocol prefix
 * @returns Formatted web3 link
 */
export const formatWeb3Link = (cid: string, prefix = 'trustdai://'): string => {
  if (!cid) return '';
  return `${prefix}${cid.substring(0, 8)}`;
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