import Doctor from '../models/DoctorService.js'; // Adjust path if your filename differs
import Availability from '../models/Availability.js';
import { ApiError, ApiResponse, cloudinaryService } from '@healthbridge/shared';
import { notifyAdminsDoctorVerificationRequested } from '../services/adminNotification.service.js';
import fs from 'fs';
import mongoose from 'mongoose';

const assertInternalAccess = (req) => {
    const secret = req.headers['x-internal-service-key'];
    if (!secret || secret !== process.env.INTERNAL_SERVICE_SECRET) {
        throw new ApiError(403, 'Forbidden: Invalid internal service credentials');
    }
};

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


// @desc    Get Doctor Profile
// @route   GET /api/doctors/profile
// @access  Private (Doctor only)
export const getDoctorProfile = async (req, res, next) => {
    try {
        // 1. Fetch the doctor as a plain JavaScript object using .lean()
        // .lean() is crucial here so we can inject the availability array into the result
        const doctor = await Doctor.findOne({ userId: req.user.id }).lean();

        if (!doctor) {
            throw new ApiError(404, "Doctor profile not found. Please complete registration.");
        }

        // 2. Fetch ALL availability documents linked to this doctor's _id
        // This automatically includes the timeSlots array and bookingDetails subdocuments
        const availability = await Availability.find({ doctorId: doctor._id });

        // 3. Attach the full availability data to the doctor object
        doctor.availability = availability;

        // 4. Send the combined response
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
        } = req.body;


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
export const updateDoctorAvailability = async (req, res, next) => {
    try {
        const { availability } = req.body;

        // 1. Validate the incoming payload
        if (!availability || !Array.isArray(availability) || availability.length === 0) {
            throw new ApiError(400, "Availability must be a non-empty array of daily schedules.");
        }

        // 2. Verify the doctor exists
        const doctor = await Doctor.findOne({ userId: req.user.id });
        if (!doctor) {
            throw new ApiError(404, "Doctor profile not found. Please submit your doctor profile first.");
        }

        // 3. Clear the old schedule completely
        // This ensures days removed on the frontend are actually deleted from the database
        await Availability.deleteMany({ doctorId: doctor._id });

        // 4. Prepare the new schedule data
        const newScheduleData = availability.map((schedule) => {
            const { dayOfWeek, timeSlots } = schedule;

            if (!dayOfWeek || !timeSlots || !Array.isArray(timeSlots)) {
                throw new ApiError(400, "Each schedule item must include a valid 'dayOfWeek' and a 'timeSlots' array.");
            }

            return {
                doctorId: doctor._id,
                dayOfWeek,
                timeSlots
            };
        });

        // 5. Insert the exact new schedule
        const updatedAvailabilities = await Availability.insertMany(newScheduleData);

        // Optional but recommended: Update the doctor's profile to mark that availability is set
        if (!doctor.isAvailabilitySet) {
            doctor.isAvailabilitySet = true;
            await doctor.save();
        }

        res.status(200).json({
            success: true,
            message: "Doctor availability updated successfully.",
            data: updatedAvailabilities
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get Doctor Availability
// @route   GET /api/doctors/availability
// @access  Private (Doctor only)
export const getDoctorAvailability = async (req, res, next) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user.id });
        if (!doctor) {
            throw new ApiError(404, "Doctor profile not found. Please submit your doctor profile first.");
        }
        const availability = await Availability.find({ doctorId: doctor._id });
        res.status(200).json(new ApiResponse(200, availability, "Doctor availability retrieved successfully"));
    } catch (error) {
        next(error);
    }
};

// Check doctor consultationFee is equal to order amount
export const checkConsultationFee = async (req, res, next) => {
    try {
        const { doctorId} = req.query;

        if (!doctorId === undefined) {
            throw new ApiError(400, "doctorId is required");
        }

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            throw new ApiError(404, "Doctor not found");
        }
        
        res.status(200).json(
            new ApiResponse(200, {
                consultationFee: doctor.consultationFee,
            }, "Consultation fee checked")
        );
    } catch (error) {
        next(error);
    }
};

// @desc    Get all patients of a doctor
// @route   GET /api/doctors/patients
// @access  Private (Doctor only)
export const getDoctorPatients = async (req, res, next) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user.id });
        if (!doctor) {
            throw new ApiError(404, "Doctor profile not found. Please submit your doctor profile first.");
        }
        const patients = await Patients.find({ doctorId: doctor._id });
        res.status(200).json(new ApiResponse(200, patients, "Doctor's patients retrieved successfully"));
    } catch (error) {
        next(error);
    }
};


// @desc    Get Doctor Availability for internal service calls
// @route   GET /internal/availability/:doctorId
// @access  Internal
export const getDoctorAvailabilityInternal = async (req, res, next) => {
    try {
        assertInternalAccess(req);

        const { doctorId } = req.params;
        if (!doctorId || !mongoose.isValidObjectId(doctorId)) {
            throw new ApiError(400, 'Valid doctorId is required');
        }

        const doctor = await Doctor.findById(doctorId).select('_id verificationStatus');
        if (!doctor) {
            throw new ApiError(404, 'Doctor not found');
        }

        if (doctor.verificationStatus !== 'Approved') {
            throw new ApiError(409, 'Doctor is not available for booking');
        }

        const availability = await Availability.find({ doctorId: doctor._id }).lean();

        const sanitized = availability.map((day) => ({
            _id: day._id,
            doctorId: day.doctorId,
            dayOfWeek: day.dayOfWeek,
            timeSlots: (day.timeSlots || []).map((slot) => ({
                _id: slot._id,
                startTime: slot.startTime,
                endTime: slot.endTime,
                isBooked: Boolean(slot.isBooked),
            })),
        }));

        res.status(200).json(new ApiResponse(200, sanitized, 'Doctor availability retrieved successfully'));
    } catch (error) {
        next(error);
    }
};

// @desc    Reserve a specific doctor slot for an appointment (atomic)
// @route   POST /internal/availability/:doctorId/reserve
// @access  Internal
export const reserveDoctorSlotInternal = async (req, res, next) => {
    try {
        assertInternalAccess(req);

        const { doctorId } = req.params;
        const { dayOfWeek, timeSlotId, patientId, patientName, appointmentId } = req.body || {};

        if (!doctorId || !mongoose.isValidObjectId(doctorId)) {
            throw new ApiError(400, 'Valid doctorId is required');
        }
        if (!dayOfWeek || !timeSlotId || !patientId || !appointmentId) {
            throw new ApiError(400, 'dayOfWeek, timeSlotId, patientId and appointmentId are required');
        }
        if (!mongoose.isValidObjectId(timeSlotId) || !mongoose.isValidObjectId(patientId) || !mongoose.isValidObjectId(appointmentId)) {
            throw new ApiError(400, 'timeSlotId, patientId and appointmentId must be valid ids');
        }

        const updated = await Availability.findOneAndUpdate(
            {
                doctorId,
                dayOfWeek,
                timeSlots: { $elemMatch: { _id: timeSlotId, isBooked: false } },
            },
            {
                $set: {
                    'timeSlots.$.isBooked': true,
                    'timeSlots.$.bookingDetails': {
                        patientId,
                        patientName,
                        appointmentId,
                        bookedAt: new Date(),
                    },
                },
            },
            { new: true }
        );

        if (!updated) {
            throw new ApiError(409, 'Time slot is already booked or not found');
        }

        res.status(200).json(new ApiResponse(200, updated, 'Slot reserved successfully'));
    } catch (error) {
        next(error);
    }
};

// @desc    Release a specific doctor slot
// @route   POST /internal/availability/:doctorId/release
// @access  Internal
export const releaseDoctorSlotInternal = async (req, res, next) => {
    try {
        assertInternalAccess(req);

        const { doctorId } = req.params;
        const { dayOfWeek, timeSlotId, appointmentId } = req.body || {};

        if (!doctorId || !mongoose.isValidObjectId(doctorId)) {
            throw new ApiError(400, 'Valid doctorId is required');
        }
        if (!dayOfWeek || !timeSlotId) {
            throw new ApiError(400, 'dayOfWeek and timeSlotId are required');
        }
        if (!mongoose.isValidObjectId(timeSlotId)) {
            throw new ApiError(400, 'timeSlotId must be a valid id');
        }

        const updateQuery = {
            doctorId,
            dayOfWeek,
            timeSlots: { $elemMatch: { _id: timeSlotId, isBooked: true } },
        };

        if (appointmentId) {
            if (!mongoose.isValidObjectId(appointmentId)) {
                throw new ApiError(400, 'appointmentId must be a valid id');
            }
            updateQuery.timeSlots.$elemMatch['bookingDetails.appointmentId'] = appointmentId;
        }

        const updated = await Availability.findOneAndUpdate(
            updateQuery,
            {
                $set: {
                    'timeSlots.$.isBooked': false,
                    'timeSlots.$.bookingDetails': {},
                },
            },
            { new: true }
        );

        if (!updated) {
            throw new ApiError(404, 'Booked time slot not found');
        }

        res.status(200).json(new ApiResponse(200, updated, 'Slot released successfully'));
    } catch (error) {
        next(error);
    }
};