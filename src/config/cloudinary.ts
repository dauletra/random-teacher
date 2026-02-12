import { Cloudinary } from 'cloudinary-core';

// Cloudinary configuration
export const cloudinary = new Cloudinary({
  cloud_name: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  secure: true,
});

// Upload preset должен быть создан в Cloudinary Dashboard
// Settings -> Upload -> Upload presets -> Add upload preset
export const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'artifacts_unsigned';

// Максимальные размеры для preview изображений (уменьшено для карточек)
export const IMAGE_CONSTRAINTS = {
  maxWidth: 600,   // Достаточно для карточек даже на Retina
  maxHeight: 400,  // Сохраняем примерное соотношение 3:2
  quality: 85,
  format: 'jpg',
};

// Размеры для разных контекстов
export const THUMBNAIL_SIZES = {
  card: { width: 600, height: 400 },      // Для карточек артефактов
  cardRetina: { width: 1200, height: 800 }, // Для Retina displays (если нужно)
  small: { width: 300, height: 200 },     // Для маленьких превью
};
