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
  products: {
    folder: 'inventory-control/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'] as string[],
    transformation: [
      { width: 800, height: 800, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' }
    ] as any[],
  },
  users: {
    folder: 'inventory-control/users',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] as string[],
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' }
    ] as any[],
  },
  suppliers: {
    folder: 'inventory-control/suppliers',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] as string[],
    transformation: [
      { width: 600, height: 400, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' }
    ] as any[],
  },
  orders: {
    folder: 'inventory-control/orders',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'] as string[],
    resource_type: 'auto' as const,
  },
  receipts: {
    folder: 'inventory-control/receipts',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'] as string[],
    resource_type: 'auto' as const,
  },
  deliveryProofs: {
    folder: 'inventory-control/delivery-proofs',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] as string[],
    transformation: [
      { width: 1600, height: 1600, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' }
    ] as any[],
  },
};

export type UploadPresetType = keyof typeof uploadPresets;
