import React, { useState } from "react";
import { Crown, X, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from "lucide-react";

export interface RedeemCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRedeem: (code: string) => Promise<{ success: boolean; message: string }>;
}

export const RedeemCodeModal: React.FC<RedeemCodeModalProps> = ({
  isOpen,
  onClose,
  onRedeem,
}) => {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!code.trim() || isLoading) return;
    setIsLoading(true);
    setFeedback(null);
    try {
      const res = await onRedeem(code.trim());
      if (res.success) {
        setFeedback({ type: "success", text: res.message });
        setTimeout(() => {
          onClose();
          setCode("");
          setFeedback(null);
        }, 1500);
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "حدث خطأ أثناء التفعيل" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-slate-700 space-y-4 animate-in zoom-in-95">
        <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Crown size={22} />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-800 dark:text-white">
                تفعيل كود الممثل
              </h3>
              <p className="text-xs text-gray-400">
                أدخل الكود السري الممنوح لك من المطور
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              setFeedback(null);
            }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        {feedback && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/40 dark:text-red-300"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
            كود الممثل (مثل: REP-ENG26-7842)
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="REP-XXXX-XXXX"
            className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-amber-500/20 text-center tracking-widest"
            dir="ltr"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              setFeedback(null);
            }}
            className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-xs"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !code.trim()}
            className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-50 transition active:scale-95"
          >
            {isLoading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <ShieldCheck size={15} />
            )}
            <span>تأكيد وتفعيل الرتبة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
