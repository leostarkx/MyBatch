import React, { useState, useEffect } from "react";
import { User } from "../types";
import { Edit3, X, Save, Loader2 } from "lucide-react";

interface NicknameModalProps {
  student: User | null;
  onClose: () => void;
  onSave: (studentUid: string, nickname: string) => Promise<void>;
}

export const NicknameModal: React.FC<NicknameModalProps> = ({
  student,
  onClose,
  onSave,
}) => {
  const [nicknameInput, setNicknameInput] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (student) {
      setNicknameInput(student.repNickname || "");
    }
  }, [student]);

  if (!student) return null;

  const handleSave = async (customVal?: string) => {
    setIsSaving(true);
    try {
      await onSave(student.uid, customVal !== undefined ? customVal : nicknameInput);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-slate-700 space-y-4 animate-in zoom-in-95 duration-200"
      >
        <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Edit3 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-800 dark:text-white">
                تسمية مخصصة للترتيب الأبجدي 🏷️
              </h3>
              <p className="text-xs text-gray-400">
                تظهر لك في كشوفات الحضور، السعي، ونتائج الكويزات
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-xl cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border border-gray-100 dark:border-slate-700">
          <img
            src={student.avatar}
            alt=""
            className="w-11 h-11 rounded-full object-cover border border-gray-200 dark:border-slate-600 shrink-0"
          />
          <div className="min-w-0">
            <span className="text-xs text-gray-400 font-bold block">الاسم الأصلي المسجل:</span>
            <span className="text-sm font-black text-gray-800 dark:text-white truncate block">
              {student.name}
            </span>
            <span className="text-[10px] text-gray-400 font-mono">
              @{student.username || "student"}
            </span>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
            اللقب أو الاسم الأبجدي المعتمد
          </label>
          <input
            type="text"
            value={nicknameInput}
            onChange={(e) => setNicknameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
            placeholder="مثال: أحمد علي جاسم (الاسم الرسمي للكشف)"
            className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition"
            autoFocus
          />
          <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
            * عند تحديد هذا اللقب، سيترتب الطالب بدقة في قائمة الحضور والسعي التراكمي والكويزات بناءً على هذا الاسم وفق الحروف الهجائية العربية.
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2">
          {student.repNickname && (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave("")}
              className="px-3 py-2.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl font-bold transition disabled:opacity-50 cursor-pointer"
            >
              إلغاء اللقب
            </button>
          )}
          <div className="flex gap-2 flex-1 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs hover:bg-gray-200 transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave()}
              className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-xs shadow-md shadow-primary/20 hover:bg-primary/90 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              <span>حفظ التسمية والأبجدية</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
