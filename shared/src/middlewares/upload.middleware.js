import multer from 'multer';
import fs from 'fs';
import path from 'path';

/**
 * Creates a configured Multer middleware instance.
 * * @param {String} localFolderName - The local directory name (e.g., 'reports', 'profiles')
 * @param {Array} allowedTypes - Array of allowed mime types. Leave empty [] to allow all.
 * @param {Number} maxSizeMB - Maximum file size in megabytes.
 * @returns {import('multer').Multer}
 */
export const createUploadMiddleware = (localFolderName = 'temp', allowedTypes = [], maxSizeMB = 5) => {
    // Define the local path. This will resolve relative to the microservice that calls it.
    const localDir = `./public/uploads/${localFolderName}`;

    // Ensure the specific local directory exists
    if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
    }

    // Configure Disk Storage
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, localDir);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
            cb(null, `${uniqueSuffix}-${cleanFileName}`);
        }
    });

    // Configure File Filter
    const fileFilter = (req, file, cb) => {
        // If no types are specified, allow everything
        if (allowedTypes.length === 0) {
            return cb(null, true);
        }

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
        }
    };

    // Return the configured Multer instance
    return multer({ 
        storage: storage,
        fileFilter: fileFilter,
        limits: {
            fileSize: maxSizeMB * 1024 * 1024 // Convert MB to Bytes
        }
    });
};