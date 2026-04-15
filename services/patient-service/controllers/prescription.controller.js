import Prescriptions from "../models/Prescriptions.js"; // Ensure you include .js for ES Modules
import { ApiError, ApiResponse } from "@healthbridge/shared";

// @desc    Get all prescriptions for the logged-in patient
// @route   GET /api/prescriptions
// @access  Private (Patient only)
export const getPrescriptions = async (req, res, next) => {
    try {
        const prescriptions = await Prescriptions.find({ patientId: req.user.id }).sort({ createdAt: -1 });
        return res.status(200).json(new ApiResponse(200, prescriptions, "Prescriptions retrieved successfully"));
    } catch (error) {
        next(error);
    }
};

// @desc    Get a specific prescription by ID
// @route   GET /api/prescriptions/:id
// @access  Private (Patient only)
export const getPrescriptionByIdPatient = async (req, res, next) => {
    try {
        const prescription = await Prescriptions.findOne({ _id: req.params.id, patientId: req.user.id });
        if (!prescription) {
            return next(new ApiError(404, "Prescription not found"));
        }
        return res.status(200).json(new ApiResponse(200, prescription, "Prescription retrieved successfully"));
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a prescription by ID
// @route   DELETE /api/prescriptions/:id
// @access  Private (Patient only)
export const deletePrescriptionPatient = async (req, res, next) => {
    try {
        const prescription = await Prescriptions.findOneAndDelete({ _id: req.params.id, patientId: req.user.id });
        if (!prescription) {
            return next(new ApiError(404, "Prescription not found"));
        }
        return res.status(200).json(new ApiResponse(200, null, "Prescription deleted successfully"));
    } catch (error) {
        next(error);
    }
};
