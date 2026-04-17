/**
 * Advanced Email Wrapper
 * Ensures consistent branding, layout, and mobile responsiveness for HealthBridge.
 * * @param {string} content - The main HTML body content
 * @param {string} headerColor - Hex color for the header background
 * @param {string} accentEmoji - Emoji to display next to the title
 * @param {string} title - The header title text
 */
const wrapEmailTemplate = (content, headerColor = '#1a5f7a', accentEmoji = '🔔', title = 'Notification') => `
<div style="background-color: #f4f7f9; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e1e8ed;">
        
        <div style="background-color: ${headerColor}; padding: 30px 20px; text-align: center;">
            <div style="color: rgba(255,255,255,0.85); font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">HealthBridge Telehealth</div>
            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">${accentEmoji} ${title}</h1>
        </div>

        <div style="padding: 40px 30px; line-height: 1.8; color: #334155; font-size: 16px;">
            ${content}
        </div>

        <div style="background-color: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #f1f5f9;">
            <p style="margin: 0; font-size: 13px; color: #64748b;">
                <strong>The HealthBridge Team</strong><br/>
                &copy; ${new Date().getFullYear()} All rights reserved.
            </p>
        </div>
    </div>
</div>
`;

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
    let htmlBody = `<p>Hello,</p><p>${message}</p>`;
    let config = { color: '#2E86C1', emoji: '🔔', displayTitle: title }; 

    // 2. Specific Templates
    switch (templateName) {
        case 'APPOINTMENT_CONFIRMED':
            config = { color: '#27AE60', emoji: '🎉', displayTitle: 'Appointment Confirmed!' };
            smsContent = `HealthBridge: Your appointment is confirmed! ${message} Please Pay the doctor consultation fee to access the video consultation link.`;
            htmlBody = `
                <p>Hello,</p>
                <p>${message}</p>
                <div style="background-color: #ecfdf5; border-left: 4px solid #27AE60; padding: 15px; margin: 20px 0; font-size: 14px; color: #065f46;">
                    <strong>Action Required:</strong> Please pay the doctor consultation fee to access the video consultation link. Log in to your dashboard 10 minutes before the scheduled time.
                </div>
                <a href="https://yourfrontend.com/dashboard" style="display: inline-block; background-color: #27AE60; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Go to Dashboard</a>
            `;
            break;

        case 'APPOINTMENT_ACCEPTED':
            config = { color: '#27AE60', emoji: '✅', displayTitle: 'Appointment Accepted!' };
            smsContent = `HealthBridge: Your appointment is accepted! ${message} Please Pay the doctor consultation fee to access the video consultation link.`;
            htmlBody = `
                <p>Hello,</p>
                <p>${message}</p>
                <div style="background-color: #ecfdf5; border-left: 4px solid #27AE60; padding: 15px; margin: 20px 0; font-size: 14px; color: #065f46;">
                    <strong>Action Required:</strong> Please pay the doctor consultation fee to access the video consultation link. Log in to your dashboard 10 minutes before the scheduled time.
                </div>
                <a href="https://yourfrontend.com/dashboard" style="display: inline-block; background-color: #27AE60; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Go to Dashboard</a>
            `;
            break;

        case 'DOCTOR_VERIFIED':
            config = { color: '#2E86C1', emoji: '✅', displayTitle: 'Profile Verified!' };
            smsContent = `HealthBridge Admin: Your medical profile has been verified. You can now accept appointments.`;
            htmlBody = `
                <p>Congratulations, Doctor!</p>
                <p>Your medical credentials have been successfully reviewed and approved by our admin team.</p>
                <p>${message}</p>
                <a href="https://yourfrontend.com/login" style="display: inline-block; background-color: #2E86C1; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px;">Log In to Dashboard</a>
            `;
            break;

        case 'DOCTOR_VERIFICATION_APPROVED':
            config = { color: '#1E8449', emoji: '⚕️', displayTitle: 'Verification Approved' };
            smsContent = `HealthBridge: Your doctor verification has been approved. ${message}`;
            htmlBody = `
                <p style="font-size: 18px; font-weight: 600; color: #0f172a;">Your account is now active.</p>
                <p>${message}</p>
                <p>You can now access your doctor dashboard to set your availability and manage patients.</p>
                <a href="https://yourfrontend.com/login" style="display: inline-block; background-color: #1E8449; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Access Dashboard</a>
            `;
            break;

        case 'DOCTOR_VERIFICATION_REJECTED':
            config = { color: '#C0392B', emoji: '⚠️', displayTitle: 'Verification Rejected' };
            smsContent = `HealthBridge: Your doctor verification request was rejected. ${message}`;
            htmlBody = `
                <p style="font-size: 18px; font-weight: 600; color: #991b1b;">Action Required Regarding Your Profile</p>
                <p>${message}</p>
                <div style="background-color: #fef2f2; border-left: 4px solid #C0392B; padding: 15px; margin: 20px 0; font-size: 14px; color: #991b1b;">
                    Please contact the admin team for more information regarding your document submission.
                </div>
            `;
            break;

        case 'OTP_CODE':
            config = { color: '#1e293b', emoji: '🔐', displayTitle: 'Verification Code' };
            smsContent = `Your HealthBridge verification code is: ${message}. Do not share this code.`;
            htmlBody = `
                <div style="text-align: center;">
                    <p>Use the following code to complete your action. It will expire in 10 minutes.</p>
                    <div style="display: inline-block; margin: 20px 0; padding: 20px 40px; background-color: #f8fafc; border-radius: 12px; border: 2px dashed #cbd5e1;">
                        <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1e293b;">${message}</span>
                    </div>
                    <p style="font-size: 13px; color: #64748b;">If you didn't request this code, please secure your account immediately.</p>
                </div>
            `;
            break;

        case 'NEW_APPOINTMENT_SCHEDULED':
            config = { color: '#8E44AD', emoji: '📅', displayTitle: 'New Appointment Scheduled' };
            smsContent = `HealthBridge: You have a new appointment. ${message}`;
            htmlBody = `
                <p>Hello Doctor,</p>
                <p>${message}</p>
                <p>Please log in to your dashboard to view the patient's details and prepare for the consultation.</p>
                <a href="https://yourfrontend.com/dashboard" style="display: inline-block; background-color: #8E44AD; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">View Patient Details</a>
            `;
            break;

        case 'APPOINTMENT_REJECTED':
            config = { color: '#E74C3C', emoji: '🔄', displayTitle: 'Appointment Update' };
            smsContent = `HealthBridge: Appointment update. ${message}`;
            htmlBody = `
                <p>Hello,</p>
                <p>${message}</p>
                <p>We apologize for the inconvenience. The slot has been released, and any payments will be refunded according to our policy.</p>
                <p>Please log in to your dashboard to schedule a new appointment at your earliest convenience.</p>
                <a href="https://yourfrontend.com/dashboard" style="display: inline-block; background-color: #E74C3C; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Reschedule Appointment</a>
            `;
            break;

        case 'APPOINTMENT_PAYMENT_STATUS_UPDATED':
            config = { color: '#1F618D', emoji: '💳', displayTitle: 'Payment Status Updated' };
            smsContent = `HealthBridge: Payment update. ${message}`;
            htmlBody = `
                <p>Hello Doctor,</p>
                <p>${message}</p>
                <p>Please log in to your dashboard to review the updated appointment and billing details.</p>
            `;
            break;

        case 'PRESCRIPTION_CREATED':
            config = { color: '#117A65', emoji: '💊', displayTitle: 'New Prescription Created' };
            smsContent = `HealthBridge: New prescription. ${message}`;
            htmlBody = `
                <p>Hello,</p>
                <p>${message}</p>
                <div style="background-color: #e8f8f5; border-left: 4px solid #117A65; padding: 15px; margin: 20px 0; font-size: 14px; color: #0e6251;">
                    Please log in to your dashboard to review your dosage instructions, securely download your prescription, and view doctor notes.
                </div>
                <a href="https://yourfrontend.com/dashboard" style="display: inline-block; background-color: #117A65; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">View Prescription</a>
            `;
            break;

        case 'VIDEO_SESSION_STARTED':
            config = { color: '#2E86C1', emoji: '🎥', displayTitle: 'Your Session Is Live' };
            smsContent = `HealthBridge: Video session started. ${message}`;
            htmlBody = `
                <p>Hello,</p>
                <p>${message}</p>
                <p>The doctor has initiated the video call. Please click the button below to join the session immediately.</p>
                <a href="https://yourfrontend.com/dashboard" style="display: inline-block; background-color: #2E86C1; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px;">Join Video Session</a>
            `;
            break;
    }

    return { 
        smsContent, 
        htmlContent: wrapEmailTemplate(htmlBody, config.color, config.emoji, config.displayTitle) 
    };
};