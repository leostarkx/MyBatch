import React, { useState, useMemo, useRef } from 'react';
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
  RefreshCw,
  RotateCcw,
  Download,
  Share2,
  Lock,
  Globe,
  PieChart,
  BarChart2,
  TrendingUp,
  TrendingDown,
  XCircle,
  X,
  Camera,
  CheckCircle,
  Eye,
  EyeOff,
  Sliders,
  LayoutGrid,
  List,
  ArrowUpDown,
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
  onUpdateExam?: (exam: Exam) => Promise<void>;
  onDeleteExam?: (examId: string) => Promise<void>;
  onUpdateStudentNickname?: (studentUid: string, nickname: string) => Promise<void>;
}

// Helper for performance rating (module scope to prevent TDZ/initialization issues)
const getScoreRating = (score: number, max: number) => {
  const pct = (score / max) * 100;
  if (pct >= 90) return { label: 'ممتاز 🌟', color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
  if (pct >= 80) return { label: 'جيد جداً ✨', color: 'text-blue-700 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800' };
  if (pct >= 70) return { label: 'جيد 👍', color: 'text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' };
  if (pct >= 60) return { label: 'متوسط ⚡', color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
  if (pct >= 50) return { label: 'مقبول ⚠️', color: 'text-orange-700 bg-orange-50 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800' };
  return { label: 'يحتاج لتحسين 🔴', color: 'text-rose-700 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800' };
};

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
  onUpdateExam,
  onDeleteExam,
  onUpdateStudentNickname,
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
  const [newQuizPassScore, setNewQuizPassScore] = useState<number>(5);
  const [newQuizVisibility, setNewQuizVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [newQuizType, setNewQuizType] = useState<'QUIZ' | 'MIDTERM' | 'PRACTICAL'>('QUIZ');
  const [newQuizDate, setNewQuizDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newQuizTopics, setNewQuizTopics] = useState<string>('');

  // Export & Share State
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [showStatsDistribution, setShowStatsDistribution] = useState<boolean>(true);
  const [editingPassScoreExamId, setEditingPassScoreExamId] = useState<string | null>(null);
  const [tempPassScoreVal, setTempPassScoreVal] = useState<number>(5);

  // Grade Sheet Browser Modal State
  const [showGradeSheetModal, setShowGradeSheetModal] = useState<boolean>(false);
  const [browserSearchQuery, setBrowserSearchQuery] = useState<string>('');
  const [browserFilterStatus, setBrowserFilterStatus] = useState<'ALL' | 'PASSED' | 'FAILED' | 'UNGRADED'>('ALL');
  const [browserGroupFilter, setBrowserGroupFilter] = useState<string>('ALL');
  const [browserSortBy, setBrowserSortBy] = useState<'SCORE_DESC' | 'SCORE_ASC' | 'NAME'>('SCORE_DESC');
  const [browserViewMode, setBrowserViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');

  const reportPrintRef = useRef<HTMLDivElement>(null);
  const graphicCardRef = useRef<HTMLDivElement>(null);

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

  // Reference to prevent wiping draft while the user is actively entering or editing grades
  const lastLoadedExamIdRef = useRef<string | null>(null);
  const isDirtyRef = useRef<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [hasDraftRestored, setHasDraftRestored] = useState<boolean>(false);
  const scoreInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Helper to generate unique storage key for batch + exam
  const getDraftStorageKey = (examId: string) => `draft_quiz_grades_${effectiveBatchCode}_${examId}`;

  // Load existing grades into draft ONLY when activeExam changes to a different exam ID
  React.useEffect(() => {
    if (!activeExam) return;
    const examId = activeExam.id;

    // CRITICAL FIX: If we are already editing this exam, NEVER wipe the user's active inputs due to background updates
    if (lastLoadedExamIdRef.current === examId) {
      return;
    }

    lastLoadedExamIdRef.current = examId;
    isDirtyRef.current = false;
    setHasUnsavedChanges(false);

    // Check sessionStorage for any recovered uncommitted draft
    let restoredFromStorage = false;
    try {
      const cached = sessionStorage.getItem(getDraftStorageKey(examId));
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.grades) {
          setDraftGrades(parsed.grades);
          if (typeof parsed.maxScore === 'number' && parsed.maxScore > 0) {
            setDraftMaxScore(parsed.maxScore);
          } else {
            setDraftMaxScore(activeExam.maxScore || 10);
          }
          isDirtyRef.current = true;
          setHasUnsavedChanges(true);
          setHasDraftRestored(true);
          restoredFromStorage = true;
        }
      }
    } catch (e) {
      console.warn('Could not read cached draft:', e);
    }

    if (!restoredFromStorage) {
      const assessmentKey = `exam_quiz_${examId}`;
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
      setHasDraftRestored(false);
    }

    setSaveSuccessMsg(null);
  }, [activeExam?.id, effectiveBatchCode]);

  // Synchronize student additions without touching or resetting existing student drafts
  React.useEffect(() => {
    if (!activeExam) return;
    setDraftGrades((prev) => {
      let hasMissing = false;
      const next = { ...prev };
      students.forEach((s) => {
        if (!(s.uid in next)) {
          hasMissing = true;
          next[s.uid] = { score: '', notes: '' };
        }
      });
      return hasMissing ? next : prev;
    });
  }, [students, activeExam?.id]);

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
    return students
      .filter((s) => {
        if (groupFilter !== 'ALL' && s.academicGroup !== groupFilter) return false;
        if (studentSearchQuery.trim()) {
          const q = studentSearchQuery.toLowerCase();
          const matchName = s.name.toLowerCase().includes(q);
          const matchNick = s.repNickname?.toLowerCase().includes(q);
          const matchId = s.studentId?.toLowerCase().includes(q);
          if (!matchName && !matchNick && !matchId) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const nameA = a.repNickname?.trim() || a.name.trim();
        const nameB = b.repNickname?.trim() || b.name.trim();
        return nameA.localeCompare(nameB, 'ar', { sensitivity: 'base' });
      });
  }, [students, groupFilter, studentSearchQuery]);

  // Computed Stats and Grade Distribution for the currently selected exam
  const examStats = useMemo(() => {
    if (!activeExam) {
      return {
        totalGraded: 0,
        average: 0,
        highest: 0,
        lowest: 0,
        passThreshold: 5,
        passCount: 0,
        failCount: 0,
        passRate: 0,
        failRate: 0,
        distribution: [] as {
          key: string;
          label: string;
          count: number;
          percentage: number;
          color: string;
          bgColor: string;
          rangeText: string;
        }[],
        distributionTotal: 0,
      };
    }

    const assessmentKey = `exam_quiz_${activeExam.id}`;
    const examGrades = grades.filter((g) => g.assessmentId === assessmentKey);
    const validScores = examGrades.map((g) => Number(g.score)).filter((s) => !isNaN(s));

    const totalGraded = validScores.length;
    const max = activeExam.maxScore || 10;
    const passThreshold =
      typeof activeExam.passScore === 'number' && activeExam.passScore >= 0
        ? activeExam.passScore
        : Math.round((max / 2) * 10) / 10;

    if (totalGraded === 0) {
      return {
        totalGraded: 0,
        average: 0,
        highest: 0,
        lowest: 0,
        passThreshold,
        passCount: 0,
        failCount: 0,
        passRate: 0,
        failRate: 0,
        distribution: [
          { key: 'EXCELLENT', label: 'ممتاز', count: 0, percentage: 0, color: 'text-emerald-700 dark:text-emerald-300', bgColor: 'bg-emerald-500', rangeText: `90% - 100% (≥ ${(max * 0.9).toFixed(1)})` },
          { key: 'VERY_GOOD', label: 'جيد جداً', count: 0, percentage: 0, color: 'text-blue-700 dark:text-blue-300', bgColor: 'bg-blue-500', rangeText: `80% - 89% (${(max * 0.8).toFixed(1)} - ${(max * 0.89).toFixed(1)})` },
          { key: 'GOOD', label: 'جيد', count: 0, percentage: 0, color: 'text-indigo-700 dark:text-indigo-300', bgColor: 'bg-indigo-500', rangeText: `70% - 79% (${(max * 0.7).toFixed(1)} - ${(max * 0.79).toFixed(1)})` },
          { key: 'MEDIUM', label: 'متوسط', count: 0, percentage: 0, color: 'text-amber-700 dark:text-amber-300', bgColor: 'bg-amber-500', rangeText: `60% - 69% (${(max * 0.6).toFixed(1)} - ${(max * 0.69).toFixed(1)})` },
          { key: 'ACCEPTABLE', label: 'مقبول', count: 0, percentage: 0, color: 'text-orange-700 dark:text-orange-300', bgColor: 'bg-orange-500', rangeText: `${passThreshold} إلى < ${(max * 0.6).toFixed(1)}` },
          { key: 'FAIL', label: 'راسب', count: 0, percentage: 0, color: 'text-rose-700 dark:text-rose-300', bgColor: 'bg-rose-500', rangeText: `أقل من ${passThreshold}` },
        ],
        distributionTotal: 0,
      };
    }

    const sum = validScores.reduce((acc, curr) => acc + curr, 0);
    const average = Math.round((sum / totalGraded) * 10) / 10;
    const highest = Math.max(...validScores);
    const lowest = Math.min(...validScores);
    const passCount = validScores.filter((s) => s >= passThreshold).length;
    const failCount = totalGraded - passCount;
    const passRate = Math.round((passCount / totalGraded) * 100);
    const failRate = Math.round((failCount / totalGraded) * 100);

    let excellentCount = 0;
    let veryGoodCount = 0;
    let goodCount = 0;
    let mediumCount = 0;
    let acceptableCount = 0;
    let failTiersCount = 0;

    validScores.forEach((score) => {
      const pct = (score / max) * 100;
      if (score < passThreshold) {
        failTiersCount++;
      } else if (pct >= 90) {
        excellentCount++;
      } else if (pct >= 80) {
        veryGoodCount++;
      } else if (pct >= 70) {
        goodCount++;
      } else if (pct >= 60) {
        mediumCount++;
      } else {
        acceptableCount++;
      }
    });

    const distribution = [
      {
        key: 'EXCELLENT',
        label: 'ممتاز',
        count: excellentCount,
        percentage: Math.round((excellentCount / totalGraded) * 100),
        color: 'text-emerald-700 dark:text-emerald-300',
        bgColor: 'bg-emerald-500',
        rangeText: `90% - 100% (≥ ${(max * 0.9).toFixed(1)})`,
      },
      {
        key: 'VERY_GOOD',
        label: 'جيد جداً',
        count: veryGoodCount,
        percentage: Math.round((veryGoodCount / totalGraded) * 100),
        color: 'text-blue-700 dark:text-blue-300',
        bgColor: 'bg-blue-500',
        rangeText: `80% - 89% (${(max * 0.8).toFixed(1)} - ${(max * 0.89).toFixed(1)})`,
      },
      {
        key: 'GOOD',
        label: 'جيد',
        count: goodCount,
        percentage: Math.round((goodCount / totalGraded) * 100),
        color: 'text-indigo-700 dark:text-indigo-300',
        bgColor: 'bg-indigo-500',
        rangeText: `70% - 79% (${(max * 0.7).toFixed(1)} - ${(max * 0.79).toFixed(1)})`,
      },
      {
        key: 'MEDIUM',
        label: 'متوسط',
        count: mediumCount,
        percentage: Math.round((mediumCount / totalGraded) * 100),
        color: 'text-amber-700 dark:text-amber-300',
        bgColor: 'bg-amber-500',
        rangeText: `60% - 69% (${(max * 0.6).toFixed(1)} - ${(max * 0.69).toFixed(1)})`,
      },
      {
        key: 'ACCEPTABLE',
        label: 'مقبول',
        count: acceptableCount,
        percentage: Math.round((acceptableCount / totalGraded) * 100),
        color: 'text-orange-700 dark:text-orange-300',
        bgColor: 'bg-orange-500',
        rangeText: `${passThreshold} إلى < ${(max * 0.6).toFixed(1)}`,
      },
      {
        key: 'FAIL',
        label: 'راسب',
        count: failTiersCount,
        percentage: Math.round((failTiersCount / totalGraded) * 100),
        color: 'text-rose-700 dark:text-rose-300',
        bgColor: 'bg-rose-500',
        rangeText: `أقل من ${passThreshold}`,
      },
    ];

    return {
      totalGraded,
      average,
      highest,
      lowest,
      passThreshold,
      passCount,
      failCount,
      passRate,
      failRate,
      distribution,
      distributionTotal: totalGraded,
    };
  }, [activeExam, grades]);

  // Toggle Visibility between Public and Private
  const handleToggleVisibility = async () => {
    if (!activeExam || !onUpdateExam) return;
    const currentVis = activeExam.visibility || 'PUBLIC';
    const nextVis: 'PUBLIC' | 'PRIVATE' = currentVis === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
    const updated: Exam = {
      ...activeExam,
      visibility: nextVis,
    };
    await onUpdateExam(updated);
  };

  // Update Pass Score
  const handleSaveCustomPassScore = async (newScore: number) => {
    if (!activeExam || !onUpdateExam) return;
    const max = activeExam.maxScore || 10;
    const cleanScore = Math.max(0, Math.min(max, newScore));
    const updated: Exam = {
      ...activeExam,
      passScore: cleanScore,
    };
    await onUpdateExam(updated);
    setEditingPassScoreExamId(null);
  };

  // Export as Official PDF
  const handleExportPdf = async () => {
    if (!activeExam || !reportPrintRef.current) return;
    setIsExportingPdf(true);
    try {
      const html2pdfModule = (await import('html2pdf.js')).default;
      const element = reportPrintRef.current;
      const opt = {
        margin: [6, 6, 6, 6] as [number, number, number, number],
        filename: `كشف_درجات_${activeExam.title}_${activeExam.courseName}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
      };
      await html2pdfModule().set(opt).from(element).save();
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Generate and Download Image Card (PNG)
  const handleGenerateGraphicImage = async () => {
    if (!activeExam || !graphicCardRef.current) return;
    setIsGeneratingImage(true);
    try {
      const html2canvasModule = (await import('html2canvas')).default;
      const element = graphicCardRef.current;
      const canvas = await html2canvasModule(element, {
        scale: 2.2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const dataUrl = canvas.toDataURL('image/png');
      setCapturedImageUrl(dataUrl);
      setShowShareModal(true);

      const link = document.createElement('a');
      link.download = `بطاقة_نتائج_${activeExam.title}_${activeExam.courseName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating image:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

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

  // Unique academic groups for filtering
  const availableAcademicGroups = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.academicGroup?.trim()) set.add(s.academicGroup.trim());
    });
    return Array.from(set).sort();
  }, [students]);

  // Evaluated student list for Grade Sheet Browser with their scores
  const browserStudentsList = useMemo(() => {
    if (!activeExam) return [];
    const assessmentKey = `exam_quiz_${activeExam.id}`;
    const max = activeExam.maxScore || 10;
    const passThresh =
      typeof activeExam.passScore === 'number' && activeExam.passScore >= 0
        ? activeExam.passScore
        : Math.round((max / 2) * 10) / 10;

    const list = students.map((st) => {
      const gradeObj = grades.find((g) => g.assessmentId === assessmentKey && g.studentId === st.uid);
      const score =
        gradeObj?.score !== undefined && gradeObj?.score !== null
          ? Number(gradeObj.score)
          : null;
      const percentage = score !== null ? Math.round((score / max) * 100) : null;
      const isPass = score !== null ? score >= passThresh : false;
      const rating = score !== null ? getScoreRating(score, max) : null;

      return {
        student: st,
        score,
        percentage,
        isPass,
        rating,
      };
    });

    return list
      .filter((item) => {
        // Search filter
        if (browserSearchQuery.trim()) {
          const q = browserSearchQuery.toLowerCase();
          const matchName = item.student.name.toLowerCase().includes(q);
          const matchNick = item.student.repNickname?.toLowerCase().includes(q);
          const matchId = item.student.studentId?.toLowerCase().includes(q);
          if (!matchName && !matchNick && !matchId) return false;
        }
        // Group filter
        if (browserGroupFilter !== 'ALL' && item.student.academicGroup !== browserGroupFilter) {
          return false;
        }
        // Status filter
        if (browserFilterStatus === 'PASSED') {
          return item.score !== null && item.isPass;
        }
        if (browserFilterStatus === 'FAILED') {
          return item.score !== null && !item.isPass;
        }
        if (browserFilterStatus === 'UNGRADED') {
          return item.score === null;
        }
        return true;
      })
      .sort((a, b) => {
        if (browserSortBy === 'SCORE_DESC') {
          if (a.score === null && b.score === null) return 0;
          if (a.score === null) return 1;
          if (b.score === null) return -1;
          return b.score - a.score;
        }
        if (browserSortBy === 'SCORE_ASC') {
          if (a.score === null && b.score === null) return 0;
          if (a.score === null) return 1;
          if (b.score === null) return -1;
          return a.score - b.score;
        }
        // NAME
        const nameA = a.student.repNickname?.trim() || a.student.name.trim();
        const nameB = b.student.repNickname?.trim() || b.student.name.trim();
        return nameA.localeCompare(nameB, 'ar', { sensitivity: 'base' });
      });
  }, [
    activeExam,
    grades,
    students,
    browserSearchQuery,
    browserGroupFilter,
    browserFilterStatus,
    browserSortBy,
  ]);

  // All students with scores prepared for Image Snapshot (sorted by score descending, ties by name)
  const sortedScoredStudentsForGraphic = useMemo(() => {
    if (!activeExam) return [];
    const assessmentKey = `exam_quiz_${activeExam.id}`;
    const max = activeExam.maxScore || 10;
    const passThresh =
      typeof activeExam.passScore === 'number' && activeExam.passScore >= 0
        ? activeExam.passScore
        : Math.round((max / 2) * 10) / 10;

    return students
      .map((st) => {
        const gradeObj = grades.find((g) => g.assessmentId === assessmentKey && g.studentId === st.uid);
        const score =
          gradeObj?.score !== undefined && gradeObj?.score !== null
            ? Number(gradeObj.score)
            : null;
        const percentage = score !== null ? Math.round((score / max) * 100) : null;
        const isPass = score !== null ? score >= passThresh : false;
        const rating = score !== null ? getScoreRating(score, max) : null;

        return {
          student: st,
          score,
          percentage,
          isPass,
          rating,
        };
      })
      .sort((a, b) => {
        if (a.score === null && b.score === null) return 0;
        if (a.score === null) return 1;
        if (b.score === null) return -1;
        if (b.score !== a.score) return b.score - a.score;
        const nameA = a.student.repNickname?.trim() || a.student.name.trim();
        const nameB = b.student.repNickname?.trim() || b.student.name.trim();
        return nameA.localeCompare(nameB, 'ar', { sensitivity: 'base' });
      });
  }, [activeExam, grades, students]);

  // Quick Score Setter for a student with persistent backup
  const handleScoreChange = (studentId: string, val: string) => {
    isDirtyRef.current = true;
    setHasUnsavedChanges(true);
    setDraftGrades((prev) => {
      const next = {
        ...prev,
        [studentId]: {
          ...prev[studentId],
          score: val,
        },
      };
      if (activeExam) {
        try {
          sessionStorage.setItem(
            getDraftStorageKey(activeExam.id),
            JSON.stringify({ grades: next, maxScore: draftMaxScore })
          );
        } catch (_) {}
      }
      return next;
    });
  };

  // Max score adjuster with persistent backup
  const handleMaxScoreChange = (val: number) => {
    const cleanVal = isNaN(val) || val <= 0 ? 10 : val;
    isDirtyRef.current = true;
    setHasUnsavedChanges(true);
    setDraftMaxScore(cleanVal);
    if (activeExam) {
      try {
        sessionStorage.setItem(
          getDraftStorageKey(activeExam.id),
          JSON.stringify({ grades: draftGrades, maxScore: cleanVal })
        );
      } catch (_) {}
    }
  };

  // Manual Reload from Server
  const handleReloadFromServer = (force = false) => {
    if (!activeExam) return;
    if (
      !force &&
      hasUnsavedChanges &&
      !window.confirm('لديك تعديلات غير محفوظة، هل أنت متأكد من إعادة تحميل الدرجات المسجلة في السيرفر وإلغاء مسودتك الحالية؟')
    ) {
      return;
    }
    const examId = activeExam.id;
    try {
      sessionStorage.removeItem(getDraftStorageKey(examId));
    } catch (_) {}

    const assessmentKey = `exam_quiz_${examId}`;
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
    isDirtyRef.current = false;
    setHasUnsavedChanges(false);
    setHasDraftRestored(false);
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

      // Successfully saved - clear local cache & dirty states
      try {
        sessionStorage.removeItem(getDraftStorageKey(activeExam.id));
      } catch (_) {}
      isDirtyRef.current = false;
      setHasUnsavedChanges(false);
      setHasDraftRestored(false);

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
        passScore: Number(newQuizPassScore) || Math.round(((Number(newQuizMaxScore) || 10) / 2) * 10) / 10,
        visibility: newQuizVisibility,
        examDate: newQuizDate,
        examTimestamp: new Date(newQuizDate).getTime() || Date.now(),
        topics: newQuizTopics.trim() || undefined,
        isResultsPublished: false,
      });
    }

    setIsCreatingQuiz(false);
    setNewQuizTitle('');
    setNewQuizTopics('');
    setNewQuizMaxScore(10);
    setNewQuizPassScore(5);
    setNewQuizVisibility('PUBLIC');
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
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-slate-700">
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
                    <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                      <span>{activeExam.title}</span>
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                        (من {activeExam.maxScore || 10} درجات)
                      </span>
                    </h3>
                  </div>

                  {/* Actions & Settings Toolbar */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Visibility Toggle Button */}
                    <button
                      type="button"
                      disabled={!canManageGrades}
                      onClick={() => canManageGrades && handleToggleVisibility()}
                      className={`px-3 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 border shadow-2xs ${
                        (activeExam.visibility || 'PUBLIC') === 'PUBLIC'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                      } ${canManageGrades ? 'cursor-pointer hover:scale-[1.02] active:scale-95' : 'cursor-default'}`}
                      title={canManageGrades ? 'انقر لتبديل خصوصية النتائج بين عامة للجميع أو خاصة لكل طالب' : 'خصوصية النتائج'}
                    >
                      {(activeExam.visibility || 'PUBLIC') === 'PUBLIC' ? (
                        <>
                          <Globe size={14} className="text-emerald-600 dark:text-emerald-400" />
                          <span>نتائج عامة 🌐</span>
                        </>
                      ) : (
                        <>
                          <Lock size={14} className="text-amber-600 dark:text-amber-400" />
                          <span>نتائج خاصة 🔒</span>
                        </>
                      )}
                    </button>

                    {/* Passing Score Display & Quick Edit */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/40 text-xs font-bold text-indigo-900 dark:text-indigo-200">
                      <span>درجة النجاح:</span>
                      {editingPassScoreExamId === activeExam.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max={activeExam.maxScore || 10}
                            value={tempPassScoreVal}
                            onChange={(e) => setTempPassScoreVal(Number(e.target.value) || 0)}
                            className="w-14 px-1 py-0.5 rounded-lg bg-white dark:bg-slate-900 border text-center font-black text-xs text-gray-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveCustomPassScore(tempPassScoreVal)}
                            className="p-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
                            title="حفظ درجة النجاح"
                          >
                            <Check size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 font-black">
                          <span className="text-indigo-600 dark:text-indigo-400">{examStats.passThreshold}</span>
                          <span className="text-[10px] text-gray-400 font-normal">/ {activeExam.maxScore || 10}</span>
                          {canManageGrades && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPassScoreExamId(activeExam.id);
                                setTempPassScoreVal(examStats.passThreshold);
                              }}
                              className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                              title="تعديل درجة النجاح"
                            >
                              <Edit3 size={11} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Interactive Grade Sheet Browser Button */}
                    <button
                      type="button"
                      onClick={() => setShowGradeSheetModal(true)}
                      className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20 active:scale-95"
                      title="استعراض وتصفح درجات جميع الطلاب بطريقة تفاعلية وبصرية جميلة"
                    >
                      <Eye size={14} />
                      <span>تصفح كشف الدرجات 📋</span>
                    </button>

                    {/* PDF Export Button */}
                    <button
                      type="button"
                      disabled={isExportingPdf || examStats.totalGraded === 0}
                      onClick={handleExportPdf}
                      className="px-3 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                      title="استخراج كشف الدرجات كملف PDF رسمي قابل للطباعة والإرسال"
                    >
                      <Download size={14} />
                      <span>{isExportingPdf ? 'جارٍ التحميل...' : 'تصدير PDF 📄'}</span>
                    </button>

                    {/* PNG Snapshot Button */}
                    <button
                      type="button"
                      disabled={isGeneratingImage || examStats.totalGraded === 0}
                      onClick={handleGenerateGraphicImage}
                      className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                      title="توليد صورة جاهزة للمشاركة الفورية عبر تيليغرام أو واتساب"
                    >
                      <Camera size={14} />
                      <span>{isGeneratingImage ? 'جارٍ التقاطها...' : 'مشاركة كصورة 🖼️'}</span>
                    </button>

                    {/* Delete Quiz */}
                    {canManageGrades && onDeleteExam && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm(`هل أنت متأكد من حذف ${activeExam.title}؟`)) {
                            await onDeleteExam(activeExam.id);
                            setSelectedExamId(null);
                          }
                        }}
                        className="px-2.5 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="حذف الكويز نهائياً"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Comprehensive Live Stats Row (8 Metrics) */}
                <div className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                      <BarChart2 size={16} className="text-indigo-600 dark:text-indigo-400" />
                      <span>المؤشرات الإحصائية العامة للنتائج</span>
                    </span>
                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-700/60 px-2.5 py-0.5 rounded-full">
                      المرصود: {examStats.totalGraded} من {students.length} طالب
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                    {/* 1. أعلى درجة */}
                    <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-3 rounded-2xl text-center border border-emerald-100 dark:border-emerald-800/50">
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 block mb-0.5 flex items-center justify-center gap-1">
                        <TrendingUp size={12} />
                        أعلى درجة
                      </span>
                      <span className="text-lg font-black text-emerald-800 dark:text-emerald-200">
                        {examStats.highest}
                        <span className="text-[10px] text-emerald-600/70 font-normal mr-0.5">/{activeExam.maxScore || 10}</span>
                      </span>
                    </div>

                    {/* 2. أقل درجة */}
                    <div className="bg-rose-50/60 dark:bg-rose-950/30 p-3 rounded-2xl text-center border border-rose-100 dark:border-rose-800/50">
                      <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 block mb-0.5 flex items-center justify-center gap-1">
                        <TrendingDown size={12} />
                        أقل درجة
                      </span>
                      <span className="text-lg font-black text-rose-800 dark:text-rose-200">
                        {examStats.lowest}
                        <span className="text-[10px] text-rose-600/70 font-normal mr-0.5">/{activeExam.maxScore || 10}</span>
                      </span>
                    </div>

                    {/* 3. المعدل العام */}
                    <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-3 rounded-2xl text-center border border-indigo-100 dark:border-indigo-800/50">
                      <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 block mb-0.5">
                        المعدل العام
                      </span>
                      <span className="text-lg font-black text-indigo-800 dark:text-indigo-200">
                        {examStats.average}
                        <span className="text-[10px] text-indigo-600/70 font-normal mr-0.5">/{activeExam.maxScore || 10}</span>
                      </span>
                    </div>

                    {/* 4. درجة النجاح */}
                    <div className="bg-purple-50/60 dark:bg-purple-950/30 p-3 rounded-2xl text-center border border-purple-100 dark:border-purple-800/50">
                      <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 block mb-0.5">
                        درجة النجاح
                      </span>
                      <span className="text-lg font-black text-purple-800 dark:text-purple-200">
                        {examStats.passThreshold}
                        <span className="text-[10px] text-purple-600/70 font-normal mr-0.5">/{activeExam.maxScore || 10}</span>
                      </span>
                    </div>

                    {/* 5. عدد الناجحين */}
                    <div className="bg-teal-50/60 dark:bg-teal-950/30 p-3 rounded-2xl text-center border border-teal-100 dark:border-teal-800/50">
                      <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 block mb-0.5 flex items-center justify-center gap-1">
                        <CheckCircle size={12} />
                        عدد الناجحين
                      </span>
                      <span className="text-lg font-black text-teal-800 dark:text-teal-200">
                        {examStats.passCount}
                        <span className="text-[10px] text-teal-600/70 font-normal mr-0.5">طالب</span>
                      </span>
                    </div>

                    {/* 6. عدد الراسبين */}
                    <div className="bg-red-50/60 dark:bg-red-950/30 p-3 rounded-2xl text-center border border-red-100 dark:border-red-800/50">
                      <span className="text-[10px] font-bold text-red-700 dark:text-red-300 block mb-0.5 flex items-center justify-center gap-1">
                        <XCircle size={12} />
                        عدد الراسبين
                      </span>
                      <span className="text-lg font-black text-red-800 dark:text-red-200">
                        {examStats.failCount}
                        <span className="text-[10px] text-red-600/70 font-normal mr-0.5">طالب</span>
                      </span>
                    </div>

                    {/* 7. نسبة النجاح */}
                    <div className="bg-amber-50/60 dark:bg-amber-950/30 p-3 rounded-2xl text-center border border-amber-100 dark:border-amber-800/50">
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 block mb-0.5">
                        نسبة النجاح
                      </span>
                      <span className="text-lg font-black text-amber-800 dark:text-amber-200">
                        %{examStats.passRate}
                      </span>
                    </div>

                    {/* 8. نسبة الرسوب */}
                    <div className="bg-orange-50/60 dark:bg-orange-950/30 p-3 rounded-2xl text-center border border-orange-100 dark:border-orange-800/50">
                      <span className="text-[10px] font-bold text-orange-700 dark:text-orange-300 block mb-0.5">
                        نسبة الرسوب
                      </span>
                      <span className="text-lg font-black text-orange-800 dark:text-orange-200">
                        %{examStats.failRate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Grade Distribution Section (التوزيع الفئوي للدرجات) */}
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-700 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <PieChart size={16} className="text-indigo-600 dark:text-indigo-400" />
                      <h4 className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                        توزيع الدرجات والتصنيف الفئوي للطلاب 📊
                      </h4>
                    </div>
                    <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">
                      مجموع الطلاب في التوزيع: {examStats.distributionTotal} طالب
                    </span>
                  </div>

                  {/* Multi-segment Distribution Bar */}
                  {examStats.distributionTotal > 0 && (
                    <div className="w-full h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden flex shadow-2xs">
                      {examStats.distribution.map((tier) => {
                        if (tier.percentage <= 0) return null;
                        return (
                          <div
                            key={tier.key}
                            style={{ width: `${tier.percentage}%` }}
                            className={`${tier.bgColor} transition-all duration-300 relative group cursor-pointer`}
                            title={`${tier.label}: ${tier.count} طالب (${tier.percentage}%)`}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* 6 Category Breakdown Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                    {examStats.distribution.map((tier) => (
                      <div
                        key={tier.key}
                        className="p-3 rounded-2xl bg-gray-50/70 dark:bg-slate-900/40 border border-gray-100 dark:border-slate-800 text-center space-y-1 hover:border-gray-300 dark:hover:border-slate-600 transition"
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${tier.bgColor}`} />
                          <span className={`text-xs font-black ${tier.color}`}>
                            {tier.label}
                          </span>
                        </div>
                        <div className="text-lg font-black text-gray-900 dark:text-white">
                          {tier.count}{' '}
                          <span className="text-[10px] text-gray-400 font-normal">طالب</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-slate-800/80 pt-1">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">%{tier.percentage}</span>
                          <span className="truncate max-w-[80px]" title={tier.rangeText}>{tier.rangeText}</span>
                        </div>
                      </div>
                    ))}
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

              {/* STUDENT PUBLIC / PRIVATE CLASS VIEW */}
              {currentUser && !canManageGrades && activeExam.isResultsPublished && (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm space-y-5">
                  {(activeExam.visibility || 'PUBLIC') === 'PRIVATE' ? (
                    <div className="text-center py-8 px-4 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
                        <Lock size={24} />
                      </div>
                      <h4 className="font-black text-base text-gray-900 dark:text-white">
                        درجات هذا الامتحان خاصة وسرية 🔒
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                        قام ممثل الدفعة بتحديد خصوصية هذا الاختبار كـ <strong>(خاص)</strong>، ولذلك تقتصر الرؤية على نتيجتك الشخصية المعروضة بالأعلى فقط، وتبقى درجات زملائك سرية ومحمية بقرار الممثلية.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-slate-700 pb-4">
                        <div>
                          <h4 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <span>كشف نتائج الطلاب للدفعة 🌐</span>
                            <span className="text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              عامة للجميع
                            </span>
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            استعراض درجات جميع طلاب الدفعة المعلنة في هذا الكويز
                          </p>
                        </div>

                        {/* Search and Browse in public table */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => setShowGradeSheetModal(true)}
                            className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-xl border border-indigo-200 dark:border-indigo-800 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                            title="فتح مستعرض كشف الدرجات التفاعلي بملء الشاشة"
                          >
                            <LayoutGrid size={14} />
                            <span>تصفح كبطاقات 🎴</span>
                          </button>

                          <div className="w-full sm:w-56 relative">
                            <input
                              type="text"
                              placeholder="بحث باسم الطالب..."
                              value={studentSearchQuery}
                              onChange={(e) => setStudentSearchQuery(e.target.value)}
                              className="w-full pl-3 pr-9 py-2 rounded-xl text-xs bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          </div>
                        </div>
                      </div>

                      {/* Read-only Table */}
                      <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-slate-700">
                        <table className="w-full text-right text-xs">
                          <thead className="bg-gray-50/80 dark:bg-slate-900/80 text-gray-500 dark:text-gray-400 font-black border-b border-gray-100 dark:border-slate-700">
                            <tr>
                              <th className="py-3 px-4 w-12 text-center">#</th>
                              <th className="py-3 px-4">اسم الطالب</th>
                              <th className="py-3 px-3 text-center">المجموعة</th>
                              <th className="py-3 px-4 text-center">الدرجة</th>
                              <th className="py-3 px-3 text-center">النسبة</th>
                              <th className="py-3 px-4 text-center">التقدير</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60 font-bold">
                            {filteredStudents.map((st, idx) => {
                              const assessmentKey = `exam_quiz_${activeExam.id}`;
                              const gradeObj = grades.find(
                                (g) => g.assessmentId === assessmentKey && g.studentId === st.uid
                              );
                              const scoreVal =
                                gradeObj?.score !== undefined && gradeObj?.score !== null
                                  ? Number(gradeObj.score)
                                  : null;
                              const max = activeExam.maxScore || 10;
                              const passThresh =
                                activeExam.passScore ?? Math.round((max / 2) * 10) / 10;
                              const isMe = currentUser?.uid === st.uid;

                              return (
                                <tr
                                  key={st.uid}
                                  className={`hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition ${
                                    isMe ? 'bg-indigo-50/60 dark:bg-indigo-950/30 font-black' : ''
                                  }`}
                                >
                                  <td className="py-3 px-4 text-center text-gray-400">{idx + 1}</td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-black flex items-center justify-center text-[10px]">
                                        {st.name.charAt(0)}
                                      </div>
                                      <span className="text-gray-900 dark:text-white">
                                        {st.repNickname || st.name}
                                        {isMe && (
                                          <span className="mr-1.5 text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                                            أنت
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 text-center text-gray-500 dark:text-gray-400">
                                    {st.academicGroup || '-'}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    {scoreVal !== null ? (
                                      <span className="font-black text-gray-900 dark:text-white text-sm">
                                        {scoreVal}{' '}
                                        <span className="text-[10px] text-gray-400 font-normal">
                                          / {max}
                                        </span>
                                      </span>
                                    ) : (
                                      <span className="text-gray-400 font-normal">غائب / لم يرصد</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    {scoreVal !== null ? (
                                      <span className="text-gray-600 dark:text-gray-300">
                                        %{Math.round((scoreVal / max) * 100)}
                                      </span>
                                    ) : (
                                      '-'
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    {scoreVal !== null ? (
                                      scoreVal >= passThresh ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                          <Check size={11} />
                                          {getScoreRating(scoreVal, max).label}
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                          <XCircle size={11} />
                                          راسب
                                        </span>
                                      )
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* MANAGER GRADING INTERFACE: Fast Grade Input Table */}
              {canManageGrades && (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm space-y-6">
                  {/* Grading Toolbar */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-base sm:text-lg font-black text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                        <span>رصد وتعديل درجات الطلاب ✍️</span>
                        <span className="text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md">
                          {filteredStudents.length} طالب
                        </span>
                        {hasUnsavedChanges && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            مسودة قيد التعديل (محمية محلياً ضد الرست)
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        أدخل درجات الطلاب مباشرة (يدعم الكسور مثل 8.5 أو 9.75)، ثم اضغط على زر النشر للإعلان والإشعار الفوري.
                      </p>
                    </div>

                    {/* Max score adjuster & reload */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-900/80 px-3 py-1.5 rounded-2xl border border-gray-200 dark:border-slate-700">
                        <span className="text-xs font-black text-gray-600 dark:text-gray-300 shrink-0">
                          الدرجة القصوى:
                        </span>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={draftMaxScore}
                          onChange={(e) => handleMaxScoreChange(Number(e.target.value))}
                          className="w-16 px-2 py-1 rounded-xl border border-gray-200 dark:border-slate-600 text-center font-black text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleReloadFromServer(false)}
                        className="p-2 px-3 rounded-2xl border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                        title="إعادة تحميل الدرجات المسجلة في السيرفر"
                      >
                        <RefreshCw size={14} />
                        <span className="hidden sm:inline">تحديث من السيرفر</span>
                      </button>
                    </div>
                  </div>

                  {/* Restored draft notice */}
                  {hasDraftRestored && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span>
                          <strong>تم استعادة مسودتك السابقة تلقائياً:</strong> تم استرجاع الدرجات والدرجة القصوى التي كنت تكتبها لحمايتها من الضياع.
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleReloadFromServer(true)}
                          className="px-3 py-1 rounded-xl text-[11px] font-bold bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 transition cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw size={12} />
                          <span>إلغاء واستعادة السيرفر</span>
                        </button>
                      </div>
                    </div>
                  )}

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
                  <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 px-1">
                    <span className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-300">
                      <kbd className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 font-mono text-[10px] font-black border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 shadow-2xs">
                        Enter ↵
                      </kbd>
                      <span>اضغط إنتر للانتقال للطالب التالي مباشرة بعد إدخال الدرجة</span>
                    </span>
                    <span className="hidden sm:inline text-gray-400">
                      يدعم أيضاً الأسهم (↓ / ↑) و (Shift+Enter) للرجوع
                    </span>
                  </div>

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
                                  <h5 className="font-black text-sm text-gray-900 dark:text-white leading-tight flex items-center gap-1.5 flex-wrap">
                                    <span>{student.repNickname || student.name}</span>
                                    {student.repNickname && (
                                      <span className="text-[10px] text-gray-400 font-normal">
                                        (الأصلي: {student.name})
                                      </span>
                                    )}
                                    {canManageGrades && onUpdateStudentNickname && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const val = window.prompt(
                                            'تعيين اسم/لقب الطالب الأبجدي للممثل:',
                                            student.repNickname || student.name
                                          );
                                          if (val !== null) {
                                            onUpdateStudentNickname(student.uid, val.trim());
                                          }
                                        }}
                                        className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                                        title="تعديل اسم أو لقب الطالب لترتيب الكشوفات"
                                      >
                                        <Edit3 size={11} />
                                      </button>
                                    )}
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
                                    onClick={() => {
                                      handleScoreChange(student.uid, String(draftMaxScore));
                                      const nextIdx = idx + 1;
                                      if (nextIdx < filteredStudents.length) {
                                        scoreInputsRef.current[nextIdx]?.focus();
                                        scoreInputsRef.current[nextIdx]?.select();
                                      }
                                    }}
                                    className="px-2 py-1 text-[10px] font-black rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition cursor-pointer"
                                    title="إعطاء الدرجة الكاملة والانتقال للتالي"
                                  >
                                    كاملة ({draftMaxScore})
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleScoreChange(student.uid, String(draftMaxScore / 2));
                                      const nextIdx = idx + 1;
                                      if (nextIdx < filteredStudents.length) {
                                        scoreInputsRef.current[nextIdx]?.focus();
                                        scoreInputsRef.current[nextIdx]?.select();
                                      }
                                    }}
                                    className="px-2 py-1 text-[10px] font-black rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition cursor-pointer"
                                    title="إعطاء نصف الدرجة والانتقال للتالي"
                                  >
                                    نصف ({draftMaxScore / 2})
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleScoreChange(student.uid, '0');
                                      const nextIdx = idx + 1;
                                      if (nextIdx < filteredStudents.length) {
                                        scoreInputsRef.current[nextIdx]?.focus();
                                        scoreInputsRef.current[nextIdx]?.select();
                                      }
                                    }}
                                    className="px-2 py-1 text-[10px] font-black rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition cursor-pointer"
                                    title="صفر والانتقال للتالي"
                                  >
                                    0
                                  </button>
                                </div>

                                {/* Score Input with Enter Key navigation */}
                                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-xl border border-gray-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500">
                                  <input
                                    ref={(el) => {
                                      scoreInputsRef.current[idx] = el;
                                    }}
                                    type="number"
                                    step="0.25"
                                    min="0"
                                    max={draftMaxScore}
                                    placeholder="--"
                                    value={currentVal}
                                    onChange={(e) => handleScoreChange(student.uid, e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const nextIdx = e.shiftKey ? idx - 1 : idx + 1;
                                        if (nextIdx >= 0 && nextIdx < filteredStudents.length) {
                                          scoreInputsRef.current[nextIdx]?.focus();
                                          scoreInputsRef.current[nextIdx]?.select();
                                        }
                                      } else if (e.key === 'ArrowDown') {
                                        e.preventDefault();
                                        if (idx + 1 < filteredStudents.length) {
                                          scoreInputsRef.current[idx + 1]?.focus();
                                          scoreInputsRef.current[idx + 1]?.select();
                                        }
                                      } else if (e.key === 'ArrowUp') {
                                        e.preventDefault();
                                        if (idx - 1 >= 0) {
                                          scoreInputsRef.current[idx - 1]?.focus();
                                          scoreInputsRef.current[idx - 1]?.select();
                                        }
                                      }
                                    }}
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

              {/* Type, Max Score & Pass Score */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-black text-gray-700 dark:text-gray-300 mb-1.5">
                    نوع الاختبار
                  </label>
                  <select
                    value={newQuizType}
                    onChange={(e) => setNewQuizType(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="QUIZ">كويز دوري / أسبوعي ⚡</option>
                    <option value="MIDTERM">امتحان شهري / فصلي 📑</option>
                    <option value="PRACTICAL">اختبار عملي / مختبر 🔬</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-700 dark:text-gray-300 mb-1.5">
                    الدرجة القصوى *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={newQuizMaxScore}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 10;
                      setNewQuizMaxScore(val);
                      setNewQuizPassScore(Math.round((val / 2) * 10) / 10);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white text-xs font-black text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-700 dark:text-gray-300 mb-1.5 flex items-center justify-between">
                    <span>درجة النجاح *</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max={newQuizMaxScore}
                    required
                    value={newQuizPassScore}
                    onChange={(e) => setNewQuizPassScore(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white text-xs font-black text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Visibility: Public vs Private */}
              <div>
                <label className="block text-xs font-black text-gray-700 dark:text-gray-300 mb-1.5">
                  خصوصية عرض الدرجات للطلاب
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setNewQuizVisibility('PUBLIC')}
                    className={`p-3 rounded-2xl border text-right transition flex items-center gap-2.5 cursor-pointer ${
                      newQuizVisibility === 'PUBLIC'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500/30'
                        : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Globe size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <div className="text-xs font-black">عامة للجميع 🌐</div>
                      <div className="text-[10px] text-gray-500">كشف الدرجات يظهر للكل</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewQuizVisibility('PRIVATE')}
                    className={`p-3 rounded-2xl border text-right transition flex items-center gap-2.5 cursor-pointer ${
                      newQuizVisibility === 'PRIVATE'
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-800 dark:text-amber-200 ring-2 ring-amber-500/30'
                        : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Lock size={18} className="shrink-0 text-amber-600 dark:text-amber-400" />
                    <div>
                      <div className="text-xs font-black">خاصة لكل طالب 🔒</div>
                      <div className="text-[10px] text-gray-500">كل طالب يرى فقط درجته</div>
                    </div>
                  </button>
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

      {/* Interactive Grade Sheet Explorer & Browser Modal */}
      {showGradeSheetModal && activeExam && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
                    <FileText size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-lg sm:text-xl text-gray-900 dark:text-white">
                        كشف درجات: {activeExam.title} 📋
                      </h3>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {activeExam.courseName}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                          activeExam.visibility === 'PRIVATE'
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        {activeExam.visibility === 'PRIVATE' ? '🔒 خاصة' : '🌐 عامة'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      تصفح تفاعلي شامل لكافة درجات طلاب الدفعة مع إمكانيات الفرز والتصفية والتصدير
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowGradeSheetModal(false)}
                  className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 hover:text-gray-800 dark:hover:text-white flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-700 transition cursor-pointer shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Fast Stats Strip in Modal */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1 text-center">
                <div className="bg-white dark:bg-slate-800/80 p-2.5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-2xs">
                  <span className="text-[10px] text-gray-500 font-bold block">الدرجة القصوى</span>
                  <span className="text-sm font-black text-gray-900 dark:text-white">{activeExam.maxScore || 10}</span>
                </div>
                <div className="bg-white dark:bg-slate-800/80 p-2.5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-2xs">
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block">درجة النجاح</span>
                  <span className="text-sm font-black text-purple-700 dark:text-purple-300">{examStats.passThreshold}</span>
                </div>
                <div className="bg-white dark:bg-slate-800/80 p-2.5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-2xs">
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold block">المعدل العام</span>
                  <span className="text-sm font-black text-indigo-700 dark:text-indigo-300">{examStats.average}</span>
                </div>
                <div className="bg-white dark:bg-slate-800/80 p-2.5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-2xs">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">نسبة النجاح</span>
                  <span className="text-sm font-black text-emerald-700 dark:text-emerald-300">%{examStats.passRate} ({examStats.passCount})</span>
                </div>
                <div className="col-span-2 sm:col-span-1 bg-white dark:bg-slate-800/80 p-2.5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-2xs">
                  <span className="text-[10px] text-gray-500 font-bold block">المرصود / الكلي</span>
                  <span className="text-sm font-black text-gray-900 dark:text-white">{examStats.totalGraded} / {students.length}</span>
                </div>
              </div>
            </div>

            {/* Filter and Control Toolbar */}
            <div className="p-4 sm:px-6 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="ابحث باسم الطالب أو لقبه أو رمزه الأكاديمي..."
                    value={browserSearchQuery}
                    onChange={(e) => setBrowserSearchQuery(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 rounded-2xl text-xs sm:text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  {browserSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setBrowserSearchQuery('')}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                    >
                      مسح
                    </button>
                  )}
                </div>

                {/* Controls: Group, Sort & View Mode */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Group Filter */}
                  {availableAcademicGroups.length > 0 && (
                    <select
                      value={browserGroupFilter}
                      onChange={(e) => setBrowserGroupFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="ALL">كل الشعب الدراسية</option>
                      {availableAcademicGroups.map((grp) => (
                        <option key={grp} value={grp}>
                          {grp}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Sort Selector */}
                  <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-gray-200">
                    <ArrowUpDown size={13} className="text-gray-400" />
                    <select
                      value={browserSortBy}
                      onChange={(e) => setBrowserSortBy(e.target.value as any)}
                      className="bg-transparent border-none text-xs font-bold text-gray-800 dark:text-gray-200 focus:outline-none cursor-pointer"
                    >
                      <option value="SCORE_DESC">الترتيب: الأعلى درجة 🥇</option>
                      <option value="SCORE_ASC">الترتيب: الأقل درجة 📉</option>
                      <option value="NAME">الترتيب: أبجدياً بالاسم 🔤</option>
                    </select>
                  </div>

                  {/* View Mode Switcher */}
                  <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setBrowserViewMode('CARDS')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        browserViewMode === 'CARDS'
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-2xs'
                          : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                      }`}
                      title="عرض بطاقات الطلاب"
                    >
                      <LayoutGrid size={13} />
                      <span className="hidden sm:inline">بطاقات</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBrowserViewMode('TABLE')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        browserViewMode === 'TABLE'
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-2xs'
                          : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                      }`}
                      title="عرض جدول منظم"
                    >
                      <List size={13} />
                      <span className="hidden sm:inline">جدول</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setBrowserFilterStatus('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                    browserFilterStatus === 'ALL'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  الكل ({students.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBrowserFilterStatus('PASSED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                    browserFilterStatus === 'PASSED'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200/60 dark:border-emerald-800/60'
                  }`}
                >
                  الناجحين فقط ({examStats.passCount})
                </button>
                <button
                  type="button"
                  onClick={() => setBrowserFilterStatus('FAILED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                    browserFilterStatus === 'FAILED'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200/60 dark:border-rose-800/60'
                  }`}
                >
                  الراسبين ({examStats.failCount})
                </button>
                <button
                  type="button"
                  onClick={() => setBrowserFilterStatus('UNGRADED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                    browserFilterStatus === 'UNGRADED'
                      ? 'bg-gray-700 text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  لم ترصد بعد ({students.length - examStats.totalGraded})
                </button>
              </div>
            </div>

            {/* Modal Body: Cards or Table */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/60 dark:bg-slate-900/60">
              {browserStudentsList.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-slate-800 text-gray-400 flex items-center justify-center mx-auto">
                    <Search size={24} />
                  </div>
                  <h4 className="font-black text-sm text-gray-700 dark:text-gray-300">
                    لا يوجد طلاب مطابقين للبحث أو التصفية الحالية
                  </h4>
                  <p className="text-xs text-gray-400">
                    جرب تغيير كلمات البحث أو إعادة ضبط خيارات الفرز.
                  </p>
                </div>
              ) : browserViewMode === 'CARDS' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {browserStudentsList.map((item, idx) => {
                    const max = activeExam.maxScore || 10;
                    const isPassed = item.isPass;
                    const rating = item.rating;
                    const isMe = currentUser?.uid === item.student.uid;

                    return (
                      <div
                        key={item.student.uid}
                        className={`rounded-2xl p-4 transition-all duration-200 border ${
                          isMe
                            ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/20'
                            : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700/80 hover:shadow-md hover:border-gray-200 dark:hover:border-slate-600'
                        }`}
                      >
                        {/* Top: Rank, Avatar & Name */}
                        <div className="flex items-start justify-between gap-2.5 mb-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Rank badge */}
                            <span
                              className={`w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center shrink-0 ${
                                idx === 0
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 ring-1 ring-amber-400/50'
                                  : idx === 1
                                  ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                                  : idx === 2
                                  ? 'bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                                  : 'bg-gray-100 dark:bg-slate-700/60 text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              #{idx + 1}
                            </span>

                            {/* Avatar */}
                            {item.student.avatar ? (
                              <img
                                src={item.student.avatar}
                                alt={item.student.name}
                                className="w-8 h-8 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                                {item.student.name.charAt(0)}
                              </div>
                            )}

                            <div className="min-w-0">
                              <h5 className="font-black text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                                {item.student.repNickname || item.student.name}
                                {isMe && (
                                  <span className="mr-1 text-[9px] bg-indigo-600 text-white px-1.5 py-0.2 rounded-full">
                                    أنت
                                  </span>
                                )}
                              </h5>
                              <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                                {item.student.academicGroup && (
                                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                    {item.student.academicGroup}
                                  </span>
                                )}
                                {item.student.studentId && <span>#{item.student.studentId}</span>}
                              </div>
                            </div>
                          </div>

                          {/* Status Badge */}
                          {item.score !== null ? (
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0 ${
                                isPassed
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                              }`}
                            >
                              {rating?.label || (isPassed ? 'ناجح' : 'راسب')}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400 font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 shrink-0">
                              لم يرصد
                            </span>
                          )}
                        </div>

                        {/* Bottom: Score Box & Progress */}
                        {item.score !== null ? (
                          <div className="space-y-2 bg-gray-50/80 dark:bg-slate-900/60 p-2.5 rounded-xl border border-gray-100 dark:border-slate-700/50">
                            <div className="flex items-baseline justify-between">
                              <span className="text-[11px] font-bold text-gray-500">الدرجة المحققة:</span>
                              <div className="flex items-baseline gap-1">
                                <span className="text-xl font-black text-gray-900 dark:text-white">
                                  {item.score}
                                </span>
                                <span className="text-xs text-gray-400">/ {max}</span>
                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mr-1.5">
                                  %{item.percentage}
                                </span>
                              </div>
                            </div>

                            {/* Mini Progress */}
                            <div className="w-full h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  isPassed
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(0, item.percentage || 0))}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="py-3 text-center bg-gray-50/60 dark:bg-slate-900/40 rounded-xl text-xs text-gray-400 font-bold">
                            غائب أو لم يتم رصد درجته بعد
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Table View Mode */
                <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-gray-50 dark:bg-slate-900/80 text-gray-500 dark:text-gray-400 font-black border-b border-gray-200 dark:border-slate-700">
                      <tr>
                        <th className="py-3 px-4 w-12 text-center">#</th>
                        <th className="py-3 px-4">اسم الطالب</th>
                        <th className="py-3 px-3 text-center">المجموعة</th>
                        <th className="py-3 px-4 text-center">الدرجة</th>
                        <th className="py-3 px-3 text-center">النسبة</th>
                        <th className="py-3 px-4 text-center">التقدير</th>
                        <th className="py-3 px-4 text-center">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60 font-bold">
                      {browserStudentsList.map((item, idx) => {
                        const max = activeExam.maxScore || 10;
                        const isMe = currentUser?.uid === item.student.uid;

                        return (
                          <tr
                            key={item.student.uid}
                            className={`hover:bg-gray-50/80 dark:hover:bg-slate-700/40 transition ${
                              isMe ? 'bg-indigo-50/70 dark:bg-indigo-950/40 font-black' : ''
                            }`}
                          >
                            <td className="py-3 px-4 text-center text-gray-400 font-black">{idx + 1}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-black flex items-center justify-center text-[10px]">
                                  {item.student.name.charAt(0)}
                                </div>
                                <span className="text-gray-900 dark:text-white">
                                  {item.student.repNickname || item.student.name}
                                  {isMe && (
                                    <span className="mr-1.5 text-[9px] bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                                      أنت
                                    </span>
                                  )}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center text-gray-500 dark:text-gray-400">
                              {item.student.academicGroup || '-'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {item.score !== null ? (
                                <span className="font-black text-gray-900 dark:text-white text-sm">
                                  {item.score}{' '}
                                  <span className="text-[10px] text-gray-400 font-normal">/ {max}</span>
                                </span>
                              ) : (
                                <span className="text-gray-400 font-normal">لم يرصد</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {item.percentage !== null ? (
                                <span className="text-gray-600 dark:text-gray-300">%{item.percentage}</span>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {item.rating ? (
                                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                  {item.rating.label}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {item.score !== null ? (
                                item.isPass ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                    <Check size={11} />
                                    ناجح
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                    <XCircle size={11} />
                                    راسب
                                  </span>
                                )
                              ) : (
                                <span className="text-gray-400 text-[11px]">غائب</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:px-6 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                يُعرض حالياً <strong>{browserStudentsList.length}</strong> من أصل{' '}
                <strong>{students.length}</strong> طالب في الدفعة
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isExportingPdf || examStats.totalGraded === 0}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-black text-xs text-white bg-rose-600 hover:bg-rose-700 transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                  title="استخراج كشف الدرجات كملف PDF"
                >
                  <Download size={14} />
                  <span>تصدير PDF 📄</span>
                </button>

                <button
                  type="button"
                  onClick={handleGenerateGraphicImage}
                  disabled={isGeneratingImage || examStats.totalGraded === 0}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-black text-xs text-white bg-indigo-600 hover:bg-indigo-700 transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                  title="توليد صورة بطاقة الدرجات لمشاركتها"
                >
                  <Camera size={14} />
                  <span>مشاركة كصورة 🖼️</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowGradeSheetModal(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Image Preview Modal */}
      {showShareModal && capturedImageUrl && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 dark:border-slate-700 space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Camera size={18} />
                </div>
                <div>
                  <h3 className="font-black text-base text-gray-900 dark:text-white">
                    بطاقة نتائج الامتحان جاهزة 📸
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    تم توليد بطاقة عالية الدقة وجاهزة للمشاركة الفورية
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 hover:text-gray-700 dark:text-gray-300 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-600 cursor-pointer transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Image Preview Container */}
            <div className="overflow-y-auto max-h-[60vh] rounded-2xl border border-gray-200 dark:border-slate-700 p-2 bg-gray-50 dark:bg-slate-900 flex justify-center">
              <img
                src={capturedImageUrl}
                alt="بطاقة نتائج الامتحان"
                className="max-w-full h-auto rounded-xl shadow-xs"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-gray-100 dark:border-slate-700">
              <span className="text-[11px] text-gray-500 dark:text-gray-400 font-bold">
                تم تنزيل الصورة تلقائياً إلى جهازك 💾
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  href={capturedImageUrl}
                  download={`بطاقة_نتائج_${activeExam?.title || 'امتحان'}.png`}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-black text-xs text-white bg-indigo-600 hover:bg-indigo-700 transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Download size={14} />
                  <span>تحميل مجدداً</span>
                </a>
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Printable PDF Container (Rendered offscreen for html2pdf.js) */}
      {activeExam && (
        <div
          ref={reportPrintRef}
          style={{
            position: 'fixed',
            left: '-9999px',
            top: 0,
            width: '794px',
            zIndex: -100,
            backgroundColor: '#ffffff',
            color: '#1e293b',
            direction: 'rtl',
            padding: '36px',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            boxSizing: 'border-box',
          }}
        >
          {/* Header with Academic Branding */}
          <div
            style={{
              borderBottom: '2px solid #1e293b',
              paddingBottom: '16px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>
                جمهورية العراق - وزارة التعليم العالي والبحث العلمي
              </div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', marginTop: '2px' }}>
                كشف درجات رسمي - دفعة {effectiveBatchCode}
              </div>
              <div style={{ fontSize: '12px', color: '#334155', marginTop: '3px' }}>
                المادة الدراسية: <strong>{activeExam.courseName}</strong>
              </div>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div
                style={{
                  display: 'inline-block',
                  backgroundColor: '#e0e7ff',
                  color: '#3730a3',
                  padding: '4px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '900',
                }}
              >
                وثيقة نتائج أكاديمية 📄
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                تاريخ الامتحان: {activeExam.examDate}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                تاريخ الاستخراج: {new Date().toLocaleDateString('ar-IQ')}
              </div>
            </div>
          </div>

          {/* Title & Exam Meta Banner */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '14px 18px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#1e293b' }}>
                {activeExam.title}
              </div>
              {activeExam.topics && (
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  المفردات / الملاحظات: {activeExam.topics}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '14px', textAlign: 'center' }}>
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '6px 14px',
                }}
              >
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>
                  الدرجة القصوى
                </div>
                <div style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a' }}>
                  {activeExam.maxScore || 10}
                </div>
              </div>
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '6px 14px',
                }}
              >
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>
                  درجة النجاح
                </div>
                <div style={{ fontSize: '15px', fontWeight: '900', color: '#4338ca' }}>
                  {examStats.passThreshold}
                </div>
              </div>
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '6px 14px',
                }}
              >
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>
                  الخصوصية
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: '900',
                    color: activeExam.visibility === 'PRIVATE' ? '#b45309' : '#047857',
                  }}
                >
                  {activeExam.visibility === 'PRIVATE' ? 'خاصة لكل طالب' : 'عامة للدفعة'}
                </div>
              </div>
            </div>
          </div>

          {/* 8 Exam Statistics Summary Table */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: '900', color: '#334155', marginBottom: '8px' }}>
              أولاً: ملخص المؤشرات الإحصائية العامة للنتائج ({examStats.totalGraded} طالب مرصود):
            </div>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'center',
                fontSize: '11px',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1', color: '#047857' }}>
                    أعلى درجة
                  </th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1', color: '#b91c1c' }}>
                    أقل درجة
                  </th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1', color: '#4338ca' }}>
                    المعدل العام
                  </th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1', color: '#6d28d9' }}>
                    درجة النجاح
                  </th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1', color: '#0f766e' }}>
                    عدد الناجحين
                  </th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1', color: '#be123c' }}>
                    عدد الراسبين
                  </th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1', color: '#b45309' }}>
                    نسبة النجاح
                  </th>
                  <th style={{ padding: '8px', border: '1px solid #cbd5e1', color: '#c2410c' }}>
                    نسبة الرسوب
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ fontWeight: '900', fontSize: '13px' }}>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f0fdf4' }}>
                    {examStats.highest}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fef2f2' }}>
                    {examStats.lowest}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', backgroundColor: '#eef2ff' }}>
                    {examStats.average}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', backgroundColor: '#faf5ff' }}>
                    {examStats.passThreshold}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f0fdfa' }}>
                    {examStats.passCount}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff1f2' }}>
                    {examStats.failCount}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fffbeb' }}>
                    %{examStats.passRate}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff7ed' }}>
                    %{examStats.failRate}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Grade Distribution Tiers Table */}
          <div style={{ marginBottom: '22px' }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: '900',
                color: '#334155',
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>ثانياً: التوزيع الفئوي للدرجات وتصنيف الطلاب:</span>
              <span style={{ color: '#4338ca' }}>
                مجموع الطلاب في التوزيع: {examStats.distributionTotal} طالب
              </span>
            </div>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'center',
                fontSize: '11px',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>
                  <th style={{ padding: '6px', border: '1px solid #cbd5e1' }}>الفئة التقديرية</th>
                  <th style={{ padding: '6px', border: '1px solid #cbd5e1' }}>نطاق الدرجة</th>
                  <th style={{ padding: '6px', border: '1px solid #cbd5e1' }}>عدد الطلاب</th>
                  <th style={{ padding: '6px', border: '1px solid #cbd5e1' }}>نسبة الفئة %</th>
                </tr>
              </thead>
              <tbody>
                {examStats.distribution.map((tier) => (
                  <tr key={tier.key} style={{ border: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>
                      {tier.label}
                    </td>
                    <td
                      style={{
                        padding: '6px',
                        border: '1px solid #cbd5e1',
                        color: '#64748b',
                        fontSize: '10px',
                      }}
                    >
                      {tier.rangeText}
                    </td>
                    <td
                      style={{
                        padding: '6px',
                        border: '1px solid #cbd5e1',
                        fontWeight: '900',
                      }}
                    >
                      {tier.count} طالب
                    </td>
                    <td
                      style={{
                        padding: '6px',
                        border: '1px solid #cbd5e1',
                        fontWeight: 'bold',
                      }}
                    >
                      %{tier.percentage}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Complete Student Grades Table */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', fontWeight: '900', color: '#334155', marginBottom: '8px' }}>
              ثالثاً: جدول درجات الطلاب التفصيلي:
            </div>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '10px',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#0f172a', color: '#ffffff', textAlign: 'center' }}>
                  <th style={{ padding: '6px 8px', width: '32px' }}>#</th>
                  <th style={{ padding: '6px 12px', textAlign: 'right' }}>اسم الطالب</th>
                  <th style={{ padding: '6px 8px', width: '60px' }}>الشعبة</th>
                  <th style={{ padding: '6px 10px', width: '80px' }}>
                    الدرجة / {activeExam.maxScore || 10}
                  </th>
                  <th style={{ padding: '6px 8px', width: '60px' }}>النسبة %</th>
                  <th style={{ padding: '6px 10px', width: '80px' }}>التقدير</th>
                  <th style={{ padding: '6px 8px', width: '70px' }}>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {[...students]
                  .sort((a, b) => {
                    const nameA = a.repNickname?.trim() || a.name.trim();
                    const nameB = b.repNickname?.trim() || b.name.trim();
                    return nameA.localeCompare(nameB, 'ar', { sensitivity: 'base' });
                  })
                  .map((st, i) => {
                    const assessmentKey = `exam_quiz_${activeExam.id}`;
                    const gradeObj = grades.find(
                      (g) => g.assessmentId === assessmentKey && g.studentId === st.uid
                    );
                    const score =
                      gradeObj?.score !== undefined && gradeObj?.score !== null
                        ? Number(gradeObj.score)
                        : null;
                    const max = activeExam.maxScore || 10;
                    const isPass = score !== null ? score >= examStats.passThreshold : false;

                    return (
                      <tr
                        key={st.uid}
                        style={{
                          backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc',
                          borderBottom: '1px solid #e2e8f0',
                          textAlign: 'center',
                          pageBreakInside: 'avoid',
                        }}
                      >
                      <td style={{ padding: '5px 8px', color: '#64748b' }}>{i + 1}</td>
                      <td style={{ padding: '5px 12px', textAlign: 'right', fontWeight: 'bold' }}>
                        {st.repNickname || st.name}
                      </td>
                      <td style={{ padding: '5px 8px', color: '#64748b' }}>
                        {st.academicGroup || '-'}
                      </td>
                      <td style={{ padding: '5px 10px', fontWeight: '900', fontSize: '11px' }}>
                        {score !== null ? score : '-'}
                      </td>
                      <td style={{ padding: '5px 8px' }}>
                        {score !== null ? `%${Math.round((score / max) * 100)}` : '-'}
                      </td>
                      <td style={{ padding: '5px 10px' }}>
                        {score !== null ? getScoreRating(score, max).label : 'غائب'}
                      </td>
                      <td
                        style={{
                          padding: '5px 8px',
                          fontWeight: 'bold',
                          color: score === null ? '#94a3b8' : isPass ? '#047857' : '#b91c1c',
                        }}
                      >
                        {score === null ? 'لم يرصد' : isPass ? 'ناجح' : 'راسب'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Official Signatures & Footer */}
          <div
            style={{
              borderTop: '2px solid #cbd5e1',
              paddingTop: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '30px',
            }}
          >
            <div style={{ textAlign: 'center', width: '200px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>
                أستاذ المادة الدراسية
              </div>
              <div style={{ height: '40px' }} />
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>التوقيع: .....................</div>
            </div>
            <div style={{ textAlign: 'center', fontSize: '10px', color: '#94a3b8' }}>
              تم استخراج هذه الوثيقة آلياً من منصة الدفعة الأكاديمية
              <br />
              الكود: {effectiveBatchCode}
            </div>
            <div style={{ textAlign: 'center', width: '200px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>
                ممثل الدفعة الأكاديمية
              </div>
              <div style={{ height: '40px' }} />
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>التوقيع: .....................</div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Graphic Card Container (Rendered offscreen for html2canvas) */}
      {activeExam && (
        <div
          ref={graphicCardRef}
          style={{
            position: 'fixed',
            left: '-9999px',
            top: 0,
            width: '880px',
            zIndex: -100,
            backgroundColor: '#ffffff',
            color: '#0f172a',
            direction: 'rtl',
            padding: '36px',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            boxSizing: 'border-box',
          }}
        >
          {/* Vibrant Gradient Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #3730a3 0%, #4f46e5 50%, #7c3aed 100%)',
              borderRadius: '24px',
              padding: '28px 32px',
              color: '#ffffff',
              marginBottom: '24px',
              boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.3)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  padding: '6px 14px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                <span>دفعة {effectiveBatchCode}</span>
                <span>•</span>
                <span>{activeExam.courseName}</span>
              </div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>
                {activeExam.examDate}
              </div>
            </div>

            <div
              style={{
                fontSize: '26px',
                fontWeight: '900',
                letterSpacing: '-0.5px',
                marginBottom: '8px',
              }}
            >
              {activeExam.title} 📊
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  padding: '6px 14px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                الدرجة القصوى: <strong>{activeExam.maxScore || 10}</strong>
              </div>
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  padding: '6px 14px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                درجة النجاح: <strong>{examStats.passThreshold}</strong>
              </div>
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  padding: '6px 14px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                إجمالي الطلاب المرصودين: <strong>{examStats.totalGraded}</strong>
              </div>
            </div>
          </div>

          {/* Key 4 Highlights Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '14px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '20px',
                padding: '16px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#047857', marginBottom: '4px' }}>
                أعلى درجة 🌟
              </div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#065f46' }}>
                {examStats.highest}{' '}
                <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#047857' }}>
                  /{activeExam.maxScore || 10}
                </span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '20px',
                padding: '16px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1d4ed8', marginBottom: '4px' }}>
                المعدل العام 📈
              </div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#1e40af' }}>
                {examStats.average}{' '}
                <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#1d4ed8' }}>
                  /{activeExam.maxScore || 10}
                </span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#f0fdfa',
                border: '1px solid #99f6e4',
                borderRadius: '20px',
                padding: '16px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f766e', marginBottom: '4px' }}>
                نسبة النجاح 🏆
              </div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#115e59' }}>
                %{examStats.passRate}
              </div>
              <div style={{ fontSize: '10px', color: '#0f766e', marginTop: '2px' }}>
                {examStats.passCount} طالب ناجح
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#fff1f2',
                border: '1px solid #fecdd3',
                borderRadius: '20px',
                padding: '16px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#be123c', marginBottom: '4px' }}>
                نسبة الرسوب ⚠️
              </div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#9f1239' }}>
                %{examStats.failRate}
              </div>
              <div style={{ fontSize: '10px', color: '#be123c', marginTop: '2px' }}>
                {examStats.failCount} طالب راسب
              </div>
            </div>
          </div>

          {/* Visual Distribution Section */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '20px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: '900', color: '#1e293b' }}>
                التوزيع الفئوي للدرجات 🎯
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>
                مجموع الطلاب: {examStats.distributionTotal} طالب
              </div>
            </div>

            {/* Distribution Stacked Bar */}
            <div
              style={{
                display: 'flex',
                height: '18px',
                width: '100%',
                borderRadius: '9999px',
                overflow: 'hidden',
                backgroundColor: '#e2e8f0',
                marginBottom: '14px',
              }}
            >
              {examStats.distribution.map(
                (tier) =>
                  tier.percentage > 0 && (
                    <div
                      key={tier.key}
                      style={{
                        width: `${tier.percentage}%`,
                        height: '100%',
                        backgroundColor:
                          tier.key === 'EXCELLENT'
                            ? '#10b981'
                            : tier.key === 'VERY_GOOD'
                            ? '#3b82f6'
                            : tier.key === 'GOOD'
                            ? '#6366f1'
                            : tier.key === 'MEDIUM'
                            ? '#f59e0b'
                            : tier.key === 'ACCEPTABLE'
                            ? '#f97316'
                            : '#f43f5e',
                      }}
                    />
                  )
              )}
            </div>

            {/* Tiers Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {examStats.distribution.map((tier) => (
                <div
                  key={tier.key}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155' }}>
                      {tier.label}
                    </div>
                    <div style={{ fontSize: '9px', color: '#94a3b8' }}>{tier.rangeText}</div>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a' }}>
                      {tier.count}{' '}
                      <span style={{ fontSize: '9px', fontWeight: 'normal', color: '#64748b' }}>
                        طالب
                      </span>
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#4f46e5' }}>
                      %{tier.percentage}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Honor Roll Preview (Top Scorers) */}
          {honorRoll.length > 0 && (
            <div
              style={{
                backgroundColor: '#fefce8',
                border: '1px solid #fef08a',
                borderRadius: '20px',
                padding: '16px 20px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: '900',
                  color: '#854d0e',
                  marginBottom: '8px',
                }}
              >
                لوحة شرف الأوائل على الامتحان 👑
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {honorRoll.map((top, idx) => {
                  const studentName = top.student?.repNickname || top.student?.name || 'طالب';
                  return (
                    <div
                      key={top.student?.uid || idx}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #fde047',
                        borderRadius: '12px',
                        padding: '6px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                      }}
                    >
                      <span style={{ color: '#ca8a04' }}>#{idx + 1}</span>
                      <span style={{ color: '#1e293b' }}>{studentName}</span>
                      <span
                        style={{
                          backgroundColor: '#fef08a',
                          color: '#713f12',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '10px',
                          fontWeight: '900',
                        }}
                      >
                        {top.score} / {activeExam.maxScore || 10}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Detailed Student Grades Sheet (Complete Roster on Image) */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '20px',
              marginBottom: '22px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '10px',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a' }}>
                كشف درجات طلاب الدفعة التفصيلي 📋 ({examStats.totalGraded} طالب مرصود)
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>
                مرتبة حسب الدرجة تنازلياً 🥇
              </div>
            </div>

            {/* 2-column Grid for all students */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
              }}
            >
              {sortedScoredStudentsForGraphic.map((item, idx) => {
                const max = activeExam.maxScore || 10;
                const score = item.score;
                const isPass = item.isPass;
                return (
                  <div
                    key={item.student.uid || idx}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: '900',
                          color: idx < 3 ? '#b45309' : '#64748b',
                          backgroundColor: idx < 3 ? '#fef3c7' : '#f1f5f9',
                          width: '22px',
                          height: '22px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e293b' }}>
                          {item.student.repNickname || item.student.name}
                        </div>
                        {item.student.academicGroup && (
                          <div style={{ fontSize: '9px', color: '#64748b' }}>
                            {item.student.academicGroup}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {score !== null ? (
                        <>
                          <div style={{ textAlign: 'left' }}>
                            <span style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a' }}>
                              {score}
                            </span>
                            <span style={{ fontSize: '9px', color: '#94a3b8' }}> / {max}</span>
                          </div>
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 'bold',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: isPass ? '#ecfdf5' : '#fff1f2',
                              color: isPass ? '#047857' : '#be123c',
                              border: `1px solid ${isPass ? '#a7f3d0' : '#fecdd3'}`,
                            }}
                          >
                            {isPass ? item.rating?.label || 'ناجح' : 'راسب'}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>لم يرصد</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Watermark */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #e2e8f0',
              paddingTop: '14px',
              fontSize: '11px',
              color: '#94a3b8',
            }}
          >
            <span>منصة الدفعة الأكاديمية الذكية 🎓</span>
            <span>تاريخ الاستخراج: {new Date().toLocaleDateString('ar-IQ')}</span>
          </div>
        </div>
      )}
    </div>
  );
};
