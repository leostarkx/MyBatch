import React, { useState, useMemo, useRef } from "react";
import {
  FileText,
  Plus,
  Search,
  BookOpen,
  Download,
  Trash2,
  Pin,
  Heart,
  Upload,
  X,
  Loader2,
  CheckCircle2,
  Image as ImageIcon,
  File,
  Sparkles,
  Filter,
  MessageSquare,
  HelpCircle,
  Layers,
  Award,
  Eye,
  Crown,
} from "lucide-react";
import {
  User,
  UserRole,
  Course,
  StudentSummary,
  SummaryCategory,
  SummaryAttachment,
  Tab,
} from "../types";
import {
  uploadFileToStorage,
  downloadFile,
} from "../services/storageService";
import {
  saveStudentSummaryToFirestore,
  deleteStudentSummaryFromFirestore,
} from "../services/firebase";
import { broadcastBatchNotification } from "../services/notificationService";

interface StudentSummariesHubProps {
  currentUser: User | null;
  allUsers?: User[];
  courses: Course[];
  summaries: StudentSummary[];
  effectiveBatchCode: string;
  isManager: boolean;
  onPreviewImage?: (title: string, url: string) => void;
  onViewProfile?: (uid: string) => void;
}

const CATEGORY_META: {
  id: SummaryCategory;
  label: string;
  badgeColor: string;
  activeColor: string;
  icon: React.ElementType;
}[] = [
  {
    id: "SUMMARY",
    label: "ملخص محاضرة 📖",
    badgeColor:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/50",
    activeColor: "from-blue-600 to-indigo-600",
    icon: FileText,
  },
  {
    id: "NOTES",
    label: "ملاحظات وتأشيرات ✍️",
    badgeColor:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/50",
    activeColor: "from-emerald-500 to-teal-600",
    icon: MessageSquare,
  },
  {
    id: "PAST_QUESTIONS",
    label: "أسئلة وحلول ❓",
    badgeColor:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/50",
    activeColor: "from-purple-600 to-violet-600",
    icon: HelpCircle,
  },
  {
    id: "MINDMAP",
    label: "مخططات وقوانين 🧠",
    badgeColor:
      "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/50",
    activeColor: "from-amber-500 to-orange-500",
    icon: Layers,
  },
  {
    id: "EXAM_REVIEW",
    label: "مراجعة مركزة للامتحان 🔥",
    badgeColor:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/50",
    activeColor: "from-rose-500 to-red-600",
    icon: Sparkles,
  },
];

export const StudentSummariesHub: React.FC<StudentSummariesHubProps> = ({
  currentUser,
  allUsers = [],
  courses,
  summaries,
  effectiveBatchCode,
  isManager,
  onPreviewImage,
  onViewProfile,
}) => {
  // Filtering State
  const [selectedCourseFilter, setSelectedCourseFilter] =
    useState<string>("ALL");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<
    SummaryCategory | "ALL"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"NEWEST" | "POPULAR">("NEWEST");

  // Create Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCourseId, setNewCourseId] = useState("");
  const [newCategory, setNewCategory] = useState<SummaryCategory>("SUMMARY");
  const [newContent, setNewContent] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<
    SummaryAttachment[]
  >([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [isSavingSummary, setIsSavingSummary] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleOpenCreateModal = () => {
    setNewTitle("");
    setNewCourseId(
      selectedCourseFilter !== "ALL"
        ? selectedCourseFilter
        : courses[0]?.id || ""
    );
    setNewCategory(
      selectedCategoryFilter !== "ALL" ? selectedCategoryFilter : "SUMMARY"
    );
    setNewContent("");
    setPendingAttachments([]);
    setIsAddModalOpen(true);
  };

  // Handle uploading one or multiple files of ANY format
  const handleFilesSelected = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingFiles(true);
    const uploadedList: SummaryAttachment[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgressText(
          `جاري رفع الملف (${i + 1}/${files.length}): ${file.name}...`
        );
        const uploadRes = await uploadFileToStorage(
          file,
          null,
          (pct) =>
            setUploadProgressText(
              `جاري رفع ${file.name} (${pct}%)...`
            ),
          "materials"
        );
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        uploadedList.push({
          id: `att_${Date.now()}_${i}`,
          fileName: file.name,
          url: uploadRes.url,
          fileSize: uploadRes.formattedSize || `${sizeMB} MB`,
          mimeType: file.type || "application/octet-stream",
        });
      }
      setPendingAttachments((prev) => [...prev, ...uploadedList]);
    } catch (err) {
      console.error("Failed to upload summary attachment:", err);
      alert("حدث خطأ أثناء رفع الملف، يرجى المحاولة مرة أخرى.");
    } finally {
      setIsUploadingFiles(false);
      setUploadProgressText("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePendingAttachment = (attId: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  const handleSaveNewSummary = async () => {
    if (!currentUser || !effectiveBatchCode) return;

    if (!newCourseId) {
      alert("يرجى اختيار المادة الدراسية المرتبطة بالملخص.");
      return;
    }

    if (!newTitle.trim()) {
      alert("يرجى كتابة عنوان واضح للملخص أو الملاحظة.");
      return;
    }

    if (!newContent.trim() && pendingAttachments.length === 0) {
      alert(
        "يرجى كتابة نص الملاحظة/الملخص أو إرفاق ملف واحد على الأقل (أو كليهما معاً)."
      );
      return;
    }

    setIsSavingSummary(true);
    try {
      const courseObj = courses.find((c) => c.id === newCourseId);
      const summaryItem: StudentSummary = {
        id: `sum_${Date.now()}`,
        batchCode: effectiveBatchCode,
        courseId: newCourseId,
        courseName: courseObj?.name || "مادة عامة",
        category: newCategory,
        title: newTitle.trim(),
        ...(newContent.trim() ? { content: newContent.trim() } : {}),
        ...(pendingAttachments.length > 0
          ? { attachments: pendingAttachments }
          : {}),
        authorUid: currentUser.uid,
        authorName: currentUser.name,
        authorAvatar: currentUser.avatar,
        authorRole: currentUser.role,
        likes: [],
        isPinned: false,
        createdAt: Date.now(),
      };

      await saveStudentSummaryToFirestore(summaryItem);

      await broadcastBatchNotification({
        allUsers,
        batchCode: effectiveBatchCode,
        excludeUid: currentUser.uid,
        category: "SUMMARY",
        title: `✍️ ملخص جديد في ${summaryItem.courseName}`,
        content: `نشر (${currentUser.name}) ملخصاً جديداً بعنوان: «${summaryItem.title}».`,
        targetTab: Tab.SUMMARIES,
      });

      setIsAddModalOpen(false);
    } catch (err) {
      console.error("Error saving student summary:", err);
      alert("تعذر حفظ الملخص، يرجى المحاولة مجدداً.");
    } finally {
      setIsSavingSummary(false);
    }
  };

  const handleToggleLike = async (summary: StudentSummary) => {
    if (!currentUser) return;
    const currentLikes = summary.likes || [];
    const hasLiked = currentLikes.includes(currentUser.uid);
    const updatedLikes = hasLiked
      ? currentLikes.filter((uid) => uid !== currentUser.uid)
      : [...currentLikes, currentUser.uid];

    await saveStudentSummaryToFirestore({
      ...summary,
      likes: updatedLikes,
    });
  };

  const handleTogglePin = async (summary: StudentSummary) => {
    if (!isManager) return;
    await saveStudentSummaryToFirestore({
      ...summary,
      isPinned: !summary.isPinned,
    });
  };

  const handleDeleteSummary = async (summary: StudentSummary) => {
    const canDelete = isManager || summary.authorUid === currentUser?.uid;
    if (!canDelete) return;
    if (!confirm(`هل أنت متأكد من حذف ملخص "${summary.title}"؟`)) return;
    await deleteStudentSummaryFromFirestore(summary.id);
  };

  // Filtered and Sorted Summaries
  const filteredSummaries = useMemo(() => {
    return summaries
      .filter((s) => {
        if (
          selectedCourseFilter !== "ALL" &&
          s.courseId !== selectedCourseFilter
        ) {
          return false;
        }
        if (
          selectedCategoryFilter !== "ALL" &&
          s.category !== selectedCategoryFilter
        ) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = s.title.toLowerCase().includes(q);
          const matchContent = s.content?.toLowerCase().includes(q);
          const matchAuthor = s.authorName.toLowerCase().includes(q);
          const matchCourse = s.courseName.toLowerCase().includes(q);
          const matchFiles = (s.attachments || []).some((att) =>
            att.fileName.toLowerCase().includes(q)
          );
          if (
            !matchTitle &&
            !matchContent &&
            !matchAuthor &&
            !matchCourse &&
            !matchFiles
          ) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        // Pinned always on top
        if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
          return a.isPinned ? -1 : 1;
        }
        if (sortBy === "POPULAR") {
          const aLikes = a.likes?.length || 0;
          const bLikes = b.likes?.length || 0;
          if (bLikes !== aLikes) return bLikes - aLikes;
        }
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
  }, [
    summaries,
    selectedCourseFilter,
    selectedCategoryFilter,
    searchQuery,
    sortBy,
  ]);

  // Top Contributors (أكثر الطلاب مشاركة للملخصات والفائدة)
  const topContributors = useMemo(() => {
    const map = new Map<
      string,
      {
        uid: string;
        name: string;
        avatar?: string;
        count: number;
        likesReceived: number;
      }
    >();

    summaries.forEach((s) => {
      const existing = map.get(s.authorUid) || {
        uid: s.authorUid,
        name: s.authorName,
        avatar: s.authorAvatar,
        count: 0,
        likesReceived: 0,
      };
      existing.count += 1;
      existing.likesReceived += s.likes?.length || 0;
      map.set(s.authorUid, existing);
    });

    return Array.from(map.values())
      .sort((a, b) =>
        b.count !== a.count
          ? b.count - a.count
          : b.likesReceived - a.likesReceived
      )
      .slice(0, 5);
  }, [summaries]);

  // Helper to detect if attachment is an image
  const isImageFile = (att: SummaryAttachment) => {
    if (att.mimeType?.startsWith("image/")) return true;
    const ext = att.fileName.split(".").pop()?.toLowerCase() || "";
    return ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext);
  };

  // Helper to get file extension label
  const getFileBadgeLabel = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toUpperCase() || "FILE";
    return ext.slice(0, 6);
  };

  return (
    <div className="space-y-6 p-4 pb-24 animate-in fade-in duration-300">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -top-16 -left-16 w-52 h-52 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-60 h-60 rounded-full bg-black/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-black border border-white/25">
              <Sparkles size={14} />
              <span>مكتبة ملخصات وملاحظات طلاب الدفعة ({summaries.length})</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black">
              الملخصات والملاحظات الدراسية 📝
            </h1>
            <p className="text-white/90 text-xs md:text-sm max-w-xl leading-relaxed">
              شارك زملاءك ملخصات المحاضرات، الملاحظات المهمة، المخططات، وأسئلة
              الامتحانات — سواء كنص مكتوب، أو ملف بأي صيغة كانت، أو الاثنين معاً
              مرتبطة بكل مادة!
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="bg-white text-indigo-700 hover:bg-indigo-50 px-5 py-3.5 rounded-2xl font-black text-xs sm:text-sm shadow-xl transition flex items-center justify-center gap-2 shrink-0 active:scale-95"
          >
            <Plus size={18} />
            <span>نشر ملخص أو ملاحظة جديدة ✨</span>
          </button>
        </div>
      </div>

      {/* Top Contributors Strip (أبطال مشاركة الملخصات) */}
      {topContributors.length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Award size={18} />
            </div>
            <div>
              <h3 className="text-xs font-black text-gray-800 dark:text-white">
                أكثر الطلاب مساهمة بالملخصات 🌟
              </h3>
              <p className="text-[10px] text-gray-400">
                شكراً لكل طالب يفيد زملاءه في الدفعة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {topContributors.map((c, idx) => (
              <div
                key={c.uid}
                onClick={() => onViewProfile?.(c.uid)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-gray-50 dark:bg-slate-700/60 border border-gray-200/70 dark:border-slate-600 cursor-pointer hover:border-primary transition shrink-0"
              >
                <span className="text-[10px] font-black text-amber-600">
                  #{idx + 1}
                </span>
                <img
                  src={
                    c.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}`
                  }
                  alt={c.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span className="text-xs font-bold text-gray-800 dark:text-white">
                  {c.name}
                </span>
                <span className="text-[10px] font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                  {c.count} ملخص
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Course Filter Pills */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
            <BookOpen size={15} className="text-primary" />
            <span>تصفية حسب المادة الدراسية:</span>
          </span>
          <span className="text-[11px] font-bold text-gray-400">
            النتائج المعروضة: {filteredSummaries.length}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setSelectedCourseFilter("ALL")}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              selectedCourseFilter === "ALL"
                ? "bg-primary text-white shadow-md shadow-primary/25"
                : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50"
            }`}
          >
            <span>جميع المواد</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCourseFilter === "ALL"
                  ? "bg-white/25 text-white"
                  : "bg-gray-100 dark:bg-slate-700 text-gray-500"
              }`}
            >
              {summaries.length}
            </span>
          </button>

          {courses.map((course) => {
            const countInCourse = summaries.filter(
              (s) => s.courseId === course.id
            ).length;
            const isSelected = selectedCourseFilter === course.id;
            return (
              <button
                key={course.id}
                onClick={() => setSelectedCourseFilter(course.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-primary text-white shadow-md shadow-primary/25"
                    : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50"
                }`}
              >
                <span>{course.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? "bg-white/25 text-white"
                      : "bg-gray-100 dark:bg-slate-700 text-gray-500"
                  }`}
                >
                  {countInCourse}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Filter Pills + Search & Sort Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 space-y-3">
        {/* Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategoryFilter("ALL")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition whitespace-nowrap shrink-0 ${
              selectedCategoryFilter === "ALL"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                : "bg-gray-100 dark:bg-slate-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
            }`}
          >
            كل الأصناف ✨
          </button>

          {CATEGORY_META.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryFilter(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? `bg-gradient-to-r ${cat.activeColor} text-white shadow-sm`
                    : "bg-gray-100 dark:bg-slate-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                }`}
              >
                <Icon size={14} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-gray-100 dark:border-slate-700">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في عناوين الملخصات، الملاحظات المكتوبة، أسماء الملفات، أو اسم الطالب..."
              className="w-full bg-gray-50 dark:bg-slate-700/60 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl pr-10 pl-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-700/60 p-1 rounded-2xl self-start sm:self-auto shrink-0">
            <button
              onClick={() => setSortBy("NEWEST")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                sortBy === "NEWEST"
                  ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                  : "text-gray-500 dark:text-gray-300"
              }`}
            >
              الأحدث نشراً 🕒
            </button>
            <button
              onClick={() => setSortBy("POPULAR")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                sortBy === "POPULAR"
                  ? "bg-white dark:bg-slate-800 text-rose-600 shadow-sm"
                  : "text-gray-500 dark:text-gray-300"
              }`}
            >
              الأكثر فائدة وإعجاباً ❤️
            </button>
          </div>
        </div>
      </div>

      {/* Summaries Grid / Feed */}
      {filteredSummaries.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-dashed border-gray-200 dark:border-slate-700 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 flex items-center justify-center mx-auto">
            <FileText size={32} />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="font-black text-base text-gray-800 dark:text-white">
              لا توجد ملخصات أو ملاحظات مطابقة حالياً
            </h3>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              كن أول من يبادر بمشاركة ملخص محاضرة، أو ملاحظات وتأشيرات مهمة، أو
              ملف مراجعة لزملائك في الدفعة!
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 bg-primary text-white rounded-2xl text-xs font-black shadow-lg shadow-primary/25 hover:bg-primary/90 transition inline-flex items-center gap-2"
          >
            <Plus size={16} />
            <span>إضافة أول ملخص الآن</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSummaries.map((summary) => {
            const catMeta =
              CATEGORY_META.find((c) => c.id === summary.category) ||
              CATEGORY_META[0];
            const CatIcon = catMeta.icon;
            const likesCount = summary.likes?.length || 0;
            const isLikedByMe =
              !!currentUser && (summary.likes || []).includes(currentUser.uid);
            const canDelete =
              isManager || summary.authorUid === currentUser?.uid;
            const formattedDate = new Date(
              summary.createdAt
            ).toLocaleDateString("ar-IQ", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={summary.id}
                className={`bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border transition flex flex-col justify-between relative overflow-hidden ${
                  summary.isPinned
                    ? "border-amber-300 dark:border-amber-700/80 ring-1 ring-amber-200/60 dark:ring-amber-800/40 bg-gradient-to-br from-amber-50/20 to-white dark:from-amber-950/15 dark:to-slate-800"
                    : "border-gray-100 dark:border-slate-700 hover:shadow-md"
                }`}
              >
                <div>
                  {/* Top Badges Row: Course + Category + Pin/Delete */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {summary.isPinned && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 flex items-center gap-1">
                          <Pin size={10} className="rotate-45 fill-current" />
                          <span>ملخص مثبت</span>
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-primary/10 text-primary">
                        📚 {summary.courseName}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 ${catMeta.badgeColor}`}
                      >
                        <CatIcon size={11} />
                        <span>{catMeta.label}</span>
                      </span>
                    </div>

                    {/* Actions for Manager / Author */}
                    <div className="flex items-center gap-1 shrink-0">
                      {isManager && (
                        <button
                          onClick={() => handleTogglePin(summary)}
                          className={`p-1.5 rounded-xl transition ${
                            summary.isPinned
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                              : "text-gray-300 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-700"
                          }`}
                          title={
                            summary.isPinned
                              ? "إلغاء تثبيت الملخص"
                              : "تثبيت هذا الملخص في أعلى القسم 📌"
                          }
                        >
                          <Pin size={15} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteSummary(summary)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition"
                          title="حذف الملخص"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-black text-base text-gray-900 dark:text-white mb-2 leading-snug">
                    {summary.title}
                  </h3>

                  {/* Written Message / Note Content (if provided) */}
                  {summary.content && (
                    <div className="p-3.5 rounded-2xl bg-gray-50/90 dark:bg-slate-700/40 border border-gray-100 dark:border-slate-700 text-xs text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed mb-3 max-h-56 overflow-y-auto">
                      {summary.content}
                    </div>
                  )}

                  {/* Attached Files (if provided - supports any file format) */}
                  {summary.attachments && summary.attachments.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <span className="text-[10px] font-black text-gray-400 block">
                        المرفقات والملفات ({summary.attachments.length}):
                      </span>
                      <div className="space-y-1.5">
                        {summary.attachments.map((att) => {
                          const isImg = isImageFile(att);
                          const extBadge = getFileBadgeLabel(att.fileName);

                          return (
                            <div
                              key={att.id}
                              className="p-2.5 rounded-2xl bg-indigo-50/50 dark:bg-slate-700/60 border border-indigo-100/80 dark:border-slate-600 flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-mono font-black text-[10px] flex items-center justify-center shrink-0 shadow-xs">
                                  {isImg ? <ImageIcon size={16} /> : extBadge}
                                </div>
                                <div className="min-w-0">
                                  <p
                                    className="text-xs font-bold text-gray-800 dark:text-white truncate"
                                    title={att.fileName}
                                  >
                                    {att.fileName}
                                  </p>
                                  {att.fileSize && (
                                    <span className="text-[10px] text-gray-400 font-mono">
                                      {att.fileSize}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {isImg && onPreviewImage && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onPreviewImage(att.fileName, att.url)
                                    }
                                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-slate-600 text-[11px] font-bold hover:bg-indigo-50 transition flex items-center gap-1"
                                    title="معاينة الصورة"
                                  >
                                    <Eye size={13} />
                                    <span>معاينة</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    downloadFile(att.url, att.fileName)
                                  }
                                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-xs active:scale-95"
                                >
                                  <Download size={13} />
                                  <span>تحميل</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer: Author Info + Helpful/Like Button */}
                <div className="pt-3 border-t border-gray-100 dark:border-slate-700/80 flex items-center justify-between gap-2">
                  <div
                    onClick={() => onViewProfile?.(summary.authorUid)}
                    className="flex items-center gap-2.5 cursor-pointer group min-w-0"
                  >
                    <img
                      src={
                        summary.authorAvatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(summary.authorName)}`
                      }
                      alt={summary.authorName}
                      className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-slate-600 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-gray-800 dark:text-white group-hover:text-primary transition truncate">
                          {summary.authorName}
                        </span>
                        {summary.authorRole === UserRole.REPRESENTATIVE && (
                          <Crown
                            size={12}
                            className="text-purple-600 shrink-0"
                          />
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 block">
                        {formattedDate}
                      </span>
                    </div>
                  </div>

                  {/* Like / Helpful Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleLike(summary)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 active:scale-95 ${
                      isLikedByMe
                        ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                        : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-rose-50 hover:text-rose-600"
                    }`}
                    title="أعجبني / ملخص مفيد"
                  >
                    <Heart
                      size={14}
                      className={isLikedByMe ? "fill-current" : ""}
                    />
                    <span>مفيد ({likesCount})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create / Share New Summary or Note */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 p-6 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base md:text-lg text-gray-800 dark:text-white">
                    مشاركة ملخص أو ملاحظة دراسية 📝
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    يمكنك كتابة ملاحظة نصية، أو رفع ملف بأي صيغة، أو جمعهما معاً
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 py-5">
              {/* 1. Select Course */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                    المادة الدراسية المرتبطة *
                  </label>
                  <select
                    value={newCourseId}
                    onChange={(e) => setNewCourseId(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-3.5 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">-- اختر المادة --</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Select Category */}
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                    صنف المشاركة *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) =>
                      setNewCategory(e.target.value as SummaryCategory)
                    }
                    className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-3.5 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {CATEGORY_META.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Summary Title */}
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                  عنوان الملخص أو الملاحظة *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: ملخص قوانين الفصل الثالث / تأشيرات المحاضرة الخامسة..."
                  className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* 4. Text Note / Message Content (Optional if file attached, or both) */}
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center justify-between">
                  <span>نص الملاحظة أو الشرح المكتوب (اختياري مع الملفات)</span>
                  <span className="text-[10px] text-gray-400 font-normal">
                    يدعم الفقرات والنقاط
                  </span>
                </label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="اكتب ملاحظاتك، النقاط المهمة التي ركز عليها الدكتور، أو شرح الملخص هنا..."
                  className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 min-h-[120px] resize-y leading-relaxed"
                />
              </div>

              {/* 5. Any-Format File Attachments */}
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                  إرفاق ملفات (PDF, Word, PowerPoint, صور، مضغوط، أو أي صيغة
                  كانت)
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFilesSelected}
                  className="hidden"
                />

                <button
                  type="button"
                  disabled={isUploadingFiles}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-indigo-200 dark:border-slate-600 hover:border-indigo-500 bg-indigo-50/40 dark:bg-slate-700/40 rounded-2xl p-4 text-center transition flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isUploadingFiles ? (
                    <>
                      <Loader2
                        size={24}
                        className="animate-spin text-indigo-600"
                      />
                      <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                        {uploadProgressText || "جاري رفع الملفات..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload size={22} className="text-indigo-600" />
                      <span className="text-xs font-black text-gray-800 dark:text-white">
                        اضغط لاختيار ملف أو عدة ملفات بأي صيغة لرفعها
                      </span>
                      <span className="text-[10px] text-gray-400">
                        يمكنك رفع ملفات PDF، صور الدفتر، مستندات Word، عروض،
                        أو ملفات مضغوطة
                      </span>
                    </>
                  )}
                </button>

                {/* Pending Uploaded Files List */}
                {pendingAttachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={14} />
                      <span>
                        ملفات جاهزة للنشر ({pendingAttachments.length}):
                      </span>
                    </span>
                    {pendingAttachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <File size={15} className="text-indigo-600 shrink-0" />
                          <span className="font-bold text-gray-800 dark:text-white truncate">
                            {att.fileName}
                          </span>
                          {att.fileSize && (
                            <span className="text-[10px] text-gray-400 shrink-0">
                              ({att.fileSize})
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePendingAttachment(att.id)}
                          className="text-red-500 hover:bg-red-50 p-1 rounded-lg"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-2xl font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={isSavingSummary || isUploadingFiles}
                onClick={handleSaveNewSummary}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 disabled:opacity-50 transition active:scale-95"
              >
                {isSavingSummary ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>جاري النشر...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>نشر الملخص للدفعة</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
