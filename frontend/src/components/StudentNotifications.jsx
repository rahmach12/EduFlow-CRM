import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

const StudentNotifications = () => {
  const { notifications, markAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

    const unreadCount = notifications.filter(n => !n.is_read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setShowNotifications(!showNotifications)}
        className="bg-white dark:bg-slate-800 p-2 rounded-full text-slate-400 hover:text-primary focus:outline-none relative transition-colors shadow-sm"
      >
        <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'text-red-500' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
        )}
      </button>
      
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden z-20 border border-slate-200 dark:border-slate-700">
          <div className="py-2">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Notifications</h3>
              {unreadCount > 0 && <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">{unreadCount} New</span>}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center flex flex-col items-center text-slate-500 dark:text-slate-400">
                  <Bell className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">Aucune nouvelle annonce pour le moment.</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} onClick={() => !n.is_read && markAsRead(n.id)} className={`px-4 py-3 border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${!n.is_read ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                    <p className={`text-sm ${!n.is_read ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-800 dark:text-gray-200 font-medium'}`}>{n.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{n.message}</p>
                    <p className="text-xs text-primary mt-2">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentNotifications;
