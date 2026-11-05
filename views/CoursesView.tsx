import React, { useState } from "react";
import {
  BookOpen,
  User as UserIcon,
  Plus,
  Layers,
  PieChart,
  Edit3,
  Trash2,
  X,
  Save,
} from "lucide-react";
import { Course, Tab } from "../types";

export interface CoursesViewProps {
  courses: Course[];
  isManager: boolean;
  canManageMaterials: boolean;
  setActiveTab: (tab: Tab) => void;
  onOpenCustomizeCourseGrades: (course: Course) => void;
  onAddCourse: (name: string, professor: string) => Promise<void>;
  onEditCourse: (courseId: string, name: string, professor: string) => Promise<void>;
  onDeleteCourse: (courseId: string) => Promise<void>;
}

export const CoursesView: React.FC<CoursesViewProps> = ({
  courses,
  isManager,
  canManageMaterials,
  setActiveTab,
  onOpenCustomizeCourseGrades,
  onAddCourse,
  onEditCourse,
  onDeleteCourse,
}) => {
  const [courseName, setCourseName] = useState("");
  const [courseProf, setCourseProf] = useState("");
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editCourseName, setEditCourseName] = useState("");
  const [editCourseProf, setEditCourseProf] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isManager && !canManageMaterials) {
    return (
      <div className="p-8 text-center text-gray-500">
        هذه الصفحة مخصصة لممثلي الدفعات ومسؤولي الملازم والمشرفين فقط.
      </div>
    );
  }

  const handleAdd = async () => {
    if (!courseName.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAddCourse(courseName.trim(), courseProf.trim());
      setCourseName("");
      setCourseProf("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (course: Course) => {
    setEditingCourse(course);
    setEditCourseName(course.name);
    setEditCourseProf(course.professors.join("، "));
  };

  const handleSaveEdit = async () => {
    if (!editingCourse || !editCourseName.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onEditCourse(editingCourse.id, editCourseName.trim(), editCourseProf.trim());
      setEditingCourse(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-4 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-primary opacity-20"></div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <BookOpen className="text-primary" size={24} />
          إدارة المواد الدراسية والأساتذة
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-gray-50 dark:bg-slate-700 px-4 py-2 rounded-2xl border border-gray-200 dark:border-slate-600 flex items-center gap-2">
            <BookOpen size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="اسم المادة الدراسية (مثال: شبكات)"
              className="flex-1 bg-transparent text-sm outline-none dark:text-white"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
            />
          </div>
          <div className="bg-gray-50 dark:bg-slate-700 px-4 py-2 rounded-2xl border border-gray-200 dark:border-slate-600 flex items-center gap-2">
            <UserIcon size={20} className="text-gray-400 mt-1" />
            <input
              type="text"
              placeholder="اسم الأستاذ (اختياري)"
              className="flex-1 bg-transparent text-sm outline-none dark:text-white"
              value={courseProf}
              onChange={(e) => setCourseProf(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!courseName.trim() || isSubmitting}
            className="bg-primary text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-primary/30 transition hover:bg-primary/90 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Plus size={20} />
            إضافة المادة
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-3 mr-1">
          * المواد تظهر تلقائياً في الجدول، الدرجات، والمحاضرات للطلاب.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {courses.length === 0 ? (
          <div className="md:col-span-2 text-center py-12 bg-gray-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-700 text-gray-400">
            <Layers size={40} className="mx-auto mb-3 opacity-20" />
            لا توجد مواد مضافة حالياً.
          </div>
        ) : (
          courses.map((course) => (
            <div
              key={course.id}
              className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex justify-between items-center group hover:shadow-md transition duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold text-lg">
                  {course.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white group-hover:text-primary transition">
                    {course.name}
                  </h3>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <UserIcon size={12} />
                    {course.professors.join("، ")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab(Tab.GRADES);
                    onOpenCustomizeCourseGrades(course);
                  }}
                  className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl transition flex items-center gap-1 text-xs font-bold cursor-pointer"
                  title="تخصيص تقسيم الـ 50 التراكمي للمادة"
                >
                  <PieChart size={15} />
                  <span className="hidden sm:inline">تقسيم السعي (50)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStartEdit(course)}
                  className="p-2 text-primary hover:bg-primary/10 bg-primary/5 rounded-xl transition flex items-center gap-1 text-xs font-bold cursor-pointer"
                  title="تعديل المادة والتدريسي"
                >
                  <Edit3 size={16} />
                  <span className="hidden sm:inline">تعديل</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteCourse(course.id)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 bg-red-50/50 dark:bg-red-950/30 rounded-xl transition cursor-pointer"
                  title="حذف المادة"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Course Modal */}
      {editingCourse && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 border border-gray-100 dark:border-slate-700">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Edit3 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                    تعديل بيانات المادة
                  </h3>
                  <p className="text-xs text-gray-400">
                    تعديل اسم المادة أو اسم التدريسي المسؤول عنها
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCourse(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-xl cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                  اسم المادة الدراسية <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editCourseName}
                  onChange={(e) => setEditCourseName(e.target.value)}
                  placeholder="مثال: البرمجة الكيانية"
                  className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                  اسم الأستاذ / التدريسي
                </label>
                <input
                  type="text"
                  value={editCourseProf}
                  onChange={(e) => setEditCourseProf(e.target.value)}
                  placeholder="مثال: د. أحمد علي أو أ. مريم"
                  className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  يمكن كتابة أكثر من تدريسي بالفصل بفاصلة (،)
                </p>
              </div>
              <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 py-3 rounded-2xl font-bold text-sm hover:bg-gray-200 transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={!editCourseName.trim() || isSubmitting}
                  className="flex-1 bg-primary text-white py-3 rounded-2xl font-bold text-sm shadow-lg shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50 transition active:scale-95 cursor-pointer"
                >
                  <Save size={18} />
                  حفظ التعديلات
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
