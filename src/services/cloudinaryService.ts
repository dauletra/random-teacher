import { CLOUDINARY_UPLOAD_PRESET, IMAGE_CONSTRAINTS } from '../config/cloudinary';

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

/**
 * Resize image on client side before upload to reduce bandwidth
 */
export async function resizeImage(
  file: File,
  maxWidth: number = IMAGE_CONSTRAINTS.maxWidth,
  maxHeight: number = IMAGE_CONSTRAINTS.maxHeight
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Calculate new dimensions maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Image resize failed'));
          }
        },
        `image/${IMAGE_CONSTRAINTS.format}`,
        IMAGE_CONSTRAINTS.quality / 100
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Upload image to Cloudinary using unsigned upload
 */
export async function uploadToCloudinary(
  file: File | Blob,
  folder: string = 'artifacts'
): Promise<UploadResult> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    throw new Error('VITE_CLOUDINARY_CLOUD_NAME is not configured');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Upload failed');
  }

  const data = await response.json();

  return {
    url: data.secure_url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
  };
}

/**
 * Handle paste event from clipboard (screenshots)
 */
export function handlePasteImage(event: ClipboardEvent): File | null {
  const items = event.clipboardData?.items;
  if (!items) return null;

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      return item.getAsFile();
    }
  }

  return null;
}

/**
 * Delete image from Cloudinary (requires signed upload preset with API key)
 * Note: For unsigned uploads, you need to enable auto-delete or use signed uploads
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  // This requires backend API with signed requests
  // For now, images will be managed through Cloudinary Dashboard
  console.warn('Delete not implemented for unsigned uploads:', publicId);
}

/**
 * Get optimized image URL with transformations
 */
export function getOptimizedUrl(
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'thumb';
    quality?: number;
  }
): string {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    throw new Error('VITE_CLOUDINARY_CLOUD_NAME is not configured');
  }

  const transformations: string[] = [];

  if (options?.width) transformations.push(`w_${options.width}`);
  if (options?.height) transformations.push(`h_${options.height}`);
  if (options?.crop) transformations.push(`c_${options.crop}`);
  if (options?.quality) transformations.push(`q_${options.quality}`);

  const transform = transformations.length > 0 ? transformations.join(',') + '/' : '';

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transform}${publicId}`;
}
