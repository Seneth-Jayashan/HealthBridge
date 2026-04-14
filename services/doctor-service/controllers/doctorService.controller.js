import Doctor from '../models/DoctorService.js'; // Adjust path if your filename differs
import { ApiError, ApiResponse, cloudinaryService } from '@healthbridge/shared';
import { notifyAdminsDoctorVerificationRequested } from '../services/adminNotification.service.js';
import fs from 'fs';

// @desc    Get all doctors (with optional filtering for verification status)
// @route   GET /api/doctors
// @access  Public (Users only)
export const getVerifiedDoctors = async (req, res, next) => {
    try {
        const { specialization, page = 1, limit = 10 } = req.query;
        const query = { verificationStatus: 'Approved' };    // Optional: Filter by specialization for the Patient's "search for doctors" feature
        if (specialization) {
            query.specialization = specialization;
        }
        const doctors = await Doctor.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ rating: -1 });
        const total = await Doctor.countDocuments(query);
        res.status(200).json(new ApiResponse(200, {
            doctors,
            pagination: {
                totalPages: Math.ceil(total / limit),
                currentPage: parseInt(page),
                totalRecords: total
            }
        }, "Verified doctors retrieved successfully"));
    } catch (error) {
        next(error);
    }
};


// @desc    Get doctor profile
// @route   GET /api/doctors/profile
// @access  Private (Doctor only)
export const getDoctorProfile = async (req, res, next) => {
    try {
        // req.user.id comes from the API Gateway header
        const doctor = await Doctor.findOne({ userId: req.user.id });

        // Note: Unlike the Patient model, the Doctor model has 'required' fields 
        // like specialization and registrationNumber, so we shouldn't create an 
        // empty document automatically. We return a 404 if it doesn't exist yet.
        if (!doctor) {
            throw new ApiError(404, "Doctor profile not found. Please complete registration.");
        }

        res.status(200).json(new ApiResponse(200, doctor, "Doctor profile retrieved successfully"));
    } catch (error) {
        next(error);
    }
};

// @desc    Create or Update doctor profile
// @route   PUT /api/doctors/profile
// @access  Private (Doctor only)
export const updateDoctorProfile = async (req, res, next) => {
    try {
        const { 
            specialization, 
            registrationNumber, 
            qualifications, 
            experienceYears, 
            bio, 
            consultationFee, 
            availability 
        } = req.body;

        const existingDoctor = await Doctor.findOne({ userId: req.user.id });

        if (existingDoctor && ['Review', 'Approved'].includes(existingDoctor.verificationStatus)) {
            if (req.file?.path) {
                fs.unlinkSync(req.file.path);
            }
            throw new ApiError(409, 'Doctor request already submitted. You can resubmit only after rejection.');
        }

        // Upsert logic: Create if it doesn't exist, update if it does.
        const updatedDoctor = await Doctor.findOneAndUpdate(
            { userId: req.user.id },
            { 
                $set: { 
                    specialization,
                    registrationNumber,
                    qualifications,
                    experienceYears,
                    bio,
                    consultationFee,
                    availability
                } 
            },
            { new: true, upsert: true, runValidators: true }
        );

        res.status(200).json(new ApiResponse(200, updatedDoctor, "Doctor profile updated successfully"));
    } catch (error) {
        // Mongoose validation errors (like missing required fields on upsert) will be caught here
        next(error);
    }
};

// @desc    Upload verification document (e.g., Medical License)
// @route   POST /api/doctors/verification-document
// @access  Private (Doctor only)
export const uploadVerificationDocument = async (req, res, next) => {
    try {
        const { documentType } = req.body;

        const existingDoctor = await Doctor.findOne({ userId: req.user.id });

        if (existingDoctor && ['Review', 'Approved'].includes(existingDoctor.verificationStatus)) {
            throw new ApiError(409, 'Doctor request already submitted. You can resubmit only after rejection.');
        }

        // 1. Validate that the file exists
        if (!req.file) {
            throw new ApiError(400, "Document file is required");
        }

        // 2. Validate required body fields
        if (!documentType) {
            // Clean up the local file saved by Multer before throwing error
            fs.unlinkSync(req.file.path);
            throw new ApiError(400, "Document type is required");
        }

        const localDocumentUrl = `/api/doctors/uploads/doctor_verifications/${req.file.filename}`;
        let documentUrl = localDocumentUrl;

        // 3. Upload file to Cloudinary when credentials are available.
        // Fall back to the local upload URL in containerized/dev environments.
        if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
            const cloudinaryResponse = await cloudinaryService.uploadFile(req.file.path, 'doctor_verifications');

            if (!cloudinaryResponse) {
                throw new ApiError(500, "Failed to upload file to cloud storage");
            }

            documentUrl = cloudinaryResponse.secure_url;
        }

        // 4. Update the doctor profile
        // Note: We overwrite the existing verification document as per your schema structure.
        // We also reset the verificationStatus to 'Pending' so admins review the new document.
        const updatedDoctor = await Doctor.findOneAndUpdate(
            { userId: req.user.id },
            {
                $set: {
                    verificationDocuments: {
                        documentType,
                        documentURL: documentUrl,
                        // Tip: Consider adding 'publicId: cloudinaryResponse.public_id' to your 
                        // verificationDocuments schema if you want to be able to delete this from Cloudinary later!
                    },
                    verificationStatus: 'Review' 
                }
            },
            { new: true, runValidators: true }
        );

        if (!updatedDoctor) {
            throw new ApiError(404, "Doctor profile not found. Please submit your doctor profile first.");
        }

        notifyAdminsDoctorVerificationRequested({
            requesterUserId: req.user.id,
            specialization: updatedDoctor.specialization,
            registrationNumber: updatedDoctor.registrationNumber,
        }).catch((notifyError) => {
            console.error('[Doctor Service] Failed to notify admins for verification request:', notifyError.message);
        });

        res.status(200).json(new ApiResponse(200, updatedDoctor.verificationDocuments, "Verification document uploaded successfully"));
    } catch (error) {
        next(error);
    }
};

// @desc    Update Doctor Availability specifically
// @route   PATCH /api/doctors/availability
// @access  Private (Doctor only)
export const updateAvailability = async (req, res, next) => {
    try {
        const { availability } = req.body;

        if (!availability || !Array.isArray(availability)) {
            throw new ApiError(400, "Valid availability array is required");
        }

        const updatedDoctor = await Doctor.findOneAndUpdate(
            { userId: req.user.id },
            { $set: { availability } },
            { new: true, runValidators: true }
        );

        if (!updatedDoctor) {
             throw new ApiError(404, "Doctor profile not found");
        }

        res.status(200).json(new ApiResponse(200, updatedDoctor.availability, "Availability updated successfully"));
    } catch (error) {
        next(error);
    }
};