import { useRef, useState, useEffect } from 'react';
import { Upload, Clipboard, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  uploadToCloudinary,
  resizeImage,
  handlePasteImage,
} from '../../services/cloudinaryService';

interface ImageUploaderProps {
  onUpload: (url: string, publicId: string) => void;
  currentImageUrl?: string;
  onRemove?: () => void;
}

export function ImageUploader({
  onUpload,
  currentImageUrl,
  onRemove,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processAndUpload = async (file: File) => {
    try {
      setUploading(true);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Пожалуйста, загрузите изображение');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Размер файла не должен превышать 10 МБ');
        return;
      }

      // Resize image on client side
      const resizedBlob = await resizeImage(file);

      // Upload to Cloudinary
      const result = await uploadToCloudinary(resizedBlob, 'artifacts');

      onUpload(result.url, result.publicId);
      toast.success('Изображение загружено');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Ошибка загрузки изображения');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndUpload(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processAndUpload(file);
    }
  };

  const handlePaste = (e: ClipboardEvent) => {
    const file = handlePasteImage(e);
    if (file) {
      processAndUpload(file);
      toast.success('Изображение из буфера обмена');
    }
  };

  // Add paste event listener
  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-3">
      {currentImageUrl ? (
        <div className="relative">
          <img
            src={currentImageUrl}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border border-gray-200"
          />
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-sm text-gray-600">Загрузка изображения...</p>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-sm text-gray-600 mb-2">
                Перетащите изображение сюда или
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                выберите файл
              </button>
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
                <Clipboard className="w-4 h-4" />
                <span>или вставьте из буфера обмена (Ctrl+V)</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Максимальный размер: 10 МБ
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
