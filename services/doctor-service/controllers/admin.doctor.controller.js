import Doctor from '../models/DoctorService.js';
import { ApiError, ApiResponse } from '@healthbridge/shared';

// @desc    Get all doctors (with optional filtering for verification status)
// @route   GET /api/admin/doctors
// @access  Private (Admin only)
export const getAllDoctors = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 10, search } = req.query;
        const query = {};

        // Allows the admin to quickly filter for "Pending" doctors to review
        if (status) {
            query.verificationStatus = status;
        }

        // Optional: Search by Doctor Registration Number or Specialization
        if (search) {
            query.$or = [
                { registrationNumber: { $regex: search, $options: 'i' } },
                { specialization: { $regex: search, $options: 'i' } }
            ];
        }

        const doctors = await Doctor.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 }); // Newest profiles first

        const total = await Doctor.countDocuments(query);

        res.status(200).json(new ApiResponse(200, {
            doctors,
            pagination: {
                totalPages: Math.ceil(total / limit),
                currentPage: parseInt(page),
                totalRecords: total
            }
        }, "Doctors retrieved successfully"));
    } catch (error) {
        next(error);
    }
};

// @desc    Get specific doctor details (crucial for reviewing documents)
// @route   GET /api/admin/doctors/:doctorId
// @access  Private (Admin only)
export const getDoctorDetails = async (req, res, next) => {
    try {
        const { doctorId } = req.params;

        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            throw new ApiError(404, "Doctor profile not found");
        }

        res.status(200).json(new ApiResponse(200, doctor, "Doctor details retrieved successfully"));
    } catch (error) {
        next(error);
    }
};

// @desc    Approve or Reject a doctor's verification request
// @route   PATCH /api/admin/doctors/:doctorId/verify
// @access  Private (Admin only)
export const verifyDoctor = async (req, res, next) => {
    try {
        const { doctorId } = req.params;
        const { verificationStatus } = req.body;

        if (!['Pending', 'Approved', 'Rejected'].includes(verificationStatus)) {
            throw new ApiError(400, "Invalid verification status provided");
        }

        const doctor = await Doctor.findById(doctorId);
        
        if (!doctor) {
            throw new ApiError(404, "Doctor profile not found");
        }

        // Generate ID ONLY if approving and they don't have one
        if (verificationStatus === 'Approved' && !doctor.doctorID) {
            
            // Your exact logic: Find the last doctor who has an ID, sorted descending
            const lastDoctor = await Doctor.findOne({ doctorID: { $exists: true } })
                                           .sort({ doctorID: -1 })
                                           .select('doctorID')
                                           .exec();

            if (lastDoctor && lastDoctor.doctorID) {
                const lastIdString = lastDoctor.doctorID.replace('DR-', '');
                const lastIdNumber = parseInt(lastIdString, 10);
                
                const nextIdNumber = lastIdNumber + 1;
                
                doctor.doctorID = `DR-${String(nextIdNumber).padStart(5, '0')}`;
            } else {
                doctor.doctorID = 'DR-00001';
            }
        }

        // Save the new status (and the new ID if generated)
        doctor.verificationStatus = verificationStatus;
        await doctor.save();

        res.status(200).json(new ApiResponse(200, doctor, `Doctor verification status updated to ${verificationStatus}`));
    } catch (error) {
        next(error);
    }
};