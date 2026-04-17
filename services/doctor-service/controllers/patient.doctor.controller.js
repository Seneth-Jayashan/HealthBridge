import Availability from '../models/Availability.js';
import Doctor from '../models/DoctorService.js'; // Adjust your path
import Patients from '../models/Patients.js'; // Adjust your path
import axios from 'axios';
import { ApiError, ApiResponse } from '@healthbridge/shared';


export const addToPatientList = async (req, res, next) => {
    try {

        const { doctorId, patientId, appointmentId} = req.body;
        if (!doctorId || !patientId) {
            throw new ApiError(400, "Doctor ID and Patient ID are required");
        }
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            throw new ApiError(404, "Doctor not found");
        }

        const patient = await axios.get(`http://auth-service:3001/internal/users/${patientId}`, {
            headers: {
                'x-internal-service-key': process.env.INTERNAL_SERVICE_SECRET,
            }
        });
        const patientData = patient.data.data; 

        const appointment = await axios.get(`http://appointment-service:3004/internal/appointments/${appointmentId}`, {
            headers: {
                'x-internal-service-key': process.env.INTERNAL_SERVICE_SECRET,
            }
        });
        const appointmentData = appointment.data.data;

        const existingPatient = await Patients.findOne({ doctorId: doctor._id, "patients.patientId": patientId });
        if (!existingPatient) {
            const newPatientList = new Patients({
                doctorId: doctor._id,
                patients: [{
                    patientId,
                    name: patientData.name,
                    email: patientData.email ,
                    phoneNumber: patientData.phoneNumber,
                    lastAppointmentData: appointmentData
                }]
            });
            await newPatientList.save();
        } else {
           const patientExists = existingPatient.patients.some(p => p.patientId.toString() === patientId.toString());
    
            if (!patientExists) {
                existingPatient.patients.push({
                    patientId: patientId,
                    name: patientData.name,
                    email: patientData.email,
                    phoneNumber: patientData.phoneNumber,
                    // Assuming your appointmentData object has a date field, use that:
                    lastAppointmentData: appointmentData 
                });
                await existingPatient.save();
            }
        }

        res.status(200).json(new ApiResponse(200, null, "Patient added to doctor's list successfully"));
    } catch (error) {
        next(error);
        console.log("Error in addToPatientList:", error);
    }
};

// @desc    Add or update a rating/review for a doctor
// @route   POST /api/patients/doctors/:doctorId/reviews
// @access  Private (Patient only)
export const addOrUpdateDoctorReview = async (req, res, next) => {
    try {
        const { doctorId } = req.params;
        const { rating, comment } = req.body;
        const patientUserId = req.user.id; 

        // 1. Validate the input
        if (!rating || rating < 1 || rating > 5) {
            throw new ApiError(400, "Please provide a valid rating between 1 and 5");
        }

        // 2. Find the doctor
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            throw new ApiError(404, "Doctor not found");
        }

        // 3. ALWAYS push as a new review (Removed the overwrite logic)
        doctor.rating.push({
            patientId: patientUserId,
            rating,
            comment
        });

        // 4. Recalculate averageRating and totalReviews
        doctor.totalReviews = doctor.rating.length;
        
        const sumOfRatings = doctor.rating.reduce((acc, item) => acc + item.rating, 0);
        const calculatedAverage = sumOfRatings / doctor.totalReviews;
        
        // Round to 1 decimal place (e.g., 4.5)
        doctor.averageRating = Number(calculatedAverage.toFixed(1));

        // 5. Save the updated doctor document
        await doctor.save();

        res.status(200).json(new ApiResponse(200, {
            averageRating: doctor.averageRating,
            totalReviews: doctor.totalReviews,
            reviews: doctor.rating 
        }, "Review submitted successfully"));

    } catch (error) {
        next(error);
    }
};

// @desc    Delete a review for a doctor
// @route   DELETE /api/patients/doctors/:doctorId/reviews
// @access  Private (Patient only)
export const deleteDoctorReview = async (req, res, next) => {
    try {
        const { doctorId } = req.params;
        const patientUserId = req.user.id;

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            throw new ApiError(404, "Doctor not found");
        }

        // 1. Filter out the patient's review
        const initialReviewCount = doctor.rating.length;
        doctor.rating = doctor.rating.filter(
            (r) => r.patientId.toString() !== patientUserId.toString()
        );

        // 2. Check if anything was actually deleted
        if (doctor.rating.length === initialReviewCount) {
            throw new ApiError(404, "Review not found for this user");
        }

        // 3. Recalculate stats
        doctor.totalReviews = doctor.rating.length;
        if (doctor.totalReviews > 0) {
            const sumOfRatings = doctor.rating.reduce((acc, item) => acc + item.rating, 0);
            doctor.averageRating = Number((sumOfRatings / doctor.totalReviews).toFixed(1));
        } else {
            doctor.averageRating = 0; // Reset if no reviews are left
        }

        await doctor.save();

        res.status(200).json(new ApiResponse(200, {
            averageRating: doctor.averageRating,
            totalReviews: doctor.totalReviews
        }, "Review deleted successfully"));

    } catch (error) {
        next(error);
    }
};

// @desc    Get Doctor by ID (For patients to view doctor details and reviews)
// @route   GET /api/patients/doctors/:doctorId
// @access  Private (Patient only)
export const getDoctorByIdForPatient = async (req, res, next) => {
    try {
        const { doctorId } = req.params;
        
        const doctor = await Doctor.findById(doctorId)
            .select('-verificationDocuments -verificationStatus')
            .lean();
            
        if (!doctor) {
            throw new ApiError(404, "Doctor not found");
        }

        const rawAvailability = await Availability.find({ doctorId: doctor._id }).lean();

        const filteredAvailability = rawAvailability.map(schedule => {
            return {
                ...schedule,
                timeSlots: schedule.timeSlots.filter(slot => slot.isBooked === false)
            };
        }).filter(schedule => schedule.timeSlots.length > 0); 

        doctor.availability = filteredAvailability;

        res.status(200).json(new ApiResponse(200, doctor, "Doctor details retrieved successfully"));
    } catch (error) {
        next(error);
    }
};

