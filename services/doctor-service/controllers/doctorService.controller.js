import Doctor from '../models/DoctorService.js';
import { ApiError, ApiResponse } from '@healthbridge/shared';

// @desc    Get doctor profile
// @route   GET /api/doctors/profile
// @access  Private (Doctor only)
export const getDoctorProfile = async (req, res, next) => {
    try {
        let doctor = await Doctor.findOne({ userId: req.user.id });

        if (!doctor) {
            doctor = await Doctor.create({ userId: req.user.id });
        }

        res.status(200).json(new ApiResponse(200, doctor, "Doctor profile retrieved"));
    } catch (error) {
        next(error);
    }
};

// @desc    Update doctor profile & availability
// @route   PUT /api/doctors/profile
// @access  Private (Doctor only)
export const updateDoctorProfile = async (req, res, next) => {
    try {
        const { 
            specialization, 
            qualifications, 
            experienceYears, 
            bio, 
            consultationFee,
            availability // Expected to be an array of objects: { day, startTime, endTime }
        } = req.body;

        // Admin verification logic: If a doctor updates their core credentials, 
        // you might want to reset their 'isVerified' status until an Admin reviews it again.
        // For now, we will just update the fields.
        
        const updatedDoctor = await Doctor.findOneAndUpdate(
            { userId: req.user.id },
            { 
                $set: { 
                    specialization, 
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
        next(error);
    }
};

// @desc    Verify a doctor's registration (Admin only)
// @route   PUT /api/doctors/admin/verify/:userId
export const verifyDoctor = async (req, res, next) => {
    try {
        const { userId } = req.params;

        // Find the doctor by their Auth ID and update the isVerified flag
        const doctor = await Doctor.findOneAndUpdate(
            { userId: userId },
            { $set: { isVerified: true } },
            { new: true }
        );

        if (!doctor) {
            throw new ApiError(404, "Doctor profile not found");
        }

        res.status(200).json(new ApiResponse(200, doctor, "Doctor has been successfully verified"));
    } catch (error) {
        next(error);
    }
};