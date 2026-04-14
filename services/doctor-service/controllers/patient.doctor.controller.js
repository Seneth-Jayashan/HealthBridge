import Doctor from '../models/DoctorService.js'; // Adjust your path
import { ApiError, ApiResponse } from '@healthbridge/shared';

// @desc    Add or update a rating/review for a doctor
// @route   POST /api/patients/doctors/:doctorId/reviews
// @access  Private (Patient only)
export const addOrUpdateDoctorReview = async (req, res, next) => {
    try {
        const { doctorId } = req.params;
        const { rating, comment } = req.body;
        const patientUserId = req.user.id; // Assumes your auth middleware sets req.user.id

        // 1. Validate the input
        if (!rating || rating < 1 || rating > 5) {
            throw new ApiError(400, "Please provide a valid rating between 1 and 5");
        }

        // 2. Find the doctor
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            throw new ApiError(404, "Doctor not found");
        }

        // 3. Check if this specific patient has already reviewed this doctor
        const existingReviewIndex = doctor.rating.findIndex(
            (r) => r.patientId.toString() === patientUserId.toString()
        );

        if (existingReviewIndex !== -1) {
            // Patient already reviewed: Update their existing entry
            doctor.rating[existingReviewIndex].rating = rating;
            doctor.rating[existingReviewIndex].comment = comment || doctor.rating[existingReviewIndex].comment;
        } else {
            // New review: Push to the embedded array
            doctor.rating.push({
                patientId: patientUserId,
                rating,
                comment
            });
        }

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
            reviews: doctor.rating // Returns the updated array
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