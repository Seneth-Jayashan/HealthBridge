/**
 * Centralized Notification Templates for HealthBridge
 * Generates formatted SMS and HTML Email content based on template names.
 * * @param {string} templateName - The identifier for the template (e.g., 'APPOINTMENT_CONFIRMED')
 * @param {string} title - The fallback title/subject
 * @param {string} message - The dynamic message injected from the controller
 * @returns {Object} { smsContent, htmlContent }
 */
export const getNotificationTemplate = (templateName, title, message) => {
    // 1. Default formatting (Used if no specific template matches)
    let smsContent = `${title}: ${message}`;
    let htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #2E86C1; padding: 20px; color: white;">
                <h2 style="margin: 0;">${title}</h2>
            </div>
            <div style="padding: 20px; color: #333; line-height: 1.6;">
                <p>${message}</p>
            </div>
            <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #777;">
                &copy; ${new Date().getFullYear()} HealthBridge. All rights reserved.
            </div>
        </div>
    `;

    // 2. Specific Templates
    switch (templateName) {
        case 'APPOINTMENT_CONFIRMED':
            smsContent = `HealthBridge: Your appointment is confirmed! ${message}`;
            htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #27AE60; padding: 20px; color: white; text-align: center;">
                        <h2 style="margin: 0;">Appointment Confirmed! 🎉</h2>
                    </div>
                    <div style="padding: 20px; color: #333; line-height: 1.6;">
                        <p>Hello,</p>
                        <p>${message}</p>
                        <p>Please log in to your dashboard 10 minutes before the scheduled time to access your video consultation link.</p>
                        <br/>
                        <p>Stay healthy,<br/><strong>The HealthBridge Team</strong></p>
                    </div>
                </div>
            `;
            break;

        case 'DOCTOR_VERIFIED':
            smsContent = `HealthBridge Admin: Your medical profile has been verified. You can now accept appointments.`;
            htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #2E86C1; padding: 20px; color: white; text-align: center;">
                        <h2 style="margin: 0;">Profile Verified! ✅</h2>
                    </div>
                    <div style="padding: 20px; color: #333; line-height: 1.6;">
                        <p>Congratulations, Doctor!</p>
                        <p>Your medical credentials have been successfully reviewed and approved by our admin team.</p>
                        <p>${message}</p>
                        <a href="https://yourfrontend.com/login" style="display: inline-block; background-color: #2E86C1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">Log In to Dashboard</a>
                    </div>
                </div>
            `;
            break;

        case 'OTP_CODE':
            smsContent = `Your HealthBridge verification code is: ${message}. Do not share this code.`;
            htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; text-align: center; padding: 30px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #333; margin-top: 0;">Verification Code</h2>
                    <p style="color: #666; font-size: 14px;">Use the following code to complete your action:</p>
                    <h1 style="letter-spacing: 5px; color: #2E86C1; background-color: #f4f6f7; padding: 15px; border-radius: 8px;">${message}</h1>
                    <p style="color: #999; font-size: 12px; margin-bottom: 0;">This code is valid for 10 minutes.</p>
                </div>
            `;
            break;
    }

    return { smsContent, htmlContent };
};