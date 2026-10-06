import React, { useState } from "react";
import { Calculator, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

interface FinalExamGradeCalculatorProps {
  courseName: string;
  currentCumulativeScore: number; // Student's recorded cumulative score out of 50
  hasRecordedGrades: boolean;
}

const TARGET_TIERS = [
  {
    label: "النجاح (مقبول)",
    targetTotal: 50,
    colorClass:
      "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300",
    badgeClass: "bg-emerald-600 text-white",
  },
  {
    label: "متوسط",
    targetTotal: 60,
    colorClass:
      "bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/50 text-sky-700 dark:text-sky-300",
    badgeClass: "bg-sky-600 text-white",
  },
  {
    label: "جيد",
    targetTotal: 70,
    colorClass:
      "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-300",
    badgeClass: "bg-blue-600 text-white",
  },
  {
    label: "جيد جداً",
    targetTotal: 80,
    colorClass:
      "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300",
    badgeClass: "bg-indigo-600 text-white",
  },
  {
    label: "امتياز 🌟",
    targetTotal: 90,
    colorClass:
      "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300",
    badgeClass: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
  },
];

export const FinalExamGradeCalculator: React.FC<
  FinalExamGradeCalculatorProps
> = ({ courseName, currentCumulativeScore, hasRecordedGrades }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [simulatedSaei, setSimulatedSaei] = useState<number>(
    hasRecordedGrades ? currentCumulativeScore : 35
  );

  // Sync if prop changes and user opens
  const handleToggle = () => {
    if (!isOpen && hasRecordedGrades) {
      setSimulatedSaei(currentCumulativeScore);
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full py-2.5 px-4 rounded-2xl text-xs font-black transition flex items-center justify-between gap-2 ${
          isOpen
            ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
            : "bg-indigo-50/80 hover:bg-indigo-100/80 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-slate-600"
        }`}
      >
        <div className="flex items-center gap-2">
          <Calculator size={16} />
          <span>حاسبة الفاينال: كم أحتاج في الامتحان النهائي (من 50)؟ 🧮</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-black/10 dark:bg-white/10">
          {isOpen ? "إغلاق ▲" : "احسب الآن ▼"}
        </span>
      </button>

      {isOpen && (
        <div className="mt-3 p-4 rounded-2xl bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/40 dark:from-slate-800 dark:via-slate-800 dark:to-slate-700/60 border border-indigo-200/80 dark:border-slate-600 space-y-4 animate-in fade-in duration-200">
          {/* Interactive Slider & Input for Cumulative Saei (out of 50) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-black text-gray-800 dark:text-white flex items-center gap-1.5">
                <Sparkles size={14} className="text-indigo-600" />
                <span>درجة السعي التراكمي (من 50):</span>
              </label>

              <div className="flex items-center gap-1.5">
                {hasRecordedGrades &&
                  simulatedSaei !== currentCumulativeScore && (
                    <button
                      type="button"
                      onClick={() => setSimulatedSaei(currentCumulativeScore)}
                      className="text-[10px] font-bold text-indigo-600 hover:underline"
                    >
                      العودة لسعيي الفعلي ({currentCumulativeScore})
                    </button>
                  )}
                <input
                  type="number"
                  min={0}
                  max={50}
                  step={0.5}
                  value={simulatedSaei}
                  onChange={(e) => {
                    const val = Math.min(
                      50,
                      Math.max(0, Number(e.target.value) || 0)
                    );
                    setSimulatedSaei(val);
                  }}
                  className="w-16 text-center font-black text-sm bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-slate-500 rounded-xl py-1 outline-none"
                />
                <span className="text-xs font-bold text-gray-400">/ 50</span>
              </div>
            </div>

            <input
              type="range"
              min={0}
              max={50}
              step={0.5}
              value={simulatedSaei}
              onChange={(e) => setSimulatedSaei(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer h-2 bg-gray-200 dark:bg-slate-600 rounded-lg"
            />
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              * يمكنك تحريك المؤشر لتجربة أي سعي متوقع ومعرفة الدرجة المطلوبة
              بالفاينال لمادة <strong>{courseName}</strong>.
            </p>
          </div>

          {/* Required Final Score Grid for Each Grade Tier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {TARGET_TIERS.map((tier) => {
              const neededInFinal = Number(
                (tier.targetTotal - simulatedSaei).toFixed(1)
              );
              const isAlreadyGuaranteed = neededInFinal <= 0;
              const isImpossible = neededInFinal > 50;

              return (
                <div
                  key={tier.targetTotal}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                    isImpossible
                      ? "bg-gray-100/70 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 opacity-65"
                      : tier.colorClass
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black">{tier.label}</span>
                      <span className="text-[10px] font-bold opacity-75">
                        ({tier.targetTotal}%)
                      </span>
                    </div>
                    <span className="text-[10px] block mt-0.5 opacity-85">
                      {isAlreadyGuaranteed
                        ? "مضمون بالسعي الحالي! 🎉"
                        : isImpossible
                        ? `يتطلب ${neededInFinal} من 50 (أعلى من سقف الفاينال)`
                        : `تحتاج بالفاينال على الأقل:`}
                    </span>
                  </div>

                  <div className="shrink-0 text-left">
                    {isAlreadyGuaranteed ? (
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-[11px] font-black inline-flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        <span>0 / 50</span>
                      </span>
                    ) : isImpossible ? (
                      <span className="px-2.5 py-1 rounded-xl bg-gray-300 dark:bg-slate-700 text-gray-600 dark:text-gray-400 text-[10px] font-bold inline-flex items-center gap-1">
                        <AlertCircle size={12} />
                        <span>غير متاح</span>
                      </span>
                    ) : (
                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-black inline-block shadow-xs ${tier.badgeClass}`}
                      >
                        {neededInFinal}{" "}
                        <span className="text-[10px] opacity-85">/ 50</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
