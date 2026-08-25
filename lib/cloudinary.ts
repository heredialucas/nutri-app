import { v2 as cloudinary } from 'cloudinary';

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

/**
 * Opciones de configuración para diferentes tipos de uploads
 */
export const uploadPresets = {
  patientPhotos: {
    folder: 'mauro-acosta/patients',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] as string[],
    transformation: [
      { width: 800, height: 800, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' }
    ] as any[],
  },
  progressPhotos: {
    folder: 'mauro-acosta/progress',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] as string[],
    transformation: [
      { width: 1600, height: 1600, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' }
    ] as any[],
  },
  patientDocuments: {
    folder: 'mauro-acosta/documents',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'] as string[],
    resource_type: 'auto' as const,
  },
  nutritionPlans: {
    folder: 'mauro-acosta/nutrition-plans',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'] as string[],
    resource_type: 'auto' as const,
  },
  consents: {
    folder: 'mauro-acosta/consents',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'] as string[],
    resource_type: 'auto' as const,
  },
  paymentReceipts: {
    folder: 'mauro-acosta/receipts',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'] as string[],
    resource_type: 'auto' as const,
  },
  recipeImages: {
    folder: 'mauro-acosta/recipes',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] as string[],
    transformation: [
      { width: 800, height: 800, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' }
    ] as any[],
  },
};

export type UploadPresetType = keyof typeof uploadPresets;
