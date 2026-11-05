import React, { useState } from "react";
import {
  ShieldCheck,
  Crown,
  Plus,
  UserPlus,
  Trash2,
  Copy,
  Users,
  Key,
  X,
  AlertCircle,
  AtSign,
  GraduationCap,
  Award,
  Clock,
  RotateCcw,
} from "lucide-react";
import { Batch, User, UserRole, Tab } from "../types";

export interface BatchesViewProps {
  currentUser: User | null;
  batches: Batch[];
  appUsers: User[];
  onOpenRepManager: () => void;
  onAddBatch: (batchData: {
    name: string;
    code: string;
    department: string;
    stage: string;
    repUsername: string;
  }) => Promise<void>;
  onDeleteBatch: (batchId: string) => Promise<void>;
  onUpdateBatchRepresentative: (batch: Batch, newRepUsername: string) => Promise<void>;
}

export const BatchesView: React.FC<BatchesViewProps> = ({
  currentUser,
  batches,
  appUsers,
  onOpenRepManager,
  onAddBatch,
  onDeleteBatch,
  onUpdateBatchRepresentative,
}) => {
  const [isAddingBatch, setIsAddingBatch] = useState(false);
  const [newBatchName, setNewBatchName] = useState("");
  const [newBatchCode, setNewBatchCode] = useState("");
  const [newBatchDept, setNewBatchDept] = useState("");
  const [newBatchStage, setNewBatchStage] = useState("المرحلة الأولى");
  const [newBatchRepUsername, setNewBatchRepUsername] = useState("");

  const [isEditingRep, setIsEditingRep] = useState(false);
  const [editingRepBatch, setEditingRepBatch] = useState<Batch | null>(null);
  const [newRepUsername, setNewRepUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (currentUser?.role !== UserRole.OWNER) {
    return (
      <div className="p-8 text-center text-gray-500">
        هذه الصفحة مخصصة لحساب المطور الرئيسي فقط.
      </div>
    );
  }

  const handleCreateBatch = async () => {
    if (!newBatchName.trim() || !newBatchCode.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAddBatch({
        name: newBatchName.trim(),
        code: newBatchCode.trim().toUpperCase(),
        department: newBatchDept.trim(),
        stage: newBatchStage.trim(),
        repUsername: newBatchRepUsername.trim().toLowerCase(),
      });
      setIsAddingBatch(false);
      setNewBatchName("");
      setNewBatchCode("");
      setNewBatchDept("");
      setNewBatchRepUsername("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveRep = async () => {
    if (!editingRepBatch || !newRepUsername.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onUpdateBatchRepresentative(editingRepBatch, newRepUsername.trim());
      setIsEditingRep(false);
      setEditingRepBatch(null);
      setNewRepUsername("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 text-xs px-3 py-1 rounded-full font-bold mb-2">
              <ShieldCheck size={14} />
              حساب المطور الرئيسي (ahmed)
            </div>
            <h2 className="text-2xl font-bold mb-1">
              إدارة النسخ والدفعات الجامعية 🏛️
            </h2>
            <p className="opacity-80 text-sm">
              توليد نسخ مستقلة من البرنامج لكل دفعة، وتعيين ممثلي الدفعات وتوزيع الأكواد للطلاب.
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
            <button
              onClick={onOpenRepManager}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-orange-500/20 transition flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <Crown size={18} />
              <span>إدارة وتعيين الممثلين والأكواد 👑</span>
            </button>
            <button
              onClick={() => {
                setNewBatchName("");
                setNewBatchCode(`ENG${Math.floor(10 + Math.random() * 89)}`);
                setNewBatchDept("");
                setNewBatchStage("المرحلة الأولى");
                setNewBatchRepUsername("");
                setIsAddingBatch(true);
              }}
              className="bg-primary hover:bg-primary/90 text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-primary/30 transition flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <Plus size={18} />
              <span>إنشاء نسخة دفعة جديدة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Batches Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {batches.map((batch) => {
          const enrolledStudents = appUsers.filter((u) => u.batchCode === batch.code);
          return (
            <div
              key={batch.id}
              className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition relative group"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold px-2.5 py-1 rounded-lg">
                    {batch.department || "عام"} - {batch.stage}
                  </span>
                  <h3 className="font-bold text-xl text-gray-800 dark:text-white mt-2">
                    {batch.name}
                  </h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={onOpenRepManager}
                    className="p-2 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition cursor-pointer"
                    title="إدارة وتعيين ممثل لهذه الدفعة"
                  >
                    <Crown size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setEditingRepBatch(batch);
                      setNewRepUsername("");
                      setIsEditingRep(true);
                    }}
                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/20 rounded-xl transition cursor-pointer"
                    title="تعديل الممثل"
                  >
                    <UserPlus size={18} />
                  </button>
                  <button
                    onClick={() => onDeleteBatch(batch.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition cursor-pointer"
                    title="حذف هذه النسخة"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Batch Code Box */}
              <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-2xl p-4 my-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 block mb-1">
                    كود انضمام الدفعة
                  </span>
                  <span className="font-mono font-black text-lg text-primary tracking-widest">
                    {batch.code}
                  </span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(batch.code);
                  }}
                  className="p-2.5 bg-white dark:bg-slate-700 text-primary rounded-xl shadow-xs hover:bg-primary hover:text-white transition cursor-pointer"
                  title="نسخ كود الدفعة"
                >
                  <Copy size={16} />
                </button>
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-50 dark:border-slate-700 text-xs">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Users size={16} className="text-primary" />
                  <span>
                    الطلاب المسجلين: <strong>{enrolledStudents.length}</strong>
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">
                    الممثل:{" "}
                    <strong>{batch.representativeUsername || "غير معين"}</strong>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Batch Modal */}
      {isAddingBatch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                إنشاء نسخة دفعة جديدة للممثل
              </h3>
              <button onClick={() => setIsAddingBatch(false)} className="cursor-pointer">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                  اسم الدفعة
                </label>
                <input
                  type="text"
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  placeholder="مثال: هندسة البرمجيات - المرحلة الثالثة"
                  className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                  كود الدفعة المميز
                </label>
                <input
                  type="text"
                  value={newBatchCode}
                  onChange={(e) => setNewBatchCode(e.target.value.toUpperCase())}
                  placeholder="ENG2024"
                  className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm font-mono outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                    القسم
                  </label>
                  <input
                    type="text"
                    value={newBatchDept}
                    onChange={(e) => setNewBatchDept(e.target.value)}
                    placeholder="هندسة البرمجيات"
                    className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                    المرحلة
                  </label>
                  <input
                    type="text"
                    value={newBatchStage}
                    onChange={(e) => setNewBatchStage(e.target.value)}
                    placeholder="المرحلة الثالثة"
                    className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                  اسم مستخدم الممثل (@username)
                </label>
                <input
                  type="text"
                  value={newBatchRepUsername}
                  onChange={(e) => setNewBatchRepUsername(e.target.value.toLowerCase().trim())}
                  placeholder="أدخل يوزر ممثل الدفعة"
                  className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  سيتم تعيين هذا المستخدم كممثل وإعطائه صلاحيات الإدارة لهذه الدفعة.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddingBatch(false)}
                  className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 py-2.5 rounded-xl font-bold text-sm cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleCreateBatch}
                  disabled={!newBatchName.trim() || !newBatchCode.trim() || isSubmitting}
                  className="flex-1 bg-primary text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/30 cursor-pointer disabled:opacity-50"
                >
                  إنشاء الدفعة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Representative Modal */}
      {isEditingRep && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                تعديل ممثل الدفعة: {editingRepBatch?.name}
              </h3>
              <button onClick={() => setIsEditingRep(false)} className="cursor-pointer">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex gap-3">
                <AlertCircle className="text-amber-600 dark:text-amber-400 shrink-0" size={20} />
                <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                  سيتم سحب صلاحيات الممثل الحالي (إن وجد) ومنحها للمستخدم الجديد. تأكد من إدخال اسم المستخدم الصحيح.
                </p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                  اسم مستخدم الممثل الجديد (@username)
                </label>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-primary/20 transition">
                  <AtSign size={16} className="text-gray-400" />
                  <input
                    type="text"
                    value={newRepUsername}
                    onChange={(e) => setNewRepUsername(e.target.value.toLowerCase().trim())}
                    placeholder="username"
                    className="flex-1 bg-transparent text-sm outline-none dark:text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingRep(false)}
                  className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 py-3 rounded-xl font-bold text-sm cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveRep}
                  disabled={!newRepUsername.trim() || isSubmitting}
                  className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/30 cursor-pointer disabled:opacity-50"
                >
                  حفظ وتعيين الممثل
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export interface NoBatchLandingProps {
  currentUser: User;
  onJoinSubmit: (code: string) => Promise<void>;
  onCancelJoinRequest: () => Promise<void>;
  onNavigateProfile: () => void;
}

export const NoBatchLanding: React.FC<NoBatchLandingProps> = ({
  currentUser,
  onJoinSubmit,
  onCancelJoinRequest,
  onNavigateProfile,
}) => {
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleSubmit = async () => {
    if (!code.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onJoinSubmit(code.trim().toUpperCase());
      setCode("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (isCancelling) return;
    setIsCancelling(true);
    try {
      await onCancelJoinRequest();
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <GraduationCap className="text-primary" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">مرحباً بك في تطبيق دفعتي!</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
          أنت مسجل حالياً كطالب، ولكن لم تنضم إلى أي دفعة بعد. يرجى إدخال كود الدفعة (الذي تحصل عليه من ممثل دفعتك) لتقديم طلب انضمام.
        </p>

        {!currentUser.pendingBatchCode ? (
          <div className="max-w-sm mx-auto space-y-4">
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-primary/20 transition">
              <Award size={20} className="text-gray-400" />
              <input
                type="text"
                className="flex-1 bg-transparent text-lg outline-none dark:text-white uppercase font-bold tracking-widest"
                placeholder="أدخل كود الدفعة هنا"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={!code.trim() || isSubmitting}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <UserPlus size={20} />
              إرسال طلب انضمام للدفعة
            </button>
          </div>
        ) : (
          <div className="max-w-sm mx-auto p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-3xl space-y-4">
            <Clock className="text-amber-500 mx-auto" size={32} />
            <div>
              <p className="text-amber-800 dark:text-amber-400 font-bold mb-1">طلبك قيد الانتظار</p>
              <p className="text-amber-600 dark:text-amber-500 text-xs">
                لقد قدمت طلباً للانضمام إلى الدفعة ذات الكود: <span className="font-mono font-black">{currentUser.pendingBatchCode}</span>. سيتم إشعارك فور قبول طلبك من قبل ممثل الدفعة.
              </p>
            </div>
            {/* Withdraw Request Option */}
            <div className="pt-3 border-t border-amber-200/60 dark:border-amber-900/40">
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <RotateCcw size={14} className={isCancelling ? "animate-spin" : ""} />
                <span>{isCancelling ? "جاري سحب الطلب..." : "سحب الطلب وإعادة كتابة الكود"}</span>
              </button>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 text-center">
                * هل كتبت كود الدفعة بالخطأ؟ اضغط لسحب الطلب فوراً وتصحيح الكود.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Profile Snapshot */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="h-24 bg-primary/10 relative">
          {currentUser.banner && <img src={currentUser.banner} className="w-full h-full object-cover opacity-50" alt="" />}
        </div>
        <div className="px-8 pb-8 flex flex-col items-center -mt-12 relative z-10">
          <div className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden mb-4">
            <img src={currentUser.avatar} className="w-full h-full object-cover" alt="" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">{currentUser.name}</h3>
          <p className="text-gray-500 text-sm mb-4">{currentUser.email}</p>
          <button
            onClick={onNavigateProfile}
            className="px-6 py-2 bg-gray-100 dark:bg-slate-700 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition cursor-pointer"
          >
            تعديل الملف الشخصي
          </button>
        </div>
      </div>
    </div>
  );
};
