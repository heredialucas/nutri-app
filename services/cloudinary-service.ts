import cloudinary, { uploadPresets, type UploadPresetType } from '@/lib/cloudinary';

export interface UploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

/**
 * Servicio para manejar uploads a Cloudinary
 */
export class CloudinaryService {
  /**
   * Sube una imagen a Cloudinary
   * @param file - Archivo en formato base64 o URL
   * @param preset - Tipo de preset
   * @param customOptions - Opciones personalizadas adicionales
   */
  static async uploadImage(
    file: string,
    preset: UploadPresetType = 'patientPhotos',
    customOptions?: Record<string, any>
  ): Promise<UploadResult> {
    try {
      const options = {
        ...uploadPresets[preset],
        ...customOptions,
      };

      const result = await cloudinary.uploader.upload(file, options);

      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al subir la imagen',
      };
    }
  }

  /**
   * Elimina una imagen de Cloudinary
   * @param publicId - ID público de la imagen en Cloudinary
   */
  static async deleteImage(publicId: string): Promise<UploadResult> {
    try {
      await cloudinary.uploader.destroy(publicId);
      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting from Cloudinary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al eliminar la imagen',
      };
    }
  }

  /**
   * Actualiza una imagen (elimina la anterior y sube la nueva)
   * @param file - Nuevo archivo
   * @param oldPublicId - ID público de la imagen anterior
   * @param preset - Tipo de preset
   */
  static async updateImage(
    file: string,
    oldPublicId: string,
    preset: UploadPresetType = 'patientPhotos'
  ): Promise<UploadResult> {
    try {
      // Subir nueva imagen
      const uploadResult = await this.uploadImage(file, preset);
      
      if (!uploadResult.success) {
        return uploadResult;
      }

      // Eliminar imagen anterior
      if (oldPublicId) {
        await this.deleteImage(oldPublicId);
      }

      return uploadResult;
    } catch (error) {
      console.error('Error updating image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al actualizar la imagen',
      };
    }
  }

  /**
   * Sube múltiples imágenes
   * @param files - Array de archivos
   * @param preset - Tipo de preset
   */
  static async uploadMultipleImages(
    files: string[],
    preset: UploadPresetType = 'patientPhotos'
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => this.uploadImage(file, preset));
    return Promise.all(uploadPromises);
  }

  /**
   * Obtiene la URL optimizada de una imagen
   * @param publicId - ID público de la imagen
   * @param transformations - Transformaciones adicionales
   */
  static getOptimizedUrl(
    publicId: string,
    transformations?: Record<string, any>
  ): string {
    return cloudinary.url(publicId, {
      quality: 'auto',
      fetch_format: 'auto',
      ...transformations,
    });
  }
}
