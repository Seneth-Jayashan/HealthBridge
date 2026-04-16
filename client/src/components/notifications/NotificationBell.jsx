import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import {
  getNotifications,
  markNotificationAsRead,
} from '../../services/notification.service';

const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
};

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const containerRef = useRef(null);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item?.isRead).length,
    [notifications]
  );

  const visibleNotifications = useMemo(
    () => notifications.filter((item) => !item?.isRead),
    [notifications]
  );

  const loadNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await getNotifications();
      setNotifications(Array.isArray(payload) ? payload : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markOneAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((item) => (item?._id === notificationId ? { ...item, isRead: true } : item))
      );
    } catch {
      // Keep the dropdown usable even if marking fails.
    }
  };

  const markAllAsRead = async () => {
    const unreadItems = notifications.filter((item) => !item?.isRead && item?._id);
    if (!unreadItems.length) return;

    await Promise.allSettled(unreadItems.map((item) => markNotificationAsRead(item._id)));
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
  };

  const clearAllNotifications = async () => {
    const unreadItems = notifications.filter((item) => !item?.isRead && item?._id);
    if (!unreadItems.length || clearing) return;

    setClearing(true);
    setError('');

    try {
      const results = await Promise.allSettled(unreadItems.map((item) => markNotificationAsRead(item._id)));
      const failedCount = results.filter((result) => result.status === 'rejected').length;

      if (failedCount > 0) {
        setError('Some notifications could not be cleared. Please try again.');
        await loadNotifications();
      } else {
        setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      }
    } catch {
      setError('Failed to clear notifications. Please try again.');
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    loadNotifications();
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-white text-blue-700 shadow-sm hover:bg-blue-50 transition-colors"
        aria-label="Open notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-[1.15rem] rounded-full bg-red-600 px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-[min(92vw,23rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <CheckCheck size={14} />
                  Mark all
                </button>
              )}
              {visibleNotifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllNotifications}
                  disabled={clearing}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {clearing ? 'Clearing...' : 'Clear'}
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[24rem] overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-slate-500">
                <Loader2 size={16} className="animate-spin" />
                Loading notifications...
              </div>
            )}

            {!loading && error && <div className="px-4 py-6 text-sm text-rose-600">{error}</div>}

            {!loading && !error && visibleNotifications.length === 0 && (
              <div className="px-4 py-8 text-sm text-slate-500">No notifications yet.</div>
            )}

            {!loading && !error && visibleNotifications.length > 0 && (
              <ul className="divide-y divide-slate-100">
                {visibleNotifications.map((item) => (
                  <li
                    key={item._id}
                    onClick={() => item?._id && !item?.isRead && markOneAsRead(item._id)}
                    className={`cursor-pointer px-4 py-3 transition ${item?.isRead ? 'bg-white' : 'bg-blue-50/40'}`}
                  >
                    <div className="flex items-start gap-2">
                      {!item?.isRead && <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-600" />}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">{item?.title || 'Notification'}</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{item?.message || ''}</p>
                        <p className="mt-1 text-xs text-slate-400">{formatDateTime(item?.createdAt)}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
