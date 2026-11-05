import React, { useState, useRef } from "react";
import {
  User as UserIcon,
  Crown,
  Award,
  ShieldCheck,
  Mail,
  Palette,
  Moon,
  Sun,
  Trash2,
  Key,
  LogOut,
  ArrowRight,
  Edit3,
  Camera,
  Image as ImageIcon,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Users,
  Layers,
  UserPlus,
} from "lucide-react";
import {
  User,
  UserRole,
  Tab,
  ThemeColor,
  Batch,
  AttendanceSession,
  AttendanceRecord,
  Assignment,
  Material,
  JoinRequest,
  ASSISTANT_DUTIES_CONFIG,
} from "../types";
import { ThemeSelector } from "../components/ThemeSelector";
import { NotificationPreferencesCard } from "../components/NotificationPreferencesCard";
import { compressImage } from "../services/imageCompressor";

export interface ProfileViewProps {
  currentUser: User | null;
  viewingUserProfile: User | null;
  previousTabBeforeProfile: Tab | null;
  batches: Batch[];
  effectiveBatchCode: string;
  attendanceSessions: AttendanceSession[];
  attendanceRecords: AttendanceRecord[];
  assignments: Assignment[];
  materials: Material[];
  joinRequests: JoinRequest[];
  isOwner: boolean;
  isManager: boolean;
  isMainAdmin: boolean;
  theme: ThemeColor;
  isDarkMode: boolean;
  onSetTheme: (theme: ThemeColor) => void;
  onToggleDarkMode: (dark: boolean) => void;
  onBackFromProfile: () => void;
  onNavigateTab: (tab: Tab) => void;
  onViewOwnProfile: () => void;
  onOpenAttendanceReport: (student: User) => void;
  onOpenRepManager: () => void;
  onOpenRedeemRepCode: () => void;
  onOpenDutyModal: (student: User) => void;
  onOpenChangeEmailModal: (student: User) => void;
  onSaveProfile: (updatedData: {
    name: string;
    username: string;
    bio: string;
    banner: string;
    avatar: string;
    signatureColor: string;
  }) => Promise<void>;
  onResetDatabase: () => Promise<void>;
  onLeaveBatch: () => Promise<void>;
  onToggleAssistantRep: (student: User) => Promise<void>;
  onUpdateCurrentUser: (user: User) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  viewingUserProfile,
  previousTabBeforeProfile,
  batches,
  effectiveBatchCode,
  attendanceSessions,
  attendanceRecords,
  assignments,
  materials,
  joinRequests,
  isOwner,
  isManager,
  isMainAdmin,
  theme,
  isDarkMode,
  onSetTheme,
  onToggleDarkMode,
  onBackFromProfile,
  onNavigateTab,
  onViewOwnProfile,
  onOpenAttendanceReport,
  onOpenRepManager,
  onOpenRedeemRepCode,
  onOpenDutyModal,
  onOpenChangeEmailModal,
  onSaveProfile,
  onResetDatabase,
  onLeaveBatch,
  onToggleAssistantRep,
  onUpdateCurrentUser,
}) => {
  const userToDisplay = viewingUserProfile || currentUser;
  const isOwnProfile = currentUser?.uid === userToDisplay?.uid;

  // Edit Mode UI State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || "");
  const [editUsername, setEditUsername] = useState(currentUser?.username || "");
  const [editBio, setEditBio] = useState(currentUser?.bio || "");
  const [editBanner, setEditBanner] = useState(currentUser?.banner || "");
  const [editAvatar, setEditAvatar] = useState(currentUser?.avatar || "");
  const [editColor, setEditColor] = useState(currentUser?.signatureColor || "#64748b");
  const [isUploading, setIsUploading] = useState(false);
  const [isResettingDb, setIsResettingDb] = useState(false);

  const fileInputRefAvatar = useRef<HTMLInputElement>(null);
  const fileInputRefBanner = useRef<HTMLInputElement>(null);

  if (!userToDisplay) return null;

  // Digital Student Card Metrics
  const userBatch = batches.find(
    (b) => b.code === (userToDisplay.batchCode || effectiveBatchCode)
  );

  const userRelevantSessions = attendanceSessions.filter((s) => {
    const hasStudentRecord = attendanceRecords.some(
      (r) => r.sessionId === s.id && r.studentId === userToDisplay.uid
    );
    if (hasStudentRecord) return true;
    if (s.targetGroup && s.targetGroup !== "ALL") {
      return userToDisplay.academicGroup === s.targetGroup;
    }
    return true;
  });

  const userRelevantSessionIds = new Set(userRelevantSessions.map((s) => s.id));
  const userRecordsInRelevantSessions = attendanceRecords.filter(
    (r) => r.studentId === userToDisplay.uid && userRelevantSessionIds.has(r.sessionId)
  );
  const totalStudentSessions = userRelevantSessions.length;
  const userPresentCount = userRecordsInRelevantSessions.filter(
    (r) => r.status === "PRESENT"
  ).length;
  const userAbsentCount = userRecordsInRelevantSessions.filter(
    (r) => r.status === "ABSENT"
  ).length;
  const userExcusedCount = userRecordsInRelevantSessions.filter(
    (r) => r.status === "EXCUSED"
  ).length;
  const overallAttendancePct =
    totalStudentSessions > 0
      ? Math.round(((userPresentCount + userExcusedCount) / totalStudentSessions) * 100)
      : 100;

  const totalBatchAssignments = assignments.length;
  const completedAssignmentsCount = assignments.filter((a) =>
    a.completedBy?.includes(userToDisplay.uid)
  ).length;
  const studiedLecturesCount = (userToDisplay.studiedMaterialIds || []).filter((id) =>
    materials.some((m) => m.id === id)
  ).length;

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "avatar" | "banner"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const compressed = await compressImage(file, {
        maxWidth: type === "banner" ? 1400 : 400,
        quality: 0.8,
      });
      if (type === "avatar") setEditAvatar(compressed);
      else setEditBanner(compressed);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsUploading(true);
    try {
      await onSaveProfile({
        name: editName.trim(),
        username: editUsername.trim(),
        bio: editBio.trim(),
        banner: editBanner,
        avatar: editAvatar,
        signatureColor: editColor,
      });
      setIsEditingProfile(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = async () => {
    setIsResettingDb(true);
    try {
      await onResetDatabase();
    } finally {
      setIsResettingDb(false);
    }
  };

  if (isEditingProfile && isOwnProfile) {
    return (
      <div className="space-y-6 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="relative h-48 bg-gray-200 dark:bg-slate-700">
            {editBanner ? (
              <img
                src={editBanner}
                className="w-full h-full object-cover"
                alt="Banner"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <ImageIcon size={48} />
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRefBanner.current?.click()}
              className="absolute bottom-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition cursor-pointer"
            >
              <Camera size={20} />
            </button>
            <input
              type="file"
              ref={fileInputRefBanner}
              hidden
              accept="image/*"
              onChange={(e) => handleFileUpload(e, "banner")}
            />
          </div>

          <div className="px-6 pb-6">
            <div className="relative -mt-16 mb-4 flex justify-between items-end">
              <div className="relative">
                <img
                  src={editAvatar}
                  className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-800 object-cover bg-white"
                  alt="Avatar"
                />
                <button
                  type="button"
                  onClick={() => fileInputRefAvatar.current?.click()}
                  className="absolute bottom-2 right-2 bg-primary text-white p-2 rounded-full hover:bg-primary/90 transition shadow-lg cursor-pointer"
                >
                  <Camera size={16} />
                </button>
                <input
                  type="file"
                  ref={fileInputRefAvatar}
                  hidden
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, "avatar")}
                />
              </div>
            </div>

            <div className="space-y-4 max-w-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                    الاسم الكامل
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                    اسم المستخدم (@username)
                  </label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                  النبذة التعريفية (Bio)
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                  لون التوقيع / التمييز
                </label>
                <input
                  type="color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="w-16 h-10 rounded-xl border border-gray-200 dark:border-slate-600 cursor-pointer"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-6 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isUploading || !editName.trim()}
                  className="px-6 py-2 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isUploading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  حفظ التغييرات
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Navigation / Back Button Strip */}
      {viewingUserProfile ? (
        <div className="bg-white dark:bg-slate-800 p-3.5 px-5 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <button
            type="button"
            onClick={onBackFromProfile}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary dark:text-blue-400 font-black text-xs sm:text-sm transition active:scale-95 shadow-xs self-start sm:self-auto cursor-pointer"
          >
            <ArrowRight size={18} className="rtl:rotate-0 ltr:rotate-180" />
            <span>
              الرجوع إلى {previousTabBeforeProfile ? `(${previousTabBeforeProfile})` : "السابق"}
            </span>
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-bold">
              أنت تستعرض ملف الطالب:
            </span>
            <span className="text-xs font-black text-gray-800 dark:text-white bg-gray-100 dark:bg-slate-700 px-3 py-1 rounded-xl">
              {userToDisplay.name}
            </span>
            <button
              type="button"
              onClick={onViewOwnProfile}
              className="text-xs font-bold text-primary hover:underline transition mr-2 cursor-pointer"
            >
              الذهاب لحسابي الشخصي 👤
            </button>
          </div>
        </div>
      ) : (
        previousTabBeforeProfile &&
        previousTabBeforeProfile !== Tab.PROFILE && (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => onNavigateTab(previousTabBeforeProfile)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-primary transition bg-white dark:bg-slate-800 px-3.5 py-1.5 rounded-xl border border-gray-100 dark:border-slate-700 shadow-xs cursor-pointer"
            >
              <ArrowRight size={14} className="rtl:rotate-0 ltr:rotate-180" />
              <span>العودة إلى ({previousTabBeforeProfile})</span>
            </button>
          </div>
        )
      )}

      {/* Profile Header */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden relative group">
        <div className="h-48 bg-gradient-to-r from-blue-400 to-indigo-500 relative">
          {userToDisplay.banner && (
            <img
              src={userToDisplay.banner}
              className="w-full h-full object-cover absolute inset-0"
              alt="Banner"
            />
          )}
          {isOwnProfile && (
            <button
              type="button"
              onClick={() => {
                setEditName(currentUser?.name || "");
                setEditUsername(currentUser?.username || "");
                setEditBio(currentUser?.bio || "");
                setEditBanner(currentUser?.banner || "");
                setEditAvatar(currentUser?.avatar || "");
                setEditColor(currentUser?.signatureColor || "#64748b");
                setIsEditingProfile(true);
              }}
              className="absolute top-4 left-4 bg-white/20 backdrop-blur-md text-white p-2 rounded-xl hover:bg-white/30 transition shadow-sm border border-white/30 cursor-pointer"
            >
              <Edit3 size={20} />
            </button>
          )}
        </div>

        <div className="px-6 pb-6">
          <div className="relative -mt-16 mb-4 flex justify-between items-end">
            <img
              src={userToDisplay.avatar}
              className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-800 object-cover bg-white shadow-md"
              alt="Avatar"
            />
            {userToDisplay.signatureColor && (
              <div
                className="mb-2 px-3 py-1 rounded-full text-[10px] font-bold text-white shadow-sm"
                style={{ backgroundColor: userToDisplay.signatureColor }}
              >
                {userToDisplay.role === UserRole.OWNER
                  ? "المطور 💻"
                  : userToDisplay.role === UserRole.REPRESENTATIVE
                  ? "ممثل الدفعة 👑"
                  : userToDisplay.role === UserRole.ASSISTANT_REP
                  ? "ممثل معاون 🎖️"
                  : "طالب"}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2 flex-wrap">
              {userToDisplay.name}
              {userToDisplay.role === UserRole.OWNER && (
                <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  المطور 💻
                </span>
              )}
              {userToDisplay.role === UserRole.REPRESENTATIVE && (
                <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Crown size={13} />
                  <span>ممثل الدفعة 👑</span>
                </span>
              )}
              {userToDisplay.role === UserRole.ASSISTANT_REP && (
                <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm">
                  <Award size={13} />
                  <span>ممثل معاون 🎖️</span>
                </span>
              )}
              {userToDisplay.assistantDuties &&
                userToDisplay.assistantDuties.map((dutyKey) => {
                  const dutyConf = ASSISTANT_DUTIES_CONFIG[dutyKey];
                  if (!dutyConf) return null;
                  return (
                    <span
                      key={dutyKey}
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold border flex items-center gap-1 ${dutyConf.color} ${dutyConf.bgLight}`}
                      title={dutyConf.description}
                    >
                      <span>{dutyConf.badge}</span>
                    </span>
                  );
                })}
            </h2>
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:justify-between mt-1">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                @{userToDisplay.username || "user"}
              </p>
              {isMainAdmin &&
                !isOwnProfile &&
                userToDisplay.role !== UserRole.REPRESENTATIVE &&
                !userToDisplay.isOfficial && (
                  <button
                    type="button"
                    onClick={() => onOpenDutyModal(userToDisplay)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 px-3.5 py-1.5 rounded-xl hover:bg-purple-100 transition active:scale-95 cursor-pointer"
                  >
                    <ShieldCheck size={14} />
                    <span>إسناد وتعديل رتب الطالب 🎖️</span>
                  </button>
                )}
            </div>
            {userToDisplay.bio && (
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-3 bg-gray-50 dark:bg-slate-700/50 p-3 rounded-2xl">
                {userToDisplay.bio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Digital Student Card */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-5">
          <div className="flex justify-between items-center border-b border-white/15 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center font-bold text-blue-200">
                🎓
              </div>
              <div>
                <span className="text-[10px] text-blue-200 block uppercase tracking-wider font-bold">
                  البطاقة الأكاديمية الرقمية
                </span>
                <h3 className="text-base font-black text-white">
                  {userBatch?.name || "منصة دفعتي الأكاديمية"}
                </h3>
              </div>
            </div>
            <div className="text-left">
              <span className="text-[10px] text-blue-300 block">كود الدفعة</span>
              <span className="font-mono text-sm font-black bg-white/15 px-3 py-1 rounded-xl border border-white/20 inline-block mt-0.5">
                {userToDisplay.batchCode || effectiveBatchCode || "GENERAL"}
              </span>
            </div>
          </div>

          {/* Student Identity Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src={userToDisplay.avatar}
                alt={userToDisplay.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-400/50 shadow-md bg-white"
              />
              <div>
                <h4 className="text-lg font-black text-white">{userToDisplay.name}</h4>
                <p className="text-xs text-blue-200/80">
                  {userBatch?.department ? `${userBatch.department} • ` : ""}
                  {userBatch?.stage ||
                    (userToDisplay.role === UserRole.REPRESENTATIVE
                      ? "ممثل الدفعة الرسمي"
                      : userToDisplay.role === UserRole.ASSISTANT_REP
                      ? "ممثل الدفعة المعاون"
                      : "طالب منتظم")}
                </p>
                <span className="inline-block mt-1 text-[10px] font-mono text-blue-300/90 bg-blue-900/50 px-2 py-0.5 rounded-md border border-blue-700/50">
                  ID: #{userToDisplay.uid.slice(-6).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Stats Grid inside ID Card */}
            <div className="grid grid-cols-3 gap-2.5 sm:min-w-[290px]">
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center">
                <span className="text-[10px] text-blue-200 block mb-0.5">نسبة الحضور</span>
                <span
                  className={`text-base font-black ${
                    overallAttendancePct >= 75 ? "text-emerald-300" : "text-rose-300"
                  }`}
                >
                  {overallAttendancePct}%
                </span>
                <span className="text-[9px] text-blue-200/80 block mt-0.5 font-bold">
                  ({userPresentCount + userExcusedCount} من {totalStudentSessions} محاضرة)
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center">
                <span className="text-[10px] text-blue-200 block mb-0.5">الواجبات المنجزة</span>
                <span className="text-base font-black text-amber-300">
                  {completedAssignmentsCount}/{totalBatchAssignments}
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center">
                <span className="text-[10px] text-blue-200 block mb-0.5">المحاضرات المدروسة</span>
                <span className="text-base font-black text-sky-300">
                  {studiedLecturesCount}/{materials.length}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Attendance Breakdown */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-white/5 border border-white/10 rounded-2xl p-2.5 px-4 text-xs font-bold">
            <div className="flex items-center gap-3 text-[11px] flex-wrap">
              <span className="text-emerald-300 flex items-center gap-1">
                <CheckCircle2 size={13} />
                <span>حضور: {userPresentCount}</span>
              </span>
              <span className="text-white/20">•</span>
              <span className="text-rose-300 flex items-center gap-1">
                <AlertCircle size={13} />
                <span>غياب: {userAbsentCount}</span>
              </span>
              <span className="text-white/20">•</span>
              <span className="text-amber-300 flex items-center gap-1">
                <Clock size={13} />
                <span>إجازة / عذر: {userExcusedCount}</span>
              </span>
              <span className="text-white/20">•</span>
              <span className="text-blue-200">
                المقرر: {totalStudentSessions} محاضرة
              </span>
            </div>
            <span className="text-[10px] text-blue-300/90 font-mono">
              مطابق للتقرير الفصلي 100% 📄
            </span>
          </div>

          {/* Download Attendance PDF Report Button */}
          <div className="pt-3 border-t border-white/10 flex justify-end">
            <button
              type="button"
              onClick={() => onOpenAttendanceReport(userToDisplay)}
              className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold border border-white/20 transition flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <Download size={14} className="text-blue-200" />
              <span>تقرير الحضور والغياب (PDF شهري / فصلي) 📄</span>
            </button>
          </div>
        </div>
      </div>

      {/* Account Email Switcher */}
      {isOwnProfile && currentUser && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-indigo-100 dark:border-slate-700 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200/60 dark:border-indigo-800/50 shadow-xs">
                <Mail size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-gray-800 dark:text-white text-base">
                    البريد الإلكتروني وحساب الطالب (تبديل الحساب 🔄)
                  </h3>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <CheckCircle2 size={11} />
                    <span>بياناتك وسجلاتك مستمرة 100%</span>
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  إذا سجلت بحساب بريد مختلف أو ترغب بتغيير إيميلك المسجل، يمكنك تبديله هنا وستبقى جميع سعياتك، درجاتك، حضورك، وملخصاتك محفوظة بالكامل دون أي فقدان.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChangeEmailModal(currentUser)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/20 flex items-center gap-2 self-start sm:self-auto shrink-0 active:scale-95 cursor-pointer"
            >
              <Mail size={15} />
              <span>تبديل البريد الإلكتروني</span>
            </button>
          </div>
          <div className="bg-gray-50 dark:bg-slate-700/40 rounded-2xl p-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-400 font-bold">الإيميل المسجل حالياً:</span>
              <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                {currentUser.email || "لم يتم تسجيل بريد إلكتروني"}
              </span>
            </div>
            <span className="text-[11px] text-gray-400">
              المعرّف الأكاديمي الثابت (UID):{" "}
              <span className="font-mono text-gray-500 dark:text-gray-400">
                #{currentUser.uid.slice(-8)}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Representative Hub Shortcuts */}
      {isOwnProfile && isManager && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-purple-100 dark:border-slate-700 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 dark:text-white text-base flex items-center gap-2">
                  أدوات إدارة الدفعة والطلاب 👑
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  وصول مباشر لإدارة الطلاب، المواد الدراسية، وطلبات الانضمام
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {(currentUser?.role === UserRole.REPRESENTATIVE || currentUser?.role === UserRole.OWNER) && (
              <button
                type="button"
                onClick={() => onNavigateTab(Tab.STUDENTS)}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/40 text-purple-900 dark:text-purple-200 hover:bg-purple-100/70 transition text-right group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Users size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-black block">إدارة الطلاب</span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 block truncate">
                    الأسماء، الألقاب، والحسابات
                  </span>
                </div>
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigateTab(Tab.COURSES)}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40 text-indigo-900 dark:text-indigo-200 hover:bg-indigo-100/70 transition text-right group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Layers size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-black block">المواد الدراسية</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 block truncate">
                  الكورسات وتقسيم الدرجات
                </span>
              </div>
            </button>
            {(currentUser?.role === UserRole.REPRESENTATIVE || currentUser?.role === UserRole.OWNER) && (
              <button
                type="button"
                onClick={() => onNavigateTab(Tab.REQUESTS)}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100/70 transition text-right group cursor-pointer relative"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform relative">
                  <UserPlus size={18} />
                  {joinRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 animate-ping" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black block">طلبات الانضمام</span>
                    {joinRequests.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-red-500 text-white">
                        {joinRequests.length}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 block truncate">
                    موافقة الطلاب الجدد
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Theme Selector */}
      {isOwnProfile && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Palette className="text-primary" size={20} />
            تخصيص المظهر
          </h3>
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500 dark:text-gray-400">
                لون التطبيق الأساسي
              </label>
              <ThemeSelector currentTheme={theme} onChange={onSetTheme} />
            </div>
            <div className="h-8 w-px bg-gray-100 dark:bg-slate-700 hidden md:block"></div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500 dark:text-gray-400">
                الوضع الليلي
              </label>
              <button
                type="button"
                onClick={() => onToggleDarkMode(!isDarkMode)}
                className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition cursor-pointer ${
                  isDarkMode
                    ? "bg-slate-700 border-slate-600 text-white"
                    : "bg-gray-50 border-gray-200 text-gray-600"
                }`}
              >
                {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
                <span className="text-sm font-bold">
                  {isDarkMode ? "مفعل" : "معطل"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Preferences */}
      {isOwnProfile && currentUser && (
        <NotificationPreferencesCard
          currentUser={currentUser}
          onUpdateUser={onUpdateCurrentUser}
        />
      )}

      {/* Representative Management Card (Owner) */}
      {isOwnProfile && isOwner && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
                <Crown size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 dark:text-white text-base flex items-center gap-2">
                  إدارة وتعيين ممثلي الدفعات وتوليد الأكواد
                  <span className="text-[10px] bg-gradient-to-r from-amber-400 to-orange-400 text-slate-900 px-2.5 py-0.5 rounded-full font-extrabold shadow-sm">
                    لوحة المطور 👑
                  </span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  توليد أكواد تفعيل جديدة، تعيين الممثلين، ونقل الممثلية بين الطلاب فورياً مع الإشعارات.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenRepManager}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold transition shadow-md shadow-orange-500/20 flex items-center gap-2 self-start sm:self-auto shrink-0 active:scale-95 cursor-pointer"
            >
              <Crown size={16} />
              <span>إدارة الممثلين والأكواد</span>
            </button>
          </div>
        </div>
      )}

      {/* Reset System for Production (Owner) */}
      {isOwnProfile && isOwner && (
        <div className="bg-red-50/60 dark:bg-red-950/20 rounded-3xl shadow-sm border border-red-200 dark:border-red-900/40 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-500/20">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="font-bold text-red-900 dark:text-red-200 text-base flex items-center gap-2">
                  تصفير وتنظيف النظام بالكامل للنشر
                  <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300 px-2.5 py-0.5 rounded-full font-bold">
                    جاهز للإطلاق 🚀
                  </span>
                </h3>
                <p className="text-xs text-red-700/80 dark:text-red-300/80 mt-0.5">
                  مسح جميع البيانات الوهمية والتجريبية (الدفعات القديمة، الرسائل، الملازم، الطلاب التجريبيين) والإبقاء على حسابك المالك فقط لبدء نشر التطبيق نظيفاً.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              disabled={isResettingDb}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-red-600/20 flex items-center gap-2 self-start sm:self-auto shrink-0 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isResettingDb ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              <span>تصفير النظام الآن</span>
            </button>
          </div>
        </div>
      )}

      {/* Redeem Representative Code (Students) */}
      {isOwnProfile && currentUser?.role === UserRole.STUDENT && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-amber-200/80 dark:border-slate-700 p-6 space-y-3 bg-gradient-to-br from-amber-50/40 to-orange-50/20 dark:from-slate-800 dark:to-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-900/40">
                <Key size={22} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 dark:text-white text-base flex items-center gap-2">
                  هل حصلت على كود ممثل من المطور؟
                  <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 px-2 py-0.5 rounded-full font-bold">
                    ترقية الحساب
                  </span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  أدخل كود التفعيل الممنوح لك لتصبح ممثلاً رسمياً لدفعتك وتحصل على صلاحيات الإدارة فوراً.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenRedeemRepCode}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-md shadow-amber-500/20 flex items-center gap-2 self-start sm:self-auto shrink-0 active:scale-95 cursor-pointer"
            >
              <Key size={15} />
              <span>إدخال كود الممثل</span>
            </button>
          </div>
        </div>
      )}

      {/* Leave Batch Option */}
      {isOwnProfile && currentUser?.role === UserRole.STUDENT && currentUser.batchCode && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/40">
                <LogOut size={22} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 dark:text-white text-base flex items-center gap-2">
                  مغادرة الدفعة الحالية ({userToDisplay.batchCode})
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  إذا رغبت بالانتقال إلى دفعة أخرى أو كتابة كود دفعة جديد، يمكنك مغادرة الدفعة وتقديم طلب انضمام جديد لممثل الدفعة.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onLeaveBatch}
              className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs font-bold transition flex items-center gap-2 self-start sm:self-auto shrink-0 active:scale-95 cursor-pointer"
            >
              <LogOut size={15} />
              <span>مغادرة الدفعة وتغيير الكود</span>
            </button>
          </div>
        </div>
      )}

      {/* Assistant Representative Action (When admin views another student) */}
      {!isOwnProfile &&
        isMainAdmin &&
        userToDisplay.role !== UserRole.OWNER &&
        userToDisplay.role !== UserRole.REPRESENTATIVE && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-blue-100 dark:border-slate-700 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-sm">
                  <Award size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white text-base flex items-center gap-2">
                    إدارة صلاحيات الممثل المعاون (Sub-Representative)
                    {userToDisplay.role === UserRole.ASSISTANT_REP && (
                      <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 px-2 py-0.5 rounded-full font-bold">
                        معاون نشط 🎖️
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {userToDisplay.role === UserRole.ASSISTANT_REP
                      ? "هذا الطالب معيّن حالياً كممثل معاون، ويملك صلاحيات كاملة لرفع المحاضرات والملازم وإدارة الواجبات والمشاريع."
                      : "يمكنك ترقية هذا الطالب ليصبح ممثلاً معاوناً لمساعدتك في رفع المحاضرات والواجبات وإدارة الدفعة."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onToggleAssistantRep(userToDisplay)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-md flex items-center gap-2 self-start sm:self-auto shrink-0 active:scale-95 cursor-pointer ${
                  userToDisplay.role === UserRole.ASSISTANT_REP
                    ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20"
                }`}
              >
                <Award size={16} />
                <span>
                  {userToDisplay.role === UserRole.ASSISTANT_REP
                    ? "إعفاء من منصب ممثل معاون"
                    : "تعيين كممثل معاون للدفعة 🎖️"}
                </span>
              </button>
            </div>
          </div>
        )}
    </div>
  );
};
