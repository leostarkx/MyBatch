import React, { useEffect, useState } from 'react';
import { Download, Smartphone, X, Share2, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      {compact ? (
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary dark:text-blue-300 text-xs font-bold border border-primary/20 transition shadow-xs active:scale-95"
          title="تثبيت تطبيق دفعتي على الهاتف"
        >
          <Smartphone size={14} />
          <span>تثبيت التطبيق</span>
        </button>
      ) : (
        <button
          onClick={handleInstallClick}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 hover:to-indigo-500/20 border border-blue-200 dark:border-blue-900/40 text-blue-800 dark:text-blue-200 transition-all duration-200 group text-right shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-md shadow-primary/20 group-hover:scale-105 transition-transform shrink-0">
              <Smartphone size={17} />
            </div>
            <div>
              <span className="text-xs font-bold block">تثبيت تطبيق دفعتي</span>
              <span className="text-[10px] text-blue-600/80 dark:text-blue-400 block font-medium">
                {isIOS ? 'تثبيت على آيفون / آيباد' : 'فتح كتطبيق مستقل بالهاتف'}
              </span>
            </div>
          </div>
          <Download size={15} className="text-primary shrink-0" />
        </button>
      )}

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-2xl border border-gray-100 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Smartphone size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    تثبيت تطبيق «دفعتي»
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    استخدم المنصة كتطبيق سريع على شاشتك الرئيسية
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
              >
                <X size={18} />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-gray-50 dark:bg-slate-700/50">
                  <Share2 size={18} className="text-blue-500 shrink-0 mt-0.5" />
                  <span>
                    1. اضغط على زر <strong>المشاركة (Share)</strong> في شريط متصفح Safari بالأسفل.
                  </span>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-gray-50 dark:bg-slate-700/50">
                  <PlusSquare size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    2. مرر للأسفل واختر <strong>الإضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-700/50 space-y-1.5">
                  <p className="font-bold text-gray-800 dark:text-white">لتثبيت التطبيق على جهازك:</p>
                  <p>1. افتح قائمة المتصفح العلوية (النقاط الثلاث ⋮ في Chrome).</p>
                  <p>2. اختر <strong>«تثبيت التطبيق» (Install App)</strong> أو <strong>«الإضافة إلى الشاشة الرئيسية»</strong>.</p>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowGuide(false)}
              className="w-full rounded-2xl bg-primary py-2.5 text-xs font-bold text-white shadow-md shadow-primary/20 hover:bg-primary/90 transition"
            >
              حسناً، فهمت
            </button>
          </div>
        </div>
      )}
    </>
  );
};
