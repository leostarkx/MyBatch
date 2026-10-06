import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  PlusCircle,
  Sparkles,
  X,
  ShieldCheck,
  Layers,
  ArrowUpRight,
  Database,
  CloudUpload,
  ExternalLink,
  FolderOpen,
  Info,
} from 'lucide-react';
import {
  connectVaultSlot,
  disconnectVaultSlot,
  setActiveUploadSlot,
  getStoragePool,
  StoragePoolInfo,
  StorageVaultSlot,
  getCachedDriveToken,
} from '../services/googleDrive';
import { getStorageConfig, saveStorageConfig } from '../services/storageService';

interface GoogleDriveManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isManager: boolean;
}

export const GoogleDriveManagerModal: React.FC<GoogleDriveManagerModalProps> = ({
  isOpen,
  onClose,
  isManager,
}) => {
  const [loadingSlot, setLoadingSlot] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pool, setPool] = useState<StoragePoolInfo | null>(null);
  const [driveFolderUrl, setDriveFolderUrl] = useState('');
  const [savingFolderUrl, setSavingFolderUrl] = useState(false);

  const loadPoolData = async () => {
    try {
      const data = await getStoragePool();
      setPool(data);
    } catch (err: any) {
      console.warn('Error loading storage pool:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPoolData();
      setError(null);
      setSuccessMsg(null);
      getStorageConfig().then((cfg) => {
        if (cfg?.googleDriveFolderUrl) setDriveFolderUrl(cfg.googleDriveFolderUrl);
      });
    }
  }, [isOpen]);

  const handleSaveDriveFolderUrl = async () => {
    setSavingFolderUrl(true);
    try {
      const existing = await getStorageConfig();
      await saveStorageConfig({
        cloudinaryCloudName: existing?.cloudinaryCloudName || '',
        cloudinaryUploadPreset: existing?.cloudinaryUploadPreset || '',
        googleDriveFolderUrl: driveFolderUrl.trim(),
      });
      setSuccessMsg('تم حفظ وتحديث رابط مجلد Google Drive العام بنجاح! سيتمكن الطلاب من تصفحه مباشرة.');
    } catch (err: any) {
      setError('تعذر حفظ رابط المجلد');
    } finally {
      setSavingFolderUrl(false);
    }
  };

  if (!isOpen || !isManager) return null;

  const handleConnectSlot = async (slotId: number) => {
    setLoadingSlot(slotId);
    setError(null);
    setSuccessMsg(null);
    try {
      const slot = await connectVaultSlot(slotId);
      if (!slot) {
        // User closed or cancelled popup window intentionally
        return;
      }
      await loadPoolData();
      setSuccessMsg(`تم ربط ${slot.title} (${slot.email}) بنجاح! السعة المضافة: 15GB.`);
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.message?.includes('popup-closed-by-user') ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('cancelled-popup-request')
      ) {
        return;
      }
      console.error(err);
      setError(err.message || 'تعذر ربط الحساب. يرجى إعادة المحاولة واختيار الحساب ومنح الإذن.');
    } finally {
      setLoadingSlot(null);
    }
  };

  const handleDisconnectSlot = async (slotId: number, slotTitle: string) => {
    if (!confirm(`هل أنت متأكد من قطع اتصال ${slotTitle}؟`)) return;
    setLoadingSlot(slotId);
    setError(null);
    setSuccessMsg(null);
    try {
      await disconnectVaultSlot(slotId);
      await loadPoolData();
      setSuccessMsg(`تم قطع اتصال ${slotTitle} بنجاح.`);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء قطع الاتصال.');
    } finally {
      setLoadingSlot(null);
    }
  };

  const handleSetActiveSlot = async (slotId: number, slotTitle: string) => {
    setLoadingSlot(slotId);
    try {
      await setActiveUploadSlot(slotId);
      await loadPoolData();
      setSuccessMsg(`تم تعيين ${slotTitle} كالحساب النشط المعتمد للرفع حالياً.`);
    } catch (err: any) {
      setError(err.message || 'تعذر تغيير الحساب النشط.');
    } finally {
      setLoadingSlot(null);
    }
  };

  const connectedCount = pool?.slots.filter((s) => s.email).length || 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-primary text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Database size={26} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                مستودع التخزين السحابي (Google Drive Pool)
                <span className="text-[11px] bg-amber-400 text-slate-900 font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                  45GB مجاناً
                </span>
              </h2>
              <p className="text-xs text-blue-100 mt-0.5">
                ربط 3 حسابات Google وتجميعها في مساحة سحابية موحدة لرفع كل المحاضرات والفيديوهات والمشاريع
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-xs flex items-center gap-3">
              <AlertCircle size={20} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-3">
              <CheckCircle2 size={20} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Total Pool Capacity Overview Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/5 to-indigo-500/10 dark:from-slate-700/60 dark:to-slate-700/30 border border-blue-200/80 dark:border-slate-600 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 block">
                  إجمالي المساحة المجمعة للمستودع
                </span>
                <h3 className="text-xl font-extrabold text-gray-800 dark:text-white flex items-center gap-2 mt-0.5">
                  <span>{pool ? pool.formattedTotalUsage : '0 GB'}</span>
                  <span className="text-sm font-medium text-gray-400 dark:text-gray-500">
                    من أصل {connectedCount * 15} GB ({pool ? pool.totalPercent : 0}% مستخدمة)
                  </span>
                </h3>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-blue-600 dark:text-blue-400" />
                  {connectedCount} من 3 حسابات مربوطة
                </span>
              </div>
            </div>

            {/* Total Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-slate-600 h-3.5 rounded-full overflow-hidden p-0.5 shadow-inner">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  (pool?.totalPercent || 0) > 85
                    ? 'bg-red-500'
                    : (pool?.totalPercent || 0) > 60
                    ? 'bg-amber-500'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                }`}
                style={{ width: `${Math.max(connectedCount > 0 ? 5 : 0, pool?.totalPercent || 0)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 pt-1">
              <span>كل حساب يمنحك 15GB مجانية بالكامل</span>
              <span className="font-bold text-primary dark:text-blue-400">
                الهدف: 3 حسابات = 45GB تخزين سحابي
              </span>
            </div>
          </div>

          {/* Firebase Cloud Storage Active Badge */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <CheckCircle2 size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h4 className="font-bold text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  السحابة السريعة للنظام (Firebase Cloud Storage): نشطة 100%
                </h4>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                  تخزين ورفع مباشر
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300/80 mt-1 leading-relaxed">
                جميع ملفات وملازم وفيديوهات ومشاريع النظام تُرفع وتُحفظ تلقائياً في السحابة المركزية، دون الحاجة لأي تسجيل دخول أو تعقيدات!
              </p>
            </div>
          </div>

          {/* Google Drive Shared Folder Link */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-700/40 border border-gray-200 dark:border-slate-600 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen size={18} className="text-amber-500" />
                <h4 className="text-xs font-bold text-gray-800 dark:text-white">
                  رابط مجلد Google Drive المشترك لدفعتك (اختياري)
                </h4>
              </div>
              {driveFolderUrl && (
                <a
                  href={driveFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-primary hover:underline font-bold flex items-center gap-1"
                >
                  <ExternalLink size={12} />
                  فتح المجلد
                </a>
              )}
            </div>

            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
              إذا قمت بإنشاء مجلد في حسابك <span className="font-mono text-primary font-bold">dufaatystorage@gmail.com</span> وتريد أن يتمكن جميع الطلاب من تصفحه وتحميله مباشرة بضغطة زر، ضع رابط المجلد المشترك هنا:
            </p>

            <div className="flex gap-2">
              <input
                type="url"
                value={driveFolderUrl}
                onChange={(e) => setDriveFolderUrl(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="flex-1 bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                dir="ltr"
              />
              <button
                type="button"
                onClick={handleSaveDriveFolderUrl}
                disabled={savingFolderUrl}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0"
              >
                {savingFolderUrl ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                <span>حفظ الرابط</span>
              </button>
            </div>
          </div>

          {/* Google OAuth 403 Note */}
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <Info size={17} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>ملاحظة بخصوص خطأ Google 403 (access_denied):</strong>
              <div className="mt-1 space-y-0.5 text-amber-800 dark:text-amber-300/90">
                • لربط الحسابات تلقائياً عبر الأزرار أدناه دون ظهور خطأ 403، يمكنك استخدام إيميلك الأساسي المطور <span className="font-mono font-bold">hamodyaliraqi2005@gmail.com</span> (سيعمل فوراً دون حظر).
                <br />
                • أو أضف الإيميل <span className="font-mono font-bold">dufaatystorage@gmail.com</span> كمختبِر في Google Cloud Console.
                <br />
                • أو بكل بساطة ضع رابط مجلد Google Drive أعلاه، وسيتكفل نظام السحابة المباشرة بكل شيء!
              </div>
            </div>
          </div>

          {/* The 3 Account Slots */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Layers size={17} className="text-primary" />
                حسابات التخزين الثلاثة (Vault Slots):
              </h4>
              <span className="text-[11px] text-gray-400">
                اضغط على أي حساب للربط أو لتعيينه للرفع
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              {pool?.slots.map((slot: StorageVaultSlot) => {
                const isSlotLoading = loadingSlot === slot.slotId;
                const isConnected = !!slot.email;
                const isSlotActive = slot.slotId === pool.activeSlotId && isConnected;

                return (
                  <div
                    key={slot.slotId}
                    className={`p-4 rounded-2xl border transition-all duration-200 ${
                      isSlotActive
                        ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-400 dark:border-blue-700 shadow-sm'
                        : isConnected
                        ? 'bg-white dark:bg-slate-700/50 border-gray-200 dark:border-slate-600'
                        : 'bg-gray-50/80 dark:bg-slate-800/40 border-dashed border-gray-300 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left Side: Avatar and Account info */}
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {slot.photoUrl ? (
                            <img
                              src={slot.photoUrl}
                              alt=""
                              className="w-11 h-11 rounded-2xl border-2 border-primary object-cover"
                            />
                          ) : (
                            <div
                              className={`w-11 h-11 rounded-2xl font-black text-sm flex items-center justify-center ${
                                isConnected
                                  ? 'bg-primary/10 text-primary border border-primary/20'
                                  : 'bg-gray-200 dark:bg-slate-700 text-gray-400'
                              }`}
                            >
                              #{slot.slotId}
                            </div>
                          )}

                          {isSlotActive && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-sm text-gray-800 dark:text-white">
                              {slot.title}
                            </h5>
                            {isSlotActive && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                                الحساب النشط للرفع
                              </span>
                            )}
                          </div>

                          {isConnected ? (
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5" dir="ltr">
                              {slot.email}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                              الخانة شاغرة (15GB متوفرة للربط)
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right Side: Action Buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {isConnected ? (
                          <>
                            {!isSlotActive && (
                              <button
                                onClick={() => handleSetActiveSlot(slot.slotId, slot.title)}
                                disabled={isSlotLoading}
                                className="px-3 py-1.5 bg-white dark:bg-slate-600 hover:bg-gray-100 dark:hover:bg-slate-500 border border-gray-200 dark:border-slate-500 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                                title="تعيين هذا الحساب ليتم رفع الملفات والمشاريع الجديدة عليه"
                              >
                                <ArrowUpRight size={14} />
                                <span>تفعيل للرفع</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleConnectSlot(slot.slotId)}
                              disabled={isSlotLoading}
                              className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-slate-600 rounded-xl transition"
                              title="تحديث أو تبديل هذا الحساب"
                            >
                              <RefreshCw size={15} className={isSlotLoading ? 'animate-spin' : ''} />
                            </button>

                            <button
                              onClick={() => handleDisconnectSlot(slot.slotId, slot.title)}
                              disabled={isSlotLoading}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"
                              title="قطع اتصال هذا الحساب"
                            >
                              <LogOut size={15} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleConnectSlot(slot.slotId)}
                            disabled={isSlotLoading}
                            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 flex items-center gap-2 transition"
                          >
                            {isSlotLoading ? (
                              <RefreshCw size={15} className="animate-spin" />
                            ) : (
                              <PlusCircle size={15} />
                            )}
                            ربط هذا الحساب (15GB)
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Storage Meter if connected */}
                    {isConnected && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-600/60 space-y-1.5">
                        <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400">
                          <span>المساحة المستهلكة في هذا الحساب:</span>
                          <span className="font-bold text-gray-700 dark:text-gray-300">
                            {slot.formattedUsage} من {slot.formattedLimit} ({slot.percentUsed}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-slate-600 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              slot.percentUsed > 85
                                ? 'bg-red-500'
                                : slot.percentUsed > 60
                                ? 'bg-amber-500'
                                : 'bg-primary'
                            }`}
                            style={{ width: `${Math.max(4, slot.percentUsed)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Practical Guide & Tips */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500" />
              كيف يعمل مستودع التخزين الذكي للدفعة؟
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-gray-600 dark:text-gray-400">
              <div className="p-3 bg-gray-50 dark:bg-slate-700/30 rounded-2xl border border-gray-100 dark:border-slate-700/60 flex items-start gap-2">
                <ShieldCheck size={18} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-gray-800 dark:text-gray-200">صلاحية عامة لجميع الطلاب</strong>
                  أي ملف يتم رفعه في أي حساب من الحسابات الثلاثة يصبح متاحاً للمشاهدة والتحميل المباشر لجميع الطلاب دون قيود.
                </div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-slate-700/30 rounded-2xl border border-gray-100 dark:border-slate-700/60 flex items-start gap-2">
                <Layers size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-gray-800 dark:text-gray-200">تبديل فوري عند الامتلاء</strong>
                  يمكنك النقر على زر "تفعيل للرفع" على أي حساب للانتقال إليه فوراً، وتظل الملفات السابقة تعمل 100%.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center shrink-0">
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <HardDrive size={15} className="text-primary" />
            <span>نظام التخزين السحابي الموحد لدفعتي</span>
          </div>
          <button
            onClick={onClose}
            className="py-2.5 px-6 bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 text-gray-700 dark:text-gray-200 rounded-xl font-bold text-xs transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
