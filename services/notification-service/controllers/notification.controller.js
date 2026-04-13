import Notification from "../models/Notification.js";
import { ApiError, ApiResponse } from "@healthbridge/shared";
import { dispatchNotification } from "../services/notification.dispatcher.js";


// @desc    Create a new notification
// @route   POST /api/notifications
// @access  Private
export const createNotification = async (req, res, next) => {
    try {
        // 1. Extract the new contact fields from req.body
        let { 
            userId, 
            notificationType, 
            notificationTemplate, 
            title, 
            message,
            targetEmail, // <-- NEW
            targetPhone  // <-- NEW
        } = req.body;
        
        // Handle "All" Shortcut
        if (notificationType === "All" || (Array.isArray(notificationType) && notificationType.includes("All"))) {
            notificationType = ["SMS", "Email", "In-App", "Push"];
        } else if (typeof notificationType === 'string') {
            notificationType = [notificationType];
        }

        // 2. Save the notification to the database (for In-App history)
        const notification = new Notification({
            userId,
            notificationType,
            notificationTemplate,
            title,
            message,
        });
        
        await notification.save();

        // 3. Fire and Forget: Pass the contact info directly to the dispatcher!
        dispatchNotification(notification, targetEmail, targetPhone);

        res.status(201).json(new ApiResponse(201, notification, "Notification created and dispatch initiated"));
    } catch (error) {
        next(error);
    }
};

// @desc    Get notifications for a user
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json(new ApiResponse(200, notifications, "Notifications retrieved successfully"));
    } catch (error) {
        next(error);
    }
};

export const getMyNotifications = async (req, res, next) => {
    try {
        const userId = req.user.id;
        // filter only fetch In-App notifications for the user,
        const notifications = await Notification.find({ userId, notificationType: "In-App", isRead: false }).sort({ createdAt: -1 });
        res.status(200).json(new ApiResponse(200, notifications, "Your notifications retrieved successfully"));
    } catch (error) {
        next(error);
    }
};

// @desc    Mark a notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res, next) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findById(id);

        if (!notification) {
            throw new ApiError(404, "Notification not found");
        }
        notification.isRead = true;
        await notification.save();
        res.status(200).json(new ApiResponse(200, notification, "Notification marked as read"));
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res, next) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findById(id);
        if (!notification) {
            throw new ApiError(404, "Notification not found");
        }
        await notification.remove();
        res.status(200).json(new ApiResponse(200, null, "Notification deleted successfully"));
    } catch (error) {
        next(error);
    }
};