import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import {
  getNotifications,
  markNotificationAsRead,
} from '../../services/notification.service';

const formatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
};

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');
  const wrapRef = useRef(null);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item?.isRead).length,
    [notifications]
  );

  const loadNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getNotifications();
      const normalized = Array.isArray(data) ? data : [];
      setNotifications(normalized);
      return normalized;
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load notifications');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const markSingleAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((item) =>
          item?._id === notificationId ? { ...item, isRead: true } : item
        )
      );
    } catch {
      // Keep UI responsive even when marking fails.
    }
  };

  const markAllVisibleAsRead = async (source = notifications) => {
    const unreadItems = source.filter((item) => !item?.isRead && item?._id);
    if (!unreadItems.length) return;

    await Promise.allSettled(
      unreadItems.map((item) => markNotificationAsRead(item._id))
    );

    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
  };

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (event) => {
      if (!wrapRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const refreshAndMark = async () => {
      const latest = await loadNotifications();
      await markAllVisibleAsRead(latest);
    };

    refreshAndMark();
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-blue-200 bg-white text-blue-700 shadow-sm transition hover:bg-blue-50"
        aria-label="Open notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-[1.25rem] rounded-full bg-red-600 px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-[min(92vw,24rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllVisibleAsRead}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[24rem] overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-slate-500">
                <Loader2 size={16} className="animate-spin" />
                Loading notifications...
              </div>
            )}

            {!loading && error && (
              <div className="px-4 py-6 text-sm text-rose-600">{error}</div>
            )}

            {!loading && !error && notifications.length === 0 && (
              <div className="px-4 py-8 text-sm text-slate-500">
                No notifications yet.
              </div>
            )}

            {!loading && !error && notifications.length > 0 && (
              <ul className="divide-y divide-slate-100">
                {notifications.map((item) => (
                  <li
                    key={item._id}
                    className={`cursor-pointer px-4 py-3 transition ${item?.isRead ? 'bg-white' : 'bg-blue-50/40'}`}
                    onClick={() => item?._id && !item?.isRead && markSingleAsRead(item._id)}
                  >
                    <div className="flex items-start gap-2">
                      {!item?.isRead && (
                        <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {item?.title || 'Notification'}
                        </p>
                        <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">
                          {item?.message || ''}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {formatTime(item?.createdAt)}
                        </p>
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
