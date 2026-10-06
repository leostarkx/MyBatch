import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  BookOpen,
  Award,
  Layers,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  MapPin,
  FileText,
  X,
  Sparkles,
  Flame,
  Check,
} from 'lucide-react';
import { Assignment, CourseProject, Exam, User, Tab, Course } from '../types';

interface LiveCountdownStripProps {
  assignments: Assignment[];
  projects: CourseProject[];
  exams: Exam[];
  courses: Course[];
  currentUser: User | null;
  isManager: boolean;
  onNavigateTab: (tab: Tab) => void;
  onSaveExam: (exam: Exam) => Promise<void>;
  onDeleteExam?: (id: string) => Promise<void>;
  onToggleCompleteAssignment?: (assignmentId: string) => Promise<void>;
}

export interface DeadlineItem {
  id: string;
  sourceType: 'ASSIGNMENT' | 'EXAM' | 'PROJECT';
  title: string;
  courseName: string;
  timestamp: number;
  dateStr: string;
  isCompleted?: boolean;
  hall?: string;
  topics?: string;
  examType?: string;
  originalItem: Assignment | Exam | CourseProject;
}

export const LiveCountdownStrip: React.FC<LiveCountdownStripProps> = ({
  assignments,
  projects,
  exams,
  courses,
  currentUser,
  isManager,
  onNavigateTab,
  onSaveExam,
  onDeleteExam,
  onToggleCompleteAssignment,
}) => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [filterType, setFilterType] = useState<'ALL' | 'ASSIGNMENT' | 'EXAM' | 'PROJECT'>('ALL');
  const [selectedExamDetails, setSelectedExamDetails] = useState<Exam | null>(null);
  const [isAddExamModalOpen, setIsAddExamModalOpen] = useState(false);

  // New Exam Form State
  const [examCourseId, setExamCourseId] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [examType, setExamType] = useState<'QUIZ' | 'MIDTERM' | 'FINAL' | 'PRACTICAL'>('QUIZ');
  const [examDateTime, setExamDateTime] = useState('');
  const [examHall, setExamHall] = useState('');
  const [examTopics, setExamTopics] = useState('');
  const [isSavingExam, setIsSavingExam] = useState(false);

  // Real-time tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Aggregate all items into unified deadlines
  const allDeadlines: DeadlineItem[] = [];

  // 1. Assignments
  assignments.forEach((a) => {
    const isCompleted = a.completedBy?.includes(currentUser?.uid || '');
    allDeadlines.push({
      id: `assign_${a.id}`,
      sourceType: 'ASSIGNMENT',
      title: a.title,
      courseName: a.courseName || 'مادة دراسية',
      timestamp: a.dueTimestamp,
      dateStr: a.dueDate,
      isCompleted,
      originalItem: a,
    });
  });

  // 2. Exams
  exams.forEach((e) => {
    allDeadlines.push({
      id: `exam_${e.id}`,
      sourceType: 'EXAM',
      title: e.title,
      courseName: e.courseName || 'مادة دراسية',
      timestamp: e.examTimestamp,
      dateStr: e.examDate,
      hall: e.hall,
      topics: e.topics,
      examType: e.type,
      originalItem: e,
    });
  });

  // 3. Projects
  projects.forEach((p) => {
    if (p.deadline) {
      const pTimestamp = new Date(p.deadline).getTime();
      if (!isNaN(pTimestamp)) {
        allDeadlines.push({
          id: `project_${p.id}`,
          sourceType: 'PROJECT',
          title: p.title,
          courseName: p.courseName || 'مشروع فصلي',
          timestamp: pTimestamp,
          dateStr: p.deadline,
          originalItem: p,
        });
      }
    }
  });

  // Filter deadlines
  const filtered = allDeadlines
    .filter((d) => {
      if (filterType !== 'ALL' && d.sourceType !== filterType) return false;
      // Show upcoming, or recently expired within the last 12 hours
      const diff = d.timestamp - currentTime;
      return diff > -12 * 60 * 60 * 1000;
    })
    .sort((a, b) => a.timestamp - b.timestamp);

  // Helper for countdown formatting
  const getRemainingTime = (targetTimestamp: number) => {
    const diff = targetTimestamp - currentTime;

    if (diff <= 0) {
      return { isOverdue: true, days: 0, hours: 0, minutes: 0, seconds: 0, text: 'انتهى الموعد' };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return { isOverdue: false, days, hours, minutes, seconds };
  };

  const handleCreateExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim() || !examDateTime || !examCourseId) {
      alert('يرجى ملء اسم الامتحان والمادة والتاريخ والوقت المحدد.');
      return;
    }

    const selectedCourse = courses.find((c) => c.id === examCourseId);
    const parsedTimestamp = new Date(examDateTime).getTime();
    if (isNaN(parsedTimestamp)) {
      alert('صيغة التاريخ غير صحيحة.');
      return;
    }

    setIsSavingExam(true);
    try {
      const newExam: Exam = {
        id: `exam_${Date.now()}`,
        batchCode: currentUser?.batchCode || '',
        title: examTitle.trim(),
        courseId: examCourseId,
        courseName: selectedCourse?.name || 'مادة دراسية',
        examDate: examDateTime,
        examTimestamp: parsedTimestamp,
        hall: examHall.trim() || undefined,
        topics: examTopics.trim() || undefined,
        type: examType,
        createdAt: Date.now(),
        createdBy: currentUser?.name || 'الممثل',
      };

      await onSaveExam(newExam);

      // Reset form
      setExamTitle('');
      setExamDateTime('');
      setExamHall('');
      setExamTopics('');
      setIsAddExamModalOpen(false);
    } catch (err: any) {
      console.error('Error saving exam:', err);
      alert('حدث خطأ أثناء حفظ موعد الامتحان.');
    } finally {
      setIsSavingExam(false);
    }
  };

  const handleCardClick = (item: DeadlineItem) => {
    if (item.sourceType === 'ASSIGNMENT') {
      onNavigateTab(Tab.ASSIGNMENTS);
    } else if (item.sourceType === 'PROJECT') {
      onNavigateTab(Tab.PROJECTS);
    } else if (item.sourceType === 'EXAM') {
      setSelectedExamDetails(item.originalItem as Exam);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0 animate-pulse">
            <Flame size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white">
                شريط العد التنازلي للمواعيد ⏳
              </h2>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300">
                مباشر لحظي
              </span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-400 mt-0.5">
              تتبع المتبقي بالثواني للواجبات، الامتحانات، وتسليم المشاريع لدفعتك
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
          {/* Filter Pills */}
          <div className="flex items-center p-1 bg-gray-100 dark:bg-slate-700/60 rounded-2xl text-[11px] font-bold">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-xl transition ${
                filterType === 'ALL'
                  ? 'bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'
              }`}
            >
              الكل ({allDeadlines.length})
            </button>
            <button
              onClick={() => setFilterType('EXAM')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 ${
                filterType === 'EXAM'
                  ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'
              }`}
            >
              <Award size={12} />
              <span>الامتحانات</span>
            </button>
            <button
              onClick={() => setFilterType('ASSIGNMENT')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 ${
                filterType === 'ASSIGNMENT'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'
              }`}
            >
              <BookOpen size={12} />
              <span>الواجبات</span>
            </button>
            <button
              onClick={() => setFilterType('PROJECT')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 ${
                filterType === 'PROJECT'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'
              }`}
            >
              <Layers size={12} />
              <span>المشاريع</span>
            </button>
          </div>

          {/* Add Exam Button (For Representatives & Sub-Reps) */}
          {isManager && (
            <button
              onClick={() => setIsAddExamModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-purple-600/20 active:scale-95"
            >
              <Plus size={15} />
              <span>إضافة موعد امتحان 🎓</span>
            </button>
          )}
        </div>
      </div>

      {/* Deadlines Horizontal Cards Strip */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl text-center border border-dashed border-gray-200 dark:border-slate-700">
          <Clock size={36} className="mx-auto text-gray-300 dark:text-slate-600 mb-2" />
          <p className="font-bold text-gray-600 dark:text-gray-300 text-sm">
            لا توجد مواعيد تسليم أو امتحانات قريبة حالياً 🎉
          </p>
          <p className="text-xs text-gray-400 mt-1">
            عند قيام الممثل بإضافة واجب، موعد امتحان، أو موعد مشروع، سيبدأ العداد التنازلي التلقائي هنا فوراً!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filtered.map((item) => {
            const countdown = getRemainingTime(item.timestamp);
            const isVeryUrgent = !countdown.isOverdue && countdown.days === 0 && countdown.hours < 24;
            const isUpcomingSoon = !countdown.isOverdue && countdown.days < 3;

            // Type styling
            const typeConfig = {
              EXAM: {
                label: item.examType === 'FINAL' ? 'امتحان نهائي 🏆' : item.examType === 'MIDTERM' ? 'امتحان نصفي 📜' : item.examType === 'PRACTICAL' ? 'امتحان عملي 🧪' : 'كويز سريع 📝',
                border: isVeryUrgent ? 'border-red-400' : 'border-purple-200 dark:border-purple-900/40',
                badgeBg: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
                glow: 'hover:shadow-purple-500/10',
              },
              ASSIGNMENT: {
                label: 'واجب دراسي 📝',
                border: isVeryUrgent ? 'border-red-400' : 'border-blue-200 dark:border-blue-900/40',
                badgeBg: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
                glow: 'hover:shadow-blue-500/10',
              },
              PROJECT: {
                label: 'مشروع فصلي 💼',
                border: isVeryUrgent ? 'border-red-400' : 'border-emerald-200 dark:border-emerald-900/40',
                badgeBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
                glow: 'hover:shadow-emerald-500/10',
              },
            }[item.sourceType];

            return (
              <div
                key={item.id}
                onClick={() => handleCardClick(item)}
                className={`p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-800 border ${typeConfig.border} shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer relative overflow-hidden group ${typeConfig.glow}`}
              >
                {/* Status indicator bar on top */}
                {isVeryUrgent && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-rose-500 to-orange-500 animate-pulse"></div>
                )}

                <div>
                  {/* Top Tags */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${typeConfig.badgeBg}`}>
                      {typeConfig.label}
                    </span>

                    {item.isCompleted ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 size={11} />
                        تم التسليم
                      </span>
                    ) : countdown.isOverdue ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 flex items-center gap-1">
                        <AlertTriangle size={11} />
                        انتهى الموعد
                      </span>
                    ) : isVeryUrgent ? (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-500 text-white flex items-center gap-1 animate-pulse shadow-sm">
                        <Flame size={11} />
                        أقل من 24 ساعة!
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(item.timestamp).toLocaleDateString('ar-IQ', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>

                  {/* Title and Course */}
                  <h3 className="font-bold text-gray-800 dark:text-white text-base leading-snug group-hover:text-primary transition line-clamp-1">
                    {item.title}
                  </h3>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5 font-medium">
                    <BookOpen size={13} className="text-gray-400" />
                    <span>{item.courseName}</span>
                    {item.hall && (
                      <>
                        <span>•</span>
                        <span className="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-0.5">
                          <MapPin size={11} />
                          {item.hall}
                        </span>
                      </>
                    )}
                  </p>
                </div>

                {/* Digital Live Countdown Boxes */}
                <div className="mt-4 pt-3.5 border-t border-gray-100 dark:border-slate-700/80">
                  {countdown.isOverdue ? (
                    <div className="py-2 text-center text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded-2xl">
                      انتهى موعد التسليم / الامتحان
                    </div>
                  ) : (
                    <div>
                      <div className="grid grid-cols-4 gap-1.5 text-center">
                        {/* Days */}
                        <div className="bg-gray-50 dark:bg-slate-700/60 p-2 rounded-2xl border border-gray-100 dark:border-slate-600">
                          <div className="text-base sm:text-lg font-black font-mono text-gray-800 dark:text-white tracking-tight">
                            {String(countdown.days).padStart(2, '0')}
                          </div>
                          <div className="text-[9px] font-bold text-gray-400 uppercase">يوم</div>
                        </div>

                        {/* Hours */}
                        <div className={`p-2 rounded-2xl border ${
                          isVeryUrgent 
                            ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-300' 
                            : 'bg-gray-50 dark:bg-slate-700/60 border-gray-100 dark:border-slate-600 text-gray-800 dark:text-white'
                        }`}>
                          <div className="text-base sm:text-lg font-black font-mono tracking-tight">
                            {String(countdown.hours).padStart(2, '0')}
                          </div>
                          <div className="text-[9px] font-bold opacity-75 uppercase">ساعة</div>
                        </div>

                        {/* Minutes */}
                        <div className={`p-2 rounded-2xl border ${
                          isVeryUrgent 
                            ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-300' 
                            : 'bg-gray-50 dark:bg-slate-700/60 border-gray-100 dark:border-slate-600 text-gray-800 dark:text-white'
                        }`}>
                          <div className="text-base sm:text-lg font-black font-mono tracking-tight">
                            {String(countdown.minutes).padStart(2, '0')}
                          </div>
                          <div className="text-[9px] font-bold opacity-75 uppercase">دقيقة</div>
                        </div>

                        {/* Seconds */}
                        <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/40 p-2 rounded-2xl text-orange-600 dark:text-orange-400">
                          <div className="text-base sm:text-lg font-black font-mono tracking-tight animate-pulse">
                            {String(countdown.seconds).padStart(2, '0')}
                          </div>
                          <div className="text-[9px] font-bold uppercase">ثانية</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2 px-1">
                        <span className="flex items-center gap-1 text-primary group-hover:underline font-bold">
                          <span>عرض التفاصيل</span>
                          <ChevronLeft size={13} />
                        </span>

                        {item.sourceType === 'ASSIGNMENT' && onToggleCompleteAssignment && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleCompleteAssignment((item.originalItem as Assignment).id);
                            }}
                            className={`px-2 py-0.5 rounded-lg font-bold text-[10px] transition ${
                              item.isCompleted 
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' 
                                : 'bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
                            }`}
                          >
                            {item.isCompleted ? '✓ مكتمل' : 'تحديد كمكتمل'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: ADD NEW EXAM (Representative / Sub-Rep / Developer) */}
      {isAddExamModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-slate-700 animate-in zoom-in-95 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center">
                  <Award size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-800 dark:text-white">
                    إضافة موعد امتحان جديد 🎓
                  </h3>
                  <p className="text-xs text-gray-400">
                    سيظهر فوراً في شريط العد التنازلي لجميع طلاب الدفعة
                  </p>
                </div>
              </div>
              <button onClick={() => setIsAddExamModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateExamSubmit} className="space-y-3.5 text-xs">
              {/* Course Selection */}
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                  المادة الدراسية <span className="text-red-500">*</span>:
                </label>
                <select
                  value={examCourseId}
                  onChange={(e) => setExamCourseId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2.5 font-bold outline-none"
                  required
                >
                  <option value="">-- اختر المادة --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code || 'مادة'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Exam Title */}
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                  عنوان الامتحان <span className="text-red-500">*</span>:
                </label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="مثال: كويز سريع / امتحان الشهر الأول / امتحان نصفي"
                  className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2.5 font-bold outline-none"
                  required
                />
              </div>

              {/* Exam Type */}
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                  نوع الامتحان:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['QUIZ', 'MIDTERM', 'FINAL', 'PRACTICAL'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setExamType(t)}
                      className={`py-2 rounded-xl font-bold text-[11px] border transition ${
                        examType === t
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                          : 'border-gray-200 dark:border-slate-600 text-gray-500'
                      }`}
                    >
                      {t === 'QUIZ' ? 'كويز' : t === 'MIDTERM' ? 'شهري/نصفي' : t === 'FINAL' ? 'فاينل' : 'عملي'}
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
                  className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2.5 font-bold outline-none"
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
                  placeholder="مثال: القاعة 4 / مختبر الحاسوب 2"
                  className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 font-medium outline-none"
                />
              </div>

              {/* Topics / Notes */}
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                  المادة المقررة للامتحان (اختياري):
                </label>
                <textarea
                  value={examTopics}
                  onChange={(e) => setExamTopics(e.target.value)}
                  placeholder="مثال: المادة من المحاضرة الأولى إلى صفحة 45 + أمثلة الشيت"
                  className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 outline-none h-16 resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddExamModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSavingExam}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 active:scale-95 disabled:opacity-50"
                >
                  {isSavingExam ? 'جاري الحفظ...' : 'نشر موعد الامتحان 📢'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EXAM DETAILS VIEW */}
      {selectedExamDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-slate-700 animate-in zoom-in-95 space-y-4">
            <div className="flex justify-between items-start pb-2 border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center shrink-0">
                  <Award size={26} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                    {selectedExamDetails.title}
                  </h3>
                  <p className="text-xs text-gray-400">
                    مادة: {selectedExamDetails.courseName}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedExamDetails(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-purple-50/70 dark:bg-purple-950/30 rounded-2xl border border-purple-100 dark:border-purple-900/40 flex items-center gap-2.5 text-purple-900 dark:text-purple-200">
                <Calendar size={18} className="text-purple-600 shrink-0" />
                <div>
                  <div className="font-bold">التاريخ والتوقيت المحدد:</div>
                  <div className="text-[11px] mt-0.5">
                    {new Date(selectedExamDetails.examTimestamp).toLocaleString('ar-IQ', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>

              {selectedExamDetails.hall && (
                <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border border-gray-100 dark:border-slate-700 flex items-center gap-2.5 text-gray-700 dark:text-gray-200">
                  <MapPin size={18} className="text-red-500 shrink-0" />
                  <div>
                    <div className="font-bold">القاعة الامتحانية:</div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {selectedExamDetails.hall}
                    </div>
                  </div>
                </div>
              )}

              {selectedExamDetails.topics && (
                <div className="p-3.5 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border border-gray-100 dark:border-slate-700 space-y-1">
                  <div className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <FileText size={15} className="text-primary" />
                    <span>المادة والمواضيع المقررة للامتحان:</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {selectedExamDetails.topics}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              {isManager && onDeleteExam && (
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm('هل أنت متأكد من حذف موعد هذا الامتحان؟')) {
                      await onDeleteExam(selectedExamDetails.id);
                      setSelectedExamDetails(null);
                    }
                  }}
                  className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition"
                  title="حذف الامتحان"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedExamDetails(null)}
                className="flex-1 py-2.5 bg-primary text-white rounded-xl font-bold text-xs shadow-md shadow-primary/20"
              >
                حسناً، فهمت
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
