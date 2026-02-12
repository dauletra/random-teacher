import { getOptimizedUrl } from '../services/cloudinaryService';
import { THUMBNAIL_SIZES } from '../config/cloudinary';

/**
 * Extract Cloudinary public ID from URL
 */
function extractPublicId(url: string): string | null {
  // Match Cloudinary URL pattern: https://res.cloudinary.com/{cloud}/image/upload/{publicId}
  const match = url.match(/\/image\/upload\/(?:v\d+\/)?(.+)$/);
  if (!match) return null;

  // Remove file extension
  const publicIdWithExt = match[1];
  return publicIdWithExt.replace(/\.[^.]+$/, '');
}

/**
 * Check if URL is from Cloudinary
 */
function isCloudinaryUrl(url: string): boolean {
  return url.includes('res.cloudinary.com');
}

/**
 * Get optimized thumbnail URL for card display
 * - If Cloudinary URL: apply transformations for optimal size
 * - If external URL: return as-is
 */
export function getOptimizedThumbnail(url: string): string {
  if (!url) return '';

  // If not Cloudinary, return original URL
  if (!isCloudinaryUrl(url)) {
    return url;
  }

  // Extract public ID
  const publicId = extractPublicId(url);
  if (!publicId) {
    // Fallback to original if can't parse
    return url;
  }

  // Return optimized URL with transformations
  return getOptimizedUrl(publicId, {
    width: THUMBNAIL_SIZES.card.width,
    height: THUMBNAIL_SIZES.card.height,
    crop: 'fill',
    quality: 85,
  });
}

/**
 * Get small thumbnail for compact displays
 */
export function getSmallThumbnail(url: string): string {
  if (!url || !isCloudinaryUrl(url)) {
    return url;
  }

  const publicId = extractPublicId(url);
  if (!publicId) return url;

  return getOptimizedUrl(publicId, {
    width: THUMBNAIL_SIZES.small.width,
    height: THUMBNAIL_SIZES.small.height,
    crop: 'fill',
    quality: 80,
  });
}
