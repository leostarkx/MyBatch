import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Plus,
  Search,
  MessageSquare,
  ThumbsUp,
  CheckCircle,
  Award,
  BookOpen,
  X,
  Send,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Trash2,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { AcademicQuestion, AcademicAnswer, Course, User, UserRole } from '../types';
import {
  getAcademicQuestions,
  saveAcademicQuestion,
  deleteAcademicQuestion,
  toggleUpvoteQuestion,
  getAcademicAnswers,
  saveAcademicAnswer,
  toggleUpvoteAnswer,
  markAnswerAsAccepted,
} from '../services/academicQAService';

interface AcademicQAHubProps {
  batchCode: string;
  courses: Course[];
  currentUser: User;
  allUsers?: User[];
}

export const AcademicQAHub: React.FC<AcademicQAHubProps> = ({
  batchCode,
  courses,
  currentUser,
  allUsers = [],
}) => {
  const [questions, setQuestions] = useState<AcademicQuestion[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SOLVED' | 'UNSOLVED'>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Ask Question Modal
  const [isAskModalOpen, setIsAskModalOpen] = useState<boolean>(false);
  const [newCourseId, setNewCourseId] = useState<string>(courses[0]?.id || '');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');
  const [newTags, setNewTags] = useState<string>('');
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Active expanded question
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, AcademicAnswer[]>>({});
  const [loadingAnswers, setLoadingAnswers] = useState<Record<string, boolean>>({});
  const [newAnswerText, setNewAnswerText] = useState<string>('');
  const [submittingAnswer, setSubmittingAnswer] = useState<boolean>(false);

  // Success toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load questions
  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      const items = await getAcademicQuestions(batchCode, selectedCourseId);
      setQuestions(items);
    } catch {
      // Handled in service
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [batchCode, selectedCourseId]);

  // Load answers for a question
  const handleToggleExpand = async (qId: string) => {
    if (expandedQuestionId === qId) {
      setExpandedQuestionId(null);
      return;
    }
    setExpandedQuestionId(qId);
    if (!questionAnswers[qId]) {
      setLoadingAnswers((prev) => ({ ...prev, [qId]: true }));
      try {
        const answers = await getAcademicAnswers(qId);
        setQuestionAnswers((prev) => ({ ...prev, [qId]: answers }));
      } finally {
        setLoadingAnswers((prev) => ({ ...prev, [qId]: false }));
      }
    }
  };

  // Submit new question
  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const courseObj = courses.find((c) => c.id === newCourseId) || courses[0];
    const parsedTags = newTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newQuestion: AcademicQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      batchCode,
      courseId: courseObj ? courseObj.id : 'GENERAL',
      courseName: courseObj ? courseObj.name : 'استفسار عام',
      authorUid: currentUser.uid,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      title: newTitle.trim(),
      content: newContent.trim(),
      tags: parsedTags,
      imageUrl: newImageUrl.trim() || undefined,
      answersCount: 0,
      upvotes: [],
      createdAt: Date.now(),
    };

    setIsSubmitting(true);
    try {
      await saveAcademicQuestion(newQuestion, true);
      setQuestions((prev) => [newQuestion, ...prev]);
      setIsAskModalOpen(false);
      setNewTitle('');
      setNewContent('');
      setNewTags('');
      setNewImageUrl('');
      showToast('تم نشر سؤالك بنجاح! وحصلت على +5 نقاط تفاعلية 🌟');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Upvote question
  const handleUpvoteQuestion = async (q: AcademicQuestion) => {
    try {
      const res = await toggleUpvoteQuestion(q, currentUser.uid);
      setQuestions((prev) =>
        prev.map((item) =>
          item.id === q.id
            ? {
                ...item,
                upvotes: res.isUpvoted
                  ? [...item.upvotes, currentUser.uid]
                  : item.upvotes.filter((uid) => uid !== currentUser.uid),
              }
            : item
        )
      );
      if (res.isUpvoted) {
        showToast('تم تسجيل تصويتك الإيجابي ودعم زميلك 👍');
      }
    } catch {
      // Ignored
    }
  };

  // Submit answer
  const handleSubmitAnswer = async (q: AcademicQuestion) => {
    if (!newAnswerText.trim()) return;

    const newAnswer: AcademicAnswer = {
      id: `ans_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      questionId: q.id,
      batchCode,
      authorUid: currentUser.uid,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      content: newAnswerText.trim(),
      isAccepted: false,
      upvotes: [],
      createdAt: Date.now(),
    };

    setSubmittingAnswer(true);
    try {
      await saveAcademicAnswer(newAnswer, q, true);
      setQuestionAnswers((prev) => ({
        ...prev,
        [q.id]: [...(prev[q.id] || []), newAnswer],
      }));
      setQuestions((prev) =>
        prev.map((item) =>
          item.id === q.id ? { ...item, answersCount: (item.answersCount || 0) + 1 } : item
        )
      );
      setNewAnswerText('');
      showToast('شكراً لمساعدتك! حصلت على +10 نقاط تفاعلية لدعمك زملاءك 💡');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Mark answer as accepted
  const handleAcceptAnswer = async (q: AcademicQuestion, a: AcademicAnswer) => {
    try {
      await markAnswerAsAccepted(q, a);
      setQuestions((prev) =>
        prev.map((item) =>
          item.id === q.id ? { ...item, acceptedAnswerId: a.id } : item
        )
      );
      setQuestionAnswers((prev) => ({
        ...prev,
        [q.id]: (prev[q.id] || []).map((ans) =>
          ans.id === a.id ? { ...ans, isAccepted: true } : { ...ans, isAccepted: false }
        ),
      }));
      showToast('تم اعتماد الإجابة كحل نموذجي! وحصل المجيب على +25 نقطة 🎉');
    } catch {
      // Ignored
    }
  };

  // Toggle upvote on answer
  const handleUpvoteAnswer = async (q: AcademicQuestion, a: AcademicAnswer) => {
    try {
      const res = await toggleUpvoteAnswer(a, q, currentUser.uid);
      setQuestionAnswers((prev) => ({
        ...prev,
        [q.id]: (prev[q.id] || []).map((ans) =>
          ans.id === a.id
            ? {
                ...ans,
                upvotes: res.isUpvoted
                  ? [...ans.upvotes, currentUser.uid]
                  : ans.upvotes.filter((uid) => uid !== currentUser.uid),
              }
            : ans
        ),
      }));
    } catch {
      // Ignored
    }
  };

  // Delete question
  const handleDeleteQuestion = async (qId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;
    try {
      await deleteAcademicQuestion(qId, batchCode);
      setQuestions((prev) => prev.filter((q) => q.id !== qId));
      showToast('تم حذف السؤال بنجاح');
    } catch {
      // Ignored
    }
  };

  // Filter questions
  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.tags && q.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    if (!matchesSearch) return false;

    if (statusFilter === 'SOLVED') return Boolean(q.acceptedAnswerId);
    if (statusFilter === 'UNSOLVED') return !q.acceptedAnswerId;
    return true;
  });

  // Top helpful students (Leaderboard by academicPoints)
  const topStudents = [...allUsers]
    .filter((u) => (u.academicPoints || 0) > 0)
    .sort((a, b) => (b.academicPoints || 0) - (a.academicPoints || 0))
    .slice(0, 4);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 left-5 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-xs sm:text-sm font-medium rounded-2xl shadow-xl border border-slate-700 animate-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-5 sm:p-6 bg-gradient-to-l from-indigo-50/80 via-white to-indigo-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 border border-indigo-100 dark:border-indigo-950/60 rounded-3xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <BookOpen size={16} />
              <span>مجتمع النقاش الأكاديمي للدفعة</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              بنك الأسئلة والاستفسارات الأكاديمية
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              اطرح أسئلتك وصعوباتك في أي مادة، ساعد زملاءك بالإجابات الصحيحة، واكسب نقاط التفاعل
              لتكريم الطلاب الأكثر مساعدة في الدفعة! 🎓
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* User points pill */}
            <div className="flex items-center gap-2 px-3.5 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 rounded-2xl text-xs font-bold">
              <Award className="w-4 h-4 text-amber-500" />
              <span>نقاطك الأكاديمية: {currentUser.academicPoints || 0}</span>
            </div>

            <button
              type="button"
              onClick={() => setIsAskModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Plus size={16} />
              <span>اطرح سؤالاً للمادة</span>
            </button>
          </div>
        </div>

        {/* Top Contributors Mini-Strip */}
        {topStudents.length > 0 && (
          <div className="mt-4 pt-4 border-t border-indigo-100/80 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs">
            <span className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Award size={14} className="text-amber-500" />
              <span>أبرز الطلاب المجيبين:</span>
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {topStudents.map((stud, idx) => (
                <div
                  key={stud.uid}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium"
                >
                  <span className="text-[10px] text-amber-500 font-bold">#{idx + 1}</span>
                  <span className="truncate max-w-[100px]">{stud.name}</span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                    {stud.academicPoints}ن
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

        {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في الأسئلة، الكلمات المفتاحية، أو المواد..."
            className="w-full pr-10 pl-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
          />
        </div>

        {/* Course Filter Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="ALL">جميع المواد الدراسية</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>

          {/* Status Filter Segment */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-medium">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl transition ${
                statusFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              الكل ({questions.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('SOLVED')}
              className={`px-3 py-1.5 rounded-xl transition ${
                statusFilter === 'SOLVED'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              محلول ✅
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('UNSOLVED')}
              className={`px-3 py-1.5 rounded-xl transition ${
                statusFilter === 'UNSOLVED'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              بانتظار إجابة
            </button>
          </div>
        </div>
      </div>

      {/* Questions List */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500">
          جارٍ تحميل أسئلة واستفسارات المواد...
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <HelpCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">
            لا توجد أسئلة مطروحة في هذا القسم حالياً
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            كن أول من يطرح سؤالاً أو استفساراً دراسياً في مادتك واكسب +5 نقاط تفاعلية!
          </p>
          <button
            type="button"
            onClick={() => setIsAskModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition"
          >
            طرح سؤال جديد الآن
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q) => {
            const isAuthor = q.authorUid === currentUser.uid;
            const isRep =
              currentUser.role === UserRole.REPRESENTATIVE ||
              currentUser.role === UserRole.OWNER;
            const hasUpvoted = q.upvotes.includes(currentUser.uid);
            const isExpanded = expandedQuestionId === q.id;
            const answers = questionAnswers[q.id] || [];

            return (
              <div
                key={q.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs transition hover:shadow-sm"
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        q.authorAvatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          q.authorName
                        )}&background=random`
                      }
                      alt={q.authorName}
                      className="w-9 h-9 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {q.authorName}
                        </span>
                        <span className="text-[11px] text-slate-400">·</span>
                        <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                          {q.courseName}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(q.createdAt).toLocaleDateString('ar-IQ')} ·{' '}
                        {new Date(q.createdAt).toLocaleTimeString('ar-IQ', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Solved Status & Delete */}
                  <div className="flex items-center gap-2">
                    {q.acceptedAnswerId ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-xl">
                        <CheckCircle size={13} />
                        <span>محلول ومعتمد</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 px-2.5 py-1 rounded-xl">
                        بانتظار إجابة
                      </span>
                    )}

                    {(isAuthor || isRep) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition"
                        title="حذف السؤال"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Question Body */}
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1.5">
                  {q.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap mb-3">
                  {q.content}
                </p>

                {/* Optional Image */}
                {q.imageUrl && (
                  <div className="mb-3 max-w-md overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                    <img
                      src={q.imageUrl}
                      alt={q.title}
                      className="w-full max-h-72 object-contain bg-slate-50 dark:bg-slate-950"
                    />
                  </div>
                )}

                {/* Tags */}
                {q.tags && q.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {q.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer Controls: Upvote & Toggle Answers */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-2">
                    {/* Upvote Question */}
                    <button
                      type="button"
                      onClick={() => handleUpvoteQuestion(q)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                        hasUpvoted
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <ThumbsUp size={13} className={hasUpvoted ? 'fill-indigo-600' : ''} />
                      <span>{q.upvotes.length}</span>
                    </button>

                    {/* Answers count toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleExpand(q.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                    >
                      <MessageSquare size={14} />
                      <span>{q.answersCount || 0} إجابة</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleExpand(q.id)}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    {isExpanded ? 'إخفاء الردود' : 'تقديم إجابة (+10 نقاط) ➔'}
                  </button>
                </div>

                {/* Expanded Answers Section */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-4 animate-in fade-in duration-200">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      إجابات ومناقشات الطلاب ({answers.length}):
                    </h4>

                    {loadingAnswers[q.id] ? (
                      <div className="text-xs text-slate-400 p-4 text-center">
                        جارٍ تحميل الإجابات...
                      </div>
                    ) : answers.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                        لا توجد إجابات بعد. كن أول من يساعد زميلك بإجابة واضحة واكسب +10 نقاط! 🌟
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {answers.map((ans) => {
                          const ansAuthor = ans.authorUid === currentUser.uid;
                          const ansHasUpvoted = ans.upvotes.includes(currentUser.uid);

                          return (
                            <div
                              key={ans.id}
                              className={`p-4 rounded-2xl border transition ${
                                ans.isAccepted
                                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700 shadow-xs'
                                  : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2">
                                  <img
                                    src={
                                      ans.authorAvatar ||
                                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                        ans.authorName
                                      )}&background=random`
                                    }
                                    alt={ans.authorName}
                                    className="w-7 h-7 rounded-lg object-cover"
                                  />
                                  <div>
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                      {ans.authorName}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block">
                                      {new Date(ans.createdAt).toLocaleDateString('ar-IQ')}
                                    </span>
                                  </div>
                                </div>

                                {ans.isAccepted && (
                                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-lg">
                                    <Check size={12} />
                                    <span>الإجابة النموذجية المعتمدة (+25ن)</span>
                                  </span>
                                )}
                              </div>

                              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed mb-3">
                                {ans.content}
                              </p>

                              {/* Answer Actions */}
                              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                                <button
                                  type="button"
                                  onClick={() => handleUpvoteAnswer(q, ans)}
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition ${
                                    ansHasUpvoted
                                      ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200'
                                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white'
                                  }`}
                                >
                                  <ThumbsUp size={12} />
                                  <span>{ans.upvotes.length}</span>
                                </button>

                                {/* Mark as Accepted (Visible to question author or rep if not accepted yet) */}
                                {(isAuthor || isRep) && !q.acceptedAnswerId && !ans.isAccepted && (
                                  <button
                                    type="button"
                                    onClick={() => handleAcceptAnswer(q, ans)}
                                    className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition"
                                  >
                                    <CheckCircle size={13} />
                                    <span>اعتماد كحل نموذجي (+25ن)</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add Answer Box */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-start gap-2.5">
                        <textarea
                          rows={2}
                          value={newAnswerText}
                          onChange={(e) => setNewAnswerText(e.target.value)}
                          placeholder="اكتب إجابتك أو شرحك التفصيلي هنا لمساعدة زميلك..."
                          className="flex-1 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <button
                          type="button"
                          onClick={() => handleSubmitAnswer(q)}
                          disabled={submittingAnswer || !newAnswerText.trim()}
                          className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl flex items-center gap-1.5 disabled:opacity-40 transition cursor-pointer shrink-0"
                        >
                          <Send size={14} />
                          <span>إرسال (+10ن)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Ask Question Modal */}
      {isAskModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
          dir="rtl"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
                <HelpCircle size={20} />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  طرح سؤال دراسي جديد
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAskModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="space-y-4">
              {/* Select Course */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  المادة الدراسية المعنية بالسؤال:
                </label>
                <select
                  value={newCourseId}
                  onChange={(e) => setNewCourseId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان السؤال باختصار:
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: ما الفرق بين Stack و Queue في هياكل البيانات؟"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تفاصيل السؤال أو النقطة غير المفهومة:
                </label>
                <textarea
                  rows={4}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="اشرح المشكلة أو اكتب الكود أو مسألة الامتحان التي تحتاج مساعدة فيها..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Optional Image URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <ImageIcon size={13} />
                  <span>رابط صورة توضيحية أو مخطط (اختياري):</span>
                </label>
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  كلمات مفتاحية (مفصولة بفاصلة):
                </label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="كويز، واجب، شابتر 2، نظري"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              {/* Points incentive notice */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500 shrink-0" />
                <span>
                  ستحصل على <strong>+5 نقاط تفاعلية</strong> في رصيدك الأكاديمي بمجرد نشر السؤال!
                </span>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAskModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim() || !newContent.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-40 transition cursor-pointer"
                >
                  {isSubmitting ? 'جارٍ النشر...' : 'نشر السؤال للمادة (+5ن)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
