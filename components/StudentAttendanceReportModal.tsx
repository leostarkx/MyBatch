import React, { useState, useRef, useMemo } from "react";
import {
  X,
  Download,
  FileText,
  Calendar,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  GraduationCap,
  Filter,
  Loader2,
} from "lucide-react";
import {
  User,
  Course,
  AttendanceSession,
  AttendanceRecord,
  Batch,
} from "../types";
import { BatchLogo } from "./BatchLogo";

interface StudentAttendanceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStudent: User;
  allStudents?: User[];
  isManager?: boolean;
  canSelectOtherStudents?: boolean;
  courses?: Course[];
  attendanceSessions?: AttendanceSession[];
  sessions?: AttendanceSession[];
  attendanceRecords?: AttendanceRecord[];
  records?: AttendanceRecord[];
  batch?: Batch;
  batchCode?: string;
}

const ARABIC_MONTHS: { [key: string]: string } = {
  "01": "كانون الثاني (يناير)",
  "02": "شباط (فبراير)",
  "03": "آذار (مارس)",
  "04": "نيسان (أبريل)",
  "05": "أيار (مايو)",
  "06": "حزيران (يونيو)",
  "07": "تموز (يوليو)",
  "08": "آب (أغسطس)",
  "09": "أيلول (سبتمبر)",
  "10": "تشرين الأول (أكتوبر)",
  "11": "تشرين الثاني (نوفمبر)",
  "12": "كانون الأول (ديسمبر)",
};

export const StudentAttendanceReportModal: React.FC<
  StudentAttendanceReportModalProps
> = ({
  isOpen,
  onClose,
  initialStudent,
  allStudents = [],
  isManager: isManagerProp,
  canSelectOtherStudents,
  courses = [],
  attendanceSessions: attendanceSessionsProp,
  sessions,
  attendanceRecords: attendanceRecordsProp,
  records,
  batch,
  batchCode: batchCodeProp,
}) => {
  const isManager = Boolean(isManagerProp ?? canSelectOtherStudents);
  const attendanceSessions = attendanceSessionsProp || sessions || [];
  const attendanceRecords = attendanceRecordsProp || records || [];
  const batchCode = batchCodeProp || batch?.code || initialStudent.batchCode || "";
  const [selectedStudentUid, setSelectedStudentUid] = useState<string>(
    initialStudent.uid
  );
  const [reportPeriodType, setReportPeriodType] = useState<
    "SEMESTER" | "MONTHLY"
  >("SEMESTER");
  const [selectedMonth, setSelectedMonth] = useState<string>(() =>
    new Date().toISOString().slice(0, 7)
  );
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const reportContainerRef = useRef<HTMLDivElement>(null);

  // Sync if initialStudent changes
  React.useEffect(() => {
    if (initialStudent?.uid) {
      setSelectedStudentUid(initialStudent.uid);
    }
  }, [initialStudent]);

  // Available months from existing attendance sessions + current month
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    const currentYM = new Date().toISOString().slice(0, 7);
    monthsSet.add(currentYM);

    attendanceSessions.forEach((s) => {
      if (s.date && s.date.length >= 7) {
        monthsSet.add(s.date.slice(0, 7));
      }
    });

    return Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
  }, [attendanceSessions]);

  if (!isOpen) return null;

  const targetStudent =
    allStudents.find((s) => s.uid === selectedStudentUid) || initialStudent;

  // Filter sessions based on period (Semester = all sessions, Monthly = YYYY-MM match)
  const filteredSessions = attendanceSessions
    .filter((s) => {
      if (reportPeriodType === "MONTHLY") {
        return s.date && s.date.startsWith(selectedMonth);
      }
      return true;
    })
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const filteredSessionIds = new Set(filteredSessions.map((s) => s.id));
  const studentRecordsInPeriod = attendanceRecords.filter(
    (r) => r.studentId === targetStudent.uid && filteredSessionIds.has(r.sessionId)
  );

  // Overall stats in selected period
  const totalSessionsCount = filteredSessions.length;
  const totalPresentCount = studentRecordsInPeriod.filter(
    (r) => r.status === "PRESENT"
  ).length;
  const totalAbsentCount = studentRecordsInPeriod.filter(
    (r) => r.status === "ABSENT"
  ).length;
  const totalExcusedCount = studentRecordsInPeriod.filter(
    (r) => r.status === "EXCUSED"
  ).length;

  const overallAttendancePct =
    totalSessionsCount > 0
      ? Math.round(
          ((totalPresentCount + totalExcusedCount) / totalSessionsCount) * 100
        )
      : 100;
  const overallAbsencePct =
    totalSessionsCount > 0
      ? Math.round((totalAbsentCount / totalSessionsCount) * 100)
      : 0;
  const overallExcusedPct =
    totalSessionsCount > 0
      ? Math.round((totalExcusedCount / totalSessionsCount) * 100)
      : 0;

  // Per-course stats
  const courseStats = courses.map((course) => {
    const courseSessions = filteredSessions.filter(
      (s) => s.courseId === course.id
    );
    const cSessionIds = new Set(courseSessions.map((s) => s.id));
    const cRecords = studentRecordsInPeriod.filter((r) =>
      cSessionIds.has(r.sessionId)
    );

    const total = courseSessions.length;
    const present = cRecords.filter((r) => r.status === "PRESENT").length;
    const absent = cRecords.filter((r) => r.status === "ABSENT").length;
    const excused = cRecords.filter((r) => r.status === "EXCUSED").length;

    const attendanceRate =
      total > 0 ? Math.round(((present + excused) / total) * 100) : 100;
    const absenceRate = total > 0 ? Math.round((absent / total) * 100) : 0;
    const excusedRate = total > 0 ? Math.round((excused / total) * 100) : 0;

    return {
      course,
      total,
      present,
      absent,
      excused,
      attendanceRate,
      absenceRate,
      excusedRate,
    };
  });

  // Detailed log of absences & excused leaves
  const absenceAndLeaveDetails = studentRecordsInPeriod
    .filter((r) => r.status === "ABSENT" || r.status === "EXCUSED")
    .map((rec) => {
      const sess = filteredSessions.find((s) => s.id === rec.sessionId);
      const crs = courses.find((c) => c.id === sess?.courseId);
      return {
        id: rec.id,
        status: rec.status,
        date: sess?.date || "--",
        sessionTitle: sess?.title || "محاضرة",
        courseName: crs?.name || "مادة دراسية",
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const formatMonthLabel = (ym: string) => {
    const [year, month] = ym.split("-");
    return `${ARABIC_MONTHS[month] || month} ${year}`;
  };

  const periodTitle =
    reportPeriodType === "SEMESTER"
      ? "التقرير الفصلي الشامل للحضور والغياب"
      : `التقرير الشهري للحضور والغياب - ${formatMonthLabel(selectedMonth)}`;

  const handleDownloadPdf = async () => {
    if (!reportContainerRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const html2pdfModule = await import("html2pdf.js");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const html2pdf = (html2pdfModule.default || html2pdfModule) as any;

      const cleanStudentName = targetStudent.name.replace(/\s+/g, "_");
      const periodSuffix =
        reportPeriodType === "SEMESTER" ? "فصلي" : selectedMonth;
      const fileName = `تقرير_حضور_${cleanStudentName}_${periodSuffix}.pdf`;

      const opt = {
        margin: [8, 8, 8, 8] as [number, number, number, number],
        filename: fileName,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait" as const,
        },
      };

      await html2pdf().set(opt).from(reportContainerRef.current).save();
    } catch (error) {
      console.error("Error generating PDF:", error);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Top Control Bar */}
        <div className="p-4 md:p-5 border-b border-gray-100 dark:border-slate-700 bg-gray-50/70 dark:bg-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="font-black text-base md:text-lg text-gray-800 dark:text-white">
                  توليد وتصدير تقرير الحضور والغياب (PDF) 📄
                </h3>
                <p className="text-[11px] text-gray-400">
                  تقرير رسمي مفصل بنسب الحضور والغياب والإجازات قابل للتحميل المباشر
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-gray-400 hover:text-gray-600 rounded-xl"
            >
              <X size={20} />
            </button>
          </div>

          {/* Controls: Student Picker (for Manager), Period Toggle, Month Selector, Download Button */}
          <div className="flex flex-wrap items-center gap-2">
            {/* If Representative/Manager: can select any student */}
            {isManager && allStudents.length > 0 && (
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-2.5 py-1.5">
                <UserIcon size={14} className="text-primary shrink-0" />
                <select
                  value={selectedStudentUid}
                  onChange={(e) => setSelectedStudentUid(e.target.value)}
                  className="bg-transparent text-xs font-bold text-gray-800 dark:text-white outline-none cursor-pointer max-w-[170px]"
                >
                  {allStudents.map((st) => (
                    <option
                      key={st.uid}
                      value={st.uid}
                      className="bg-white dark:bg-slate-800 text-gray-800 dark:text-white"
                    >
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Period Type Toggle: Semester vs Monthly */}
            <div className="flex bg-gray-200/70 dark:bg-slate-700 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setReportPeriodType("SEMESTER")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  reportPeriodType === "SEMESTER"
                    ? "bg-white dark:bg-slate-800 text-primary shadow-xs"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              >
                تقرير فصلي شامل
              </button>
              <button
                type="button"
                onClick={() => setReportPeriodType("MONTHLY")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  reportPeriodType === "MONTHLY"
                    ? "bg-white dark:bg-slate-800 text-primary shadow-xs"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              >
                تقرير شهري
              </button>
            </div>

            {/* Month Selector if Monthly */}
            {reportPeriodType === "MONTHLY" && (
              <div className="flex items-center gap-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-2.5 py-1.5">
                <Filter size={13} className="text-indigo-500" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-xs font-bold text-gray-800 dark:text-white outline-none cursor-pointer"
                >
                  {availableMonths.map((ym) => (
                    <option
                      key={ym}
                      value={ym}
                      className="bg-white dark:bg-slate-800 text-gray-800 dark:text-white"
                    >
                      {formatMonthLabel(ym)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-60"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>جاري تجهيز ملف PDF...</span>
                </>
              ) : (
                <>
                  <Download size={15} />
                  <span>تنزيل التقرير بصيغة PDF</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="hidden lg:flex p-2 text-gray-400 hover:text-gray-600 rounded-xl"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable PDF Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100/80 dark:bg-slate-900/70">
          <div
            ref={reportContainerRef}
            dir="rtl"
            className="bg-white text-slate-900 rounded-2xl p-6 md:p-8 shadow-sm max-w-3xl mx-auto border border-slate-200 space-y-6"
            style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}
          >
            {/* Official Report Header */}
            <div className="border-b-2 border-indigo-600 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3.5">
                <BatchLogo className="w-14 h-14 border border-slate-200 rounded-2xl p-1.5 bg-white shadow-xs" />
                <div>
                  <div className="flex items-center gap-2 text-indigo-700 font-black text-xs mb-1">
                    <GraduationCap size={18} />
                    <span>منصة دفعتي الأكاديمية • كشف الحضور والغياب الرسمي</span>
                  </div>
                  <h1 className="text-xl md:text-2xl font-black text-slate-900">
                    {periodTitle}
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    {batch?.name || `دفعة ${batchCode}`} •{" "}
                    {batch?.department || "القسم الأكاديمي"} •{" "}
                    {batch?.stage || ""}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-right shrink-0">
                <div className="text-[11px] text-slate-500 font-bold">
                  تاريخ إصدار التقرير:
                </div>
                <div className="text-xs font-black text-slate-800">
                  {new Date().toLocaleDateString("ar-IQ", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <div className="text-[10px] text-indigo-600 font-bold mt-0.5">
                  كود الدفعة: {batchCode}
                </div>
              </div>
            </div>

            {/* Student Info Card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-black text-lg flex items-center justify-center">
                  {targetStudent.name.charAt(0)}
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-bold block">
                    اسم الطالب:
                  </span>
                  <h2 className="text-base md:text-lg font-black text-slate-900">
                    {targetStudent.name}
                  </h2>
                  <span className="text-xs text-slate-500">
                    {targetStudent.email ||
                      (targetStudent.username
                        ? `@${targetStudent.username}`
                        : "طالب مقيد في سجل الدفعة")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-center px-3 py-1.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block">
                    نسبة الحضور العامة
                  </span>
                  <span
                    className={`text-base font-black ${
                      overallAttendancePct >= 75
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {overallAttendancePct}%
                  </span>
                </div>
                <div className="text-center px-3 py-1.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block">
                    نسبة الغياب الفعلية
                  </span>
                  <span className="text-base font-black text-red-600">
                    {overallAbsencePct}%
                  </span>
                </div>
                <div className="text-center px-3 py-1.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block">
                    نسبة الإجازات
                  </span>
                  <span className="text-base font-black text-amber-600">
                    {overallExcusedPct}%
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Summary Stat Boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-xs text-slate-500 font-bold block mb-1">
                  إجمالي المحاضرات
                </span>
                <span className="text-2xl font-black text-slate-800">
                  {totalSessionsCount}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  محاضرة مسجلة
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center">
                <span className="text-xs text-emerald-700 font-bold block mb-1">
                  مرات الحضور
                </span>
                <span className="text-2xl font-black text-emerald-700">
                  {totalPresentCount}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                  حضور فعلي
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-red-50/70 border border-red-200 text-center">
                <span className="text-xs text-red-700 font-bold block mb-1">
                  مرات الغياب ({overallAbsencePct}%)
                </span>
                <span className="text-2xl font-black text-red-600">
                  {totalAbsentCount}
                </span>
                <span className="text-[10px] text-red-500 font-bold block mt-0.5">
                  بدون عذر
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-center">
                <span className="text-xs text-amber-700 font-bold block mb-1">
                  الإجازات ({overallExcusedPct}%)
                </span>
                <span className="text-2xl font-black text-amber-600">
                  {totalExcusedCount}
                </span>
                <span className="text-[10px] text-amber-600 font-bold block mt-0.5">
                  بعذر رسمي (مجاز)
                </span>
              </div>
            </div>

            {/* Per-Course Breakdown Table */}
            <div>
              <h3 className="text-sm font-black text-slate-800 mb-2.5 flex items-center gap-1.5">
                <Calendar size={16} className="text-indigo-600" />
                <span>جدول تفصيل نسب الحضور والغياب والإجازات حسب المادة الدراسية:</span>
              </h3>

              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full text-right border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-black">
                    <tr>
                      <th className="p-3 border-b border-slate-200">المادة الدراسية</th>
                      <th className="p-3 border-b border-slate-200 text-center">
                        المحاضرات
                      </th>
                      <th className="p-3 border-b border-slate-200 text-center text-emerald-700">
                        حاضر
                      </th>
                      <th className="p-3 border-b border-slate-200 text-center text-red-600">
                        غائب (النسبة)
                      </th>
                      <th className="p-3 border-b border-slate-200 text-center text-amber-600">
                        مجاز (النسبة)
                      </th>
                      <th className="p-3 border-b border-slate-200 text-center">
                        نسبة الالتزام
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {courseStats.map((st) => (
                      <tr key={st.course.id} className="hover:bg-slate-50/80">
                        <td className="p-3 font-bold text-slate-800">
                          <div>{st.course.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            {st.course.professors?.join("، ")}
                          </div>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-700">
                          {st.total}
                        </td>
                        <td className="p-3 text-center font-bold text-emerald-600">
                          {st.present}
                        </td>
                        <td className="p-3 text-center font-bold text-red-600">
                          {st.absent}{" "}
                          <span className="text-[10px] text-slate-400">
                            ({st.absenceRate}%)
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold text-amber-600">
                          {st.excused}{" "}
                          <span className="text-[10px] text-slate-400">
                            ({st.excusedRate}%)
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                              st.attendanceRate >= 75
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {st.attendanceRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                    {courseStats.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="p-6 text-center text-slate-400 font-bold"
                        >
                          لا توجد مواد دراسية مسجلة حالياً.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detailed Dates of Absences & Excused Leaves */}
            <div>
              <h3 className="text-sm font-black text-slate-800 mb-2.5 flex items-center gap-1.5">
                <Clock size={16} className="text-amber-600" />
                <span>
                  سجل تواريخ الغيابات والإجازات المسجلة في هذه الفترة (
                  {absenceAndLeaveDetails.length}):
                </span>
              </h3>

              {absenceAndLeaveDetails.length === 0 ? (
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>
                    سجل نظيف تماماً! لا توجد أي غيابات أو إجازات مسجلة على الطالب خلال هذه الفترة.
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {absenceAndLeaveDetails.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                        item.status === "ABSENT"
                          ? "bg-red-50/40 border-red-200"
                          : "bg-amber-50/40 border-amber-200"
                      }`}
                    >
                      <div>
                        <span className="font-black text-slate-800 block">
                          {item.courseName} — {item.sessionTitle}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          التاريخ: {item.date}
                        </span>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-lg font-black text-[11px] ${
                          item.status === "ABSENT"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {item.status === "ABSENT" ? "غائب" : "مجاز (إجازة)"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Official Footer Signature */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-400">
              <div>
                تم توليد هذا التقرير إلكترونياً عبر منصة <strong>«دفعتي»</strong> لإدارة الدفعات الجامعية.
              </div>
              <div>
                ممثل الدفعة: <strong>{batch?.representativeName || "ممثل الدفعة"}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
