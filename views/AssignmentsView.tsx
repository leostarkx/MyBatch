import React, { useState } from "react";
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Square,
  Clock,
  Calendar,
  ExternalLink,
  Edit3,
  Trash2,
} from "lucide-react";
import { Assignment, Course, User } from "../types";
import { FormattedTextRenderer } from "../components/FormattedTextRenderer";

export interface AssignmentsViewProps {
  currentUser: User | null;
  assignments: Assignment[];
  courses: Course[];
  appUsers: User[];
  effectiveBatchCode: string;
  canManageAssignments: boolean;
  currentTimer?: number;
  onOpenAddAssignment: () => void;
  onEditAssignment: (assignment: Assignment) => void;
  onDeleteAssignment: (id: string) => Promise<void>;
  onToggleAssignmentDone: (assignment: Assignment) => Promise<void>;
}

export const AssignmentsView: React.FC<AssignmentsViewProps> = ({
  currentUser,
  assignments,
  courses,
  appUsers,
  effectiveBatchCode,
  canManageAssignments,
  currentTimer = Date.now(),
  onOpenAddAssignment,
  onEditAssignment,
  onDeleteAssignment,
  onToggleAssignmentDone,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCourse, setFilterCourse] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "completed" | "urgent">("all");

  const isManager = canManageAssignments;
  const batchStudents = appUsers.filter((u) => u.batchCode === effectiveBatchCode);

  const pendingAssignments = assignments.filter(
    (a) => !a.completedBy?.includes(currentUser?.uid || "")
  );
  const completedAssignments = assignments.filter((a) =>
    a.completedBy?.includes(currentUser?.uid || "")
  );
  const urgentAssignments = pendingAssignments.filter((a) => {
    const diff = a.dueTimestamp - currentTimer;
    return diff > 0 && diff <= 48 * 60 * 60 * 1000;
  });

  const filteredAssignments = assignments
    .filter((a) => {
      const q = searchQuery.toLowerCase();
      const matchesQuery =
        a.title.toLowerCase().includes(q) ||
        a.courseName.toLowerCase().includes(q) ||
        (a.description && a.description.toLowerCase().includes(q));
      const matchesCourse =
        filterCourse === "all" || a.courseId === filterCourse;
      const isDone = a.completedBy?.includes(currentUser?.uid || "");
      let matchesStatus = true;
      if (filterStatus === "pending") matchesStatus = !isDone;
      if (filterStatus === "completed") matchesStatus = isDone;
      if (filterStatus === "urgent") {
        const diff = a.dueTimestamp - currentTimer;
        matchesStatus = !isDone && diff > 0 && diff <= 48 * 60 * 60 * 1000;
      }
      return matchesQuery && matchesCourse && matchesStatus;
    })
    .sort((a, b) => {
      const aDone = a.completedBy?.includes(currentUser?.uid || "");
      const bDone = b.completedBy?.includes(currentUser?.uid || "");
      if (aDone !== bDone) return aDone ? 1 : -1;
      return a.dueTimestamp - b.dueTimestamp;
    });

  return (
    <div className="space-y-6 p-4 animate-in slide-in-from-bottom-4 duration-500">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-amber-600 via-orange-600 to-rose-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <CheckSquare size={14} className="text-amber-200" />
                دفعة {currentUser?.batchCode || "ENG26"}
              </span>
              <span className="bg-white/10 px-3 py-1 rounded-full text-xs">
                {assignments.length} واجبات مسجلة
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black mb-1 flex items-center gap-2">
              <CheckSquare size={28} />
              الواجبات والتكليفات الدراسية 📝
            </h2>
            <p className="opacity-90 text-sm max-w-xl">
              متابعة المواعيد النهائية لتسليم الواجبات، عداد الأيام والساعات المتبقية، وتسجيل إنجاز المهام لتفادي التأخير.
            </p>
          </div>
          {isManager && (
            <button
              onClick={onOpenAddAssignment}
              className="bg-white text-orange-700 hover:bg-orange-50 px-6 py-3.5 rounded-2xl font-bold text-sm transition shadow-lg flex items-center justify-center gap-2 shrink-0 active:scale-95 cursor-pointer"
            >
              <Plus size={20} />
              إضافة واجب جديد
            </button>
          )}
        </div>
      </div>

      {/* Status Tabs and Quick Stats */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => setFilterStatus("all")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            filterStatus === "all"
              ? "bg-primary text-white shadow-md shadow-primary/20"
              : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-slate-700 hover:bg-gray-50"
          }`}
        >
          <span>كل الواجبات</span>
          <span className="bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full text-[10px]">
            {assignments.length}
          </span>
        </button>

        <button
          onClick={() => setFilterStatus("pending")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            filterStatus === "pending"
              ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
              : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-slate-700 hover:bg-gray-50"
          }`}
        >
          <Square size={14} />
          <span>قيد الإنجاز</span>
          <span className="bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full text-[10px]">
            {pendingAssignments.length}
          </span>
        </button>

        <button
          onClick={() => setFilterStatus("completed")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            filterStatus === "completed"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
              : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-slate-700 hover:bg-gray-50"
          }`}
        >
          <CheckCircle size={14} />
          <span>منجزة</span>
          <span className="bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full text-[10px]">
            {completedAssignments.length}
          </span>
        </button>

        {urgentAssignments.length > 0 && (
          <button
            onClick={() => setFilterStatus("urgent")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterStatus === "urgent"
                ? "bg-red-500 text-white shadow-md shadow-red-500/20"
                : "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 hover:bg-red-100"
            }`}
          >
            <Clock size={14} />
            <span>تسليم عاجل (أقل من 48 ساعة)</span>
            <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] animate-pulse">
              {urgentAssignments.length}
            </span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 px-4 py-3 flex items-center gap-2 shadow-xs">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن واجب، اسم المادة، أو تفاصيل المطلوب..."
            className="flex-1 bg-transparent text-sm outline-none dark:text-white"
          />
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 px-4 py-3 flex items-center gap-2 shadow-xs">
          <Filter size={18} className="text-gray-400" />
          <select
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none dark:text-white cursor-pointer"
          >
            <option value="all">كل المواد الدراسية</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignment List */}
      <div className="space-y-4">
        {filteredAssignments.length === 0 ? (
          <div className="py-16 text-center text-gray-400 dark:text-gray-500 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 border-dashed">
            <CheckSquare size={48} className="mx-auto mb-2 opacity-30 text-amber-500" />
            <p className="font-bold text-gray-700 dark:text-gray-300">
              لا توجد واجبات مطابقة لبحثك
            </p>
            <p className="text-xs text-gray-400 mt-1">
              جرب تغيير التصفية أو إضافة تكليف دراسي جديد.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredAssignments.map((assign) => {
              const isDone = assign.completedBy?.includes(currentUser?.uid || "");
              const diff = assign.dueTimestamp - currentTimer;
              const isExpired = diff <= 0;
              const formattedDueDate = new Date(assign.dueTimestamp).toLocaleString("ar-EG", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              const doneCount = assign.completedBy?.length || 0;
              const totalStudents = batchStudents.length || 1;
              const percentDone = Math.min(100, Math.round((doneCount / totalStudents) * 100));

              return (
                <div
                  key={assign.id}
                  className={`bg-white dark:bg-slate-800 rounded-3xl p-5 border transition-all duration-300 shadow-sm flex flex-col justify-between group ${
                    isDone
                      ? "border-emerald-200 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/20 to-white dark:from-emerald-950/10 dark:to-slate-800"
                      : isExpired
                      ? "border-gray-200 dark:border-slate-700 opacity-80"
                      : diff <= 48 * 60 * 60 * 1000
                      ? "border-amber-300 dark:border-amber-700 shadow-amber-500/5 ring-1 ring-amber-200/50"
                      : "border-gray-100 dark:border-slate-700 hover:shadow-md"
                  }`}
                >
                  <div>
                    {/* Top Row: Course badge & Controls */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="bg-primary/10 text-primary px-3 py-1 rounded-xl text-xs font-black truncate max-w-[160px]">
                        {assign.courseName}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {isManager && (
                          <>
                            <button
                              onClick={() => onEditAssignment(assign)}
                              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition cursor-pointer"
                              title="تعديل الواجب"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => onDeleteAssignment(assign.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition cursor-pointer"
                              title="حذف الواجب"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-base md:text-lg text-gray-800 dark:text-white mb-2 leading-snug">
                      {assign.title}
                    </h3>

                    {/* Description */}
                    {assign.description && (
                      <div className="text-xs text-gray-600 dark:text-gray-300 mb-4 leading-relaxed line-clamp-3">
                        <FormattedTextRenderer content={assign.description} />
                      </div>
                    )}

                    {/* Countdown Boxes */}
                    {(() => {
                      if (diff > 0) {
                        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
                        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

                        return (
                          <div className="grid grid-cols-3 gap-2 text-center mb-4 p-2.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                            <div className="bg-white dark:bg-slate-800 p-2 rounded-xl shadow-xs border border-amber-100/60 dark:border-slate-700">
                              <span className="block text-lg md:text-xl font-black text-amber-600 dark:text-amber-400 leading-none mb-0.5">
                                {d}
                              </span>
                              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">أيام</span>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-2 rounded-xl shadow-xs border border-amber-100/60 dark:border-slate-700">
                              <span className="block text-lg md:text-xl font-black text-amber-600 dark:text-amber-400 leading-none mb-0.5">
                                {h}
                              </span>
                              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">ساعات</span>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-2 rounded-xl shadow-xs border border-amber-100/60 dark:border-slate-700">
                              <span className="block text-lg md:text-xl font-black text-orange-600 dark:text-orange-400 leading-none mb-0.5">
                                {m}
                              </span>
                              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">دقائق</span>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div className="mb-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-center text-xs font-bold text-red-600 dark:text-red-400 flex items-center justify-center gap-1.5">
                            <Clock size={16} />
                            <span>انتهت مهلة تسليم هذا الواجب</span>
                          </div>
                        );
                      }
                    })()}

                    {/* Due Date & Attachments */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/50 p-2.5 rounded-xl border border-gray-100 dark:border-slate-700">
                        <Calendar size={15} className="text-amber-500 shrink-0" />
                        <span>
                          <strong>آخر موعد للتسليم:</strong> {formattedDueDate}
                        </span>
                      </div>

                      {assign.attachments && assign.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {assign.attachments.map((att, i) => (
                            <a
                              key={i}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-xl text-xs font-bold transition"
                            >
                              <ExternalLink size={13} />
                              {att.title || "رابط / مرفق الواجب"}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Progress & Student Action */}
                  <div className="pt-4 border-t border-gray-100 dark:border-slate-700/60 space-y-3">
                    {/* Batch Progress Bar */}
                    <div>
                      <div className="flex justify-between items-center text-[10px] text-gray-500 dark:text-gray-400 mb-1 font-bold">
                        <span>نسبة إنجاز الدفعة ({doneCount} من {totalStudents} طالب)</span>
                        <span>{percentDone}%</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentDone}%` }}
                        />
                      </div>
                    </div>

                    {/* Interactive Toggle Done Button */}
                    <button
                      type="button"
                      onClick={() => onToggleAssignmentDone(assign)}
                      className={`w-full py-3 rounded-2xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition shadow-sm active:scale-98 cursor-pointer ${
                        isDone
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                          : "bg-gray-100 dark:bg-slate-700 hover:bg-primary hover:text-white text-gray-700 dark:text-gray-200"
                      }`}
                    >
                      {isDone ? (
                        <>
                          <CheckCircle size={18} />
                          تم إنجاز الواجب بنجاح ✅ (انقر للإلغاء)
                        </>
                      ) : (
                        <>
                          <Square size={18} />
                          تحديد كمنجز (أتممت الواجب)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
