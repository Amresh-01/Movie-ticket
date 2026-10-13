import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import fs from 'fs';
import { config } from '../config/env';

cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
});

export const uploadOnCloudinary = async (
  localFilePath: string,
  folder = 'movies'
): Promise<UploadApiResponse | null> => {
  try {
    if (!localFilePath) return null;

    // Upload to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'image',
      folder,
    });

    // Remove file locally after successful upload
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return response;
  } catch (error) {
    // Clean up local temp file on failure
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    console.error('Cloudinary upload error:', error);
    return null;
  }
};

export const uploadBufferOnCloudinary = async (
  buffer: Buffer,
  folder = 'movies'
): Promise<UploadApiResponse | null> => {
  return new Promise((resolve) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) {
          console.error('Cloudinary buffer upload error:', error);
          resolve(null);
        } else {
          resolve(result || null);
        }
      }
    );
    uploadStream.end(buffer);
  });
};

export default cloudinary;
