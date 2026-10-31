import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  BookOpen,
  Award,
  Layers,
  ChevronLeft,
  Plus,
  Trash2,
  MapPin,
  FileText,
  X,
  Sparkles,
  Flame,
  Filter,
  Check,
  CheckSquare,
  ArrowRight,
  Eye,
  EyeOff,
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
  courseId?: string;
  courseName: string;
  timestamp: number;
  dateStr: string;
  isCompleted?: boolean;
  hall?: string;
  topics?: string;
  examType?: string;
  originalItem: Assignment | Exam | CourseProject;
}

// 1. Isolated leaf timer: ONLY this leaf ticks every second to update the 4 digits
const DigitalCountdownDisplay = React.memo(({
  targetTimestamp,
  isVeryUrgent,
}: {
  targetTimestamp: number;
  isVeryUrgent: boolean;
}) => {
  const [diff, setDiff] = useState(() => targetTimestamp - Date.now());

  useEffect(() => {
    if (diff <= -60000) return;
    const interval = setInterval(() => {
      setDiff(targetTimestamp - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [targetTimestamp, diff <= -60000]);

  if (diff <= 0) {
    return (
      <div className="py-2 text-center text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded-2xl">
        انتهى موعد التسليم / الامتحان
      </div>
    );
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return (
    <div className="grid grid-cols-4 gap-1.5 text-center">
      {/* Days */}
      <div className="bg-gray-50 dark:bg-slate-700/60 p-2 rounded-2xl border border-gray-100 dark:border-slate-600">
        <div className="text-base sm:text-lg font-black font-mono text-gray-800 dark:text-white tracking-tight">
          {String(days).padStart(2, '0')}
        </div>
        <div className="text-[9px] font-bold text-gray-400 uppercase">يوم</div>
      </div>

      {/* Hours */}
      <div
        className={`p-2 rounded-2xl border ${
          isVeryUrgent
            ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-300'
            : 'bg-gray-50 dark:bg-slate-700/60 border-gray-100 dark:border-slate-600 text-gray-800 dark:text-white'
        }`}
      >
        <div className="text-base sm:text-lg font-black font-mono tracking-tight">
          {String(hours).padStart(2, '0')}
        </div>
        <div className="text-[9px] font-bold opacity-75 uppercase">ساعة</div>
      </div>

      {/* Minutes */}
      <div
        className={`p-2 rounded-2xl border ${
          isVeryUrgent
            ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-300'
            : 'bg-gray-50 dark:bg-slate-700/60 border-gray-100 dark:border-slate-600 text-gray-800 dark:text-white'
        }`}
      >
        <div className="text-base sm:text-lg font-black font-mono tracking-tight">
          {String(minutes).padStart(2, '0')}
        </div>
        <div className="text-[9px] font-bold opacity-75 uppercase">دقيقة</div>
      </div>

      {/* Seconds */}
      <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/40 p-2 rounded-2xl text-orange-600 dark:text-orange-400">
        <div className="text-base sm:text-lg font-black font-mono tracking-tight animate-pulse">
          {String(seconds).padStart(2, '0')}
        </div>
        <div className="text-[9px] font-bold uppercase">ثانية</div>
      </div>
    </div>
  );
});

// 2. Memoized Card: Doesn't re-render on ticking, only when props or coarse currentTime change
const DeadlineCard = React.memo(({
  item,
  currentTime,
  onCardClick,
  onToggleCompleteAssignment,
}: {
  item: DeadlineItem;
  currentTime: number;
  onCardClick: (item: DeadlineItem) => void;
  onToggleCompleteAssignment?: (assignmentId: string) => Promise<void>;
}) => {
  const diff = item.timestamp - currentTime;
  const isOverdue = diff <= 0;
  const isVeryUrgent = !isOverdue && diff < 24 * 60 * 60 * 1000;

  const typeConfig = {
    EXAM: {
      label:
        item.examType === 'FINAL'
          ? 'امتحان نهائي 🏆'
          : item.examType === 'MIDTERM'
          ? 'امتحان نصفي 📜'
          : item.examType === 'PRACTICAL'
          ? 'امتحان عملي 🧪'
          : 'كويز سريع 📝',
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
      onClick={() => onCardClick(item)}
      className={`p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-800 border ${typeConfig.border} shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer relative overflow-hidden group ${typeConfig.glow}`}
    >
      {/* Status indicator bar on top */}
      {isVeryUrgent && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-rose-500 to-orange-500 animate-pulse" />
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
          ) : isOverdue ? (
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
        <DigitalCountdownDisplay targetTimestamp={item.timestamp} isVeryUrgent={isVeryUrgent} />

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
    </div>
  );
});

export const LiveCountdownStrip: React.FC<LiveCountdownStripProps> = React.memo(({
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

  // Filter States
  const [filterType, setFilterType] = useState<'ALL' | 'ASSIGNMENT' | 'EXAM' | 'PROJECT'>('ALL');
  const [filterTimeframe, setFilterTimeframe] = useState<'ALL' | 'URGENT_48H' | 'THIS_WEEK' | 'LATER' | 'OVERDUE'>('ALL');
  const [filterCourseId, setFilterCourseId] = useState<string>('ALL');
  const [hideCompleted, setHideCompleted] = useState<boolean>(false);

  // Modals
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

  // Coarse tick every 30 seconds for categories and statistics (instead of heavy 1-sec full re-renders)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Aggregate all items into unified deadlines
  const allDeadlines = useMemo(() => {
    const list: DeadlineItem[] = [];

    // 1. Assignments
    assignments.forEach((a) => {
      const isCompleted = Boolean(currentUser && a.completedBy?.includes(currentUser.uid));
      list.push({
        id: `assign_${a.id}`,
        sourceType: 'ASSIGNMENT',
        title: a.title,
        courseId: a.courseId,
        courseName: a.courseName || 'مادة دراسية',
        timestamp: a.dueTimestamp,
        dateStr: a.dueDate,
        isCompleted,
        originalItem: a,
      });
    });

    // 2. Exams
    exams.forEach((e) => {
      list.push({
        id: `exam_${e.id}`,
        sourceType: 'EXAM',
        title: e.title,
        courseId: e.courseId,
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
          list.push({
            id: `project_${p.id}`,
            sourceType: 'PROJECT',
            title: p.title,
            courseId: p.courseId,
            courseName: p.courseName || 'مشروع فصلي',
            timestamp: pTimestamp,
            dateStr: p.deadline,
            originalItem: p,
          });
        }
      }
    });

    return list;
  }, [assignments, exams, projects, currentUser]);

  // Statistics calculation
  const urgentCount = allDeadlines.filter((d) => {
    const diff = d.timestamp - currentTime;
    return diff > 0 && diff <= 48 * 60 * 60 * 1000;
  }).length;

  const thisWeekCount = allDeadlines.filter((d) => {
    const diff = d.timestamp - currentTime;
    return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
  }).length;

  const pendingAssignmentsCount = assignments.filter(
    (a) => !a.completedBy?.includes(currentUser?.uid || '')
  ).length;

  // Filter deadlines with all criteria
  const filtered = useMemo(() => {
    return allDeadlines
      .filter((d) => {
        // 1. Source type filter
        if (filterType !== 'ALL' && d.sourceType !== filterType) return false;

        // 2. Course filter
        if (filterCourseId !== 'ALL' && d.courseId !== filterCourseId) return false;

        // 3. Hide completed assignments
        if (hideCompleted && d.isCompleted) return false;

        // 4. Timeframe filter
        const diff = d.timestamp - currentTime;

        if (filterTimeframe === 'URGENT_48H') {
          return diff > 0 && diff <= 48 * 60 * 60 * 1000;
        }
        if (filterTimeframe === 'THIS_WEEK') {
          return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
        }
        if (filterTimeframe === 'LATER') {
          return diff > 7 * 24 * 60 * 60 * 1000;
        }
        if (filterTimeframe === 'OVERDUE') {
          return diff <= 0 && diff > -48 * 60 * 60 * 1000;
        }

        // Default 'ALL': show upcoming, or recently expired within the last 18 hours
        return diff > -18 * 60 * 60 * 1000;
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [allDeadlines, filterType, filterCourseId, hideCompleted, filterTimeframe, currentTime]);

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

  const handleResetFilters = () => {
    setFilterType('ALL');
    setFilterTimeframe('ALL');
    setFilterCourseId('ALL');
    setHideCompleted(false);
  };

  const isAnyFilterActive =
    filterType !== 'ALL' ||
    filterTimeframe !== 'ALL' ||
    filterCourseId !== 'ALL' ||
    hideCompleted;

  return (
    <div className="space-y-3.5">
      {/* Header Banner & Counter Strip */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
              <Flame size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-gray-800 dark:text-white">
                  شريط المواعيد والعد التنازلي المباشر ⏳
                </h2>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300">
                  محدث لحظياً
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                تتبع مواعيد الواجبات، الامتحانات، والمشاريع لحظة بلحظة مع فرز ذكي حسب المادة والوقت
              </p>
            </div>
          </div>

          {/* Quick Metrics Badges & Add Exam Button */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onNavigateTab(Tab.ASSIGNMENTS)}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-xl transition"
            >
              <CheckSquare size={14} />
              <span>صفحة المهام الموحدة ➔</span>
            </button>

            {isManager && (
              <button
                type="button"
                onClick={() => setIsAddExamModalOpen(true)}
                className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-purple-600/20 active:scale-95"
              >
                <Plus size={15} />
                <span>إضافة موعد امتحان 🎓</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Quick Stat Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100 dark:border-slate-700/60 text-[11px] font-bold">
          <span className="text-gray-400">ملخص المواعيد:</span>
          {urgentCount > 0 ? (
            <span className="bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300 px-2.5 py-1 rounded-xl flex items-center gap-1 border border-red-200 dark:border-red-900/50">
              <Flame size={12} className="animate-bounce" />
              <span>{urgentCount} حرج خلال 48 ساعة!</span>
            </span>
          ) : null}

          {thisWeekCount > 0 ? (
            <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 px-2.5 py-1 rounded-xl flex items-center gap-1 border border-amber-200 dark:border-amber-900/50">
              <Clock size={12} />
              <span>{thisWeekCount} مواعيد هذا الأسبوع</span>
            </span>
          ) : null}

          {pendingAssignmentsCount > 0 ? (
            <span className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 px-2.5 py-1 rounded-xl flex items-center gap-1 border border-blue-200 dark:border-blue-900/50">
              <BookOpen size={12} />
              <span>{pendingAssignmentsCount} واجبات متبقية عليك</span>
            </span>
          ) : (
            <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 px-2.5 py-1 rounded-xl flex items-center gap-1 border border-emerald-200 dark:border-emerald-900/50">
              <CheckCircle2 size={12} />
              <span>أتممت جميع الواجبات المسجلة ✅</span>
            </span>
          )}
        </div>

        {/* Comprehensive Filter Controls */}
        <div className="bg-gray-50/90 dark:bg-slate-900/60 p-3 rounded-2xl border border-gray-100 dark:border-slate-700 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
            {/* 1. Filter by Type */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
              <span className="text-[10px] font-black text-gray-400 pl-1 shrink-0">النوع:</span>
              <button
                type="button"
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  filterType === 'ALL'
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100'
                }`}
              >
                الكل ({allDeadlines.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('EXAM')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                  filterType === 'EXAM'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100'
                }`}
              >
                <Award size={13} />
                <span>الامتحانات ({exams.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterType('ASSIGNMENT')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                  filterType === 'ASSIGNMENT'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100'
                }`}
              >
                <BookOpen size={13} />
                <span>الواجبات ({assignments.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterType('PROJECT')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                  filterType === 'PROJECT'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100'
                }`}
              >
                <Layers size={13} />
                <span>المشاريع ({projects.length})</span>
              </button>
            </div>

            {/* 2. Course Filter Dropdown & Reset */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5">
                <BookOpen size={14} className="text-gray-400 shrink-0" />
                <select
                  value={filterCourseId}
                  onChange={(e) => setFilterCourseId(e.target.value)}
                  className="bg-transparent text-xs font-bold text-gray-800 dark:text-white outline-none cursor-pointer max-w-[150px] sm:max-w-[200px]"
                >
                  <option value="ALL">كافة المواد الدراسية</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id} className="bg-white dark:bg-slate-800">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {isAnyFilterActive && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] font-bold text-red-500 hover:underline px-2 py-1 rounded-lg transition shrink-0"
                >
                  إعادة ضبط الفلاتر ✕
                </button>
              )}
            </div>
          </div>

          {/* Quick Course Chips (1-tap filtering) */}
          {courses.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              <span className="text-[10px] font-black text-gray-400 shrink-0">المادة السريعة:</span>
              <button
                type="button"
                onClick={() => setFilterCourseId('ALL')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition shrink-0 ${
                  filterCourseId === 'ALL'
                    ? 'bg-gray-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-100'
                }`}
              >
                الكل
              </button>
              {courses.map((course) => {
                const countForCourse = allDeadlines.filter((d) => d.courseId === course.id).length;
                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => setFilterCourseId(course.id)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 shrink-0 ${
                      filterCourseId === course.id
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-100'
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

          {/* Timeframe & Hide Completed Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-slate-700/50">
            {/* Timeframe Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-bold">
              <span className="text-gray-400 pl-1 shrink-0">الفترة:</span>
              <button
                type="button"
                onClick={() => setFilterTimeframe('ALL')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterTimeframe === 'ALL'
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
                }`}
              >
                كافة الأيام
              </button>
              <button
                type="button"
                onClick={() => setFilterTimeframe('URGENT_48H')}
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                  filterTimeframe === 'URGENT_48H'
                    ? 'bg-red-500 text-white'
                    : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                }`}
              >
                <Flame size={12} />
                <span>حرج (أقل من 48 ساعة)</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterTimeframe('THIS_WEEK')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterTimeframe === 'THIS_WEEK'
                    ? 'bg-amber-500 text-white'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
                }`}
              >
                خلال 7 أيام
              </button>
              <button
                type="button"
                onClick={() => setFilterTimeframe('LATER')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterTimeframe === 'LATER'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
                }`}
              >
                القادمة لاحقاً
              </button>
            </div>

            {/* Hide Completed Toggle */}
            <button
              type="button"
              onClick={() => setHideCompleted(!hideCompleted)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                hideCompleted
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-slate-700'
              }`}
            >
              {hideCompleted ? <EyeOff size={13} /> : <Eye size={13} />}
              <span>إخفاء ما أنجزته</span>
            </button>
          </div>
        </div>
      </div>

      {/* Deadlines Horizontal Cards Strip */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl text-center border border-dashed border-gray-200 dark:border-slate-700 space-y-2">
          <Clock size={36} className="mx-auto text-gray-300 dark:text-slate-600 mb-1" />
          <p className="font-bold text-gray-700 dark:text-gray-300 text-sm">
            لا توجد مواعيد تطابق الفلاتر المحددة حالياً 🎉
          </p>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            {isAnyFilterActive
              ? 'جرّب تغيير فلاتر المادة أو الفترة الزمنية لعرض باقي المواعيد والامتحانات.'
              : 'عند قيام الممثل بإضافة موعد امتحان أو واجب، سيبدأ العداد التنازلي التلقائي هنا فوراً!'}
          </p>
          {isAnyFilterActive && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold transition inline-flex items-center gap-1"
            >
              <span>عرض كافة المواعيد</span>
              <ArrowRight size={14} className="rtl:rotate-180" />
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filtered.map((item) => (
            <DeadlineCard
              key={item.id}
              item={item}
              currentTime={currentTime}
              onCardClick={handleCardClick}
              onToggleCompleteAssignment={onToggleCompleteAssignment}
            />
          ))}
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
                    سيظهر فوراً في شريط العد التنازلي وفي خانة المهام لجميع طلاب الدفعة
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddExamModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
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
              <button
                type="button"
                onClick={() => setSelectedExamDetails(null)}
                className="text-gray-400 hover:text-gray-600"
              >
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
});

export default LiveCountdownStrip;
