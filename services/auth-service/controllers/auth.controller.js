import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { ApiError, ApiResponse } from '@healthbridge/shared';

const assertInternalAccess = (req) => {
    const secret = req.headers['x-internal-service-key'];
    if (!secret || secret !== process.env.INTERNAL_SERVICE_SECRET) {
        throw new ApiError(403, 'Forbidden: Invalid internal service credentials');
    }
};

// Helper function to generate JWT
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

// @desc    Register a new user
// @route   POST /api/auth/register
export const registerUser = async (req, res, next) => {
    try {
        const { name, email, phoneNumber, password, role } = req.body;

        if (role === "Admin" && req.user.role !== "Admin") {
            throw new ApiError(403, "Only Admins can create another Admin user");
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            throw new ApiError(400, "User already exists with this email");
        }

        const user = await User.create({ name, email, phoneNumber, password, role });

        if (user) {
            const token = generateToken(user._id, user.role);
            res.status(201).json(new ApiResponse(201, {
                _id: user._id,
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role,
                token
            }, "User registered successfully"));
        } else {
            throw new ApiError(400, "Invalid user data");
        }
    } catch (error) {
        next(error); // Passes to your shared error handler
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
export const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            const token = generateToken(user._id, user.role);
            res.status(200).json(new ApiResponse(200, {
                _id: user._id,
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role,
                token
            }, "Login successful"));
        } else {
            throw new ApiError(401, "Invalid email or password");
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get current logged-in user profile (Protected route)
// @route   GET /api/auth/me
export const getMe = async (req, res, next) => {
    try {
        // req.user.id comes from the API Gateway via the requireAuth middleware
        const user = await User.findById(req.user.id).select('-password');
        if (!user) throw new ApiError(404, "User not found");

        res.status(200).json(new ApiResponse(200, user, "User profile retrieved"));
    } catch (error) {
        next(error);
    }
};

// @desc    Get all users (Admin only)
// @route   GET /api/auth/admin/users
export const getAllUsers = async (req, res, next) => {
    try {
        // Fetch all users, but exclude their hashed passwords for security
        const users = await User.find({}).select('-password');
        
        res.status(200).json(new ApiResponse(200, users, "All platform users retrieved successfully"));
    } catch (error) {
        next(error);
    }
};

// @desc    Get admin users for internal service calls
// @route   GET /api/auth/internal/admins
// @access  Internal
export const getInternalAdmins = async (req, res, next) => {
    try {
        assertInternalAccess(req);
        const admins = await User.find({ role: 'admin' }).select('name email phoneNumber role');
        res.status(200).json(new ApiResponse(200, admins, 'Admin users retrieved successfully'));
    } catch (error) {
        next(error);
    }
};

// @desc    Get user details for internal service calls
// @route   GET /api/auth/internal/users/:userId
// @access  Internal
export const getInternalUserById = async (req, res, next) => {
    try {
        assertInternalAccess(req);
        const { userId } = req.params;
        const user = await User.findById(userId).select('name email phoneNumber role');

        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        res.status(200).json(new ApiResponse(200, user, 'User retrieved successfully'));
    } catch (error) {
        next(error);
    }
};