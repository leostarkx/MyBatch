import React from "react";
import { ShieldCheck, UserCheck, Users, UserMinus } from "lucide-react";
import { JoinRequest, Batch } from "../types";

export interface JoinRequestsViewProps {
  joinRequests: JoinRequest[];
  batches: Batch[];
  onApproveRequest: (req: JoinRequest) => Promise<void>;
  onApproveAllRequests: () => Promise<void>;
  onRejectRequest: (reqId: string) => Promise<void>;
}

export const JoinRequestsView: React.FC<JoinRequestsViewProps> = ({
  joinRequests,
  batches,
  onApproveRequest,
  onApproveAllRequests,
  onRejectRequest,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">طلبات الانضمام للدفعة 👋</h2>
            {joinRequests.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-500 text-white animate-pulse">
                {joinRequests.length} جديد
              </span>
            )}
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
            لديك {joinRequests.length} طلبات جديدة من طلاب يرغبون بالانضمام للدفعة وتفعيل حساباتهم.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {joinRequests.length > 1 && (
            <button
              onClick={onApproveAllRequests}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
            >
              <UserCheck size={16} />
              <span>قبول جميع الطلبات ({joinRequests.length})</span>
            </button>
          )}
          <div className="bg-primary/10 p-3 rounded-2xl text-primary shrink-0">
            <Users size={24} />
          </div>
        </div>
      </div>

      {joinRequests.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-12 rounded-3xl text-center border border-dashed border-gray-200 dark:border-slate-700">
          <ShieldCheck size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-bold">لا توجد طلبات انضمام معلقة حالياً</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            عندما يقوم أي طالب بإدخال كود دفعتك، سيظهر طلبه هنا فوراً مع إشعار لك.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {joinRequests.map((req) => {
            const reqBatch = batches.find((b) => b.code === req.batchCode);
            const dateStr = req.timestamp
              ? new Date(req.timestamp).toLocaleDateString("ar-IQ", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";

            return (
              <div
                key={req.id}
                className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-gray-100 dark:border-slate-700 flex items-center justify-between shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-13 h-13 rounded-2xl overflow-hidden border-2 border-primary/20 shrink-0">
                    <img
                      src={req.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.userName)}`}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-800 dark:text-white text-sm truncate">{req.userName}</h4>
                    <p className="text-[11px] text-gray-400 truncate">{req.userEmail || "طالب"}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-bold">
                        كود: {req.batchCode}
                      </span>
                      {reqBatch && (
                        <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-full truncate max-w-[140px]">
                          {reqBatch.name}
                        </span>
                      )}
                      {dateStr && (
                        <span className="text-[10px] text-gray-400">
                          {dateStr}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0 mr-2">
                  <button
                    onClick={() => onApproveRequest(req)}
                    className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center transition shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
                    title="قبول انضمام الطالب"
                  >
                    <UserCheck size={18} />
                  </button>
                  <button
                    onClick={() => onRejectRequest(req.id)}
                    className="w-10 h-10 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 text-red-600 rounded-xl flex items-center justify-center transition active:scale-95 cursor-pointer"
                    title="رفض الطلب"
                  >
                    <UserMinus size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
