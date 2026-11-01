import React, { useState, useMemo } from 'react';
import {
  FileText,
  Award,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Send,
  Bell,
  Trophy,
  Sparkles,
  Users,
  Search,
  Filter,
  Check,
  Calendar,
  Layers,
  ChevronDown,
  Info,
  Clock,
  Edit3,
} from 'lucide-react';
import { Course, Exam, Grade, User } from '../types';

interface QuizResultsHubProps {
  currentUser: User | null;
  isManager: boolean;
  canManageGrades: boolean;
  courses: Course[];
  exams: Exam[];
  grades: Grade[];
  students: User[];
  effectiveBatchCode: string;
  onSaveQuizGrades: (
    exam: Exam,
    studentGrades: { studentId: string; score: number; notes?: string }[],
    maxScore: number,
    publishNotification: boolean
  ) => Promise<void>;
  onCreateExam?: (examData: Partial<Exam>) => Promise<void>;
  onDeleteExam?: (examId: string) => Promise<void>;
}

export const QuizResultsHub: React.FC<QuizResultsHubProps> = ({
  currentUser,
  isManager,
  canManageGrades,
  courses,
  exams,
  grades,
  students,
  effectiveBatchCode,
  onSaveQuizGrades,
  onCreateExam,
  onDeleteExam,
}) => {
  // Course Filter
  const [selectedCourseId, setSelectedCourseId] = useState<string>('ALL');

  // Currently Selected Exam for viewing/grading
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  // New Exam Modal
  const [isCreatingQuiz, setIsCreatingQuiz] = useState<boolean>(false);
  const [newQuizTitle, setNewQuizTitle] = useState<string>('');
  const [newQuizCourseId, setNewQuizCourseId] = useState<string>('');
  const [newQuizMaxScore, setNewQuizMaxScore] = useState<number>(10);
  const [newQuizType, setNewQuizType] = useState<'QUIZ' | 'MIDTERM' | 'PRACTICAL'>('QUIZ');
  const [newQuizDate, setNewQuizDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newQuizTopics, setNewQuizTopics] = useState<string>('');

  // Draft Grades during grading: Map of studentId -> { score: number | string, notes?: string }
  const [draftGrades, setDraftGrades] = useState<Record<string, { score: string; notes: string }>>({});
  const [draftMaxScore, setDraftMaxScore] = useState<number>(10);
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [groupFilter, setGroupFilter] = useState<string>('ALL');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Filter exams by course
  const filteredExams = useMemo(() => {
    return exams.filter((e) => {
      if (selectedCourseId !== 'ALL' && e.courseId !== selectedCourseId) return false;
      return true;
    }).sort((a, b) => b.examTimestamp - a.examTimestamp);
  }, [exams, selectedCourseId]);

  // Active Exam
  const activeExam = useMemo(() => {
    if (!selectedExamId) {
      return filteredExams[0] || null;
    }
    return exams.find((e) => e.id === selectedExamId) || filteredExams[0] || null;
  }, [selectedExamId, filteredExams, exams]);

  // Load existing grades into draft when activeExam changes
  React.useEffect(() => {
    if (activeExam) {
      const assessmentKey = `exam_quiz_${activeExam.id}`;
      const existingExamGrades = grades.filter((g) => g.assessmentId === assessmentKey);
      const newDraft: Record<string, { score: string; notes: string }> = {};

      students.forEach((s) => {
        const found = existingExamGrades.find((g) => g.studentId === s.uid);
        newDraft[s.uid] = {
          score: found !== undefined && found.score !== null ? String(found.score) : '',
          notes: '',
        };
      });

      setDraftGrades(newDraft);
      setDraftMaxScore(activeExam.maxScore || 10);
      setSaveSuccessMsg(null);
    }
  }, [activeExam, grades, students]);

  // Unique groups among students
  const availableGroups = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.academicGroup) set.add(s.academicGroup);
    });
    return Array.from(set).sort();
  }, [students]);

  // Filtered students for grading table
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (groupFilter !== 'ALL' && s.academicGroup !== groupFilter) return false;
      if (studentSearchQuery.trim()) {
        const q = studentSearchQuery.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchId = s.studentId?.toLowerCase().includes(q);
        if (!matchName && !matchId) return false;
      }
      return true;
    });
  }, [students, groupFilter, studentSearchQuery]);

  // Computed Stats for the currently selected exam
  const examStats = useMemo(() => {
    if (!activeExam) return { totalGraded: 0, average: 0, highest: 0, passCount: 0, passRate: 0 };
    const assessmentKey = `exam_quiz_${activeExam.id}`;
    const examGrades = grades.filter((g) => g.assessmentId === assessmentKey);
    const validScores = examGrades.map((g) => Number(g.score)).filter((s) => !isNaN(s));

    const totalGraded = validScores.length;
    if (totalGraded === 0) {
      return { totalGraded: 0, average: 0, highest: 0, passCount: 0, passRate: 0 };
    }

    const sum = validScores.reduce((acc, curr) => acc + curr, 0);
    const average = Math.round((sum / totalGraded) * 10) / 10;
    const highest = Math.max(...validScores);
    const max = activeExam.maxScore || 10;
    const passThreshold = max / 2;
    const passCount = validScores.filter((s) => s >= passThreshold).length;
    const passRate = Math.round((passCount / totalGraded) * 100);

    return { totalGraded, average, highest, passCount, passRate };
  }, [activeExam, grades]);

  // Top 3 Scorers for Honor Roll (Safe, only displays highest scorers)
  const honorRoll = useMemo(() => {
    if (!activeExam) return [];
    const assessmentKey = `exam_quiz_${activeExam.id}`;
    const examGrades = grades.filter((g) => g.assessmentId === assessmentKey);

    const scoredStudents = examGrades
      .map((g) => {
        const student = students.find((s) => s.uid === g.studentId);
        return {
          student,
          score: Number(g.score),
        };
      })
      .filter((item) => item.student && !isNaN(item.score))
      .sort((a, b) => b.score - a.score);

    return scoredStudents.slice(0, 3);
  }, [activeExam, grades, students]);

  // Quick Score Setter for a student
  const handleScoreChange = (studentId: string, val: string) => {
    setDraftGrades((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        score: val,
      },
    }));
  };

  // Handle Save / Publish
  const handleCommitGrades = async (publishNotification: boolean) => {
    if (!activeExam) return;
    setIsSaving(true);
    try {
      const formatted = (Object.entries(draftGrades) as [string, { score: string; notes: string }][])
        .filter(([_, data]) => data.score !== '' && !isNaN(Number(data.score)))
        .map(([studentId, data]) => ({
          studentId,
          score: Number(data.score),
          notes: data.notes || undefined,
        }));

      await onSaveQuizGrades(activeExam, formatted, draftMaxScore, publishNotification);
      setSaveSuccessMsg(
        publishNotification
          ? 'تم نشر وإعلان نتائج الكويز بنجاح وإشعار جميع طلاب الدفعة! 📢'
          : 'تم حفظ مسودة الدرجات بنجاح بدون إرسال إشعارات للطلاب. 💾'
      );
      setTimeout(() => setSaveSuccessMsg(null), 5000);
    } catch (err) {
      console.error('Error committing quiz grades:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Create Quiz Submit
  const handleCreateQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuizTitle.trim() || !newQuizCourseId) return;

    const selectedCourse = courses.find((c) => c.id === newQuizCourseId);
    if (!selectedCourse) return;

    if (onCreateExam) {
      await onCreateExam({
        title: newQuizTitle.trim(),
        courseId: selectedCourse.id,
        courseName: selectedCourse.name,
        type: newQuizType,
        maxScore: Number(newQuizMaxScore) || 10,
        examDate: newQuizDate,
        examTimestamp: new Date(newQuizDate).getTime() || Date.now(),
        topics: newQuizTopics.trim() || undefined,
        isResultsPublished: false,
      });
    }

    setIsCreatingQuiz(false);
    setNewQuizTitle('');
    setNewQuizTopics('');
  };

  // Helper for performance rating
  const getScoreRating = (score: number, max: number) => {
    const pct = (score / max) * 100;
    if (pct >= 90) return { label: 'ممتاز 🌟', color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
    if (pct >= 80) return { label: 'جيد جداً ✨', color: 'text-blue-700 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800' };
    if (pct >= 70) return { label: 'جيد 👍', color: 'text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' };
    if (pct >= 60) return { label: 'متوسط ⚡', color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
    if (pct >= 50) return { label: 'مقبول ⚠️', color: 'text-orange-700 bg-orange-50 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800' };
    return { label: 'يحتاج لتحسين 🔴', color: 'text-rose-700 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800' };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Hero Explanatory Header */}
      <div className="bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                <FileText size={14} className="text-pink-200" />
                نتائج الكويزات والامتحانات المعلنة
              </span>
              <span className="bg-white/10 px-3 py-1 rounded-full text-xs">
                منفصلة تماماً عن كشف السعي التراكمي من 50
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black mb-1.5 flex items-center gap-2">
              <span>إعلان وتتبع درجات الكويزات والاختبارات 📝</span>
            </h2>
            <p className="opacity-90 text-xs sm:text-sm max-w-2xl leading-relaxed">
              هذا القسم مخصص لنشر درجات الكويزات الدورية، الاختبارات التنافسية، والامتحانات السريعة مع إشعار فوري للطلاب. لا تتداخل هذه الدرجات مع حسابات السعي التراكمي المعتمدة.
            </p>
          </div>

          {canManageGrades && (
            <button
              type="button"
              onClick={() => {
                setNewQuizCourseId(courses[0]?.id || '');
                setIsCreatingQuiz(true);
              }}
              className="bg-white text-indigo-800 hover:bg-pink-50 px-5 py-3 rounded-2xl font-black text-xs sm:text-sm transition shadow-lg flex items-center justify-center gap-2 shrink-0 active:scale-95 cursor-pointer self-start sm:self-auto"
            >
              <Plus size={18} />
              <span>إعلان كويز / امتحان جديد ➕</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      {saveSuccessMsg && (
        <div className="bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-800 dark:text-emerald-200 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in duration-200 shadow-sm">
          <CheckCircle2 size={22} className="text-emerald-500 shrink-0" />
          <p className="text-xs sm:text-sm font-bold flex-1">{saveSuccessMsg}</p>
        </div>
      )}

      {/* Courses Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          onClick={() => setSelectedCourseId('ALL')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition shrink-0 flex items-center gap-2 cursor-pointer ${
            selectedCourseId === 'ALL'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-slate-700 hover:bg-gray-50'
          }`}
        >
          <Layers size={15} />
          <span>جميع المواد</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/10">
            {exams.length}
          </span>
        </button>

        {courses.map((course) => {
          const courseExamsCount = exams.filter((e) => e.courseId === course.id).length;
          return (
            <button
              key={course.id}
              type="button"
              onClick={() => setSelectedCourseId(course.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition shrink-0 flex items-center gap-2 cursor-pointer ${
                selectedCourseId === course.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-slate-700 hover:bg-gray-50'
              }`}
            >
              <span>{course.name}</span>
              {courseExamsCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/10">
                  {courseExamsCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* If No Exams Exist in this filter */}
      {filteredExams.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-10 text-center border border-gray-100 dark:border-slate-700 shadow-sm space-y-4">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400">
            <FileText size={32} />
          </div>
          <h3 className="text-lg font-black text-gray-800 dark:text-white">
            لا توجد كويزات أو اختبارات معلنة حالياً لهذه المادة
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {canManageGrades
              ? 'يمكنك البدء بإعلان كويز جديد وتحديد درجته القصوى ورصد نتائج الطلاب لإشعارهم فورياً.'
              : 'ستظهر هنا نتائج الكويزات فور إعلان الممثل أو المعاون المكلف لها.'}
          </p>
          {canManageGrades && (
            <button
              type="button"
              onClick={() => {
                setNewQuizCourseId(selectedCourseId !== 'ALL' ? selectedCourseId : courses[0]?.id || '');
                setIsCreatingQuiz(true);
              }}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm hover:bg-indigo-700 transition inline-flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Plus size={16} />
              <span>إعلان كويز الآن</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Exam Selector Carousel / Cards */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                الكويزات والاختبارات ({filteredExams.length})
              </span>
              {canManageGrades && (
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                  انقر على أي كويز لعرضه ورصد درجاته
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredExams.map((exam) => {
                const isSelected = activeExam?.id === exam.id;
                const assessmentKey = `exam_quiz_${exam.id}`;
                const gradedCount = grades.filter((g) => g.assessmentId === assessmentKey).length;
                const max = exam.maxScore || 10;

                return (
                  <div
                    key={exam.id}
                    onClick={() => setSelectedExamId(exam.id)}
                    className={`p-4 rounded-2xl cursor-pointer transition border text-right relative overflow-hidden ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-500 shadow-md ring-2 ring-indigo-500/30'
                        : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          exam.isResultsPublished
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
                        }`}
                      >
                        {exam.isResultsPublished ? '🟢 معلن للطلاب' : '🟡 مسودة'}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                        <Calendar size={11} />
                        {exam.examDate}
                      </span>
                    </div>

                    <h4 className="font-black text-sm text-gray-900 dark:text-white mb-1 line-clamp-1">
                      {exam.title}
                    </h4>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mb-3">
                      {exam.courseName}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-slate-700/80 pt-2">
                      <span className="font-medium">
                        الدرجة القصوى: <strong className="text-gray-900 dark:text-white">{max}</strong>
                      </span>
                      <span className="text-[11px]">
                        رُصد: <strong className="text-indigo-600 dark:text-indigo-400">{gradedCount}</strong>/{students.length}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Exam Details and Grading / Results section */}
          {activeExam && (
            <div className="space-y-6">
              {/* Exam Highlight Card & Overview */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-slate-700">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
                        {activeExam.courseName}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={13} />
                        تاريخ الاختبار: {activeExam.examDate}
                      </span>
                      {activeExam.topics && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                          المادة: {activeExam.topics}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                      <span>{activeExam.title}</span>
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                        (من {activeExam.maxScore || 10} درجات)
                      </span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {canManageGrades && onDeleteExam && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm(`هل أنت متأكد من حذف ${activeExam.title}؟`)) {
                            await onDeleteExam(activeExam.id);
                            setSelectedExamId(null);
                          }
                        }}
                        className="px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 size={15} />
                        <span>حذف الكويز</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Live Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6">
                  <div className="bg-gray-50 dark:bg-slate-900/50 p-3.5 rounded-2xl text-center border border-gray-100 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block mb-1">
                      الطلاب المرصودون
                    </span>
                    <span className="text-lg font-black text-gray-900 dark:text-white">
                      {examStats.totalGraded} <span className="text-xs text-gray-400">/ {students.length}</span>
                    </span>
                  </div>

                  <div className="bg-gray-50 dark:bg-slate-900/50 p-3.5 rounded-2xl text-center border border-gray-100 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block mb-1">
                      متوسط درجات الدفعة
                    </span>
                    <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                      {examStats.average} <span className="text-xs text-gray-400">/ {activeExam.maxScore || 10}</span>
                    </span>
                  </div>

                  <div className="bg-gray-50 dark:bg-slate-900/50 p-3.5 rounded-2xl text-center border border-gray-100 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block mb-1">
                      أعلى درجة محققة
                    </span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                      {examStats.highest} <span className="text-xs text-gray-400">/ {activeExam.maxScore || 10}</span>
                    </span>
                  </div>

                  <div className="bg-gray-50 dark:bg-slate-900/50 p-3.5 rounded-2xl text-center border border-gray-100 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block mb-1">
                      نسبة النجاح
                    </span>
                    <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                      %{examStats.passRate}
                    </span>
                  </div>
                </div>

                {/* Honor Roll (Top 3 Scorers) */}
                {honorRoll.length > 0 && activeExam.isResultsPublished && (
                  <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-3">
                      <Trophy size={18} className="text-amber-500" />
                      <h4 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        لوحة الشرف لأعلى الدرجات بالكويز 🌟
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {honorRoll.map((item, idx) => {
                        const medals = ['🥇 المركز الأول', '🥈 المركز الثاني', '🥉 المركز الثالث'];
                        const medalColors = [
                          'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60',
                          'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-600',
                          'bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-700/60',
                        ];
                        return (
                          <div
                            key={item.student?.uid || idx}
                            className={`p-3 rounded-2xl border flex items-center justify-between ${medalColors[idx]}`}
                          >
                            <div className="flex items-center gap-2.5">
                              {item.student?.avatar ? (
                                <img
                                  src={item.student.avatar}
                                  alt={item.student.name}
                                  className="w-9 h-9 rounded-full object-cover border border-white dark:border-slate-700 shadow-xs"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                                  {item.student?.name.slice(0, 1) || 'ط'}
                                </div>
                              )}
                              <div>
                                <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 block">
                                  {medals[idx]}
                                </span>
                                <h5 className="font-black text-xs text-gray-900 dark:text-white">
                                  {item.student?.name}
                                </h5>
                              </div>
                            </div>
                            <span className="font-black text-sm text-indigo-700 dark:text-indigo-300">
                              {item.score} / {activeExam.maxScore || 10}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* STUDENT PERSONAL RESULT HERO (If the user is a student or looking at their score) */}
              {currentUser && !canManageGrades && (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm">
                  {(() => {
                    const assessmentKey = `exam_quiz_${activeExam.id}`;
                    const myGrade = grades.find(
                      (g) => g.assessmentId === assessmentKey && g.studentId === currentUser.uid
                    );
                    const max = activeExam.maxScore || 10;

                    if (!activeExam.isResultsPublished) {
                      return (
                        <div className="text-center py-6 space-y-3">
                          <Clock size={32} className="mx-auto text-amber-500" />
                          <h4 className="font-black text-base text-gray-800 dark:text-white">
                            نتائج هذا الكويز قيد التصحيح والرصد ⏳
                          </h4>
                          <p className="text-xs text-gray-500 max-w-sm mx-auto">
                            يقوم الممثل أو المعاون برصد الدرجات حالياً. سيصلك إشعار فوري بمجرد إعلان النتائج!
                          </p>
                        </div>
                      );
                    }

                    if (myGrade === undefined || myGrade.score === null) {
                      return (
                        <div className="text-center py-6 space-y-3">
                          <AlertCircle size={32} className="mx-auto text-gray-400" />
                          <h4 className="font-black text-base text-gray-800 dark:text-white">
                            لم تُسجل لك درجة في هذا الكويز
                          </h4>
                          <p className="text-xs text-gray-500 max-w-sm mx-auto">
                            إذا كنت قد أديت الاختبار، يرجى مراجعة ممثل الدفعة أو مسؤول الدرجات.
                          </p>
                        </div>
                      );
                    }

                    const rating = getScoreRating(Number(myGrade.score), max);
                    const percentage = Math.round((Number(myGrade.score) / max) * 100);

                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-gray-500 uppercase tracking-wider">
                            نتيجتك الشخصية في الكويز
                          </span>
                          <span className={`text-xs font-black px-3 py-1 rounded-full border ${rating.color}`}>
                            {rating.label}
                          </span>
                        </div>

                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <span className="text-xs text-indigo-700 dark:text-indigo-300 font-bold block mb-1">
                              الدرجة المحققة:
                            </span>
                            <div className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white flex items-baseline gap-1.5">
                              <span>{myGrade.score}</span>
                              <span className="text-lg text-gray-400 font-medium">/ {max}</span>
                              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-full shadow-xs mr-2">
                                %{percentage}
                              </span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full sm:w-48 space-y-1.5">
                            <div className="flex justify-between text-[11px] font-bold text-gray-600 dark:text-gray-300">
                              <span>نسبة الإنجاز</span>
                              <span>%{percentage}</span>
                            </div>
                            <div className="w-full h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* MANAGER GRADING INTERFACE: Fast Grade Input Table */}
              {canManageGrades && (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm space-y-6">
                  {/* Grading Toolbar */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-base sm:text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <span>رصد وتعديل درجات الطلاب ✍️</span>
                        <span className="text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md">
                          {filteredStudents.length} طالب
                        </span>
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        أدخل درجات الطلاب مباشرة (يدعم الكسور مثل 8.5 أو 9.75)، ثم اضغط على زر النشر للإعلان والإشعار الفوري.
                      </p>
                    </div>

                    {/* Max score adjuster */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-gray-600 dark:text-gray-300 shrink-0">
                        الدرجة القصوى للكويز:
                      </span>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={draftMaxScore}
                        onChange={(e) => setDraftMaxScore(Number(e.target.value) || 10)}
                        className="w-16 px-2 py-1.5 rounded-xl border border-gray-200 dark:border-slate-600 text-center font-black text-sm bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Filters: Search & Group */}
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1">
                      <Search
                        size={16}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        placeholder="ابحث عن طالب بالاسم أو الرقم الأكاديمي..."
                        value={studentSearchQuery}
                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 rounded-xl text-xs sm:text-sm border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {availableGroups.length > 0 && (
                      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                        <button
                          type="button"
                          onClick={() => setGroupFilter('ALL')}
                          className={`px-3 py-2 rounded-xl text-xs font-black cursor-pointer transition ${
                            groupFilter === 'ALL'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          كل الكروبات
                        </button>
                        {availableGroups.map((grp) => (
                          <button
                            key={grp}
                            type="button"
                            onClick={() => setGroupFilter(grp)}
                            className={`px-3 py-2 rounded-xl text-xs font-black cursor-pointer transition ${
                              groupFilter === grp
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
                            }`}
                          >
                            {grp}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Students Grade Table */}
                  <div className="border border-gray-100 dark:border-slate-700 rounded-2xl overflow-hidden">
                    <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-100 dark:divide-slate-700/60">
                      {filteredStudents.length === 0 ? (
                        <div className="p-8 text-center text-xs text-gray-400">
                          لا يوجد طلاب يطابقون البحث
                        </div>
                      ) : (
                        filteredStudents.map((student, idx) => {
                          const currentVal = draftGrades[student.uid]?.score ?? '';
                          const numVal = Number(currentVal);
                          const isFilled = currentVal !== '' && !isNaN(numVal);
                          const rating = isFilled ? getScoreRating(numVal, draftMaxScore) : null;

                          return (
                            <div
                              key={student.uid}
                              className={`p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                                isFilled
                                  ? 'bg-white dark:bg-slate-800'
                                  : 'bg-gray-50/40 dark:bg-slate-850'
                              } hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20`}
                            >
                              {/* Student Info */}
                              <div className="flex items-center gap-3 min-w-[200px]">
                                <span className="text-[11px] font-bold text-gray-400 w-6 text-center">
                                  {idx + 1}
                                </span>
                                {student.avatar ? (
                                  <img
                                    src={student.avatar}
                                    alt={student.name}
                                    className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-slate-700 shadow-xs"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                                    {student.name.slice(0, 1)}
                                  </div>
                                )}
                                <div>
                                  <h5 className="font-black text-sm text-gray-900 dark:text-white leading-tight">
                                    {student.name}
                                  </h5>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {student.academicGroup && (
                                      <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                                        {student.academicGroup}
                                      </span>
                                    )}
                                    {student.studentId && (
                                      <span className="text-[10px] text-gray-400">
                                        #{student.studentId}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Grade Controls */}
                              <div className="flex items-center gap-2 sm:justify-end flex-wrap">
                                {/* Fast Preset buttons */}
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleScoreChange(student.uid, String(draftMaxScore))}
                                    className="px-2 py-1 text-[10px] font-black rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition cursor-pointer"
                                    title="إعطاء الدرجة الكاملة"
                                  >
                                    كاملة ({draftMaxScore})
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleScoreChange(student.uid, String(draftMaxScore / 2))}
                                    className="px-2 py-1 text-[10px] font-black rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition cursor-pointer"
                                    title="إعطاء نصف الدرجة"
                                  >
                                    نصف ({draftMaxScore / 2})
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleScoreChange(student.uid, '0')}
                                    className="px-2 py-1 text-[10px] font-black rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition cursor-pointer"
                                    title="صفر"
                                  >
                                    0
                                  </button>
                                </div>

                                {/* Score Input */}
                                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-xl border border-gray-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500">
                                  <input
                                    type="number"
                                    step="0.25"
                                    min="0"
                                    max={draftMaxScore}
                                    placeholder="--"
                                    value={currentVal}
                                    onChange={(e) => handleScoreChange(student.uid, e.target.value)}
                                    className="w-14 text-center font-black text-sm text-gray-900 dark:text-white bg-transparent focus:outline-none"
                                  />
                                  <span className="text-xs text-gray-400 font-bold">
                                    / {draftMaxScore}
                                  </span>
                                </div>

                                {rating && (
                                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${rating.color}`}>
                                    {rating.label}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Info size={15} className="text-indigo-500 shrink-0" />
                      <span>
                        سيتم حفظ درجات {(Object.values(draftGrades) as { score: string; notes: string }[]).filter((v) => v.score !== '').length} طالب في قاعدة البيانات.
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleCommitGrades(false)}
                        className="flex-1 sm:flex-none px-4 py-3 rounded-2xl font-black text-xs border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition cursor-pointer disabled:opacity-50"
                      >
                        حفظ كمسودة 💾
                      </button>

                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleCommitGrades(true)}
                        className="flex-1 sm:flex-none px-6 py-3 rounded-2xl font-black text-xs text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Send size={16} />
                        <span>إعلان ونشر النتائج للطلاب 📢</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal: Create New Quiz */}
      {isCreatingQuiz && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 dark:border-slate-700 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-gray-900 dark:text-white">
                    إعلان كويز أو امتحان جديد 📝
                  </h3>
                  <p className="text-xs text-gray-500">
                    حدد المادة والدرجة القصوى وتفاصيل الاختبار
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingQuiz(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 flex items-center justify-center hover:bg-gray-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateQuizSubmit} className="space-y-4">
              {/* Course Selector */}
              <div>
                <label className="block text-xs font-black text-gray-700 dark:text-gray-300 mb-1.5">
                  المادة الدراسية *
                </label>
                <select
                  required
                  value={newQuizCourseId}
                  onChange={(e) => setNewQuizCourseId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- اختر المادة --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quiz Title */}
              <div>
                <label className="block text-xs font-black text-gray-700 dark:text-gray-300 mb-1.5">
                  عنوان الكويز أو الاختبار *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: كويز 1 - الأشجار الثنائية، أو امتحان الشهر الأول"
                  value={newQuizTitle}
                  onChange={(e) => setNewQuizTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Type & Max Score */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-gray-700 dark:text-gray-300 mb-1.5">
                    نوع الاختبار
                  </label>
                  <select
                    value={newQuizType}
                    onChange={(e) => setNewQuizType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="QUIZ">كويز دوري / أسبوعي ⚡</option>
                    <option value="MIDTERM">امتحان شهري / فصلي 📑</option>
                    <option value="PRACTICAL">اختبار عملي / مختبر 🔬</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-700 dark:text-gray-300 mb-1.5">
                    الدرجة القصوى
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={newQuizMaxScore}
                    onChange={(e) => setNewQuizMaxScore(Number(e.target.value) || 10)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white text-xs sm:text-sm font-black text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-black text-gray-700 dark:text-gray-300 mb-1.5">
                  تاريخ الامتحان
                </label>
                <input
                  type="date"
                  value={newQuizDate}
                  onChange={(e) => setNewQuizDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Topics / Material Covered */}
              <div>
                <label className="block text-xs font-black text-gray-700 dark:text-gray-300 mb-1.5">
                  المادة المقررة / الملاحظات (اختياري)
                </label>
                <input
                  type="text"
                  placeholder="مثال: من المحاضرة 1 إلى المحاضرة 4 فقط"
                  value={newQuizTopics}
                  onChange={(e) => setNewQuizTopics(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsCreatingQuiz(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-black text-xs text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
                >
                  إنشاء الكويز وبدء الرصد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
