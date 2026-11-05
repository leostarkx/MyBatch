import React from 'react';
import {
  GraduationCap,
  Plus,
  X,
  Trash2,
  Save,
  Search,
  Edit3,
  PieChart,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { Course, Grade, User, UserRole, AssessmentStructure } from '../types';
import { compareArabicNames } from '../services/firebase';
import { FinalExamGradeCalculator } from '../components/FinalExamGradeCalculator';

export const isFinalAssessment = (asm: AssessmentStructure) => {
  if (asm.category === "FINAL") return true;
  if (asm.category === "CUMULATIVE") return false;
  const lower = asm.name.trim().toLowerCase();
  return (
    lower === "نهائي" ||
    lower === "امتحان نهائي" ||
    lower === "الامتحان النهائي" ||
    lower.includes("فاينال") ||
    lower.includes("فاينل") ||
    lower.includes("final")
  );
};

export interface CourseGradesViewProps {
  currentUser: User | null;
  canManageGrades: boolean;
  effectiveBatchCode: string;
  courses: Course[];
  grades: Grade[];
  appUsers: User[];
  // Course creation/edit modal state & handlers
  isAddingCourse: boolean;
  setIsAddingCourse: (val: boolean) => void;
  editingCourseId: string | null;
  setEditingCourseId: (val: string | null) => void;
  newCourseName: string;
  setNewCourseName: (val: string) => void;
  courseProfessors: string[];
  setCourseProfessors: React.Dispatch<React.SetStateAction<string[]>>;
  tempProfName: string;
  setTempProfName: (val: string) => void;
  newAssessments: AssessmentStructure[];
  setNewAssessments: React.Dispatch<React.SetStateAction<AssessmentStructure[]>>;
  newAssessmentName: string;
  setNewAssessmentName: (val: string) => void;
  newAssessmentScore: string;
  setNewAssessmentScore: (val: string) => void;
  handleAddProf: () => void;
  handleRemoveProf: (idx: number) => void;
  handleAddAssessmentToNewCourse: () => void;
  handleRemoveAssessmentFromNewCourse: (id: string) => void;
  handleSaveCourse: () => void;
  handleStartEditCourse: (course: Course) => void;
  handleDeleteCourse: (courseId: string) => void;
  // 50-point cumulative customization modal
  customizingCourseForGrades: Course | null;
  setCustomizingCourseForGrades: (c: Course | null) => void;
  customAssessmentsDraft: AssessmentStructure[];
  setCustomAssessmentsDraft: React.Dispatch<React.SetStateAction<AssessmentStructure[]>>;
  customNewAsmName: string;
  setCustomNewAsmName: (val: string) => void;
  customNewAsmScore: string;
  setCustomNewAsmScore: (val: string) => void;
  handleOpenCustomizeCourseGrades: (course: Course) => void;
  handleAddDraftAssessment: (presetName?: string, presetScore?: number) => void;
  handleUpdateDraftAssessment: (id: string, field: "name" | "maxScore", value: string) => void;
  handleRemoveDraftAssessment: (id: string) => void;
  handleSaveCustomCourseAssessments: () => void;
  // Single assessment grading modal
  isEditingGrades: boolean;
  setIsEditingGrades: (val: boolean) => void;
  selectedCourseForGrading: Course | null;
  selectedAssessmentForGrading: AssessmentStructure | null;
  gradeEditorSearch: string;
  setGradeEditorSearch: (val: string) => void;
  tempGrades: { [studentId: string]: number };
  setTempGrades: React.Dispatch<React.SetStateAction<{ [studentId: string]: number }>>;
  handleOpenGradeEditor: (course: Course, asm: AssessmentStructure) => void;
  handleSaveGrades: () => void;
  // Full matrix grade sheet modal
  viewingCourseGradeSheet: Course | null;
  setViewingCourseGradeSheet: (c: Course | null) => void;
  matrixGradesDraft: { [key: string]: number | "" };
  setMatrixGradesDraft: React.Dispatch<React.SetStateAction<{ [key: string]: number | "" }>>;
  isSavingMatrixGrades: boolean;
  handleOpenCourseGradeSheet: (course: Course) => void;
  handleSaveMatrixGrades: () => void;
  // Profile & Nickname actions
  handleViewProfile: (uid: string) => void;
  onOpenNicknameModal: (student: User) => void;
}

export const CourseGradesView: React.FC<CourseGradesViewProps> = ({
  currentUser,
  canManageGrades,
  effectiveBatchCode,
  courses,
  grades,
  appUsers,
  isAddingCourse,
  setIsAddingCourse,
  editingCourseId,
  setEditingCourseId,
  newCourseName,
  setNewCourseName,
  courseProfessors,
  setCourseProfessors,
  tempProfName,
  setTempProfName,
  newAssessments,
  setNewAssessments,
  newAssessmentName,
  setNewAssessmentName,
  newAssessmentScore,
  setNewAssessmentScore,
  handleAddProf,
  handleRemoveProf,
  handleAddAssessmentToNewCourse,
  handleRemoveAssessmentFromNewCourse,
  handleSaveCourse,
  handleStartEditCourse,
  handleDeleteCourse,
  customizingCourseForGrades,
  setCustomizingCourseForGrades,
  customAssessmentsDraft,
  setCustomAssessmentsDraft,
  customNewAsmName,
  setCustomNewAsmName,
  customNewAsmScore,
  setCustomNewAsmScore,
  handleOpenCustomizeCourseGrades,
  handleAddDraftAssessment,
  handleUpdateDraftAssessment,
  handleRemoveDraftAssessment,
  handleSaveCustomCourseAssessments,
  isEditingGrades,
  setIsEditingGrades,
  selectedCourseForGrading,
  selectedAssessmentForGrading,
  gradeEditorSearch,
  setGradeEditorSearch,
  tempGrades,
  setTempGrades,
  handleOpenGradeEditor,
  handleSaveGrades,
  viewingCourseGradeSheet,
  setViewingCourseGradeSheet,
  matrixGradesDraft,
  setMatrixGradesDraft,
  isSavingMatrixGrades,
  handleOpenCourseGradeSheet,
  handleSaveMatrixGrades,
  handleViewProfile,
  onOpenNicknameModal,
}) => {
  const batchStudents = appUsers
    .filter((u) => {
      if (u.role === UserRole.OWNER) return false;
      if (u.excludeFromStats) return false;
      if (u.batchCode === effectiveBatchCode) return true;
      if (u.isOfficial && (!u.batchCode || u.batchCode === effectiveBatchCode))
        return true;
      return false;
    })
    .sort((a, b) =>
      compareArabicNames(
        a.repNickname?.trim() || a.name,
        b.repNickname?.trim() || b.name
      )
    );

  // Quick Assessment Presets for Representative
  const assessmentPresets = [
    { label: "ميدتيرم (20)", name: "امتحان الميدتيرم (الفصلي)", score: 20 },
    { label: "ميدتيرم (25)", name: "امتحان الميدتيرم (الفصلي)", score: 25 },
    { label: "كويزات (10)", name: "الكويزات والاختبارات اليومية", score: 10 },
    { label: "تقارير وواجبات (10)", name: "التقارير والواجبات", score: 10 },
    { label: "عملي / مختبر (15)", name: "العملي والمختبر", score: 15 },
    { label: "مشروع المادة (10)", name: "مشروع المادة", score: 10 },
    { label: "حضور ومشاركة (5)", name: "الحضور والمشاركة", score: 5 },
  ];

  // MANAGER VIEW (Representative, Admin, Owner, and Grades Assistant)
  if (canManageGrades) {
    const draftAllocatedTotal = customAssessmentsDraft.reduce(
      (acc, a) => acc + Number(a.maxScore || 0),
      0
    );
    const draftRemaining = Math.max(0, 50 - draftAllocatedTotal);

    return (
      <div className="space-y-6 p-4 pb-20 animate-in fade-in duration-300">
        {/* Hero Header */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <GraduationCap size={15} className="text-amber-300" />
                  نظام الدرجات الموحد (50 سعي تراكمي + 50 فاينال)
                </span>
                <span className="bg-white/10 px-3 py-1 rounded-full text-xs">
                  {courses.length} مواد دراسية
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black mb-1">
                تخصيص تقسيم المواد ورصد السعيات 📊
              </h2>
              <p className="opacity-90 text-xs md:text-sm max-w-2xl leading-relaxed">
                كل مادة مقسمة افتراضياً إلى <strong>50 درجة سعي تراكمي</strong> و<strong>50 درجة امتحان نهائي (فاينال)</strong>. يمكنك تخصيص الـ 50 التراكمية لكل مادة حسب تقسيم التدريسي (ميدتيرم، كويزات، تقارير، عملي...) ورصد الدرجات للطلاب أولاً بأول.
              </p>
            </div>
            <button
              onClick={() => {
                setIsAddingCourse(true);
                setEditingCourseId(null);
                setNewCourseName("");
                setCourseProfessors([]);
                setNewAssessments([]);
              }}
              className="bg-white text-indigo-700 hover:bg-indigo-50 px-5 py-3 rounded-2xl text-xs md:text-sm font-black shadow-lg transition flex items-center justify-center gap-2 shrink-0 active:scale-95"
            >
              <Plus size={18} />
              إضافة مادة جديدة
            </button>
          </div>
        </div>

        {/* Add Course Modal */}
        {isAddingCourse && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-slate-700">
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100 dark:border-slate-700">
                <div>
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                    {editingCourseId ? "تعديل المادة" : "إضافة مادة دراسية جديدة"}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    الدرجة الكلية 100 (50 سعي تراكمي + 50 امتحان فاينال نهائي)
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingCourse(false)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Course Name */}
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                    اسم المادة الدراسية <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-2.5 text-sm outline-none"
                    placeholder="مثال: البرمجة الكيانية / هياكل البيانات"
                  />
                </div>

                {/* Professors */}
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                    تدريسي المادة (اختياري)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tempProfName}
                      onChange={(e) => setTempProfName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddProf();
                        }
                      }}
                      className="flex-1 bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-2 text-sm outline-none"
                      placeholder="د. فلان..."
                    />
                    <button
                      type="button"
                      onClick={handleAddProf}
                      className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 px-4 rounded-2xl font-bold text-xs hover:bg-gray-200 dark:hover:bg-slate-600"
                    >
                      إضافة
                    </button>
                  </div>
                  {courseProfessors.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {courseProfessors.map((prof, idx) => (
                        <span
                          key={idx}
                          className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2"
                        >
                          {prof}
                          <button
                            type="button"
                            onClick={() => handleRemoveProf(idx)}
                            className="text-blue-400 hover:text-blue-600"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Optional Initial Cumulative Breakdown */}
                <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      تقسيم الـ 50 التراكمي (اختياري - يمكنك تخصيصه لاحقاً)
                    </label>
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded-full">
                      الموزع: {newAssessments.reduce((s, a) => s + a.maxScore, 0)} / 50
                    </span>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-700/50 p-3.5 rounded-2xl space-y-3 mb-2 border border-gray-100 dark:border-slate-700">
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="البند (مثال: ميدتيرم)"
                        className="col-span-1 bg-white dark:bg-slate-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs outline-none"
                        value={newAssessmentName}
                        onChange={(e) => setNewAssessmentName(e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="الدرجة (من 50)"
                        max={50}
                        min={1}
                        className="col-span-1 bg-white dark:bg-slate-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs outline-none"
                        value={newAssessmentScore}
                        onChange={(e) => setNewAssessmentScore(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={handleAddAssessmentToNewCourse}
                        className="col-span-1 bg-primary text-white rounded-xl text-xs font-bold"
                      >
                        + إضافة بند
                      </button>
                    </div>
                  </div>

                  {newAssessments.length > 0 && (
                    <div className="space-y-1.5">
                      {newAssessments.map((asm) => (
                        <div
                          key={asm.id}
                          className="flex justify-between items-center p-2.5 bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-xl"
                        >
                          <span className="font-bold text-xs text-gray-800 dark:text-white">
                            {asm.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg">
                              {asm.maxScore} درجة
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAssessmentFromNewCourse(asm.id)}
                              className="text-red-400 hover:text-red-600 p-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6 border-t border-gray-100 dark:border-slate-700 pt-4">
                <button
                  onClick={() => setIsAddingCourse(false)}
                  className="px-4 py-2.5 text-gray-500 dark:text-gray-400 font-bold text-xs hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveCourse}
                  className="px-6 py-2.5 bg-primary text-white font-bold text-xs rounded-xl shadow-lg hover:bg-primary/90"
                >
                  حفظ المادة
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Customize 50-Point Cumulative Breakdown for a Course */}
        {customizingCourseForGrades && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 border border-gray-100 dark:border-slate-700 max-h-[92vh] flex flex-col">
              <div className="flex justify-between items-start pb-4 border-b border-gray-100 dark:border-slate-700">
                <div>
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-lg inline-block mb-1">
                    تخصيص تقسيم الدرجات الاختياري • {customizingCourseForGrades.name}
                  </span>
                  <h3 className="font-black text-lg text-gray-800 dark:text-white">
                    تقسيم الـ 50 درجة التراكمية (السعي الفصلي) ⚙️
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    حدد كيف يوزع تدريسي المادة درجة الـ 50 التراكمية ليظهر التقسيم للطلاب وتتمكن من رصد الدرجات لكل بند.
                  </p>
                </div>
                <button
                  onClick={() => setCustomizingCourseForGrades(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-xl"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="py-4 space-y-4 overflow-y-auto no-scrollbar flex-1">
                {/* Visual 50 Cumulative + 50 Final Meter */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-purple-50/60 to-blue-50/90 dark:from-slate-700/70 dark:to-slate-700/40 border border-indigo-100 dark:border-slate-600">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-gray-800 dark:text-white">
                        مجموع السعي الموزع حالياً:
                      </span>
                      <span
                        className={`text-sm font-black px-2.5 py-0.5 rounded-xl ${
                          draftAllocatedTotal === 50
                            ? "bg-emerald-500 text-white"
                            : draftAllocatedTotal > 50
                            ? "bg-red-500 text-white"
                            : "bg-indigo-600 text-white"
                        }`}
                      >
                        {draftAllocatedTotal} / 50 درجة
                      </span>
                    </div>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-300">
                      {draftAllocatedTotal === 50
                        ? "✅ اكتمل توزيع الـ 50 التراكمية بالكامل"
                        : draftAllocatedTotal < 50
                        ? `متبقي للتوزيع: ${draftRemaining} درجة (اختياري)`
                        : `⚠️ تجاوزت الحد بـ ${draftAllocatedTotal - 50} درجة!`}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-3 bg-white dark:bg-slate-800 rounded-full overflow-hidden border border-indigo-100 dark:border-slate-600 flex">
                    <div
                      className={`h-full transition-all duration-300 ${
                        draftAllocatedTotal > 50
                          ? "bg-red-500"
                          : draftAllocatedTotal === 50
                          ? "bg-emerald-500"
                          : "bg-indigo-600"
                      }`}
                      style={{
                        width: `${Math.min(100, (draftAllocatedTotal / 50) * 100)}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mt-2.5 pt-2 border-t border-indigo-100/70 dark:border-slate-600/60">
                    <span>🎯 السعي التراكمي الفصلي: <strong>50 درجة</strong> (يتحكم بها التدريسي)</span>
                    <span>🏁 الامتحان النهائي (الفاينال): <strong>50 درجة</strong> (ثابت)</span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div>
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">
                    إضافة سريعة لبنود شائعة بضغطة زر:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {assessmentPresets.map((preset, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() =>
                          handleAddDraftAssessment(preset.name, preset.score)
                        }
                        disabled={draftAllocatedTotal + preset.score > 50}
                        className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-600 transition disabled:opacity-40"
                      >
                        + {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add Custom Item Input */}
                <div className="p-3.5 bg-gray-50 dark:bg-slate-700/40 rounded-2xl border border-gray-200/70 dark:border-slate-700">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 block">
                    إضافة بند تقسيم مخصص:
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={customNewAsmName}
                      onChange={(e) => setCustomNewAsmName(e.target.value)}
                      placeholder="اسم البند (مثال: امتحان شهر أول، تقرير، عملي، كويزات...)"
                      className="flex-1 bg-white dark:bg-slate-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={1}
                        max={Math.max(1, draftRemaining)}
                        value={customNewAsmScore}
                        onChange={(e) => setCustomNewAsmScore(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddDraftAssessment();
                          }
                        }}
                        placeholder={`الدرجة (متبقي ${draftRemaining})`}
                        className="w-36 bg-white dark:bg-slate-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-xs font-bold text-center outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddDraftAssessment()}
                        disabled={!customNewAsmName.trim() || !customNewAsmScore}
                        className="bg-primary text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:bg-primary/90 disabled:opacity-40 transition shrink-0"
                      >
                        إضافة البند
                      </button>
                    </div>
                  </div>
                </div>

                {/* Current Draft Assessments List */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      بنود السعي التراكمي المحددة ({customAssessmentsDraft.length})
                    </label>
                    {customAssessmentsDraft.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setCustomAssessmentsDraft([])}
                        className="text-[11px] text-red-500 hover:underline font-bold"
                      >
                        مسح كل البنود
                      </button>
                    )}
                  </div>

                  {customAssessmentsDraft.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 text-gray-400 text-xs">
                      لم يتم إضافة بنود تقسيم لهذه المادة بعد. يمكنك إضافتها الآن أو تركها لحين إعلان التدريسي لتقسيم الدرجة.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {customAssessmentsDraft.map((asm, idx) => (
                        <div
                          key={asm.id}
                          className="flex items-center gap-2 p-2.5 bg-white dark:bg-slate-700/80 border border-gray-200 dark:border-slate-600 rounded-2xl shadow-xs"
                        >
                          <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-xs font-black flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={asm.name}
                            onChange={(e) =>
                              handleUpdateDraftAssessment(
                                asm.id,
                                "name",
                                e.target.value
                              )
                            }
                            className="flex-1 bg-transparent text-xs font-bold text-gray-800 dark:text-white outline-none px-2 py-1 rounded-lg focus:bg-gray-50 dark:focus:bg-slate-800"
                          />
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[11px] text-gray-400">من</span>
                            <input
                              type="number"
                              min={1}
                              max={50}
                              value={asm.maxScore}
                              onChange={(e) =>
                                handleUpdateDraftAssessment(
                                  asm.id,
                                  "maxScore",
                                  e.target.value
                                )
                              }
                              className="w-16 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl px-2 py-1 text-xs font-black text-primary text-center outline-none"
                            />
                            <span className="text-[11px] text-gray-400">درجة</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveDraftAssessment(asm.id)}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition"
                              title="حذف هذا البند"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                <button
                  onClick={() => setCustomizingCourseForGrades(null)}
                  className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 py-3 rounded-2xl font-bold text-xs hover:bg-gray-200 transition"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveCustomCourseAssessments}
                  disabled={draftAllocatedTotal > 50}
                  className="flex-1 bg-primary text-white py-3 rounded-2xl font-bold text-xs shadow-lg shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50 transition active:scale-95"
                >
                  <Save size={16} />
                  <span>حفظ تقسيم الدرجات للمادة</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Single Assessment Grade Entry Modal */}
        {isEditingGrades &&
          selectedCourseForGrading &&
          selectedAssessmentForGrading && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 h-[85vh] flex flex-col border border-gray-100 dark:border-slate-700">
                <div className="flex justify-between items-center mb-3 border-b border-gray-100 dark:border-slate-700 pb-3">
                  <div>
                    <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg">
                      {selectedCourseForGrading.name}
                    </span>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white mt-1">
                      رصد درجات: {selectedAssessmentForGrading.name} (من{" "}
                      {selectedAssessmentForGrading.maxScore} درجة)
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsEditingGrades(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-xl"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Search inside grade editor */}
                <div className="relative mb-3">
                  <Search
                    size={15}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={gradeEditorSearch}
                    onChange={(e) => setGradeEditorSearch(e.target.value)}
                    placeholder="ابحث عن اسم الطالب لرصد درجته..."
                    className="w-full bg-gray-50 dark:bg-slate-700/60 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl pr-10 pl-4 py-2 text-xs outline-none"
                  />
                </div>

                <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-100 dark:border-slate-700">
                  <table className="w-full text-right">
                    <thead className="bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-gray-300 text-xs font-bold sticky top-0 z-10">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">الطالب</th>
                        <th className="p-3 text-center">
                          الدرجة (من {selectedAssessmentForGrading.maxScore})
                        </th>
                        <th className="p-3 text-center">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                      {batchStudents
                        .filter((s) => {
                          const q = gradeEditorSearch.toLowerCase();
                          return (
                            s.name.toLowerCase().includes(q) ||
                            (s.repNickname && s.repNickname.toLowerCase().includes(q))
                          );
                        })
                        .sort((a, b) =>
                          compareArabicNames(
                            a.repNickname?.trim() || a.name,
                            b.repNickname?.trim() || b.name
                          )
                        )
                        .map((student, idx) => (
                          <tr
                            key={student.uid}
                            className="hover:bg-gray-50/70 dark:hover:bg-slate-700/40"
                          >
                            <td className="p-3 text-xs font-bold text-gray-400 w-10">
                              {idx + 1}
                            </td>
                            <td
                              className="p-3 flex items-center gap-2.5 cursor-pointer"
                              onClick={() => handleViewProfile(student.uid)}
                            >
                              <img
                                src={student.avatar}
                                className="w-8 h-8 rounded-full object-cover shrink-0"
                                alt=""
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-xs md:text-sm text-gray-800 dark:text-gray-200">
                                    {student.repNickname || student.name}
                                  </span>
                                  {student.repNickname && (
                                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded-md font-bold">
                                      لقب أبجدي 🏷️
                                    </span>
                                  )}
                                  {canManageGrades && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenNicknameModal(student);
                                      }}
                                      className="text-gray-300 hover:text-primary transition p-0.5"
                                      title="تعديل لقب الطالب للترتيب الأبجدي"
                                    >
                                      <Edit3 size={11} />
                                    </button>
                                  )}
                                </div>
                                {student.repNickname && (
                                  <span className="text-[10px] text-gray-400 block truncate">
                                    الأصل: {student.name}
                                  </span>
                                )}
                                {student.isOfficial && !student.repNickname && (
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                                    طالب مضاف بالسجل
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max={selectedAssessmentForGrading.maxScore}
                                placeholder="--"
                                value={
                                  tempGrades[student.uid] !== undefined
                                    ? tempGrades[student.uid]
                                    : ""
                                }
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  if (raw === "") {
                                    const copy = { ...tempGrades };
                                    delete copy[student.uid];
                                    setTempGrades(copy);
                                  } else {
                                    const val = Math.max(
                                      0,
                                      Math.min(
                                        parseFloat(raw) || 0,
                                        selectedAssessmentForGrading.maxScore
                                      )
                                    );
                                    setTempGrades({
                                      ...tempGrades,
                                      [student.uid]: val,
                                    });
                                  }
                                }}
                                className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 dark:text-white rounded-xl px-3 py-1.5 text-sm outline-none w-24 text-center font-black focus:ring-2 focus:ring-primary/30"
                              />
                            </td>
                            <td className="p-3 text-center">
                              {tempGrades[student.uid] !== undefined ? (
                                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300 px-2.5 py-1 rounded-lg">
                                  {tempGrades[student.uid]} /{" "}
                                  {selectedAssessmentForGrading.maxScore} ✓
                                </span>
                              ) : (
                                <span className="text-[11px] font-bold text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-lg">
                                  لم ترصد
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                  <span className="text-xs text-gray-500 font-bold">
                    تم رصد {Object.keys(tempGrades).length} من أصل{" "}
                    {batchStudents.length} طالب
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditingGrades(false)}
                      className="px-4 py-2.5 text-gray-500 dark:text-gray-400 font-bold text-xs hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleSaveGrades}
                      className="px-6 py-2.5 bg-primary text-white font-bold text-xs rounded-xl shadow-lg hover:bg-primary/90 flex items-center gap-2"
                    >
                      <Save size={16} />
                      حفظ الدرجات وإظهارها للطلاب
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Full Course Cumulative Grade Sheet Modal (كشف رصد السعي الكامل من 50) */}
        {viewingCourseGradeSheet && (() => {
          const cumulativeItems = (
            viewingCourseGradeSheet.assessments || []
          ).filter((a) => !isFinalAssessment(a));
          const totalConfiguredMax = cumulativeItems.reduce(
            (acc, a) => acc + a.maxScore,
            0
          );

          return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-6">
              <div className="bg-white dark:bg-slate-800 w-full max-w-6xl rounded-3xl shadow-2xl p-5 md:p-6 animate-in zoom-in-95 h-[90vh] flex flex-col border border-gray-100 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-slate-700">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-0.5 rounded-full">
                        كشف السعي التراكمي الشامل (من 50)
                      </span>
                      <span className="text-xs text-gray-400 font-bold">
                        {viewingCourseGradeSheet.professors?.join("، ")}
                      </span>
                    </div>
                    <h3 className="font-black text-lg md:text-xl text-gray-800 dark:text-white mt-1">
                      رصد وحساب سعي مادة: {viewingCourseGradeSheet.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => setViewingCourseGradeSheet(null)}
                    className="self-end sm:self-center p-2 text-gray-400 hover:text-gray-600 rounded-xl"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Search Bar */}
                <div className="my-3 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
                  <div className="relative flex-1">
                    <Search
                      size={15}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={gradeEditorSearch}
                      onChange={(e) => setGradeEditorSearch(e.target.value)}
                      placeholder="ابحث عن اسم الطالب في الكشف..."
                      className="w-full bg-gray-50 dark:bg-slate-700/60 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl pr-10 pl-4 py-2 text-xs outline-none"
                    />
                  </div>
                  <div className="text-xs font-bold text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/50 px-3.5 py-2 rounded-2xl">
                    مجموع البنود المقسمة:{" "}
                    <strong className="text-primary">
                      {totalConfiguredMax} / 50 درجة
                    </strong>{" "}
                    + 50 فاينال
                  </div>
                </div>

                {/* Matrix Table */}
                <div className="flex-1 overflow-auto rounded-2xl border border-gray-200 dark:border-slate-700">
                  <table className="w-full text-right border-collapse">
                    <thead className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 text-xs font-black sticky top-0 z-10">
                      <tr>
                        <th className="p-3 border-b border-gray-200 dark:border-slate-600 w-10">
                          #
                        </th>
                        <th className="p-3 border-b border-gray-200 dark:border-slate-600 min-w-[180px]">
                          اسم الطالب
                        </th>
                        {cumulativeItems.map((asm) => (
                          <th
                            key={asm.id}
                            className="p-3 border-b border-gray-200 dark:border-slate-600 text-center min-w-[110px]"
                          >
                            <div className="truncate">{asm.name}</div>
                            <div className="text-[10px] text-primary font-bold">
                              (من {asm.maxScore})
                            </div>
                          </th>
                        ))}
                        <th className="p-3 border-b border-gray-200 dark:border-slate-600 text-center bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 min-w-[120px]">
                          <div>السعي التراكمي</div>
                          <div className="text-[10px]">(من 50)</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700 text-xs">
                      {batchStudents
                        .filter((s) => {
                          const q = gradeEditorSearch.toLowerCase();
                          return (
                            s.name.toLowerCase().includes(q) ||
                            (s.repNickname && s.repNickname.toLowerCase().includes(q))
                          );
                        })
                        .sort((a, b) =>
                          compareArabicNames(
                            a.repNickname?.trim() || a.name,
                            b.repNickname?.trim() || b.name
                          )
                        )
                        .map((student, idx) => {
                          let studentCumulativeTotal = 0;
                          let hasAnyRecorded = false;

                          cumulativeItems.forEach((asm) => {
                            const val =
                              matrixGradesDraft[`${student.uid}__${asm.id}`];
                            if (val !== "" && val !== undefined) {
                              studentCumulativeTotal += Number(val);
                              hasAnyRecorded = true;
                            }
                          });

                          return (
                            <tr
                              key={student.uid}
                              className="hover:bg-gray-50/80 dark:hover:bg-slate-700/40"
                            >
                              <td className="p-3 font-bold text-gray-400">
                                {idx + 1}
                              </td>
                              <td className="p-3 font-bold text-gray-800 dark:text-white">
                                <div className="flex items-center gap-2">
                                  <img
                                    src={student.avatar}
                                    alt=""
                                    className="w-7 h-7 rounded-full object-cover shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="truncate">
                                        {student.repNickname || student.name}
                                      </span>
                                      {student.repNickname && (
                                        <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.2 rounded-md font-bold">
                                          لقب
                                        </span>
                                      )}
                                      {canManageGrades && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenNicknameModal(student);
                                          }}
                                          className="text-gray-300 hover:text-primary transition p-0.5"
                                          title="تعديل لقب الطالب للأبجدية"
                                        >
                                          <Edit3 size={11} />
                                        </button>
                                      )}
                                    </div>
                                    {student.repNickname && (
                                      <span className="text-[10px] text-gray-400 block font-normal truncate">
                                        الأصل: {student.name}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              {cumulativeItems.map((asm) => {
                                const cellKey = `${student.uid}__${asm.id}`;
                                const cellVal = matrixGradesDraft[cellKey];
                                return (
                                  <td key={asm.id} className="p-2 text-center">
                                    <input
                                      type="number"
                                      step="0.5"
                                      min={0}
                                      max={asm.maxScore}
                                      placeholder="--"
                                      value={cellVal !== undefined ? cellVal : ""}
                                      onChange={(e) => {
                                        const raw = e.target.value;
                                        if (raw === "") {
                                          setMatrixGradesDraft((prev) => ({
                                            ...prev,
                                            [cellKey]: "",
                                          }));
                                        } else {
                                          const num = Math.max(
                                            0,
                                            Math.min(
                                              asm.maxScore,
                                              parseFloat(raw) || 0
                                            )
                                          );
                                          setMatrixGradesDraft((prev) => ({
                                            ...prev,
                                            [cellKey]: num,
                                          }));
                                        }
                                      }}
                                      className="w-20 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-2 py-1.5 text-center font-black text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                  </td>
                                );
                              })}
                              <td className="p-3 text-center bg-indigo-50/40 dark:bg-indigo-950/20 font-black">
                                {hasAnyRecorded ? (
                                  <span
                                    className={`px-2.5 py-1 rounded-xl text-xs ${
                                      studentCumulativeTotal >= 25
                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                        : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                                    }`}
                                  >
                                    {studentCumulativeTotal} / 50
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-- / 50</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center gap-3 pt-4 mt-3 border-t border-gray-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      const c = viewingCourseGradeSheet;
                      setViewingCourseGradeSheet(null);
                      handleOpenCustomizeCourseGrades(c);
                    }}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Edit3 size={14} />
                    <span>تعديل تقسيم الـ 50 درجة لهذه المادة</span>
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewingCourseGradeSheet(null)}
                      disabled={isSavingMatrixGrades}
                      className="px-4 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-xs"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleSaveMatrixGrades}
                      disabled={isSavingMatrixGrades}
                      className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs shadow-lg shadow-primary/25 flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSavingMatrixGrades ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          <span>جاري الحفظ...</span>
                        </>
                      ) : (
                        <>
                          <Save size={15} />
                          <span>حفظ جميع السعيات والدرجات</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Courses Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const cumulativeAssessments = (course.assessments || []).filter(
              (a) => !isFinalAssessment(a)
            );
            const allocatedCumulative = cumulativeAssessments.reduce(
              (acc, a) => acc + Number(a.maxScore || 0),
              0
            );

            return (
              <div
                key={course.id}
                className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  {/* Course Header */}
                  <div className="p-5 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/30 flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-black text-gray-800 dark:text-white text-base md:text-lg">
                        {course.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {course.professors?.join("، ") || "غير محدد"}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleStartEditCourse(course)}
                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition"
                        title="تعديل اسم المادة أو الأستاذ"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                        title="حذف المادة"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* 50 Cumulative + 50 Final Overview Strip */}
                  <div className="px-5 pt-4">
                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-indigo-50/60 dark:bg-slate-700/40 border border-indigo-100/80 dark:border-slate-700 text-center">
                      <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-indigo-100/60 dark:border-slate-600">
                        <span className="block text-[10px] text-gray-400 font-bold">
                          السعي التراكمي (بيد التدريسي)
                        </span>
                        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                          50 درجة{" "}
                          <span className="text-[10px] font-bold text-gray-400">
                            (مقسم {allocatedCumulative}/50)
                          </span>
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-indigo-100/60 dark:border-slate-600">
                        <span className="block text-[10px] text-gray-400 font-bold">
                          الامتحان النهائي (الفاينال)
                        </span>
                        <span className="text-sm font-black text-purple-600 dark:text-purple-400">
                          50 درجة
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Customizable Cumulative Items List */}
                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-600 dark:text-gray-300">
                        تفاصيل تقسيم الـ 50 التراكمي:
                      </p>
                      <button
                        onClick={() => handleOpenCustomizeCourseGrades(course)}
                        className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        <Edit3 size={12} />
                        <span>تخصيص التقسيم</span>
                      </button>
                    </div>

                    {cumulativeAssessments.length > 0 ? (
                      <div className="space-y-2">
                        {cumulativeAssessments.map((asm) => {
                          const gradedCount = grades.filter(
                            (g) =>
                              g.courseId === course.id &&
                              g.assessmentId === asm.id
                          ).length;

                          return (
                            <div
                              key={asm.id}
                              className="flex justify-between items-center bg-gray-50 dark:bg-slate-700/50 p-2.5 rounded-xl border border-gray-100 dark:border-slate-700"
                            >
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block truncate">
                                  {asm.name}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  من <strong>{asm.maxScore}</strong> درجة • تم رصد{" "}
                                  {gradedCount} طالب
                                </span>
                              </div>
                              <button
                                onClick={() =>
                                  handleOpenGradeEditor(course, asm)
                                }
                                className="text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 hover:border-primary hover:text-primary dark:text-gray-200 px-3 py-1.5 rounded-xl transition font-bold shadow-xs shrink-0"
                              >
                                رصد الدرجة
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-5 px-3 bg-gray-50/70 dark:bg-slate-700/30 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                          لم يتم تخصيص تقسيم الـ 50 التراكمي بعد
                        </p>
                        <p className="text-[10px] text-gray-400 mb-3">
                          اضغط بالأسفل لتحديد تقسيم الدكتور (امتحانات، تقارير، كويزات...)
                        </p>
                        <button
                          onClick={() => handleOpenCustomizeCourseGrades(course)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition inline-flex items-center gap-1.5"
                        >
                          <Plus size={14} />
                          <span>تخصيص تقسيم الـ 50 درجة</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Buttons */}
                <div className="px-5 pb-5 pt-2 space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenCustomizeCourseGrades(course)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <PieChart size={14} />
                      <span>تقسيم الـ 50</span>
                    </button>
                    {cumulativeAssessments.length > 0 && (
                      <button
                        onClick={() => handleOpenCourseGradeSheet(course)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-primary text-white hover:bg-primary/90 text-xs font-bold shadow-sm shadow-primary/20 transition flex items-center justify-center gap-1.5"
                      >
                        <BarChart3 size={14} />
                        <span>كشف السعي الكامل</span>
                      </button>
                    )}
                  </div>
                  {(() => {
                    const myGradesInCourse = grades.filter(
                      (g) =>
                        g.courseId === course.id &&
                        g.studentId === currentUser?.uid
                    );
                    const mySaei = cumulativeAssessments.reduce(
                      (acc, asm) => {
                        const gr = myGradesInCourse.find(
                          (g) => g.assessmentId === asm.id
                        );
                        return acc + (gr ? Number(gr.score) : 0);
                      },
                      0
                    );
                    const hasMyGrades = myGradesInCourse.some((g) =>
                      cumulativeAssessments.some((a) => a.id === g.assessmentId)
                    );
                    return (
                      <FinalExamGradeCalculator
                        courseName={course.name}
                        currentCumulativeScore={mySaei}
                        hasRecordedGrades={hasMyGrades}
                      />
                    );
                  })()}
                </div>
              </div>
            );
          })}
          {courses.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-400 dark:text-gray-500 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700">
              لم تقم بإضافة مواد دراسية بعد.
            </div>
          )}
        </div>
      </div>
    );
  }

  // STUDENT VIEW
  return (
    <div className="space-y-6 p-4 pb-20 animate-in fade-in duration-300">
      {/* Student Hero Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold">
              50 درجة سعي تراكمي + 50 درجة امتحان نهائي (فاينال)
            </span>
          </div>
          <h2 className="text-2xl font-black mb-1">
            سجل السعي التراكمي وتقسيم الدرجات 🎓
          </h2>
          <p className="opacity-90 text-xs md:text-sm max-w-2xl">
            شاهد تقسيم درجة الـ 50 التراكمية لكل مادة كما حددها التدريسي، وتابع درجاتك المعلنة ومجموع سعيك الفصلي قبل الامتحان النهائي.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {courses.map((course) => {
          const studentGrades = grades.filter(
            (g) =>
              g.courseId === course.id && g.studentId === currentUser?.uid
          );

          const cumulativeAssessments = (course.assessments || []).filter(
            (a) => !isFinalAssessment(a)
          );

          const allocatedCumulativeMax = cumulativeAssessments.reduce(
            (acc, a) => acc + Number(a.maxScore || 0),
            0
          );

          // Sum of student's recorded cumulative grades
          const studentCumulativeEarned = cumulativeAssessments.reduce(
            (acc, asm) => {
              const gr = studentGrades.find(
                (g) => g.assessmentId === asm.id
              );
              return acc + (gr ? Number(gr.score) : 0);
            },
            0
          );

          // Sum of maxScore of only the assessments that have been graded for this student
          const gradedAssessmentsMax = cumulativeAssessments.reduce(
            (acc, asm) => {
              const gr = studentGrades.find(
                (g) => g.assessmentId === asm.id
              );
              return acc + (gr !== undefined ? Number(asm.maxScore) : 0);
            },
            0
          );

          const hasAnyRecordedGrade = studentGrades.some((g) =>
            cumulativeAssessments.some((a) => a.id === g.assessmentId)
          );

          return (
            <div
              key={course.id}
              className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Course Title & Total Structure Pill */}
                <div className="flex justify-between items-start gap-2 mb-4">
                  <div>
                    <h3 className="font-black text-gray-800 dark:text-white text-lg">
                      {course.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {course.professors?.join("، ") || "غير محدد"}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[11px] font-black bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 shrink-0">
                    50 سعي + 50 فاينال
                  </span>
                </div>

                {/* Visual Split: 50 Cumulative vs 50 Final */}
                <div className="grid grid-cols-2 gap-2.5 mb-5">
                  <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
                    <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 block mb-0.5">
                      سعيك التراكمي حتى الآن
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black text-indigo-700 dark:text-indigo-300">
                        {hasAnyRecordedGrade ? studentCumulativeEarned : "--"}
                      </span>
                      <span className="text-xs font-bold text-gray-400">
                        / 50 درجة
                      </span>
                    </div>
                    {gradedAssessmentsMax > 0 && (
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 block mt-0.5">
                        من أصل {gradedAssessmentsMax} درجة معلنة
                      </span>
                    )}
                  </div>

                  <div className="p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
                    <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 block mb-0.5">
                      الامتحان النهائي (الفاينال)
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black text-purple-700 dark:text-purple-300">
                        50
                      </span>
                      <span className="text-xs font-bold text-gray-400">
                        درجة ثابتة
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 block mt-0.5">
                      المجموع النهائي للمادة من 100
                    </span>
                  </div>
                </div>

                {/* Breakdown of the 50 Cumulative Coursework */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400">
                    <span>تقسيم الـ 50 التراكمي لهذه المادة:</span>
                    <span>موزع {allocatedCumulativeMax} من 50</span>
                  </div>

                  {cumulativeAssessments.length > 0 ? (
                    <div className="space-y-2">
                      {cumulativeAssessments.map((asm) => {
                        const grade = studentGrades.find(
                          (g) => g.assessmentId === asm.id
                        );
                        const isRecorded = grade !== undefined;

                        return (
                          <div
                            key={asm.id}
                            className={`flex justify-between items-center p-3 rounded-2xl border transition ${
                              isRecorded
                                ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-900/40"
                                : "bg-gray-50 dark:bg-slate-700/50 border-gray-100 dark:border-slate-700"
                            }`}
                          >
                            <div>
                              <span className="text-xs md:text-sm font-bold text-gray-800 dark:text-gray-200 block">
                                {asm.name}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                الوزن المخصص: {asm.maxScore} درجة من السعي
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {isRecorded ? (
                                <span className="px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-sm font-black text-emerald-600 dark:text-emerald-400 shadow-2xs">
                                  {grade.score}{" "}
                                  <span className="text-[11px] font-bold text-gray-400">
                                    / {asm.maxScore}
                                  </span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-xl bg-white/70 dark:bg-slate-800 text-[11px] font-bold text-gray-400">
                                  لم ترصد بعد (/ {asm.maxScore})
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 px-4 bg-gray-50 dark:bg-slate-700/30 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                        السعي التراكمي من 50 درجة (لم يقم الممثل بتفصيل بنود التقسيم بعد)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Cumulative Progress Bar Footer + Final Exam Calculator */}
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-700">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                    مجموع السعي التراكمي المحقق (من 50)
                  </span>
                  <span className="text-base font-black text-primary">
                    {studentCumulativeEarned}{" "}
                    <span className="text-xs font-bold text-gray-400">
                      / 50
                    </span>
                  </span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (studentCumulativeEarned / 50) * 100
                      )}%`,
                    }}
                  />
                </div>

                {/* Smart Final Exam Calculator (ماذا أحتاج بالفاينال؟) */}
                <FinalExamGradeCalculator
                  courseName={course.name}
                  currentCumulativeScore={studentCumulativeEarned}
                  hasRecordedGrades={hasAnyRecordedGrade}
                />
              </div>
            </div>
          );
        })}
        {courses.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400 dark:text-gray-500 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700">
            لا توجد مواد مسجلة لعرض تقسيم الدرجات والسعي.
          </div>
        )}
      </div>
    </div>
  );
};
