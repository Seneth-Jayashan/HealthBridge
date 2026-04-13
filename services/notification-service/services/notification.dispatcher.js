import SmsSender from './textlk.service.js';
import sendEmail from './zoho.service.js';
import { getNotificationTemplate } from '../utils/notification.templates.js';

// Accept targetEmail and targetPhone as arguments
export const dispatchNotification = async (notification, targetEmail, targetPhone) => {
    try {
        const types = notification.notificationType;
        let smsSuccess = false;
        let emailSuccess = false;

        // Fetch the design template
        const { smsContent, htmlContent } = getNotificationTemplate(
            notification.notificationTemplate, 
            notification.title, 
            notification.message
        );

        // Dispatch SMS using the directly provided phone number
        if (types.includes("SMS")) {
            if (targetPhone) {
                const smsResult = await SmsSender.send(targetPhone, smsContent); 
                smsSuccess = smsResult.success;
            } else {
                console.warn(`[Dispatcher] SMS skipped: No targetPhone provided for User ${notification.userId}`);
            }
        }

        // Dispatch Email using the directly provided email
        if (types.includes("Email")) {
            if (targetEmail) {
                const emailResult = await sendEmail({ 
                    to: targetEmail,
                    subject: notification.title,
                    text: notification.message, 
                    html: htmlContent           
                });
                emailSuccess = emailResult.success;
            } else {
                console.warn(`[Dispatcher] Email skipped: No targetEmail provided for User ${notification.userId}`);
            }
        }

        // Update the isSent flag if external deliveries succeeded
        if (smsSuccess || emailSuccess) {
            notification.isSent = true;
            await notification.save();
        }

    } catch (error) {
        console.error('[Notification Dispatcher] Global Error:', error.message);
    }
};