import Prescriptions from "../models/Prescriptions.js"; // Ensure you include .js for ES Modules
import Patient from "../models/PatientService.js";
import { ApiError, ApiResponse } from "@healthbridge/shared";
import { notifyPatientNewPrescription } from "../services/notifyPatientPrescription.service.js";

// @desc    Get all prescriptions issued by the logged-in doctor for a specific patient
// @route   GET /api/doctor/prescriptions
// @access  Private (Doctor only)

export const getDoctorPrescriptions = async (req, res, next) => {
    try {
        const { patientId } = req.query;
        if (!patientId) {
            return next(new ApiError(400, "Patient ID is required"));
        }
        const prescriptions = await Prescriptions.find({ doctorId: req.user.id, patientId }).sort({ createdAt: -1 });
        return res.status(200).json(new ApiResponse(200, prescriptions, "Prescriptions retrieved successfully"));
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new prescription for a patient
// @route   POST /api/doctor/prescriptions
// @access  Private (Doctor only)
export const createPrescription = async (req, res, next) => {
    try {
        const { patientId, medication, notes, startDate, endDate } = req.body;
        if (!patientId || !medication || !startDate || !endDate) {
            return next(new ApiError(400, "All fields are required"));
        }
        const patient = await Patient.findOne({userId: patientId});
        if (!patient) {
            return next(new ApiError(404, "Patient not found"));
        }
        const prescription = new Prescriptions({
            patientId,
            doctorId: req.user.id,
            medication,
            notes,
            startDate,
            endDate
        });
        await prescription.save();

        const medicationNames = Array.isArray(medication)
            ? medication.map((item) => item?.medicineName).filter(Boolean).join(", ")
            : "";

        await notifyPatientNewPrescription({
            doctorUserId: req.user.id,
            patientUserId: patient.userId,
            prescriptionId: prescription.prescriptionId,
            medicationNames,
            startDate,
            endDate,
        });
        return res.status(201).json(new ApiResponse(201, prescription, "Prescription created successfully"));
    } catch (error) {
        next(error);
    }
};  

// @desc    Update an existing prescription
// @route   PUT /api/doctor/prescriptions/:id
// @access  Private (Doctor only)
export const updatePrescription = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { medication, notes, startDate, endDate } = req.body;
        const prescription = await Prescriptions.findOne({ _id: id, doctorId: req.user.id });
        if (!prescription) {
            return next(new ApiError(404, "Prescription not found"));
        }
        Object.assign(prescription, { medication, notes, startDate, endDate });
        await prescription.save();
        return res.status(200).json(new ApiResponse(200, prescription, "Prescription updated successfully"));
    } catch (error) {
        next(error);
    }
};  

// @desc    Delete a prescription
// @route   DELETE /api/doctor/prescriptions/:id
// @access  Private (Doctor only)
export const deletePrescription = async (req, res, next) => {
    try {
        const { id } = req.params;
        const prescription = await Prescriptions.findOneAndDelete({ _id: id, doctorId: req.user.id });
        if (!prescription) {
            return next(new ApiError(404, "Prescription not found"));
        }
        return res.status(200).json(new ApiResponse(200, null, "Prescription deleted successfully"));
    } catch (error) {
        next(error);
    }
};

// @desc    Get a specific prescription by ID
// @route   GET /api/doctor/prescriptions/:id
// @access  Private (Doctor only)
export const getPrescriptionById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const prescription = await Prescriptions.findOne({ _id: id, doctorId: req.user.id });
        if (!prescription) {
            return next(new ApiError(404, "Prescription not found"));
        }
        return res.status(200).json(new ApiResponse(200, prescription, "Prescription retrieved successfully"));
    } catch (error) {
        next(error);
    }
};

// @desc    Get all prescriptions issued by the logged-in doctor
// @route   GET /api/doctor/prescriptions/all
// @access  Private (Doctor only)
export const getAllDoctorPrescriptions = async (req, res, next) => {
    try {
        const prescriptions = await Prescriptions.find({ doctorId: req.user.id }).sort({ createdAt: -1 });
        return res.status(200).json(new ApiResponse(200, prescriptions, "Prescriptions retrieved successfully"));
    } catch (error) {
        next(error);
    }
};

