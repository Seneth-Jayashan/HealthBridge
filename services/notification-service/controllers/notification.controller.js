import Notification from "../models/Notification.js";
import { ApiError, ApiResponse } from "@healthbridge/shared";
import { dispatchNotification } from "../services/notification.dispatcher.js";


// @desc    Create a new notification
// @route   POST /api/notifications
// @access  Private
export const createNotification = async (req, res, next) => {
    try {
        let { 
            userId, 
            notificationType, 
            notificationTemplate, 
            title, 
            message
        } = req.body;
        
        // Handle "All" Shortcut
        if (notificationType === "All" || (Array.isArray(notificationType) && notificationType.includes("All"))) {
            notificationType = ["SMS", "Email", "In-App", "Push"];
        } else if (typeof notificationType === 'string') {
            notificationType = [notificationType];
        }

        const notification = new Notification({
            userId,
            notificationType,
            notificationTemplate,
            title,
            message,
        });
        
        await notification.save();

        setImmediate(() => {
            dispatchNotification(notification);
        });

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
        const userId = req.query.userId || req.user.id;
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
        const userId = req.user.id;
        const notification = await Notification.findOne({ _id: id, userId });
        if (!notification) {
            throw new ApiError(404, "Notification not found");
        }
        await Notification.deleteOne({ _id: id, userId });
        res.status(200).json(new ApiResponse(200, null, "Notification deleted successfully"));
    } catch (error) {
        next(error);
    }
};