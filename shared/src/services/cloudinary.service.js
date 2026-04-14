import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// 1. Configuration
// Ensure you have these variables in your .env file
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

/**
 * Uploads a local file to Cloudinary
 * @param {String} localFilePath - The local path of the file (usually from multer)
 * @param {String} folderName - The Cloudinary folder to store the file in (e.g., 'reports' or 'profiles')
 * @returns {Object|null} - Cloudinary upload response object or null if failed
 */
export const uploadFile = async (localFilePath, folderName = 'general') => {
    try {
        if (!localFilePath) return null;

        // Upload the file to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            folder: folderName,
            resource_type: 'auto', // Automatically detects image, raw (PDF), or video
        });

        // File has been uploaded successfully, remove the local temporary file
        fs.unlinkSync(localFilePath);
        
        return response;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        // Remove the locally saved temporary file as the upload operation failed
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
};

/**
 * Deletes a file from Cloudinary
 * @param {String} publicId - The unique public_id of the file on Cloudinary
 * @param {String} resourceType - 'image', 'video', or 'raw' (for PDFs/Docs). Default is 'image'
 * @returns {Object|null} - Cloudinary destruction response or null if failed
 */
export const deleteFile = async (publicId, resourceType = 'image') => {
    try {
        if (!publicId) return null;

        // Destroy the file using its public_id
        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });
        
        return response;
    } catch (error) {
        console.error("Cloudinary Delete Error:", error);
        return null;
    }
};

/**
 * Updates a file on Cloudinary by overwriting the existing one
 * @param {String} localFilePath - The local path of the new file
 * @param {String} oldPublicId - The public_id of the file you want to replace
 * @returns {Object|null} - Cloudinary upload response object or null if failed
 */
export const updateFile = async (localFilePath, oldPublicId) => {
    try {
        if (!localFilePath || !oldPublicId) return null;

        // Upload the new file but force it to use the old file's public_id
        // This overwrites the existing file without needing to delete it first
        const response = await cloudinary.uploader.upload(localFilePath, {
            public_id: oldPublicId,
            overwrite: true,
            invalidate: true, // Forces CDNs to clear the cached old file
            resource_type: 'auto'
        });

        // Remove the local temporary file
        fs.unlinkSync(localFilePath);

        return response;
    } catch (error) {
        console.error("Cloudinary Update Error:", error);
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
};