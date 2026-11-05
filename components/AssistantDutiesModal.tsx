import React, { useState } from "react";
import { User, AssistantDuty, ASSISTANT_DUTIES_CONFIG } from "../types";
import { ShieldCheck, X, Check } from "lucide-react";

interface AssistantDutiesModalProps {
  targetStudent: User | null;
  onClose: () => void;
  onToggleDuty: (student: User, dutyId: AssistantDuty) => Promise<void>;
  onSetDuties: (student: User, duties: AssistantDuty[]) => Promise<void>;
}

export const AssistantDutiesModal: React.FC<AssistantDutiesModalProps> = ({
  targetStudent,
  onClose,
  onToggleDuty,
  onSetDuties,
}) => {
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  if (!targetStudent) return null;

  const handleGrantAll = async () => {
    setIsUpdating(true);
    try {
      const allDuties = Object.values(AssistantDuty);
      await onSetDuties(targetStudent, allDuties);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRevokeAll = async () => {
    setIsUpdating(true);
    try {
      await onSetDuties(targetStudent, []);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggle = async (dutyId: AssistantDuty) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await onToggleDuty(targetStudent, dutyId);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 border border-gray-100 dark:border-slate-700 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <img
              src={targetStudent.avatar}
              alt={targetStudent.name}
              className="w-12 h-12 rounded-2xl object-cover border-2 border-primary/20 shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-gray-800 dark:text-white">
                  إسناد الرتب والمهام الإدارية 🎖️
                </h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                للطالب: <strong className="text-gray-800 dark:text-white">{targetStudent.name}</strong> (@{targetStudent.username || "طالب"})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Explanatory Banner */}
        <div className="my-4 p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200/80 dark:border-purple-800/50 text-xs text-purple-900 dark:text-purple-200 leading-relaxed space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-purple-950 dark:text-purple-100">
            <ShieldCheck size={16} className="text-purple-600 dark:text-purple-400" />
            <span>نظام المساعدين والرتب المحددة</span>
          </div>
          <p>
            حدد المهام التي ترغب في توكيلها لهذا الطالب. سيمتلك صلاحيات إدارة وتعديل الأقسام المحددة له فقط (مع شارة رتبة رسمية تظهر لزملائه)، ويمكنك سحب أي مهمة فوراً بضغطة زر.
          </p>
        </div>

        {/* Quick Actions (Select All / Clear All) */}
        <div className="flex items-center justify-between text-xs px-1 mb-2">
          <span className="font-bold text-gray-500 dark:text-gray-400">
            المهام الموكلة حالياً: ({(targetStudent.assistantDuties || []).length} من {Object.keys(ASSISTANT_DUTIES_CONFIG).length})
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isUpdating}
              onClick={handleGrantAll}
              className="text-primary hover:underline font-bold text-[11px] cursor-pointer"
            >
              منح كافة الرتب
            </button>
            <span>•</span>
            <button
              type="button"
              disabled={isUpdating || !(targetStudent.assistantDuties?.length)}
              onClick={handleRevokeAll}
              className="text-red-500 hover:underline font-bold text-[11px] disabled:opacity-40 cursor-pointer"
            >
              سحب كافة الصلاحيات
            </button>
          </div>
        </div>

        {/* Duties List */}
        <div className="space-y-2.5 overflow-y-auto no-scrollbar flex-1 py-1">
          {Object.values(ASSISTANT_DUTIES_CONFIG).map((duty) => {
            const isAssigned = (targetStudent.assistantDuties || []).includes(duty.id);
            return (
              <div
                key={duty.id}
                onClick={() => handleToggle(duty.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  isAssigned
                    ? `${duty.bgLight} border-primary/40 ring-1 ring-primary/20 shadow-xs`
                    : "bg-gray-50 dark:bg-slate-700/40 border-gray-200 dark:border-slate-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="shrink-0 mt-0.5">
                    {isAssigned ? (
                      <div className="w-5 h-5 rounded-lg bg-primary text-white flex items-center justify-center shadow-xs">
                        <Check size={13} />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-lg border-2 border-gray-300 dark:border-slate-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-gray-800 dark:text-white">
                        {duty.label}
                      </h4>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${duty.color} ${duty.bgLight}`}>
                        {duty.badge}
                      </span>
                      {isAssigned && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                          مفعّل ✅
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                      {duty.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isUpdating}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer ${
                    isAssigned
                      ? "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 dark:bg-red-950/40 dark:border-red-800/40"
                      : "bg-primary hover:bg-primary/90 text-white shadow-xs"
                  }`}
                >
                  {isAssigned ? "سحب المهمة" : "إسناد المهمة +"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center gap-3">
          <span className="text-xs text-gray-400">
            {isUpdating ? "جاري حفظ التحديثات..." : "يتم حفظ التغييرات وإشعار الطالب فورياً"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition active:scale-95 cursor-pointer"
          >
            إتمام وإنهاء
          </button>
        </div>
      </div>
    </div>
  );
};
