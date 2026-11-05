import React, { useState, useEffect } from "react";
import { User } from "../types";
import { Mail, X, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface ChangeEmailModalProps {
  isOpen: boolean;
  targetUser: User | null;
  onClose: () => void;
  onUpdateEmail: (targetUid: string, newEmail: string) => Promise<boolean>;
}

export const ChangeEmailModal: React.FC<ChangeEmailModalProps> = ({
  isOpen,
  targetUser,
  onClose,
  onUpdateEmail,
}) => {
  const [newEmailInput, setNewEmailInput] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  useEffect(() => {
    if (targetUser) {
      setNewEmailInput(targetUser.email || "");
      setError("");
      setSuccess(null);
    }
  }, [targetUser, isOpen]);

  if (!isOpen || !targetUser) return null;

  const handleSubmit = async () => {
    const trimmed = newEmailInput.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setError("يرجى كتابة عنوان بريد إلكتروني صالح (مثال: student@gmail.com)");
      return;
    }

    setIsUpdating(true);
    setError("");
    try {
      const ok = await onUpdateEmail(targetUser.uid, trimmed);
      if (ok) {
        setSuccess("تم تبديل وتحديث البريد الإلكتروني بنجاح! جميع بياناتك وسجلاتك الأكاديمية مستمرة ومحفوظة.");
        setTimeout(() => {
          onClose();
          setSuccess(null);
        }, 1500);
      }
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء تحديث البريد الإلكتروني");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      onClick={() => {
        if (!isUpdating) onClose();
      }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-slate-700 space-y-4 animate-in zoom-in-95 duration-200"
      >
        <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Mail size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-800 dark:text-white">
                تبديل البريد الإلكتروني للحساب 🔄
              </h3>
              <p className="text-xs text-gray-400">
                مع الحفاظ على كامل السجلات والدرجات والغيابات
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isUpdating}
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-xl disabled:opacity-50 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Current Email display */}
        <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border border-gray-100 dark:border-slate-700 space-y-1">
          <span className="text-[11px] text-gray-400 font-bold block">
            الحساب المستهدف:
          </span>
          <div className="flex items-center justify-between text-xs">
            <span className="font-black text-gray-800 dark:text-white">
              {targetUser.name}
            </span>
            <span className="font-mono text-gray-500 dark:text-gray-400">
              {targetUser.email || "لا يوجد إيميل سابق"}
            </span>
          </div>
        </div>

        {/* Safe note */}
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed flex items-start gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
          <span>
            <strong>ضمان استمرار البيانات 100%:</strong> تغيير البريد الإلكتروني لا يحذف ولا يفصل حسابك، بل يحدّث إيميل تسجيل الدخول والاتصال مع بقاء جميع سعياتك، حضورك، كروباتك ومشاريعك كما هي بالضبط.
          </span>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900/40 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl text-xs flex items-center gap-2">
            <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
            البريد الإلكتروني الجديد <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={newEmailInput}
            onChange={(e) => {
              setNewEmailInput(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            placeholder="student.new@gmail.com"
            className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 text-left transition"
            dir="ltr"
            autoFocus
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            disabled={isUpdating}
            onClick={onClose}
            className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-xs cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            disabled={isUpdating || !newEmailInput.trim()}
            onClick={handleSubmit}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50 transition active:scale-95 cursor-pointer"
          >
            {isUpdating ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Save size={15} />
            )}
            <span>تحديث وحفظ الإيميل</span>
          </button>
        </div>
      </div>
    </div>
  );
};
