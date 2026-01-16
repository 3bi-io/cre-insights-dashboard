import { logger } from '@/lib/logger';

/**
 * Download a single asset file
 */
export const downloadAsset = async (url: string, filename: string): Promise<void> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    logger.error('Failed to download asset', error);
    throw error;
  }
};

/**
 * Copy URL to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    logger.error('Failed to copy to clipboard', error);
    return false;
  }
};

/**
 * Get the full URL for an asset
 */
export const getAssetUrl = (path: string): string => {
  return `${window.location.origin}${path}`;
};
