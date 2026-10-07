import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Smartphone,
  CheckCircle2,
  Sliders,
  Sparkles,
  Check,
  RotateCcw,
  Send,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import {
  User,
  NotificationPreferences,
  Tab,
} from '../types';
import {
  getUserNotificationPreferences,
  NOTIFICATION_CATEGORY_META,
  requestBrowserNotificationPermission,
  showBrowserPushNotification,
  playNotificationChime,
} from '../services/notificationService';
import {
  saveUserToFirestore,
  saveNotificationToFirestore,
} from '../services/firebase';

interface NotificationPreferencesCardProps {
  currentUser: User;
  onUpdateUser: (updated: User) => void;
}

export const NotificationPreferencesCard: React.FC<
  NotificationPreferencesCardProps
> = ({ currentUser, onUpdateUser }) => {
  const [prefs, setPrefs] = useState<NotificationPreferences>(() =>
    getUserNotificationPreferences(currentUser)
  );
  const [browserPermission, setBrowserPermission] = useState<
    NotificationPermission | 'unsupported'
  >('default');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isTestingNotif, setIsTestingNotif] = useState(false);

  useEffect(() => {
    setPrefs(getUserNotificationPreferences(currentUser));
  }, [currentUser.uid, currentUser.notificationPrefs]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPermission(window.Notification.permission);
    } else {
      setBrowserPermission('unsupported');
    }
  }, []);

  const persistPreferences = async (nextPrefs: NotificationPreferences) => {
    setPrefs(nextPrefs);
    setIsSaving(true);
    try {
      const updatedUser: User = {
        ...currentUser,
        notificationPrefs: nextPrefs,
      };
      onUpdateUser(updatedUser);
      await saveUserToFirestore(updatedUser);
      setSaveMessage('تم حفظ إعدادات الإشعارات تلقائياً ✓');
      setTimeout(() => setSaveMessage(null), 2500);
    } catch (err) {
      console.error('Failed to save notification prefs:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleMaster = async () => {
    const nextEnabled = !prefs.enabled;
    if (nextEnabled && browserPermission === 'default') {
      const perm = await requestBrowserNotificationPermission();
      setBrowserPermission(perm);
    }
    const next: NotificationPreferences = {
      ...prefs,
      enabled: nextEnabled,
    };
    await persistPreferences(next);
  };

  const handleToggleBrowserPush = async () => {
    if (!prefs.browserPush) {
      const perm = await requestBrowserNotificationPermission();
      setBrowserPermission(perm);
      if (perm === 'denied') {
        alert(
          '⚠️ تم حظر إشعارات المتصفح من إعدادات المتصفح لديك. يرجى السماح بالإشعارات من أيقونة القفل بجانب رابط الموقع في الأعلى.'
        );
        return;
      }
    }
    const next: NotificationPreferences = {
      ...prefs,
      browserPush: !prefs.browserPush,
    };
    await persistPreferences(next);
  };

  const handleToggleSound = async () => {
    const nextSound = !prefs.soundEnabled;
    if (nextSound) {
      playNotificationChime();
    }
    const next: NotificationPreferences = {
      ...prefs,
      soundEnabled: nextSound,
    };
    await persistPreferences(next);
  };

  const handleToggleCategory = async (
    key: keyof NotificationPreferences['categories']
  ) => {
    const next: NotificationPreferences = {
      ...prefs,
      categories: {
        ...prefs.categories,
        [key]: !prefs.categories[key],
      },
    };
    await persistPreferences(next);
  };

  const handleSelectAllCategories = async (enableAll: boolean) => {
    const updatedCategories = Object.keys(prefs.categories).reduce(
      (acc, k) => {
        acc[k as keyof NotificationPreferences['categories']] = enableAll;
        return acc;
      },
      {} as NotificationPreferences['categories']
    );
    const next: NotificationPreferences = {
      ...prefs,
      enabled: enableAll ? true : prefs.enabled,
      categories: updatedCategories,
    };
    await persistPreferences(next);
  };

  const handleSendTestNotification = async () => {
    setIsTestingNotif(true);
    try {
      if (prefs.soundEnabled) {
        playNotificationChime();
      }
      if (prefs.browserPush) {
        const perm = await requestBrowserNotificationPermission();
        setBrowserPermission(perm);
        if (perm === 'granted') {
          await showBrowserPushNotification(
            '🔔 إشعار تجريبي - منصة دفعتي',
            `أهلاً ${currentUser.name}! نظام الإشعارات المخصص يعمل بنجاح على جهازك.`
          );
        }
      }
      await saveNotificationToFirestore({
        id: `notif_test_${Date.now()}`,
        userId: currentUser.uid,
        batchCode: currentUser.batchCode,
        type: 'SYSTEM',
        title: '🔔 تجربة نظام الإشعارات الذكي',
        content: `مرحباً ${currentUser.name}! تم تفعيل الإشعارات بنجاح وستصلك التنبيهات حسب الأقسام التي خصصتها في حسابك.`,
        isRead: false,
        timestamp: Date.now(),
        targetTab: Tab.PROFILE,
      });
    } catch (e) {
      console.error('Error sending test notification:', e);
    } finally {
      setTimeout(() => setIsTestingNotif(false), 1000);
    }
  };

  const categoryKeys = Object.keys(
    NOTIFICATION_CATEGORY_META
  ) as (keyof NotificationPreferences['categories'])[];

  const activeCategoriesCount = categoryKeys.filter(
    (k) => prefs.categories[k]
  ).length;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-all duration-300">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 p-6 text-white relative overflow-hidden">
        <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/25 shadow-md">
              {prefs.enabled ? (
                <Bell size={24} className="text-amber-300 animate-bounce" />
              ) : (
                <BellOff size={24} className="text-white/70" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black text-white">
                  إدارة وتخصيص الإشعارات الذكية 🔔
                </h3>
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                    prefs.enabled
                      ? 'bg-emerald-400/25 text-emerald-100 border border-emerald-300/40'
                      : 'bg-rose-500/30 text-rose-100 border border-rose-300/30'
                  }`}
                >
                  {prefs.enabled
                    ? `مفعّل (${activeCategoriesCount}/${categoryKeys.length} أقسام)`
                    : 'الإشعارات متوقفة'}
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-1 leading-relaxed max-w-xl">
                تحكم بالكامل في وضع الإشعارات وخصص الأقسام التي ترغب باستلام تنبيهات فورية عنها (تبليغات، واجبات، امتحانات، ملازم، درجات، حضور، أو دردشة).
              </p>
            </div>
          </div>

          {/* Master Toggle Button */}
          <button
            type="button"
            onClick={handleToggleMaster}
            className={`px-5 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition shadow-lg shrink-0 active:scale-95 cursor-pointer ${
              prefs.enabled
                ? 'bg-white text-indigo-700 hover:bg-blue-50'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
            }`}
          >
            {prefs.enabled ? (
              <>
                <CheckCircle2 size={17} className="text-emerald-600" />
                <span>وضع الإشعارات: مفعّل</span>
              </>
            ) : (
              <>
                <Bell size={17} />
                <span>تفعيل وضع الإشعارات الآن</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Controls Body */}
      <div className="p-6 space-y-6">
        {/* Save Feedback & Test Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 dark:bg-slate-700/40 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2 text-xs">
            <Sliders size={16} className="text-primary shrink-0" />
            <span className="font-bold text-gray-700 dark:text-gray-200">
              طرق استلام التنبيهات على جهازك:
            </span>
            {saveMessage && (
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-in fade-in">
                <Check size={12} />
                {saveMessage}
              </span>
            )}
            {isSaving && !saveMessage && (
              <span className="text-[11px] text-gray-400">جاري الحفظ...</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleSendTestNotification}
            disabled={isTestingNotif || !prefs.enabled}
            className="px-3.5 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer active:scale-95"
          >
            <Send size={13} />
            <span>
              {isTestingNotif ? 'تم إرسال الإشعار التجريبي 🔔' : 'إرسال إشعار تجريبي لي'}
            </span>
          </button>
        </div>

        {/* Delivery Channels (Browser Push & Sound) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Browser / Phone Push Toggle */}
          <div
            onClick={() => prefs.enabled && handleToggleBrowserPush()}
            className={`p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
              !prefs.enabled
                ? 'opacity-50 pointer-events-none bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700'
                : prefs.browserPush && browserPermission === 'granted'
                ? 'bg-blue-50/50 dark:bg-blue-950/25 border-blue-200 dark:border-blue-800/60 cursor-pointer'
                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-primary/40 cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  prefs.browserPush
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-400'
                }`}
              >
                <Smartphone size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-bold text-sm text-gray-800 dark:text-white">
                    إشعارات النظام والمتصفح (Push)
                  </h4>
                  {browserPermission === 'granted' ? (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <ShieldCheck size={11} />
                      مسموح
                    </span>
                  ) : browserPermission === 'denied' ? (
                    <span className="text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <AlertCircle size={11} />
                      محظور من المتصفح
                    </span>
                  ) : null}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  ظهور الإشعار في شريط هاتفك أو سطح المكتب عند وصول تحديث جديد
                </p>
              </div>
            </div>

            <div
              className={`w-12 h-6 rounded-full p-1 transition-colors shrink-0 ${
                prefs.browserPush && prefs.enabled
                  ? 'bg-blue-600'
                  : 'bg-gray-300 dark:bg-slate-600'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                  prefs.browserPush && prefs.enabled
                    ? '-translate-x-6'
                    : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          {/* Sound Chime Toggle */}
          <div
            onClick={() => prefs.enabled && handleToggleSound()}
            className={`p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
              !prefs.enabled
                ? 'opacity-50 pointer-events-none bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700'
                : prefs.soundEnabled
                ? 'bg-amber-50/50 dark:bg-amber-950/25 border-amber-200 dark:border-amber-800/60 cursor-pointer'
                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-primary/40 cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  prefs.soundEnabled
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-400'
                }`}
              >
                {prefs.soundEnabled ? (
                  <Volume2 size={20} />
                ) : (
                  <VolumeX size={20} />
                )}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-gray-800 dark:text-white">
                  نغمة التنبيه الصوتي 🔊
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  تشغيل نغمة هادئة مع نافذة منبثقة فورية داخل التطبيق عند وصول إشعار
                </p>
              </div>
            </div>

            <div
              className={`w-12 h-6 rounded-full p-1 transition-colors shrink-0 ${
                prefs.soundEnabled && prefs.enabled
                  ? 'bg-amber-500'
                  : 'bg-gray-300 dark:bg-slate-600'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                  prefs.soundEnabled && prefs.enabled
                    ? '-translate-x-6'
                    : 'translate-x-0'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Granular Categories Section */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-black text-sm text-gray-800 dark:text-white flex items-center gap-2">
                <Sparkles size={16} className="text-primary" />
                <span>تخصيص أنواع الإشعارات حسب رغبتك:</span>
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                اختر الأقسام التي تهمك ليصلك إشعار فوري عند أي جديد فيها، وأوقف ما لا تحتاجه:
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => handleSelectAllCategories(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-[11px] font-bold hover:bg-emerald-100 transition cursor-pointer"
              >
                تفعيل الكل ✓
              </button>
              <button
                type="button"
                onClick={() => handleSelectAllCategories(false)}
                className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-[11px] font-bold hover:bg-gray-200 transition flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={11} />
                <span>إيقاف الكل</span>
              </button>
            </div>
          </div>

          <div
            className={`grid grid-cols-1 md:grid-cols-2 gap-3 transition-opacity ${
              !prefs.enabled ? 'opacity-45 pointer-events-none' : ''
            }`}
          >
            {categoryKeys.map((key) => {
              const meta = NOTIFICATION_CATEGORY_META[key];
              const isChecked = prefs.categories[key];

              return (
                <div
                  key={key}
                  onClick={() => handleToggleCategory(key)}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer select-none ${
                    isChecked
                      ? 'bg-primary/[0.03] dark:bg-primary/10 border-primary/30 shadow-xs'
                      : 'bg-gray-50/70 dark:bg-slate-800/60 border-gray-200/70 dark:border-slate-700 opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 border ${meta.badgeBg}`}
                    >
                      {meta.emoji}
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-bold text-xs sm:text-sm text-gray-800 dark:text-white truncate">
                        {meta.label}
                      </h5>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                        {meta.description}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition ${
                      isChecked
                        ? 'bg-primary border-primary text-white shadow-xs'
                        : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600'
                    }`}
                  >
                    {isChecked && <Check size={14} strokeWidth={3} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
