import httpClient from '../api/Axios';

// Base URL path for the notification microservice
// Adjust this if your API Gateway uses something like '/api/notifications'
const NOTIFICATION_API = '/notifications';

/**
 * Get all notifications for the currently logged-in user.
 * (The backend securely pulls the userId from the auth token, so we don't pass it here)
 * @returns {Promise<Array>} List of notifications
 */
export const getNotifications = async () => {
  const response = await httpClient.get(NOTIFICATION_API);
  return response.data?.data || response.data;
};

/**
 * Mark a specific notification as read
 * @param {string} notificationId - The MongoDB _id of the notification
 * @returns {Promise<Object>} The updated notification
 */
export const markNotificationAsRead = async (notificationId) => {
  const response = await httpClient.patch(`${NOTIFICATION_API}/${notificationId}/read`);
  return response.data?.data || response.data;
};

/**
 * Delete a specific notification
 * @param {string} notificationId - The MongoDB _id of the notification
 * @returns {Promise<Object>} Success message/null
 */
export const deleteNotification = async (notificationId) => {
  const response = await httpClient.delete(`${NOTIFICATION_API}/${notificationId}`);
  return response.data?.data || response.data;
};