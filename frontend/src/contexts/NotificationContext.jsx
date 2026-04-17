import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/axios';
import { useAuth } from './AuthContext';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import toast from 'react-hot-toast';

window.Pusher = Pusher;

const NotificationContext = createContext(null);

// Optional: you can store echo in state if you want to use it elsewhere, but we'll configure it globally
let echoInstance = null;

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (e) {
      console.error("Failed to fetch notifications");
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (user && !echoInstance) {
      echoInstance = new Echo({
        broadcaster: 'pusher',
        key: 'local_app_key',
        wsHost: '127.0.0.1',
        wsPort: 6001,
        forceTLS: false,
        disableStats: true,
        cluster: 'mt1'
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
      
      const roleChannelName = `role.${user.role?.name}`;
      echoInstance.channel(roleChannelName).listen('.NotificationCreated', (e) => {
        if (e.notification) {
          setNotifications(prev => [e.notification, ...prev]);
          toast.success(`Nouveau: ${e.message}`, { icon: '📢' });
        }
      });

      return () => {
        echoInstance.leave(channelName);
        echoInstance.leave(roleChannelName);
      };
    }
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) {
      console.error("Failed to mark as read");
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, markAsRead, fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
