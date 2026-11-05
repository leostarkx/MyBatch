import React from 'react';
import {
  ArrowRight,
  ArrowRightLeft,
  BookOpen,
  Calendar,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Download,
  Edit3,
  FileText,
  Loader2,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Trash2,
  User as UserIcon,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  Course,
  AttendanceSession,
  AttendanceRecord,
  LectureSchedule,
  User,
  UserRole,
  Tab,
} from '../types';
import {
  compareArabicNames,
  saveAttendanceSessionToFirestore,
} from '../services/firebase';

export const getArabicDayFromDateStr = (dateStr: string): string => {
  if (!dateStr) return "الأحد";
  const parts = dateStr.split("-").map(Number);
  const d =
    parts.length === 3
      ? new Date(parts[0], parts[1] - 1, parts[2])
      : new Date(dateStr);
  const map: Record<number, string> = {
    0: "الأحد",
    1: "الاثنين",
    2: "الثلاثاء",
    3: "الأربعاء",
    4: "الخميس",
    5: "الجمعة",
    6: "السبت",
  };
  return map[d.getDay()] || "الأحد";
};

export const getMostRecentDateForArabicDay = (arabicDay: string): string => {
  const dayMap: Record<string, number> = {
    "الأحد": 0,
    "الاثنين": 1,
    "الثلاثاء": 2,
    "الأربعاء": 3,
    "الخميس": 4,
    "الجمعة": 5,
    "السبت": 6,
  };
  const targetJsDay = dayMap[arabicDay];
  const now = new Date();
  if (targetJsDay === undefined) {
    return now.toISOString().slice(0, 10);
  }
  const currentJsDay = now.getDay();
  let diff = currentJsDay - targetJsDay;
  if (diff < 0) diff += 7;
  const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
  const dd = String(targetDate.getDate()).padStart(2, "0");
  return ;
};

export const parseScheduleTimeMinutes = (timeStr?: string): number => {
  if (!timeStr) return 9999;
  const clean = timeStr.trim();
  const isPM = clean.includes("م") || clean.toLowerCase().includes("pm");
  const isAM = clean.includes("ص") || clean.toLowerCase().includes("am");
  const match = clean.match(/(\d{1,2}):(\d{2})/);
  if (!match) return 9999;
  let hours = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;
  if (!isPM && !isAM && hours >= 1 && hours <= 6) hours += 12;
  return hours * 60 + mins;
};

export interface AttendanceSheetViewProps {
  currentUser: User | null;
  canManageAttendance: boolean;
  effectiveBatchCode: string;
  courses: Course[];
  appUsers: User[];
  schedules: LectureSchedule[];
  attendanceSessions: AttendanceSession[];
  attendanceRecords: AttendanceRecord[];
  batchAcademicGroups: string[];
  selectedSessionId: string | null;
  setSelectedSessionId: (id: string | null) => void;
  selectedCourseForAttendance: Course | null;
  setSelectedCourseForAttendance: (c: Course | null) => void;
  attendanceTargetDate: string;
  setAttendanceTargetDate: (d: string) => void;
  attendanceSearchQuery: string;
  setAttendanceSearchQuery: (q: string) => void;
  attendanceSheetGroupFilter: string;
  setAttendanceSheetGroupFilter: (g: string) => void;
  setAttendanceGroupFilter?: (g: string) => void;
  isAddingSession: boolean;
  setIsAddingSession: (v: boolean) => void;
  newSessionDate: string;
  setNewSessionDate: (d: string) => void;
  newSessionTitle: string;
  setNewSessionTitle: (t: string) => void;
  newSessionTargetGroup: string;
  setNewSessionTargetGroup: (g: string) => void;
  selectedScheduleSlotId: string;
  setSelectedScheduleSlotId: (id: string) => void;
  isCopyingAttendance: boolean;
  copyAttendanceSuccess: string | null;
  setCopyAttendanceSuccess: (msg: string | null) => void;
  copyFromSessionId: string;
  setCopyFromSessionId: (id: string) => void;
  isExceptionModalOpen: boolean;
  setIsExceptionModalOpen: (v: boolean) => void;
  exceptionMode: 'GUEST_ONLY' | 'SWAP_WITH_STUDENT';
  setExceptionMode: (m: 'GUEST_ONLY' | 'SWAP_WITH_STUDENT') => void;
  exceptionGuestStudentId: string;
  setExceptionGuestStudentId: (id: string) => void;
  exceptionSwapTargetStudentId: string;
  setExceptionSwapTargetStudentId: (id: string) => void;
  exceptionNoteInput: string;
  setExceptionNoteInput: (n: string) => void;
  setActiveTab: (tab: Tab) => void;
  setSchedFilterDay?: (day: string) => void;
  handleMarkAttendance: (sessionId: string, studentId: string, status: AttendanceRecord['status']) => void;
  handleBulkMarkAttendance: (sessionId: string, status: AttendanceRecord['status']) => void;
  handleDeleteSession: (sessionId: string) => void;
  handleCreateSession: (autoCopyFromSessionId?: string) => void;
  handleCopyAttendanceFromSession: (sourceSessionId: string, targetSessId?: string) => void;
  handleOpenOrCreateScheduledAttendance: (sched: LectureSchedule, dateStr: string, autoCopyFromSessionId?: string) => void;
  handleAddExceptionOrSwapAttendance: () => void;
  handleRemoveExceptionStudent: (recordId: string) => void;
  handleViewProfile: (uid: string) => void;
  onOpenAttendanceReport: (student: User) => void;
  onOpenNicknameModal: (student: User) => void;
}

export const AttendanceSheetView: React.FC<AttendanceSheetViewProps> = ({
  currentUser,
  canManageAttendance,
  effectiveBatchCode,
  courses,
  appUsers,
  schedules,
  attendanceSessions,
  attendanceRecords,
  batchAcademicGroups,
  selectedSessionId,
  setSelectedSessionId,
  selectedCourseForAttendance,
  setSelectedCourseForAttendance,
  attendanceTargetDate,
  setAttendanceTargetDate,
  attendanceSearchQuery,
  setAttendanceSearchQuery,
  attendanceSheetGroupFilter,
  setAttendanceSheetGroupFilter,
  setAttendanceGroupFilter,
  isAddingSession,
  setIsAddingSession,
  newSessionDate,
  setNewSessionDate,
  newSessionTitle,
  setNewSessionTitle,
  newSessionTargetGroup,
  setNewSessionTargetGroup,
  selectedScheduleSlotId,
  setSelectedScheduleSlotId,
  isCopyingAttendance,
  copyAttendanceSuccess,
  setCopyAttendanceSuccess,
  copyFromSessionId,
  setCopyFromSessionId,
  isExceptionModalOpen,
  setIsExceptionModalOpen,
  exceptionMode,
  setExceptionMode,
  exceptionGuestStudentId,
  setExceptionGuestStudentId,
  exceptionSwapTargetStudentId,
  setExceptionSwapTargetStudentId,
  exceptionNoteInput,
  setExceptionNoteInput,
  setActiveTab,
  setSchedFilterDay,
  handleMarkAttendance,
  handleBulkMarkAttendance,
  handleDeleteSession,
  handleCreateSession,
  handleCopyAttendanceFromSession,
  handleOpenOrCreateScheduledAttendance,
  handleAddExceptionOrSwapAttendance,
  handleRemoveExceptionStudent,
  handleViewProfile,
  onOpenAttendanceReport,
  onOpenNicknameModal,
}) => {
  const findMatchedCourseForSchedule = (sched: LectureSchedule): Course | undefined => {
    return courses.find(
      (c) =>
        (sched.courseId && c.id === sched.courseId) ||
        c.name.trim() === sched.courseName.trim()
    );
  };

  const findExistingSessionForSchedule = (
    sched: LectureSchedule,
    dateStr: string
  ): AttendanceSession | undefined => {
    const matchedCourse = findMatchedCourseForSchedule(sched);
    const effectiveCourseId = matchedCourse?.id || sched.courseId || sched.id;

    return attendanceSessions.find((s) => {
      if (s.date !== dateStr) return false;
      if (s.scheduleId && s.scheduleId === sched.id) return true;
      if (
        s.courseId === effectiveCourseId &&
        s.startTime &&
        sched.startTime &&
        s.startTime === sched.startTime
      ) {
        return true;
      }
      if (
        s.courseId === effectiveCourseId &&
        sched.startTime &&
        s.title?.includes(sched.startTime)
      ) {
        return true;
      }
      return false;
    });
  };

    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

    const targetArabicDay = getArabicDayFromDateStr(attendanceTargetDate);
    const weekDaysList = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "السبت"];

    // All batch students included in attendance statistics
    const activeBatchStudents = appUsers.filter((u) => {
      if (u.role === UserRole.OWNER) return false;
      if (u.excludeFromStats) return false;
      if (u.batchCode === effectiveBatchCode) return true;
      if (u.isOfficial && (!u.batchCode || u.batchCode === effectiveBatchCode)) return true;
      return false;
    });

    // MANAGER VIEW (Representative, Admin, Owner, and Attendance Assistant)
    if (canManageAttendance) {
      if (selectedSessionId) {
        // View specific session attendance
        const session = attendanceSessions.find(
          (s) => s.id === selectedSessionId,
        );
        const course = courses.find(
          (c) =>
            c.id === session?.courseId ||
            (session?.courseName && c.name.trim() === session.courseName.trim())
        );
        const linkedSchedule = session?.scheduleId
          ? schedules.find((sc) => sc.id === session.scheduleId)
          : undefined;

        const sessionTargetGroup =
          session?.targetGroup || linkedSchedule?.targetGroup || "ALL";
        const isGroupSpecificSession =
          Boolean(sessionTargetGroup) && sessionTargetGroup !== "ALL";

        const records = attendanceRecords.filter(
          (r) => r.sessionId === selectedSessionId,
        );
        const presentCount = records.filter(
          (r) => r.status === "PRESENT",
        ).length;
        const absentCount = records.filter(
          (r) => r.status === "ABSENT",
        ).length;
        const excusedCount = records.filter(
          (r) => r.status === "EXCUSED",
        ).length;

        // Alphabetical sorting in Arabic
        const sortedStudents = [...activeBatchStudents].sort((a, b) =>
          compareArabicNames(
            a.repNickname?.trim() || a.name,
            b.repNickname?.trim() || b.name
          )
        );

        // Students who belong to this session's target group OR have an exception/record in this session
        const relevantSessionStudents = isGroupSpecificSession
          ? sortedStudents.filter(
              (s) =>
                s.academicGroup === sessionTargetGroup ||
                records.some((r) => r.studentId === s.uid)
            )
          : sortedStudents;

        // Apply sheet group filter + search query
        const groupFilteredStudents = sortedStudents.filter((s) => {
          if (attendanceSheetGroupFilter === "SESSION_GROUP") {
            if (!isGroupSpecificSession) return true;
            return (
              s.academicGroup === sessionTargetGroup ||
              records.some((r) => r.studentId === s.uid)
            );
          }
          if (attendanceSheetGroupFilter === "ALL") {
            return true;
          }
          if (attendanceSheetGroupFilter === "UNASSIGNED") {
            return !s.academicGroup;
          }
          return s.academicGroup === attendanceSheetGroupFilter;
        });

        const displayedStudents = groupFilteredStudents.filter((s) =>
          s.name.toLowerCase().includes(attendanceSearchQuery.toLowerCase())
        );

        const unrecordedCount = Math.max(
          0,
          relevantSessionStudents.length -
            (presentCount + absentCount + excusedCount)
        );

        // Exceptions list in this session
        const exceptionRecords = records.filter((r) => {
          if (r.isException) return true;
          if (isGroupSpecificSession) {
            const st = sortedStudents.find((u) => u.uid === r.studentId);
            return Boolean(
              st && st.academicGroup && st.academicGroup !== sessionTargetGroup
            );
          }
          return false;
        });

        // Students from OTHER groups available to add as an exception/swap
        const otherGroupStudents = sortedStudents.filter((s) => {
          if (isGroupSpecificSession) {
            return s.academicGroup !== sessionTargetGroup;
          }
          return true;
        });

        // Students in THIS session's group (for swap target selection)
        const currentGroupStudents = isGroupSpecificSession
          ? sortedStudents.filter((s) => s.academicGroup === sessionTargetGroup)
          : sortedStudents;

        // Find previous sessions that have attendance records (prioritizing same-day lectures & same targetGroup!)
        const previousSessionsWithRecords = attendanceSessions
          .filter(
            (s) =>
              s.id !== selectedSessionId &&
              attendanceRecords.some((r) => r.sessionId === s.id)
          )
          .sort((a, b) => {
            const aSameDay = a.date === session?.date ? 1 : 0;
            const bSameDay = b.date === session?.date ? 1 : 0;
            if (aSameDay !== bSameDay) return bSameDay - aSameDay;
            const aSameGroup =
              (a.targetGroup || "ALL") === sessionTargetGroup ? 1 : 0;
            const bSameGroup =
              (b.targetGroup || "ALL") === sessionTargetGroup ? 1 : 0;
            if (aSameGroup !== bSameGroup) return bSameGroup - aSameGroup;
            if (a.date !== b.date) return b.date.localeCompare(a.date);
            return (b.timestamp || 0) - (a.timestamp || 0);
          });

        const primaryPrevSession = previousSessionsWithRecords[0];
        const primaryPrevCourse = courses.find(
          (c) => c.id === primaryPrevSession?.courseId
        );
        const isPrimarySameDay =
          primaryPrevSession && primaryPrevSession.date === session?.date;

        const sessionStartTime = session?.startTime || linkedSchedule?.startTime;
        const sessionEndTime = session?.endTime || linkedSchedule?.endTime;
        const sessionHall = session?.hall || linkedSchedule?.hall;
        const sessionLectureType =
          session?.lectureType || linkedSchedule?.lectureType;

        return (
          <div className="space-y-6 p-4 pb-20 animate-in fade-in duration-200">
            {/* Session Top Bar */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedSessionId(null);
                    setAttendanceSearchQuery("");
                    setCopyAttendanceSuccess(null);
                    setAttendanceSheetGroupFilter("SESSION_GROUP");
                  }}
                  className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-600 transition shrink-0"
                  title="العودة لقائمة المحاضرات"
                >
                  <ChevronLeft
                    size={20}
                    className="rtl:rotate-180 text-gray-700 dark:text-gray-200"
                  />
                </button>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg md:text-xl font-black text-gray-800 dark:text-white">
                      {session?.title || "سجل الحضور"}
                    </h2>
                    {(course?.name || session?.courseName) && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                        {course?.name || session?.courseName}
                      </span>
                    )}
                    {sessionLectureType && (
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          sessionLectureType === "PRACTICAL"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                        }`}
                      >
                        {sessionLectureType === "PRACTICAL"
                          ? "عملي / مختبر 🔬"
                          : "نظري 📖"}
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        isGroupSpecificSession
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/60"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                      }`}
                    >
                      <Users size={11} />
                      <span>
                        {isGroupSpecificSession
                          ? `مخصصة لـ: ${sessionTargetGroup}`
                          : "لجميع الكروبات (العام)"}
                      </span>
                    </span>
                    {(session?.scheduleId || linkedSchedule) && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                        🔄 من الجدول الأسبوعي
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex flex-wrap items-center gap-2.5">
                    <span className="flex items-center gap-1 font-bold text-gray-700 dark:text-gray-200">
                      <Calendar size={13} className="text-primary" />
                      {getArabicDayFromDateStr(session?.date || "")} ({session?.date})
                    </span>
                    {sessionStartTime && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400">
                          <Clock size={13} />
                          {sessionStartTime}
                          {sessionEndTime ? ` - ${sessionEndTime}` : ""}
                        </span>
                      </>
                    )}
                    {sessionHall && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                          <MapPin size={13} />
                          {sessionHall}
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span className="font-bold text-gray-600 dark:text-gray-300">
                      ({relevantSessionStudents.length} طالب مشمول بهذه المحاضرة)
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Badges */}
              <div className="flex items-center gap-2 flex-wrap self-start md:self-auto text-xs font-bold">
                <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>حضور: {presentCount}</span>
                </div>
                <div className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/40 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span>غياب: {absentCount}</span>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>مجاز: {excusedCount}</span>
                </div>
                {exceptionRecords.length > 0 && (
                  <div className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                    <span>🔄 استثناء/تبديل: {exceptionRecords.length}</span>
                  </div>
                )}
                {unrecordedCount > 0 && (
                  <div className="bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 px-3 py-1.5 rounded-xl text-xs font-bold">
                    لم يُسجل: {unrecordedCount}
                  </div>
                )}
              </div>
            </div>

            {/* Group Target & Exception/Swap Management Banner */}
            <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-amber-50/90 dark:from-slate-800 dark:via-slate-800/95 dark:to-slate-800 p-4 rounded-3xl border border-amber-200/80 dark:border-amber-800/40 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                  <Users size={19} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white">
                      {isGroupSpecificSession
                        ? `كشف حضور طلاب (${sessionTargetGroup}) + الاستثناءات والتبديل المؤقت`
                        : "تخصيص الكروب أو تسجيل استثناء / تبديل طالب بين الكروبات 🔄"}
                    </h3>
                    {session && (
                      <select
                        value={sessionTargetGroup}
                        onChange={async (e) => {
                          const newGrp = e.target.value;
                          await saveAttendanceSessionToFirestore({
                            ...session,
                            targetGroup: newGrp,
                          });
                          setAttendanceSheetGroupFilter("SESSION_GROUP");
                        }}
                        className="bg-white dark:bg-slate-700 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded-xl px-2.5 py-1 text-[11px] font-black outline-none cursor-pointer"
                        title="تغيير الكروب المخصص لهذه المحاضرة"
                      >
                        <option value="ALL">👥 لجميع الكروبات (العام)</option>
                        {batchAcademicGroups.map((grp) => (
                          <option key={grp} value={grp}>
                            🔬 مخصصة لـ: {grp}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
                    هل حضر طالب من كروب آخر مع هذه المحاضرة كاستثناء أو قام بتبديل كروبه مؤقتاً مع زميله؟ أضفه هنا بضغطة زر ليُسجل حضوره أصولياً دون تغيير كروبه الأصلي الثابت.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setExceptionGuestStudentId("");
                    setExceptionSwapTargetStudentId("");
                    setExceptionNoteInput("");
                    setExceptionMode("ATTEND_WITH_GROUP");
                    setIsExceptionModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-black transition shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-95"
                >
                  <ArrowRightLeft size={15} />
                  <span>+ إضافة طالب استثناء أو تبديل كروب 🔄</span>
                </button>
              </div>
            </div>

            {/* Active Exceptions & Swaps List in this Session (if any) */}
            {exceptionRecords.length > 0 && (
              <div className="bg-purple-50/70 dark:bg-purple-950/25 border border-purple-200 dark:border-purple-800/50 rounded-3xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                    <ArrowRightLeft size={15} className="text-purple-600" />
                    <span>
                      الطلاب الحاضرون كاستثناء أو تبديل كروب في هذه المحاضرة ({exceptionRecords.length})
                    </span>
                  </h4>
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-300">
                    محفوظ في سجل المحاضرة والتقارير
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {exceptionRecords.map((rec) => {
                    const st = appUsers.find((u) => u.uid === rec.studentId);
                    return (
                      <div
                        key={rec.id}
                        className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-purple-200/80 dark:border-slate-700 flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={st?.avatar}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover border border-purple-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-gray-800 dark:text-white truncate">
                                {st?.name || "طالب"}
                              </span>
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                                أصله: {rec.originalGroup || st?.academicGroup || "غير محدد"}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                              {rec.swappedWithStudentName
                                ? `⇄ بديل مؤقت مع: ${rec.swappedWithStudentName}`
                                : rec.exceptionNote || "حضور استثنائي مع هذا الكروب"}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveExceptionStudent(rec.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-slate-700 transition shrink-0"
                          title="إلغاء الاستثناء من هذه المحاضرة"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* One-Click Copy Attendance from Previous Lecture Card */}
            {previousSessionsWithRecords.length > 0 && (
              <div className="bg-gradient-to-r from-indigo-50/90 via-blue-50/80 to-indigo-50/90 dark:from-indigo-950/40 dark:via-slate-800 dark:to-indigo-950/40 p-4 rounded-3xl border border-indigo-200/80 dark:border-indigo-800/50 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xs sm:text-sm font-black text-indigo-950 dark:text-indigo-200">
                        نسخ حضور وغيابات المحاضرة السابقة بكبسة زر ⚡
                      </h3>
                      {isPrimarySameDay && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                          محاضرة بنفس اليوم ({session?.date})
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80 mt-0.5">
                      وفّر وقتك إذا كانت هذه المحاضرة الثانية في جدول اليوم، وانسخ حالات (حاضر / غائب / مجاز) ثم عدّل فقط من تغيّر.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                  {primaryPrevSession && (
                    <button
                      type="button"
                      disabled={isCopyingAttendance}
                      onClick={() =>
                        handleCopyAttendanceFromSession(primaryPrevSession.id)
                      }
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black transition shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                      {isCopyingAttendance ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Sparkles size={15} />
                      )}
                      <span>
                        نسخ من:{" "}
                        {primaryPrevCourse ? `${primaryPrevCourse.name} - ` : ""}
                        {primaryPrevSession.title}
                        {isPrimarySameDay ? " (اليوم)" : ` (${primaryPrevSession.date})`}
                      </span>
                    </button>
                  )}

                  {previousSessionsWithRecords.length > 1 && (
                    <div className="flex items-center gap-1.5">
                      <select
                        value={copyFromSessionId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCopyFromSessionId(val);
                          if (val) {
                            handleCopyAttendanceFromSession(val);
                          }
                        }}
                        className="bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-indigo-200 dark:border-indigo-700 rounded-2xl px-3 py-2 text-xs font-bold outline-none cursor-pointer"
                      >
                        <option value="">أو اختر محاضرة أخرى للنسخ...</option>
                        {previousSessionsWithRecords.map((prevSess) => {
                          const c = courses.find((cr) => cr.id === prevSess.courseId);
                          const count = attendanceRecords.filter(
                            (r) => r.sessionId === prevSess.id
                          ).length;
                          return (
                            <option key={prevSess.id} value={prevSess.id}>
                              {prevSess.date === session?.date ? "📅 [نفس اليوم] " : ""}
                              {c?.name || prevSess.courseName || "مادة"} - {prevSess.title} ({prevSess.date}) [{count} طالب]
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Copy Confirmation Banner */}
            {copyAttendanceSuccess && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-between animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{copyAttendanceSuccess}</span>
                </div>
                <button
                  onClick={() => setCopyAttendanceSuccess(null)}
                  className="text-emerald-600 hover:text-emerald-800 p-1"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Quick Bulk Actions, Group Filter Pills & Search Filter */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 space-y-3">
              {/* Group Filter Pills inside Attendance Sheet */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-gray-100 dark:border-slate-700/70">
                <span className="text-[11px] font-bold text-gray-400 ml-1 shrink-0">
                  عرض الكروب:
                </span>
                {isGroupSpecificSession && (
                  <button
                    type="button"
                    onClick={() => setAttendanceSheetGroupFilter("SESSION_GROUP")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition flex items-center gap-1.5 ${
                      attendanceSheetGroupFilter === "SESSION_GROUP"
                        ? "bg-amber-500 text-white shadow-sm"
                        : "bg-amber-50 dark:bg-slate-700 text-amber-800 dark:text-amber-300"
                    }`}
                  >
                    <span>🔬 طلاب {sessionTargetGroup} والاستثناءات</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-black/15 text-[10px]">
                      {relevantSessionStudents.length}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setAttendanceSheetGroupFilter("ALL")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    attendanceSheetGroupFilter === "ALL" ||
                    (!isGroupSpecificSession &&
                      attendanceSheetGroupFilter === "SESSION_GROUP")
                      ? "bg-primary text-white shadow-sm"
                      : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  كل الدفعة ({sortedStudents.length})
                </button>
                {batchAcademicGroups.map((grp) => {
                  const cnt = sortedStudents.filter(
                    (s) => s.academicGroup === grp
                  ).length;
                  return (
                    <button
                      key={grp}
                      type="button"
                      onClick={() => setAttendanceSheetGroupFilter(grp)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1 ${
                        attendanceSheetGroupFilter === grp
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-indigo-50"
                      }`}
                    >
                      <span>{grp}</span>
                      <span className="text-[10px] opacity-75">({cnt})</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={attendanceSearchQuery}
                    onChange={(e) => setAttendanceSearchQuery(e.target.value)}
                    placeholder="ابحث عن اسم طالب في القائمة..."
                    className="w-full bg-gray-50 dark:bg-slate-700/60 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl pr-10 pl-4 py-2 text-xs outline-none"
                  />
                </div>

                {/* Bulk Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleBulkMarkAttendance("PRESENT", displayedStudents)
                    }
                    className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                    title="تحديد جميع الطلاب الظاهرين كـ حاضر"
                  >
                    <Check size={14} />
                    <span>الكل حاضر ({displayedStudents.length}) ✓</span>
                  </button>
                  <button
                    onClick={() =>
                      handleBulkMarkAttendance("ABSENT", displayedStudents)
                    }
                    className="flex-1 sm:flex-none px-3.5 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                    title="تحديد جميع الطلاب الظاهرين كـ غائب"
                  >
                    <X size={14} />
                    <span>الكل غائب ✕</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Alphabetical Student Roster Table */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
              <div className="p-4 bg-gray-50/70 dark:bg-slate-700/30 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center text-xs font-bold text-gray-500 dark:text-gray-400">
                <span>
                  اسم الطالب والكروب ({displayedStudents.length} طالب ظاهر - مرتب أبجدياً)
                </span>
                <span>تسجيل الحالة (حاضر / غائب / مجاز)</span>
              </div>

              <div className="divide-y divide-gray-50 dark:divide-slate-700">
                {displayedStudents.map((student, index) => {
                  const record = records.find(
                    (r) => r.studentId === student.uid,
                  );
                  const status = record?.status;
                  const isFromOtherGroup =
                    isGroupSpecificSession &&
                    Boolean(student.academicGroup) &&
                    student.academicGroup !== sessionTargetGroup;
                  const isExceptionStudent =
                    Boolean(record?.isException) || isFromOtherGroup;

                  return (
                    <div
                      key={student.uid}
                      className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                        isExceptionStudent
                          ? "bg-purple-50/40 dark:bg-purple-950/15 hover:bg-purple-50/70 dark:hover:bg-purple-950/30"
                          : "hover:bg-gray-50/80 dark:hover:bg-slate-700/40"
                      }`}
                    >
                      {/* Student Info */}
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center text-xs font-bold text-gray-400 shrink-0">
                          {index + 1}
                        </span>
                        <img
                          src={student.avatar}
                          className="w-10 h-10 rounded-full border border-gray-100 dark:border-slate-600 object-cover shrink-0"
                          alt=""
                        />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-bold text-sm text-gray-800 dark:text-white">
                              {student.repNickname || student.name}
                            </p>
                            {student.repNickname && (
                              <span
                                className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-bold"
                                title="لقب أبجدي محدد من الممثل"
                              >
                                لقب أبجدي 🏷️
                              </span>
                            )}
                            {canManageAttendance && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenNicknameModal(student);
                                }}
                                className="text-gray-300 hover:text-primary transition p-0.5"
                                title="تعديل لقب الطالب للترتيب الأبجدي"
                              >
                                <Edit3 size={12} />
                              </button>
                            )}
                            {student.academicGroup ? (
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                                  isFromOtherGroup
                                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 border border-purple-300/50"
                                    : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/50"
                                }`}
                              >
                                {student.academicGroup}
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-lg">
                                بدون كروب
                              </span>
                            )}
                            {isExceptionStudent && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 flex items-center gap-1">
                                <ArrowRightLeft size={10} />
                                <span>
                                  {record?.swappedWithStudentName
                                    ? `بديل عن: ${record.swappedWithStudentName}`
                                    : "حضور استثنائي 🔄"}
                                </span>
                              </span>
                            )}
                          </div>
                          {student.repNickname && (
                            <span className="text-[11px] text-gray-400 block mt-0.5">
                              الاسم الأصلي: {student.name}
                            </span>
                          )}
                          <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5 flex-wrap">
                            <span>
                              {student.username
                                ? `@${student.username}`
                                : "طالب نظامي"}
                            </span>
                            {record?.exceptionNote && (
                              <span className="text-purple-600 dark:text-purple-300 font-bold">
                                • {record.exceptionNote}
                              </span>
                            )}
                            {status === "PRESENT" && (
                              <span className="text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.2 rounded-full">
                                حاضر
                              </span>
                            )}
                            {status === "ABSENT" && (
                              <span className="text-red-600 font-bold bg-red-50 dark:bg-red-950/40 px-2 py-0.2 rounded-full">
                                غائب
                              </span>
                            )}
                            {status === "EXCUSED" && (
                              <span className="text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.2 rounded-full">
                                مجاز
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 3 Status Action Buttons: Present, Absent, Excused + PDF Report */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => onOpenAttendanceReport(student)}
                          className="p-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300 transition active:scale-95"
                          title="توليد وتحميل تقرير حضور الطالب بصيغة PDF"
                        >
                          <FileText size={15} />
                        </button>
                        {/* 1. حاضر */}
                        <button
                          type="button"
                          onClick={() =>
                            handleMarkAttendance(student.uid, "PRESENT")
                          }
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 active:scale-95 ${
                            status === "PRESENT"
                              ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 font-black"
                              : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-slate-600 hover:text-emerald-600"
                          }`}
                        >
                          <Check size={13} />
                          <span>حاضر</span>
                        </button>

                        {/* 2. غائب */}
                        <button
                          type="button"
                          onClick={() =>
                            handleMarkAttendance(student.uid, "ABSENT")
                          }
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 active:scale-95 ${
                            status === "ABSENT"
                              ? "bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20 font-black"
                              : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-slate-600 hover:text-red-600"
                          }`}
                        >
                          <X size={13} />
                          <span>غائب</span>
                        </button>

                        {/* 3. مجاز */}
                        <button
                          type="button"
                          onClick={() =>
                            handleMarkAttendance(student.uid, "EXCUSED")
                          }
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 active:scale-95 ${
                            status === "EXCUSED"
                              ? "bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 font-black"
                              : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-slate-600 hover:text-amber-600"
                          }`}
                        >
                          <span>مجاز</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {displayedStudents.length === 0 && (
                <div className="text-center py-12 px-4 text-gray-400 text-xs space-y-2">
                  <p className="font-bold text-gray-600 dark:text-gray-300">
                    {isGroupSpecificSession &&
                    attendanceSheetGroupFilter === "SESSION_GROUP"
                      ? `لا يوجد طلاب معينين في (${sessionTargetGroup}) حالياً`
                      : "لا توجد نتائج تطابق بحثك"}
                  </p>
                  {isGroupSpecificSession &&
                    attendanceSheetGroupFilter === "SESSION_GROUP" && (
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setAttendanceSheetGroupFilter("ALL")}
                          className="px-3.5 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-xs"
                        >
                          عرض كل طلاب الدفعة ({sortedStudents.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab(Tab.STUDENTS)}
                          className="px-3.5 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold"
                        >
                          توزيع الطلاب على الكروبات في قسم الطلاب ➔
                        </button>
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* Modal: Add Temporary Exception or Student Swap for this Attendance Session */}
            {isExceptionModalOpen && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 border border-gray-100 dark:border-slate-700">
                  <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
                        <ArrowRightLeft size={20} />
                      </div>
                      <div>
                        <h3 className="font-black text-base sm:text-lg text-gray-800 dark:text-white">
                          تسجيل استثناء أو تبديل كروب مؤقت 🔄
                        </h3>
                        <p className="text-[11px] text-gray-400">
                          لطالب حضر مع هذا الكروب بظرف طارئ أو بدّل مع زميله لهذه المحاضرة فقط
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsExceptionModalOpen(false)}
                      className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-4 py-4">
                    {/* Mode Switcher: Exception vs Swap */}
                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                        نوع الحالة الاستثنائية:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setExceptionMode("ATTEND_WITH_GROUP")}
                          className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                            exceptionMode === "ATTEND_WITH_GROUP"
                              ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20"
                              : "bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600"
                          }`}
                        >
                          <UserPlus size={16} />
                          <span>حضور استثنائي مع الكروب</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setExceptionMode("SWAP_WITH_STUDENT")}
                          className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                            exceptionMode === "SWAP_WITH_STUDENT"
                              ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20"
                              : "bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600"
                          }`}
                        >
                          <ArrowRightLeft size={16} />
                          <span>تبديل مؤقت مع طالب آخر</span>
                        </button>
                      </div>
                    </div>

                    {/* 1. Select Guest Student (from another group) */}
                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                        1. اختر الطالب الحاضر من الكروب الآخر <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={exceptionGuestStudentId}
                        onChange={(e) => setExceptionGuestStudentId(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-xs font-bold outline-none cursor-pointer"
                      >
                        <option value="">-- اختر الطالب الوافد لهذه المحاضرة --</option>
                        {otherGroupStudents.map((st) => (
                          <option key={st.uid} value={st.uid}>
                            👤 {st.name} ({st.academicGroup || "بدون كروب"})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 2. If Swap mode: Select Student from THIS group who swapped */}
                    {exceptionMode === "SWAP_WITH_STUDENT" && (
                      <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 space-y-2">
                        <label className="text-xs font-bold text-purple-900 dark:text-purple-200 block">
                          2. اختر الطالب البديل من ({isGroupSpecificSession ? sessionTargetGroup : "هذا الكروب"}) <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={exceptionSwapTargetStudentId}
                          onChange={(e) =>
                            setExceptionSwapTargetStudentId(e.target.value)
                          }
                          className="w-full bg-white dark:bg-slate-800 text-gray-800 dark:text-white border border-purple-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none cursor-pointer"
                        >
                          <option value="">-- اختر الطالب الذي بدّل مكانه --</option>
                          {currentGroupStudents
                            .filter((st) => st.uid !== exceptionGuestStudentId)
                            .map((st) => (
                              <option key={st.uid} value={st.uid}>
                                🔄 {st.name} ({st.academicGroup || "هذا الكروب"})
                              </option>
                            ))}
                        </select>
                        <p className="text-[10px] text-purple-700 dark:text-purple-300 leading-relaxed">
                          * سيتم تسجيل الطالب الوافد <strong>حاضر ✅</strong> في هذه المحاضرة، وتسجيل الطالب الذي بدّل معه <strong>مجاز (تبديل كروب) 📝</strong> تلقائياً حتى لا يُحسب غائباً.
                        </p>
                      </div>
                    )}

                    {/* 3. Optional Note */}
                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                        سبب الاستثناء أو ملاحظة (اختياري)
                      </label>
                      <input
                        type="text"
                        value={exceptionNoteInput}
                        onChange={(e) => setExceptionNoteInput(e.target.value)}
                        placeholder="مثال: ظرف طارئ / إذن من أستاذ المختبر..."
                        className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-2.5 text-xs outline-none"
                      />
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setIsExceptionModalOpen(false)}
                        className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-2xl font-bold text-xs"
                      >
                        إلغاء
                      </button>
                      <button
                        type="button"
                        disabled={
                          !exceptionGuestStudentId ||
                          (exceptionMode === "SWAP_WITH_STUDENT" &&
                            !exceptionSwapTargetStudentId)
                        }
                        onClick={handleAddExceptionOrSwapAttendance}
                        className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-amber-500/25 disabled:opacity-50 transition active:scale-95"
                      >
                        تأكيد وتسجيل الحضور الاستثنائي ✅
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }

      if (selectedCourseForAttendance) {
        // View sessions for a specific course + its scheduled slots
        const sessions = attendanceSessions
          .filter(
            (s) =>
              s.courseId === selectedCourseForAttendance.id ||
              (s.courseName &&
                s.courseName.trim() === selectedCourseForAttendance.name.trim())
          )
          .sort((a, b) => b.date.localeCompare(a.date));

        const courseSchedules = schedules
          .filter(
            (sc) =>
              sc.courseId === selectedCourseForAttendance.id ||
              sc.courseName.trim() === selectedCourseForAttendance.name.trim()
          )
          .sort(
            (a, b) =>
              parseScheduleTimeMinutes(a.startTime) -
              parseScheduleTimeMinutes(b.startTime)
          );

        return (
          <div className="space-y-6 p-4 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedCourseForAttendance(null)}
                  className="p-2.5 bg-gray-100 dark:bg-slate-700 rounded-2xl hover:bg-gray-200 dark:hover:bg-slate-600 transition"
                >
                  <ChevronLeft
                    size={20}
                    className="rtl:rotate-180 text-gray-600 dark:text-gray-300"
                  />
                </button>
                <div>
                  <h2 className="text-xl font-black text-gray-800 dark:text-white">
                    سجلات حضور مادة: {selectedCourseForAttendance.name}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    سجّل الحضور مباشرة من مواعيد المادة في الجدول الأسبوعي أو أضف محاضرة تعويضية.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setNewSessionDate(attendanceTargetDate || todayStr);
                  setSelectedScheduleSlotId(courseSchedules[0]?.id || "");
                  setIsAddingSession(true);
                }}
                className="bg-primary text-white px-4 py-2.5 rounded-2xl text-xs font-black shadow-lg shadow-primary/30 hover:bg-primary/90 transition flex items-center justify-center gap-2 shrink-0"
              >
                <Plus size={16} />
                <span>تسجيل محاضرة أو تعويضية</span>
              </button>
            </div>

            {/* Course's Weekly Schedule Slots for Instant Attendance */}
            {courseSchedules.length > 0 && (
              <div className="bg-gradient-to-br from-indigo-50/80 via-blue-50/50 to-white dark:from-slate-800 dark:via-slate-800 dark:to-slate-800/90 p-5 rounded-3xl border border-indigo-100 dark:border-slate-700 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-black text-sm text-indigo-950 dark:text-white flex items-center gap-2">
                      <Clock size={17} className="text-indigo-600" />
                      <span>مواعيد هذه المادة الثابتة في الجدول الأسبوعي ({courseSchedules.length})</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      اضغط على أي موعد لفتح أو إنشاء سجل الحضور الخاص به فوراً دون كتابة يدوية.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {courseSchedules.map((sched) => {
                    const mostRecentDate = getMostRecentDateForArabicDay(sched.day);
                    const existingSess = findExistingSessionForSchedule(
                      sched,
                      mostRecentDate
                    );
                    const existingRecords = existingSess
                      ? attendanceRecords.filter((r) => r.sessionId === existingSess.id)
                      : [];
                    const presCount = existingRecords.filter(
                      (r) => r.status === "PRESENT"
                    ).length;
                    const schedTargetGrp = sched.targetGroup || "ALL";
                    const expectedStudentsCount =
                      schedTargetGrp !== "ALL"
                        ? activeBatchStudents.filter(
                            (st) => st.academicGroup === schedTargetGrp
                          ).length || activeBatchStudents.length
                        : activeBatchStudents.length;

                    return (
                      <div
                        key={sched.id}
                        className="bg-white dark:bg-slate-900/70 p-4 rounded-2xl border border-indigo-100/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-primary/10 text-primary text-xs font-black px-2.5 py-0.5 rounded-lg">
                              يوم {sched.day}
                            </span>
                            <span className="text-xs font-black text-gray-800 dark:text-white flex items-center gap-1">
                              <Clock size={12} className="text-indigo-500" />
                              {sched.startTime}
                              {sched.endTime ? ` - ${sched.endTime}` : ""}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                                sched.lectureType === "PRACTICAL"
                                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                              }`}
                            >
                              {sched.lectureType === "PRACTICAL" ? "عملي 🔬" : "نظري 📖"}
                            </span>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                                schedTargetGrp !== "ALL"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                              }`}
                            >
                              {schedTargetGrp !== "ALL"
                                ? `🔬 ${schedTargetGrp}`
                                : "👥 كل الدفعة"}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            أقرب تاريخ للمحاضرة: <strong className="font-mono">{mostRecentDate}</strong>
                            {sched.hall ? ` • القاعة: ${sched.hall}` : ""}
                          </p>
                          {existingSess && (
                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                              ✅ تم تسجيل الحضور ({presCount} حاضر من {expectedStudentsCount})
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() =>
                            handleOpenOrCreateScheduledAttendance(sched, mostRecentDate)
                          }
                          className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shrink-0 active:scale-95 ${
                            existingSess
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
                          }`}
                        >
                          <CalendarCheck size={15} />
                          <span>
                            {existingSess ? "فتح وتعديل الحضور" : "تسجيل الحضور الآن"}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recorded Sessions Grid */}
            <div>
              <h3 className="font-black text-sm text-gray-700 dark:text-gray-200 mb-3 px-1">
                أرشيف المحاضرات المسجلة لهذه المادة ({sessions.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sessions.map((session) => {
                  const records = attendanceRecords.filter(
                    (r) => r.sessionId === session.id,
                  );
                  const presentCount = records.filter(
                    (r) => r.status === "PRESENT",
                  ).length;
                  const absentCount = records.filter(
                    (r) => r.status === "ABSENT",
                  ).length;
                  const excusedCount = records.filter(
                    (r) => r.status === "EXCUSED",
                  ).length;
                  const sessTargetGroup = session.targetGroup || "ALL";
                  const studentsCount =
                    sessTargetGroup !== "ALL"
                      ? activeBatchStudents.filter(
                          (st) =>
                            st.academicGroup === sessTargetGroup ||
                            records.some((r) => r.studentId === st.uid)
                        ).length || activeBatchStudents.length
                      : activeBatchStudents.length;

                  return (
                    <div
                      key={session.id}
                      className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition cursor-pointer group"
                      onClick={() => {
                        if (setAttendanceGroupFilter) setAttendanceGroupFilter("DEFAULT");
                        setAttendanceSheetGroupFilter("SESSION_GROUP");
                        setSelectedSessionId(session.id);
                      }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                            <CalendarCheck size={22} />
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-gray-400 block">
                              {getArabicDayFromDateStr(session.date)} • {session.date}
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              {session.startTime && (
                                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                                  ⏰ {session.startTime}
                                </span>
                              )}
                              <span
                                className={`text-[10px] font-black px-2 py-0.2 rounded-md ${
                                  sessTargetGroup !== "ALL"
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                    : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                                }`}
                              >
                                {sessTargetGroup !== "ALL"
                                  ? `🔬 ${sessTargetGroup}`
                                  : "👥 كل الدفعة"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(session.id);
                          }}
                          className="text-gray-300 hover:text-red-500 transition p-1"
                          title="حذف سجل المحاضرة"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                      <h3 className="font-bold text-gray-800 dark:text-white text-base mb-1">
                        {session.title}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] font-bold mb-3">
                        <span className="text-emerald-600">حاضر: {presentCount}</span>
                        <span>•</span>
                        <span className="text-red-500">غائب: {absentCount}</span>
                        <span>•</span>
                        <span className="text-amber-600">مجاز: {excusedCount}</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2 mb-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{
                            width: `${studentsCount > 0 ? Math.min(100, (presentCount / studentsCount) * 100) : 0}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-emerald-600">
                          {studentsCount > 0
                            ? `${Math.min(100, Math.round((presentCount / studentsCount) * 100))}% نسبة الحضور`
                            : "0%"}
                        </span>
                        <span className="text-gray-400">
                          من أصل {studentsCount} طالب
                        </span>
                      </div>
                    </div>
                  );
                })}
                {sessions.length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-400 dark:text-gray-500 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 border-dashed">
                    لا توجد محاضرات مسجلة في أرشيف هذه المادة بعد. اضغط على موعد المحاضرة أعلاه لبدء التسجيل.
                  </div>
                )}
              </div>
            </div>

            {/* Add Session Modal (Supports picking from Schedule OR Extra Makeup Lecture) */}
            {isAddingSession && (() => {
              const candidateSessions = attendanceSessions
                .filter((s) => attendanceRecords.some((r) => r.sessionId === s.id))
                .sort((a, b) => {
                  const aSameDay = a.date === newSessionDate ? 1 : 0;
                  const bSameDay = b.date === newSessionDate ? 1 : 0;
                  if (aSameDay !== bSameDay) return bSameDay - aSameDay;
                  if (a.date !== b.date) return b.date.localeCompare(a.date);
                  return (b.timestamp || 0) - (a.timestamp || 0);
                });
              const topCandidate = candidateSessions[0];
              const topCandidateCourse = courses.find((c) => c.id === topCandidate?.courseId);

              return (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in zoom-in-95">
                    <h3 className="font-black text-lg text-gray-800 dark:text-white mb-1">
                      تسجيل حضور ({selectedCourseForAttendance.name})
                    </h3>
                    <p className="text-xs text-gray-400 mb-4">
                      اختر موعد المحاضرة من الجدول أو أنشئ محاضرة تعويضية إضافية
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-1 block">
                          تاريخ المحاضرة ({getArabicDayFromDateStr(newSessionDate)})
                        </label>
                        <input
                          type="date"
                          value={newSessionDate}
                          onChange={(e) => setNewSessionDate(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm outline-none"
                        />
                      </div>

                      {courseSchedules.length > 0 && (
                        <div>
                          <label className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5 block">
                            ربط بموعد المحاضرة في الجدول الأسبوعي
                          </label>
                          <select
                            value={selectedScheduleSlotId}
                            onChange={(e) => setSelectedScheduleSlotId(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none cursor-pointer"
                          >
                            <option value="">➕ محاضرة إضافية / تعويضية (خارج الجدول)</option>
                            {courseSchedules.map((sc) => (
                              <option key={sc.id} value={sc.id}>
                                📅 يوم {sc.day} • {sc.startTime} ({sc.lectureType === "PRACTICAL" ? "عملي" : "نظري"}
                                {sc.targetGroup && sc.targetGroup !== "ALL" ? ` - ${sc.targetGroup}` : " - كل الدفعة"})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {!selectedScheduleSlotId && (
                        <>
                          <div>
                            <label className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-1 block">
                              الكروب المستهدف بالمحاضرة الإضافية
                            </label>
                            <select
                              value={newSessionTargetGroup}
                              onChange={(e) => setNewSessionTargetGroup(e.target.value)}
                              className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none cursor-pointer"
                            >
                              <option value="ALL">👥 جميع طلاب الدفعة (العام)</option>
                              {batchAcademicGroups.map((grp) => (
                                <option key={grp} value={grp}>
                                  🔬 مخصصة لـ {grp} فقط
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-1 block">
                              عنوان المحاضرة الإضافية (اختياري)
                            </label>
                            <input
                              type="text"
                              value={newSessionTitle}
                              onChange={(e) => setNewSessionTitle(e.target.value)}
                              placeholder="مثال: محاضرة تعويضية"
                              className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm outline-none"
                            />
                          </div>
                        </>
                      )}

                      {topCandidate && (
                        <div className="p-3.5 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 rounded-2xl space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-black text-indigo-900 dark:text-indigo-200">
                            <Sparkles size={14} className="text-indigo-600" />
                            <span>نسخ غيابات المحاضرة السابقة بكبسة زر:</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCreateSession(topCandidate.id)}
                            className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition flex items-center justify-center gap-1.5 active:scale-95"
                          >
                            <Sparkles size={14} />
                            <span>
                              فتح ونسخ غيابات ({topCandidateCourse?.name ? `${topCandidateCourse.name} - ` : ""}{topCandidate.title})
                            </span>
                          </button>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => setIsAddingSession(false)}
                          className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 py-2.5 rounded-xl font-bold text-sm"
                        >
                          إلغاء
                        </button>
                        <button
                          onClick={() => handleCreateSession()}
                          className="flex-1 bg-primary text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/30"
                        >
                          {selectedScheduleSlotId ? "فتح كشف محاضرة الجدول" : "إنشاء محاضرة إضافية"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      }

      // Main Attendance Hub: Driven by Weekly Schedule!
      const batchStudentsForReports = [...activeBatchStudents].sort((a, b) =>
        a.name.localeCompare(b.name, "ar", { sensitivity: "base" })
      );

      // Scheduled lectures for the currently selected target date's weekday
      const scheduledForTargetDay = schedules
        .filter((s) => s.day === targetArabicDay)
        .sort(
          (a, b) =>
            parseScheduleTimeMinutes(a.startTime) -
            parseScheduleTimeMinutes(b.startTime)
        );

      // Find any recorded session on `attendanceTargetDate` so subsequent lectures can copy from it with 1 click!
      const sameDayRecordedSessions = attendanceSessions
        .filter(
          (s) =>
            s.date === attendanceTargetDate &&
            attendanceRecords.some((r) => r.sessionId === s.id)
        )
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      return (
        <div className="space-y-6 p-4 pb-20">
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                  <CalendarCheck className="text-primary" size={24} />
                  إدارة الحضور والغياب الذكية (مرتبطة بالجدول والكروبات)
                </h2>
                <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-[11px] font-black px-2.5 py-0.5 rounded-full">
                  تلقائي من الجدول الأسبوعي 🔄
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                محاضرات الجدول الأسبوعي جاهزة أمامك تلقائياً حسب اليوم والوقت والكروب (مع دعم الاستثناءات وتبديل الطلاب).
              </p>
            </div>
            {currentUser && (
              <button
                onClick={() =>
                  onOpenAttendanceReport(
                    batchStudentsForReports[0] || currentUser
                  )
                }
                className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-500/20 transition flex items-center justify-center gap-2 active:scale-95 shrink-0"
              >
                <FileText size={16} />
                <span>تصدير تقارير الحضور (PDF) 📄</span>
              </button>
            )}
          </div>

          {/* PRIMARY HUB: Today's / Selected Day's Scheduled Lectures Ready for Attendance */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-indigo-100 dark:border-slate-700 overflow-hidden">
            {/* Date & Weekday Bar */}
            <div className="p-5 bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 text-white">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5">
                      <Calendar size={13} />
                      <span>يوم {targetArabicDay}</span>
                      <span>•</span>
                      <span className="font-mono">{attendanceTargetDate}</span>
                    </span>
                    {attendanceTargetDate === todayStr && (
                      <span className="bg-emerald-400 text-slate-950 px-2.5 py-0.5 rounded-full text-[11px] font-black">
                        محاضرات اليوم 📍
                      </span>
                    )}
                    {attendanceTargetDate === yesterdayStr && (
                      <span className="bg-amber-300 text-slate-950 px-2.5 py-0.5 rounded-full text-[11px] font-black">
                        محاضرات أمس ⏪
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg sm:text-xl font-black">
                    محاضرات يوم {targetArabicDay} في الجدول الأسبوعي ({scheduledForTargetDay.length})
                  </h3>
                  <p className="text-xs text-blue-100 mt-0.5">
                    اضغط على «تسجيل الحضور الآن» أمام أي محاضرة لفتح كشف أسماء طلاب الكروب المخصص لها مباشرة.
                  </p>
                </div>

                {/* Date Picker & Quick Today/Yesterday Buttons */}
                <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
                  <button
                    type="button"
                    onClick={() => setAttendanceTargetDate(todayStr)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition ${
                      attendanceTargetDate === todayStr
                        ? "bg-white text-indigo-700 shadow-md"
                        : "bg-white/15 hover:bg-white/25 text-white"
                    }`}
                  >
                    اليوم ({getArabicDayFromDateStr(todayStr)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceTargetDate(yesterdayStr)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition ${
                      attendanceTargetDate === yesterdayStr
                        ? "bg-white text-indigo-700 shadow-md"
                        : "bg-white/15 hover:bg-white/25 text-white"
                    }`}
                  >
                    أمس ({getArabicDayFromDateStr(yesterdayStr)})
                  </button>
                  <div className="relative flex items-center bg-white/15 hover:bg-white/25 rounded-xl px-3 py-1.5 border border-white/25">
                    <span className="text-[11px] font-bold ml-2 text-blue-100">
                      تاريخ آخر:
                    </span>
                    <input
                      type="date"
                      value={attendanceTargetDate}
                      onChange={(e) => {
                        if (e.target.value) setAttendanceTargetDate(e.target.value);
                      }}
                      className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Weekday Switcher Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mt-4 pt-3 border-t border-white/15">
                <span className="text-[11px] font-bold text-blue-100 ml-1 shrink-0">
                  أيام الجدول:
                </span>
                {weekDaysList.map((dayName) => {
                  const dayCount = schedules.filter((s) => s.day === dayName).length;
                  const isSelectedDay = targetArabicDay === dayName;
                  return (
                    <button
                      key={dayName}
                      type="button"
                      onClick={() =>
                        setAttendanceTargetDate(getMostRecentDateForArabicDay(dayName))
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                        isSelectedDay
                          ? "bg-white text-indigo-700 shadow-sm font-black"
                          : "bg-white/10 hover:bg-white/20 text-white"
                      }`}
                    >
                      <span>{dayName}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          isSelectedDay
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-black/20 text-white"
                        }`}
                      >
                        {dayCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scheduled Lectures List for Target Day */}
            <div className="p-5">
              {scheduledForTargetDay.length === 0 ? (
                <div className="text-center py-10 px-4 bg-gray-50/70 dark:bg-slate-900/40 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                  <Calendar size={40} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                  <p className="font-bold text-gray-700 dark:text-gray-300 text-sm">
                    لا توجد محاضرات مضافة في الجدول الأسبوعي ليوم {targetArabicDay}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 mb-4">
                    يمكنك اختيار يوم آخر من الشريط أعلاه أو إضافة محاضرات يوم {targetArabicDay} في قسم الجدول.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSchedFilterDay(targetArabicDay);
                      setActiveTab(Tab.SCHEDULE);
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-sm hover:bg-primary/90 transition inline-flex items-center gap-1.5"
                  >
                    <Plus size={15} />
                    <span>إدارة جدول يوم {targetArabicDay}</span>
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {scheduledForTargetDay.map((sched, idx) => {
                    const existingSession = findExistingSessionForSchedule(
                      sched,
                      attendanceTargetDate
                    );
                    const sessionRecords = existingSession
                      ? attendanceRecords.filter(
                          (r) => r.sessionId === existingSession.id
                        )
                      : [];
                    const presentCount = sessionRecords.filter(
                      (r) => r.status === "PRESENT"
                    ).length;
                    const absentCount = sessionRecords.filter(
                      (r) => r.status === "ABSENT"
                    ).length;
                    const excusedCount = sessionRecords.filter(
                      (r) => r.status === "EXCUSED"
                    ).length;
                    const isRecorded =
                      existingSession !== undefined && sessionRecords.length > 0;

                    const schedTargetGroup =
                      existingSession?.targetGroup || sched.targetGroup || "ALL";
                    const expectedStudentsForSlot =
                      schedTargetGroup !== "ALL"
                        ? activeBatchStudents.filter(
                            (st) =>
                              st.academicGroup === schedTargetGroup ||
                              sessionRecords.some((r) => r.studentId === st.uid)
                          ).length || activeBatchStudents.length
                        : activeBatchStudents.length;

                    // Check if there is another session recorded on the same day that we can copy from with 1 click
                    const earlierSameDaySession = sameDayRecordedSessions.find(
                      (s) => s.id !== existingSession?.id
                    );
                    const earlierCourse = courses.find(
                      (c) => c.id === earlierSameDaySession?.courseId
                    );

                    return (
                      <div
                        key={sched.id}
                        className={`p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 ${
                          sched.isCancelled
                            ? "bg-red-50/30 dark:bg-red-950/10 border-red-200 dark:border-red-900/40 opacity-75"
                            : isRecorded
                            ? "bg-emerald-50/30 dark:bg-emerald-950/15 border-emerald-200 dark:border-emerald-800/60 shadow-xs"
                            : "bg-gray-50/60 dark:bg-slate-900/50 border-gray-200/80 dark:border-slate-700 hover:border-primary/40 hover:shadow-md"
                        }`}
                      >
                        <div>
                          {/* Top Row: Sequence + Time + Type + Group + Status */}
                          <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="bg-indigo-600 text-white text-[11px] font-black px-2.5 py-1 rounded-xl">
                                المحاضرة #{idx + 1}
                              </span>
                              <span className="bg-white dark:bg-slate-800 text-primary border border-primary/20 text-xs font-black px-3 py-1 rounded-xl flex items-center gap-1 shadow-2xs">
                                <Clock size={13} />
                                {sched.startTime}
                                {sched.endTime ? ` - ${sched.endTime}` : ""}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-xl ${
                                  sched.lectureType === "PRACTICAL"
                                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                                    : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                                }`}
                              >
                                {sched.lectureType === "PRACTICAL"
                                  ? "عملي / مختبر 🔬"
                                  : "نظري 📖"}
                              </span>
                              <span
                                className={`text-[10px] font-black px-2.5 py-1 rounded-xl flex items-center gap-1 ${
                                  schedTargetGroup !== "ALL"
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/60"
                                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                }`}
                              >
                                <Users size={11} />
                                <span>
                                  {schedTargetGroup !== "ALL"
                                    ? schedTargetGroup
                                    : "كل الدفعة"}
                                </span>
                              </span>
                            </div>

                            {sched.isCancelled ? (
                              <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full">
                                ❌ ملغاة هذا الأسبوع
                              </span>
                            ) : isRecorded ? (
                              <span className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                                <CheckCircle2 size={12} />
                                تم رصد الحضور
                              </span>
                            ) : (
                              <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-[10px] font-black px-2.5 py-1 rounded-full">
                                ⏳ بانتظار التحضير
                              </span>
                            )}
                          </div>

                          {/* Course Title & Details */}
                          <h4 className="font-black text-base sm:text-lg text-gray-800 dark:text-white mb-1">
                            {sched.courseName}
                          </h4>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                            {sched.professor && (
                              <span className="flex items-center gap-1">
                                <UserIcon size={13} className="text-primary" />
                                {sched.professor}
                              </span>
                            )}
                            {sched.hall && (
                              <span className="flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                                <MapPin size={13} />
                                {sched.hall}
                              </span>
                            )}
                          </div>

                          {/* Live Attendance Stats if already started/recorded */}
                          {existingSession && (
                            <div className="mt-3 pt-3 border-t border-gray-200/60 dark:border-slate-700/60">
                              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                                <div className="flex items-center gap-2.5">
                                  <span className="text-emerald-600">
                                    حاضر: {presentCount}
                                  </span>
                                  <span>•</span>
                                  <span className="text-red-500">
                                    غائب: {absentCount}
                                  </span>
                                  <span>•</span>
                                  <span className="text-amber-600">
                                    مجاز: {excusedCount}
                                  </span>
                                </div>
                                <span className="text-gray-400 text-[11px]">
                                  {sessionRecords.length} / {expectedStudentsForSlot} طالب
                                </span>
                              </div>
                              <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full transition-all"
                                  style={{
                                    width: `${
                                      expectedStudentsForSlot > 0
                                        ? Math.min(
                                            100,
                                            (presentCount / expectedStudentsForSlot) * 100
                                          )
                                        : 0
                                    }%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenOrCreateScheduledAttendance(
                                sched,
                                attendanceTargetDate
                              )
                            }
                            className={`flex-1 py-2.5 px-4 rounded-2xl text-xs font-black transition flex items-center justify-center gap-2 shadow-sm active:scale-95 ${
                              isRecorded
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                                : "bg-primary hover:bg-primary/90 text-white shadow-primary/25"
                            }`}
                          >
                            <CalendarCheck size={16} />
                            <span>
                              {existingSession
                                ? "فتح وتعديل كشف الحضور ✅"
                                : schedTargetGroup !== "ALL"
                                ? `تسجيل حضور (${schedTargetGroup}) 📋`
                                : "تسجيل حضور هذه المحاضرة 📋"}
                            </span>
                          </button>

                          {/* 1-Click Copy from Earlier Same-Day Lecture */}
                          {!isRecorded && earlierSameDaySession && (
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenOrCreateScheduledAttendance(
                                  sched,
                                  attendanceTargetDate,
                                  earlierSameDaySession.id
                                )
                              }
                              className="py-2.5 px-3.5 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-950/70 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-2xl text-[11px] font-black transition flex items-center justify-center gap-1.5 active:scale-95"
                              title="فتح هذه المحاضرة ونسخ حضور المحاضرة السابقة بنفس اليوم"
                            >
                              <Sparkles size={14} />
                              <span>
                                نسخ من ({earlierCourse?.name || earlierSameDaySession.courseName || "المحاضرة السابقة"})
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Courses Archive & Extra Lectures Section */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <div>
                <h3 className="font-black text-base text-gray-800 dark:text-white">
                  أرشيف وسجلات المواد الدراسية 📚
                </h3>
                <p className="text-xs text-gray-400">
                  اضغط على أي مادة لمراجعة أرشيف المحاضرات السابقة أو إضافة محاضرة تعويضية إضافية
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => {
                const courseSessCount = attendanceSessions.filter(
                  (s) =>
                    s.courseId === course.id ||
                    (s.courseName && s.courseName.trim() === course.name.trim())
                ).length;
                const courseSchedCount = schedules.filter(
                  (sc) =>
                    sc.courseId === course.id ||
                    sc.courseName.trim() === course.name.trim()
                ).length;

                return (
                  <div
                    key={course.id}
                    onClick={() => setSelectedCourseForAttendance(course)}
                    className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-3.5 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition shrink-0">
                        <BookOpen size={24} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-800 dark:text-white text-base truncate">
                          {course.name}
                        </h3>
                        <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                          <span>{courseSessCount} محاضرة مسجلة</span>
                          <span>•</span>
                          <span className="text-indigo-500 font-bold">
                            {courseSchedCount} موعد أسبوعي
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold text-gray-400 group-hover:text-primary pt-3 border-t border-gray-50 dark:border-slate-700/50 transition">
                      <span>عرض الأرشيف ومواعيد المادة</span>
                      <ArrowRight size={16} className="rtl:rotate-180" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Student PDF Attendance Reports Directory for Representative */}
          {batchStudentsForReports.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden mt-6">
              <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-50/60 dark:bg-slate-700/30">
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white text-sm flex items-center gap-2">
                    <FileText size={18} className="text-indigo-600" />
                    <span>تقارير الحضور والغياب والإجازات للطلاب (PDF شهري / فصلي)</span>
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    اضغط على «تقرير PDF» أمام أي طالب لمعاينة وتحميل كشف حضوره الشهري أو الفصلي الرسمي (يحسب محاضرات كروبه والاستثناءات تلقائياً).
                  </p>
                </div>
              </div>

              <div className="divide-y divide-gray-50 dark:divide-slate-700 max-h-96 overflow-y-auto">
                {batchStudentsForReports.map((st, i) => {
                  const stRelevantSessions = attendanceSessions.filter((s) => {
                    if (!s.targetGroup || s.targetGroup === "ALL") return true;
                    if (!st.academicGroup) return true;
                    if (s.targetGroup === st.academicGroup) return true;
                    return attendanceRecords.some(
                      (r) => r.sessionId === s.id && r.studentId === st.uid
                    );
                  });
                  const stRelevantIds = new Set(stRelevantSessions.map((s) => s.id));
                  const stRecords = attendanceRecords.filter(
                    (r) =>
                      r.studentId === st.uid &&
                      stRelevantIds.has(r.sessionId)
                  );
                  const totalS = stRelevantSessions.length;
                  const pres = stRecords.filter((r) => r.status === "PRESENT").length;
                  const abs = stRecords.filter((r) => r.status === "ABSENT").length;
                  const exc = stRecords.filter((r) => r.status === "EXCUSED").length;
                  const pct = totalS > 0 ? Math.round(((pres + exc) / totalS) * 100) : 100;

                  return (
                    <div
                      key={st.uid}
                      className="p-3.5 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-slate-700/40 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-400 w-5">
                          {i + 1}
                        </span>
                        <img
                          src={st.avatar}
                          alt={st.name}
                          className="w-9 h-9 rounded-full object-cover border border-gray-100 dark:border-slate-600"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs sm:text-sm font-bold text-gray-800 dark:text-white">
                              {st.name}
                            </p>
                            {st.academicGroup && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                                {st.academicGroup}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-bold mt-0.5">
                            <span className="text-emerald-600">حضور: {pres}</span>
                            <span>•</span>
                            <span className="text-red-500">غياب: {abs}</span>
                            <span>•</span>
                            <span className="text-amber-600">إجازة: {exc}</span>
                            <span>•</span>
                            <span
                              className={
                                pct >= 75 ? "text-indigo-600" : "text-red-600"
                              }
                            >
                              الالتزام: {pct}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onOpenAttendanceReport(st)}
                        className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-end sm:self-center active:scale-95 shrink-0"
                      >
                        <Download size={14} />
                        <span>تقرير PDF</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Student View
    else {
      return (
        <div className="space-y-6 p-4 pb-20">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl p-6 text-white shadow-xl shadow-emerald-200 dark:shadow-none relative overflow-hidden mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative z-10">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h2 className="text-2xl font-bold">سجل الحضور والمحاضرات 📅</h2>
                {currentUser?.academicGroup && (
                  <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black">
                    🔬 كروبك الدراسي: {currentUser.academicGroup}
                  </span>
                )}
              </div>
              <p className="opacity-90 text-sm">
                تابع حضورك في محاضرات الجدول الأسبوعي ومحاضرات كروبك الخاصة، ويمكنك تحميل تقرير حضورك بصيغة PDF.
              </p>
            </div>
            {currentUser && (
              <button
                onClick={() => onOpenAttendanceReport(currentUser)}
                className="relative z-10 bg-white text-emerald-700 hover:bg-emerald-50 px-5 py-3 rounded-2xl text-xs sm:text-sm font-black shadow-lg transition flex items-center justify-center gap-2 shrink-0 active:scale-95"
              >
                <Download size={18} />
                <span>تحميل تقرير الحضور (PDF) 📄</span>
              </button>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {courses.map((course) => {
              const courseSessions = attendanceSessions
                .filter((s) => {
                  const matchesCourse =
                    s.courseId === course.id ||
                    (s.courseName &&
                      s.courseName.trim() === course.name.trim());
                  if (!matchesCourse) return false;
                  if (!s.targetGroup || s.targetGroup === "ALL") return true;
                  if (!currentUser?.academicGroup) return true;
                  if (s.targetGroup === currentUser.academicGroup) return true;
                  return attendanceRecords.some(
                    (r) =>
                      r.sessionId === s.id && r.studentId === currentUser.uid
                  );
                })
                .sort((a, b) => b.date.localeCompare(a.date));

              const studentRecords = attendanceRecords.filter(
                (r) =>
                  courseSessions.some((s) => s.id === r.sessionId) &&
                  r.studentId === currentUser?.uid,
              );

              const totalSessions = courseSessions.length;
              const presentCount = studentRecords.filter(
                (r) => r.status === "PRESENT",
              ).length;
              const absentCount = studentRecords.filter(
                (r) => r.status === "ABSENT",
              ).length;
              const excusedCount = studentRecords.filter(
                (r) => r.status === "EXCUSED",
              ).length;

              const attendancePercentage =
                totalSessions > 0
                  ? Math.round(((presentCount + excusedCount) / totalSessions) * 100)
                  : 100;

              return (
                <div
                  key={course.id}
                  className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-5">
                      <div>
                        <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                          {course.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {course.professors?.join("، ") || course.code || "مادة دراسية"}
                        </p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          attendancePercentage >= 75
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {attendancePercentage}% التزام
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-4">
                      <div className="text-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-2xl">
                        <span className="block text-xl font-bold text-gray-800 dark:text-white">
                          {totalSessions}
                        </span>
                        <span className="text-[10px] text-gray-400">محاضرة</span>
                      </div>
                      <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl">
                        <span className="block text-xl font-bold text-emerald-600">
                          {presentCount}
                        </span>
                        <span className="text-[10px] text-emerald-500 font-bold">حاضر</span>
                      </div>
                      <div className="text-center p-3 bg-red-50 dark:bg-red-900/10 rounded-2xl">
                        <span className="block text-xl font-bold text-red-600">
                          {absentCount}
                        </span>
                        <span className="text-[10px] text-red-500 font-bold">غائب</span>
                      </div>
                      <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/10 rounded-2xl">
                        <span className="block text-xl font-bold text-amber-600">
                          {excusedCount}
                        </span>
                        <span className="text-[10px] text-amber-500 font-bold">مجاز</span>
                      </div>
                    </div>

                    {/* Recent Recorded Sessions for this Student */}
                    {courseSessions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 space-y-1.5 max-h-44 overflow-y-auto no-scrollbar">
                        <span className="text-[11px] font-bold text-gray-400 block mb-1">
                          سجل محاضرات المادة:
                        </span>
                        {courseSessions.map((sess) => {
                          const myRec = studentRecords.find(
                            (r) => r.sessionId === sess.id
                          );
                          return (
                            <div
                              key={sess.id}
                              className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-gray-50/80 dark:bg-slate-700/40"
                            >
                              <div className="min-w-0 pr-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-gray-700 dark:text-gray-200 block truncate">
                                    {sess.title || `محاضرة ${sess.date}`}
                                  </span>
                                  {sess.targetGroup && sess.targetGroup !== "ALL" && (
                                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                      {sess.targetGroup}
                                    </span>
                                  )}
                                  {myRec?.isException && (
                                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                                      استثناء/تبديل 🔄
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-gray-400">
                                  {getArabicDayFromDateStr(sess.date)} ({sess.date})
                                  {sess.startTime ? ` • ${sess.startTime}` : ""}
                                </span>
                              </div>
                              <span
                                className={`text-[10px] font-black px-2.5 py-0.5 rounded-lg shrink-0 ${
                                  myRec?.status === "PRESENT"
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                    : myRec?.status === "ABSENT"
                                    ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                                    : myRec?.status === "EXCUSED"
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                                    : "bg-gray-200 text-gray-600 dark:bg-slate-600 dark:text-gray-300"
                                }`}
                              >
                                {myRec?.status === "PRESENT"
                                  ? "حاضر ✅"
                                  : myRec?.status === "ABSENT"
                                  ? "غائب ❌"
                                  : myRec?.status === "EXCUSED"
                                  ? "مجاز 📝"
                                  : "قيد الرصد"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {courses.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400 dark:text-gray-500">
                لا توجد مواد مسجلة.
              </div>
            )}
          </div>
        </div>
      );
    }
};
