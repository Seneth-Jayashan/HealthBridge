import { sendSMS } from 'textlk-node';

const SmsSender = {
  /**
   * Send a single SMS using the configured driver (Text.lk)
   * @param {string} phoneNumber - The recipient's phone number
   * @param {string} message - The message content
   * @returns {Promise<object>} - The API response result
   */
  send: async (phoneNumber, message) => {
    const isMockEnv = 
      process.env.NODE_ENV === 'test' || 
      process.env.NODE_ENV === 'development';

    if (isMockEnv) {
      console.log(`[Text.lk Mock] SMS to ${phoneNumber}: ${message}`);
      return { success: true, message: 'Mock SMS sent' };
    }

    if (process.env.SMS_DRIVER !== 'textlk') {
      console.warn(`SMS_DRIVER is set to ${process.env.SMS_DRIVER}. Skipping Text.lk send.`);
      return { success: false, message: 'SMS Driver not configured for Text.lk' };
    }

    if (!process.env.TEXTLK_API_KEY || !process.env.TEXTLK_SENDER_ID) {
      console.error('[SmsSender] Missing TEXTLK_API_KEY or TEXTLK_SENDER_ID in environment variables.');
      return { success: false, message: 'Missing SMS Gateway credentials' };
    }

    const sanitizedNumber = phoneNumber.replace(/[\s\-\+]/g, '');

    try {
      const result = await sendSMS({
        phoneNumber: sanitizedNumber,
        message,
        apiToken: process.env.TEXTLK_API_KEY, 
        senderId: process.env.TEXTLK_SENDER_ID
      });

      console.log(`[SmsSender] SMS sent successfully to ${sanitizedNumber}`);
      return { success: true, data: result };
      
    } catch (error) {
      console.error(`[SmsSender] Failed to send SMS to ${sanitizedNumber}:`, error.message);
      return { success: false, error: error.message };
    }
  }
};

export default SmsSender;