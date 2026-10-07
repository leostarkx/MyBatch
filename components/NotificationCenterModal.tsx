import React, { useState } from 'react';
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  Settings,
  ExternalLink,
  BellOff,
  Check,
  Clock,
} from 'lucide-react';
import {
  Notification,
  NotificationCategory,
  Tab,
} from '../types';
import {
  markNotificationAsReadInFirestore,
  deleteNotificationFromFirestore,
  markAllNotificationsReadInFirestore,
  clearAllNotificationsInFirestore,
} from '../services/firebase';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onNavigateTab: (tab: Tab) => void;
  onOpenSettings: () => void;
}

const CATEGORY_BADGES: Record<
  NotificationCategory,
  { emoji: string; label: string; colorClass: string; defaultTab: Tab }
> = {
  ANNOUNCEMENT: {
    emoji: '📢',
    label: 'تبليغ عام',
    colorClass: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
    defaultTab: Tab.HOME,
  },
  ASSIGNMENT: {
    emoji: '📝',
    label: 'الواجبات',
    colorClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    defaultTab: Tab.ASSIGNMENTS,
  },
  EXAM: {
    emoji: '🎓',
    label: 'امتحان',
    colorClass: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
    defaultTab: Tab.HOME,
  },
  MATERIAL: {
    emoji: '📚',
    label: 'المحاضرات',
    colorClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
    defaultTab: Tab.MATERIALS,
  },
  SUMMARY: {
    emoji: '✍️',
    label: 'الملخصات',
    colorClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    defaultTab: Tab.SUMMARIES,
  },
  GRADE: {
    emoji: '📊',
    label: 'الدرجات',
    colorClass: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
    defaultTab: Tab.GRADES,
  },
  ATTENDANCE: {
    emoji: '✅',
    label: 'الحضور',
    colorClass: 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300',
    defaultTab: Tab.ATTENDANCE,
  },
  SCHEDULE: {
    emoji: '🗓️',
    label: 'الجدول',
    colorClass: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300',
    defaultTab: Tab.SCHEDULE,
  },
  PROJECT: {
    emoji: '🚀',
    label: 'المشاريع',
    colorClass: 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
    defaultTab: Tab.PROJECTS,
  },
  SUGGESTION: {
    emoji: '📬',
    label: 'صندوق الدفعة',
    colorClass: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300',
    defaultTab: Tab.SUGGESTIONS,
  },
  CHAT: {
    emoji: '💬',
    label: 'دردشة الدفعة',
    colorClass: 'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300',
    defaultTab: Tab.CHAT,
  },
  MENTION: {
    emoji: '💬',
    label: 'إشارة بالدردشة',
    colorClass: 'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300',
    defaultTab: Tab.CHAT,
  },
  SYSTEM: {
    emoji: '🔔',
    label: 'النظام',
    colorClass: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300',
    defaultTab: Tab.HOME,
  },
};

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onNavigateTab,
  onOpenSettings,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const displayed =
    filter === 'UNREAD'
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const handleClickNotification = async (notif: Notification) => {
    if (!notif.isRead) {
      await markNotificationAsReadInFirestore(notif.id);
    }
    const badge = CATEGORY_BADGES[notif.type] || CATEGORY_BADGES.ANNOUNCEMENT;
    const destTab = notif.targetTab || badge.defaultTab;
    onNavigateTab(destTab);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between gap-3 bg-gradient-to-r from-primary/5 via-indigo-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center relative shrink-0">
              <Bell size={22} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white dark:border-slate-800">
                  {unreadCount > 9 ? '+9' : unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-gray-800 dark:text-white">
                مركز الإشعارات والتنبيهات 🔔
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {unreadCount > 0
                  ? `لديك ${unreadCount} إشعارات غير مقروءة`
                  : 'جميع إشعاراتك مقروءة'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-primary/10 hover:text-primary text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="تخصيص إعدادات الإشعارات"
            >
              <Settings size={15} />
              <span className="hidden sm:inline">تخصيص</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-300 hover:bg-gray-200 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter & Bulk Actions Bar */}
        <div className="px-5 py-3 bg-gray-50/70 dark:bg-slate-900/40 border-b border-gray-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-xl border border-gray-200/70 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                filter === 'ALL'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              الكل ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('UNREAD')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                filter === 'UNREAD'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              غير مقروء ({unreadCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllNotificationsReadInFirestore(notifications)}
                className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck size={14} />
                <span>تحديد الكل كمقروء</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={() => clearAllNotificationsInFirestore(notifications)}
                className="text-[11px] font-bold text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={13} />
                <span>مسح السجل</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 no-scrollbar">
          {displayed.length === 0 ? (
            <div className="text-center py-14 px-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-700/60 text-gray-400 flex items-center justify-center mx-auto mb-3">
                <BellOff size={28} />
              </div>
              <p className="font-bold text-sm text-gray-700 dark:text-gray-200">
                {filter === 'UNREAD'
                  ? 'لا توجد إشعارات غير مقروءة حالياً'
                  : 'صندوق الإشعارات فارغ حالياً'}
              </p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                ستظهر هنا جميع الإشعارات الخاصة بالأقسام التي قمت بتفعيلها من إعدادات حسابك.
              </p>
            </div>
          ) : (
            displayed.map((notif) => {
              const badge =
                CATEGORY_BADGES[notif.type] || CATEGORY_BADGES.ANNOUNCEMENT;
              const timeStr = new Date(notif.timestamp).toLocaleString('ar-IQ', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={notif.id}
                  onClick={() => handleClickNotification(notif)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative group flex items-start gap-3.5 ${
                    !notif.isRead
                      ? 'bg-primary/[0.04] dark:bg-primary/10 border-primary/30 shadow-xs'
                      : 'bg-white dark:bg-slate-800/80 border-gray-100 dark:border-slate-700 hover:border-gray-200 dark:hover:border-slate-600'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 ${badge.colorClass}`}
                  >
                    {badge.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.colorClass}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1 shrink-0">
                        <Clock size={10} />
                        {timeStr}
                      </span>
                    </div>

                    {notif.title && (
                      <h4 className="font-bold text-xs sm:text-sm text-gray-800 dark:text-white mb-0.5">
                        {notif.title}
                      </h4>
                    )}
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      {notif.content}
                    </p>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                        <ExternalLink size={11} />
                        <span>اضغط للانتقال للقسم المعني</span>
                      </span>

                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!notif.isRead && (
                          <button
                            type="button"
                            onClick={() => markNotificationAsReadInFirestore(notif.id)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 transition"
                            title="تحديد كمقروء"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteNotificationFromFirestore(notif.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-700 transition"
                          title="حذف الإشعار"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {!notif.isRead && (
                    <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-1.5 animate-pulse" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-900/50 flex items-center justify-between">
          <span className="text-[11px] text-gray-500 dark:text-gray-400">
            يمكنك تخصيص الإشعارات التي تصلك من حسابك الشخصي
          </span>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Settings size={14} />
            <span>إعدادات الإشعارات ➔</span>
          </button>
        </div>
      </div>
    </div>
  );
};
