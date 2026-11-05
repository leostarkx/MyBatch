import React, { useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  User as UserIcon,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Sparkles,
} from "lucide-react";
import { LectureSchedule, Course, User, Tab } from "../types";

export interface ScheduleViewProps {
  currentUser: User | null;
  effectiveBatchCode: string;
  schedules: LectureSchedule[];
  courses: Course[];
  batchAcademicGroups: string[];
  isManager: boolean;
  canManageSchedule: boolean;
  onSaveSchedule: (scheduleData: {
    id?: string;
    day: string;
    courseId: string;
    courseName: string;
    professor: string;
    startTime: string;
    endTime: string;
    hall: string;
    type: "THEORY" | "PRACTICAL";
    targetGroup?: string;
    note?: string;
  }) => Promise<void>;
  onDeleteSchedule: (id: string) => Promise<void>;
  onToggleCancelSchedule: (schedule: LectureSchedule) => Promise<void>;
  onOpenOrCreateScheduledAttendance: (schedule: LectureSchedule, targetDate?: string) => void;
  setActiveTab: (tab: Tab) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  currentUser,
  effectiveBatchCode,
  schedules,
  courses,
  batchAcademicGroups,
  isManager,
  canManageSchedule,
  onSaveSchedule,
  onDeleteSchedule,
  onToggleCancelSchedule,
  onOpenOrCreateScheduledAttendance,
  setActiveTab,
}) => {
  const weekDays = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "السبت"];
  const filterDays = ["الكل", ...weekDays];

  const currentArabicDay = (() => {
    const jsDay = new Date().getDay(); // 0 = Sun, 1 = Mon, ... 6 = Sat
    const map: Record<number, string> = {
      0: "الأحد",
      1: "الاثنين",
      2: "الثلاثاء",
      3: "الأربعاء",
      4: "الخميس",
      5: "الجمعة",
      6: "السبت",
    };
    return map[jsDay] || "الأحد";
  })();

  const [schedFilterDay, setSchedFilterDay] = useState(currentArabicDay);
  const [schedFilterGroup, setSchedFilterGroup] = useState<string>("الكل");

  // Modal State
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [schedCourseId, setSchedCourseId] = useState<string>("");
  const [schedCourseName, setSchedCourseName] = useState("");
  const [schedDay, setSchedDay] = useState("الأحد");
  const [schedLectureType, setSchedLectureType] = useState<"THEORY" | "PRACTICAL">("THEORY");
  const [schedTargetGroup, setSchedTargetGroup] = useState("ALL");
  const [schedStartTime, setSchedStartTime] = useState("08:30 ص");
  const [schedEndTime, setSchedEndTime] = useState("10:30 ص");
  const [schedProf, setSchedProf] = useState("");
  const [schedHall, setSchedHall] = useState("");
  const [schedNote, setSchedNote] = useState("");

  const parseTimeToMinutes = (timeStr: string): number => {
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

  const format24hToArabic = (val24: string): string => {
    if (!val24 || !val24.includes(":")) return val24;
    const [hStr, mStr] = val24.split(":");
    let h = parseInt(hStr, 10);
    if (isNaN(h)) return val24;
    const suffix = h >= 12 ? "م" : "ص";
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${String(h).padStart(2, "0")}:${mStr} ${suffix}`;
  };

  const arabicTimeTo24h = (arabicTime: string): string => {
    if (!arabicTime) return "08:30";
    const match = arabicTime.match(/(\d{1,2}):(\d{2})/);
    if (!match) return "08:30";
    let h = parseInt(match[1], 10);
    const m = match[2];
    const isPM = arabicTime.includes("م") || arabicTime.toLowerCase().includes("pm");
    const isAM = arabicTime.includes("ص") || arabicTime.toLowerCase().includes("am");
    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${m}`;
  };

  const quickStartTimes = [
    "08:00 ص",
    "08:30 ص",
    "09:00 ص",
    "09:30 ص",
    "10:00 ص",
    "10:30 ص",
    "11:00 ص",
    "11:30 ص",
    "12:00 م",
    "12:30 م",
    "01:00 م",
    "01:30 م",
  ];

  const quickEndTimes = [
    "09:30 ص",
    "10:00 ص",
    "10:30 ص",
    "11:30 ص",
    "12:30 م",
    "01:30 م",
    "02:30 م",
    "03:30 م",
  ];

  const sortedSchedules = [...schedules].sort(
    (a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime)
  );

  const groupFilteredSchedules = sortedSchedules.filter((s) => {
    if (schedFilterGroup === "الكل") return true;
    if (schedFilterGroup === "MY_GROUP" && currentUser?.academicGroup) {
      return (
        !s.targetGroup ||
        s.targetGroup === "ALL" ||
        s.targetGroup === currentUser.academicGroup
      );
    }
    if (schedFilterGroup === "ALL_BATCH") {
      return !s.targetGroup || s.targetGroup === "ALL";
    }
    return (
      !s.targetGroup ||
      s.targetGroup === "ALL" ||
      s.targetGroup === schedFilterGroup
    );
  });

  const filteredSchedules =
    schedFilterDay === "الكل"
      ? groupFilteredSchedules
      : groupFilteredSchedules.filter((s) => s.day === schedFilterDay);

  const handleOpenAddModal = (presetDay?: string) => {
    setEditingScheduleId(null);
    setSchedDay(presetDay && presetDay !== "الكل" ? presetDay : "الأحد");
    const firstCourse = courses[0];
    if (firstCourse) {
      setSchedCourseId(firstCourse.id);
      setSchedCourseName(firstCourse.name);
      setSchedProf(
        firstCourse.professors?.length && firstCourse.professors[0] !== "غير محدد"
          ? firstCourse.professors.join("، ")
          : ""
      );
    } else {
      setSchedCourseId("__custom__");
      setSchedCourseName("");
      setSchedProf("");
    }
    setSchedLectureType("THEORY");
    setSchedTargetGroup("ALL");
    setSchedStartTime("08:30 ص");
    setSchedEndTime("10:30 ص");
    setSchedHall("");
    setSchedNote("");
    setIsAddingSchedule(true);
  };

  const handleOpenEditModal = (item: LectureSchedule) => {
    setEditingScheduleId(item.id);
    setSchedDay(item.day);
    setSchedCourseId(item.courseId || "__custom__");
    setSchedCourseName(item.courseName);
    setSchedProf(item.professor || "");
    setSchedStartTime(item.startTime);
    setSchedEndTime(item.endTime || "");
    setSchedHall(item.hall || "");
    setSchedLectureType(item.lectureType || (item as any).type || "THEORY");
    setSchedTargetGroup(item.targetGroup || "ALL");
    setSchedNote(item.note || "");
    setIsAddingSchedule(true);
  };

  const handleSaveSubmit = async () => {
    if (!schedCourseName.trim() || !schedStartTime.trim()) return;

    await onSaveSchedule({
      id: editingScheduleId || undefined,
      day: schedDay,
      courseId: schedCourseId !== "__custom__" ? schedCourseId : "",
      courseName: schedCourseName.trim(),
      professor: schedProf.trim(),
      startTime: schedStartTime.trim(),
      endTime: schedEndTime.trim(),
      hall: schedHall.trim(),
      type: schedLectureType,
      targetGroup: schedTargetGroup,
      note: schedNote.trim() || undefined,
    });

    setIsAddingSchedule(false);
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <Calendar size={14} className="text-blue-200" />
              الجدول الأسبوعي للدفعة
            </span>
            <span className="bg-white/10 px-3 py-1 rounded-full text-xs">
              دفعة {currentUser?.batchCode || "ENG26"}
            </span>
            <span className="bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 px-3 py-0.5 rounded-full text-xs font-bold">
              اليوم: {currentArabicDay}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black mb-1">
            الجدول والمحاضرات الأسبوعية 📅
          </h2>
          <p className="opacity-90 text-sm max-w-xl">
            مواعيد المحاضرات، القاعات، أسماء التدريسيين، وربط مباشر لتسجيل حضور وغياب كل محاضرة.
          </p>
        </div>

        {canManageSchedule && (
          <button
            type="button"
            onClick={() => handleOpenAddModal(schedFilterDay)}
            className="bg-white text-indigo-700 hover:bg-indigo-50 px-6 py-3.5 rounded-2xl font-bold text-sm transition shadow-lg flex items-center justify-center gap-2 shrink-0 active:scale-95 cursor-pointer"
          >
            <Plus size={20} />
            إضافة محاضرة للجدول
          </button>
        )}
      </div>

      {/* Days Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {filterDays.map((d) => {
          const isSelected = schedFilterDay === d;
          const isToday = d === currentArabicDay;
          const count =
            d === "الكل"
              ? groupFilteredSchedules.length
              : groupFilteredSchedules.filter((s) => s.day === d).length;

          return (
            <button
              key={d}
              type="button"
              onClick={() => setSchedFilterDay(d)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isSelected
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-slate-700 hover:bg-gray-50"
              }`}
            >
              <span>{d}</span>
              {isToday && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              )}
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Group Filter */}
      {batchAcademicGroups.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
          <span className="text-gray-400 font-bold ml-1">تصفية الكروب:</span>
          <button
            type="button"
            onClick={() => setSchedFilterGroup("الكل")}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              schedFilterGroup === "الكل"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300"
            }`}
          >
            كل الكروبات
          </button>
          {currentUser?.academicGroup && (
            <button
              type="button"
              onClick={() => setSchedFilterGroup("MY_GROUP")}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer ${
                schedFilterGroup === "MY_GROUP"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60"
              }`}
            >
              <Sparkles size={12} />
              <span>كروبي فقط ({currentUser.academicGroup})</span>
            </button>
          )}
          {batchAcademicGroups.map((grp) => (
            <button
              key={grp}
              type="button"
              onClick={() => setSchedFilterGroup(grp)}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                schedFilterGroup === grp
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300"
              }`}
            >
              🔬 {grp}
            </button>
          ))}
        </div>
      )}

      {/* Lectures Grid */}
      <div className="space-y-4">
        {filteredSchedules.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 text-gray-400">
            <Calendar size={48} className="mx-auto mb-3 opacity-20 text-primary" />
            <p className="font-bold text-gray-700 dark:text-gray-300">
              لا توجد محاضرات مجدولة لهذا الاختيار.
            </p>
            {canManageSchedule && (
              <button
                type="button"
                onClick={() => handleOpenAddModal(schedFilterDay)}
                className="mt-3 bg-primary text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-primary/90 transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={16} />
                إضافة محاضرة الآن
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSchedules.map((item) => {
              const isCancelled = !!item.isCancelled;

              return (
                <div
                  key={item.id}
                  className={`bg-white dark:bg-slate-800 rounded-3xl p-5 border transition-all duration-300 shadow-sm flex flex-col justify-between group ${
                    isCancelled
                      ? "border-red-200 dark:border-red-900/40 bg-red-50/20 dark:bg-red-950/10 opacity-75"
                      : "border-gray-100 dark:border-slate-700 hover:shadow-md hover:border-primary/30"
                  }`}
                >
                  <div>
                    {/* Top row */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-xl text-xs font-black">
                          {item.day}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                            item.type === "PRACTICAL"
                              ? "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200/60"
                              : "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/60"
                          }`}
                        >
                          {item.type === "PRACTICAL" ? "مختبر / عملي 🔬" : "نظري 📖"}
                        </span>
                        {item.targetGroup && item.targetGroup !== "ALL" && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200">
                            🔬 {item.targetGroup}
                          </span>
                        )}
                        {isCancelled && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                            ملغية ❌
                          </span>
                        )}
                      </div>

                      {canManageSchedule && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 text-gray-400 hover:text-primary transition cursor-pointer"
                            title="تعديل الموعد"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteSchedule(item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition cursor-pointer"
                            title="حذف المحاضرة من الجدول"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>

                    <h3 className="font-black text-lg text-gray-800 dark:text-white mb-2">
                      {item.courseName}
                    </h3>

                    {/* Time & Location */}
                    <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300 mb-4">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-primary shrink-0" />
                        <span className="font-bold">
                          {item.startTime} {item.endTime ? `— ${item.endTime}` : ""}
                        </span>
                      </div>
                      {item.hall && (
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-amber-500 shrink-0" />
                          <span>{item.hall}</span>
                        </div>
                      )}
                      {item.professor && (
                        <div className="flex items-center gap-2">
                          <UserIcon size={14} className="text-indigo-500 shrink-0" />
                          <span>{item.professor}</span>
                        </div>
                      )}
                      {item.note && (
                        <p className="text-[11px] text-gray-400 mt-2 bg-gray-50 dark:bg-slate-700/40 p-2 rounded-xl">
                          {item.note}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-3 border-t border-gray-100 dark:border-slate-700 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenOrCreateScheduledAttendance(item)}
                      className="flex-1 py-2.5 px-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <CheckCircle2 size={14} />
                      <span>تسجيل الحضور</span>
                    </button>
                    {canManageSchedule && (
                      <button
                        type="button"
                        onClick={() => onToggleCancelSchedule(item)}
                        className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                          isCancelled
                            ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40"
                            : "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/40"
                        }`}
                        title={isCancelled ? "إلغاء التعطيل وإعادة التفعيل" : "تحديد كمحاضرة ملغية لهذا اليوم"}
                      >
                        <AlertCircle size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Schedule Modal */}
      {isAddingSchedule && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto border border-gray-100 dark:border-slate-700">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100 dark:border-slate-700">
              <div>
                <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg inline-block mb-1">
                  الجدول الأسبوعي المتكرر 🔄
                </span>
                <h3 className="font-black text-lg text-gray-800 dark:text-white">
                  {editingScheduleId ? "تعديل موعد المحاضرة" : "إضافة محاضرة للجدول الأسبوعي"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingSchedule(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Course Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    اختر المادة من مواد الدفعة المضافة <span className="text-red-500">*</span>
                  </label>
                  {courses.length === 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingSchedule(false);
                        setActiveTab(Tab.COURSES);
                      }}
                      className="text-[11px] text-primary font-bold hover:underline cursor-pointer"
                    >
                      + إضافة مواد أولاً
                    </button>
                  )}
                </div>

                {courses.length > 0 && (
                  <div className="space-y-2">
                    <select
                      value={schedCourseId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSchedCourseId(val);
                        if (val === "__custom__") {
                          setSchedCourseName("");
                          setSchedProf("");
                        } else {
                          const found = courses.find((c) => c.id === val);
                          if (found) {
                            setSchedCourseName(found.name);
                            const profText =
                              found.professors?.length && found.professors[0] !== "غير محدد"
                                ? found.professors.join("، ")
                                : "";
                            setSchedProf(profText);
                          }
                        }
                      }}
                      className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          📚 {c.name}
                        </option>
                      ))}
                      <option value="__custom__">✍️ كتابة اسم مادة أخرى يدوياً...</option>
                    </select>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {courses.map((c) => {
                        const isSelected = schedCourseId === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSchedCourseId(c.id);
                              setSchedCourseName(c.name);
                              const profText =
                                c.professors?.length && c.professors[0] !== "غير محدد"
                                  ? c.professors.join("، ")
                                  : "";
                              setSchedProf(profText);
                            }}
                            className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                              isSelected
                                ? "bg-primary text-white border-primary shadow-xs"
                                : "bg-gray-50 dark:bg-slate-700/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-600 hover:border-primary/40"
                            }`}
                          >
                            {c.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(courses.length === 0 || schedCourseId === "__custom__") && (
                  <input
                    type="text"
                    value={schedCourseName}
                    onChange={(e) => setSchedCourseName(e.target.value)}
                    placeholder="اكتب اسم المادة..."
                    className="w-full mt-2 bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-2.5 text-sm outline-none"
                  />
                )}
              </div>

              {/* Day of Week & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                    يوم المحاضرة (يتكرر كل أسبوع) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={schedDay}
                    onChange={(e) => setSchedDay(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-3.5 py-2.5 text-sm font-bold outline-none cursor-pointer"
                  >
                    {weekDays.map((d) => (
                      <option key={d} value={d}>
                        كل يوم {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                    نوع المحاضرة
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-slate-700/60 p-1 rounded-2xl border border-gray-200 dark:border-slate-600">
                    <button
                      type="button"
                      onClick={() => setSchedLectureType("THEORY")}
                      className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        schedLectureType === "THEORY"
                          ? "bg-white dark:bg-slate-800 text-primary shadow-xs"
                          : "text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      نظري 📖
                    </button>
                    <button
                      type="button"
                      onClick={() => setSchedLectureType("PRACTICAL")}
                      className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        schedLectureType === "PRACTICAL"
                          ? "bg-white dark:bg-slate-800 text-purple-600 shadow-xs"
                          : "text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      عملي / مختبر 🔬
                    </button>
                  </div>
                </div>
              </div>

              {/* Target Group */}
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                  الكروب المستهدف في المحاضرة
                </label>
                <select
                  value={schedTargetGroup}
                  onChange={(e) => setSchedTargetGroup(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-3.5 py-2.5 text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="ALL">لكافة الطلاب (الدفعة بالكامل)</option>
                  {batchAcademicGroups.map((grp) => (
                    <option key={grp} value={grp}>
                      🔬 مخصصة لطلاب ({grp}) فقط
                    </option>
                  ))}
                </select>
              </div>

              {/* Timing */}
              <div className="space-y-3 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-black text-blue-900 dark:text-blue-200 mb-1 flex items-center gap-1">
                      <Clock size={14} className="text-primary" />
                      وقت بدء المحاضرة <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="time"
                        value={arabicTimeTo24h(schedStartTime)}
                        onChange={(e) => setSchedStartTime(format24hToArabic(e.target.value))}
                        className="bg-white dark:bg-slate-800 dark:text-white border border-blue-200 dark:border-slate-600 rounded-xl px-2.5 py-2 text-xs font-bold outline-none"
                      />
                      <input
                        type="text"
                        value={schedStartTime}
                        onChange={(e) => setSchedStartTime(e.target.value)}
                        placeholder="08:30 ص"
                        className="flex-1 bg-white dark:bg-slate-800 dark:text-white border border-blue-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-black text-center outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-1 block">
                      وقت انتهاء المحاضرة (اختياري)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="time"
                        value={arabicTimeTo24h(schedEndTime)}
                        onChange={(e) => setSchedEndTime(format24hToArabic(e.target.value))}
                        className="bg-white dark:bg-slate-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-2.5 py-2 text-xs font-bold outline-none"
                      />
                      <input
                        type="text"
                        value={schedEndTime}
                        onChange={(e) => setSchedEndTime(e.target.value)}
                        placeholder="10:30 ص"
                        className="flex-1 bg-white dark:bg-slate-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-bold text-center outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Start Times */}
                <div>
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 block mb-1.5">
                    اختيار سريع لوقت بدء المحاضرة:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {quickStartTimes.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSchedStartTime(t)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          schedStartTime === t
                            ? "bg-primary text-white shadow-xs"
                            : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-600 hover:border-primary"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick End Times */}
                <div>
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 block mb-1.5">
                    اختيار سريع لوقت الانتهاء:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {quickEndTimes.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSchedEndTime(t)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          schedEndTime === t
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-600 hover:border-indigo-500"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Professor & Hall */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 block">
                    التدريسي (يُملأ تلقائياً من المادة)
                  </label>
                  <input
                    type="text"
                    value={schedProf}
                    onChange={(e) => setSchedProf(e.target.value)}
                    placeholder="د. فلان"
                    className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 block">
                    القاعة أو المختبر
                  </label>
                  <input
                    type="text"
                    value={schedHall}
                    onChange={(e) => setSchedHall(e.target.value)}
                    placeholder="مثال: قاعة 104 / مختبر الشبكات"
                    className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs outline-none"
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 block">
                  ملاحظات إضافية (اختياري)
                </label>
                <input
                  type="text"
                  value={schedNote}
                  onChange={(e) => setSchedNote(e.target.value)}
                  placeholder="مثال: الحضور بالزي الرسمي أو إحضار الحاسبة..."
                  className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs outline-none"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAddingSchedule(false)}
                  className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 py-3 rounded-2xl font-bold text-xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveSubmit}
                  disabled={!schedCourseName.trim() || !schedStartTime.trim()}
                  className="flex-1 bg-primary text-white py-3 rounded-2xl font-black text-xs shadow-lg shadow-primary/30 hover:bg-primary/90 transition cursor-pointer disabled:opacity-50"
                >
                  {editingScheduleId ? "حفظ التعديلات" : "إضافة للجدول الأسبوعي"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
