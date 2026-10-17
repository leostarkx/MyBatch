import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  BookOpen,
  FileText,
  Clock,
  Plus,
  Search,
  Filter,
  Calendar,
  Award,
  MapPin,
  ExternalLink,
  Edit3,
  Trash2,
  CheckCircle,
  Square,
  X,
  Layers,
  Sparkles,
  Flame,
  Eye,
  EyeOff,
  Star,
  Download,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  Assignment,
  Exam,
  Material,
  MaterialSection,
  Course,
  User,
  Tab,
} from '../types';
import { FormattedTextRenderer } from '../components/FormattedTextRenderer';
import { RichTextEditor } from '../components/RichTextEditor';
import { StudentSummariesHub } from '../components/StudentSummariesHub';

interface StudyHubViewProps {
  initialSubTab?: 'tasks' | 'materials' | 'summaries';
  assignments: Assignment[];
  exams: Exam[];
  materials: Material[];
  materialSections: MaterialSection[];
  courses: Course[];
  currentUser: User | null;
  appUsers: User[];
  effectiveBatchCode: string;
  isManager: boolean;
  canManageMaterials: boolean;
  canManageAssignments: boolean;
  // Handlers for Assignments & Exams
  onToggleAssignmentDone: (assign: Assignment) => Promise<void>;
  onOpenAddAssignment: () => void;
  onOpenEditAssignment: (assign: Assignment) => void;
  onDeleteAssignment: (id: string) => Promise<void>;
  onSaveExam: (exam: Exam) => Promise<void>;
  onDeleteExam: (id: string) => Promise<void>;
  // Handlers for Materials
  renderMaterialsContent: () => React.ReactNode;
  // Handlers for Summaries
  studentSummaries: any[];
  onPreviewImage: (title: string, url: string) => void;
  onViewProfile: (uid: string) => void;
  // Common Timer
  currentTimer: number;
}

export const StudyHubView: React.FC<StudyHubViewProps> = ({
  initialSubTab = 'tasks',
  assignments,
  exams,
  materials,
  materialSections,
  courses,
  currentUser,
  appUsers,
  effectiveBatchCode,
  isManager,
  canManageMaterials,
  canManageAssignments,
  onToggleAssignmentDone,
  onOpenAddAssignment,
  onOpenEditAssignment,
  onDeleteAssignment,
  onSaveExam,
  onDeleteExam,
  renderMaterialsContent,
  studentSummaries,
  onPreviewImage,
  onViewProfile,
  currentTimer,
}) => {
  // Main Sub-Tab in Study Hub
  const [activeSubTab, setActiveSubTab] = useState<'tasks' | 'materials' | 'summaries'>(initialSubTab);

  // Sync if initialSubTab prop changes
  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Tasks Internal Sub-Tabs: 'all' | 'assignments' | 'exams'
  const [tasksFilterMode, setTasksFilterMode] = useState<'all' | 'assignments' | 'exams'>('all');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [taskCourseFilter, setTaskCourseFilter] = useState('all');
  const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | 'pending' | 'completed' | 'urgent'>('all');

  // New Exam Modal State
  const [isAddExamModalOpen, setIsAddExamModalOpen] = useState(false);
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamCourseId, setNewExamCourseId] = useState('');
  const [newExamType, setNewExamType] = useState<'QUIZ' | 'MIDTERM' | 'FINAL' | 'PRACTICAL'>('QUIZ');
  const [newExamDateTime, setNewExamDateTime] = useState('');
  const [newExamHall, setNewExamHall] = useState('');
  const [newExamTopics, setNewExamTopics] = useState('');
  const [isSavingExam, setIsSavingExam] = useState(false);

  // Selected Exam Details Modal State
  const [selectedExamDetails, setSelectedExamDetails] = useState<Exam | null>(null);

  // Helper for assignment remaining time status
  const getRemainingTimeInfo = (dueTimestamp: number) => {
    const diff = dueTimestamp - currentTimer;
    if (diff <= 0) {
      return {
        status: 'expired',
        text: 'انتهت المهلة',
        badgeClass: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400',
      };
    }
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours <= 24) {
      return {
        status: 'critical',
        text: `باقي ${hours} ساعة فقط! 🔥`,
        badgeClass: 'bg-red-500 text-white animate-pulse',
      };
    }
    if (hours <= 48) {
      return {
        status: 'urgent',
        text: 'باقي يومين ⚠️',
        badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300',
      };
    }
    return {
      status: 'normal',
      text: `باقي ${days} أيام`,
      badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    };
  };

  const handleCreateExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamTitle.trim() || !newExamDateTime || !newExamCourseId) {
      alert('يرجى ملء اسم الامتحان والمادة والتاريخ والوقت المحدد.');
      return;
    }
    const selectedCourse = courses.find((c) => c.id === newExamCourseId);
    const parsedTimestamp = new Date(newExamDateTime).getTime();
    if (isNaN(parsedTimestamp)) {
      alert('صيغة التاريخ غير صحيحة.');
      return;
    }

    setIsSavingExam(true);
    try {
      const examObj: Exam = {
        id: `exam_${Date.now()}`,
        batchCode: effectiveBatchCode,
        title: newExamTitle.trim(),
        courseId: newExamCourseId,
        courseName: selectedCourse?.name || 'مادة دراسية',
        examDate: newExamDateTime,
        examTimestamp: parsedTimestamp,
        hall: newExamHall.trim() || undefined,
        topics: newExamTopics.trim() || undefined,
        type: newExamType,
        createdAt: Date.now(),
        createdBy: currentUser?.name || 'الممثل',
      };
      await onSaveExam(examObj);
      setIsAddExamModalOpen(false);
      setNewExamTitle('');
      setNewExamCourseId('');
      setNewExamDateTime('');
      setNewExamHall('');
      setNewExamTopics('');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ موعد الامتحان.');
    } finally {
      setIsSavingExam(false);
    }
  };

  // Build unified tasks list
  const unifiedTasksList = useMemo(() => {
    type UnifiedTask = {
      id: string;
      sourceType: 'ASSIGNMENT' | 'EXAM';
      title: string;
      courseId?: string;
      courseName: string;
      timestamp: number;
      dateStr: string;
      isCompleted?: boolean;
      description?: string;
      attachments?: any[];
      examType?: string;
      hall?: string;
      topics?: string;
      originalAssignment?: Assignment;
      originalExam?: Exam;
    };

    const list: UnifiedTask[] = [];

    // 1. Assignments
    assignments.forEach((a) => {
      const isCompleted = Boolean(currentUser && a.completedBy?.includes(currentUser.uid));
      list.push({
        id: `assign_${a.id}`,
        sourceType: 'ASSIGNMENT',
        title: a.title,
        courseId: a.courseId,
        courseName: a.courseName,
        timestamp: a.dueTimestamp,
        dateStr: a.dueDate,
        isCompleted,
        description: a.description,
        attachments: a.attachments,
        originalAssignment: a,
      });
    });

    // 2. Exams
    exams.forEach((e) => {
      list.push({
        id: `exam_${e.id}`,
        sourceType: 'EXAM',
        title: e.title,
        courseId: e.courseId,
        courseName: e.courseName,
        timestamp: e.examTimestamp,
        dateStr: e.examDate,
        examType: e.type,
        hall: e.hall,
        topics: e.topics,
        originalExam: e,
      });
    });

    return list.sort((a, b) => a.timestamp - b.timestamp);
  }, [assignments, exams, currentUser]);

  // Filtered Unified Tasks
  const filteredUnifiedTasks = useMemo(() => {
    return unifiedTasksList.filter((item) => {
      // 1. Task Mode Filter
      if (tasksFilterMode === 'assignments' && item.sourceType !== 'ASSIGNMENT') return false;
      if (tasksFilterMode === 'exams' && item.sourceType !== 'EXAM') return false;

      // 2. Course Filter
      if (taskCourseFilter !== 'all' && item.courseId !== taskCourseFilter) return false;

      // 3. Search Query
      if (taskSearchQuery.trim()) {
        const q = taskSearchQuery.toLowerCase();
        const matches =
          item.title.toLowerCase().includes(q) ||
          item.courseName.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          (item.topics && item.topics.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // 4. Status Filter
      if (taskStatusFilter === 'completed') {
        if (!item.isCompleted) return false;
      }
      if (taskStatusFilter === 'pending') {
        if (item.sourceType === 'ASSIGNMENT' && item.isCompleted) return false;
      }
      if (taskStatusFilter === 'urgent') {
        const diff = item.timestamp - currentTimer;
        if (diff <= 0 || diff > 48 * 60 * 60 * 1000) return false;
      }

      return true;
    });
  }, [unifiedTasksList, tasksFilterMode, taskCourseFilter, taskSearchQuery, taskStatusFilter, currentTimer]);

  const pendingAssignmentsCount = assignments.filter(
    (a) => !a.completedBy?.includes(currentUser?.uid || '')
  ).length;

  return (
    <div className="space-y-6 p-2 sm:p-4 animate-in slide-in-from-bottom-3 duration-300">
      {/* Smart Hub Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                <BookOpen size={14} className="text-blue-200" />
                المركز الدراسي الشامل
              </span>
              <span className="bg-white/10 px-3 py-1 rounded-full text-xs">
                دفعة {currentUser?.batchCode || effectiveBatchCode}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mb-1.5 flex items-center gap-2.5">
              <span>📚 المركز الدراسي للمحاضرات والمهام</span>
            </h1>
            <p className="opacity-90 text-xs sm:text-sm max-w-2xl leading-relaxed">
              منصة موحدة لمتابعة التكليفات الدراسية والامتحانات، تصفح وتحميل ملازم المحاضرات من Google Drive، وتدوين ومشاركة الملخصات والملاحظات الدراسية.
            </p>
          </div>

          {/* Manager Quick Action Buttons */}
          {isManager && (
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                type="button"
                onClick={onOpenAddAssignment}
                className="bg-white text-blue-700 hover:bg-blue-50 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition shadow-md flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Plus size={16} />
                <span>إضافة واجب 📝</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddExamModalOpen(true)}
                className="bg-purple-600/90 hover:bg-purple-600 text-white border border-white/20 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition shadow-md flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Award size={16} />
                <span>إضافة امتحان 🎓</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sub-Tabs Selector Strip */}
      <div className="bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveSubTab('tasks')}
          className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 ${
            activeSubTab === 'tasks'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
          }`}
        >
          <CheckSquare size={17} />
          <span>المهام والامتحانات</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeSubTab === 'tasks' ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-500'}`}>
            {assignments.length + exams.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('materials')}
          className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 ${
            activeSubTab === 'materials'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
          }`}
        >
          <BookOpen size={17} />
          <span>المحاضرات والملازم</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeSubTab === 'materials' ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-500'}`}>
            {materials.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('summaries')}
          className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 ${
            activeSubTab === 'summaries'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
          }`}
        >
          <FileText size={17} />
          <span>الملخصات والملاحظات</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeSubTab === 'summaries' ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-500'}`}>
            {studentSummaries.length}
          </span>
        </button>
      </div>

      {/* SUB-TAB 1: UNIFIED TASKS & EXAMS */}
      {activeSubTab === 'tasks' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Quick Metrics & Mode Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter by Mode */}
            <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800 p-1 rounded-2xl overflow-x-auto text-xs font-bold">
              <button
                type="button"
                onClick={() => setTasksFilterMode('all')}
                className={`px-3.5 py-1.5 rounded-xl transition ${
                  tasksFilterMode === 'all'
                    ? 'bg-white dark:bg-slate-700 text-primary shadow-xs'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
                }`}
              >
                كل المهام ({assignments.length + exams.length})
              </button>

              <button
                type="button"
                onClick={() => setTasksFilterMode('assignments')}
                className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                  tasksFilterMode === 'assignments'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
                }`}
              >
                <CheckSquare size={13} />
                <span>الواجبات ({assignments.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setTasksFilterMode('exams')}
                className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                  tasksFilterMode === 'exams'
                    ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
                }`}
              >
                <Award size={13} />
                <span>الامتحانات ({exams.length})</span>
              </button>
            </div>

            {/* Quick Status Tags */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setTaskStatusFilter('all')}
                className={`px-2.5 py-1 rounded-xl transition ${
                  taskStatusFilter === 'all'
                    ? 'bg-gray-800 text-white dark:bg-slate-200 dark:text-slate-900'
                    : 'bg-white dark:bg-slate-800 text-gray-500 border border-gray-100 dark:border-slate-700'
                }`}
              >
                الكل
              </button>
              <button
                type="button"
                onClick={() => setTaskStatusFilter('pending')}
                className={`px-2.5 py-1 rounded-xl transition ${
                  taskStatusFilter === 'pending'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-amber-600 border border-amber-200 dark:border-amber-900/40'
                }`}
              >
                قيد الانتظار ({pendingAssignmentsCount})
              </button>
              <button
                type="button"
                onClick={() => setTaskStatusFilter('urgent')}
                className={`px-2.5 py-1 rounded-xl transition flex items-center gap-1 ${
                  taskStatusFilter === 'urgent'
                    ? 'bg-red-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-red-600 border border-red-200 dark:border-red-900/40'
                }`}
              >
                <Flame size={12} />
                <span>قريبة 48 ساعة</span>
              </button>
            </div>
          </div>

          {/* Search & Course Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={17} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="بحث في أسماء الواجبات، المواد، أو تفاصيل الامتحانات..."
                value={taskSearchQuery}
                onChange={(e) => setTaskSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-700 rounded-2xl pr-10 pl-4 py-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>

            <div className="sm:w-60">
              <select
                value={taskCourseFilter}
                onChange={(e) => setTaskCourseFilter(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs sm:text-sm outline-none cursor-pointer"
              >
                <option value="all">كافة المواد الدراسية ({courses.length})</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredUnifiedTasks.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700 text-gray-400 space-y-3">
              <CheckSquare size={48} className="mx-auto opacity-20" />
              <p className="text-base font-bold text-gray-700 dark:text-gray-300">
                لا توجد مهام أو امتحانات مطابقة للبحث أو الفلتر
              </p>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                جرّب مسح حقل البحث أو تغيير الفلتر لعرض باقي التكليفات والامتحانات المسجلة للدفعة.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredUnifiedTasks.map((item) => {
                const isAssignment = item.sourceType === 'ASSIGNMENT';
                const timeInfo = getRemainingTimeInfo(item.timestamp);
                const isOverdue = timeInfo.status === 'expired';

                return (
                  <div
                    key={item.id}
                    className={`bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border transition flex flex-col justify-between relative overflow-hidden ${
                      item.isCompleted
                        ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/15 dark:bg-emerald-950/10'
                        : isAssignment
                        ? 'border-gray-100 dark:border-slate-700 hover:border-blue-200'
                        : 'border-purple-200 dark:border-purple-900/50 hover:border-purple-300'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                              isAssignment
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                : 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                            }`}
                          >
                            {isAssignment ? <CheckSquare size={11} /> : <Award size={11} />}
                            <span>
                              {isAssignment
                                ? 'واجب دراسي'
                                : item.examType === 'FINAL'
                                ? 'امتحان نهائي 🏆'
                                : item.examType === 'MIDTERM'
                                ? 'امتحان نصفي 📜'
                                : item.examType === 'PRACTICAL'
                                ? 'امتحان عملي 🧪'
                                : 'كويز سريع 📝'}
                            </span>
                          </span>

                          <span className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-lg">
                            {item.courseName}
                          </span>
                        </div>

                        {/* Remaining Time Badge */}
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-xl flex items-center gap-1 ${timeInfo.badgeClass}`}>
                          <Clock size={11} />
                          <span>{timeInfo.text}</span>
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-base sm:text-lg font-black text-gray-800 dark:text-white mb-2">
                        {item.title}
                      </h3>

                      {/* Assignment Description or Exam Topics */}
                      {isAssignment && item.description && (
                        <div className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed mb-3 line-clamp-3">
                          <FormattedTextRenderer content={item.description} compact />
                        </div>
                      )}

                      {!isAssignment && item.topics && (
                        <div className="p-3 bg-purple-50/60 dark:bg-purple-950/30 rounded-2xl border border-purple-100 dark:border-purple-900/40 text-xs text-gray-700 dark:text-gray-300 mb-3 space-y-1">
                          <div className="text-[10px] font-bold text-purple-600 dark:text-purple-300 flex items-center gap-1">
                            <BookOpen size={12} />
                            <span>المادة المطلوبة للامتحان:</span>
                          </div>
                          <p className="line-clamp-2">{item.topics}</p>
                        </div>
                      )}

                      {/* Exam Hall Badge if available */}
                      {!isAssignment && item.hall && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-3">
                          <MapPin size={13} className="text-red-500 shrink-0" />
                          <span>القاعة: <strong>{item.hall}</strong></span>
                        </div>
                      )}

                      {/* Due Date Display */}
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/50 p-2.5 rounded-xl border border-gray-100 dark:border-slate-700 mb-4">
                        <Calendar size={14} className="text-primary shrink-0" />
                        <span>
                          <strong>{isAssignment ? 'آخر موعد للتسليم:' : 'تاريخ وموعد الامتحان:'}</strong>{' '}
                          {new Date(item.timestamp).toLocaleString('ar-IQ', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-3 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                      {isAssignment ? (
                        <button
                          type="button"
                          onClick={() => item.originalAssignment && onToggleAssignmentDone(item.originalAssignment)}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            item.isCompleted
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-gray-100 dark:bg-slate-700 hover:bg-primary hover:text-white text-gray-700 dark:text-gray-200'
                          }`}
                        >
                          {item.isCompleted ? (
                            <>
                              <CheckCircle size={15} />
                              <span>أتممت الواجب بنجاح ✅</span>
                            </>
                          ) : (
                            <>
                              <Square size={15} />
                              <span>تحديد كمنجز</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => item.originalExam && setSelectedExamDetails(item.originalExam)}
                          className="flex-1 py-2.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Award size={15} />
                          <span>عرض تفاصيل الامتحان والمادة ➔</span>
                        </button>
                      )}

                      {/* Manager Controls */}
                      {isManager && (
                        <div className="flex items-center gap-1">
                          {isAssignment ? (
                            <>
                              <button
                                type="button"
                                onClick={() => item.originalAssignment && onOpenEditAssignment(item.originalAssignment)}
                                className="p-2 text-gray-400 hover:text-primary transition rounded-lg"
                                title="تعديل الواجب"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => item.originalAssignment && onDeleteAssignment(item.originalAssignment.id)}
                                className="p-2 text-gray-400 hover:text-red-500 transition rounded-lg"
                                title="حذف الواجب"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => item.originalExam && onDeleteExam(item.originalExam.id)}
                              className="p-2 text-gray-400 hover:text-red-500 transition rounded-lg"
                              title="حذف الامتحان"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: LECTURES & MATERIALS */}
      {activeSubTab === 'materials' && (
        <div className="animate-in fade-in duration-200">
          {renderMaterialsContent()}
        </div>
      )}

      {/* SUB-TAB 3: STUDENT SUMMARIES & NOTES */}
      {activeSubTab === 'summaries' && (
        <div className="animate-in fade-in duration-200">
          <StudentSummariesHub
            currentUser={currentUser}
            allUsers={appUsers}
            courses={courses}
            summaries={studentSummaries}
            effectiveBatchCode={effectiveBatchCode || ''}
            isManager={isManager}
            onPreviewImage={onPreviewImage}
            onViewProfile={onViewProfile}
          />
        </div>
      )}

      {/* MODAL: ADD EXAM */}
      {isAddExamModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-slate-700 animate-in zoom-in-95 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-700">
              <h3 className="font-black text-lg text-gray-800 dark:text-white flex items-center gap-2">
                <Award className="text-purple-600" size={22} />
                <span>إضافة موعد امتحان أو كويز جديد 🎓</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddExamModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateExamSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                  عنوان الامتحان <span className="text-red-500">*</span>:
                </label>
                <input
                  type="text"
                  value={newExamTitle}
                  onChange={(e) => setNewExamTitle(e.target.value)}
                  placeholder="مثال: كويز المحاضرة الأولى / امتحان الشهر الأول"
                  className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2.5 font-bold outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                    المادة الدراسية <span className="text-red-500">*</span>:
                  </label>
                  <select
                    value={newExamCourseId}
                    onChange={(e) => setNewExamCourseId(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2.5 font-bold outline-none cursor-pointer"
                    required
                  >
                    <option value="">اختر المادة...</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                    نوع الامتحان:
                  </label>
                  <select
                    value={newExamType}
                    onChange={(e) => setNewExamType(e.target.value as any)}
                    className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2.5 font-bold outline-none cursor-pointer"
                  >
                    <option value="QUIZ">كويز سريع</option>
                    <option value="MIDTERM">شهري / نصفي</option>
                    <option value="FINAL">امتحان نهائي فاينل</option>
                    <option value="PRACTICAL">امتحان عملي</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                    تاريخ وتوقيت الامتحان <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="datetime-local"
                    value={newExamDateTime}
                    onChange={(e) => setNewExamDateTime(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2.5 font-bold outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                    القاعة الامتحانية (اختياري):
                  </label>
                  <input
                    type="text"
                    value={newExamHall}
                    onChange={(e) => setNewExamHall(e.target.value)}
                    placeholder="مثال: القاعة 4 / مدرج 2"
                    className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2.5 font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                  المادة المقررة والملاحظات (اختياري):
                </label>
                <textarea
                  value={newExamTopics}
                  onChange={(e) => setNewExamTopics(e.target.value)}
                  placeholder="مثال: من المحاضرة الأولى إلى صفحة 45 + أمثلة الشيت..."
                  className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 outline-none h-20 resize-none font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddExamModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSavingExam}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 active:scale-95 disabled:opacity-50"
                >
                  {isSavingExam ? 'جاري الحفظ...' : 'نشر موعد الامتحان 📢'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EXAM DETAILS VIEW */}
      {selectedExamDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
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
              {isManager && (
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm('هل أنت متأكد من حذف هذا الامتحان؟')) {
                      await onDeleteExam(selectedExamDetails.id);
                      setSelectedExamDetails(null);
                    }
                  }}
                  className="py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Trash2 size={14} />
                  <span>حذف الامتحان</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedExamDetails(null)}
                className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold text-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
