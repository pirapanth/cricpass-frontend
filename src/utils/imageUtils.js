/**
 * Utility helpers for formatting and displaying images, specifically handling
 * Google Drive view/download URLs inside standard HTML <img> tags.
 */

/**
 * Extracts Google Drive file ID from various Drive URL formats:
 * - https://drive.google.com/file/d/{FILE_ID}/view
 * - https://drive.google.com/open?id={FILE_ID}
 * - https://drive.google.com/uc?id={FILE_ID}
 * - https://drive.google.com/thumbnail?id={FILE_ID}
 */
export function extractDriveFileId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Pattern 1: /file/d/{id} or /d/{id}
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i) ||
                     trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/i);
  if (fileDMatch && fileDMatch[1]) return fileDMatch[1];

  // Pattern 2: id={id} query parameter
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
  if (idParamMatch && idParamMatch[1]) return idParamMatch[1];

  return null;
}

/**
 * Checks if a string is a Google Drive URL
 */
export function isDriveUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return /drive\.google\.com|googleusercontent\.com/i.test(url);
}

/**
 * Converts a Google Drive web view URL into a direct image embed URL
 * that renders reliably inside an HTML <img> tag without CORB/CORS blocking.
 */
export function formatDriveImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  const fileId = extractDriveFileId(trimmed);
  if (fileId) {
    // sz=w1000 provides high resolution while being embeddable directly in <img> tags
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  }

  return trimmed;
}

/**
 * Returns a clean Google Drive web view link for opening in a new tab
 */
export function getDriveViewUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const fileId = extractDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/view`;
  }
  return url;
}
