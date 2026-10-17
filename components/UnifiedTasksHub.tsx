import React, { useState, useMemo, useRef } from "react";
import {
  Tab,
  User,
  Course,
  Assignment,
  Exam,
} from "../types";
import {
  CheckSquare,
  Award,
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Circle,
  AlertCircle,
  FileText,
  ExternalLink,
  Trash2,
  Edit,
  X,
  Upload,
  Loader2,
  Flame,
  ChevronDown,
  Sparkles,
  MapPin,
  BookOpen,
  Share2,
} from "lucide-react";
import { RichTextEditor } from "./RichTextEditor";
import { FormattedTextRenderer } from "./FormattedTextRenderer";

export interface UnifiedTasksHubProps {
  currentUser: User | null;
  batchStudents: User[];
  courses: Course[];
  assignments: Assignment[];
  exams: Exam[];
  effectiveBatchCode: string;
  isManager: boolean;
  onSaveAssignment: (assign: Assignment, notify?: boolean) => Promise<void>;
  onDeleteAssignment: (id: string) => Promise<void>;
  onToggleAssignmentDone: (assign: Assignment) => Promise<void>;
  onSaveExam: (exam: Exam) => Promise<void>;
  onDeleteExam: (id: string) => Promise<void>;
  onPreviewItem?: (item: { title: string; url: string; type: "IMAGE" | "PDF" | "LINK" }) => void;
}

type TasksSubTab = "all" | "assignments" | "exams";

interface UnifiedTaskItem {
  id: string;
  type: "assignment" | "exam";
  title: string;
  courseId: string;
  courseName: string;
  timestamp: number; // dueTimestamp for assign, examTimestamp for exam
  description?: string;
  isDone?: boolean;
  assignmentData?: Assignment;
  examData?: Exam;
}

export const UnifiedTasksHub: React.FC<UnifiedTasksHubProps> = ({
  currentUser,
  batchStudents,
  courses,
  assignments,
  exams,
  effectiveBatchCode,
  isManager,
  onSaveAssignment,
  onDeleteAssignment,
  onToggleAssignmentDone,
  onSaveExam,
  onDeleteExam,
  onPreviewItem,
}) => {
  // Navigation Sub-tab
  const [activeSubTab, setActiveSubTab] = useState<TasksSubTab>("all");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed" | "urgent" | "expired">("all");
  const [examTypeFilter, setExamTypeFilter] = useState<"ALL" | "QUIZ" | "MIDTERM" | "FINAL" | "PRACTICAL">("ALL");

  // Modal States - Assignment
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [assignTitle, setAssignTitle] = useState("");
  const [assignCourseId, setAssignCourseId] = useState("");
  const [assignDueDate, setAssignDueDate] = useState("");
  const [assignDesc, setAssignDesc] = useState("");
  const [assignAttachmentUrl, setAssignAttachmentUrl] = useState("");
  const [assignAttachmentType, setAssignAttachmentType] = useState<"link" | "file" | "image">("link");
  const [assignNotifyBatch, setAssignNotifyBatch] = useState(true);
  const [isUploadingAssignFile, setIsUploadingAssignFile] = useState(false);
  const [isSavingAssign, setIsSavingAssign] = useState(false);
  const assignFileInputRef = useRef<HTMLInputElement>(null);

  // Modal States - Exam
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [examCourseId, setExamCourseId] = useState("");
  const [examTitle, setExamTitle] = useState("");
  const [examType, setExamType] = useState<"QUIZ" | "MIDTERM" | "FINAL" | "PRACTICAL">("QUIZ");
  const [examDateTime, setExamDateTime] = useState("");
  const [examHall, setExamHall] = useState("");
  const [examTopics, setExamTopics] = useState("");
  const [isSavingExam, setIsSavingExam] = useState(false);

  // Modal States - Exam Details View
  const [viewingExam, setViewingExam] = useState<Exam | null>(null);

  // Current timestamp for live countdowns
  const [now, setNow] = useState(Date.now());
  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Format Remaining Time
  const getTimeRemainingInfo = (targetTimestamp: number) => {
    const diff = targetTimestamp - now;
    if (diff <= 0) {
      return {
        status: "expired" as const,
        label: "انتهى الموعد",
        badgeColor: "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-600",
        isUrgent: false,
        isExpired: true,
      };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 2) {
      return {
        status: "normal" as const,
        label: `متبقي ${days} أيام و ${hours} ساعة`,
        badgeColor: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40",
        isUrgent: false,
        isExpired: false,
      };
    } else if (days >= 1) {
      return {
        status: "warning" as const,
        label: `متبقي يوم و ${hours} ساعة`,
        badgeColor: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40",
        isUrgent: false,
        isExpired: false,
      };
    } else if (hours > 0) {
      return {
        status: "urgent" as const,
        label: `متبقي ${hours} ساعات و ${minutes} دقيقة 🔥`,
        badgeColor: "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 animate-pulse",
        isUrgent: true,
        isExpired: false,
      };
    } else {
      return {
        status: "critical" as const,
        label: `متبقي ${minutes} دقيقة فقط! 🚨`,
        badgeColor: "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse",
        isUrgent: true,
        isExpired: false,
      };
    }
  };

  // Convert Assignments and Exams to Unified Task Items
  const unifiedTasks = useMemo<UnifiedTaskItem[]>(() => {
    const list: UnifiedTaskItem[] = [];

    // Add Assignments
    assignments.forEach((a) => {
      const isDone = Boolean(currentUser?.uid && a.completedBy?.includes(currentUser.uid));
      list.push({
        id: a.id,
        type: "assignment",
        title: a.title,
        courseId: a.courseId,
        courseName: a.courseName,
        timestamp: a.dueTimestamp,
        description: a.description,
        isDone,
        assignmentData: a,
      });
    });

    // Add Exams
    exams.forEach((e) => {
      list.push({
        id: e.id,
        type: "exam",
        title: e.title,
        courseId: e.courseId,
        courseName: e.courseName,
        timestamp: e.examTimestamp,
        description: e.topics,
        isDone: e.examTimestamp < now,
        examData: e,
      });
    });

    return list.sort((a, b) => a.timestamp - b.timestamp);
  }, [assignments, exams, currentUser?.uid, now]);

  // General Filter Logic
  const filteredTasks = useMemo(() => {
    return unifiedTasks.filter((item) => {
      // Sub-tab filter
      if (activeSubTab === "assignments" && item.type !== "assignment") return false;
      if (activeSubTab === "exams" && item.type !== "exam") return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesCourse = item.courseName.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q) || false;
        const matchesHall = item.examData?.hall?.toLowerCase().includes(q) || false;
        if (!matchesTitle && !matchesCourse && !matchesDesc && !matchesHall) return false;
      }

      // Course Filter
      if (selectedCourseId !== "ALL" && item.courseId !== selectedCourseId) {
        return false;
      }

      // Exam Type Filter
      if (activeSubTab === "exams" || item.type === "exam") {
        if (examTypeFilter !== "ALL" && item.examData?.type !== examTypeFilter) {
          if (activeSubTab === "exams") return false;
        }
      }

      // Status Filter
      const isExpired = item.timestamp <= now;
      const isDone = item.isDone;
      const isUrgent = !isDone && !isExpired && (item.timestamp - now <= 48 * 60 * 60 * 1000);

      if (statusFilter === "pending") {
        if (isDone || isExpired) return false;
      } else if (statusFilter === "completed") {
        if (!isDone) return false;
      } else if (statusFilter === "urgent") {
        if (!isUrgent) return false;
      } else if (statusFilter === "expired") {
        if (!isExpired) return false;
      }

      return true;
    });
  }, [unifiedTasks, activeSubTab, searchQuery, selectedCourseId, examTypeFilter, statusFilter, now]);

  // Quick statistics
  const pendingAssignmentsCount = assignments.filter(
    (a) => !a.completedBy?.includes(currentUser?.uid || "") && a.dueTimestamp > now
  ).length;

  const upcomingExamsCount = exams.filter((e) => e.examTimestamp > now).length;

  const completedAssignmentsCount = assignments.filter((a) =>
    a.completedBy?.includes(currentUser?.uid || "")
  ).length;

  // Open Add Assignment Modal
  const handleOpenAddAssignment = () => {
    setEditingAssignment(null);
    setAssignTitle("");
    setAssignCourseId(courses[0]?.id || "");
    const defaultDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    defaultDate.setHours(23, 59, 0, 0);
    setAssignDueDate(defaultDate.toISOString().slice(0, 16));
    setAssignDesc("");
    setAssignAttachmentUrl("");
    setAssignAttachmentType("link");
    setAssignNotifyBatch(true);
    setIsAssignModalOpen(true);
  };

  // Open Edit Assignment Modal
  const handleOpenEditAssignment = (assign: Assignment) => {
    setEditingAssignment(assign);
    setAssignTitle(assign.title);
    setAssignCourseId(assign.courseId);
    setAssignDueDate(new Date(assign.dueTimestamp).toISOString().slice(0, 16));
    setAssignDesc(assign.description || "");
    const firstAtt = assign.attachments?.[0];
    setAssignAttachmentUrl(firstAtt?.url || "");
    setAssignAttachmentType(firstAtt?.type || "link");
    setAssignNotifyBatch(false);
    setIsAssignModalOpen(true);
  };

  // Handle Save Assignment
  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTitle.trim() || !assignCourseId || !assignDueDate) return;

    setIsSavingAssign(true);
    try {
      const selectedCourse = courses.find((c) => c.id === assignCourseId);
      const dueTimestamp = new Date(assignDueDate).getTime();

      const newAssignment: Assignment = {
        id: editingAssignment ? editingAssignment.id : `assign_${Date.now()}`,
        batchCode: effectiveBatchCode,
        courseId: assignCourseId,
        courseName: selectedCourse?.name || "مادة دراسية",
        title: assignTitle.trim(),
        description: assignDesc.trim(),
        dueDate: assignDueDate,
        dueTimestamp,
        createdAt: editingAssignment ? editingAssignment.createdAt : Date.now(),
        createdBy: editingAssignment ? editingAssignment.createdBy : currentUser?.uid || "admin",
        completedBy: editingAssignment ? editingAssignment.completedBy : [],
        attachments: assignAttachmentUrl.trim()
          ? [
              {
                title: "مرفق الواجب",
                url: assignAttachmentUrl.trim(),
                type: assignAttachmentType,
              },
            ]
          : [],
      };

      await onSaveAssignment(newAssignment, assignNotifyBatch && !editingAssignment);
      setIsAssignModalOpen(false);
      setEditingAssignment(null);
    } finally {
      setIsSavingAssign(false);
    }
  };

  // File Upload Handler for Assignment
  const handleAssignFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert("حجم الملف كبير جداً. الحد الأقصى هو 8 ميغابايت.");
      return;
    }

    setIsUploadingAssignFile(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAssignAttachmentUrl(base64);
      if (file.type.startsWith("image/")) {
        setAssignAttachmentType("image");
      } else {
        setAssignAttachmentType("file");
      }
      setIsUploadingAssignFile(false);
    };
    reader.onerror = () => {
      alert("حدث خطأ أثناء قراءة الملف.");
      setIsUploadingAssignFile(false);
    };
    reader.readAsDataURL(file);
  };

  // Open Add Exam Modal
  const handleOpenAddExam = () => {
    setEditingExam(null);
    setExamCourseId(courses[0]?.id || "");
    setExamTitle("");
    setExamType("QUIZ");
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    nextWeek.setHours(9, 0, 0, 0);
    setExamDateTime(nextWeek.toISOString().slice(0, 16));
    setExamHall("");
    setExamTopics("");
    setIsExamModalOpen(true);
  };

  // Open Edit Exam Modal
  const handleOpenEditExam = (exam: Exam) => {
    setEditingExam(exam);
    setExamCourseId(exam.courseId);
    setExamTitle(exam.title);
    setExamType(exam.type || "QUIZ");
    setExamDateTime(new Date(exam.examTimestamp).toISOString().slice(0, 16));
    setExamHall(exam.hall || "");
    setExamTopics(exam.topics || "");
    setIsExamModalOpen(true);
  };

  // Handle Save Exam
  const handleSubmitExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim() || !examCourseId || !examDateTime) return;

    setIsSavingExam(true);
    try {
      const selectedCourse = courses.find((c) => c.id === examCourseId);
      const examTimestamp = new Date(examDateTime).getTime();

      const newExam: Exam = {
        id: editingExam ? editingExam.id : `exam_${Date.now()}`,
        batchCode: effectiveBatchCode,
        courseId: examCourseId,
        courseName: selectedCourse?.name || "مادة دراسية",
        title: examTitle.trim(),
        type: examType,
        examDate: examDateTime,
        examTimestamp,
        hall: examHall.trim() || undefined,
        topics: examTopics.trim() || undefined,
        createdAt: editingExam ? editingExam.createdAt : Date.now(),
        createdBy: editingExam ? editingExam.createdBy : currentUser?.uid || "admin",
      };

      await onSaveExam(newExam);
      setIsExamModalOpen(false);
      setEditingExam(null);
    } finally {
      setIsSavingExam(false);
    }
  };

  return (
    <div className="space-y-6 p-4 animate-in fade-in duration-300">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                <CheckSquare size={14} className="text-amber-200" />
                دفعة {effectiveBatchCode || "الجامعية"}
              </span>
              <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-medium">
                {assignments.length} واجب • {exams.length} امتحان مجدول
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black mb-1.5 flex items-center gap-2.5">
              <span>المهام والتكليفات والامتحانات 📌</span>
            </h1>
            <p className="opacity-90 text-xs md:text-sm max-w-2xl leading-relaxed">
              مركز موحد لمتابعة كافة مواعيد الواجبات والامتحانات، مع مؤقت عد تنازلي حي، وفلاتر ذكية حسب المادة والحالة لمنع أي تأخير.
            </p>
          </div>

          {/* Action Buttons for Representatives & Owners */}
          {isManager && (
            <div className="flex flex-wrap gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleOpenAddAssignment}
                className="bg-white text-indigo-800 hover:bg-indigo-50 px-4 py-2.5 rounded-2xl font-bold text-xs shadow-md transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Plus size={16} />
                <span>إضافة واجب جديد</span>
              </button>
              <button
                type="button"
                onClick={handleOpenAddExam}
                className="bg-purple-900/40 hover:bg-purple-900/60 border border-white/30 text-white px-4 py-2.5 rounded-2xl font-bold text-xs shadow-md transition flex items-center gap-1.5 active:scale-95 cursor-pointer backdrop-blur-md"
              >
                <Award size={16} className="text-yellow-300" />
                <span>جدولة امتحان جديد</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Summary Cards Inside Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/15">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 text-center">
            <span className="text-[11px] opacity-80 block">الواجبات غير المنجزة</span>
            <span className="text-xl font-black text-amber-300">{pendingAssignmentsCount}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 text-center">
            <span className="text-[11px] opacity-80 block">الامتحانات القادمة</span>
            <span className="text-xl font-black text-purple-200">{upcomingExamsCount}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 text-center">
            <span className="text-[11px] opacity-80 block">واجباتي المنجزة</span>
            <span className="text-xl font-black text-emerald-300">{completedAssignmentsCount}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 text-center">
            <span className="text-[11px] opacity-80 block">إجمالي عناصر المهام</span>
            <span className="text-xl font-black text-white">{unifiedTasks.length}</span>
          </div>
        </div>
      </div>

      {/* 2. Sub-Tabs Switcher (All Tasks / Assignments / Exams) */}
      <div className="bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === "all"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
            }`}
          >
            <span>📌 كل المهام (الجدول الزمني)</span>
            <span className="bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full text-[10px]">
              {unifiedTasks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("assignments")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === "assignments"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
            }`}
          >
            <CheckSquare size={14} />
            <span>الواجبات والتكليفات</span>
            <span className="bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full text-[10px]">
              {assignments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("exams")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === "exams"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
            }`}
          >
            <Award size={14} />
            <span>جدول الامتحانات والاختبارات</span>
            <span className="bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full text-[10px]">
              {exams.length}
            </span>
          </button>
        </div>

        {/* Reset Filter Action */}
        {(selectedCourseId !== "ALL" || statusFilter !== "all" || searchQuery.trim() !== "" || examTypeFilter !== "ALL") && (
          <button
            type="button"
            onClick={() => {
              setSelectedCourseId("ALL");
              setStatusFilter("all");
              setSearchQuery("");
              setExamTypeFilter("ALL");
            }}
            className="text-[11px] font-bold text-red-500 hover:underline px-2 py-1 rounded-lg transition"
          >
            إعادة ضبط الفلاتر ✕
          </button>
        )}
      </div>

      {/* 3. Search and Course Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="بحث في أسماء الواجبات، المواد، الامتحانات، أو القاعات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-700 rounded-2xl pr-10 pl-4 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 transition"
            />
          </div>

          <div className="relative sm:w-64">
            <Filter
              size={16}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-700 rounded-2xl pr-9 pl-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 transition appearance-none cursor-pointer"
            >
              <option value="ALL">كافة المواد الدراسية ({courses.length})</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Course Quick Chips */}
        {courses.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-[10px] font-black text-gray-400 shrink-0">المادة:</span>
            <button
              type="button"
              onClick={() => setSelectedCourseId("ALL")}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold transition shrink-0 cursor-pointer ${
                selectedCourseId === "ALL"
                  ? "bg-gray-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-xs"
                  : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50"
              }`}
            >
              الكل
            </button>
            {courses.map((course) => {
              const countForCourse = unifiedTasks.filter((t) => t.courseId === course.id).length;
              return (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => setSelectedCourseId(course.id)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    selectedCourseId === course.id
                      ? "bg-primary text-white shadow-xs"
                      : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50"
                  }`}
                >
                  <span>{course.name}</span>
                  {countForCourse > 0 && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 font-mono">
                      {countForCourse}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Status and Timeframe Filters */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold pt-1">
          <span className="text-[10px] font-black text-gray-400 shrink-0">الحالة:</span>
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              statusFilter === "all"
                ? "bg-gray-800 text-white dark:bg-slate-200 dark:text-slate-900"
                : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50"
            }`}
          >
            كافة الحالات
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("pending")}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer ${
              statusFilter === "pending"
                ? "bg-amber-600 text-white"
                : "bg-white dark:bg-slate-800 text-amber-600 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-50"
            }`}
          >
            <span>قيد الإنجاز ⏳</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("urgent")}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer ${
              statusFilter === "urgent"
                ? "bg-red-600 text-white animate-pulse"
                : "bg-white dark:bg-slate-800 text-red-600 border border-red-200 dark:border-red-900/50 hover:bg-red-50"
            }`}
          >
            <Flame size={13} />
            <span>حرج (أقل من 48 ساعة) 🔥</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("completed")}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer ${
              statusFilter === "completed"
                ? "bg-emerald-600 text-white"
                : "bg-white dark:bg-slate-800 text-emerald-600 border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-50"
            }`}
          >
            <span>تم الإنجاز ✅</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("expired")}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              statusFilter === "expired"
                ? "bg-gray-600 text-white"
                : "bg-white dark:bg-slate-800 text-gray-500 border border-gray-200 dark:border-slate-700 hover:bg-gray-50"
            }`}
          >
            منتهية الصلاحية
          </button>

          {/* If on exams tab or looking at exams, show Exam Type Filter */}
          {activeSubTab === "exams" && (
            <div className="flex items-center gap-1 mr-auto overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-black text-gray-400">نوع الامتحان:</span>
              {(["ALL", "QUIZ", "MIDTERM", "FINAL", "PRACTICAL"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setExamTypeFilter(t)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                    examTypeFilter === t
                      ? "bg-purple-600 text-white"
                      : "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300"
                  }`}
                >
                  {t === "ALL" ? "الكل" : t === "QUIZ" ? "كويز" : t === "MIDTERM" ? "شهري" : t === "FINAL" ? "فاينل" : "عملي"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Tasks Grid */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 text-gray-400 space-y-3">
          <CheckSquare size={52} className="mx-auto opacity-20" />
          <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">
            لا توجد مهام أو امتحانات مطابقة للخيارات المحددة
          </h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            يمكنك تغيير الفلاتر أو البحث، أو إضافة عناصر جديدة إذا كنت ممثل الدفعة.
          </p>
          {isManager && (
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleOpenAddAssignment}
                className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold transition"
              >
                + إضافة أول واجب
              </button>
              <button
                type="button"
                onClick={handleOpenAddExam}
                className="bg-purple-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition"
              >
                + جدولة أول امتحان
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredTasks.map((item) => {
            const timeInfo = getTimeRemainingInfo(item.timestamp);
            const dateStr = new Date(item.timestamp).toLocaleString("ar-IQ", {
              weekday: "long",
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            // CASE 1: ASSIGNMENT CARD
            if (item.type === "assignment" && item.assignmentData) {
              const assign = item.assignmentData;
              const isDone = item.isDone;
              const completedCount = assign.completedBy?.length || 0;
              const totalStudents = batchStudents.length || 1;
              const percentDone = Math.round((completedCount / totalStudents) * 100);

              return (
                <div
                  key={`assign_${assign.id}`}
                  className={`bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border transition-all duration-200 relative flex flex-col justify-between ${
                    isDone
                      ? "border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10"
                      : timeInfo.isUrgent
                      ? "border-orange-300 dark:border-orange-900/50 shadow-orange-50 dark:shadow-none"
                      : "border-gray-100 dark:border-slate-700"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1">
                          <CheckSquare size={12} />
                          <span>واجب دراسي</span>
                        </span>
                        <span className="bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          {assign.courseName}
                        </span>
                      </div>

                      {/* Time Remaining Badge */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black shrink-0 ${timeInfo.badgeColor}`}>
                        {timeInfo.label}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className={`font-black text-base text-gray-800 dark:text-white leading-snug ${isDone ? "line-through text-gray-400 dark:text-gray-500" : ""}`}>
                      {assign.title}
                    </h3>

                    {/* Rich Description */}
                    {assign.description && (
                      <div className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50/70 dark:bg-slate-700/40 p-3 rounded-2xl border border-gray-100 dark:border-slate-700/60 max-h-36 overflow-y-auto no-scrollbar">
                        <FormattedTextRenderer content={assign.description} />
                      </div>
                    )}

                    {/* Attachment preview / link */}
                    {assign.attachments && assign.attachments.length > 0 && assign.attachments[0].url && (
                      <div className="pt-1">
                        {assign.attachments[0].url.startsWith("data:image/") || assign.attachments[0].type === "image" ? (
                          <div
                            onClick={() =>
                              onPreviewItem &&
                              onPreviewItem({
                                title: assign.title,
                                url: assign.attachments![0].url,
                                type: "IMAGE",
                              })
                            }
                            className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition"
                          >
                            <img
                              src={assign.attachments[0].url}
                              alt="مرفق"
                              className="w-10 h-10 object-cover rounded-lg"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold text-gray-700 dark:text-gray-200 block truncate">
                                صورة مرفقة مع الواجب
                              </span>
                              <span className="text-[10px] text-primary">اضغط للمعاينة المكبرة 🔍</span>
                            </div>
                          </div>
                        ) : (
                          <a
                            href={assign.attachments[0].url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition border border-primary/20"
                          >
                            <FileText size={14} />
                            <span>فتح الملف المرفق</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Meta & Actions */}
                  <div className="pt-4 mt-3 border-t border-gray-100 dark:border-slate-700/60 space-y-3">
                    {/* Due Date & Batch Progress */}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Clock size={13} className="text-gray-400" />
                        <span>التسليم: {dateStr}</span>
                      </div>
                      <span className="text-[10px] font-bold">
                        إنجاز الدفعة: {completedCount}/{totalStudents} ({percentDone}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentDone}%` }}
                      />
                    </div>

                    {/* Actions: Toggle Done & Manager Controls */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onToggleAssignmentDone(assign)}
                        className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                          isDone
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                            : "bg-gray-100 dark:bg-slate-700 hover:bg-emerald-50 text-gray-700 dark:text-gray-200 hover:text-emerald-600"
                        }`}
                      >
                        {isDone ? (
                          <>
                            <CheckCircle2 size={16} />
                            <span>تم الإنجاز بنجاح ✨</span>
                          </>
                        ) : (
                          <>
                            <Circle size={16} />
                            <span>تحديد كمنجز</span>
                          </>
                        )}
                      </button>

                      {isManager && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditAssignment(assign)}
                            className="p-2 rounded-xl text-gray-400 hover:text-primary hover:bg-primary/10 transition cursor-pointer"
                            title="تعديل الواجب"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("هل أنت متأكد من حذف هذا الواجب؟")) {
                                onDeleteAssignment(assign.id);
                              }
                            }}
                            className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                            title="حذف الواجب"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // CASE 2: EXAM CARD
            if (item.type === "exam" && item.examData) {
              const exam = item.examData;
              const typeBadge =
                exam.type === "QUIZ"
                  ? { label: "كويز سريع", bg: "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300" }
                  : exam.type === "MIDTERM"
                  ? { label: "امتحان شهري/نصفي", bg: "bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300" }
                  : exam.type === "FINAL"
                  ? { label: "امتحان فاينل نهائي", bg: "bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300" }
                  : { label: "امتحان عملي/مختبر", bg: "bg-cyan-100 dark:bg-cyan-950/50 text-cyan-800 dark:text-cyan-300" };

              return (
                <div
                  key={`exam_${exam.id}`}
                  className={`bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border transition-all duration-200 relative flex flex-col justify-between ${
                    timeInfo.isUrgent
                      ? "border-purple-400 dark:border-purple-800 shadow-purple-50 dark:shadow-none"
                      : "border-gray-100 dark:border-slate-700"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 ${typeBadge.bg}`}>
                          <Award size={12} />
                          <span>{typeBadge.label}</span>
                        </span>
                        <span className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/40 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          {exam.courseName}
                        </span>
                      </div>

                      {/* Time Remaining Badge */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black shrink-0 ${timeInfo.badgeColor}`}>
                        {timeInfo.label}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-black text-base text-gray-800 dark:text-white leading-snug">
                      {exam.title}
                    </h3>

                    {/* Hall info */}
                    {exam.hall && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/50 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-slate-700">
                        <MapPin size={14} className="text-purple-600 shrink-0" />
                        <span>القاعة / المختبر: {exam.hall}</span>
                      </div>
                    )}

                    {/* Topics / Syllabus */}
                    {exam.topics && (
                      <div className="text-xs text-gray-600 dark:text-gray-300 bg-purple-50/40 dark:bg-purple-950/20 p-3 rounded-2xl border border-purple-100 dark:border-purple-900/30 space-y-1">
                        <span className="font-bold text-[11px] text-purple-700 dark:text-purple-300 block">
                          📖 المادة والملاحظات الامتحانية:
                        </span>
                        <p className="line-clamp-3 whitespace-pre-wrap">{exam.topics}</p>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Meta & Actions */}
                  <div className="pt-4 mt-3 border-t border-gray-100 dark:border-slate-700/60 space-y-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Calendar size={13} className="text-purple-500" />
                        <span>موعد الامتحان: {dateStr}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setViewingExam(exam)}
                        className="flex-1 py-2 px-3 rounded-xl font-bold text-xs bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-purple-700 dark:text-purple-300 transition flex items-center justify-center gap-1.5 cursor-pointer border border-purple-200 dark:border-purple-900/40"
                      >
                        <BookOpen size={14} />
                        <span>عرض تفاصيل الامتحان والمادة</span>
                      </button>

                      {isManager && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditExam(exam)}
                            className="p-2 rounded-xl text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition cursor-pointer"
                            title="تعديل موعد الامتحان"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("هل أنت متأكد من حذف هذا الامتحان؟")) {
                                onDeleteExam(exam.id);
                              }
                            }}
                            className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                            title="حذف الامتحان"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      )}

      {/* MODAL 1: ADD / EDIT ASSIGNMENT */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-slate-700 animate-in zoom-in-95 my-8">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
                  <CheckSquare size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-800 dark:text-white">
                    {editingAssignment ? "تعديل الواجب الدراسي" : "إضافة تكليف / واجب دراسي جديد"}
                  </h3>
                  <p className="text-xs text-gray-400">
                    حدد المادة وموعد التسليم لإرسال إشعار للدفعة وتفعيل العداد
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitAssignment} className="space-y-4 pt-4 text-xs">
              {/* Title */}
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                  عنوان الواجب <span className="text-red-500">*</span>:
                </label>
                <input
                  type="text"
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  placeholder="مثال: حل شيت البرمجة الثاني / تقرير المعمل الأول"
                  className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 font-bold outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              {/* Course & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                    المادة الدراسية <span className="text-red-500">*</span>:
                  </label>
                  <select
                    value={assignCourseId}
                    onChange={(e) => setAssignCourseId(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 font-bold outline-none cursor-pointer"
                    required
                  >
                    <option value="">-- اختر المادة --</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                    موعد التسليم النهائي <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="datetime-local"
                    value={assignDueDate}
                    onChange={(e) => setAssignDueDate(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 font-bold outline-none"
                    required
                  />
                </div>
              </div>

              {/* Rich Text Editor for Description */}
              <RichTextEditor
                value={assignDesc}
                onChange={setAssignDesc}
                placeholder="اكتب تفاصيل التكليف، الملاحظات المطلوبة، التعليمات، ولون التنبيهات المهمة ✍️"
                label="تعليمات وتفاصيل الواجب (اختياري)"
                minHeight="min-h-[130px]"
              />

              {/* Attachment */}
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                  ملف أو صورة أو رابط مرفق مع الواجب (اختياري):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={assignFileInputRef}
                    onChange={handleAssignFilePick}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,image/*"
                    hidden
                  />
                  <button
                    type="button"
                    onClick={() => assignFileInputRef.current?.click()}
                    disabled={isUploadingAssignFile}
                    className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0"
                  >
                    {isUploadingAssignFile ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    <span>رفع من جهازك</span>
                  </button>
                  <input
                    type="text"
                    value={assignAttachmentUrl.startsWith("data:") ? "(تم اختيار ملف من جهازك ✅)" : assignAttachmentUrl}
                    onChange={(e) => setAssignAttachmentUrl(e.target.value)}
                    disabled={assignAttachmentUrl.startsWith("data:")}
                    placeholder="أو ضع رابط خارجي..."
                    className="flex-1 bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3.5 py-2 font-medium outline-none"
                  />
                  {assignAttachmentUrl && (
                    <button
                      type="button"
                      onClick={() => setAssignAttachmentUrl("")}
                      className="text-red-500 hover:text-red-700 p-2"
                      title="حذف المرفق"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Notification Checkbox */}
              {!editingAssignment && (
                <label className="flex items-center gap-2 p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assignNotifyBatch}
                    onChange={(e) => setAssignNotifyBatch(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary"
                  />
                  <span className="font-bold">إرسال إشعار فوري للدفعة ونشره في صندوق الإعلانات 📢</span>
                </label>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSavingAssign}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-primary/20 active:scale-95 disabled:opacity-50"
                >
                  {isSavingAssign ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <span>{editingAssignment ? "حفظ التعديلات" : "نشر الواجب للدفعة 🚀"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT EXAM */}
      {isExamModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-slate-700 animate-in zoom-in-95 my-8">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
                  <Award size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-800 dark:text-white">
                    {editingExam ? "تعديل بيانات الامتحان" : "جدولة موعد امتحان جديد"}
                  </h3>
                  <p className="text-xs text-gray-400">
                    أضف تفاصيل الامتحان وموعده وقاعته لإشعار الطلاب فوراً
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExamModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitExam} className="space-y-4 pt-4 text-xs">
              {/* Course */}
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                  المادة الدراسية <span className="text-red-500">*</span>:
                </label>
                <select
                  value={examCourseId}
                  onChange={(e) => setExamCourseId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 font-bold outline-none cursor-pointer"
                  required
                >
                  <option value="">-- اختر المادة --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                  عنوان الامتحان <span className="text-red-500">*</span>:
                </label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="مثال: كويز سريع / امتحان الشهر الأول / امتحان نصفي"
                  className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 font-bold outline-none"
                  required
                />
              </div>

              {/* Exam Type */}
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                  نوع الامتحان:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(["QUIZ", "MIDTERM", "FINAL", "PRACTICAL"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setExamType(t)}
                      className={`py-2 rounded-xl font-bold text-xs border transition cursor-pointer ${
                        examType === t
                          ? "border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300"
                          : "border-gray-200 dark:border-slate-600 text-gray-500"
                      }`}
                    >
                      {t === "QUIZ" ? "كويز" : t === "MIDTERM" ? "شهري" : t === "FINAL" ? "فاينل" : "عملي"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time */}
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                  تاريخ وتوقيت الامتحان <span className="text-red-500">*</span>:
                </label>
                <input
                  type="datetime-local"
                  value={examDateTime}
                  onChange={(e) => setExamDateTime(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 font-bold outline-none"
                  required
                />
              </div>

              {/* Hall */}
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                  القاعة الامتحانية أو المختبر (اختياري):
                </label>
                <input
                  type="text"
                  value={examHall}
                  onChange={(e) => setExamHall(e.target.value)}
                  placeholder="مثال: القاعة 4 / مختبر البرمجة 2"
                  className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3.5 py-2 font-medium outline-none"
                />
              </div>

              {/* Topics / Syllabus */}
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                  المادة المقررة للامتحان والملاحظات (اختياري):
                </label>
                <textarea
                  value={examTopics}
                  onChange={(e) => setExamTopics(e.target.value)}
                  placeholder="مثال: الفصول 1 إلى 3 + مسائل الشيت الأخير"
                  className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3.5 py-2 outline-none h-20 resize-none font-medium"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSavingExam}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 active:scale-95 disabled:opacity-50"
                >
                  {isSavingExam ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <span>{editingExam ? "حفظ التعديلات" : "نشر موعد الامتحان 📢"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW EXAM DETAILS */}
      {viewingExam && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-slate-700 animate-in zoom-in-95 space-y-4">
            <div className="flex justify-between items-start pb-3 border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center shrink-0">
                  <Award size={26} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-800 dark:text-white">
                    {viewingExam.title}
                  </h3>
                  <p className="text-xs text-gray-400">مادة: {viewingExam.courseName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingExam(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Date & Time */}
              <div className="p-3 bg-purple-50/70 dark:bg-purple-950/30 rounded-2xl border border-purple-100 dark:border-purple-900/40 flex items-center gap-2.5 text-purple-900 dark:text-purple-200">
                <Calendar size={18} className="text-purple-600 shrink-0" />
                <div>
                  <div className="font-bold">الموعد والتوقيت:</div>
                  <div className="text-[11px] mt-0.5">
                    {new Date(viewingExam.examTimestamp).toLocaleString("ar-IQ", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>

              {/* Countdown */}
              {(() => {
                const info = getTimeRemainingInfo(viewingExam.examTimestamp);
                return (
                  <div className={`p-3 rounded-2xl text-center font-black ${info.badgeColor}`}>
                    {info.label}
                  </div>
                );
              })()}

              {/* Hall */}
              {viewingExam.hall && (
                <div className="p-3 bg-gray-50 dark:bg-slate-700/60 rounded-2xl border border-gray-100 dark:border-slate-700 flex items-center gap-2.5 text-gray-800 dark:text-gray-200 font-bold">
                  <MapPin size={18} className="text-red-500 shrink-0" />
                  <div>
                    <div className="text-[10px] text-gray-400 font-normal">مكان الامتحان:</div>
                    <div>{viewingExam.hall}</div>
                  </div>
                </div>
              )}

              {/* Topics / Syllabus */}
              {viewingExam.topics && (
                <div className="p-3.5 bg-gray-50 dark:bg-slate-700/60 rounded-2xl border border-gray-100 dark:border-slate-700 space-y-1.5">
                  <div className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <BookOpen size={15} className="text-primary" />
                    <span>المادة المقررة للامتحان:</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {viewingExam.topics}
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setViewingExam(null)}
              className="w-full py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 text-gray-800 dark:text-white rounded-xl font-bold text-xs transition"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
