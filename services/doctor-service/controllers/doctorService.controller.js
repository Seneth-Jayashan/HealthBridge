import Doctor from '../models/DoctorService.js';
import { ApiError, ApiResponse } from '@healthbridge/shared';

// @desc    Get doctor profile
// @route   GET /doctor/profile
// @access  Doctor only
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
// @route   PUT /doctor/profile
// @access  Doctor only
export const updateDoctorProfile = async (req, res, next) => {
    try {
        const { 
            specialization, 
            qualifications, 
            experienceYears, 
            bio, 
            consultationFee,
            availability
        } = req.body;

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

// @desc    Verify a doctor (Admin only)
// @route   PUT /doctor/admin/verify/:userId
// @access  Admin only
export const verifyDoctor = async (req, res, next) => {
    try {
        const { userId } = req.params;

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

// @desc    Get all verified doctors (optionally filter by specialization)
// @route   GET /doctor/all
// @access  Any logged in user
export const getAllDoctors = async (req, res, next) => {
    try {
        const { specialization } = req.query;

        const filter = { isVerified: true };

        if (specialization) {
            filter.specialization = { 
                $regex: specialization, 
                $options: 'i'
            };
        }

        const doctors = await Doctor.find(filter);

        res.status(200).json(new ApiResponse(200, doctors, "Doctors retrieved successfully"));
    } catch (error) {
        next(error);
    }
};