import Patient from '../models/PatientService.js';
import { ApiError, ApiResponse } from '@healthbridge/shared';

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
        const { dateOfBirth, gender, contactNumber, address, emergencyContact } = req.body;

        // Find the profile and update it, or create it if it doesn't exist (upsert)
        const updatedPatient = await Patient.findOneAndUpdate(
            { userId: req.user.id },
            { 
                $set: { dateOfBirth, gender, contactNumber, address, emergencyContact } 
            },
            { new: true, upsert: true, runValidators: true }
        );

        res.status(200).json(new ApiResponse(200, updatedPatient, "Profile updated successfully"));
    } catch (error) {
        next(error);
    }
};