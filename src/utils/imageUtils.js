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

/**
 * Automatically optimizes an image file before upload (resizes high-res images to max 1600px
 * and compresses JPEG/WebP to quality 0.82) to prevent 30-second timeout errors on slow connections.
 * If the file is not an image or fails compression, it safely returns the original file.
 */
export async function optimizeImageForUpload(file, { maxWidth = 1600, maxHeight = 1600, quality = 0.82 } = {}) {
  if (!file || !(file instanceof Blob) || !file.type || !file.type.startsWith('image/')) {
    return file;
  }
  // If file is already small (under 200KB) and not oversized, keep it as is
  if (file.size <= 200 * 1024) {
    return file;
  }
  // Preserve animated GIFs and SVGs without canvas mutation
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file;
  }

  // Ensure window/document exists (browser environment)
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return file;
  }

  try {
    let imageWidth = 0;
    let imageHeight = 0;
    let sourceElement = null;

    if (typeof createImageBitmap === 'function') {
      try {
        const bitmap = await createImageBitmap(file);
        imageWidth = bitmap.width;
        imageHeight = bitmap.height;
        sourceElement = bitmap;
      } catch (bitmapErr) {
        // Fallback to Image element below
      }
    }

    if (!sourceElement) {
      sourceElement = await new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
        img.onerror = (err) => {
          URL.revokeObjectURL(url);
          reject(err);
        };
        img.src = url;
      });
      imageWidth = sourceElement.naturalWidth || sourceElement.width;
      imageHeight = sourceElement.naturalHeight || sourceElement.height;
    }

    if (!imageWidth || !imageHeight) {
      if (sourceElement && typeof sourceElement.close === 'function') sourceElement.close();
      return file;
    }

    // Check if resize is needed
    let targetWidth = imageWidth;
    let targetHeight = imageHeight;

    if (targetWidth > maxWidth || targetHeight > maxHeight) {
      const scale = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
      targetWidth = Math.round(targetWidth * scale);
      targetHeight = Math.round(targetHeight * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      if (typeof sourceElement.close === 'function') sourceElement.close();
      return file;
    }

    ctx.drawImage(sourceElement, 0, 0, targetWidth, targetHeight);
    if (typeof sourceElement.close === 'function') {
      sourceElement.close();
    }

    // Prefer jpeg for photos (smallest size and universal compatibility)
    const outputType = file.type === 'image/png' && file.size < 1.5 * 1024 * 1024 ? 'image/png' : 'image/jpeg';
    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, outputType, quality);
    });

    if (blob && blob.size < file.size) {
      const ext = outputType === 'image/jpeg' ? '.jpg' : '.png';
      const cleanName = file.name ? file.name.replace(/\.[^/.]+$/, ext) : `photo${ext}`;
      return new File([blob], cleanName, {
        type: outputType,
        lastModified: Date.now()
      });
    }

    return file;
  } catch (err) {
    console.warn('[optimizeImageForUpload] Failed to compress image, using original:', err);
    return file;
  }
}
