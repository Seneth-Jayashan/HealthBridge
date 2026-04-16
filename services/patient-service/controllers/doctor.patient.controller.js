import Patient from '../models/PatientService.js';
import { ApiError, ApiResponse } from "@healthbridge/shared";

// @desc    Get Patient by ID (For Doctors to view patient details)
// @route   GET /api/doctors/patients/:patientId
// @access  Private (Doctor only)
export const getPatientById = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        const patient = await Patient.findOne({userId: patientId});

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
        const { title, description, fileUrl } = req.body;
        const patient = await Patient.findOne({userId: patientId});

        if (!patient) {
            throw new ApiError(404, "Patient not found");
        }
        const newReport = {
            title,
            description,
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
        const patient = await Patient.findOne({userId: patientId});

        if (!patient) {
            throw new ApiError(404, "Patient not found");
        }
        const initialReportCount = patient.medicalReports.length;
        patient.medicalReports = patient.medicalReports.filter(
            (report) => report._id.toString() !== reportId
        );
        if (patient.medicalReports.length === initialReportCount) {
            throw new ApiError(404, "Medical report not found");
        }
        await patient.save();
        res.status(200).json(new ApiResponse(200, null, "Medical report deleted successfully"));
    } catch (error) {
        next(error);
    }
};
