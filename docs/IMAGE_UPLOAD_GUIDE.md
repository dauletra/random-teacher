# Руководство по загрузке изображений

## Реализованные возможности

### 1. **Загрузка из файла**
- Нажмите кнопку "Выбрать файл"
- Выберите изображение (JPG, PNG, GIF, WebP)
- Максимальный размер: 10 МБ

### 2. **Drag & Drop**
- Перетащите изображение прямо в область загрузки
- Область подсветится синим при наведении
- Поддерживаются все форматы изображений

### 3. **Вставка из буфера обмена (Ctrl+V)**
- Сделайте скриншот (Win+Shift+S на Windows, Cmd+Shift+4 на Mac)
- Откройте страницу редактирования артефакта
- Нажмите Ctrl+V (Cmd+V на Mac)
- Изображение автоматически загрузится

## Автоматическая оптимизация

### Ресайз на клиенте
Перед загрузкой на Cloudinary изображение автоматически:
- Уменьшается до максимум 1200x800 px (сохраняя пропорции)
- Конвертируется в JPEG с качеством 85%
- Сжимается для экономии bandwidth

### Преимущества
- **Быстрая загрузка**: меньший размер файла
- **Экономия трафика**: Cloudinary free tier ограничен 25 GB/месяц
- **Лучший UX**: пользователь не ждет загрузку огромных файлов

## Использование в коде

### Компонент ImageUploader

```tsx
import { ImageUploader } from '../../components/showcase/ImageUploader';

<ImageUploader
  currentImageUrl={formData.thumbnail}
  onUpload={(url, publicId) => {
    // url - полный URL изображения на Cloudinary
    // publicId - ID для последующего удаления
    setFormData(prev => ({
      ...prev,
      thumbnail: url,
      thumbnailPublicId: publicId
    }));
  }}
  onRemove={() => {
    // Очистка при удалении
    setFormData(prev => ({
      ...prev,
      thumbnail: '',
      thumbnailPublicId: ''
    }));
  }}
/>
```

## Сервисы

### cloudinaryService.ts

#### `resizeImage(file, maxWidth, maxHeight): Promise<Blob>`
Изменяет размер изображения на клиенте используя Canvas API.

#### `uploadToCloudinary(file, folder): Promise<UploadResult>`
Загружает файл на Cloudinary через unsigned upload.

#### `handlePasteImage(event): File | null`
Извлекает изображение из ClipboardEvent (для Ctrl+V).

#### `getOptimizedUrl(publicId, options)`
Генерирует URL с трансформациями Cloudinary (для thumbnail, crop, quality).

## Структура файлов

```
src/
├── config/
│   └── cloudinary.ts          # Конфигурация Cloudinary
├── services/
│   └── cloudinaryService.ts   # API для работы с изображениями
└── components/
    └── showcase/
        └── ImageUploader.tsx  # UI компонент загрузки
```

## Troubleshooting

### Изображение не загружается
1. Проверьте переменные окружения в `.env`:
   - `VITE_CLOUDINARY_CLOUD_NAME`
   - `VITE_CLOUDINARY_UPLOAD_PRESET`
2. Убедитесь, что upload preset создан как **Unsigned**
3. Перезапустите dev-сервер после изменения `.env`

### Ctrl+V не работает
- Убедитесь, что в буфере обмена находится изображение (не путь к файлу)
- Проверьте консоль браузера на наличие ошибок
- Попробуйте обновить страницу

### Ошибка "Upload failed"
- Проверьте размер файла (не более 10 МБ)
- Убедитесь, что это изображение, а не другой тип файла
- Проверьте настройки upload preset в Cloudinary (allowed formats)

## Roadmap

### Возможные улучшения
- [ ] Поддержка нескольких изображений (галерея)
- [ ] Crop и редактирование перед загрузкой
- [ ] Прогресс-бар загрузки
- [ ] Предпросмотр перед загрузкой
- [ ] Удаление старых изображений из Cloudinary (требует signed upload)
