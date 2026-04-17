import mongoose from 'mongoose';
import Patient from '../models/PatientService.js';
import { ApiError, ApiResponse } from "@healthbridge/shared";

// @desc    Get Patient by ID (For Doctors to view patient details)
// @route   GET /api/doctors/patients/:patientId
// @access  Private (Doctor only)
export const getPatientById = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        
        let patient = null;

        if (mongoose.isValidObjectId(patientId)) {
            patient = await Patient.findById(patientId);
        }

        if (!patient) {
            patient = await Patient.findOne({ userId: patientId });
        }

        if (!patient) {
            throw new ApiError(404, "Patient not found");
        }
        
        res.status(200).json(new ApiResponse(200, patient, "Patient profile retrieved successfully"));
    } catch (error) {
        next(error);
    }
};

// @desc    Upload medical report for a patient
// @route   POST /api/doctors/patients/:patientId/reports
// @access  Private (Doctor only)
export const uploadMedicalReport = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        const { title, description } = req.body;

        const fileUrl = req.file ? req.file.path : req.body.fileUrl;

        if (!title || !fileUrl) {
            throw new ApiError(400, "Report title and a valid file are required");
        }

        let patient = null;

        if (mongoose.isValidObjectId(patientId)) {
            patient = await Patient.findById(patientId);
        }

        if (!patient) {
            patient = await Patient.findOne({ userId: patientId });
        }
        // ------------------------------

        if (!patient) {
            throw new ApiError(404, "Patient not found");
        }

        const newReport = {
            title,
            description: description || "",
            fileUrl,
            uploadedAt: new Date()
        };

        patient.medicalReports.push(newReport);
        await patient.save();

        res.status(201).json(new ApiResponse(201, newReport, "Medical report uploaded successfully"));
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a medical report
// @route   DELETE /api/doctors/patients/:patientId/reports/:reportId
// @access  Private (Doctor only)
export const deleteMedicalReport = async (req, res, next) => {
    try {
        const { patientId, reportId } = req.params;

        let patient = null;

        if (mongoose.isValidObjectId(patientId)) {
            patient = await Patient.findById(patientId);
        }

        if (!patient) {
            patient = await Patient.findOne({ userId: patientId });
        }
        // ------------------------------

        if (!patient) {
            throw new ApiError(404, "Patient not found");
        }

        const reportExists = patient.medicalReports.id(reportId);
        if (!reportExists) {
            throw new ApiError(404, "Medical report not found");
        }

        patient.medicalReports.pull(reportId);
        await patient.save();

        res.status(200).json(new ApiResponse(200, null, "Medical report deleted successfully"));
    } catch (error) {
        next(error);
    }
};