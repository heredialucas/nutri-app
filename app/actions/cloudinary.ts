'use server';

import { CloudinaryService } from '@/services/cloudinary-service';
import type { UploadPresetType } from '@/lib/cloudinary';

/**
 * Server Action para subir una imagen a Cloudinary
 */
export async function uploadImage(
  file: string,
  preset: UploadPresetType = 'patientPhotos'
) {
  try {
    const result = await CloudinaryService.uploadImage(file, preset);
    return result;
  } catch (error) {
    console.error('Error in uploadImage action:', error);
    return {
      success: false,
      error: 'Error al subir la imagen',
    };
  }
}

/**
 * Server Action para eliminar una imagen de Cloudinary
 */
export async function deleteImage(publicId: string) {
  try {
    const result = await CloudinaryService.deleteImage(publicId);
    return result;
  } catch (error) {
    console.error('Error in deleteImage action:', error);
    return {
      success: false,
      error: 'Error al eliminar la imagen',
    };
  }
}

/**
 * Server Action para actualizar una imagen
 */
export async function updateImage(
  file: string,
  oldPublicId: string,
  preset: UploadPresetType = 'patientPhotos'
) {
  try {
    const result = await CloudinaryService.updateImage(file, oldPublicId, preset);
    return result;
  } catch (error) {
    console.error('Error in updateImage action:', error);
    return {
      success: false,
      error: 'Error al actualizar la imagen',
    };
  }
}

/**
 * Server Action para subir múltiples imágenes
 */
export async function uploadMultipleImages(
  files: string[],
  preset: UploadPresetType = 'patientPhotos'
) {
  try {
    const results = await CloudinaryService.uploadMultipleImages(files, preset);
    return results;
  } catch (error) {
    console.error('Error in uploadMultipleImages action:', error);
    return [{
      success: false,
      error: 'Error al subir las imágenes',
    }];
  }
}
