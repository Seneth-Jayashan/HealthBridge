import SmsSender from './textlk.service.js';
import sendEmail from './zoho.service.js';
import { getNotificationTemplate } from '../utils/notification.templates.js';
import axios from 'axios';

const getUserContact = async (userId) => {
    try {
        const authBaseUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
        const endpoint = `${authBaseUrl.replace(/\/$/, '')}/internal/users/${userId}`;

        const response = await axios.get(endpoint, {
            headers: {
                'x-internal-service-key': process.env.INTERNAL_SERVICE_SECRET,
            },
            timeout: 8000,
        });

        return response.data?.data || null;
    } catch (error) {
        console.error('[Notification Dispatcher] Failed to fetch user contact:', error.message);
        return null;
    }
};

export const dispatchNotification = async (notification) => {
    try {
        const types = notification.notificationType;
        const inAppSuccess = types.includes('In-App');
        let smsSuccess = false;
        let emailSuccess = false;

        const user = await getUserContact(notification.userId);
        const targetEmail = user?.email || '';
        const targetPhone = user?.phoneNumber || '';

        // Fetch the design template
        const { smsContent, htmlContent } = getNotificationTemplate(
            notification.notificationTemplate, 
            notification.title, 
            notification.message
        );

        const needsExternal = types.includes('SMS') || types.includes('Email');
        if (!needsExternal) {
            notification.isSent = true;
            await notification.save();
            return;
        }

        // Dispatch SMS using the phone number from auth-service
        if (types.includes("SMS")) {
            try {
                if (targetPhone) {
                    const smsResult = await SmsSender.send(targetPhone, smsContent);
                    smsSuccess = Boolean(smsResult?.success);
                } else {
                    console.warn(`[Dispatcher] SMS skipped: No targetPhone provided for User ${notification.userId}`);
                }
            } catch (smsError) {
                console.error('[Dispatcher] SMS dispatch failed:', smsError.message);
            }
        }

        // Dispatch Email using the email from auth-service
        if (types.includes("Email")) {
            try {
                if (targetEmail) {
                    const emailResult = await sendEmail({
                        to: targetEmail,
                        subject: notification.title,
                        text: notification.message,
                        html: htmlContent
                    });
                    emailSuccess = Boolean(emailResult?.success);
                } else {
                    console.warn(`[Dispatcher] Email skipped: No targetEmail provided for User ${notification.userId}`);
                }
            } catch (emailError) {
                console.error('[Dispatcher] Email dispatch failed:', emailError.message);
            }
        }

        // In-App is considered delivered on create. External channels are best-effort.
        if (inAppSuccess || smsSuccess || emailSuccess) {
            notification.isSent = true;
            await notification.save();
        }

    } catch (error) {
        console.error('[Notification Dispatcher] Global Error:', error.message);
    }
};