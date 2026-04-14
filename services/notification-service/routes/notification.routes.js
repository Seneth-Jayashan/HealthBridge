import express from 'express';
import {
    createNotification,
    getNotifications,
    getMyNotifications,
    markAsRead,
    deleteNotification
} from '../controllers/notification.controller.js'; // Adjust the filename if necessary
import { requireAuth } from '@healthbridge/shared';

const router = express.Router();

// ==========================================
// GLOBAL ROUTE PROTECTION
// ==========================================
// Protect all routes in this file: Must be logged in to view/manage notifications
router.use(requireAuth);

// --- Main Notification Routes ---
router.route('/')
    .post(createNotification) // Usually called internally by other services, but good to have
    .get(getNotifications);

router.route('/me')
    .get(getMyNotifications); // For users to view their own notifications
    
// --- Specific Notification Actions ---
router.route('/:id/read')
    .patch(markAsRead);

router.route('/:id')
    .delete(deleteNotification);

export default router;