import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services/notification.service';
import { useNotifications } from '../../context/NotificationContext';
import { formatRelative } from 'date-fns';
import { Bell, Loader2, Check } from 'lucide-react';
import { getApiErrorMessage } from '../../lib/utils';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  return formatRelative(new Date(dateStr), new Date());
};

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, UNREAD
  const [notificationsList, setNotificationsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { markAsRead } = useNotifications();

  useEffect(() => {
    fetchNotifications();
  }, [activeTab]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { limit: 50, offset: 0 };
      
      let response;
      if (activeTab === 'UNREAD') {
        response = await notificationService.getUnread(params);
      } else {
        response = await notificationService.getAll(params);
      }
      
      setNotificationsList(response.notifications || []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    const prevList = [...notificationsList];
    
    // Optimistic update
    setNotificationsList(prev => {
      if (activeTab === 'UNREAD') {
        return prev.filter(n => n.id !== id);
      }
      return prev.map(n => n.id === id ? { ...n, isRead: true } : n);
    });

    try {
      await markAsRead(id);
    } catch (err) {
      // Rollback
      setNotificationsList(prevList);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Bell className="w-6 h-6 text-emerald-500" /> Notifications
        </h1>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="border-b border-slate-800 bg-slate-900/50 px-4 flex gap-4">
          <button
            onClick={() => setActiveTab('ALL')}
            className={cn(
              "py-4 px-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'ALL' 
                ? "border-emerald-500 text-emerald-400" 
                : "border-transparent text-slate-400 hover:text-slate-200"
            )}
          >
            All Notifications
          </button>
          <button
            onClick={() => setActiveTab('UNREAD')}
            className={cn(
              "py-4 px-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'UNREAD' 
                ? "border-emerald-500 text-emerald-400" 
                : "border-transparent text-slate-400 hover:text-slate-200"
            )}
          >
            Unread
          </button>
        </div>

        <div className="divide-y divide-slate-800/50">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
              <p className="text-slate-400">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-red-400">{error}</p>
            </div>
          ) : notificationsList.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-800 mx-auto flex items-center justify-center mb-4">
                <Bell className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-slate-300 font-medium">All caught up!</p>
              <p className="text-slate-500 text-sm mt-1">No notifications to show right now.</p>
            </div>
          ) : (
            notificationsList.map((notification) => {
              const isUnread = !notification.isRead;
              
              return (
                <div 
                  key={notification.id} 
                  className={cn(
                    "p-4 transition-colors hover:bg-slate-800/30 flex gap-4 items-start group",
                    isUnread ? "bg-slate-800/10" : ""
                  )}
                >
                  <div className="mt-1 relative flex-shrink-0">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border",
                      isUnread ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-slate-800 border-slate-700 text-slate-400"
                    )}>
                      <Bell className="w-5 h-5" />
                    </div>
                    {isUnread && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className={cn("text-sm font-semibold", isUnread ? "text-slate-200" : "text-slate-300")}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-slate-400 mt-1">
                          {notification.message}
                        </p>
                      </div>
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {formatRelativeTime(notification.created_at || notification.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  {isUnread && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full hover:bg-slate-700 text-slate-400 hover:text-emerald-400 flex-shrink-0"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
