import {
  User,
  UserRole,
  Notification,
  NotificationCategory,
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
  Tab,
} from '../types';
import { saveNotificationToFirestore } from './firebase';

/**
 * Safely returns a user's resolved NotificationPreferences, merging defaults
 */
export function getUserNotificationPreferences(
  user?: User | null
): NotificationPreferences {
  if (!user || !user.notificationPrefs) {
    return {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      categories: { ...DEFAULT_NOTIFICATION_PREFERENCES.categories },
    };
  }
  return {
    enabled:
      user.notificationPrefs.enabled !== undefined
        ? user.notificationPrefs.enabled
        : true,
    browserPush:
      user.notificationPrefs.browserPush !== undefined
        ? user.notificationPrefs.browserPush
        : true,
    soundEnabled:
      user.notificationPrefs.soundEnabled !== undefined
        ? user.notificationPrefs.soundEnabled
        : true,
    categories: {
      ...DEFAULT_NOTIFICATION_PREFERENCES.categories,
      ...(user.notificationPrefs.categories || {}),
    },
  };
}

/**
 * Checks if a user has enabled notifications for a specific category
 */
export function isCategoryEnabledForUser(
  user: User | null | undefined,
  category: NotificationCategory
): boolean {
  const prefs = getUserNotificationPreferences(user);
  if (!prefs.enabled) return false;

  const c = prefs.categories;
  switch (category) {
    case 'ANNOUNCEMENT':
      return c.announcements;
    case 'ASSIGNMENT':
      return c.assignments;
    case 'EXAM':
      return c.exams;
    case 'MATERIAL':
      return c.materials;
    case 'SUMMARY':
      return c.summaries;
    case 'GRADE':
      return c.grades;
    case 'ATTENDANCE':
      return c.attendance;
    case 'SCHEDULE':
      return c.schedule;
    case 'PROJECT':
      return c.projects;
    case 'SUGGESTION':
      return c.suggestions;
    case 'CHAT':
    case 'MENTION':
      return c.chatMentions;
    case 'SYSTEM':
    default:
      return true;
  }
}

/**
 * Plays a pleasant, subtle chime sound using Web Audio API
 */
export function playNotificationChime() {
  try {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // First note (E5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Second note (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.09, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.45);
  } catch {
    // Ignore audio context restriction if user hasn't interacted yet
  }
}

/**
 * Requests browser Notification permission
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  if (window.Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    const permission = await window.Notification.requestPermission();
    return permission;
  } catch {
    return window.Notification.permission;
  }
}

/**
 * Triggers a native Browser / OS Notification (via Service Worker if available, or window.Notification)
 */
export async function showBrowserPushNotification(
  title: string,
  body: string,
  tag?: string
) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (window.Notification.permission !== 'granted') return;

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon: '/icon.svg',
          badge: '/icon.svg',
          tag: tag || `dafaaty_${Date.now()}`,
          dir: 'rtl',
          lang: 'ar',
        });
        return;
      }
    }
    new window.Notification(title, {
      body,
      icon: '/icon.svg',
      tag: tag || `dafaaty_${Date.now()}`,
      dir: 'rtl',
      lang: 'ar',
    });
  } catch (e) {
    console.warn('Browser notification fallback:', e);
  }
}

/**
 * Sends a notification to a single user if their preferences allow this category
 */
export async function notifyUserIfAllowed(params: {
  targetUser: User;
  category: NotificationCategory;
  title: string;
  content: string;
  batchCode?: string;
  targetTab?: Tab;
}) {
  const { targetUser, category, title, content, batchCode, targetTab } = params;
  // Skip offline manual records that have no real login account
  if (targetUser.isOfficial) return;
  if (!isCategoryEnabledForUser(targetUser, category)) return;

  const notif: Notification = {
    id: `notif_${Date.now()}_${targetUser.uid.slice(0, 6)}_${Math.random().toString(36).slice(2, 5)}`,
    userId: targetUser.uid,
    batchCode,
    type: category,
    title,
    content,
    isRead: false,
    timestamp: Date.now(),
    targetTab,
  };

  await saveNotificationToFirestore(notif);
}

/**
 * Broadcasts a notification to all students in a batch who have enabled the given category
 */
export async function broadcastBatchNotification(params: {
  allUsers: User[];
  batchCode: string;
  excludeUid?: string;
  category: NotificationCategory;
  title: string;
  content: string;
  targetTab?: Tab;
  onlyUids?: string[]; // Optional subset of UIDs (e.g., specific group members)
}) {
  const {
    allUsers,
    batchCode,
    excludeUid,
    category,
    title,
    content,
    targetTab,
    onlyUids,
  } = params;

  if (!batchCode) return;
  const cleanCode = batchCode.trim().toUpperCase();

  const recipients = allUsers.filter((u) => {
    if (u.isOfficial) return false; // Manual paper records don't log in
    if (u.role === UserRole.OWNER) return false;
    if (excludeUid && u.uid === excludeUid) return false;
    if ((u.batchCode || '').trim().toUpperCase() !== cleanCode) return false;
    if (onlyUids && !onlyUids.includes(u.uid)) return false;
    return isCategoryEnabledForUser(u, category);
  });

  await Promise.all(
    recipients.map((student) => {
      const notif: Notification = {
        id: `notif_${Date.now()}_${student.uid.slice(0, 6)}_${Math.random().toString(36).slice(2, 5)}`,
        userId: student.uid,
        batchCode: cleanCode,
        type: category,
        title,
        content,
        isRead: false,
        timestamp: Date.now(),
        targetTab,
      };
      return saveNotificationToFirestore(notif);
    })
  );
}

/**
 * Helper metadata for notification categories (icons, labels, colors, default tabs)
 */
export const NOTIFICATION_CATEGORY_META: Record<
  keyof NotificationPreferences['categories'],
  {
    category: NotificationCategory;
    label: string;
    description: string;
    emoji: string;
    defaultTab: Tab;
    badgeBg: string;
  }
> = {
  announcements: {
    category: 'ANNOUNCEMENT',
    label: 'التبليغات والإعلانات العامة',
    description: 'إعلانات الممثل، التصويتات، والتنبيهات العاجلة للدفعة',
    emoji: '📢',
    defaultTab: Tab.HOME,
    badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  },
  assignments: {
    category: 'ASSIGNMENT',
    label: 'الواجبات والتكليفات الدراسية',
    description: 'إضافة واجب جديد أو تذكير بمواعيد تسليم التكليفات',
    emoji: '📝',
    defaultTab: Tab.ASSIGNMENTS,
    badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  },
  exams: {
    category: 'EXAM',
    label: 'الامتحانات والكويزات',
    description: 'تحديد مواعيد الكويزات، الميدتيرم، والامتحانات النهائية',
    emoji: '🎓',
    defaultTab: Tab.HOME,
    badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  },
  materials: {
    category: 'MATERIAL',
    label: 'المحاضرات والملازم الدراسية',
    description: 'رفع ملزمة جديدة أو ملفات PDF وصور للمواد الدراسية',
    emoji: '📚',
    defaultTab: Tab.MATERIALS,
    badgeBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
  },
  summaries: {
    category: 'SUMMARY',
    label: 'ملخصات الطلاب والمراجعات',
    description: 'نشر ملخص جديد، تأشيرات، أو أسئلة سابقة من زملائك',
    emoji: '✍️',
    defaultTab: Tab.SUMMARIES,
    badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  },
  grades: {
    category: 'GRADE',
    label: 'الدرجات والسعي التراكمي',
    description: 'رصد أو تحديث درجاتك في الكويزات والسعي للمواد',
    emoji: '📊',
    defaultTab: Tab.GRADES,
    badgeBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  },
  attendance: {
    category: 'ATTENDANCE',
    label: 'سجل الحضور والغياب',
    description: 'تسجيل حضورك أو غيابك أو إجازتك في المحاضرات اليومية',
    emoji: '✅',
    defaultTab: Tab.ATTENDANCE,
    badgeBg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800',
  },
  schedule: {
    category: 'SCHEDULE',
    label: 'الجدول الأسبوعي والمحاضرات',
    description: 'إضافة محاضرة للجدول، تغيير وقتها، أو إلغاء محاضرة مؤقتاً',
    emoji: '🗓️',
    defaultTab: Tab.SCHEDULE,
    badgeBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800',
  },
  projects: {
    category: 'PROJECT',
    label: 'المشاريع وكروبات العمل',
    description: 'إنشاء مشروع جديد، إضافتك لكروب مشروع، أو رفع ملفات المشروع',
    emoji: '🚀',
    defaultTab: Tab.PROJECTS,
    badgeBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800',
  },
  suggestions: {
    category: 'SUGGESTION',
    label: 'صندوق استفسارات ومقترحات الدفعة',
    description: 'رد الممثل على مقترحك أو استفسارك أو تحويله لتبليغ عام',
    emoji: '📬',
    defaultTab: Tab.SUGGESTIONS,
    badgeBg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  },
  chatMentions: {
    category: 'CHAT',
    label: 'دردشة الدفعة والإشارات',
    description: 'عندما يرد طالب أو الممثل على رسالتك أو يشير إليك في الدردشة',
    emoji: '💬',
    defaultTab: Tab.CHAT,
    badgeBg: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800',
  },
};
