import api from '../lib/axios';

const formatNotification = (notification) => ({
  id: notification.id,
  title: notification.title,
  message: notification.message,
  type: notification.type,
  isRead: notification.is_read,
  transactionId: notification.transaction_id,
  createdAt: notification.created_at
});

export const notificationService = {
  getAll: async (params) => {
    const response = await api.get('/notifications', { params });
    return {
      ...response.data,
      notifications: (response.data.notifications || []).map(formatNotification)
    };
  },
  
  getUnread: async (params) => {
    const response = await api.get('/notifications/unread', { params });
    return {
      ...response.data,
      notifications: (response.data.notifications || []).map(formatNotification)
    };
  },
  
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
};
