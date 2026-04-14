import Patient from '../models/PatientService.js';
import { ApiError, ApiResponse, cloudinaryService } from '@healthbridge/shared';
import fs from 'fs';

// @desc    Get patient profile
// @route   GET /api/patients/profile
// @access  Private (Patient only)
export const getPatientProfile = async (req, res, next) => {
    try {
        // req.user.id comes from the API Gateway header
        let patient = await Patient.findOne({ userId: req.user.id });

        // If no profile exists yet in this microservice, create an empty one
        if (!patient) {
            patient = await Patient.create({ userId: req.user.id });
        }

        res.status(200).json(new ApiResponse(200, patient, "Patient profile retrieved"));
    } catch (error) {
        next(error);
    }
};

// @desc    Update patient profile
// @route   PUT /api/patients/profile
// @access  Private (Patient only)
export const updatePatientProfile = async (req, res, next) => {
    try {
        const { 
            dateOfBirth, 
            gender, 
            bloodGroup, 
            address, 
            emergencyContact, 
            allergies, 
            chronicConditions 
        } = req.body;

        // Find the profile and update it, or create it if it doesn't exist (upsert)
        const updatedPatient = await Patient.findOneAndUpdate(
            { userId: req.user.id },
            { 
                $set: { 
                    dateOfBirth, 
                    gender, 
                    bloodGroup, 
                    address, 
                    emergencyContact,
                    allergies,
                    chronicConditions,
                    isUpdated: true
                } 
            },
            { new: true, upsert: true, runValidators: true }
        );

        res.status(200).json(new ApiResponse(200, updatedPatient, "Profile updated successfully"));
    } catch (error) {
        next(error);
    }
};

// @desc    Upload a medical report
// @route   POST /api/patients/reports
// @access  Private (Patient only)
export const uploadMedicalReport = async (req, res, next) => {
    try {
        const { title, reportType, notes } = req.body;

        // 1. Validate that the file exists (handled by Multer, but good to double-check)
        if (!req.file) {
            throw new ApiError(400, "Report file is required");
        }

        // 2. Validate required body fields
        if (!title) {
            // Since Multer already saved the file to the local disk, we MUST delete it 
            // before throwing the error, otherwise your server will fill up with junk files.
            fs.unlinkSync(req.file.path);
            throw new ApiError(400, "Report title is required");
        }

        // 3. Upload file to Cloudinary using the Shared Service
        const cloudinaryResponse = await cloudinaryService.uploadFile(req.file.path, 'patient_reports');

        if (!cloudinaryResponse) {
            throw new ApiError(500, "Failed to upload file to cloud storage");
        }

        // 4. Save the report details to the Patient document in MongoDB
        const updatedPatient = await Patient.findOneAndUpdate(
            { userId: req.user.id },
            {
                $push: {
                    medicalReports: {
                        title,
                        reportType,
                        notes,
                        fileUrl: cloudinaryResponse.secure_url,
                        publicId: cloudinaryResponse.public_id // Crucial for deletion later
                    }
                }
            },
            { new: true, runValidators: true }
        );

        res.status(200).json(new ApiResponse(200, updatedPatient.medicalReports, "Medical report uploaded successfully"));
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a medical report
// @route   DELETE /api/patients/reports/:reportId
// @access  Private (Patient only)
export const deleteMedicalReport = async (req, res, next) => {
    try {
        const { reportId } = req.params;

        // 1. Find the patient profile
        const patient = await Patient.findOne({ userId: req.user.id });
        
        if (!patient) {
            throw new ApiError(404, "Patient profile not found");
        }

        // 2. Find the specific report inside the array
        const report = patient.medicalReports.id(reportId);
        if (!report) {
            throw new ApiError(404, "Medical report not found");
        }

        // 3. Delete the file from Cloudinary using the shared service
        // We use the publicId that we saved during the upload process
        const cloudDeleteResponse = await cloudinaryService.deleteFile(report.publicId);
        
        if (!cloudDeleteResponse) {
            throw new ApiError(500, "Failed to delete file from cloud storage");
        }

        // 4. Remove the report from the database array
        patient.medicalReports.pull(reportId);
        await patient.save();

        res.status(200).json(new ApiResponse(200, null, "Medical report deleted successfully"));
    } catch (error) {
        next(error);
    }
};

export const getIsProfileUpdated = async (req, res, next) => {
    try {
        const patient = await Patient.findOne({ userId: req.user.id });

        if (!patient) {
            throw new ApiError(404, "Patient profile not found");
        }

        const hasMedicalReports = Array.isArray(patient.medicalReports) && patient.medicalReports.length > 0;
        const isProfileComplete = Boolean(patient.isUpdated);

        res.status(200).json(new ApiResponse(200, { isUpdated: isProfileComplete, hasMedicalReports }, "Profile update status retrieved successfully"));
    } catch (error) {
        next(error);
    }
};
