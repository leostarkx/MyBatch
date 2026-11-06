import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Users,
  Search,
  UserPlus,
  Trash2,
  Check,
  EyeOff,
  Crown,
  Award,
  Layers,
  Sparkles,
  X,
  FileText,
  ArrowRightLeft,
  ShieldCheck,
  Loader2,
  Mail,
  Edit3,
} from "lucide-react";
import { User, UserRole, ASSISTANT_DUTIES_CONFIG, Batch } from "../types";
import { compareArabicNames } from "../services/firebase";

export interface StudentsViewProps {
  currentUser: User | null;
  effectiveBatchCode: string;
  appUsers: User[];
  batchAcademicGroups: string[];
  isManager: boolean;
  canManageStudents: boolean;
  isOwner: boolean;
  onViewProfile: (userId: string) => void;
  onOpenAttendanceReport: (student: User) => void;
  onOpenNicknameModal: (student: User) => void;
  onOpenDutyModal: (student: User) => void;
  onOpenChangeEmailModal: (student: User) => void;
  onToggleAssistantRep: (student: User) => Promise<void>;
  onToggleExcludeFromStats: (student: User) => Promise<void>;
  onAssignStudentAcademicGroup: (student: User, group: string) => Promise<void>;
  onAutoDistributeStudentsIntoGroups: (groups: string[]) => Promise<void>;
  onAddBatchAcademicGroup: (groupName: string) => Promise<void>;
  onRemoveBatchAcademicGroup: (groupName: string) => Promise<void>;
  onAddStudent: (name: string, group?: string) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onLinkAndMergeOfficialStudent: (
    sourceOfficialUid: string,
    targetAccount: User,
    keepOfficialName: boolean
  ) => Promise<void>;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  currentUser,
  effectiveBatchCode,
  appUsers,
  batchAcademicGroups,
  isManager,
  canManageStudents,
  isOwner,
  onViewProfile,
  onOpenAttendanceReport,
  onOpenNicknameModal,
  onOpenDutyModal,
  onOpenChangeEmailModal,
  onToggleAssistantRep,
  onToggleExcludeFromStats,
  onAssignStudentAcademicGroup,
  onAutoDistributeStudentsIntoGroups,
  onAddBatchAcademicGroup,
  onRemoveBatchAcademicGroup,
  onAddStudent,
  onDeleteUser,
  onLinkAndMergeOfficialStudent,
}) => {
  const [studentDirectorySearch, setStudentDirectorySearch] = useState("");
  const [studentStatsFilter, setStudentStatsFilter] = useState<"ALL" | "INCLUDED" | "EXCLUDED">("ALL");
  const [studentGroupFilter, setStudentGroupFilter] = useState("ALL");
  const [isManagingAcademicGroups, setIsManagingAcademicGroups] = useState(false);
  const [newCustomGroupName, setNewCustomGroupName] = useState("");

  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentGroup, setNewStudentGroup] = useState("");

  // Linking modal state
  const [linkingTargetAccount, setLinkingTargetAccount] = useState<User | null>(null);
  const [linkingSourceOfficialUid, setLinkingSourceOfficialUid] = useState("");
  const [keepOfficialNameOnMerge, setKeepOfficialNameOnMerge] = useState(true);
  const [isMergingStudent, setIsMergingStudent] = useState(false);

  const isMainAdmin = isOwner || currentUser?.role === UserRole.REPRESENTATIVE;

  // Filter students (Memoized to prevent continuous garbage collection and DOM churn)
  const batchStudents = useMemo(() => {
    return appUsers.filter((u) => {
      if (u.role === UserRole.OWNER) return false;
      if (u.batchCode === effectiveBatchCode) return true;
      if (u.isOfficial && (!u.batchCode || u.batchCode === effectiveBatchCode)) return true;
      return false;
    });
  }, [appUsers, effectiveBatchCode]);

  const officialStudents = useMemo(() => batchStudents.filter((u) => u.isOfficial), [batchStudents]);
  const totalBatchCount = batchStudents.length;
  const includedCount = useMemo(() => batchStudents.filter((u) => !u.excludeFromStats).length, [batchStudents]);
  const excludedCount = useMemo(() => batchStudents.filter((u) => !!u.excludeFromStats).length, [batchStudents]);
  const unassignedGroupCount = useMemo(
    () => batchStudents.filter((u) => !u.excludeFromStats && !u.academicGroup).length,
    [batchStudents]
  );

  const filteredByInclusion = useMemo(() => {
    return batchStudents.filter((u) => {
      if (studentStatsFilter === "INCLUDED") return !u.excludeFromStats;
      if (studentStatsFilter === "EXCLUDED") return !!u.excludeFromStats;
      return true;
    });
  }, [batchStudents, studentStatsFilter]);

  const filteredByGroup = useMemo(() => {
    return filteredByInclusion.filter((u) => {
      if (studentGroupFilter === "ALL") return true;
      if (studentGroupFilter === "UNASSIGNED") return !u.academicGroup;
      return u.academicGroup === studentGroupFilter;
    });
  }, [filteredByInclusion, studentGroupFilter]);

  const displayedStudents = useMemo(() => {
    const q = studentDirectorySearch.trim().toLowerCase();
    const list = q
      ? filteredByGroup.filter((u) => {
          return (
            u.name.toLowerCase().includes(q) ||
            (u.username && u.username.toLowerCase().includes(q)) ||
            (u.email && u.email.toLowerCase().includes(q)) ||
            (u.academicGroup && u.academicGroup.toLowerCase().includes(q))
          );
        })
      : filteredByGroup;
    return [...list].sort((a, b) => compareArabicNames(a.name, b.name));
  }, [filteredByGroup, studentDirectorySearch]);

  // Progressive rendering: initial 25 students + smooth auto-load on scroll
  const [renderLimit, setRenderLimit] = useState(25);
  const observerSentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setRenderLimit(25);
  }, [studentDirectorySearch, studentStatsFilter, studentGroupFilter]);

  useEffect(() => {
    const sentinel = observerSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setRenderLimit((prev) => Math.min(displayedStudents.length, prev + 25));
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [displayedStudents.length]);

  const visibleStudents = useMemo(() => {
    return displayedStudents.slice(0, renderLimit);
  }, [displayedStudents, renderLimit]);

  const hasMoreStudents = renderLimit < displayedStudents.length;
  const remainingStudentsCount = displayedStudents.length - renderLimit;

  const handleAddStudentSubmit = async () => {
    if (!newStudentName.trim()) return;
    await onAddStudent(newStudentName.trim(), newStudentGroup || undefined);
    setNewStudentName("");
    setNewStudentGroup("");
  };

  const handleAddGroupSubmit = async () => {
    if (!newCustomGroupName.trim()) return;
    await onAddBatchAcademicGroup(newCustomGroupName.trim());
    setNewCustomGroupName("");
  };

  const handleMergeSubmit = async () => {
    if (!linkingSourceOfficialUid || !linkingTargetAccount || isMergingStudent) return;
    setIsMergingStudent(true);
    try {
      await onLinkAndMergeOfficialStudent(
        linkingSourceOfficialUid,
        linkingTargetAccount,
        keepOfficialNameOnMerge
      );
      setLinkingTargetAccount(null);
      setLinkingSourceOfficialUid("");
    } finally {
      setIsMergingStudent(false);
    }
  };

  return (
    <div className="space-y-6 p-4 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Users className="text-primary" size={24} />
            <span>إدارة طلاب وكروبات الدفعة</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            إدارة حسابات طلاب دفعة ({effectiveBatchCode})، تقسيم الكروبات الدراسية الثابتة (A, B, C...)، وتحديد المشمولين بالحصول على الإحصائيات والحضور.
          </p>
        </div>

        {/* Quick Metrics Bar */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
          <div className="bg-primary/10 text-primary border border-primary/20 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
            <span>إجمالي الطلاب:</span>
            <span className="font-mono text-sm">{totalBatchCount}</span>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>مشمول بالإحصائيات:</span>
            <span className="font-mono text-sm">{includedCount}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsManagingAcademicGroups(!isManagingAcademicGroups)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Layers size={14} />
            <span>إدارة وتوزيع الكروبات ({batchAcademicGroups.length})</span>
          </button>
        </div>
      </div>

      {/* Academic Groups Management Hub */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-indigo-100 dark:border-slate-700 overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-indigo-50/80 via-blue-50/50 to-purple-50/80 dark:from-slate-800 dark:to-slate-800 border-b border-indigo-100/80 dark:border-slate-700 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-gray-800 dark:text-white text-base flex items-center gap-2">
                <Layers size={19} className="text-indigo-600 dark:text-indigo-400" />
                <span>نظام الكروبات الدراسية الثابتة (تلقائي مع الجدول والحضور) 🔬</span>
              </h3>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                ثابت لكل طالب + يدعم الاستثناءات
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              وزّع الطلاب على كروباتهم الرسمية (مثل كروب A، كروب B...) مرة واحدة، وعند فتح أي محاضرة لكروب معين في الجدول سيظهر طلاب هذا الكروب تلقائياً!
            </p>
          </div>
          {isManager && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  onAutoDistributeStudentsIntoGroups(batchAcademicGroups.slice(0, 2))
                }
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                title="تقسيم الطلاب المشمولين أبجدياً بالتساوي على أول كروبين (A و B)"
              >
                <Sparkles size={14} />
                <span>توزيع أبجدي تلقائي (كروبين A & B)</span>
              </button>
              {batchAcademicGroups.length >= 3 && (
                <button
                  type="button"
                  onClick={() =>
                    onAutoDistributeStudentsIntoGroups(batchAcademicGroups.slice(0, 3))
                  }
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>توزيع على 3 كروبات (A, B, C)</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsManagingAcademicGroups(!isManagingAcademicGroups)}
                className="px-3 py-2 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition cursor-pointer"
              >
                {isManagingAcademicGroups ? "إخفاء إعدادات الكروبات" : "تخصيص أسماء الكروبات ⚙️"}
              </button>
            </div>
          )}
        </div>

        {/* Group Filter & Stats Cards */}
        <div className="p-4 bg-white dark:bg-slate-800">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              type="button"
              onClick={() => setStudentGroupFilter("ALL")}
              className={`px-3.5 py-2 rounded-2xl text-xs font-black transition whitespace-nowrap flex items-center gap-1.5 border cursor-pointer ${
                studentGroupFilter === "ALL"
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-gray-50 dark:bg-slate-700/60 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600 hover:bg-gray-100"
              }`}
            >
              <Users size={14} />
              <span>كل الكروبات ({includedCount})</span>
            </button>
            {batchAcademicGroups.map((grp) => {
              const countInGrp = batchStudents.filter(
                (u) => !u.excludeFromStats && u.academicGroup === grp
              ).length;
              const isSelected = studentGroupFilter === grp;
              return (
                <button
                  key={grp}
                  type="button"
                  onClick={() => setStudentGroupFilter(grp)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-black transition whitespace-nowrap flex items-center gap-2 border cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-300 border-indigo-200/70 dark:border-indigo-800/50 hover:bg-indigo-100/70"
                  }`}
                >
                  <span>🔬 {grp}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-indigo-200/70 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-200"
                    }`}
                  >
                    {countInGrp} طالب
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setStudentGroupFilter("UNASSIGNED")}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 border cursor-pointer ${
                studentGroupFilter === "UNASSIGNED"
                  ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                  : "bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/50"
              }`}
            >
              <span>بدون كروب محدد</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10">
                {unassignedGroupCount}
              </span>
            </button>
          </div>

          {/* Expandable Custom Group Name Editor */}
          {isManagingAcademicGroups && isManager && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                  الكروبات المعتمدة حالياً:
                </span>
                {batchAcademicGroups.map((grp) => (
                  <span
                    key={grp}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-white text-xs font-bold"
                  >
                    <span>{grp}</span>
                    {batchAcademicGroups.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveBatchAcademicGroup(grp)}
                        className="text-gray-400 hover:text-red-500 cursor-pointer"
                        title="حذف الكروب من القائمة"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCustomGroupName}
                  onChange={(e) => setNewCustomGroupName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddGroupSubmit();
                  }}
                  placeholder="إضافة كروب جديد (مثال: كروب E)"
                  className="bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-1.5 text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddGroupSubmit}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer"
                >
                  + إضافة كروب
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={studentDirectorySearch}
            onChange={(e) => setStudentDirectorySearch(e.target.value)}
            placeholder="ابحث عن طالب بالاسم، الكروب، البريد الإلكتروني، أو المعرف..."
            className="w-full bg-gray-50 dark:bg-slate-700/60 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl pr-10 pl-4 py-2 text-xs outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center p-1 bg-gray-100 dark:bg-slate-700/60 rounded-2xl text-[11px] font-bold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setStudentStatsFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              studentStatsFilter === "ALL"
                ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-300"
            }`}
          >
            الكل ({totalBatchCount})
          </button>
          <button
            type="button"
            onClick={() => setStudentStatsFilter("INCLUDED")}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer ${
              studentStatsFilter === "INCLUDED"
                ? "bg-white dark:bg-slate-800 text-emerald-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-300"
            }`}
          >
            <span>المشمولون بالإحصائيات</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-1.5 py-0.2 rounded-full">
              {includedCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStudentStatsFilter("EXCLUDED")}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer ${
              studentStatsFilter === "EXCLUDED"
                ? "bg-white dark:bg-slate-800 text-gray-800 dark:text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-300"
            }`}
          >
            <span>المستثنون</span>
            {excludedCount > 0 && (
              <span className="text-[10px] bg-gray-200 text-gray-700 dark:bg-slate-600 dark:text-gray-300 px-1.5 py-0.2 rounded-full">
                {excludedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 1. Batch Students List */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-gray-50 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/30 flex justify-between items-center flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-gray-800 dark:text-white text-sm flex items-center gap-2 flex-wrap">
              <span>قائمة طلاب وأعضاء الدفعة</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                {displayedStudents.length}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                مرتبة أبجدياً تلقائياً (أ - ي)
              </span>
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              تتضمن الحسابات المسجلة وحسابات Google وقوائم الحضور والدرجات، مرتبة أبجدياً بشكل دائم.
            </p>
          </div>
        </div>

        <div>
          {displayedStudents.length > 0 ? (
            <div className="divide-y divide-gray-50 dark:divide-slate-700">
              {visibleStudents.map((student, idx) => {
                const isRep = student.role === UserRole.REPRESENTATIVE;
                const isAssistant = student.role === UserRole.ASSISTANT_REP;
                const isExcluded = !!student.excludeFromStats;

                return (
                  <div
                    key={student.uid}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"
                  >
                    <div
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => onViewProfile(student.uid)}
                    >
                      <span className="w-6 text-center text-xs font-bold text-gray-400 shrink-0">
                        {idx + 1}
                      </span>
                      <img
                        src={student.avatar}
                        className="w-11 h-11 rounded-full border border-gray-100 dark:border-slate-600 object-cover shrink-0"
                        alt=""
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm text-gray-800 dark:text-white hover:text-primary transition">
                            {student.name}
                          </p>
                          {student.academicGroup && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
                              🔬 {student.academicGroup}
                            </span>
                          )}
                          {isRep && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 flex items-center gap-1">
                              <Crown size={11} />
                              <span>الممثل 👑</span>
                            </span>
                          )}
                          {isAssistant && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 flex items-center gap-1 shadow-sm">
                              <Award size={11} />
                              <span>ممثل معاون 🎖️</span>
                            </span>
                          )}
                          {student.assistantDuties &&
                            student.assistantDuties.map((dutyKey) => {
                              const dutyConf = ASSISTANT_DUTIES_CONFIG[dutyKey];
                              if (!dutyConf) return null;
                              return (
                                <span
                                  key={dutyKey}
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${dutyConf.color} ${dutyConf.bgLight}`}
                                  title={dutyConf.description}
                                >
                                  <span>{dutyConf.badge}</span>
                                </span>
                              );
                            })}
                          {isExcluded && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300 flex items-center gap-1">
                              <EyeOff size={11} />
                              <span>مستثنى من الإحصائيات</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {student.email || `@${student.username || "student"}`}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    {isManager && (
                      <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
                        {/* Group Selection */}
                        <select
                          value={student.academicGroup || ""}
                          onChange={(e) => onAssignStudentAcademicGroup(student, e.target.value)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold border bg-indigo-50/70 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/50 outline-none cursor-pointer"
                          title="تحديد أو تغيير الكروب الدراسي لهذا الطالب"
                        >
                          <option value="">-- الكروب --</option>
                          {batchAcademicGroups.map((grp) => (
                            <option key={grp} value={grp}>
                              🔬 {grp}
                            </option>
                          ))}
                        </select>

                        {/* PDF Report */}
                        <button
                          type="button"
                          onClick={() => onOpenAttendanceReport(student)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 rounded-xl text-xs font-bold transition flex items-center gap-1 active:scale-95 cursor-pointer"
                          title="تحميل تقرير الحضور"
                        >
                          <FileText size={13} />
                          <span>تقرير</span>
                        </button>

                        {/* Nickname */}
                        <button
                          type="button"
                          onClick={() => onOpenNicknameModal(student)}
                          className="px-2.5 py-1.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-200 transition cursor-pointer"
                          title="تعديل اسم العرض أو اللقب في الترتيب الأبجدي"
                        >
                          <Edit3 size={13} />
                        </button>

                        {/* Exclude / Include from Stats */}
                        <button
                          type="button"
                          onClick={() => onToggleExcludeFromStats(student)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 active:scale-95 cursor-pointer ${
                            isExcluded
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300"
                          }`}
                          title={isExcluded ? "إعادة تضمين في الإحصائيات" : "استثناء من الإحصائيات"}
                        >
                          {isExcluded ? (
                            <>
                              <Check size={13} />
                              <span>تضمين</span>
                            </>
                          ) : (
                            <>
                              <EyeOff size={13} />
                              <span>استثناء</span>
                            </>
                          )}
                        </button>

                        {/* Link to Official Record */}
                        {!student.isOfficial && officialStudents.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setLinkingTargetAccount(student);
                              setLinkingSourceOfficialUid("");
                            }}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                            title="ربط هذا الحساب بطالب مضاف مسبقاً في السجل لنقل درجاته وحضوره ومشاريعه إليه"
                          >
                            <ArrowRightLeft size={13} />
                            <span>ربط بسجل 🔗</span>
                          </button>
                        )}

                        {/* Assign Duties (Admin only) */}
                        {isMainAdmin && student.uid !== currentUser?.uid && !isRep && !student.isOfficial && (
                          <button
                            type="button"
                            onClick={() => onOpenDutyModal(student)}
                            className="px-3 py-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-purple-700 dark:text-purple-300 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                            title="إسناد رتب محددة لهذا الطالب"
                          >
                            <ShieldCheck size={13} className="text-purple-600" />
                            <span>المهام 🎖️</span>
                            {student.assistantDuties && student.assistantDuties.length > 0 && (
                              <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                                {student.assistantDuties.length}
                              </span>
                            )}
                          </button>
                        )}

                        {/* Assistant Toggle */}
                        {isMainAdmin && student.uid !== currentUser?.uid && !isRep && !student.isOfficial && (
                          <button
                            type="button"
                            onClick={() => onToggleAssistantRep(student)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer ${
                              isAssistant
                                ? "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                                : "bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300"
                            }`}
                            title={isAssistant ? "إعفاء من المعاونية" : "تعيين كممثل معاون"}
                          >
                            {isAssistant ? (
                              <>
                                <X size={13} />
                                <span>إعفاء معاون</span>
                              </>
                            ) : (
                              <>
                                <Award size={13} className="text-blue-600" />
                                <span>معاون 🎖️</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 text-xs">
              لا توجد حسابات تطابق البحث أو الفلتر المحدد.
            </div>
          )}

          {hasMoreStudents && (
            <div
              ref={observerSentinelRef}
              className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/20 flex flex-col sm:flex-row items-center justify-between gap-3"
            >
              <span className="text-xs text-gray-500 font-bold">
                عرض {visibleStudents.length} من أصل {displayedStudents.length} طالباً
              </span>
              <button
                type="button"
                onClick={() => setRenderLimit((prev) => Math.min(displayedStudents.length, prev + 25))}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-slate-600 shadow-xs text-xs font-bold transition active:scale-95 cursor-pointer"
              >
                <span>تحميل الدفعة التالية (متبقي {remainingStudentsCount})</span>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                  +25
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Add Offline Student Form */}
      {isManager && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <UserPlus size={18} className="text-primary" />
            إضافة اسم طالب يدوياً مع كروبه الدراسي (يظهر في الحضور، الدرجات، والمشاريع)
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                الاسم الثلاثي للطالب
              </label>
              <input
                type="text"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddStudentSubmit();
                }}
                className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm outline-none"
                placeholder="مثال: أحمد علي محمد..."
              />
            </div>
            <div className="sm:w-48">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                الكروب الدراسي الثابت
              </label>
              <select
                value={newStudentGroup}
                onChange={(e) => setNewStudentGroup(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm font-bold outline-none cursor-pointer h-10"
              >
                <option value="">-- بدون كروب محدد --</option>
                {batchAcademicGroups.map((grp) => (
                  <option key={grp} value={grp}>
                    🔬 {grp}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleAddStudentSubmit}
              disabled={!newStudentName.trim()}
              className="bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-600 transition shadow-lg shadow-primary/20 h-10 cursor-pointer disabled:opacity-50"
            >
              إضافة
            </button>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
            * الطلاب المضافون يدوياً يظهرون في قوائم الحضور والغياب، درجات السعي، والمشاريع، ويمكن ربطهم بحساباتهم الإلكترونية لاحقاً.
          </p>
        </div>
      )}

      {/* 3. Official Offline Students List */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-gray-50 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/30 flex justify-between items-center flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-800 dark:text-white text-sm">
                قائمة الطلاب المضافين يدوياً بدون حساب ({officialStudents.length})
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                مرتبة أبجدياً (أ - ي)
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              يمكنك ربط أي اسم هنا بحساب الطالب الفعلي فور تسجيله في المنصة لنقل كافة بياناته وإحصائياته.
            </p>
          </div>
        </div>

        <div>
          {officialStudents.length > 0 ? (
            <div className="divide-y divide-gray-50 dark:divide-slate-700">
              {[...officialStudents]
                .sort((a, b) => compareArabicNames(a.name, b.name))
                .map((student, idx) => (
                  <div
                    key={student.uid}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"
                  >
                    <div
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => onViewProfile(student.uid)}
                    >
                      <span className="w-6 text-center text-xs font-bold text-gray-400 shrink-0">
                        {idx + 1}
                      </span>
                      <img
                        src={student.avatar}
                        className="w-10 h-10 rounded-full border border-gray-100 dark:border-slate-600"
                        alt=""
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm text-gray-800 dark:text-white group-hover:text-primary transition">
                            {student.name}
                          </p>
                          {student.academicGroup && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                              🔬 {student.academicGroup}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                          <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 px-2 py-0.5 rounded-md font-bold text-[10px]">
                            مضاف يدوياً بالسجل (مشروع / حضور / درجات)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                      {isManager && (
                        <select
                          value={student.academicGroup || ""}
                          onChange={(e) => onAssignStudentAcademicGroup(student, e.target.value)}
                          className="px-2.5 py-2 rounded-xl text-xs font-black border bg-indigo-50/70 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/50 outline-none cursor-pointer"
                          title="تحديد أو تغيير الكروب الدراسي لهذا الطالب"
                        >
                          <option value="">-- اختر الكروب --</option>
                          {batchAcademicGroups.map((grp) => (
                            <option key={grp} value={grp}>
                              🔬 {grp}
                            </option>
                          ))}
                        </select>
                      )}
                      <button
                        type="button"
                        onClick={() => onOpenAttendanceReport(student)}
                        className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                        title="تحميل تقرير حضور هذا الطالب بصيغة PDF"
                      >
                        <FileText size={14} />
                        <span>تقرير PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLinkingSourceOfficialUid(student.uid);
                          setLinkingTargetAccount(null);
                        }}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 active:scale-95 cursor-pointer"
                        title="ربط هذا الطالب بحساب جوجل مسجل لنقل جميع درجاته وحضوره ومشاريعه إليه"
                      >
                        <ArrowRightLeft size={14} />
                        <span>ربط بحساب مسجل (Google) 🔗</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteUser(student.uid)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-xl transition cursor-pointer"
                        title="حذف الطالب"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-xs">
              لا يوجد طلاب مضافين يدوياً في السجل حالياً (أو تم ربطهم جميعاً بحساباتهم).
            </div>
          )}
        </div>
      </div>

      {/* Modal: Link / Merge Official Student Record with Registered Google Account */}
      {(linkingTargetAccount || linkingSourceOfficialUid) && (() => {
        const registeredAccounts = batchStudents.filter((u) => !u.isOfficial);
        const selectedOfficial = officialStudents.find((o) => o.uid === linkingSourceOfficialUid);

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 border border-gray-100 dark:border-slate-700">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <ArrowRightLeft size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base md:text-lg text-gray-800 dark:text-white">
                      ربط ودمج بيانات طالب بحسابه المسجل 🔗
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      نقل الحضور، الدرجات، المشاريع، والواجبات تلقائياً لحساب الطالب في Google
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLinkingTargetAccount(null);
                    setLinkingSourceOfficialUid("");
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 py-5">
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
                  عند إتمام الربط، سيتم نقل جميع <strong>سجلات الحضور والغياب، درجات السعي، عضوية وقيادة كروبات المشاريع، والواجبات</strong> من الاسم المضاف يدوياً إلى حساب الطالب المسجل، ثم يُدمج السجلان في حساب واحد بدون أي تكرار.
                </div>

                {/* Step 1: Select Official Student Record */}
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                    1. اختر اسم الطالب الذي أضفته يدوياً في السجل (المصدر):
                  </label>
                  <select
                    value={linkingSourceOfficialUid}
                    onChange={(e) => setLinkingSourceOfficialUid(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">-- اختر الاسم من السجل الورقي --</option>
                    {officialStudents.map((off) => (
                      <option key={off.uid} value={off.uid}>
                        📋 {off.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step 2: Select Target Registered Account */}
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                    2. اختر حساب الطالب المسجل في النظام (حساب Google المستلم):
                  </label>
                  <select
                    value={linkingTargetAccount?.uid || ""}
                    onChange={(e) => {
                      const found = registeredAccounts.find((r) => r.uid === e.target.value) || null;
                      setLinkingTargetAccount(found);
                    }}
                    className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">-- اختر حساب الطالب المسجل --</option>
                    {registeredAccounts.map((acc) => (
                      <option key={acc.uid} value={acc.uid}>
                        👤 {acc.name} ({acc.email || `@${acc.username}`})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Option: Keep Official Full Name */}
                {selectedOfficial && linkingTargetAccount && (
                  <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={keepOfficialNameOnMerge}
                      onChange={(e) => setKeepOfficialNameOnMerge(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600 rounded"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-gray-800 dark:text-white">
                        اعتماد الاسم الثلاثي الرسمي ({selectedOfficial.name})
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">
                        تحديث اسم حساب جوجل ({linkingTargetAccount.name}) ليصبح بالاسم الثلاثي الرسمي المسجل لديك
                      </p>
                    </div>
                  </label>
                )}
              </div>

              <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setLinkingTargetAccount(null);
                    setLinkingSourceOfficialUid("");
                  }}
                  disabled={isMergingStudent}
                  className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 py-3 rounded-2xl font-bold text-xs hover:bg-gray-200 transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleMergeSubmit}
                  disabled={!linkingSourceOfficialUid || !linkingTargetAccount || isMergingStudent}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-2xl font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50 transition active:scale-95 cursor-pointer"
                >
                  {isMergingStudent ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>جاري نقل ودمج البيانات...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft size={16} />
                      <span>تأكيد الربط ونقل الإحصائيات</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
