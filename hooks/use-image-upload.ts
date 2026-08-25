'use client';

import { useState } from 'react';
import { uploadImage, deleteImage, updateImage } from '@/app/actions/cloudinary';
import type { UploadPresetType } from '@/lib/cloudinary';

export interface UseImageUploadOptions {
  preset?: UploadPresetType;
  onSuccess?: (url: string, publicId: string) => void;
  onError?: (error: string) => void;
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const { preset = 'patientPhotos', onSuccess, onError } = options;
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const upload = async (base64Image: string) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simular progreso (ya que Cloudinary no provee progreso real en server-side)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const result = await uploadImage(base64Image, preset);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success && result.url && result.publicId) {
        onSuccess?.(result.url, result.publicId);
        return { success: true, url: result.url, publicId: result.publicId };
      } else {
        const errorMsg = result.error || 'Error al subir la imagen';
        onError?.(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      onError?.(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const remove = async (publicId: string) => {
    setIsUploading(true);
    try {
      const result = await deleteImage(publicId);
      if (!result.success) {
        const errorMsg = result.error || 'Error al eliminar la imagen';
        onError?.(errorMsg);
        return { success: false, error: errorMsg };
      }
      return { success: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      onError?.(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsUploading(false);
    }
  };

  const update = async (newBase64Image: string, oldPublicId: string) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const result = await updateImage(newBase64Image, oldPublicId, preset);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success && result.url && result.publicId) {
        onSuccess?.(result.url, result.publicId);
        return { success: true, url: result.url, publicId: result.publicId };
      } else {
        const errorMsg = result.error || 'Error al actualizar la imagen';
        onError?.(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      onError?.(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  return {
    upload,
    remove,
    update,
    isUploading,
    uploadProgress,
  };
}
