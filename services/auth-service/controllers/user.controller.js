import mongoose from 'mongoose';
import User from '../models/User.js';
import { ApiError, ApiResponse } from '@healthbridge/shared';

// Get user Profile
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ data: user });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update user Profile
export const updateProfile = async (req, res) => {
    try {
        const { name, email, phoneNumber } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.name = name || user.name;
        user.email = email || user.email;
        user.phoneNumber = phoneNumber || user.phoneNumber;
        await user.save();
        res.json({ data: user });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Change user password
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }
        user.password = newPassword;
        await user.save();
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Patient Only - Get Doctor by ID (For booking appointments)
export const getDoctorById = async (req, res) => {
    try {
        const doctor = await User.findOne({ _id: req.params.doctorId, role: 'Doctor' }).select('-password');

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        res.json({ data: doctor });
    } catch (error) {
        console.error('Error fetching doctor profile:', error);
        res.status(500).json({ message: 'Server error'});
    }
};

// Doctor Only - Get Patient by ID (For viewing patient details when booking appointments)
export const getPatientById = async (req, res) => {
    try {
        const patient = await User.findOne({ _id: req.params.patientId, role: 'Patient' }).select('-password');
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        res.json({ data: patient });
    } catch (error) {
        console.error('Error fetching patient profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin Only - Get all users (For admin dashboard)
export const getAllUsers = async (req, res, next) => {
    try {
        // Fetch all users, but exclude their hashed passwords for security
        const users = await User.find({}).select('-password');
        
        res.status(200).json(new ApiResponse(200, users, "All platform users retrieved successfully"));
    } catch (error) {
        next(error);
    }
};