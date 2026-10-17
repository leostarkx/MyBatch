import React, { useState } from 'react';
import {
  GraduationCap,
  CalendarCheck,
  Award,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Download,
  Users,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import { Course, Grade, AttendanceSession, AttendanceRecord, User } from '../types';

interface AcademicPathViewProps {
  initialSubTab?: 'grades' | 'attendance' | 'schedule';
  currentUser: User | null;
  courses: Course[];
  grades: Grade[];
  attendanceSessions: AttendanceSession[];
  attendanceRecords: AttendanceRecord[];
  effectiveBatchCode: string;
  isManager: boolean;
  onOpenAttendanceReport: (student: User) => void;
  renderGradesContent: () => React.ReactNode;
  renderAttendanceContent: () => React.ReactNode;
  renderScheduleContent: () => React.ReactNode;
}

export const AcademicPathView: React.FC<AcademicPathViewProps> = ({
  initialSubTab = 'grades',
  currentUser,
  courses,
  grades,
  attendanceSessions,
  attendanceRecords,
  effectiveBatchCode,
  isManager,
  onOpenAttendanceReport,
  renderGradesContent,
  renderAttendanceContent,
  renderScheduleContent,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'grades' | 'attendance' | 'schedule'>(initialSubTab);

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  return (
    <div className="space-y-6 p-2 sm:p-4 animate-in slide-in-from-bottom-3 duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-cyan-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                <GraduationCap size={14} className="text-emerald-200" />
                المسار الأكاديمي والالتزام
              </span>
              <span className="bg-white/10 px-3 py-1 rounded-full text-xs">
                دفعة {currentUser?.batchCode || effectiveBatchCode}
              </span>
              {currentUser?.academicGroup && (
                <span className="bg-white/25 px-3 py-1 rounded-full text-xs font-black">
                  🔬 كروبك: {currentUser.academicGroup}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mb-1.5 flex items-center gap-2.5">
              <span>📊 المسار الأكاديمي، السعي، والحضور</span>
            </h1>
            <p className="opacity-90 text-xs sm:text-sm max-w-2xl leading-relaxed">
              متابعة السعي التراكمي من 50، درجات الكويزات، كشوفات الحضور والغياب للكروبات A/B/C/D، واستخراج تقرير الـ PDF الرسمي وجدول المحاضرات الأسبوعي.
            </p>
          </div>

          {/* Quick PDF Report Trigger */}
          {currentUser && (
            <button
              type="button"
              onClick={() => onOpenAttendanceReport(currentUser)}
              className="bg-white text-emerald-800 hover:bg-emerald-50 px-5 py-3 rounded-2xl font-black text-xs sm:text-sm transition shadow-lg flex items-center justify-center gap-2 shrink-0 active:scale-95 cursor-pointer self-start sm:self-auto"
            >
              <Download size={17} />
              <span>تقرير الحضور الرسمي (PDF) 📄</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveSubTab('grades')}
          className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 ${
            activeSubTab === 'grades'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
          }`}
        >
          <Award size={17} />
          <span>الدرجات والسعي من 50</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('attendance')}
          className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 ${
            activeSubTab === 'attendance'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
          }`}
        >
          <CalendarCheck size={17} />
          <span>الحضور والغياب والكروبات</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('schedule')}
          className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 ${
            activeSubTab === 'schedule'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
          }`}
        >
          <Clock size={17} />
          <span>الجدول الأسبوعي والقاعات</span>
        </button>
      </div>

      {/* Sub-Views Content */}
      {activeSubTab === 'grades' && (
        <div className="animate-in fade-in duration-200">
          {renderGradesContent()}
        </div>
      )}

      {activeSubTab === 'attendance' && (
        <div className="animate-in fade-in duration-200">
          {renderAttendanceContent()}
        </div>
      )}

      {activeSubTab === 'schedule' && (
        <div className="animate-in fade-in duration-200">
          {renderScheduleContent()}
        </div>
      )}
    </div>
  );
};
