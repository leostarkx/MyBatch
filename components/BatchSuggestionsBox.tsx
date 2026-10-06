import React, { useState, useMemo } from "react";
import {
  Inbox,
  Plus,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  ShieldCheck,
  EyeOff,
  User as UserIcon,
  Send,
  Trash2,
  Megaphone,
  CheckCircle2,
  Clock,
  HelpCircle,
  AlertTriangle,
  Sparkles,
  BookOpen,
  Search,
  X,
  Loader2,
  Crown,
} from "lucide-react";
import {
  User,
  UserRole,
  Course,
  BatchSuggestion,
  SuggestionCategory,
  SuggestionStatus,
  Announcement,
} from "../types";
import {
  saveBatchSuggestionToFirestore,
  deleteBatchSuggestionFromFirestore,
  saveAnnouncementToFirestore,
} from "../services/firebase";

interface BatchSuggestionsBoxProps {
  currentUser: User | null;
  courses: Course[];
  suggestions: BatchSuggestion[];
  effectiveBatchCode: string;
  isManager: boolean;
  onViewProfile?: (uid: string) => void;
}

const SUGGESTION_CATEGORIES: {
  id: SuggestionCategory;
  label: string;
  badgeClass: string;
  icon: React.ElementType;
}[] = [
  {
    id: "REQUEST",
    label: "طلب تأجيل / تنسيق 📅",
    badgeClass:
      "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/50",
    icon: Clock,
  },
  {
    id: "SUGGESTION",
    label: "مقترح للدفعة 💡",
    badgeClass:
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/50",
    icon: Sparkles,
  },
  {
    id: "ISSUE",
    label: "مشكلة في القاعة / المادة ⚠️",
    badgeClass:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/50",
    icon: AlertTriangle,
  },
  {
    id: "QUESTION",
    label: "استفسار للممثل ❓",
    badgeClass:
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/50",
    icon: HelpCircle,
  },
];

export const BatchSuggestionsBox: React.FC<BatchSuggestionsBoxProps> = ({
  currentUser,
  courses,
  suggestions,
  effectiveBatchCode,
  isManager,
  onViewProfile,
}) => {
  // Filters
  const [selectedCategory, setSelectedCategory] = useState<
    SuggestionCategory | "ALL"
  >("ALL");
  const [selectedStatus, setSelectedStatus] = useState<
    SuggestionStatus | "ALL"
  >("ALL");
  const [sortBy, setSortBy] = useState<"MOST_SUPPORTED" | "NEWEST">(
    "MOST_SUPPORTED"
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Create Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<SuggestionCategory>("REQUEST");
  const [newCourseId, setNewCourseId] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Representative Reply State
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [replyStatusDraft, setReplyStatusDraft] =
    useState<SuggestionStatus>("ANSWERED");
  const [isSavingReply, setIsSavingReply] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const handleOpenAddModal = () => {
    setNewTitle("");
    setNewContent("");
    setNewCategory("REQUEST");
    setNewCourseId("");
    setIsAnonymous(false);
    setIsAddModalOpen(true);
  };

  const handleCreateSuggestion = async () => {
    if (!currentUser || !effectiveBatchCode) return;
    if (!newTitle.trim() || !newContent.trim()) {
      alert("يرجى كتابة عنوان وتفاصيل المقترح أو الاستفسار.");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedCourse = courses.find((c) => c.id === newCourseId);
      const item: BatchSuggestion = {
        id: `sug_${Date.now()}`,
        batchCode: effectiveBatchCode,
        ...(selectedCourse
          ? { courseId: selectedCourse.id, courseName: selectedCourse.name }
          : {}),
        category: newCategory,
        title: newTitle.trim(),
        content: newContent.trim(),
        isAnonymous,
        authorUid: currentUser.uid,
        authorName: isAnonymous ? "طالب في الدفعة (مجهول)" : currentUser.name,
        ...(isAnonymous ? {} : { authorAvatar: currentUser.avatar }),
        upvotes: [currentUser.uid], // Author automatically supports their own suggestion
        downvotes: [],
        status: "OPEN",
        createdAt: Date.now(),
      };

      await saveBatchSuggestionToFirestore(item);
      setIsAddModalOpen(false);
    } catch (err) {
      console.error("Failed to create suggestion:", err);
      alert("حدث خطأ أثناء إرسال المقترح.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Vote handler: Agree (تأييد 👍) vs Disagree (معارضة 👎)
  const handleVote = async (
    sug: BatchSuggestion,
    voteType: "UP" | "DOWN"
  ) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const currentUp = sug.upvotes || [];
    const currentDown = sug.downvotes || [];

    let updatedUp = [...currentUp];
    let updatedDown = [...currentDown];

    if (voteType === "UP") {
      if (updatedUp.includes(uid)) {
        // Toggle off
        updatedUp = updatedUp.filter((id) => id !== uid);
      } else {
        updatedUp.push(uid);
        updatedDown = updatedDown.filter((id) => id !== uid);
      }
    } else {
      if (updatedDown.includes(uid)) {
        // Toggle off
        updatedDown = updatedDown.filter((id) => id !== uid);
      } else {
        updatedDown.push(uid);
        updatedUp = updatedUp.filter((id) => id !== uid);
      }
    }

    await saveBatchSuggestionToFirestore({
      ...sug,
      upvotes: updatedUp,
      downvotes: updatedDown,
    });
  };

  // Representative Reply Handler
  const handleOpenReplyBox = (sug: BatchSuggestion) => {
    setReplyingToId(sug.id);
    setReplyDraft(sug.repReply || "");
    setReplyStatusDraft(
      sug.status === "OPEN" ? "ANSWERED" : sug.status
    );
  };

  const handleSaveRepReply = async (sug: BatchSuggestion) => {
    if (!currentUser) return;
    setIsSavingReply(true);
    try {
      await saveBatchSuggestionToFirestore({
        ...sug,
        status: replyStatusDraft,
        ...(replyDraft.trim()
          ? {
              repReply: replyDraft.trim(),
              repReplyBy: currentUser.name,
              repReplyAt: Date.now(),
            }
          : {}),
      });
      setReplyingToId(null);
    } catch (err) {
      console.error("Error saving rep reply:", err);
    } finally {
      setIsSavingReply(false);
    }
  };

  // Convert suggestion + its voting results into a public Announcement on Home
  const handleConvertToAnnouncement = async (sug: BatchSuggestion) => {
    if (!currentUser || !isManager || !effectiveBatchCode) return;
    const upCount = sug.upvotes?.length || 0;
    const downCount = sug.downvotes?.length || 0;
    const totalVotes = upCount + downCount;
    const upPct = totalVotes > 0 ? Math.round((upCount / totalVotes) * 100) : 100;

    setConvertingId(sug.id);
    try {
      const annContent = `بناءً على مقترح طلاب الدفعة في (صندوق الدفعة):\n«${sug.title}»\n${sug.content}\n\n📊 نتيجة تصويت الطلاب: ${upCount} مؤيد (${upPct}%) مقابل ${downCount} معارض.${
        sug.repReply ? `\n\n✅ قرار/رد الممثل:\n${sug.repReply}` : ""
      }`;

      const newAnn: Announcement = {
        id: `ann_${Date.now()}`,
        batchCode: effectiveBatchCode,
        title: `📢 تبليغ بخصوص مقترح: ${sug.title}`,
        content: annContent,
        timestamp: Date.now(),
        authorId: currentUser.uid,
        authorName: currentUser.name,
        priority: "high",
        isPinned: false,
        ...(sug.courseId
          ? { courseId: sug.courseId, courseName: sug.courseName }
          : {}),
        attachments: [],
      };

      await saveAnnouncementToFirestore(newAnn);
      await saveBatchSuggestionToFirestore({
        ...sug,
        status: "CONVERTED",
      });
      alert("تم تحويل المقترح ونتيجة التصويت إلى تبليغ رسمي في الصفحة الرئيسية بنجاح! 📢");
    } catch (err) {
      console.error("Failed to convert suggestion to announcement:", err);
    } finally {
      setConvertingId(null);
    }
  };

  const handleDeleteSuggestion = async (sug: BatchSuggestion) => {
    const canDelete = isManager || sug.authorUid === currentUser?.uid;
    if (!canDelete) return;
    if (!confirm("هل أنت متأكد من حذف هذا المقترح؟")) return;
    await deleteBatchSuggestionFromFirestore(sug.id);
  };

  const filteredSuggestions = useMemo(() => {
    return suggestions
      .filter((s) => {
        if (selectedCategory !== "ALL" && s.category !== selectedCategory)
          return false;
        if (selectedStatus !== "ALL" && s.status !== selectedStatus)
          return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = s.title.toLowerCase().includes(q);
          const matchContent = s.content.toLowerCase().includes(q);
          const matchCourse = s.courseName?.toLowerCase().includes(q);
          const matchReply = s.repReply?.toLowerCase().includes(q);
          if (!matchTitle && !matchContent && !matchCourse && !matchReply)
            return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "MOST_SUPPORTED") {
          const aNet = (a.upvotes?.length || 0) - (a.downvotes?.length || 0);
          const bNet = (b.upvotes?.length || 0) - (b.downvotes?.length || 0);
          if (bNet !== aNet) return bNet - aNet;
          const aTotal = (a.upvotes?.length || 0) + (a.downvotes?.length || 0);
          const bTotal = (b.upvotes?.length || 0) + (b.downvotes?.length || 0);
          if (bTotal !== aTotal) return bTotal - aTotal;
        }
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
  }, [suggestions, selectedCategory, selectedStatus, sortBy, searchQuery]);

  const getStatusBadge = (status: SuggestionStatus) => {
    switch (status) {
      case "OPEN":
        return {
          label: "مفتوح للتصويت 🗳️",
          className:
            "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/50",
        };
      case "ANSWERED":
        return {
          label: "تم الرد من الممثل 💬",
          className:
            "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/50",
        };
      case "APPROVED":
        return {
          label: "تمت الموافقة والتنفيذ ✅",
          className:
            "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/50",
        };
      case "CONVERTED":
        return {
          label: "تحوّل لتبليغ عام 📢",
          className:
            "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/50",
        };
    }
  };

  return (
    <div className="space-y-6 p-4 pb-24 animate-in fade-in duration-300">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -top-16 -left-16 w-52 h-52 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-60 h-60 rounded-full bg-black/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-black border border-white/25">
              <Inbox size={14} />
              <span>صوت الطالب مسموع • بإمكانك الإرسال باسمك أو بدون اسم 🕶️</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black">
              صندوق استفسارات ومقترحات الدفعة 📬💬
            </h1>
            <p className="text-white/90 text-xs md:text-sm max-w-xl leading-relaxed">
              عندك مقترح لتأجيل كويز؟ مشكلة بالقاعة؟ أو استفسار للممثل؟ اطرحه هنا
              باسمك أو كمجهول الهوية بدون إحراج، ليصوّت عليه زملاؤك (مع 👍 أو ضد
              👎) ويرد عليه الممثل رسمياً!
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="bg-white text-emerald-700 hover:bg-emerald-50 px-5 py-3.5 rounded-2xl font-black text-xs sm:text-sm shadow-xl transition flex items-center justify-center gap-2 shrink-0 active:scale-95"
          >
            <Plus size={18} />
            <span>إضافة مقترح أو استفسار جديد ✨</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 space-y-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition whitespace-nowrap shrink-0 ${
              selectedCategory === "ALL"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                : "bg-gray-100 dark:bg-slate-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
            }`}
          >
            الكل ({suggestions.length})
          </button>

          {SUGGESTION_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-emerald-600 text-white shadow-sm"
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
              size={15}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في المقترحات، الطلبات، أو ردود الممثل..."
              className="w-full bg-gray-50 dark:bg-slate-700/60 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl pr-10 pl-4 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-700/60 p-1 rounded-2xl self-start sm:self-auto shrink-0">
            <button
              onClick={() => setSortBy("MOST_SUPPORTED")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                sortBy === "MOST_SUPPORTED"
                  ? "bg-white dark:bg-slate-800 text-emerald-600 shadow-sm"
                  : "text-gray-500 dark:text-gray-300"
              }`}
            >
              الأعلى تأييداً 👍
            </button>
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
          </div>
        </div>
      </div>

      {/* Suggestions Cards List */}
      {filteredSuggestions.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-dashed border-gray-200 dark:border-slate-700 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto">
            <Inbox size={32} />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="font-black text-base text-gray-800 dark:text-white">
              صندوق مقترحات واستفسارات الدفعة فارغ حالياً
            </h3>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              اطرح أول مقترح أو طلب (باسمك أو بدون اسم)، وشاهد كم طالباً يؤيدك
              في الفكرة!
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 transition inline-flex items-center gap-2"
          >
            <Plus size={16} />
            <span>طرح مقترح أو استفسار الآن</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSuggestions.map((sug) => {
            const catMeta =
              SUGGESTION_CATEGORIES.find((c) => c.id === sug.category) ||
              SUGGESTION_CATEGORIES[0];
            const CatIcon = catMeta.icon;
            const statusMeta = getStatusBadge(sug.status);

            const upCount = sug.upvotes?.length || 0;
            const downCount = sug.downvotes?.length || 0;
            const totalVotes = upCount + downCount;
            const supportPct =
              totalVotes > 0 ? Math.round((upCount / totalVotes) * 100) : 0;
            const opposePct = totalVotes > 0 ? 100 - supportPct : 0;

            const hasUpvoted =
              !!currentUser && (sug.upvotes || []).includes(currentUser.uid);
            const hasDownvoted =
              !!currentUser && (sug.downvotes || []).includes(currentUser.uid);
            const canDelete =
              isManager || sug.authorUid === currentUser?.uid;

            const formattedDate = new Date(sug.createdAt).toLocaleDateString(
              "ar-IQ",
              {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }
            );

            return (
              <div
                key={sug.id}
                className="bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition space-y-4"
              >
                {/* Top Header: Category, Course, Status & Delete */}
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-black border flex items-center gap-1 ${catMeta.badgeClass}`}
                    >
                      <CatIcon size={12} />
                      <span>{catMeta.label}</span>
                    </span>

                    {sug.courseName && (
                      <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-primary/10 text-primary">
                        📚 {sug.courseName}
                      </span>
                    )}

                    <span
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-black border ${statusMeta.className}`}
                    >
                      {statusMeta.label}
                    </span>
                  </div>

                  {canDelete && (
                    <button
                      onClick={() => handleDeleteSuggestion(sug)}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition"
                      title="حذف المقترح"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {/* Title & Content */}
                <div>
                  <h3 className="font-black text-base sm:text-lg text-gray-900 dark:text-white mb-1.5">
                    {sug.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {sug.content}
                  </p>
                </div>

                {/* Interactive Support / Oppose Voting Box (شريط التأييد والمعارضة) */}
                <div className="p-4 rounded-2xl bg-gray-50/90 dark:bg-slate-700/40 border border-gray-100 dark:border-slate-700 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs">
                      <span className="font-black text-gray-800 dark:text-white block">
                        رأيك بهذا المقترح أو الطلب ({totalVotes} مصوّت):
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">
                        صوّت بـ «أؤيد 👍» إذا كنت مع المقترح أو «ضد 👎» ليظهر
                        رأي الأغلبية للممثل
                      </span>
                    </div>

                    {/* Vote Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleVote(sug, "UP")}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 active:scale-95 ${
                          hasUpvoted
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                            : "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-50"
                        }`}
                      >
                        <ThumbsUp size={15} />
                        <span>أؤيد الفكرة ({upCount})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleVote(sug, "DOWN")}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 active:scale-95 ${
                          hasDownvoted
                            ? "bg-rose-600 text-white shadow-md shadow-rose-600/25"
                            : "bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-50"
                        }`}
                      >
                        <ThumbsDown size={15} />
                        <span>ضد الفكرة ({downCount})</span>
                      </button>
                    </div>
                  </div>

                  {/* Visual Support Ratio Progress Bar */}
                  {totalVotes > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-black">
                        <span className="text-emerald-600 dark:text-emerald-400">
                          👍 مؤيدون: {supportPct}% ({upCount} طالب)
                        </span>
                        <span className="text-rose-600 dark:text-rose-400">
                          👎 معارضون: {opposePct}% ({downCount} طالب)
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-rose-200 dark:bg-rose-950/60 overflow-hidden flex">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${supportPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Official Representative Reply Box (if answered) */}
                {sug.repReply && (
                  <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                        <Crown size={14} className="text-indigo-600" />
                        <span>رد الممثل الرسمي ({sug.repReplyBy || "الممثل"}):</span>
                      </span>
                      {sug.repReplyAt && (
                        <span className="text-[10px] text-indigo-400">
                          {new Date(sug.repReplyAt).toLocaleDateString("ar-IQ", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-indigo-950 dark:text-indigo-100 whitespace-pre-wrap leading-relaxed">
                      {sug.repReply}
                    </p>
                  </div>
                )}

                {/* Representative Reply Input Form (when open) */}
                {isManager && replyingToId === sug.id && (
                  <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-slate-700/60 border border-blue-200 dark:border-slate-600 space-y-3 animate-in fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-black text-gray-800 dark:text-white">
                        كتابة رد الممثل وتحديث حالة المقترح:
                      </span>
                      <select
                        value={replyStatusDraft}
                        onChange={(e) =>
                          setReplyStatusDraft(
                            e.target.value as SuggestionStatus
                          )
                        }
                        className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-800 dark:text-white outline-none"
                      >
                        <option value="ANSWERED">تم الرد من الممثل 💬</option>
                        <option value="APPROVED">
                          تمت الموافقة والتنفيذ ✅
                        </option>
                        <option value="OPEN">مفتوح للتصويت 🗳️</option>
                      </select>
                    </div>

                    <textarea
                      value={replyDraft}
                      onChange={(e) => setReplyDraft(e.target.value)}
                      placeholder="اكتب ردك أو توضيحك للطلاب هنا..."
                      className="w-full bg-white dark:bg-slate-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl p-3 text-xs outline-none min-h-[80px]"
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setReplyingToId(null)}
                        className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-200 text-xs font-bold"
                      >
                        إلغاء
                      </button>
                      <button
                        type="button"
                        disabled={isSavingReply}
                        onClick={() => handleSaveRepReply(sug)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-1.5"
                      >
                        {isSavingReply ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Send size={14} />
                        )}
                        <span>حفظ الرد والحالة</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Card Footer: Author Identity (or Anonymous) + Representative Controls */}
                <div className="pt-3 border-t border-gray-100 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Author / Anonymous Info */}
                  <div className="flex items-center gap-2.5">
                    {sug.isAnonymous ? (
                      <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0">
                        <EyeOff size={16} />
                      </div>
                    ) : (
                      <img
                        onClick={() => onViewProfile?.(sug.authorUid)}
                        src={
                          sug.authorAvatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(sug.authorName)}`
                        }
                        alt={sug.authorName}
                        className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-slate-600 cursor-pointer shrink-0"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          onClick={() =>
                            !sug.isAnonymous && onViewProfile?.(sug.authorUid)
                          }
                          className={`text-xs font-bold ${
                            sug.isAnonymous
                              ? "text-gray-600 dark:text-gray-300"
                              : "text-gray-800 dark:text-white cursor-pointer hover:text-primary"
                          }`}
                        >
                          {sug.isAnonymous
                            ? "طالب في الدفعة (مجهول الهوية 🕶️)"
                            : sug.authorName}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 block">
                        نُشر في {formattedDate}
                      </span>
                    </div>
                  </div>

                  {/* Manager Action Buttons: Reply & Convert to Public Announcement */}
                  {isManager && (
                    <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleOpenReplyBox(sug)}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <MessageSquare size={14} />
                        <span>{sug.repReply ? "تعديل الرد" : "الرد كممثل"}</span>
                      </button>

                      <button
                        type="button"
                        disabled={convertingId === sug.id}
                        onClick={() => handleConvertToAnnouncement(sug)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 text-xs font-bold transition flex items-center gap-1.5"
                        title="تحويل هذا المقترح مع نتيجة التصويت إلى تبليغ عام في الصفحة الرئيسية"
                      >
                        {convertingId === sug.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Megaphone size={14} />
                        )}
                        <span>تحويل لتبليغ عام 📢</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Suggestion / Question */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Inbox size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base md:text-lg text-gray-800 dark:text-white">
                    إرسال مقترح أو استفسار لصندوق الدفعة 📬
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    سيتمكن طلاب الدفعة من التأييد (👍) أو المعارضة (👎) ويرد الممثل عليه
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
              {/* Anonymous Toggle Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isAnonymous
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                    }`}
                  >
                    {isAnonymous ? <EyeOff size={18} /> : <UserIcon size={18} />}
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-800 dark:text-white">
                      {isAnonymous
                        ? "الإرسال بدون اسم (مجهول الهوية 🕶️)"
                        : `الإرسال باسمك (${currentUser?.name})`}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {isAnonymous
                        ? "لن يظهر اسمك أو صورتك لأي شخص (حتى لا تنحرج)"
                        : "سيظهر اسمك وصورتك بجانب المقترح"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition shrink-0 ${
                    isAnonymous
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-200"
                  }`}
                >
                  {isAnonymous ? "مجهول الهوية ✓" : "إخفاء اسمي 🕶️"}
                </button>
              </div>

              {/* Category & Optional Course */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                    نوع المشاركة *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) =>
                      setNewCategory(e.target.value as SuggestionCategory)
                    }
                    className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-3.5 py-2.5 text-xs font-bold outline-none"
                  >
                    {SUGGESTION_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                    المادة المعنية (اختياري)
                  </label>
                  <select
                    value={newCourseId}
                    onChange={(e) => setNewCourseId(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-3.5 py-2.5 text-xs font-bold outline-none"
                  >
                    <option value="">عام لجميع الدفعة</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                  عنوان المقترح أو الطلب *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: نحتاج تأجيل كويز مادة البرمجة إلى الأسبوع القادم..."
                  className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-2.5 text-xs font-bold outline-none"
                />
              </div>

              {/* Details */}
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                  التفاصيل أو السبب *
                </label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="اشرح تفاصيل مقترحك أو المشكلة ليتمكن زملاؤك من التصويت عليها..."
                  className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-xs outline-none min-h-[110px]"
                />
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
                disabled={isSubmitting}
                onClick={handleCreateSuggestion}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 disabled:opacity-50 transition active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>جاري النشر...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>طرح المقترح للتصويت</span>
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
