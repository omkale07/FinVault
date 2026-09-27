import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/notification.service';
import { getApiErrorMessage } from '../lib/utils';
import toast from 'react-hot-toast';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState([]);

  const refreshUnread = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await notificationService.getUnread();
      
      setUnreadNotifications(response.notifications || []);
      // Use explicit unreadCount from backend, do not derive from array length
      if (typeof response.unreadCount === 'number') {
        setUnreadCount(response.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch unread notifications', error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshUnread();
      const interval = setInterval(refreshUnread, 30000); // 30 seconds
      return () => clearInterval(interval);
    } else {
      // Clear state when user logs out
      setUnreadNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, refreshUnread]);

  const markAsRead = async (id) => {
    // Save previous state for rollback
    const prevNotifications = [...unreadNotifications];
    const prevCount = unreadCount;

    // Optimistic local state update
    setUnreadNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await notificationService.markAsRead(id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Rollback
      setUnreadNotifications(prevNotifications);
      setUnreadCount(prevCount);
      toast.error(getApiErrorMessage(error));
      throw error;
    }
  };

  const value = {
    unreadCount,
    unreadNotifications,
    refreshUnread,
    markAsRead
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
