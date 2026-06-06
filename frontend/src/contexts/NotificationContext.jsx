import React, { useCallback, useEffect, useState } from 'react';
import api from '../lib/axios';
import { useAuth } from '../hooks/useAuth';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import toast from 'react-hot-toast';
import { NotificationContext } from './NotificationContextObject';

window.Pusher = Pusher;

let echoInstance = null;

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch {
      console.error("Failed to fetch notifications");
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchNotifications();
    }, 0);

    // Temporarily disabled websocket connection to avoid console errors 
    // since the websocket server (Reverb/WebSockets) is not running locally.
    const enableWebSockets = import.meta.env.VITE_ENABLE_WEBSOCKETS === 'true';
    if (user && !echoInstance && enableWebSockets) {
      echoInstance = new Echo({
        broadcaster: 'pusher',
        key: 'local_app_key',
        wsHost: '127.0.0.1',
        wsPort: 6001,
        forceTLS: false,
        disableStats: true,
        cluster: 'mt1',
        enabledTransports: ['ws', 'wss']
      });
    }

    if (user && echoInstance) {
      const channelName = `user.${user.id}`;
      echoInstance.channel(channelName).listen('.NotificationCreated', (e) => {
        // Automatically prepend the new notification to the state
        if (e.notification) {
          setNotifications(prev => [e.notification, ...prev]);
          toast.success(`Nouveau ${e.type}: ${e.message}`, {
            icon: e.type === 'absence' ? '⚠️' : e.type === 'note' ? '📊' : '📢',
            duration: 5000,
          });
        }
      });
      
      const roleChannelName = `role.${user.role?.name ? user.role.name.toLowerCase().replace(/\s+/g, '') : ''}`;
      echoInstance.channel(roleChannelName).listen('.NotificationCreated', (e) => {
        if (e.notification) {
          setNotifications(prev => [e.notification, ...prev]);
          toast.success(`Nouveau: ${e.message}`, { icon: '📢' });
        }
      });

      return () => {
        clearTimeout(timer);
        echoInstance.leave(channelName);
        echoInstance.leave(roleChannelName);
      };
    }

    return () => clearTimeout(timer);
  }, [fetchNotifications, user]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {
      console.error("Failed to mark as read");
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, markAsRead, fetchNotifications, echoInstance }}>
      {children}
    </NotificationContext.Provider>
  );
};
