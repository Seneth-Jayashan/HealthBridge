import axios from 'axios';
import 'dotenv/config';

let accessToken = process.env.ZOHO_ACCESS_TOKEN;
let isRefreshing = null; 


async function refreshAccessToken() {
  try {
    const res = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
      params: {
        refresh_token: process.env.ZOHO_REFRESH_TOKEN,
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        grant_type: 'refresh_token'
      }
    });
    accessToken = res.data.access_token;
    console.log('[Zoho Mail] Access token refreshed');
    return true;
  } catch (err) {
    console.error('[Zoho Mail] Error refreshing access token:', err.response?.data || err.message);
    return false;
  } finally {
    isRefreshing = null;
  }
}

/**
 * Send email using Zoho Mail API
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Email plain text content
 * @param {string} [options.html] - Optional HTML content
 * @param {number} [retryCount=0] - Internal use to prevent infinite loops
 */
async function sendEmail({ to, subject, text, html }, retryCount = 0) {
  const isMockEnv = 
    process.env.NODE_ENV === 'test' || 
    process.env.NODE_ENV === 'development';

  if (isMockEnv) {
    console.log(`[Zoho Mock] Email to ${to} | Subject: ${subject}`);
    return { success: true, message: 'Mock email sent' };
  }

  if (!process.env.ZOHO_ACCOUNT_ID || !process.env.ZOHO_EMAIL) {
    console.error('[Zoho Mail] Missing required environment variables');
    return { success: false, message: 'Missing email credentials' };
  }

  try {
    const data = {
      fromAddress: `Learn Bridge <${process.env.ZOHO_EMAIL}>`,
      toAddress: to,
      subject,
      content: html || text,
      askReceipt: 'no'
    };

    const res = await axios.post(
      `https://mail.zoho.com/api/accounts/${process.env.ZOHO_ACCOUNT_ID}/messages`,
      data,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`[Zoho Mail] Email sent successfully to ${to}`);
    return { success: true, data: res.data };

  } catch (err) {
    if (err.response && err.response.status === 401) {
      
      if (retryCount >= 1) {
        console.error('[Zoho Mail] Token refresh failed or still returning 401.');
        return { success: false, message: 'Authentication failed after retry' };
      }

      console.log('[Zoho Mail] Access token expired. Refreshing...');
      
      if (!isRefreshing) {
        isRefreshing = refreshAccessToken();
      }
      const refreshed = await isRefreshing;
      if (!refreshed) {
        return { success: false, message: 'Failed to refresh Zoho access token' };
      }

      return sendEmail({ to, subject, text, html }, retryCount + 1);
    }

    console.error('[Zoho Mail] Error sending email:', err.response?.data || err.message);
    return { success: false, message: err.response?.data?.message || err.message };
  }
}

export default sendEmail;