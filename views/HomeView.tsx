import React, { useState, useRef } from "react";
import {
  Bell,
  Plus,
  Pin,
  Trash2,
  Clock,
  Trophy,
  ArrowRight,
  Vote,
  Check,
  Users,
  CheckSquare,
  Square,
  CheckCircle,
  Eye,
  Maximize2,
  ExternalLink,
  X,
  Upload,
  Loader2,
} from "lucide-react";
import {
  User,
  Announcement,
  Assignment,
  CourseProject,
  Exam,
  Course,
  Tab,
} from "../types";
import { LiveCountdownStrip } from "../components/LiveCountdownStrip";
import { RichTextEditor } from "../components/RichTextEditor";
import { FormattedTextRenderer } from "../components/FormattedTextRenderer";
import { compareArabicNames } from "../services/firebase";
import { compressImage } from "../services/imageCompressor";

export interface HomeViewProps {
  currentUser: User | null;
  canManageAnnouncements: boolean;
  isManager: boolean;
  canManageAssignments: boolean;
  assignments: Assignment[];
  projects: CourseProject[];
  exams: Exam[];
  courses: Course[];
  announcements: Announcement[];
  userNameMap: Map<string, string>;
  currentTimer?: number;
  setActiveTab: (tab: Tab) => void;
  onSaveExam: (exam: Partial<Exam>) => Promise<void>;
  onDeleteExam: (id: string) => Promise<void>;
  onToggleCompleteAssignmentById: (id: string) => Promise<void>;
  onOpenAddAssignment: () => void;
  onToggleAssignmentDone: (assign: Assignment) => Promise<void>;
  onTogglePinAnnouncement: (ann: Announcement) => Promise<void>;
  onDeleteAnnouncement: (id: string) => Promise<void>;
  onVoteAnnouncementPoll: (ann: Announcement, optionId: string) => Promise<void>;
  onAddAnnouncement: (data: {
    title: string;
    courseId?: string;
    courseName?: string;
    content: string;
    priority: "normal" | "high";
    isPinned: boolean;
    mediaUrl?: string;
    mediaType?: "image" | "video" | "link";
    poll?: {
      question: string;
      options: { id: string; text: string; votes: string[] }[];
    };
  }) => Promise<void>;
  onPreviewImage: (title: string, url: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  currentUser,
  canManageAnnouncements,
  isManager,
  canManageAssignments,
  assignments,
  projects,
  exams,
  courses,
  announcements,
  userNameMap,
  currentTimer = Date.now(),
  setActiveTab,
  onSaveExam,
  onDeleteExam,
  onToggleCompleteAssignmentById,
  onOpenAddAssignment,
  onToggleAssignmentDone,
  onTogglePinAnnouncement,
  onDeleteAnnouncement,
  onVoteAnnouncementPoll,
  onAddAnnouncement,
  onPreviewImage,
}) => {
  const [expandedPollVotersAnnId, setExpandedPollVotersAnnId] = useState<string | null>(null);

  // Add Announcement Modal State
  const [isAddingAnnouncement, setIsAddingAnnouncement] = useState(false);
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState("");
  const [newAnnouncementCourse, setNewAnnouncementCourse] = useState("");
  const [newAnnouncementContent, setNewAnnouncementContent] = useState("");
  const [newAnnouncementPinned, setNewAnnouncementPinned] = useState(false);
  const [newAnnouncementHasPoll, setNewAnnouncementHasPoll] = useState(false);
  const [newPollQuestion, setNewPollQuestion] = useState("");
  const [newPollOptions, setNewPollOptions] = useState<string[]>(["", ""]);
  const [newAnnouncementMediaUrl, setNewAnnouncementMediaUrl] = useState("");
  const [newAnnouncementMediaType, setNewAnnouncementMediaType] = useState<"image" | "video" | "link">("image");
  const [newAnnouncementPriority, setNewAnnouncementPriority] = useState<"normal" | "high">("normal");
  const [isUploadingAnnouncementFile, setIsUploadingAnnouncementFile] = useState(false);
  const announcementFileInputRef = useRef<HTMLInputElement>(null);

  const getRemainingTimeInfo = (dueTimestamp: number) => {
    const diff = dueTimestamp - currentTimer;
    if (diff <= 0) {
      return {
        status: "expired" as const,
        text: "انتهى موعد التسليم",
        badgeClass: "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50",
      };
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 2) {
      return {
        status: "normal" as const,
        text: `متبقي ${days} أيام و ${hours} ساعة`,
        badgeClass: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50",
      };
    } else if (days >= 1) {
      return {
        status: "warning" as const,
        text: `متبقي يوم و ${hours} ساعة`,
        badgeClass: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50",
      };
    } else if (hours > 0) {
      return {
        status: "urgent" as const,
        text: `متبقي ${hours} ساعة و ${minutes} دقيقة 🚨`,
        badgeClass: "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50 font-black animate-pulse",
      };
    } else {
      return {
        status: "critical" as const,
        text: `متبقي أقل من ساعة (${minutes} دقيقة) ⚠️`,
        badgeClass: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50 font-black animate-pulse",
      };
    }
  };

  const handleAnnouncementFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAnnouncementFile(true);
    try {
      if (file.type.startsWith("image/")) {
        const compressed = await compressImage(file, { maxWidth: 1600, quality: 0.8 });
        setNewAnnouncementMediaUrl(compressed);
        setNewAnnouncementMediaType("image");
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          setNewAnnouncementMediaUrl(reader.result as string);
          setNewAnnouncementMediaType("video");
          setIsUploadingAnnouncementFile(false);
        };
        reader.readAsDataURL(file);
        return;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingAnnouncementFile(false);
    }
  };

  const handleSubmitAnnouncement = async () => {
    if (!newAnnouncementTitle.trim() || !newAnnouncementContent.trim() || !currentUser) return;

    const selectedCourse = courses.find((c) => c.id === newAnnouncementCourse);
    const validPollOptions = newPollOptions
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    const hasValidPoll =
      newAnnouncementHasPoll &&
      newPollQuestion.trim().length > 0 &&
      validPollOptions.length >= 2;

    await onAddAnnouncement({
      title: newAnnouncementTitle.trim(),
      courseId: newAnnouncementCourse || undefined,
      courseName: selectedCourse?.name,
      content: newAnnouncementContent,
      priority: newAnnouncementPriority,
      isPinned: newAnnouncementPinned,
      mediaUrl: newAnnouncementMediaUrl.trim() || undefined,
      mediaType: newAnnouncementMediaUrl.trim() ? newAnnouncementMediaType : undefined,
      poll: hasValidPoll
        ? {
            question: newPollQuestion.trim(),
            options: validPollOptions.map((optText, idx) => ({
              id: `opt_${idx}_${Date.now()}`,
              text: optText,
              votes: [],
            })),
          }
        : undefined,
    });

    // Reset Form
    setIsAddingAnnouncement(false);
    setNewAnnouncementTitle("");
    setNewAnnouncementCourse("");
    setNewAnnouncementContent("");
    setNewAnnouncementPinned(false);
    setNewAnnouncementHasPoll(false);
    setNewPollQuestion("");
    setNewPollOptions(["", ""]);
    setNewAnnouncementMediaUrl("");
    setNewAnnouncementPriority("normal");
  };

  // Sort: pinned first, then newest
  const sortedHomeAnnouncements = [...announcements].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.timestamp - a.timestamp;
  });

  const upcomingHomeAssignments = [...assignments]
    .sort((a, b) => a.dueTimestamp - b.dueTimestamp)
    .slice(0, 3);

  return (
    <div className="space-y-6 p-4">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-200 dark:shadow-none relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">
            مرحباً، {currentUser?.name} 👋
          </h1>
          <p className="opacity-90 text-lg">
            أهلاً بك في منصة دفعتي، كل ما تحتاجه في مكان واحد.
          </p>
        </div>
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
          </svg>
        </div>
      </div>

      {/* Live Countdown Strip for Assignments, Exams & Projects */}
      <LiveCountdownStrip
        assignments={assignments}
        projects={projects}
        exams={exams}
        courses={courses}
        currentUser={currentUser}
        isManager={isManager}
        onNavigateTab={setActiveTab}
        onSaveExam={onSaveExam}
        onDeleteExam={onDeleteExam}
        onToggleCompleteAssignment={onToggleCompleteAssignmentById}
      />

      {/* Quick Competition & Leaderboard Banner on Home */}
      <div
        onClick={() => setActiveTab(Tab.LEADERBOARD)}
        className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-5 text-white shadow-lg shadow-orange-500/15 cursor-pointer hover:scale-[1.005] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden group"
      >
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shrink-0 group-hover:rotate-6 transition">
            <Trophy size={26} className="text-yellow-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base sm:text-lg text-white">
                ساحة المنافسة ولوحة شرف الدفعة 🏆🔥
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/25 text-white">
                جديد ✨
              </span>
            </div>
            <p className="text-xs text-white/90 mt-0.5">
              اكتشف من يتصدر الدفعة في السعي التراكمي، الحضور، درجات الكويزات، ومن في صدارة الغيابات 😅!
            </p>
          </div>
        </div>
        <button
          type="button"
          className="relative z-10 bg-white text-orange-600 hover:bg-orange-50 px-4 py-2.5 rounded-2xl text-xs font-black shadow-md transition flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-center"
        >
          <span>عرض الترتيب والمنافسة</span>
          <ArrowRight size={15} className="rtl:rotate-180" />
        </button>
      </div>

      {/* Upcoming Assignments Preview Section */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Clock className="text-amber-500" size={24} />
              الواجبات والتكليفات القادمة ⏳
            </h2>
            {assignments.length > 0 && (
              <span className="bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-xs font-bold px-2 py-0.5 rounded-full">
                {assignments.filter((a) => !a.completedBy?.includes(currentUser?.uid || "")).length} متبقي
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {(isManager || canManageAssignments) && (
              <button
                type="button"
                onClick={onOpenAddAssignment}
                className="bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 active:scale-95 cursor-pointer shadow-xs"
              >
                <Plus size={16} />
                إضافة واجب
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab(Tab.ASSIGNMENTS)}
              className="text-primary hover:underline text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              عرض كل الواجبات ({assignments.length}) ➔
            </button>
          </div>
        </div>

        {assignments.length === 0 ? (
          <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 text-center text-gray-400 text-xs flex flex-col items-center justify-center gap-2.5">
            <span>لا توجد واجبات دراسية مضافة حالياً.</span>
            {(isManager || canManageAssignments) && (
              <button
                type="button"
                onClick={onOpenAddAssignment}
                className="bg-primary text-white hover:bg-primary/90 px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
              >
                <Plus size={14} />
                إضافة أول واجب
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingHomeAssignments.map((assign) => {
              const isDone = assign.completedBy?.includes(currentUser?.uid || "");
              const timeInfo = getRemainingTimeInfo(assign.dueTimestamp);
              return (
                <div
                  key={assign.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 relative flex flex-col justify-between ${
                    isDone
                      ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 opacity-80"
                      : timeInfo.status === "urgent" || timeInfo.status === "critical"
                      ? "bg-orange-50/40 dark:bg-orange-950/20 border-orange-300 dark:border-orange-800 shadow-sm"
                      : "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 shadow-sm"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-lg truncate max-w-[120px]">
                        {assign.courseName}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 ${timeInfo.badgeClass}`}>
                        {timeInfo.text}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-gray-800 dark:text-white line-clamp-1 mb-1">
                      {assign.title}
                    </h3>
                    {assign.description && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-3">
                        {assign.description}
                      </p>
                    )}
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-slate-700/50 flex items-center justify-between">
                    <button
                      onClick={() => onToggleAssignmentDone(assign)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                        isDone
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-100 dark:bg-slate-700 hover:bg-primary/10 hover:text-primary text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {isDone ? <CheckCircle size={14} /> : <Square size={14} />}
                      {isDone ? "أنجزت الواجب" : "تحديد كمنجز"}
                    </button>
                    <button
                      onClick={() => setActiveTab(Tab.ASSIGNMENTS)}
                      className="text-[10px] text-gray-400 hover:text-primary transition"
                    >
                      التفاصيل ➔
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Announcements */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Bell className="text-primary" size={24} />
          الإعلانات والتنبيهات
        </h2>
        {canManageAnnouncements && (
          <button
            onClick={() => setIsAddingAnnouncement(true)}
            className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition flex items-center gap-2 cursor-pointer"
          >
            <Plus size={18} />
            إضافة إعلان
          </button>
        )}
      </div>

      {/* Announcements List (Pinned First) */}
      <div className="space-y-4">
        {sortedHomeAnnouncements.map((ann) => {
          const totalPollVotes = ann.poll
            ? ann.poll.options.reduce((acc, o) => acc + (o.votes?.length || 0), 0)
            : 0;
          const isShowingVoters = expandedPollVotersAnnId === ann.id;

          return (
            <div
              key={ann.id}
              className={`bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border relative overflow-hidden group transition ${
                ann.isPinned
                  ? "border-amber-300 dark:border-amber-700/70 bg-gradient-to-br from-amber-50/30 to-white dark:from-amber-950/15 dark:to-slate-800 ring-1 ring-amber-200/60 dark:ring-amber-800/40"
                  : "border-gray-100 dark:border-slate-700"
              } ${ann.priority === "high" ? "border-l-4 border-l-red-500" : ""}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-wrap items-center gap-2">
                  {ann.isPinned && (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 flex items-center gap-1 shadow-xs">
                      <Pin size={11} className="rotate-45 fill-current" />
                      مثبت بالأعلى
                    </span>
                  )}
                  <span
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                      ann.priority === "high"
                        ? "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400"
                        : "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                    }`}
                  >
                    {ann.priority === "high" ? "هام جداً" : "إعلان عام"}
                  </span>
                  {ann.courseName && (
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded-lg text-[10px] font-bold">
                      {ann.courseName}
                    </span>
                  )}
                  {ann.poll && (
                    <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
                      <Vote size={11} />
                      تصويت تفاعلي
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400">
                    {new Date(ann.timestamp).toLocaleDateString("ar-EG")}
                  </span>
                </div>
                {canManageAnnouncements && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onTogglePinAnnouncement(ann)}
                      className={`p-1.5 rounded-xl transition flex items-center gap-1 text-[11px] font-bold ${
                        ann.isPinned
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                          : "text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-700"
                      }`}
                      title={ann.isPinned ? "إلغاء تثبيت التبليغ" : "تثبيت التبليغ في الأعلى"}
                    >
                      <Pin size={15} className={ann.isPinned ? "rotate-45 fill-current" : ""} />
                      <span className="hidden sm:inline">{ann.isPinned ? "مثبت" : "تثبيت"}</span>
                    </button>
                    <button
                      onClick={() => onDeleteAnnouncement(ann.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"
                      title="حذف الإعلان"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-2">
                {ann.title}
              </h3>
              <div className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
                <FormattedTextRenderer content={ann.content} />
              </div>

              {/* Interactive Poll Section */}
              {ann.poll && (
                <div className="mb-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-sm text-gray-800 dark:text-white flex items-center gap-2">
                      <Vote size={17} className="text-primary shrink-0" />
                      <span>{ann.poll.question}</span>
                    </h4>
                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-full border border-gray-200 dark:border-slate-700 shrink-0">
                      {totalPollVotes} صوت
                    </span>
                  </div>

                  <div className="space-y-2">
                    {ann.poll.options.map((opt) => {
                      const votesCount = opt.votes?.length || 0;
                      const pct =
                        totalPollVotes > 0
                          ? Math.round((votesCount / totalPollVotes) * 100)
                          : 0;
                      const hasVotedThis = Boolean(
                        currentUser && opt.votes?.includes(currentUser.uid)
                      );
                      const voterNames =
                        isShowingVoters && opt.votes && opt.votes.length > 0
                          ? opt.votes
                              .map((uid) => userNameMap.get(uid) || "طالب")
                              .filter(Boolean)
                              .sort((a, b) => compareArabicNames(a, b))
                          : [];

                      return (
                        <div key={opt.id} className="space-y-1">
                          <button
                            type="button"
                            onClick={() => onVoteAnnouncementPoll(ann, opt.id)}
                            className={`w-full relative overflow-hidden rounded-xl border p-3 text-right transition-all ${
                              hasVotedThis
                                ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-xs"
                                : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary/50"
                            }`}
                          >
                            {/* Progress Fill Bar */}
                            <div
                              className={`absolute inset-y-0 right-0 transition-all duration-500 ${
                                hasVotedThis
                                  ? "bg-primary/15 dark:bg-primary/25"
                                  : "bg-gray-100 dark:bg-slate-700/60"
                              }`}
                              style={{ width: `${pct}%` }}
                            />

                            <div className="relative z-10 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div
                                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                    hasVotedThis
                                      ? "border-primary bg-primary text-white"
                                      : "border-gray-300 dark:border-slate-500"
                                  }`}
                                >
                                  {hasVotedThis && <Check size={10} />}
                                </div>
                                <span className="text-xs sm:text-sm font-bold text-gray-800 dark:text-white truncate">
                                  {opt.text}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                  ({votesCount})
                                </span>
                                <span className="text-xs font-black text-primary min-w-[34px] text-left">
                                  {pct}%
                                </span>
                              </div>
                            </div>
                          </button>

                          {/* Voters List if expanded */}
                          {isShowingVoters && voterNames.length > 0 && (
                            <div className="px-3 py-1.5 text-[11px] text-gray-500 dark:text-gray-400 flex flex-wrap gap-1 items-center">
                              <span className="font-bold text-gray-700 dark:text-gray-300">
                                المصوتون ({voterNames.length}):
                              </span>
                              {voterNames.map((n, idx) => (
                                <span
                                  key={idx}
                                  className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-2 py-0.5 rounded-md text-[10px]"
                                >
                                  {n}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {totalPollVotes > 0 && (
                    <div className="pt-1 flex justify-between items-center">
                      <span className="text-[10px] text-gray-400">
                        انقر على أي خيار للتصويت أو تغيير صوتك
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedPollVotersAnnId(isShowingVoters ? null : ann.id)
                        }
                        className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Users size={12} />
                        <span>
                          {isShowingVoters ? "إخفاء أسماء المصوتين" : "عرض أسماء المصوتين"}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {(ann.title.includes("واجب") || ann.content.includes("واجب") || ann.title.includes("تكليف")) && (
                <div className="mb-4">
                  <button
                    onClick={() => setActiveTab(Tab.ASSIGNMENTS)}
                    className="inline-flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer"
                  >
                    <CheckSquare size={15} className="text-amber-600 dark:text-amber-400" />
                    <span>الانتقال لقسم الواجبات والتسليم ومتابعة الوقت المتبقي ➔</span>
                  </button>
                </div>
              )}

              {ann.mediaUrl && (
                <div className="mb-4 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
                  {ann.mediaType === "image" ||
                  ann.mediaUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i) ||
                  ann.mediaUrl.startsWith("data:image/") ||
                  ann.mediaUrl.includes("cloudinary.com") ||
                  ann.mediaUrl.startsWith("blob:") ? (
                    <div
                      onClick={() => {
                        onPreviewImage(ann.title || "صورة التبليغ", ann.mediaUrl!);
                      }}
                      className="relative group cursor-pointer overflow-hidden block"
                      title="اضغط لمعاينة وتكبير الصورة"
                    >
                      <img
                        src={ann.mediaUrl}
                        alt={ann.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-auto max-h-96 object-cover group-hover:scale-[1.015] transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="bg-black/75 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-2xl flex items-center gap-2 shadow-xl border border-white/20">
                          <Eye size={16} />
                          <span>تكبير ومعاينة الصورة 🔍</span>
                        </span>
                      </div>
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5 opacity-85 group-hover:opacity-100 shadow-sm border border-white/10">
                        <Maximize2 size={13} />
                        <span>تكبير الصورة</span>
                      </div>
                    </div>
                  ) : ann.mediaType === "video" ? (
                    <video
                      src={ann.mediaUrl}
                      controls
                      className="w-full h-auto max-h-80"
                    />
                  ) : (
                    <a
                      href={ann.mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 text-primary hover:underline font-bold text-sm"
                    >
                      <ExternalLink size={18} />
                      {ann.mediaUrl}
                    </a>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-gray-50 dark:border-slate-700 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {ann.authorName.charAt(0)}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  نشر بواسطة <span className="font-bold">{ann.authorName}</span>
                </span>
              </div>
            </div>
          );
        })}

        {announcements.length === 0 && (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 border-dashed">
            لا توجد إعلانات حالياً
          </div>
        )}
      </div>

      {/* Add Announcement Modal */}
      {isAddingAnnouncement && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                إضافة إعلان أو تصويت جديد
              </h3>
              <button onClick={() => setIsAddingAnnouncement(false)} className="cursor-pointer">
                <X size={20} className="text-gray-400 dark:text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="عنوان الإعلان"
                  className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm outline-none"
                  value={newAnnouncementTitle}
                  onChange={(e) => setNewAnnouncementTitle(e.target.value)}
                />
                <select
                  value={newAnnouncementCourse}
                  onChange={(e) => setNewAnnouncementCourse(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm outline-none cursor-pointer"
                >
                  <option value="">إعلان عام (لكافة الطلاب)</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <RichTextEditor
                value={newAnnouncementContent}
                onChange={setNewAnnouncementContent}
                placeholder="اكتب محتوى الإعلان هنا... يمكنك تحديد الكلمات وتنسيقها مثل التليغرام (عريض، مائل، تسطير، ألوان، سبويلر) ✍️"
                label="محتوى التبليغ بالتنسيق الغني"
                required
                minHeight="min-h-[160px]"
              />

              {/* Pin & Poll Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setNewAnnouncementPinned(!newAnnouncementPinned)}
                  className={`p-3 rounded-2xl border text-right flex items-center justify-between transition cursor-pointer ${
                    newAnnouncementPinned
                      ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200"
                      : "bg-gray-50 dark:bg-slate-700/40 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Pin size={16} className={newAnnouncementPinned ? "rotate-45 fill-current text-amber-600" : ""} />
                    <span className="text-xs font-bold">تثبيت في أعلى الرئيسية</span>
                  </div>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${newAnnouncementPinned ? "bg-amber-500 border-amber-500 text-white" : "border-gray-300"}`}>
                    {newAnnouncementPinned && <Check size={11} />}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setNewAnnouncementHasPoll(!newAnnouncementHasPoll)}
                  className={`p-3 rounded-2xl border text-right flex items-center justify-between transition cursor-pointer ${
                    newAnnouncementHasPoll
                      ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200"
                      : "bg-gray-50 dark:bg-slate-700/40 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Vote size={16} className={newAnnouncementHasPoll ? "text-indigo-600" : ""} />
                    <span className="text-xs font-bold">إرفاق تصويت / استبيان</span>
                  </div>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${newAnnouncementHasPoll ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-300"}`}>
                    {newAnnouncementHasPoll && <Check size={11} />}
                  </div>
                </button>
              </div>

              {/* Poll Builder UI */}
              {newAnnouncementHasPoll && (
                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/60 space-y-3">
                  <div>
                    <label className="text-xs font-bold text-indigo-900 dark:text-indigo-200 mb-1 block">
                      سؤال التصويت
                    </label>
                    <input
                      type="text"
                      placeholder="اكتب السؤال أو موضوع الاستبيان..."
                      value={newPollQuestion}
                      onChange={(e) => setNewPollQuestion(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 dark:text-white border border-indigo-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-indigo-900 dark:text-indigo-200 block">
                      خيارات التصويت (2 كحد أدنى)
                    </label>
                    {newPollOptions.map((opt, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder={`الخيار ${idx + 1}`}
                          value={opt}
                          onChange={(e) => {
                            const updated = [...newPollOptions];
                            updated[idx] = e.target.value;
                            setNewPollOptions(updated);
                          }}
                          className="flex-1 bg-white dark:bg-slate-800 dark:text-white border border-indigo-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs outline-none"
                        />
                        {newPollOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() =>
                              setNewPollOptions(newPollOptions.filter((_, i) => i !== idx))
                            }
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg cursor-pointer"
                          >
                            <X size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                    {newPollOptions.length < 6 && (
                      <button
                        type="button"
                        onClick={() => setNewPollOptions([...newPollOptions, ""])}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 pt-1 cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>إضافة خيار آخر</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-700 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">
                    وسائط الإعلان (اختياري)
                  </label>
                  <input
                    type="file"
                    ref={announcementFileInputRef}
                    onChange={handleAnnouncementFilePick}
                    accept="image/*,video/*"
                    hidden
                  />
                  <button
                    type="button"
                    onClick={() => announcementFileInputRef.current?.click()}
                    disabled={isUploadingAnnouncementFile}
                    className="bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {isUploadingAnnouncementFile ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                    اختر صورة من جهازك
                  </button>
                </div>
                <div className="flex flex-col md:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="أو اكتب رابط الصورة، الفيديو، أو موقع خارجي..."
                    className="flex-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none"
                    value={newAnnouncementMediaUrl.startsWith("data:") ? "(تم اختيار صورة من الجهاز ✅)" : newAnnouncementMediaUrl}
                    onChange={(e) => setNewAnnouncementMediaUrl(e.target.value)}
                    disabled={newAnnouncementMediaUrl.startsWith("data:")}
                  />
                  <select
                    value={newAnnouncementMediaType}
                    onChange={(e) => setNewAnnouncementMediaType(e.target.value as any)}
                    disabled={newAnnouncementMediaUrl.startsWith("data:")}
                    className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none cursor-pointer"
                  >
                    <option value="image">صورة</option>
                    <option value="video">فيديو</option>
                    <option value="link">رابط</option>
                  </select>
                </div>
                {newAnnouncementMediaUrl.startsWith("data:") && (
                  <div className="flex justify-between items-center text-[10px] text-emerald-600 font-bold px-1">
                    <span>تم إرفاق الصورة من جهازك بنجاح ✅</span>
                    <button
                      type="button"
                      onClick={() => setNewAnnouncementMediaUrl("")}
                      className="text-red-500 hover:underline cursor-pointer"
                    >
                      إلغاء المرفق
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    checked={newAnnouncementPriority === "normal"}
                    onChange={() => setNewAnnouncementPriority("normal")}
                    className="text-primary cursor-pointer"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    عادي
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    checked={newAnnouncementPriority === "high"}
                    onChange={() => setNewAnnouncementPriority("high")}
                    className="text-red-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    هام جداً
                  </span>
                </label>
              </div>

              <button
                type="button"
                onClick={handleSubmitAnnouncement}
                disabled={!newAnnouncementTitle.trim() || !newAnnouncementContent.trim()}
                className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg hover:bg-primary/90 transition cursor-pointer disabled:opacity-50"
              >
                نشر الإعلان
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
