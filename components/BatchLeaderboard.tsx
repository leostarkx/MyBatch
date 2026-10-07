import React, { useState, useMemo } from "react";
import {
  Trophy,
  Crown,
  Medal,
  Flame,
  CalendarCheck,
  AlertTriangle,
  GraduationCap,
  Award,
  BookOpen,
  CheckSquare,
  Sparkles,
  Search,
  ChevronDown,
  Zap,
  Star,
  User as UserIcon,
  TrendingUp,
  Target,
} from "lucide-react";
import {
  User,
  UserRole,
  Course,
  Grade,
  AttendanceSession,
  AttendanceRecord,
  Assignment,
  Material,
  AssessmentStructure,
} from "../types";
import { compareArabicNames } from "../services/firebase";

interface BatchLeaderboardProps {
  currentUser: User | null;
  users: User[];
  courses: Course[];
  grades: Grade[];
  sessions: AttendanceSession[];
  records: AttendanceRecord[];
  assignments: Assignment[];
  materials: Material[];
  effectiveBatchCode: string;
  onViewProfile?: (uid: string) => void;
}

type LeaderboardCategory =
  | "OVERALL_XP" // أساطير الدفعة (النقاط الشاملة)
  | "CUMULATIVE_GRADES" // ملوك السعي التراكمي
  | "SPECIFIC_ASSESSMENT" // أبطال الامتحانات والتقارير (درجة بشغلة معينة)
  | "MOST_PRESENT" // ملوك الالتزام والحضور
  | "MOST_ABSENT" // القائمة الحمراء (أكثر الطلاب غياباً 😅)
  | "STUDY_WARRIORS"; // أبطال الدراسة والواجبات

export const BatchLeaderboard: React.FC<BatchLeaderboardProps> = ({
  currentUser,
  users,
  courses,
  grades,
  sessions,
  records,
  assignments,
  materials,
  effectiveBatchCode,
  onViewProfile,
}) => {
  const [activeCategory, setActiveCategory] =
    useState<LeaderboardCategory>("OVERALL_XP");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("ALL");
  const [selectedAssessmentId, setSelectedAssessmentId] =
    useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Helper to check if an assessment is Final vs Cumulative (السعي من 50)
  const isFinalAssessment = (asm: AssessmentStructure) => {
    if (asm.category === "FINAL") return true;
    if (asm.category === "CUMULATIVE") return false;
    const n = asm.name.toLowerCase();
    return (
      n.includes("فاينل") ||
      n.includes("فاينال") ||
      n.includes("نهائي") ||
      n.includes("final")
    );
  };

  // Eligible batch students (registered + official, excluding owner & excluded accounts)
  const batchStudents = useMemo(() => {
    return users
      .filter((u) => {
        if (u.role === UserRole.OWNER) return false;
        if (u.excludeFromStats) return false;
        if (u.batchCode === effectiveBatchCode) return true;
        if (u.isOfficial && (!u.batchCode || u.batchCode === effectiveBatchCode))
          return true;
        return false;
      })
      .sort((a, b) => compareArabicNames(a.name, b.name));
  }, [users, effectiveBatchCode]);

  // Available assessments for the selected course (or across all courses)
  const availableAssessments = useMemo(() => {
    const list: {
      id: string;
      name: string;
      maxScore: number;
      courseId: string;
      courseName: string;
      isFinal: boolean;
    }[] = [];

    const targetCourses =
      selectedCourseId === "ALL"
        ? courses
        : courses.filter((c) => c.id === selectedCourseId);

    targetCourses.forEach((c) => {
      (c.assessments || []).forEach((asm) => {
        list.push({
          id: asm.id,
          name: asm.name,
          maxScore: asm.maxScore,
          courseId: c.id,
          courseName: c.name,
          isFinal: isFinalAssessment(asm),
        });
      });
    });

    return list;
  }, [courses, selectedCourseId]);

  // Compute rich stats for every student
  const studentMetrics = useMemo(() => {
    const relevantSessions =
      selectedCourseId === "ALL"
        ? sessions
        : sessions.filter((s) => s.courseId === selectedCourseId);
    const totalSessionsCount = relevantSessions.length;
    const sessionIdsSet = new Set(relevantSessions.map((s) => s.id));

    const targetCourses =
      selectedCourseId === "ALL"
        ? courses
        : courses.filter((c) => c.id === selectedCourseId);

    return batchStudents.map((student) => {
      // 1. Attendance Metrics (Group-aware: count sessions for ALL, student's academicGroup, or where student has an explicit record/exception)
      const studentRelevantSessions = relevantSessions.filter((s) => {
        const hasRec = records.some(
          (r) => r.sessionId === s.id && r.studentId === student.uid
        );
        if (hasRec) return true;
        if (s.targetGroup && s.targetGroup !== "ALL") {
          return student.academicGroup === s.targetGroup;
        }
        return true;
      });
      const studentTotalSessionsCount = studentRelevantSessions.length;
      const studentSessionIdsSet = new Set(
        studentRelevantSessions.map((s) => s.id)
      );

      const stRecords = records.filter(
        (r) =>
          r.studentId === student.uid && studentSessionIdsSet.has(r.sessionId)
      );
      const presentCount = stRecords.filter(
        (r) => r.status === "PRESENT"
      ).length;
      const absentCount = stRecords.filter((r) => r.status === "ABSENT").length;
      const excusedCount = stRecords.filter(
        (r) => r.status === "EXCUSED"
      ).length;

      const attendanceRate =
        studentTotalSessionsCount > 0
          ? Math.round(
              ((presentCount + excusedCount) / studentTotalSessionsCount) * 100
            )
          : 0;
      const purePresentRate =
        studentTotalSessionsCount > 0
          ? Math.round((presentCount / studentTotalSessionsCount) * 100)
          : 0;
      const absenceRate =
        studentTotalSessionsCount > 0
          ? Math.round((absentCount / studentTotalSessionsCount) * 100)
          : 0;

      // 2. Cumulative Grades (السعي من 50)
      let cumulativeEarnedTotal = 0;
      let cumulativeMaxPossible = 0;
      let coursesWithGradesCount = 0;

      targetCourses.forEach((course) => {
        const cumAsms = (course.assessments || []).filter(
          (a) => !isFinalAssessment(a)
        );
        const courseGrades = grades.filter(
          (g) => g.studentId === student.uid && g.courseId === course.id
        );

        let cEarned = 0;
        let cMax = 0;
        let hasAnyGradeInCourse = false;

        cumAsms.forEach((asm) => {
          cMax += Number(asm.maxScore) || 0;
          const g = courseGrades.find((gr) => gr.assessmentId === asm.id);
          if (g && g.score !== undefined) {
            cEarned += Number(g.score) || 0;
            hasAnyGradeInCourse = true;
          }
        });

        if (hasAnyGradeInCourse) {
          coursesWithGradesCount++;
        }
        cumulativeEarnedTotal += cEarned;
        cumulativeMaxPossible += cMax || 50;
      });

      const avgCumulativeOutOf50 =
        targetCourses.length > 0
          ? Number((cumulativeEarnedTotal / targetCourses.length).toFixed(1))
          : 0;

      // 3. Specific Assessment Score (درجة امتحان / كويز / تقرير محدد)
      let specificScore = 0;
      let specificMax = 0;
      let specificPercentage = 0;
      let specificAssessmentsCount = 0;

      if (selectedAssessmentId !== "ALL") {
        const targetAsm = availableAssessments.find(
          (a) => a.id === selectedAssessmentId
        );
        if (targetAsm) {
          specificMax = targetAsm.maxScore;
          const foundGrade = grades.find(
            (g) =>
              g.studentId === student.uid &&
              g.courseId === targetAsm.courseId &&
              g.assessmentId === targetAsm.id
          );
          if (foundGrade && foundGrade.score !== undefined) {
            specificScore = Number(foundGrade.score);
            specificAssessmentsCount = 1;
            specificPercentage =
              specificMax > 0
                ? Math.round((specificScore / specificMax) * 100)
                : 0;
          }
        }
      } else {
        // Sum across all assessments in target courses
        targetCourses.forEach((course) => {
          (course.assessments || []).forEach((asm) => {
            const foundGrade = grades.find(
              (g) =>
                g.studentId === student.uid &&
                g.courseId === course.id &&
                g.assessmentId === asm.id
            );
            if (foundGrade && foundGrade.score !== undefined) {
              specificScore += Number(foundGrade.score);
              specificMax += Number(asm.maxScore) || 0;
              specificAssessmentsCount++;
            }
          });
        });
        specificPercentage =
          specificMax > 0 ? Math.round((specificScore / specificMax) * 100) : 0;
      }

      // 4. Assignments & Studied Lectures
      const completedAssignments = assignments.filter((a) =>
        a.completedBy?.includes(student.uid)
      ).length;
      const studiedLectures = (student.studiedMaterialIds || []).filter((id) =>
        materials.some((m) => m.id === id)
      ).length;
      const totalTasksScore = completedAssignments + studiedLectures;

      // 5. Overall XP (نقاط الحماس والتفاعل الشامل)
      // - كل حضور = +15 نقطة
      // - كل درجة سعي = +10 نقاط
      // - كل واجب منجز = +25 نقطة
      // - كل محاضرة مدروسة = +15 نقطة
      // - كل غياب بدون عذر = -10 نقاط
      const rawXp =
        presentCount * 15 +
        excusedCount * 5 +
        Math.round(cumulativeEarnedTotal * 10) +
        completedAssignments * 25 +
        studiedLectures * 15 -
        absentCount * 10;
      const xp = Math.max(0, rawXp);

      // Dynamic Fun Badge / Title
      let funTitle = "طالب طموح 🚀";
      if (purePresentRate === 100 && totalSessionsCount >= 3) {
        funTitle = "حاضر دائماً وأبداً 🛡️";
      } else if (avgCumulativeOutOf50 >= 45) {
        funTitle = "عبقري السعيات 🧠";
      } else if (completedAssignments >= assignments.length && assignments.length > 0) {
        funTitle = "قناص الواجبات ⚡";
      } else if (studiedLectures >= 5) {
        funTitle = "دافور المحاضرات 📚";
      } else if (presentCount >= 5) {
        funTitle = "ملتزم ومميز ✨";
      }

      return {
        student,
        presentCount,
        absentCount,
        excusedCount,
        totalSessionsCount,
        attendanceRate,
        purePresentRate,
        absenceRate,
        cumulativeEarnedTotal: Number(cumulativeEarnedTotal.toFixed(1)),
        cumulativeMaxPossible,
        avgCumulativeOutOf50,
        coursesWithGradesCount,
        specificScore: Number(specificScore.toFixed(1)),
        specificMax,
        specificPercentage,
        specificAssessmentsCount,
        completedAssignments,
        studiedLectures,
        totalTasksScore,
        xp,
        funTitle,
      };
    });
  }, [
    batchStudents,
    sessions,
    records,
    courses,
    grades,
    assignments,
    materials,
    selectedCourseId,
    selectedAssessmentId,
    availableAssessments,
  ]);

  // Sort students based on active leaderboard category
  const rankedList = useMemo(() => {
    const list = [...studentMetrics];

    list.sort((a, b) => {
      switch (activeCategory) {
        case "OVERALL_XP":
          if (b.xp !== a.xp) return b.xp - a.xp;
          if (b.cumulativeEarnedTotal !== a.cumulativeEarnedTotal)
            return b.cumulativeEarnedTotal - a.cumulativeEarnedTotal;
          return b.presentCount - a.presentCount;

        case "CUMULATIVE_GRADES":
          if (b.cumulativeEarnedTotal !== a.cumulativeEarnedTotal)
            return b.cumulativeEarnedTotal - a.cumulativeEarnedTotal;
          return b.avgCumulativeOutOf50 - a.avgCumulativeOutOf50;

        case "SPECIFIC_ASSESSMENT":
          if (b.specificScore !== a.specificScore)
            return b.specificScore - a.specificScore;
          return b.specificPercentage - a.specificPercentage;

        case "MOST_PRESENT":
          if (b.presentCount !== a.presentCount)
            return b.presentCount - a.presentCount;
          if (b.attendanceRate !== a.attendanceRate)
            return b.attendanceRate - a.attendanceRate;
          return a.absentCount - b.absentCount;

        case "MOST_ABSENT":
          if (b.absentCount !== a.absentCount)
            return b.absentCount - a.absentCount;
          if (b.absenceRate !== a.absenceRate)
            return b.absenceRate - a.absenceRate;
          return b.excusedCount - a.excusedCount;

        case "STUDY_WARRIORS":
          if (b.totalTasksScore !== a.totalTasksScore)
            return b.totalTasksScore - a.totalTasksScore;
          if (b.completedAssignments !== a.completedAssignments)
            return b.completedAssignments - a.completedAssignments;
          return b.studiedLectures - a.studiedLectures;

        default:
          return 0;
      }
    });

    return list.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  }, [studentMetrics, activeCategory]);

  // Filter for search while preserving true rank
  const displayedRankedList = useMemo(() => {
    if (!searchQuery.trim()) return rankedList;
    const q = searchQuery.toLowerCase();
    return rankedList.filter(
      (item) =>
        item.student.name.toLowerCase().includes(q) ||
        (item.student.username &&
          item.student.username.toLowerCase().includes(q))
    );
  }, [rankedList, searchQuery]);

  // Top 3 for podium
  const topThree = rankedList.slice(0, 3);

  // Current user's rank & stats
  const myRankItem = useMemo(() => {
    if (!currentUser) return null;
    return rankedList.find((r) => r.student.uid === currentUser.uid) || null;
  }, [rankedList, currentUser]);

  // Quick Hall of Fame Champions across categories
  const hallOfFame = useMemo(() => {
    if (studentMetrics.length === 0) return null;

    const topSaei = [...studentMetrics].sort(
      (a, b) => b.cumulativeEarnedTotal - a.cumulativeEarnedTotal
    )[0];
    const topAttendance = [...studentMetrics].sort((a, b) =>
      b.presentCount !== a.presentCount
        ? b.presentCount - a.presentCount
        : a.absentCount - b.absentCount
    )[0];
    const topAbsent = [...studentMetrics].sort(
      (a, b) => b.absentCount - a.absentCount
    )[0];
    const topStudy = [...studentMetrics].sort(
      (a, b) => b.totalTasksScore - a.totalTasksScore
    )[0];

    return {
      topSaei: topSaei && topSaei.cumulativeEarnedTotal > 0 ? topSaei : null,
      topAttendance:
        topAttendance && topAttendance.presentCount > 0 ? topAttendance : null,
      topAbsent: topAbsent && topAbsent.absentCount > 0 ? topAbsent : null,
      topStudy: topStudy && topStudy.totalTasksScore > 0 ? topStudy : null,
    };
  }, [studentMetrics]);

  // Helper to format the primary score label for each category
  const getCategoryScoreDisplay = (item: (typeof rankedList)[0]) => {
    switch (activeCategory) {
      case "OVERALL_XP":
        return {
          mainValue: `${item.xp.toLocaleString()} XP`,
          subLabel: `${item.funTitle}`,
          badgeColor:
            "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/50",
        };
      case "CUMULATIVE_GRADES":
        return {
          mainValue:
            selectedCourseId === "ALL"
              ? `${item.cumulativeEarnedTotal} نقطة سعي`
              : `${item.cumulativeEarnedTotal} / 50`,
          subLabel:
            selectedCourseId === "ALL"
              ? `معدل السعي: ${item.avgCumulativeOutOf50} من 50`
              : `مجموع السعي الفصلي من 50`,
          badgeColor:
            "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/50",
        };
      case "SPECIFIC_ASSESSMENT": {
        const selectedAsm = availableAssessments.find(
          (a) => a.id === selectedAssessmentId
        );
        return {
          mainValue:
            item.specificMax > 0
              ? `${item.specificScore} / ${item.specificMax}`
              : `${item.specificScore}`,
          subLabel: selectedAsm
            ? `${selectedAsm.courseName} • ${selectedAsm.name} (${item.specificPercentage}%)`
            : `نسبة التحصيل: ${item.specificPercentage}% (${item.specificAssessmentsCount} تقييم)`,
          badgeColor:
            "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/50",
        };
      }
      case "MOST_PRESENT":
        return {
          mainValue: `${item.presentCount} حضور`,
          subLabel: `نسبة الالتزام: ${item.attendanceRate}% • غياب: ${item.absentCount}`,
          badgeColor:
            "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/50",
        };
      case "MOST_ABSENT":
        return {
          mainValue: `${item.absentCount} غياب 🚨`,
          subLabel:
            item.absentCount === 0
              ? "سجل نظيف بدون غيابات! 👏"
              : `نسبة الغياب: ${item.absenceRate}% • إجازات: ${item.excusedCount}`,
          badgeColor:
            item.absentCount > 0
              ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800/50"
              : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300",
        };
      case "STUDY_WARRIORS":
        return {
          mainValue: `${item.totalTasksScore} إنجاز`,
          subLabel: `${item.completedAssignments} واجب منجز • ${item.studiedLectures} محاضرة مدروسة`,
          badgeColor:
            "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/50",
        };
    }
  };

  const categories: {
    id: LeaderboardCategory;
    label: string;
    shortDesc: string;
    icon: React.ElementType;
    gradient: string;
  }[] = [
    {
      id: "OVERALL_XP",
      label: "أساطير الدفعة 🔥",
      shortDesc: "الترتيب العام للنقاط (حضور + سعي + واجبات)",
      icon: Trophy,
      gradient: "from-amber-500 to-orange-600",
    },
    {
      id: "CUMULATIVE_GRADES",
      label: "ملوك السعي (من 50) 👑",
      shortDesc: "أعلى الطلاب جمعاً لدرجات السعي التراكمي",
      icon: GraduationCap,
      gradient: "from-indigo-600 to-violet-600",
    },
    {
      id: "SPECIFIC_ASSESSMENT",
      label: "أبطال الامتحانات والكويزات 🎯",
      shortDesc: "أعلى الدرجات في كويز أو امتحان أو تقرير معين",
      icon: Award,
      gradient: "from-purple-600 to-pink-600",
    },
    {
      id: "MOST_PRESENT",
      label: "الأكثر حضوراً والتزاماً ✅",
      shortDesc: "الطلاب الأكثر حضوراً للمحاضرات بدون غياب",
      icon: CalendarCheck,
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      id: "MOST_ABSENT",
      label: "الأكثر غياباً (رادار الغياب 😅)",
      shortDesc: "ترتيب أكثر الطلاب غياباً وإجازات لتجنب الإنذار",
      icon: AlertTriangle,
      gradient: "from-rose-500 to-red-600",
    },
    {
      id: "STUDY_WARRIORS",
      label: "أبطال الواجبات والملازم 📚",
      shortDesc: "الأكثر إنجازاً للواجبات ودراسةً للمحاضرات",
      icon: Flame,
      gradient: "from-sky-500 to-blue-600",
    },
  ];

  const activeCategoryMeta =
    categories.find((c) => c.id === activeCategory) || categories[0];

  return (
    <div className="space-y-6 p-4 pb-24 animate-in fade-in duration-300">
      {/* Hero Banner */}
      <div
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${activeCategoryMeta.gradient} p-6 md:p-8 text-white shadow-xl`}
      >
        <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-12 w-64 h-64 rounded-full bg-black/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-black border border-white/25">
              <Sparkles size={14} />
              <span>ساحة المنافسة ولوحة شرف الدفعة ({effectiveBatchCode})</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2.5">
              <span>{activeCategoryMeta.label}</span>
            </h1>
            <p className="text-white/90 text-xs md:text-sm max-w-xl leading-relaxed">
              {activeCategoryMeta.shortDesc} — نافس زملاءك، اجمع نقاط الالتزام
              والسعيات، وتصدّر قائمة الشرف في دفعتك!
            </p>
          </div>

          {/* Current User Rank Spotlight Card */}
          {myRankItem && (
            <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-4 flex items-center gap-4 shrink-0 shadow-lg">
              <div className="relative">
                <img
                  src={myRankItem.student.avatar}
                  alt={myRankItem.student.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md bg-white"
                />
                <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 font-black text-xs px-2 py-0.5 rounded-full shadow">
                  #{myRankItem.rank}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-white/80 font-bold block">
                  ترتيبك الحالي في هذه الفئة
                </span>
                <p className="text-base font-black text-white">
                  المركز {myRankItem.rank} من {rankedList.length}
                </p>
                <span className="inline-block mt-1 text-xs font-extrabold bg-black/25 px-2.5 py-0.5 rounded-lg text-amber-200">
                  {getCategoryScoreDisplay(myRankItem).mainValue}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Hall of Fame Mini-Cards (أبطال الدفعة باختصار) */}
      {hallOfFame && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. بطل السعي */}
          <div
            onClick={() => setActiveCategory("CUMULATIVE_GRADES")}
            className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-indigo-100 dark:border-slate-700 shadow-sm hover:shadow-md transition cursor-pointer flex items-center gap-3"
          >
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Crown size={22} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block">
                ملك السعي التراكمي 👑
              </span>
              <p className="font-black text-xs sm:text-sm text-gray-800 dark:text-white truncate">
                {hallOfFame.topSaei
                  ? hallOfFame.topSaei.student.name
                  : "لم يُرصد بعد"}
              </p>
              <span className="text-[10px] text-gray-400 block">
                {hallOfFame.topSaei
                  ? `مجموع: ${hallOfFame.topSaei.cumulativeEarnedTotal} درجة`
                  : "بانتظار رصد الدرجات"}
              </span>
            </div>
          </div>

          {/* 2. بطل الحضور */}
          <div
            onClick={() => setActiveCategory("MOST_PRESENT")}
            className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-emerald-100 dark:border-slate-700 shadow-sm hover:shadow-md transition cursor-pointer flex items-center gap-3"
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CalendarCheck size={22} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">
                أكثر الطلاب حضوراً ✅
              </span>
              <p className="font-black text-xs sm:text-sm text-gray-800 dark:text-white truncate">
                {hallOfFame.topAttendance
                  ? hallOfFame.topAttendance.student.name
                  : "لم يُسجل بعد"}
              </p>
              <span className="text-[10px] text-gray-400 block">
                {hallOfFame.topAttendance
                  ? `${hallOfFame.topAttendance.presentCount} محاضرة (${hallOfFame.topAttendance.attendanceRate}%)`
                  : "بانتظار تسجيل الحضور"}
              </span>
            </div>
          </div>

          {/* 3. الأكثر غياباً */}
          <div
            onClick={() => setActiveCategory("MOST_ABSENT")}
            className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-rose-100 dark:border-slate-700 shadow-sm hover:shadow-md transition cursor-pointer flex items-center gap-3"
          >
            <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle size={22} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block">
                متصدر الغيابات 😅
              </span>
              <p className="font-black text-xs sm:text-sm text-gray-800 dark:text-white truncate">
                {hallOfFame.topAbsent
                  ? hallOfFame.topAbsent.student.name
                  : "سجل الدفعة نظيف! 🎉"}
              </p>
              <span className="text-[10px] text-gray-400 block">
                {hallOfFame.topAbsent
                  ? `${hallOfFame.topAbsent.absentCount} غياب (${hallOfFame.topAbsent.absenceRate}%)`
                  : "لا توجد غيابات مسجلة"}
              </span>
            </div>
          </div>

          {/* 4. بطل الدراسة والواجبات */}
          <div
            onClick={() => setActiveCategory("STUDY_WARRIORS")}
            className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-sky-100 dark:border-slate-700 shadow-sm hover:shadow-md transition cursor-pointer flex items-center gap-3"
          >
            <div className="w-11 h-11 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Flame size={22} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 block">
                بطل الواجبات والملازم 🔥
              </span>
              <p className="font-black text-xs sm:text-sm text-gray-800 dark:text-white truncate">
                {hallOfFame.topStudy
                  ? hallOfFame.topStudy.student.name
                  : "بانتظار التفاعل"}
              </p>
              <span className="text-[10px] text-gray-400 block">
                {hallOfFame.topStudy
                  ? `${hallOfFame.topStudy.completedAssignments} واجب • ${hallOfFame.topStudy.studiedLectures} ملزمة`
                  : "ابدأ بإنجاز واجباتك"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Category Tabs Selector */}
      <div className="bg-white dark:bg-slate-800 p-2 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                isActive
                  ? `bg-gradient-to-r ${cat.gradient} text-white shadow-md scale-[1.01]`
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700/60"
              }`}
            >
              <Icon size={16} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filters Bar: Course Filter, Specific Assessment Filter, and Student Search */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          {/* Course Selector */}
          {(activeCategory === "CUMULATIVE_GRADES" ||
            activeCategory === "SPECIFIC_ASSESSMENT" ||
            activeCategory === "MOST_PRESENT" ||
            activeCategory === "MOST_ABSENT") && (
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700/60 border border-gray-200 dark:border-slate-600 rounded-2xl px-3.5 py-2">
              <BookOpen size={15} className="text-primary shrink-0" />
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 shrink-0">
                المادة:
              </span>
              <select
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  setSelectedAssessmentId("ALL");
                }}
                className="bg-transparent text-xs font-black text-gray-800 dark:text-white outline-none cursor-pointer"
              >
                <option value="ALL">جميع المواد الدراسية (شامل)</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Specific Assessment Selector (when in SPECIFIC_ASSESSMENT mode) */}
          {activeCategory === "SPECIFIC_ASSESSMENT" && (
            <div className="flex items-center gap-2 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 rounded-2xl px-3.5 py-2">
              <Target size={15} className="text-purple-600 shrink-0" />
              <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 shrink-0">
                الامتحان / التقييم:
              </span>
              <select
                value={selectedAssessmentId}
                onChange={(e) => setSelectedAssessmentId(e.target.value)}
                className="bg-transparent text-xs font-black text-purple-900 dark:text-purple-200 outline-none cursor-pointer max-w-[220px]"
              >
                <option value="ALL">مجموع كل الامتحانات والتقييمات</option>
                {availableAssessments.map((asm) => (
                  <option key={`${asm.courseId}_${asm.id}`} value={asm.id}>
                    {selectedCourseId === "ALL" ? `[${asm.courseName}] ` : ""}
                    {asm.name} (من {asm.maxScore})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="relative sm:w-64">
          <Search
            size={15}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن اسم طالب ومرتبته..."
            className="w-full bg-gray-50 dark:bg-slate-700/60 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl pr-9 pl-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Top 3 Olympic Podium (منصة التتويج للمراكز الثلاثة الأولى) */}
      {!searchQuery.trim() && topThree.length >= 1 && (
        <div className="bg-gradient-to-b from-white to-gray-50/80 dark:from-slate-800 dark:to-slate-800/60 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="text-center mb-6">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800/50">
              {activeCategory === "MOST_ABSENT"
                ? "🚨 المراكز الثلاثة الأكثر غياباً في الدفعة 🚨"
                : "🏆 منصة التتويج للمراكز الثلاثة الأولى 🏆"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end max-w-3xl mx-auto">
            {/* 2nd Place (Silver) */}
            {topThree[1] && (
              <div
                onClick={() => onViewProfile?.(topThree[1].student.uid)}
                className="order-2 md:order-1 bg-gradient-to-b from-slate-50 to-slate-100/90 dark:from-slate-700/60 dark:to-slate-800 rounded-3xl p-5 border-2 border-slate-300 dark:border-slate-600 text-center relative shadow-md hover:-translate-y-1 transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-slate-400 text-white font-black text-sm flex items-center justify-center mx-auto -mt-8 mb-2 shadow-md border-2 border-white dark:border-slate-800">
                  2
                </div>
                <img
                  src={topThree[1].student.avatar}
                  alt={topThree[1].student.name}
                  className="w-16 h-16 rounded-full object-cover mx-auto border-4 border-slate-300 dark:border-slate-500 shadow-sm bg-white"
                />
                <h3 className="font-black text-sm text-gray-800 dark:text-white mt-2.5 truncate">
                  {topThree[1].student.name}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                  {getCategoryScoreDisplay(topThree[1]).subLabel}
                </p>
                <div className="mt-3 inline-block px-3.5 py-1 rounded-xl bg-slate-200/80 dark:bg-slate-600 text-slate-800 dark:text-slate-100 font-black text-xs">
                  🥈 {getCategoryScoreDisplay(topThree[1]).mainValue}
                </div>
              </div>
            )}

            {/* 1st Place (Gold Champion) */}
            {topThree[0] && (
              <div
                onClick={() => onViewProfile?.(topThree[0].student.uid)}
                className={`order-1 md:order-2 rounded-3xl p-6 border-2 text-center relative shadow-xl hover:-translate-y-1.5 transition cursor-pointer md:-mt-4 ${
                  activeCategory === "MOST_ABSENT"
                    ? "bg-gradient-to-b from-rose-50 via-red-50/70 to-white dark:from-rose-950/50 dark:to-slate-800 border-rose-400 dark:border-rose-600"
                    : "bg-gradient-to-b from-amber-50 via-yellow-50/60 to-white dark:from-amber-950/40 dark:to-slate-800 border-amber-400 dark:border-amber-500"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full text-white font-black text-base flex items-center justify-center mx-auto -mt-10 mb-2 shadow-lg border-2 border-white dark:border-slate-800 ${
                    activeCategory === "MOST_ABSENT"
                      ? "bg-rose-600"
                      : "bg-gradient-to-r from-amber-500 to-orange-500"
                  }`}
                >
                  {activeCategory === "MOST_ABSENT" ? "⚠️" : "👑"}
                </div>
                <img
                  src={topThree[0].student.avatar}
                  alt={topThree[0].student.name}
                  className={`w-20 h-20 rounded-full object-cover mx-auto border-4 shadow-md bg-white ${
                    activeCategory === "MOST_ABSENT"
                      ? "border-rose-400"
                      : "border-amber-400"
                  }`}
                />
                <span
                  className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                    activeCategory === "MOST_ABSENT"
                      ? "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200"
                  }`}
                >
                  {activeCategory === "MOST_ABSENT"
                    ? "المركز الأول بالغياب 😅"
                    : "المركز الأول على الدفعة 🥇"}
                </span>
                <h3 className="font-black text-base text-gray-900 dark:text-white mt-1 truncate">
                  {topThree[0].student.name}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                  {getCategoryScoreDisplay(topThree[0]).subLabel}
                </p>
                <div
                  className={`mt-3 inline-block px-4 py-1.5 rounded-xl text-white font-black text-sm shadow-md ${
                    activeCategory === "MOST_ABSENT"
                      ? "bg-rose-600 shadow-rose-500/20"
                      : "bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/20"
                  }`}
                >
                  {getCategoryScoreDisplay(topThree[0]).mainValue}
                </div>
              </div>
            )}

            {/* 3rd Place (Bronze) */}
            {topThree[2] && (
              <div
                onClick={() => onViewProfile?.(topThree[2].student.uid)}
                className="order-3 bg-gradient-to-b from-orange-50/60 to-amber-50/40 dark:from-amber-950/20 dark:to-slate-800 rounded-3xl p-5 border-2 border-amber-600/40 dark:border-amber-700/50 text-center relative shadow-md hover:-translate-y-1 transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-amber-700 text-white font-black text-sm flex items-center justify-center mx-auto -mt-8 mb-2 shadow-md border-2 border-white dark:border-slate-800">
                  3
                </div>
                <img
                  src={topThree[2].student.avatar}
                  alt={topThree[2].student.name}
                  className="w-16 h-16 rounded-full object-cover mx-auto border-4 border-amber-600/40 shadow-sm bg-white"
                />
                <h3 className="font-black text-sm text-gray-800 dark:text-white mt-2.5 truncate">
                  {topThree[2].student.name}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                  {getCategoryScoreDisplay(topThree[2]).subLabel}
                </p>
                <div className="mt-3 inline-block px-3.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 font-black text-xs">
                  🥉 {getCategoryScoreDisplay(topThree[2]).mainValue}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Ranked Student List */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-700/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-primary" />
            <h3 className="font-black text-sm text-gray-800 dark:text-white">
              جدول الترتيب الكامل لطلاب الدفعة ({displayedRankedList.length})
            </h3>
          </div>
          <span className="text-[11px] font-bold text-gray-400">
            يُحدث تلقائياً بالوقت الفعلي ⚡
          </span>
        </div>

        <div className="divide-y divide-gray-50 dark:divide-slate-700/70">
          {displayedRankedList.map((item) => {
            const isMe = currentUser?.uid === item.student.uid;
            const displayInfo = getCategoryScoreDisplay(item);

            let rankBadgeStyle =
              "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300";
            if (item.rank === 1) {
              rankBadgeStyle =
                activeCategory === "MOST_ABSENT"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm";
            } else if (item.rank === 2) {
              rankBadgeStyle = "bg-slate-400 text-white shadow-sm";
            } else if (item.rank === 3) {
              rankBadgeStyle = "bg-amber-700 text-white shadow-sm";
            }

            return (
              <div
                key={item.student.uid}
                onClick={() => onViewProfile?.(item.student.uid)}
                className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition cursor-pointer ${
                  isMe
                    ? "bg-primary/5 dark:bg-primary/10 border-r-4 border-r-primary"
                    : "hover:bg-gray-50 dark:hover:bg-slate-700/40"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Rank Number */}
                  <div
                    className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${rankBadgeStyle}`}
                  >
                    {item.rank === 1
                      ? activeCategory === "MOST_ABSENT"
                        ? "1🚨"
                        : "1👑"
                      : item.rank}
                  </div>

                  {/* Avatar */}
                  <img
                    src={item.student.avatar}
                    alt={item.student.name}
                    className="w-11 h-11 rounded-2xl object-cover border border-gray-200 dark:border-slate-600 shrink-0 bg-white"
                  />

                  {/* Name & Sub-metrics */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm text-gray-800 dark:text-white truncate">
                        {item.student.name}
                      </p>
                      {isMe && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-primary text-white">
                          أنت ✨
                        </span>
                      )}
                      {item.rank <= 3 && activeCategory !== "MOST_ABSENT" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          {item.funTitle}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                      {displayInfo.subLabel}
                    </p>
                  </div>
                </div>

                {/* Right Side: Mini Stats Pills + Main Score Badge */}
                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                  {/* Quick breakdown pills */}
                  <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-400">
                    <span className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-slate-700/70">
                      حضور: {item.presentCount}
                    </span>
                    <span className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-slate-700/70">
                      غياب: {item.absentCount}
                    </span>
                    <span className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-slate-700/70">
                      سعي: {item.cumulativeEarnedTotal}
                    </span>
                  </div>

                  {/* Primary Score Pill */}
                  <div
                    className={`px-3.5 py-1.5 rounded-xl border text-xs font-black ${displayInfo.badgeColor}`}
                  >
                    {displayInfo.mainValue}
                  </div>
                </div>
              </div>
            );
          })}

          {displayedRankedList.length === 0 && (
            <div className="p-12 text-center text-gray-400 text-xs">
              لا يوجد طلاب مطابقون للبحث الحالي.
            </div>
          )}
        </div>
      </div>

      {/* Points Calculation Guide Footer */}
      <div className="bg-amber-50/70 dark:bg-slate-800/80 border border-amber-200/70 dark:border-slate-700 rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
        <div className="flex items-center gap-2.5">
          <Zap size={18} className="text-amber-500 shrink-0" />
          <div>
            <span className="font-black">كيف تُحسب نقاط الحماس (XP) في أساطير الدفعة؟ </span>
            <span className="text-amber-800/90 dark:text-amber-300/80">
              كل محاضرة حضور (+15 XP) • كل درجة في السعي (+10 XP) • كل واجب منجز (+25 XP) • كل محاضرة مدروسة (+15 XP) • الغياب بدون عذر (-10 XP).
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
