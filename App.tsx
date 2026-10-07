import React, { useState, useEffect, useRef } from "react";
import Layout from "./components/Layout";
import { StudentAttendanceReportModal } from "./components/StudentAttendanceReportModal";
import { BatchLeaderboard } from "./components/BatchLeaderboard";
import { StudentSummariesHub } from "./components/StudentSummariesHub";
import { BatchSuggestionsBox } from "./components/BatchSuggestionsBox";
import { FinalExamGradeCalculator } from "./components/FinalExamGradeCalculator";
import {
  User,
  UserRole,
  Tab,
  Announcement,
  Course,
  Grade,
  AttendanceSession,
  AttendanceRecord,
  Material,
  ChatMessage,
  ThemeColor,
  AssessmentStructure,
  MaterialSection,
  Notification,
  Batch,
  LectureSchedule,
  JoinRequest,
  ProjectGroup,
  CourseProject,
  ProjectGroupItem,
  ProjectFileItem,
  Assignment,
  AssignmentAttachment,
  RepresentativeCode,
  Exam,
  StudentSummary,
  BatchSuggestion,
} from "./types";
import {
  Send,
  Plus,
  Download,
  Trash2,
  LogOut,
  CheckCircle,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Search,
  Bell,
  Palette,
  ChevronLeft,
  Award,
  User as UserIcon,
  BookOpen,
  MessageSquare,
  X,
  Save,
  Lock,
  Unlock,
  ShieldCheck,
  UserPlus,
  Edit3,
  Calendar,
  Users,
  List,
  UserMinus,
  Folder,
  FolderPlus,
  Link as LinkIcon,
  ArrowRight,
  GraduationCap,
  BarChart3,
  TrendingUp,
  PieChart,
  CalendarCheck,
  CheckSquare,
  Square,
  MoreVertical,
  Reply,
  AtSign,
  Camera,
  Moon,
  Sun,
  Upload,
  Loader2,
  UserCheck,
  Copy,
  Clock,
  MapPin,
  Layers,
  Video,
  File,
  Info,
  ExternalLink,
  Filter,
  Crown,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  Check,
  Eye,
  EyeOff,
  CloudUpload,
  HardDrive,
  FolderOpen,
  ArrowRightLeft,
  Key,
  RotateCcw,
  Pin,
  Star,
  Archive,
  Vote,
  CreditCard,
  Trophy,
} from "lucide-react";

// --- Storage & Direct File Utilities ---
import {
  downloadFile,
  uploadFileToStorage,
  getStorageConfig,
  saveStorageConfig,
  resolveStoredFileUrl,
  extractCloudinaryCloudName,
  DEFAULT_CLOUDINARY_API_KEY,
  DEFAULT_CLOUDINARY_API_SECRET,
  StorageConfig,
} from "./services/storageService";
import { deleteFileFromGoogleDrive } from "./services/googleDrive";
import { GoogleDriveManagerModal } from "./components/GoogleDriveManagerModal";
import { RepresentativeManagerModal } from "./components/RepresentativeManagerModal";
import { LiveCountdownStrip } from "./components/LiveCountdownStrip";

// --- Mock Data Imports ---
import {
  MOCK_USERS,
  MOCK_ANNOUNCEMENTS,
  MOCK_COURSES,
  MOCK_GRADES,
  MOCK_ATTENDANCE_SESSIONS,
  MOCK_ATTENDANCE_RECORDS,
  MOCK_CHAT,
  MOCK_NOTIFICATIONS,
  MOCK_MATERIAL_SECTIONS,
  MOCK_MATERIALS,
  MOCK_BATCHES,
  MOCK_SCHEDULE,
} from "./services/mockDb";

// --- Image Compression Utility ---
import { compressImage } from "./services/imageCompressor";

// --- Firebase Service Imports ---
import {
  seedInitialDataIfEmpty,
  subscribeUsers,
  saveUserToFirestore,
  deleteUserFromFirestore,
  subscribeAnnouncements,
  saveAnnouncementToFirestore,
  deleteAnnouncementFromFirestore,
  subscribeJoinRequests,
  saveJoinRequestToFirestore,
  deleteJoinRequestFromFirestore,
  subscribeCourses,
  saveCourseToFirestore,
  deleteCourseFromFirestore,
  subscribeGrades,
  saveGradeToFirestore,
  deleteGradeFromFirestore,
  subscribeAttendanceSessions,
  saveAttendanceSessionToFirestore,
  deleteAttendanceSessionFromFirestore,
  subscribeAttendanceRecords,
  saveAttendanceRecordToFirestore,
  deleteAttendanceRecordFromFirestore,
  subscribeChatMessages,
  saveChatMessageToFirestore,
  deleteChatMessageFromFirestore,
  subscribeMaterialSections,
  saveMaterialSectionToFirestore,
  deleteMaterialSectionFromFirestore,
  subscribeMaterials,
  saveMaterialToFirestore,
  deleteMaterialFromFirestore,
  subscribeNotifications,
  saveNotificationToFirestore,
  subscribeBatches,
  saveBatchToFirestore,
  deleteBatchFromFirestore,
  subscribeSchedules,
  saveScheduleToFirestore,
  deleteScheduleFromFirestore,
  subscribeSettings,
  saveSettingToFirestore,
  subscribeProjectGroups,
  saveProjectGroupToFirestore,
  deleteProjectGroupFromFirestore,
  subscribeProjects,
  saveProjectToFirestore,
  deleteProjectFromFirestore,
  subscribeAssignments,
  saveAssignmentToFirestore,
  deleteAssignmentFromFirestore,
  subscribeExams,
  saveExamToFirestore,
  deleteExamFromFirestore,
  subscribeStudentSummaries,
  saveStudentSummaryToFirestore,
  deleteStudentSummaryFromFirestore,
  subscribeBatchSuggestions,
  loginWithGoogle,
  checkGoogleRedirectResult,
  logoutUser,
  isUsernameTaken,
  subscribeRepresentativeCodes,
  redeemRepresentativeCode,
  transferRepresentation,
  dismissRepresentative,
  resetEntireSystemDataToProduction,
} from "./services/firebase";

// --- Theme Selector ---
const ThemeSelector: React.FC<{
  currentTheme: ThemeColor;
  onChange: (t: ThemeColor) => void;
}> = ({ currentTheme, onChange }) => {
  const themes: { id: ThemeColor; color: string; label: string }[] = [
    { id: "blue", color: "37 99 235", label: "أزرق" },
    { id: "emerald", color: "16 185 129", label: "أخضر" },
    { id: "violet", color: "139 92 246", label: "بنفسجي" },
    { id: "rose", color: "244 63 94", label: "وردي" },
    { id: "amber", color: "245 158 11", label: "ذهبي" },
  ];

  return (
    <div className="flex gap-3 justify-center md:justify-start">
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center ${currentTheme === t.id ? "border-gray-600 scale-110" : "border-transparent"}`}
          style={{ backgroundColor: `rgb(${t.color})` }}
          aria-label={t.label}
        >
          {currentTheme === t.id && (
            <CheckCircle size={14} className="text-white" />
          )}
        </button>
      ))}
    </div>
  );
};

// --- Auth Component (Login / Signup) ---
interface AuthScreenProps {
  users: User[];
  onLogin: (user: User) => void;
  onSignup: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({
  users,
  onLogin,
  onSignup,
}) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [batchCode, setBatchCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    if (!cleanUsername || !password) {
      setError("يرجى تعبئة جميع الحقول المطلوبة");
      setIsLoading(false);
      return;
    }

    if (!isLoginMode) {
      if (!name || !cleanEmail) {
        setError("يرجى تعبئة جميع الحقول");
        setIsLoading(false);
        return;
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        setError("يرجى إدخال بريد إلكتروني صحيح");
        setIsLoading(false);
        return;
      }
    }

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    try {
      if (isLoginMode) {
        // Login Logic with MOCK_USERS fallback
        const allCandidates = [
          ...users,
          ...MOCK_USERS.filter((mu) => !users.some((u) => u.username?.toLowerCase() === mu.username?.toLowerCase())),
        ];
        const user = allCandidates.find(
          (u) =>
            (u.username &&
              u.username.toLowerCase() === cleanUsername.toLowerCase()) ||
            (u.email && u.email.toLowerCase() === cleanUsername.toLowerCase()),
        );
        if (user) {
          if (user.password && user.password !== password) {
            setError("كلمة المرور غير صحيحة");
            setIsLoading(false);
            return;
          }
          onLogin(user);
          setIsLoading(false);
        } else if (cleanUsername.toLowerCase() === 'ahmed' && password === 'ahmed0828') {
          // Special owner fallback
          const ownerFallback = MOCK_USERS.find(u => u.username === 'ahmed')!;
          onLogin(ownerFallback);
          setIsLoading(false);
        } else {
          setError("المستخدم غير موجود");
          setIsLoading(false);
        }
      } else {
        // Signup Logic
        if (users.some((u) => u.username?.toLowerCase() === cleanUsername.toLowerCase())) {
          setError("اسم المستخدم مستخدم بالفعل، يرجى اختيار اسم آخر");
          setIsLoading(false);
          return;
        }

        if (users.some((u) => u.email?.toLowerCase() === cleanEmail.toLowerCase())) {
          setError("البريد الإلكتروني مستخدم بالفعل");
          setIsLoading(false);
          return;
        }

        if (password.length < 6) {
          setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
          setIsLoading(false);
          return;
        }

        const newUser: User = {
          uid: `user_${Date.now()}`,
          username: cleanUsername,
          email: cleanEmail,
          password: password,
          name,
          role: UserRole.STUDENT,
          batchCode: "", // No batch yet
          pendingBatchCode: batchCode.trim().toUpperCase() || "",
          isOfficial: false,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
          bio: "طالب مسجل في الدفعة",
          signatureColor: "#64748b",
        };

        onSignup(newUser);
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      setError("حدث خطأ، يرجى المحاولة لاحقاً");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-primary rounded-b-[3rem] z-0 shadow-2xl" />

      <div className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-sm z-10 border border-white/50 dark:border-slate-700 animate-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
            <img
              src="https://image2url.com/r2/default/images/1771267640581-35bff80f-1346-49cc-bf93-a392d06b2588.png"
              alt="App Logo"
              className="w-full h-full object-contain relative z-10 drop-shadow-xl hover:scale-105 transition-transform duration-300"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
            دفعتي
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">
            {isLoginMode ? "سجل دخولك للمتابعة" : "إنشاء حساب طالب جديد"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginMode && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                  الاسم الكامل
                </label>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-primary/20 transition">
                  <FileText size={16} className="text-gray-400" />
                  <input
                    type="text"
                    className="flex-1 bg-transparent text-sm outline-none dark:text-white"
                    placeholder="الاسم الظاهر للطلاب"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                  البريد الإلكتروني
                </label>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-primary/20 transition">
                  <AtSign size={16} className="text-gray-400" />
                  <input
                    type="email"
                    className="flex-1 bg-transparent text-sm outline-none dark:text-white"
                    placeholder="example@mail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
              اسم المستخدم
            </label>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-primary/20 transition">
              <UserIcon size={16} className="text-gray-400" />
              <input
                type="text"
                className="flex-1 bg-transparent text-sm outline-none dark:text-white"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
              كلمة المرور
            </label>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-primary/20 transition">
              <Lock size={16} className="text-gray-400" />
              <input
                type="password"
                className="flex-1 bg-transparent text-sm outline-none dark:text-white"
                placeholder="******"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-xs font-bold text-center bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-primary/30 mt-4 flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                {isLoginMode ? "تسجيل الدخول" : "إنشاء الحساب"}
                <ChevronLeft size={16} />
              </>
            )}
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white dark:bg-slate-800 px-2 text-gray-400">
              أو عبر
            </span>
          </div>
        </div>

        {/* Google Login Only */}
        <button
          type="button"
          onClick={async () => {
            setIsLoading(true);
            setError("");
            try {
              const gUser = await loginWithGoogle();
              if (gUser) {
                onLogin(gUser);
              }
            } catch (err: any) {
              const code = err?.code || "";
              const msg = err?.message || "";
              if (
                code === "auth/popup-closed-by-user" ||
                msg.includes("popup-closed-by-user") ||
                code === "auth/cancelled-popup-request" ||
                msg.includes("cancelled-popup-request")
              ) {
                return;
              }
              console.error("Google Sign-In Error:", err);
              const currentHost = window.location.hostname;
              if (
                code === "auth/unauthorized-domain" ||
                msg.includes("unauthorized-domain")
              ) {
                setError(
                  `النطاق الحالي (${currentHost}) غير مضاف في مشروع Firebase (gen-lang-client-0243674326). يرجى إضافته في Authentication > Settings > Authorized domains بدون https://`
                );
              } else if (
                code === "auth/operation-not-allowed" ||
                msg.includes("operation-not-allowed")
              ) {
                setError(
                  "تسجيل الدخول عبر Google غير مفعّل في Firebase Console (Authentication > Sign-in method > Google)."
                );
              } else {
                setError(
                  `تعذر تسجيل الدخول عبر Google (${code || "خطأ بالاتصال"}). تأكد من فتح الرابط في متصفح خارجي أو السماح بالنوافذ المنبثقة.`
                );
              }
            } finally {
              setIsLoading(false);
            }
          }}
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center justify-center gap-2 transition"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          تسجيل الدخول عبر Google
        </button>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setError("");
            }}
            className="text-xs text-primary font-bold hover:underline"
          >
            {isLoginMode
              ? "طالب جديد؟ أنشئ حسابك الآن"
              : "لديك حساب بالفعل؟ سجل دخولك"}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- App Component ---
export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const isOwner =
    currentUser?.role === UserRole.OWNER ||
    currentUser?.username?.toLowerCase() === "ahmed";
  const isRepresentative = currentUser?.role === UserRole.REPRESENTATIVE;
  const isAssistantRep = currentUser?.role === UserRole.ASSISTANT_REP;
  const isMainAdmin = isOwner || isRepresentative;
  const isManager = isMainAdmin || isAssistantRep;
  const [viewingUserProfile, setViewingUserProfile] = useState<User | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);
  const [theme, setTheme] = useState<ThemeColor>("blue");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loadingApp, setLoadingApp] = useState(true);
  const [currentTimer, setCurrentTimer] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimer(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Real Data State (from Mock DB)
  const [appUsers, setAppUsers] = useState<User[]>(MOCK_USERS);
  const [announcements, setAnnouncements] =
    useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
  const [notifications, setNotifications] =
    useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);
  const [grades, setGrades] = useState<Grade[]>(MOCK_GRADES);
  const [attendanceSessions, setAttendanceSessions] = useState<
    AttendanceSession[]
  >(MOCK_ATTENDANCE_SESSIONS);
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >(MOCK_ATTENDANCE_RECORDS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(MOCK_CHAT);
  const [materialSections, setMaterialSections] = useState<MaterialSection[]>(
    MOCK_MATERIAL_SECTIONS,
  );
  const [materials, setMaterials] = useState<Material[]>(MOCK_MATERIALS);
  const [batches, setBatches] = useState<Batch[]>(MOCK_BATCHES);
  const [schedules, setSchedules] = useState<LectureSchedule[]>(MOCK_SCHEDULE);
  const [projectGroups, setProjectGroups] = useState<ProjectGroup[]>([]);
  const [isChatLocked, setIsChatLocked] = useState(false);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [isJoiningBatch, setIsJoiningBatch] = useState(false);
  const [joiningCode, setJoiningCode] = useState("");
  const [isStealthMode, setIsStealthMode] = useState(false);
  const [stealthBatchCode, setStealthBatchCode] = useState("");

  const effectiveBatchCode = (currentUser?.username === 'ahmed' && isStealthMode) 
    ? stealthBatchCode 
    : currentUser?.batchCode || "";

  // Batch Management State (Developer / Owner)
  const [isAddingBatch, setIsAddingBatch] = useState(false);
  const [isEditingRep, setIsEditingRep] = useState(false);
  const [editingRepBatch, setEditingRepBatch] = useState<Batch | null>(null);
  const [newRepUsername, setNewRepUsername] = useState("");
  const [newBatchName, setNewBatchName] = useState("");
  const [newBatchCode, setNewBatchCode] = useState("");
  const [newBatchDept, setNewBatchDept] = useState("");
  const [newBatchStage, setNewBatchStage] = useState("");
  const [newBatchRepUsername, setNewBatchRepUsername] = useState("");
  const [newBatchRepName, setNewBatchRepName] = useState("");

  // Representative Codes & Transfer Management (Owner: Ahmed)
  const [representativeCodes, setRepresentativeCodes] = useState<RepresentativeCode[]>([]);
  const [isRepManagerOpen, setIsRepManagerOpen] = useState(false);
  const [isRedeemRepCodeOpen, setIsRedeemRepCodeOpen] = useState(false);
  const [redeemCodeInput, setRedeemCodeInput] = useState("");
  const [isRedeemingCode, setIsRedeemingCode] = useState(false);
  const [redeemFeedback, setRedeemFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isResettingDb, setIsResettingDb] = useState(false);

  // Schedule Management State (Representative & Admin & Owner)
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [schedCourseName, setSchedCourseName] = useState("");
  const [schedProf, setSchedProf] = useState("");
  const [schedDay, setSchedDay] = useState("الأحد");
  const [schedDate, setSchedDate] = useState("");
  const [schedStartTime, setSchedStartTime] = useState("08:30 ص");
  const [schedEndTime, setSchedEndTime] = useState("10:30 ص");
  const [schedHall, setSchedHall] = useState("");
  const [schedNote, setSchedNote] = useState("");
  const [schedFilterDay, setSchedFilterDay] = useState("الكل");

  // --- UI States ---
  // Material Navigation State
  const [activeMatCourse, setActiveMatCourse] = useState<Course | null>(null);
  const [activeMatSection, setActiveMatSection] =
    useState<MaterialSection | null>(null);

  // Materials Editing State (Admin)
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionCategory, setNewSectionCategory] = useState<"LECTURES" | "QUESTIONS_BANK">("LECTURES");
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [materialSearchQuery, setMaterialSearchQuery] = useState("");
  const [materialFilterMode, setMaterialFilterMode] = useState<"ALL" | "BOOKMARKED" | "STUDIED" | "UNSTUDIED">("ALL");
  const [activeCourseCategoryTab, setActiveCourseCategoryTab] = useState<"ALL" | "LECTURES" | "QUESTIONS_BANK">("ALL");

  // New Material Form
  const [newMatTitle, setNewMatTitle] = useState("");
  const [newMatType, setNewMatType] = useState<"PDF" | "IMAGE" | "LINK">("PDF");
  const [newMatUrl, setNewMatUrl] = useState("");

  // Chat State
  const [newMessage, setNewMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [chatMediaType, setChatMediaType] = useState<'text' | 'image' | 'video' | 'link' | 'file'>('text');
  const [chatMediaUrl, setChatMediaUrl] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatMediaInputRef = useRef<HTMLInputElement>(null);

  // Profile Editing State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editBanner, setEditBanner] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editColor, setEditColor] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRefAvatar = useRef<HTMLInputElement>(null);
  const fileInputRefBanner = useRef<HTMLInputElement>(null);

  // Course Creation/Editing State
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editCourseName, setEditCourseName] = useState("");
  const [editCourseProf, setEditCourseProf] = useState("");
  const [newCourseName, setNewCourseName] = useState("");
  const [newSimpleCourseName, setNewSimpleCourseName] = useState("");
  const [simpleCourseProf, setSimpleCourseProf] = useState("");
  const [courseProfessors, setCourseProfessors] = useState<string[]>([]);
  const [tempProfName, setTempProfName] = useState("");
  const [newAssessments, setNewAssessments] = useState<AssessmentStructure[]>(
    [],
  );
  const [newAssessmentName, setNewAssessmentName] = useState("");
  const [newAssessmentScore, setNewAssessmentScore] = useState("");
  const [newAssessmentDate, setNewAssessmentDate] = useState("");

  // Direct Device File Upload Refs & State
  const materialFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);
  const assignFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAssignFile, setIsUploadingAssignFile] = useState(false);
  const announcementFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAnnouncementFile, setIsUploadingAnnouncementFile] = useState(false);

  // Storage Configuration & Real Upload Progress
  const [storageConfig, setStorageConfig] = useState<StorageConfig | null>(null);
  const [isConfiguringStorage, setIsConfiguringStorage] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [tempCloudName, setTempCloudName] = useState("");
  const [tempUploadPreset, setTempUploadPreset] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lastUploadedDriveInfo, setLastUploadedDriveInfo] = useState<{
    fileName?: string;
    driveFileId?: string;
    driveViewUrl?: string;
    directDownloadUrl?: string;
    fileSize?: string;
  } | null>(null);

  // In-App Image Viewer Modal State
  const [previewItem, setPreviewItem] = useState<{
    title: string;
    url: string;
    type: "PDF" | "IMAGE" | "LINK" | "file";
    date?: string;
  } | null>(null);
  const [resolvedPreviewUrl, setResolvedPreviewUrl] = useState<string>("");
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  useEffect(() => {
    if (!previewItem) {
      setResolvedPreviewUrl("");
      setIsLoadingPreview(false);
      return;
    }
    let cancelled = false;
    const needsResolution = previewItem.url.startsWith("dafaaty-cloud://");

    if (needsResolution) {
      setIsLoadingPreview(true);
      resolveStoredFileUrl(previewItem.url, previewItem.type)
        .then((blobUrl) => {
          if (!cancelled) setResolvedPreviewUrl(blobUrl);
        })
        .catch((err) => {
          console.error("Error resolving file for preview:", err);
          if (!cancelled) setResolvedPreviewUrl(previewItem.url);
        })
        .finally(() => {
          if (!cancelled) setIsLoadingPreview(false);
        });
    } else {
      setResolvedPreviewUrl(previewItem.url);
    }
    return () => {
      cancelled = true;
    };
  }, [previewItem]);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewRotation, setPreviewRotation] = useState(0);

  // Grade Editing State (Admin)
  const [isEditingGrades, setIsEditingGrades] = useState(false);
  const [selectedCourseForGrading, setSelectedCourseForGrading] =
    useState<Course | null>(null);
  const [selectedAssessmentForGrading, setSelectedAssessmentForGrading] =
    useState<AssessmentStructure | null>(null);
  const [tempGrades, setTempGrades] = useState<{ [studentId: string]: number }>(
    {},
  );
  const [gradeEditorSearch, setGradeEditorSearch] = useState("");
  const [customizingCourseForGrades, setCustomizingCourseForGrades] =
    useState<Course | null>(null);
  const [customAssessmentsDraft, setCustomAssessmentsDraft] = useState<
    AssessmentStructure[]
  >([]);
  const [customNewAsmName, setCustomNewAsmName] = useState("");
  const [customNewAsmScore, setCustomNewAsmScore] = useState("");
  const [viewingCourseGradeSheet, setViewingCourseGradeSheet] =
    useState<Course | null>(null);
  const [matrixGradesDraft, setMatrixGradesDraft] = useState<{
    [key: string]: number | "";
  }>({});
  const [isSavingMatrixGrades, setIsSavingMatrixGrades] = useState(false);

  // Attendance Management State (Admin)
  const [selectedCourseForAttendance, setSelectedCourseForAttendance] =
    useState<Course | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const [newSessionDate, setNewSessionDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [isAddingSession, setIsAddingSession] = useState(false);
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState("");
  const [copyFromSessionId, setCopyFromSessionId] = useState("");
  const [isCopyingAttendance, setIsCopyingAttendance] = useState(false);
  const [copyAttendanceSuccess, setCopyAttendanceSuccess] = useState<string | null>(null);
  const [attendanceReportStudent, setAttendanceReportStudent] = useState<User | null>(null);

  // Student Management State (Admin)
  const [newStudentName, setNewStudentName] = useState("");
  const [studentStatsFilter, setStudentStatsFilter] = useState<'ALL' | 'INCLUDED' | 'EXCLUDED'>('ALL');
  const [studentDirectorySearch, setStudentDirectorySearch] = useState("");
  const [linkingTargetAccount, setLinkingTargetAccount] = useState<User | null>(null);
  const [linkingSourceOfficialUid, setLinkingSourceOfficialUid] = useState("");
  const [keepOfficialNameOnMerge, setKeepOfficialNameOnMerge] = useState(true);
  const [isMergingStudent, setIsMergingStudent] = useState(false);

  // Announcements State
  const [isAddingAnnouncement, setIsAddingAnnouncement] = useState(false);
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState("");
  const [newAnnouncementContent, setNewAnnouncementContent] = useState("");
  const [newAnnouncementPriority, setNewAnnouncementPriority] = useState<
    "normal" | "high"
  >("normal");
  const [newAnnouncementPinned, setNewAnnouncementPinned] = useState(false);
  const [newAnnouncementHasPoll, setNewAnnouncementHasPoll] = useState(false);
  const [newPollQuestion, setNewPollQuestion] = useState("");
  const [newPollOptions, setNewPollOptions] = useState<string[]>(["", ""]);
  const [expandedPollVotersAnnId, setExpandedPollVotersAnnId] = useState<string | null>(null);
  const [newAnnouncementCourse, setNewAnnouncementCourse] = useState("");
  const [newAnnouncementMediaUrl, setNewAnnouncementMediaUrl] = useState("");
  const [newAnnouncementMediaType, setNewAnnouncementMediaType] = useState<"image" | "video" | "link">("link");

  // Projects State (مشروع -> مادة -> كروبات -> أعضاء)
  const [projects, setProjects] = useState<CourseProject[]>([]);
  const [studentSummaries, setStudentSummaries] = useState<StudentSummary[]>([]);
  const [batchSuggestions, setBatchSuggestions] = useState<BatchSuggestion[]>([]);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [editingProject, setEditingProject] = useState<CourseProject | null>(null);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newProjectCourseId, setNewProjectCourseId] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [newProjectDeadline, setNewProjectDeadline] = useState("");
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [projectCourseFilter, setProjectCourseFilter] = useState("all");

  // Project Group Modal State
  const [targetProjectForGroup, setTargetProjectForGroup] = useState<CourseProject | null>(null);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupMembers, setNewGroupMembers] = useState<string[]>([]);
  const [newGroupLeaderId, setNewGroupLeaderId] = useState("");
  const [groupMemberSearch, setGroupMemberSearch] = useState("");
  const [groupMemberFilter, setGroupMemberFilter] = useState<"all" | "unassigned">("all");
  const [viewUnassignedProject, setViewUnassignedProject] = useState<CourseProject | null>(null);
  const projectFileInputRef = useRef<HTMLInputElement>(null);
  const [projectUploadTarget, setProjectUploadTarget] = useState<{
    projectId: string;
    groupId?: string;
  } | null>(null);
  const [uploadingProjectTargetKey, setUploadingProjectTargetKey] = useState<string | null>(null);
  const [projectUploadProgress, setProjectUploadProgress] = useState<number>(0);

  // Assignments (الواجبات والتكليفات) State
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [newAssignTitle, setNewAssignTitle] = useState("");
  const [newAssignCourseId, setNewAssignCourseId] = useState("");
  const [newAssignDesc, setNewAssignDesc] = useState("");
  const [newAssignDueDate, setNewAssignDueDate] = useState("");
  const [newAssignNotify, setNewAssignNotify] = useState(false);
  const [newAssignAttachmentUrl, setNewAssignAttachmentUrl] = useState("");
  const [newAssignAttachmentType, setNewAssignAttachmentType] = useState<"link" | "file" | "image">("link");
  const [assignFilterStatus, setAssignFilterStatus] = useState<"all" | "pending" | "completed" | "urgent">("all");
  const [assignFilterCourse, setAssignFilterCourse] = useState("all");
  const [assignSearchQuery, setAssignSearchQuery] = useState("");

  // --- Firebase Initialization and Listeners ---
  useEffect(() => {
    // 1. Seed initial data to Firestore if empty
    seedInitialDataIfEmpty();

    // 1.b Check if returning from a Google Sign-In Redirect (e.g. mobile browsers / Netlify)
    checkGoogleRedirectResult().then((redirectUser) => {
      if (redirectUser) {
        localStorage.setItem("dafaaty_user_uid", redirectUser.uid);
        setCurrentUser(redirectUser);
        setLoadingApp(false);
      }
    });

    // 2. Realtime listeners
    const unsubUsers = subscribeUsers((users) => {
      setAppUsers(users);
      const storedUid = localStorage.getItem("dafaaty_user_uid");
      if (storedUid) {
        const found = users.find((u) => u.uid === storedUid);
        if (found) {
          setCurrentUser(found);
        }
      }
      setLoadingApp(false);
    });

    const unsubBatches = subscribeBatches((items) => {
      setBatches(items);
    });

    const unsubRepCodes = subscribeRepresentativeCodes((codes) => {
      setRepresentativeCodes(codes);
    });

    const unsubSettings = subscribeSettings((settings) => {
      if (settings["chat_settings"]) {
        setIsChatLocked(Boolean(settings["chat_settings"].chatLocked));
      }
    });

    getStorageConfig().then((cfg) => {
      if (cfg) {
        setStorageConfig(cfg);
        setTempCloudName(cfg.cloudinaryCloudName || "");
        setTempUploadPreset(cfg.cloudinaryUploadPreset || "");
      }
    });

    return () => {
      unsubUsers();
      unsubBatches();
      unsubRepCodes();
      unsubSettings();
    };
  }, []);

  useEffect(() => {
    if (!effectiveBatchCode) {
      setAnnouncements([]);
      setCourses([]);
      setGrades([]);
      setAttendanceSessions([]);
      setAttendanceRecords([]);
      setChatMessages([]);
      setMaterialSections([]);
      setMaterials([]);
      setSchedules([]);
      return;
    }

    const unsubAnnouncements = subscribeAnnouncements(effectiveBatchCode, (items) => {
      setAnnouncements(items);
    });

    const unsubCourses = subscribeCourses(effectiveBatchCode, (items) => {
      setCourses(items);
    });

    const unsubGrades = subscribeGrades(effectiveBatchCode, (items) => {
      setGrades(items);
    });

    const unsubSessions = subscribeAttendanceSessions(effectiveBatchCode, (items) => {
      setAttendanceSessions(items);
    });

    const unsubRecords = subscribeAttendanceRecords(effectiveBatchCode, (items) => {
      setAttendanceRecords(items);
    });

    const unsubChat = subscribeChatMessages(effectiveBatchCode, (items) => {
      setChatMessages(items);
    });

    const unsubSections = subscribeMaterialSections(effectiveBatchCode, (items) => {
      setMaterialSections(items);
    });

    const unsubMaterials = subscribeMaterials(effectiveBatchCode, (items) => {
      setMaterials(items);
    });

    const unsubSchedules = subscribeSchedules(effectiveBatchCode, (items) => {
      setSchedules(items);
    });

    const unsubProjects = subscribeProjects(effectiveBatchCode, (items) => {
      setProjects(items);
    });

    const unsubAssignments = subscribeAssignments(effectiveBatchCode, (items) => {
      setAssignments(items);
    });

    const unsubExams = subscribeExams(effectiveBatchCode, (items) => {
      setExams(items);
    });

    const unsubSummaries = subscribeStudentSummaries(effectiveBatchCode, (items) => {
      setStudentSummaries(items);
    });

    const unsubSuggestions = subscribeBatchSuggestions(effectiveBatchCode, (items) => {
      setBatchSuggestions(items);
    });

    return () => {
      unsubAnnouncements();
      unsubCourses();
      unsubGrades();
      unsubSessions();
      unsubRecords();
      unsubChat();
      unsubSections();
      unsubMaterials();
      unsubSchedules();
      unsubProjects();
      unsubAssignments();
      unsubExams();
      unsubSummaries();
      unsubSuggestions();
    };
  }, [effectiveBatchCode]);

  useEffect(() => {
    if (!currentUser) return;
    const unsubNotifs = subscribeNotifications(currentUser.uid, (items) => {
      setNotifications(items);
    });
    return () => unsubNotifs();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setJoinRequests([]);
      return;
    }
    const isRep = currentUser.role === UserRole.REPRESENTATIVE;
    const isOwner = currentUser.role === UserRole.OWNER;
    if (!isRep && !isOwner) {
      setJoinRequests([]);
      return;
    }

    const targetCode = currentUser.batchCode || effectiveBatchCode;
    const unsubReqs = subscribeJoinRequests(
      targetCode,
      (items) => {
        setJoinRequests(items);
      },
      isOwner
    );
    return () => unsubReqs();
  }, [currentUser, effectiveBatchCode]);

  // Update CSS Variables when theme changes
  useEffect(() => {
    const root = document.documentElement;
    const colors: Record<ThemeColor, string> = {
      blue: "37 99 235",
      emerald: "16 185 129",
      violet: "139 92 246",
      rose: "244 63 94",
      amber: "245 158 11",
    };
    root.style.setProperty("--color-primary", colors[theme]);
  }, [theme]);

  // Dark Mode Effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (activeTab === Tab.CHAT) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeTab]);

  // --- Handlers (Persisted to Firebase) ---

  const handleLogout = async () => {
    localStorage.removeItem("dafaaty_user_uid");
    try {
      await logoutUser();
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
    setViewingUserProfile(null);
  };

  const handleViewProfile = (uid: string) => {
    const userToView = appUsers.find((u) => u.uid === uid);
    if (userToView) {
      setViewingUserProfile(userToView);
      setActiveTab(Tab.PROFILE);
    }
  };

  const scrollToMessage = (msgId: string) => {
    const element = document.getElementById(`msg-${msgId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add(
        "bg-primary/20",
        "transition-colors",
        "duration-1000",
      );
      setTimeout(() => element.classList.remove("bg-primary/20"), 1500);
    }
  };

  // Add Official Student (DB Record for Grades & Attendance)
  const handleAddStudent = async () => {
    if (!newStudentName.trim()) return;
    const uid = `u_${Date.now()}`;
    const newStudent: User = {
      uid,
      name: newStudentName.trim(),
      username: `student_${Date.now()}`,
      role: UserRole.STUDENT,
      batchCode: effectiveBatchCode,
      isOfficial: true,
      excludeFromStats: false,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newStudentName.trim())}&background=random`,
      bio: "طالب جامعي",
      signatureColor: "#94a3b8",
    };
    await saveUserToFirestore(newStudent);
    setNewStudentName("");
  };

  const handleDeleteUser = async (uid: string) => {
    await deleteUserFromFirestore(uid);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !chatMediaUrl && !currentUser) return;

    // Check if chat is locked and current user is student
    if (isChatLocked && currentUser.role === UserRole.STUDENT) {
      return;
    }

    const isMedia = chatMediaType !== 'text';
    const expiresAt = isMedia ? Date.now() + 7 * 24 * 60 * 60 * 1000 : undefined; // 7 days for media

    const msgData: ChatMessage = {
      id: `msg_${Date.now()}`,
      batchCode: effectiveBatchCode,
      senderId: currentUser.uid,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      senderAvatar: currentUser.avatar || "",
      senderColor: currentUser.signatureColor || "#000",
      content: newMessage || (isMedia ? `مرفق ${chatMediaType}` : ""),
      timestamp: Date.now(),
      type: chatMediaType,
      mediaUrl: chatMediaUrl || undefined,
      expiresAt,
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            senderName: replyingTo.senderName,
            content: replyingTo.content,
          }
        : null,
    };

    await saveChatMessageToFirestore(msgData);
    setNewMessage("");
    setReplyingTo(null);
    setChatMediaUrl("");
    setChatMediaType('text');
  };

  const handleChatMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setIsUploading(true);
    try {
      // Determine media type
      if (file.type.startsWith('image/')) {
        const compressed = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.6 });
        setChatMediaUrl(compressed);
        setChatMediaType('image');
      } else {
        // For other files, we just use a placeholder since we don't have a real storage backend
        // but for this demo I'll use a data URL if small, otherwise just a placeholder
        if (file.size < 500 * 1024) { // < 500kb
          const reader = new FileReader();
          reader.onload = (ev) => {
            setChatMediaUrl(ev.target?.result as string);
            setChatMediaType(file.type.startsWith('video/') ? 'video' : 'file');
          };
          reader.readAsDataURL(file);
        } else {
          alert("الملف كبير جداً. يرجى رفع ملف أقل من 500 كيلوبايت للحفاظ على المساحة.");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (
      currentUser?.role !== UserRole.OWNER &&
      currentUser?.role !== UserRole.REPRESENTATIVE
    )
      return;
    await deleteChatMessageFromFirestore(id);
  };

  const handleToggleChatLock = async () => {
    const nextLocked = !isChatLocked;
    setIsChatLocked(nextLocked);
    await saveSettingToFirestore("chat_settings", { chatLocked: nextLocked });
    if (batches.length > 0) {
      const activeBatch = batches.find(b => b.code === (currentUser?.batchCode || "ENG26")) || batches[0];
      if (activeBatch) {
        await saveBatchToFirestore({ ...activeBatch, chatLocked: nextLocked });
      }
    }
  };

  // Profile Upload with Smart Image Compression
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "avatar" | "banner",
  ) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setIsUploading(true);
    try {
      // Smart canvas compression to avoid bloated storage
      const compressedDataUrl = await compressImage(file, {
        maxWidth: type === "avatar" ? 256 : 1100,
        maxHeight: type === "avatar" ? 256 : 380,
        quality: 0.72,
        format: "image/jpeg"
      });

      if (type === "avatar") setEditAvatar(compressedDataUrl);
      else setEditBanner(compressedDataUrl);
    } catch (error) {
      console.error("Upload & compression error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    
    // Check username uniqueness if it changed
    if (editUsername !== currentUser.username) {
      if (!editUsername.trim()) {
        alert("اسم المستخدم لا يمكن أن يكون فارغاً");
        return;
      }
      const taken = await isUsernameTaken(editUsername);
      if (taken) {
        alert("اسم المستخدم هذا مأخوذ بالفعل، يرجى اختيار اسم آخر");
        return;
      }
    }

    try {
      const updatedUser: User = {
        ...currentUser,
        name: editName,
        username: editUsername,
        bio: editBio,
        banner: editBanner,
        avatar: editAvatar,
        signatureColor: editColor,
      };

      await saveUserToFirestore(updatedUser);
      setCurrentUser(updatedUser);
      setIsEditingProfile(false);
    } catch (e) {
      console.error("Save profile error:", e);
    }
  };

  // --- Dynamic Lecture Schedule Logic ---
  const handleSaveSchedule = async () => {
    if (!schedCourseName || !schedDay || !schedStartTime || !schedEndTime) return;
    const scheduleItem: LectureSchedule = {
      id: editingScheduleId || `sch_${Date.now()}`,
      batchCode: effectiveBatchCode,
      courseName: schedCourseName,
      professor: schedProf || "",
      day: schedDay,
      date: schedDate || "",
      startTime: schedStartTime,
      endTime: schedEndTime,
      hall: schedHall || "قاعة عامة",
      isCancelled: false,
      note: schedNote || "",
      updatedAt: Date.now()
    };
    await saveScheduleToFirestore(scheduleItem);
    setIsAddingSchedule(false);
    setEditingScheduleId(null);
    setSchedCourseName("");
    setSchedProf("");
    setSchedDay("الأحد");
    setSchedDate("");
    setSchedStartTime("08:30 ص");
    setSchedEndTime("10:30 ص");
    setSchedHall("");
    setSchedNote("");
  };

  const handleDeleteSchedule = async (id: string) => {
    await deleteScheduleFromFirestore(id);
  };

  const handleToggleCancelSchedule = async (item: LectureSchedule) => {
    const updated = { ...item, isCancelled: !item.isCancelled, updatedAt: Date.now() };
    await saveScheduleToFirestore(updated);
  };

  // --- Batches (النسخ والدفعات) Logic (Developer / Owner) ---
  const handleSaveBatch = async () => {
    if (!newBatchName || !newBatchCode) return;

    let repUid = "";
    let repName = newBatchRepName;

    // If representative username is provided, find the user
    if (newBatchRepUsername.trim()) {
      const repUser = appUsers.find(
        (u) => u.username?.toLowerCase() === newBatchRepUsername.toLowerCase()
      );
      if (repUser) {
        repUid = repUser.uid;
        repName = repUser.name;
        // Promote to representative role and assign batch code
        await saveUserToFirestore({
          ...repUser,
          role: UserRole.REPRESENTATIVE,
          batchCode: newBatchCode.trim().toUpperCase(),
        });
      } else {
        alert("لم يتم العثور على مستخدم بهذا الاسم. سيتم إنشاء الدفعة بدون ممثل مفعل حالياً.");
      }
    }

    const batchData: Batch = {
      id: `batch_${Date.now()}`,
      name: newBatchName,
      code: newBatchCode.trim().toUpperCase(),
      department: newBatchDept || "هندسة البرمجيات",
      stage: newBatchStage || "المرحلة الأولى",
      representativeUid: repUid || "",
      representativeName: repName || "الممثل",
      chatLocked: false,
      createdAt: Date.now(),
    };
    await saveBatchToFirestore(batchData);
    setIsAddingBatch(false);
    setNewBatchName("");
    setNewBatchCode("");
    setNewBatchDept("");
    setNewBatchStage("");
    setNewBatchRepUsername("");
    setNewBatchRepName("");
  };

  const handleDeleteBatch = async (batchId: string) => {
    await deleteBatchFromFirestore(batchId);
  };

  const handleUpdateRepresentative = async () => {
    if (!editingRepBatch || !newRepUsername.trim()) return;

    const newRepUser = appUsers.find(
      (u) => u.username?.toLowerCase() === newRepUsername.toLowerCase()
    );

    if (!newRepUser) {
      alert("لم يتم العثور على مستخدم بهذا الاسم.");
      return;
    }

    try {
      const oldRepUid = editingRepBatch.representativeUid;

      // 1. Update Batch
      const updatedBatch: Batch = {
        ...editingRepBatch,
        representativeUid: newRepUser.uid,
        representativeName: newRepUser.name,
      };
      await saveBatchToFirestore(updatedBatch);

      // 2. Update New Representative
      await saveUserToFirestore({
        ...newRepUser,
        role: UserRole.REPRESENTATIVE,
        batchCode: editingRepBatch.code,
      });

      // 3. Handle Old Representative demotion if needed
      if (oldRepUid && oldRepUid !== newRepUser.uid) {
        const otherBatches = batches.filter(
          (b) => b.id !== editingRepBatch.id && b.representativeUid === oldRepUid
        );
        if (otherBatches.length === 0) {
          const oldRepUser = appUsers.find((u) => u.uid === oldRepUid);
          if (oldRepUser && oldRepUser.role === UserRole.REPRESENTATIVE) {
            await saveUserToFirestore({
              ...oldRepUser,
              role: UserRole.STUDENT,
            });
          }
        }
      }

      setIsEditingRep(false);
      setEditingRepBatch(null);
      setNewRepUsername("");
      alert("تم تحديث ممثل الدفعة بنجاح");
    } catch (e) {
      console.error("Error updating representative:", e);
      alert("حدث خطأ أثناء تحديث الممثل");
    }
  };

  // --- Join Request Logic ---
  const [isSubmittingJoin, setIsSubmittingJoin] = useState(false);

  const handleJoinRequestSubmit = async () => {
    if (!joiningCode.trim() || !currentUser) return;
    const cleanInput = joiningCode.trim().toUpperCase();

    // 1. Check if matches batch code or batch id
    let targetBatch = batches.find(
      (b) => b.code?.toUpperCase() === cleanInput || b.id === cleanInput
    );

    // 2. If not found directly, check representative_codes
    if (!targetBatch) {
      const repMatch = representativeCodes.find(
        (r) => r.code?.toUpperCase() === cleanInput
      );
      if (repMatch) {
        targetBatch = batches.find(
          (b) => b.code?.toUpperCase() === repMatch.batchCode?.toUpperCase()
        );
      }
    }

    // 3. Fallback: Check if batch exists by clean alphanumeric code
    if (!targetBatch) {
      targetBatch = batches.find(
        (b) => b.code?.toUpperCase().replace(/[^a-zA-Z0-9]/g, '') === cleanInput.replace(/[^a-zA-Z0-9]/g, '')
      );
    }

    if (!targetBatch) {
      alert(`❌ كود الدفعة [${cleanInput}] غير موجود في النظام!\n\nيرجى التأكد من كود الدفعة الصحيح من ممثل دفعتك أو المطور.`);
      return;
    }

    const resolvedBatchCode = targetBatch.code.toUpperCase();
    const batchDisplayName = targetBatch.name || resolvedBatchCode;

    setIsSubmittingJoin(true);
    try {
      const req: JoinRequest = {
        id: `req_${currentUser.uid}`,
        userId: currentUser.uid,
        userName: currentUser.name,
        userEmail: currentUser.email || "",
        userAvatar: currentUser.avatar,
        batchCode: resolvedBatchCode,
        status: "PENDING",
        timestamp: Date.now(),
      };
      await saveJoinRequestToFirestore(req);

      // Update user pendingBatchCode
      const updatedUser: User = {
        ...currentUser,
        pendingBatchCode: resolvedBatchCode,
      };
      await saveUserToFirestore(updatedUser);
      setCurrentUser(updatedUser);

      // Notify representative if exists
      if (targetBatch.representativeUid) {
        await saveNotificationToFirestore({
          id: `notif_${Date.now()}`,
          userId: targetBatch.representativeUid,
          title: 'طلب انضمام جديد للدفعة 📥',
          content: `قدم الطالب (${currentUser.name}) طلباً جديداً للانضمام لدفعتكم (${batchDisplayName}). يرجى مراجعة تبويب الطلبات لقبوله.`,
          timestamp: Date.now(),
          isRead: false,
          type: 'ANNOUNCEMENT',
        });
      }

      setIsJoiningBatch(false);
      setJoiningCode("");
      alert(`✅ تم إرسال طلب الانضمام لدفعة (${batchDisplayName}) بنجاح!\nسيصل إشعار لممثل الدفعة لقبولك فوراً.`);
    } catch (e: any) {
      console.error("Error submitting join request:", e);
      alert("حدث خطأ أثناء إرسال طلب الانضمام، يرجى المحاولة ثانية.");
    } finally {
      setIsSubmittingJoin(false);
    }
  };

  const [isCancellingJoin, setIsCancellingJoin] = useState(false);

  const handleCancelJoinRequest = async () => {
    if (!currentUser) return;
    if (!confirm("هل أنت متأكد من سحب وإلغاء طلب الانضمام للدفعة؟ ستتمكن فوراً من كتابة كود الدفعة الصحيح.")) return;

    setIsCancellingJoin(true);
    try {
      await deleteJoinRequestFromFirestore(`req_${currentUser.uid}`);
      const updatedUser: User = {
        ...currentUser,
        pendingBatchCode: "",
      };
      await saveUserToFirestore(updatedUser);
      setCurrentUser(updatedUser);
    } catch (err: any) {
      console.error("Error cancelling join request:", err);
      alert("تعذر سحب الطلب، يرجى المحاولة مرة أخرى.");
    } finally {
      setIsCancellingJoin(false);
    }
  };

  const handleApproveRequest = async (req: JoinRequest) => {
    try {
      // 1. Update user document
      const targetUser = appUsers.find((u) => u.uid === req.userId);
      if (targetUser) {
        await saveUserToFirestore({
          ...targetUser,
          batchCode: req.batchCode,
          pendingBatchCode: "",
        });
      }

      // 2. Notify student
      const bObj = batches.find((b) => b.code === req.batchCode);
      const batchTitle = bObj?.name || req.batchCode;
      await saveNotificationToFirestore({
        id: `notif_${Date.now()}`,
        userId: req.userId,
        title: 'تم قبول انضمامك للدفعة! 🎉',
        content: `تهانينا! تم قبول طلبك رسمياً للانضمام إلى (${batchTitle}). يمكنك الآن الاستفادة من جميع الميزات والمواد والجدول.`,
        timestamp: Date.now(),
        isRead: false,
        type: 'ANNOUNCEMENT',
      });

      // 3. Delete request
      await deleteJoinRequestFromFirestore(req.id);
    } catch (e) {
      console.error("Error approving request:", e);
    }
  };

  const handleApproveAllRequests = async () => {
    if (joinRequests.length === 0) return;
    if (!confirm(`هل أنت متأكد من قبول جميع الطلبات (${joinRequests.length} طلب) دفعة واحدة؟`)) return;

    for (const req of [...joinRequests]) {
      await handleApproveRequest(req);
    }
  };

  const handleRejectRequest = async (id: string) => {
    try {
      const req = joinRequests.find((r) => r.id === id);
      if (req) {
        const targetUser = appUsers.find((u) => u.uid === req.userId);
        if (targetUser) {
          await saveUserToFirestore({
            ...targetUser,
            pendingBatchCode: "",
          });
        }

        // Notify student
        await saveNotificationToFirestore({
          id: `notif_${Date.now()}`,
          userId: req.userId,
          title: 'تحديث بخصوص طلب الانضمام ⚠️',
          content: `نعتذر، لم يتم قبول طلب انضمامك للدفعة ذات الكود (${req.batchCode}). يرجى مراجعة ممثل الدفعة.`,
          timestamp: Date.now(),
          isRead: false,
          type: 'ANNOUNCEMENT',
        });
      }
      await deleteJoinRequestFromFirestore(id);
    } catch (e) {
      console.error("Error rejecting request:", e);
    }
  };

  const handleRedeemRepCodeSubmit = async () => {
    if (!currentUser || !redeemCodeInput.trim()) return;
    setIsRedeemingCode(true);
    setRedeemFeedback(null);
    try {
      const res = await redeemRepresentativeCode(redeemCodeInput.trim(), currentUser);
      if (res.success) {
        setRedeemFeedback({ type: 'success', text: res.message });
        if (res.updatedUser) {
          setCurrentUser(res.updatedUser);
        }
        setTimeout(() => {
          setIsRedeemRepCodeOpen(false);
          setRedeemCodeInput("");
          setRedeemFeedback(null);
        }, 1800);
      } else {
        setRedeemFeedback({ type: 'error', text: res.message });
      }
    } catch (e: any) {
      setRedeemFeedback({ type: 'error', text: e.message || 'فشل تفعيل الكود' });
    } finally {
      setIsRedeemingCode(false);
    }
  };

  const handleToggleAssistantRep = async (targetUser: User) => {
    if (!isMainAdmin) return;
    if (targetUser.role === UserRole.OWNER || targetUser.role === UserRole.REPRESENTATIVE) return;

    const isAlreadyAssistant = targetUser.role === UserRole.ASSISTANT_REP;
    const newRole = isAlreadyAssistant ? UserRole.STUDENT : UserRole.ASSISTANT_REP;
    const actionLabel = isAlreadyAssistant
      ? "إعفاء الطالب من منصب ممثل معاون والعودة كطالب عادي"
      : "ترقية وتعيين الطالب كممثل معاون للدفعة 🎖️";

    if (!confirm(`هل أنت متأكد من ${actionLabel} لـ (${targetUser.name})؟`)) return;

    try {
      const updated: User = {
        ...targetUser,
        role: newRole,
      };
      await saveUserToFirestore(updated);

      // Notify student
      await saveNotificationToFirestore({
        id: `notif_${Date.now()}`,
        userId: targetUser.uid,
        title: isAlreadyAssistant ? 'تحديث الرتبة ℹ️' : 'ترقية: تم تعيينك ممثلاً معاوناً! 🎖️',
        content: isAlreadyAssistant
          ? 'تم إعفاؤك من منصب ممثل معاون والعودة لرتبة طالب عادي.'
          : 'تهانينا! قام ممثل دفعتك بتعيينك رسمياً (ممثلاً معاوناً 🎖️). أصبحت تملك الآن صلاحيات رفع وتعديل المحاضرات وإدارة الواجبات والمشاريع لمساعدة زملائك.',
        timestamp: Date.now(),
        isRead: false,
        type: 'ANNOUNCEMENT',
      });

      alert(
        isAlreadyAssistant
          ? `تم إعفاء (${targetUser.name}) من منصب ممثل معاون بنجاح.`
          : `تهانينا! تم تعيين (${targetUser.name}) ممثلاً معاوناً للدفعة بنجاح! 🎖️`
      );
    } catch (err: any) {
      console.error("Error toggling assistant rep:", err);
      alert("حدث خطأ أثناء تحديث رتبة الطالب.");
    }
  };

  const handleToggleExcludeFromStats = async (targetUser: User) => {
    if (!isManager) return;
    if (targetUser.role === UserRole.OWNER) return;

    const isCurrentlyExcluded = !!targetUser.excludeFromStats;
    try {
      const updated: User = {
        ...targetUser,
        excludeFromStats: !isCurrentlyExcluded,
      };
      await saveUserToFirestore(updated);
    } catch (err: any) {
      console.error("Error toggling stats exclusion:", err);
    }
  };

  /**
   * Links & merges a manually added student (oldStudent) with a real registered account (targetUser, e.g. Google login).
   * Transfers all attendance records, grades, project groups, assignments, and poll votes seamlessly.
   */
  const handleLinkAndMergeOfficialStudent = async () => {
    if (!linkingSourceOfficialUid || !linkingTargetAccount) return;
    const oldStudent = appUsers.find((u) => u.uid === linkingSourceOfficialUid);
    const targetUser = linkingTargetAccount;
    if (!oldStudent || !targetUser || oldStudent.uid === targetUser.uid) return;
    const oldUid = oldStudent.uid;

    setIsMergingStudent(true);
    try {
      const newUid = targetUser.uid;
      const finalName = keepOfficialNameOnMerge && oldStudent.name ? oldStudent.name : targetUser.name;

      // 1. Migrate Attendance Records
      const oldAttRecords = attendanceRecords.filter((r) => r.studentId === oldUid);
      for (const rec of oldAttRecords) {
        const existingTargetRec = attendanceRecords.find(
          (r) => r.sessionId === rec.sessionId && r.studentId === newUid
        );
        if (!existingTargetRec) {
          const migratedRec: AttendanceRecord = {
            ...rec,
            id: `rec_${rec.sessionId}_${newUid}`,
            studentId: newUid,
          };
          await saveAttendanceRecordToFirestore(migratedRec);
        }
        await deleteAttendanceRecordFromFirestore(rec.id);
      }

      // 2. Migrate Grades
      const oldGrades = grades.filter((g) => g.studentId === oldUid);
      for (const gr of oldGrades) {
        const existingTargetGrade = grades.find(
          (g) => g.assessmentId === gr.assessmentId && g.studentId === newUid
        );
        if (!existingTargetGrade) {
          const migratedGrade: Grade = {
            ...gr,
            id: `grade_${gr.assessmentId}_${newUid}`,
            studentId: newUid,
          };
          await saveGradeToFirestore(migratedGrade);
        }
        await deleteGradeFromFirestore(gr.id);
      }

      // 3. Migrate Projects (group members, group leader, uploaded files)
      for (const proj of projects) {
        let projChanged = false;
        const updatedGroups = (proj.groups || []).map((g) => {
          let groupChanged = false;
          let updatedMembers = g.members || [];
          if (updatedMembers.includes(oldUid)) {
            groupChanged = true;
            projChanged = true;
            updatedMembers = Array.from(
              new Set(updatedMembers.map((id) => (id === oldUid ? newUid : id)))
            );
          }

          let updatedLeaderId = g.leaderId;
          if (updatedLeaderId === oldUid) {
            groupChanged = true;
            projChanged = true;
            updatedLeaderId = newUid;
          }

          let updatedFiles = g.files;
          if (updatedFiles && updatedFiles.some((f) => f.uploadedByUid === oldUid)) {
            groupChanged = true;
            projChanged = true;
            updatedFiles = updatedFiles.map((f) =>
              f.uploadedByUid === oldUid
                ? { ...f, uploadedByUid: newUid, uploadedByName: finalName }
                : f
            );
          }

          return groupChanged
            ? {
                ...g,
                members: updatedMembers,
                ...(updatedLeaderId ? { leaderId: updatedLeaderId } : {}),
                ...(updatedFiles ? { files: updatedFiles } : {}),
              }
            : g;
        });

        if (projChanged) {
          await saveProjectToFirestore({
            ...proj,
            groups: updatedGroups,
          });
        }
      }

      // 4. Migrate Assignments completedBy
      for (const assign of assignments) {
        if (assign.completedBy?.includes(oldUid)) {
          const updatedCompletedBy = Array.from(
            new Set(assign.completedBy.map((id) => (id === oldUid ? newUid : id)))
          );
          await saveAssignmentToFirestore({
            ...assign,
            completedBy: updatedCompletedBy,
          });
        }
      }

      // 5. Migrate Announcement Poll Votes
      for (const ann of announcements) {
        if (ann.poll && ann.poll.options.some((o) => o.votes?.includes(oldUid))) {
          const updatedOptions = ann.poll.options.map((o) => ({
            ...o,
            votes: Array.from(
              new Set((o.votes || []).map((id) => (id === oldUid ? newUid : id)))
            ),
          }));
          await saveAnnouncementToFirestore({
            ...ann,
            poll: {
              ...ann.poll,
              options: updatedOptions,
            },
          });
        }
      }

      // 6. Update Target User Profile (Keep official tri-name if desired & ensure batchCode)
      const mergedStudied = Array.from(
        new Set([
          ...(targetUser.studiedMaterialIds || []),
          ...(oldStudent.studiedMaterialIds || []),
        ])
      );
      const mergedBookmarks = Array.from(
        new Set([
          ...(targetUser.bookmarkedMaterialIds || []),
          ...(oldStudent.bookmarkedMaterialIds || []),
        ])
      );

      const updatedTargetUser: User = {
        ...targetUser,
        name: finalName,
        batchCode: targetUser.batchCode || effectiveBatchCode,
        excludeFromStats: false,
        studiedMaterialIds: mergedStudied,
        bookmarkedMaterialIds: mergedBookmarks,
      };
      await saveUserToFirestore(updatedTargetUser);

      // 7. Delete the old duplicate offline record so there's no duplication
      await deleteUserFromFirestore(oldUid);

      setLinkingTargetAccount(null);
      setLinkingSourceOfficialUid("");
      alert(
        `تم ربط الطالب (${oldStudent.name}) بحساب (${targetUser.email || targetUser.name}) ونقل كافة الغيابات والدرجات والمشاريع والواجبات إليه بنجاح! ✅`
      );
    } catch (err: any) {
      console.error("Error merging student:", err);
      alert("حدث خطأ أثناء ربط الحساب ونقل البيانات.");
    } finally {
      setIsMergingStudent(false);
    }
  };

  const handleResetDatabase = async () => {
    const confirmation = prompt('⚠️ تحذير: سيتم حذف جميع البيانات التجريبية والملازم والرسائل والدفعات السابقة لتجهيز التطبيق للنشر.\n\nلتأكيد التصفير، اكتب كلمة: "تصفير" واضغط موافق:');
    if (confirmation !== 'تصفير') {
      if (confirmation !== null) alert('لم يتم التصفير لأن الكلمة غير متطابقة.');
      return;
    }

    setIsResettingDb(true);
    try {
      const res = await resetEntireSystemDataToProduction();
      if (res.success) {
        alert(res.message);
        window.location.reload();
      } else {
        alert(res.message);
      }
    } catch (e: any) {
      alert(e.message || 'حدث خطأ أثناء التصفير');
    } finally {
      setIsResettingDb(false);
    }
  };

  // Helper to check if an assessment is a Final Exam item vs Cumulative Coursework (السعي من 50)
  const isFinalAssessment = (asm: AssessmentStructure) => {
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

  // --- Course Logic ---
  const handleAddAssessmentToNewCourse = () => {
    if (!newAssessmentName || !newAssessmentScore) return;
    const scoreNum = parseFloat(newAssessmentScore);
    if (isNaN(scoreNum) || scoreNum <= 0) return;
    const newItem: AssessmentStructure = {
      id: `asm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: newAssessmentName.trim(),
      maxScore: scoreNum,
      date: newAssessmentDate || "",
      category: "CUMULATIVE",
    };
    setNewAssessments([...newAssessments, newItem]);
    setNewAssessmentName("");
    setNewAssessmentScore("");
    setNewAssessmentDate("");
  };

  const handleRemoveAssessmentFromNewCourse = (id: string) => {
    setNewAssessments(newAssessments.filter((a) => a.id !== id));
  };

  const handleAddProf = () => {
    if (tempProfName.trim()) {
      setCourseProfessors([...courseProfessors, tempProfName.trim()]);
      setTempProfName("");
    }
  };

  const handleRemoveProf = (idx: number) => {
    setCourseProfessors(courseProfessors.filter((_, i) => i !== idx));
  };

  const handleSaveCourse = async () => {
    if (!newCourseName.trim()) {
      alert("يرجى كتابة اسم المادة الدراسية");
      return;
    }

    const finalProfs =
      courseProfessors.length > 0
        ? courseProfessors
        : tempProfName.trim()
        ? [tempProfName.trim()]
        : ["غير محدد"];

    const courseData: Course = {
      id: editingCourseId || `course_${Date.now()}`,
      batchCode: effectiveBatchCode,
      name: newCourseName.trim(),
      professors: finalProfs,
      cumulativeMaxScore: 50,
      finalExamMaxScore: 50,
      assessments: newAssessments,
      code: `C${Date.now().toString().slice(-4)}`,
    };

    await saveCourseToFirestore(courseData);

    setIsAddingCourse(false);
    setEditingCourseId(null);
    setNewCourseName("");
    setCourseProfessors([]);
    setTempProfName("");
    setNewAssessments([]);
  };

  const handleSaveSimpleCourse = async () => {
    if (!newSimpleCourseName.trim() || !effectiveBatchCode) return;

    const courseData: Course = {
      id: `course_${Date.now()}`,
      batchCode: effectiveBatchCode,
      name: newSimpleCourseName.trim(),
      professors: simpleCourseProf.trim() ? [simpleCourseProf.trim()] : ["غير محدد"],
      cumulativeMaxScore: 50,
      finalExamMaxScore: 50,
      assessments: [],
      code: `C${Math.floor(100 + Math.random() * 899)}`,
    };

    await saveCourseToFirestore(courseData);
    setNewSimpleCourseName("");
    setSimpleCourseProf("");
  };

  const handleOpenCustomizeCourseGrades = (course: Course) => {
    setCustomizingCourseForGrades(course);
    // Keep only cumulative assessments in the customizable 50-point builder
    const cumulativeItems = (course.assessments || []).filter(
      (a) => !isFinalAssessment(a)
    );
    setCustomAssessmentsDraft(cumulativeItems);
    setCustomNewAsmName("");
    setCustomNewAsmScore("");
  };

  const handleAddDraftAssessment = (presetName?: string, presetScore?: number) => {
    const nameToUse = (presetName !== undefined ? presetName : customNewAsmName).trim();
    const scoreToUse =
      presetScore !== undefined ? presetScore : parseFloat(customNewAsmScore);

    if (!nameToUse || isNaN(scoreToUse) || scoreToUse <= 0) return;

    const currentSum = customAssessmentsDraft.reduce(
      (sum, item) => sum + Number(item.maxScore || 0),
      0
    );
    if (currentSum + scoreToUse > 50) {
      alert(
        `⚠️ مجموع تقسيم السعي التراكمي لا يمكن أن يتجاوز 50 درجة!\nالمجموع الحالي: ${currentSum} من 50 (المتبقي: ${Math.max(0, 50 - currentSum)} درجة).`
      );
      return;
    }

    const newItem: AssessmentStructure = {
      id: `asm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: nameToUse,
      maxScore: scoreToUse,
      category: "CUMULATIVE",
    };
    setCustomAssessmentsDraft((prev) => [...prev, newItem]);
    if (presetName === undefined) {
      setCustomNewAsmName("");
      setCustomNewAsmScore("");
    }
  };

  const handleUpdateDraftAssessment = (
    id: string,
    field: "name" | "maxScore",
    value: string
  ) => {
    setCustomAssessmentsDraft((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (field === "name") return { ...item, name: value };
        const num = value === "" ? 0 : Math.max(0, Math.min(50, parseFloat(value) || 0));
        return { ...item, maxScore: num };
      })
    );
  };

  const handleRemoveDraftAssessment = (id: string) => {
    setCustomAssessmentsDraft((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveCustomCourseAssessments = async () => {
    if (!customizingCourseForGrades) return;

    const cleanedAssessments = customAssessmentsDraft
      .filter((a) => a.name.trim() !== "" && Number(a.maxScore) > 0)
      .map((a) => ({
        ...a,
        name: a.name.trim(),
        maxScore: Number(a.maxScore),
        category: "CUMULATIVE" as const,
      }));

    const totalAllocated = cleanedAssessments.reduce(
      (acc, a) => acc + a.maxScore,
      0
    );

    if (totalAllocated > 50) {
      alert(
        `⚠️ مجموع درجات السعي التراكمي الموزعة هو (${totalAllocated}) وهو أكبر من 50 درجة! يرجى تعديل الدرجات بحيث لا تتجاوز 50.`
      );
      return;
    }

    const updatedCourse: Course = {
      ...customizingCourseForGrades,
      cumulativeMaxScore: 50,
      finalExamMaxScore: 50,
      assessments: cleanedAssessments,
    };

    await saveCourseToFirestore(updatedCourse);
    setCustomizingCourseForGrades(null);
    setCustomAssessmentsDraft([]);
  };

  const handleOpenCourseGradeSheet = (course: Course) => {
    const cumulativeItems = (course.assessments || []).filter(
      (a) => !isFinalAssessment(a)
    );
    if (cumulativeItems.length === 0) {
      handleOpenCustomizeCourseGrades(course);
      return;
    }

    const draft: { [key: string]: number | "" } = {};
    grades
      .filter((g) => g.courseId === course.id)
      .forEach((g) => {
        draft[`${g.studentId}__${g.assessmentId}`] = g.score;
      });
    setMatrixGradesDraft(draft);
    setGradeEditorSearch("");
    setViewingCourseGradeSheet(course);
  };

  const handleSaveMatrixGrades = async () => {
    if (!viewingCourseGradeSheet) return;
    setIsSavingMatrixGrades(true);
    try {
      const courseId = viewingCourseGradeSheet.id;
      const cumulativeItems = (viewingCourseGradeSheet.assessments || []).filter(
        (a) => !isFinalAssessment(a)
      );
      const batchStudents = appUsers.filter((u) => {
        if (u.role === UserRole.OWNER) return false;
        if (u.excludeFromStats) return false;
        if (u.batchCode === effectiveBatchCode) return true;
        if (u.isOfficial && (!u.batchCode || u.batchCode === effectiveBatchCode))
          return true;
        return false;
      });

      for (const student of batchStudents) {
        for (const asm of cumulativeItems) {
          const key = `${student.uid}__${asm.id}`;
          const val = matrixGradesDraft[key];
          const existing = grades.find(
            (g) =>
              g.courseId === courseId &&
              g.studentId === student.uid &&
              g.assessmentId === asm.id
          );

          if (val === "" || val === undefined) {
            if (existing) {
              await deleteGradeFromFirestore(existing.id);
            }
          } else {
            const numericScore = Math.max(
              0,
              Math.min(asm.maxScore, Number(val))
            );
            if (!existing || existing.score !== numericScore) {
              const gradeObj: Grade = {
                id: existing
                  ? existing.id
                  : `grade_${asm.id}_${student.uid}`,
                batchCode: effectiveBatchCode,
                studentId: student.uid,
                courseId,
                assessmentId: asm.id,
                score: numericScore,
                timestamp: Date.now(),
              };
              await saveGradeToFirestore(gradeObj);
            }
          }
        }
      }

      setViewingCourseGradeSheet(null);
    } catch (err) {
      console.error("Error saving matrix grades:", err);
      alert("حدث خطأ أثناء حفظ كشف درجات السعي");
    } finally {
      setIsSavingMatrixGrades(false);
    }
  };

  const handleStartEditCourse = (course: Course) => {
    setEditingCourse(course);
    setEditCourseName(course.name);
    setEditCourseProf(course.professors?.join("، ") || "");
  };

  const handleSaveEditedCourse = async () => {
    if (!editingCourse || !editCourseName.trim()) {
      alert("يرجى إدخال اسم المادة الدراسية");
      return;
    }

    const trimmedName = editCourseName.trim();
    const profs = editCourseProf.trim()
      ? editCourseProf
          .split(/[،,]/)
          .map((p) => p.trim())
          .filter(Boolean)
      : editingCourse.professors && editingCourse.professors.length > 0
      ? editingCourse.professors
      : ["غير محدد"];

    const updatedCourse: Course = {
      ...editingCourse,
      name: trimmedName,
      professors: profs,
    };

    await saveCourseToFirestore(updatedCourse);

    // Update activeMatCourse if currently open
    if (activeMatCourse && activeMatCourse.id === editingCourse.id) {
      setActiveMatCourse(updatedCourse);
    }

    // Propagate to existing lecture schedules
    const matchingSchedules = schedules.filter(
      (s) => s.courseName === editingCourse.name || s.courseId === editingCourse.id
    );
    for (const sched of matchingSchedules) {
      await saveScheduleToFirestore({
        ...sched,
        courseName: trimmedName,
        courseId: editingCourse.id,
        professor: profs[0] || sched.professor,
      });
    }

    // Propagate to assignments
    const matchingAssignments = assignments.filter(
      (a) => a.courseId === editingCourse.id || a.courseName === editingCourse.name
    );
    for (const assign of matchingAssignments) {
      await saveAssignmentToFirestore({
        ...assign,
        courseName: trimmedName,
      });
    }

    // Propagate to projects
    const matchingProjects = projects.filter(
      (p) => p.courseId === editingCourse.id || p.courseName === editingCourse.name
    );
    for (const proj of matchingProjects) {
      await saveProjectToFirestore({
        ...proj,
        courseName: trimmedName,
      });
    }

    // Propagate to announcements
    const matchingAnnouncements = announcements.filter(
      (a) => a.courseId === editingCourse.id || a.courseName === editingCourse.name
    );
    for (const ann of matchingAnnouncements) {
      await saveAnnouncementToFirestore({
        ...ann,
        courseName: trimmedName,
      });
    }

    setEditingCourse(null);
    setEditCourseName("");
    setEditCourseProf("");
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه المادة؟")) return;
    await deleteCourseFromFirestore(courseId);
  };

  const handleSaveStorageConfig = async () => {
    const cleanCloudName = extractCloudinaryCloudName(tempCloudName);
    if (!cleanCloudName) {
      return;
    }
    const cfg: StorageConfig = {
      ...storageConfig,
      cloudinaryCloudName: cleanCloudName,
      cloudinaryUploadPreset: tempUploadPreset.trim(),
      cloudinaryApiKey: DEFAULT_CLOUDINARY_API_KEY,
      cloudinaryApiSecret: DEFAULT_CLOUDINARY_API_SECRET,
    };
    await saveStorageConfig(cfg);
    setStorageConfig(cfg);
    setTempCloudName(cleanCloudName);
    setIsConfiguringStorage(false);
  };

  const handleDownloadMaterial = (mat: Material) => {
    // 1. If original fileName was saved (e.g. "lecture1.docx" or "chapter2.pdf"), use its extension with mat.title
    if (mat.fileName) {
      const extMatch = mat.fileName.match(/\.([a-zA-Z0-9]{2,5})$/);
      if (extMatch) {
        const ext = extMatch[1].toLowerCase();
        const titleHasExt = mat.title.toLowerCase().endsWith(`.${ext}`);
        downloadFile(mat.url, titleHasExt ? mat.title : `${mat.title}.${ext}`);
        return;
      }
    }

    // 2. Check if URL itself has a clear file extension (.pdf, .docx, .pptx, etc.)
    const cleanUrl = mat.url.split("?")[0].split("#")[0];
    const urlExtMatch = cleanUrl.match(/\.([a-zA-Z0-9]{2,5})$/);
    if (urlExtMatch) {
      const ext = urlExtMatch[1].toLowerCase();
      const titleHasExt = mat.title.toLowerCase().endsWith(`.${ext}`);
      downloadFile(mat.url, titleHasExt ? mat.title : `${mat.title}.${ext}`);
      return;
    }

    // 3. Fallback by material type
    if (mat.type === "IMAGE") {
      downloadFile(mat.url, `${mat.title}.jpg`);
    } else if (mat.type === "PDF") {
      downloadFile(mat.url, `${mat.title}.pdf`);
    } else if (
      mat.url.startsWith("http") &&
      !mat.url.includes("cloudinary.com") &&
      !mat.url.startsWith("dafaaty-cloud://")
    ) {
      window.open(mat.url, "_blank", "noopener,noreferrer");
    } else {
      downloadFile(mat.url, mat.title);
    }
  };

  // --- Direct Device File Upload Handlers ---
  const handleMaterialFilePick = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!newMatTitle.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      setNewMatTitle(cleanName);
    }

    setIsUploadingMaterial(true);
    setUploadProgress(0);
    try {
      const result = await uploadFileToStorage(
        file,
        storageConfig,
        (pct) => setUploadProgress(pct),
        "materials"
      );
      setNewMatUrl(result.url);
      setNewMatType(result.type === "IMAGE" ? "IMAGE" : "PDF");
      setLastUploadedDriveInfo({
        fileName: file.name,
        driveFileId: result.driveFileId,
        driveViewUrl: result.previewUrl || result.url,
        directDownloadUrl: result.directDownloadUrl,
        fileSize: result.formattedSize,
      });
    } catch (err: any) {
      console.error("Material upload error:", err);
      alert(err.message || "حدث خطأ أثناء رفع الملف من الجهاز");
    } finally {
      setIsUploadingMaterial(false);
      setUploadProgress(0);
      if (materialFileInputRef.current) {
        materialFileInputRef.current.value = "";
      }
    }
  };

  const handleAssignFilePick = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAssignFile(true);
    try {
      if (file.type.startsWith("image/")) {
        setNewAssignAttachmentType("image");
        const compressed = await compressImage(file, {
          maxWidth: 1000,
          maxHeight: 1000,
          quality: 0.75,
        });
        setNewAssignAttachmentUrl(compressed);
      } else {
        setNewAssignAttachmentType("file");
        if (file.size > 850 * 1024) {
          alert(
            "تنبيه: حجم الملف كبير. يفضل رفع ملفات أقل من 850 كيلوبايت أو مشاركة رابط خارجي للملفات الكبيرة."
          );
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          setNewAssignAttachmentUrl(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error("Assign file error:", err);
    } finally {
      setIsUploadingAssignFile(false);
    }
  };

  const handleAnnouncementFilePick = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAnnouncementFile(true);
    try {
      if (file.type.startsWith("image/")) {
        setNewAnnouncementMediaType("image");
        const compressed = await compressImage(file, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.75,
        });
        setNewAnnouncementMediaUrl(compressed);
      } else if (file.type.startsWith("video/")) {
        setNewAnnouncementMediaType("video");
        if (file.size > 850 * 1024) {
          alert(
            "تنبيه: حجم الفيديو كبير جداً للتخزين المباشر. يفضل استخدام رابط فيديو خارجي مثل Google Drive أو YouTube."
          );
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          setNewAnnouncementMediaUrl(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error("Announcement media error:", err);
    } finally {
      setIsUploadingAnnouncementFile(false);
    }
  };

  // --- Grades Logic ---
  const handleOpenGradeEditor = (
    course: Course,
    assessment: AssessmentStructure,
  ) => {
    setSelectedCourseForGrading(course);
    setSelectedAssessmentForGrading(assessment);
    setGradeEditorSearch("");

    const currentGradesMap: { [id: string]: number } = {};
    grades
      .filter((g) => g.assessmentId === assessment.id)
      .forEach((g) => {
        currentGradesMap[g.studentId] = g.score;
      });
    setTempGrades(currentGradesMap);
    setIsEditingGrades(true);
  };

  const handleSaveGrades = async () => {
    if (!selectedCourseForGrading || !selectedAssessmentForGrading) return;

    const existingForAssessment = grades.filter(
      (g) => g.assessmentId === selectedAssessmentForGrading.id
    );

    // Delete any grade that was cleared
    for (const oldG of existingForAssessment) {
      if (tempGrades[oldG.studentId] === undefined) {
        await deleteGradeFromFirestore(oldG.id);
      }
    }

    for (const [studentId, score] of Object.entries(tempGrades)) {
      const existingGrade = existingForAssessment.find(
        (g) => g.studentId === studentId
      );
      const numericScore = Math.max(
        0,
        Math.min(selectedAssessmentForGrading.maxScore, Number(score))
      );
      const gradeData: Grade = {
        id: existingGrade
          ? existingGrade.id
          : `grade_${selectedAssessmentForGrading.id}_${studentId}`,
        batchCode: effectiveBatchCode,
        studentId,
        courseId: selectedCourseForGrading.id,
        assessmentId: selectedAssessmentForGrading.id,
        score: numericScore,
        timestamp: Date.now(),
      };
      await saveGradeToFirestore(gradeData);
    }

    setIsEditingGrades(false);
    setSelectedCourseForGrading(null);
    setSelectedAssessmentForGrading(null);
  };

  // --- Attendance Logic ---
  const handleCopyAttendanceFromSession = async (
    sourceSessionId: string,
    targetSessId?: string
  ) => {
    const destSessionId = targetSessId || selectedSessionId;
    if (!destSessionId || !sourceSessionId) return;

    const sourceRecords = attendanceRecords.filter(
      (r) => r.sessionId === sourceSessionId
    );
    if (sourceRecords.length === 0) return;

    setIsCopyingAttendance(true);
    try {
      const sourceSession = attendanceSessions.find((s) => s.id === sourceSessionId);
      const sourceCourse = courses.find((c) => c.id === sourceSession?.courseId);

      const validStudentIds = new Set(
        appUsers
          .filter((u) => {
            if (u.role === UserRole.OWNER) return false;
            if (u.excludeFromStats) return false;
            if (u.batchCode === effectiveBatchCode) return true;
            if (u.isOfficial && (!u.batchCode || u.batchCode === effectiveBatchCode)) return true;
            return false;
          })
          .map((u) => u.uid)
      );

      const promises = sourceRecords
        .filter((srcRec) => validStudentIds.has(srcRec.studentId))
        .map((srcRec) => {
          const existingRecord = attendanceRecords.find(
            (r) =>
              r.sessionId === destSessionId &&
              r.studentId === srcRec.studentId
          );
          const recData: AttendanceRecord = {
            id: existingRecord
              ? existingRecord.id
              : `rec_${Date.now()}_${srcRec.studentId}`,
            batchCode: effectiveBatchCode,
            sessionId: destSessionId,
            studentId: srcRec.studentId,
            status: srcRec.status,
            timestamp: Date.now(),
          };
          return saveAttendanceRecordToFirestore(recData);
        });

      await Promise.all(promises);
      setCopyAttendanceSuccess(
        `تم نسخ نفس الحضور والغيابات (${promises.length} طالب) من "${sourceSession?.title || "المحاضرة السابقة"}" ${sourceCourse ? `(${sourceCourse.name})` : ""} بنجاح! ⚡`
      );
      setTimeout(() => setCopyAttendanceSuccess(null), 5000);
    } catch (err) {
      console.error("Error copying attendance:", err);
    } finally {
      setIsCopyingAttendance(false);
    }
  };

  const handleCreateSession = async (autoCopyFromSessionId?: string) => {
    if (!selectedCourseForAttendance || !newSessionDate) return;

    const newSession: AttendanceSession = {
      id: `session_${Date.now()}`,
      batchCode: effectiveBatchCode,
      courseId: selectedCourseForAttendance.id,
      date: newSessionDate,
      title: newSessionTitle || `محاضرة ${newSessionDate}`,
      createdBy: currentUser?.uid || "admin",
      timestamp: Date.now(),
    };

    await saveAttendanceSessionToFirestore(newSession);
    setSelectedSessionId(newSession.id);
    if (autoCopyFromSessionId) {
      await handleCopyAttendanceFromSession(autoCopyFromSessionId, newSession.id);
    }
    setNewSessionDate(new Date().toISOString().slice(0, 10));
    setNewSessionTitle("");
    setIsAddingSession(false);
  };

  const handleDeleteSession = async (sessionId: string) => {
    await deleteAttendanceSessionFromFirestore(sessionId);
    if (selectedSessionId === sessionId) setSelectedSessionId(null);
  };

  const handleMarkAttendance = async (
    studentId: string,
    status: 'PRESENT' | 'ABSENT' | 'EXCUSED',
  ) => {
    if (!selectedSessionId) return;

    const existingRecord = attendanceRecords.find(
      (r) => r.sessionId === selectedSessionId && r.studentId === studentId,
    );
    const recData: AttendanceRecord = {
      id: existingRecord ? existingRecord.id : `rec_${Date.now()}_${studentId}`,
      batchCode: effectiveBatchCode,
      sessionId: selectedSessionId,
      studentId,
      status,
      timestamp: Date.now(),
    };
    await saveAttendanceRecordToFirestore(recData);
  };

  const handleBulkMarkAttendance = async (
    status: 'PRESENT' | 'ABSENT' | 'EXCUSED',
    targetStudents: User[]
  ) => {
    if (!selectedSessionId) return;
    await Promise.all(
      targetStudents.map((student) => {
        const existingRecord = attendanceRecords.find(
          (r) => r.sessionId === selectedSessionId && r.studentId === student.uid,
        );
        const recData: AttendanceRecord = {
          id: existingRecord ? existingRecord.id : `rec_${Date.now()}_${student.uid}`,
          batchCode: effectiveBatchCode,
          sessionId: selectedSessionId,
          studentId: student.uid,
          status,
          timestamp: Date.now(),
        };
        return saveAttendanceRecordToFirestore(recData);
      })
    );
  };

  // --- Materials Logic ---
  const handleAddMaterialSection = async () => {
    if (!newSectionName || !activeMatCourse) return;
    const newSection: MaterialSection = {
      id: `section_${Date.now()}`,
      batchCode: effectiveBatchCode,
      courseId: activeMatCourse.id,
      title: newSectionName,
      icon: newSectionCategory === "QUESTIONS_BANK" ? "ARCHIVE" : "FOLDER",
      category: newSectionCategory,
    };
    await saveMaterialSectionToFirestore(newSection);
    setNewSectionName("");
    setNewSectionCategory("LECTURES");
    setIsAddingSection(false);
  };

  const handleToggleStudiedMaterial = async (materialId: string) => {
    if (!currentUser) return;
    const currentList = currentUser.studiedMaterialIds || [];
    const exists = currentList.includes(materialId);
    const updatedList = exists
      ? currentList.filter((id) => id !== materialId)
      : [...currentList, materialId];
    const updatedUser: User = {
      ...currentUser,
      studiedMaterialIds: updatedList,
    };
    setCurrentUser(updatedUser);
    await saveUserToFirestore(updatedUser);
  };

  const handleToggleBookmarkMaterial = async (materialId: string) => {
    if (!currentUser) return;
    const currentList = currentUser.bookmarkedMaterialIds || [];
    const exists = currentList.includes(materialId);
    const updatedList = exists
      ? currentList.filter((id) => id !== materialId)
      : [...currentList, materialId];
    const updatedUser: User = {
      ...currentUser,
      bookmarkedMaterialIds: updatedList,
    };
    setCurrentUser(updatedUser);
    await saveUserToFirestore(updatedUser);
  };

  const handleDeleteSection = async (sectionId: string) => {
    await deleteMaterialSectionFromFirestore(sectionId);
  };

  const handleAddMaterialItem = async () => {
    if (!newMatTitle || !newMatUrl || !activeMatSection || !activeMatCourse)
      return;
    const newMaterial: Material = {
      id: `mat_${Date.now()}`,
      batchCode: effectiveBatchCode,
      courseId: activeMatCourse.id,
      sectionId: activeMatSection.id,
      title: newMatTitle,
      type: newMatType,
      url: newMatUrl,
      uploadDate: new Date().toISOString(),
      ...(lastUploadedDriveInfo?.fileName
        ? { fileName: lastUploadedDriveInfo.fileName }
        : {}),
      ...(lastUploadedDriveInfo?.driveFileId
        ? { driveFileId: lastUploadedDriveInfo.driveFileId }
        : {}),
      ...(lastUploadedDriveInfo?.driveViewUrl
        ? { driveViewUrl: lastUploadedDriveInfo.driveViewUrl }
        : {}),
      ...(lastUploadedDriveInfo?.directDownloadUrl
        ? { driveDownloadUrl: lastUploadedDriveInfo.directDownloadUrl }
        : {}),
      ...(lastUploadedDriveInfo?.fileSize
        ? { fileSize: lastUploadedDriveInfo.fileSize }
        : {}),
    };
    await saveMaterialToFirestore(newMaterial);
    setNewMatTitle("");
    setNewMatUrl("");
    setLastUploadedDriveInfo(null);
    setIsAddingMaterial(false);
  };

  const handleDeleteMaterialItem = async (matId: string) => {
    const mat = materials.find((m) => m.id === matId);
    if (!mat) return;
    const confirmed = window.confirm(`هل أنت متأكد من حذف الملف "${mat.title}"؟`);
    if (!confirmed) return;

    if (mat.driveFileId) {
      try {
        await deleteFileFromGoogleDrive(mat.driveFileId, mat.title);
      } catch (err) {
        console.warn("Could not delete from Google Drive:", err);
      }
    }
    await deleteMaterialFromFirestore(matId);
  };

  const handleAddAnnouncement = async () => {
    if (!newAnnouncementTitle || !newAnnouncementContent || !currentUser)
      return;
    
    const selectedCourse = courses.find(c => c.id === newAnnouncementCourse);

    const validPollOptions = newPollOptions
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    const hasValidPoll =
      newAnnouncementHasPoll &&
      newPollQuestion.trim().length > 0 &&
      validPollOptions.length >= 2;
    
    const newAnnouncement: Announcement = {
      id: `ann_${Date.now()}`,
      batchCode: effectiveBatchCode,
      title: newAnnouncementTitle,
      content: newAnnouncementContent,
      timestamp: Date.now(),
      authorId: currentUser.uid,
      authorName: currentUser.name,
      priority: newAnnouncementPriority,
      isPinned: newAnnouncementPinned,
      ...(hasValidPoll
        ? {
            poll: {
              question: newPollQuestion.trim(),
              options: validPollOptions.map((optText, idx) => ({
                id: `opt_${idx}_${Date.now()}`,
                text: optText,
                votes: [],
              })),
            },
          }
        : {}),
      ...(newAnnouncementCourse ? { courseId: newAnnouncementCourse } : {}),
      ...(selectedCourse?.name ? { courseName: selectedCourse.name } : {}),
      ...(newAnnouncementMediaUrl ? { mediaUrl: newAnnouncementMediaUrl, mediaType: newAnnouncementMediaType } : {}),
      attachments: [],
    };
    await saveAnnouncementToFirestore(newAnnouncement);
    setIsAddingAnnouncement(false);
    setNewAnnouncementTitle("");
    setNewAnnouncementContent("");
    setNewAnnouncementPriority("normal");
    setNewAnnouncementPinned(false);
    setNewAnnouncementHasPoll(false);
    setNewPollQuestion("");
    setNewPollOptions(["", ""]);
    setNewAnnouncementCourse("");
    setNewAnnouncementMediaUrl("");
  };

  const handleTogglePinAnnouncement = async (ann: Announcement) => {
    await saveAnnouncementToFirestore({
      ...ann,
      isPinned: !ann.isPinned,
    });
  };

  const handleVoteAnnouncementPoll = async (ann: Announcement, optionId: string) => {
    if (!currentUser || !ann.poll) return;
    const uid = currentUser.uid;

    const updatedOptions = ann.poll.options.map((opt) => {
      const currentVotes = opt.votes || [];
      if (opt.id === optionId) {
        // Toggle if already voted for this option, otherwise add vote
        const alreadyVotedThis = currentVotes.includes(uid);
        return {
          ...opt,
          votes: alreadyVotedThis
            ? currentVotes.filter((v) => v !== uid)
            : [...currentVotes.filter((v) => v !== uid), uid],
        };
      } else {
        // Remove user's vote from other options (single choice per user)
        return {
          ...opt,
          votes: currentVotes.filter((v) => v !== uid),
        };
      }
    });

    await saveAnnouncementToFirestore({
      ...ann,
      poll: {
        ...ann.poll,
        options: updatedOptions,
      },
    });
  };

  const handleDeleteAnnouncement = async (id: string) => {
    await deleteAnnouncementFromFirestore(id);
  };

  // --- Project & Group Management Handlers ---
  const handleOpenAddProject = () => {
    setEditingProject(null);
    setNewProjectTitle("");
    setNewProjectCourseId(courses.length > 0 ? courses[0].id : "");
    setNewProjectDesc("");
    setNewProjectDeadline("");
    setIsAddingProject(true);
  };

  const handleOpenEditProject = (project: CourseProject) => {
    setEditingProject(project);
    setNewProjectTitle(project.title);
    setNewProjectCourseId(project.courseId);
    setNewProjectDesc(project.description || "");
    setNewProjectDeadline(project.deadline || "");
    setIsAddingProject(true);
  };

  const handleSaveProject = async () => {
    if (!newProjectTitle.trim() || !newProjectCourseId || !effectiveBatchCode) {
      alert("يرجى إدخال اسم المشروع واختيار المادة");
      return;
    }

    const selectedCourse = courses.find((c) => c.id === newProjectCourseId);

    const project: CourseProject = {
      id: editingProject ? editingProject.id : `proj_${Date.now()}`,
      batchCode: effectiveBatchCode,
      title: newProjectTitle.trim(),
      courseId: newProjectCourseId,
      courseName: selectedCourse?.name || "مادة غير محددة",
      groups: editingProject ? editingProject.groups : [],
      ...(editingProject?.projectFiles ? { projectFiles: editingProject.projectFiles } : {}),
      createdAt: editingProject ? editingProject.createdAt : Date.now(),
      createdBy: currentUser?.name || "الممثل",
      ...(newProjectDesc.trim() ? { description: newProjectDesc.trim() } : {}),
      ...(newProjectDeadline.trim() ? { deadline: newProjectDeadline.trim() } : {}),
    };

    await saveProjectToFirestore(project);
    setIsAddingProject(false);
    setEditingProject(null);
    setNewProjectTitle("");
    setNewProjectCourseId("");
    setNewProjectDesc("");
    setNewProjectDeadline("");
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المشروع بجميع مجموعاته؟")) return;
    await deleteProjectFromFirestore(id);
  };

  const handleTriggerProjectFileUpload = (projectId: string, groupId?: string) => {
    setProjectUploadTarget({ projectId, groupId });
    if (projectFileInputRef.current) {
      projectFileInputRef.current.value = "";
      projectFileInputRef.current.click();
    }
  };

  const handleProjectFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectUploadTarget || !currentUser) return;

    const targetProject = projects.find((p) => p.id === projectUploadTarget.projectId);
    if (!targetProject) return;

    const targetKey = projectUploadTarget.groupId
      ? `${projectUploadTarget.projectId}_${projectUploadTarget.groupId}`
      : `${projectUploadTarget.projectId}_general`;

    setUploadingProjectTargetKey(targetKey);
    setProjectUploadProgress(5);

    try {
      const result = await uploadFileToStorage(
        file,
        storageConfig,
        (pct) => setProjectUploadProgress(pct),
        "projects"
      );

      const newFileItem: ProjectFileItem = {
        id: `pfile_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: file.name.replace(/\.[^/.]+$/, "") || file.name,
        fileName: result.name || file.name,
        url: result.directDownloadUrl || result.url,
        ...(result.formattedSize ? { fileSize: result.formattedSize } : {}),
        uploadedByUid: currentUser.uid,
        uploadedByName: currentUser.name,
        uploadedAt: Date.now(),
        type: result.type === "IMAGE" ? "IMAGE" : "PDF",
      };

      if (projectUploadTarget.groupId) {
        const updatedGroups = (targetProject.groups || []).map((g) => {
          if (g.id !== projectUploadTarget.groupId) return g;
          return {
            ...g,
            files: [...(g.files || []), newFileItem],
          };
        });
        await saveProjectToFirestore({
          ...targetProject,
          groups: updatedGroups,
        });
      } else {
        await saveProjectToFirestore({
          ...targetProject,
          projectFiles: [...(targetProject.projectFiles || []), newFileItem],
        });
      }
    } catch (err: any) {
      console.error("Project file upload error:", err);
      alert(err?.message || "تعذر رفع ملف المشروع، يرجى المحاولة مرة أخرى.");
    } finally {
      setUploadingProjectTargetKey(null);
      setProjectUploadProgress(0);
      setProjectUploadTarget(null);
      e.target.value = "";
    }
  };

  const handleDeleteProjectFile = async (
    project: CourseProject,
    fileId: string,
    groupId?: string
  ) => {
    if (!confirm("هل أنت متأكد من حذف هذا الملف؟")) return;

    if (groupId) {
      const updatedGroups = (project.groups || []).map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          files: (g.files || []).filter((f) => f.id !== fileId),
        };
      });
      await saveProjectToFirestore({
        ...project,
        groups: updatedGroups,
      });
    } else {
      await saveProjectToFirestore({
        ...project,
        projectFiles: (project.projectFiles || []).filter((f) => f.id !== fileId),
      });
    }
  };

  const handleDownloadProjectFile = (fileItem: ProjectFileItem) => {
    const downloadName = fileItem.fileName || `${fileItem.title}.pdf`;
    downloadFile(fileItem.url, downloadName);
  };

  const handleDownloadAllProjectFiles = async (project: CourseProject) => {
    const allItems: { url: string; name: string }[] = [];

    (project.projectFiles || []).forEach((f) => {
      allItems.push({
        url: f.url,
        name: `${project.title} - ${f.fileName || f.title}`,
      });
    });

    (project.groups || []).forEach((g) => {
      (g.files || []).forEach((f) => {
        allItems.push({
          url: f.url,
          name: `${g.name} - ${f.fileName || f.title}`,
        });
      });
    });

    if (allItems.length === 0) return;

    for (let i = 0; i < allItems.length; i++) {
      await downloadFile(allItems[i].url, allItems[i].name);
      await new Promise((r) => setTimeout(r, 450));
    }
  };

  const handleOpenAddGroup = (project: CourseProject) => {
    setTargetProjectForGroup(project);
    setEditingGroupId(null);
    setNewGroupName(`المجموعة ${project.groups.length + 1}`);
    setNewGroupDesc("");
    setNewGroupMembers([]);
    setNewGroupLeaderId("");
    setGroupMemberSearch("");
    setGroupMemberFilter("all");
    setIsAddingGroup(true);
  };

  const handleOpenEditGroup = (project: CourseProject, group: ProjectGroupItem) => {
    setTargetProjectForGroup(project);
    setEditingGroupId(group.id);
    setNewGroupName(group.name);
    setNewGroupDesc(group.description || "");
    setNewGroupMembers([...group.members]);
    setNewGroupLeaderId(group.leaderId || (group.members.length > 0 ? group.members[0] : ""));
    setGroupMemberSearch("");
    setGroupMemberFilter("all");
    setIsAddingGroup(true);
  };

  const handleToggleGroupMember = (uid: string) => {
    if (newGroupMembers.includes(uid)) {
      const updated = newGroupMembers.filter((m) => m !== uid);
      setNewGroupMembers(updated);
      if (newGroupLeaderId === uid) {
        setNewGroupLeaderId(updated.length > 0 ? updated[0] : "");
      }
    } else {
      const updated = [...newGroupMembers, uid];
      setNewGroupMembers(updated);
      if (!newGroupLeaderId) {
        setNewGroupLeaderId(uid);
      }
    }
  };

  const handleSaveGroup = async () => {
    if (!targetProjectForGroup || !newGroupName.trim()) {
      alert("يرجى إدخال اسم الكروب");
      return;
    }

    const existingGroup = editingGroupId
      ? targetProjectForGroup.groups.find((g) => g.id === editingGroupId)
      : undefined;

    const groupItem: ProjectGroupItem = {
      id: editingGroupId || `grp_${Date.now()}`,
      name: newGroupName.trim(),
      members: newGroupMembers,
      createdAt: existingGroup ? existingGroup.createdAt : Date.now(),
      ...(existingGroup?.files ? { files: existingGroup.files } : {}),
      ...(newGroupDesc.trim() ? { description: newGroupDesc.trim() } : {}),
      ...(newGroupLeaderId
        ? { leaderId: newGroupLeaderId }
        : newGroupMembers.length > 0
        ? { leaderId: newGroupMembers[0] }
        : {}),
    };

    let updatedGroups: ProjectGroupItem[];
    if (editingGroupId) {
      updatedGroups = targetProjectForGroup.groups.map((g) =>
        g.id === editingGroupId ? groupItem : g
      );
    } else {
      updatedGroups = [...targetProjectForGroup.groups, groupItem];
    }

    const updatedProject: CourseProject = {
      ...targetProjectForGroup,
      groups: updatedGroups,
    };

    await saveProjectToFirestore(updatedProject);
    setIsAddingGroup(false);
    setTargetProjectForGroup(null);
    setEditingGroupId(null);
  };

  const handleDeleteGroup = async (project: CourseProject, groupId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الكروب؟")) return;
    const updatedGroups = project.groups.filter((g) => g.id !== groupId);
    const updatedProject: CourseProject = {
      ...project,
      groups: updatedGroups,
    };
    await saveProjectToFirestore(updatedProject);
  };

  // --- Assignment Management Helpers & Handlers ---
  const getRemainingTimeInfo = (dueTimestamp: number) => {
    const diff = dueTimestamp - currentTimer;
    if (diff <= 0) {
      return {
        status: "expired" as const,
        text: "انتهى موعد التسليم",
        badgeClass: "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50",
      };
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 2) {
      return {
        status: "normal" as const,
        text: `متبقي ${days} أيام و ${hours} ساعة`,
        badgeClass: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50",
      };
    } else if (days >= 1) {
      return {
        status: "warning" as const,
        text: `متبقي يوم و ${hours} ساعة`,
        badgeClass: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50",
      };
    } else if (hours > 0) {
      return {
        status: "urgent" as const,
        text: `متبقي ${hours} ساعات و ${minutes} دقيقة ⚠️`,
        badgeClass: "bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50 animate-pulse",
      };
    } else {
      return {
        status: "critical" as const,
        text: `متبقي ${minutes} دقيقة فقط! 🚨`,
        badgeClass: "bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-300 border border-red-300 dark:border-red-800 animate-pulse",
      };
    }
  };

  const handleOpenAddAssignment = () => {
    setEditingAssignment(null);
    setNewAssignTitle("");
    setNewAssignCourseId(courses.length > 0 ? courses[0].id : "");
    setNewAssignDesc("");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 0, 0);
    const tzOffset = tomorrow.getTimezoneOffset() * 60000;
    const localISOTime = new Date(tomorrow.getTime() - tzOffset).toISOString().slice(0, 16);
    setNewAssignDueDate(localISOTime);
    setNewAssignNotify(false);
    setNewAssignAttachmentUrl("");
    setNewAssignAttachmentType("link");
    setIsAddingAssignment(true);
  };

  const handleOpenEditAssignment = (assign: Assignment) => {
    setEditingAssignment(assign);
    setNewAssignTitle(assign.title);
    setNewAssignCourseId(assign.courseId);
    setNewAssignDesc(assign.description || "");
    setNewAssignDueDate(assign.dueDate);
    setNewAssignNotify(false);
    if (assign.attachments && assign.attachments.length > 0) {
      setNewAssignAttachmentUrl(assign.attachments[0].url);
      setNewAssignAttachmentType(assign.attachments[0].type);
    } else {
      setNewAssignAttachmentUrl("");
      setNewAssignAttachmentType("link");
    }
    setIsAddingAssignment(true);
  };

  const handleSaveAssignment = async () => {
    if (!newAssignTitle.trim() || !newAssignCourseId || !newAssignDueDate || !effectiveBatchCode) {
      alert("يرجى إدخال عنوان الواجب، اختيار المادة، وتحديد موعد التسليم");
      return;
    }

    const selectedCourse = courses.find((c) => c.id === newAssignCourseId);
    const dueTimestamp = new Date(newAssignDueDate).getTime();

    const attachmentsList: AssignmentAttachment[] = [];
    if (newAssignAttachmentUrl.trim()) {
      attachmentsList.push({
        title: "مرفق الواجب",
        url: newAssignAttachmentUrl.trim(),
        type: newAssignAttachmentType,
      });
    }

    const assignment: Assignment = {
      id: editingAssignment ? editingAssignment.id : `assign_${Date.now()}`,
      batchCode: effectiveBatchCode,
      title: newAssignTitle.trim(),
      courseId: newAssignCourseId,
      courseName: selectedCourse?.name || "مادة غير محددة",
      dueDate: newAssignDueDate,
      dueTimestamp,
      completedBy: editingAssignment ? editingAssignment.completedBy || [] : [],
      createdAt: editingAssignment ? editingAssignment.createdAt : Date.now(),
      createdBy: currentUser?.name || "الممثل",
      ...(newAssignDesc.trim() ? { description: newAssignDesc.trim() } : {}),
      ...(attachmentsList.length > 0 ? { attachments: attachmentsList } : {}),
    };

    await saveAssignmentToFirestore(assignment);

    // If notification toggle was checked, automatically post to Announcements
    if (newAssignNotify && !editingAssignment && currentUser) {
      const formattedDue = new Date(dueTimestamp).toLocaleString("ar-EG", {
        weekday: "long",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const annContent = `تمت إضافة تكليف / واجب جديد لمادة ${selectedCourse?.name || ""}.\n\n📅 موعد التسليم النهائي: ${formattedDue}\n\n${newAssignDesc.trim()}`;

      const ann: Announcement = {
        id: `ann_${Date.now()}`,
        batchCode: effectiveBatchCode,
        title: `📝 واجب جديد: ${newAssignTitle.trim()}`,
        content: annContent,
        timestamp: Date.now(),
        authorId: currentUser.uid,
        authorName: currentUser.name,
        priority: "high",
        courseId: newAssignCourseId,
        courseName: selectedCourse?.name,
        ...(newAssignAttachmentUrl.trim()
          ? { mediaUrl: newAssignAttachmentUrl.trim(), mediaType: newAssignAttachmentType }
          : {}),
        attachments: [],
      };
      await saveAnnouncementToFirestore(ann);
    }

    setIsAddingAssignment(false);
    setEditingAssignment(null);
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الواجب؟")) return;
    await deleteAssignmentFromFirestore(id);
  };

  const handleToggleAssignmentDone = async (assign: Assignment) => {
    if (!currentUser) return;
    const currentCompleted = assign.completedBy || [];
    const isDone = currentCompleted.includes(currentUser.uid);
    const updatedCompleted = isDone
      ? currentCompleted.filter((uid) => uid !== currentUser.uid)
      : [...currentCompleted, currentUser.uid];

    const updatedAssign: Assignment = {
      ...assign,
      completedBy: updatedCompleted,
    };
    await saveAssignmentToFirestore(updatedAssign);
  };

  const handleSaveExam = async (exam: Exam) => {
    await saveExamToFirestore(exam);
    // Send notification to batch students
    const targetStudents = appUsers.filter(
      (u) => u.batchCode === effectiveBatchCode && u.uid !== currentUser?.uid
    );
    for (const st of targetStudents) {
      await saveNotificationToFirestore({
        id: `notif_${Date.now()}_${st.uid.slice(0, 5)}`,
        userId: st.uid,
        title: `موعد امتحان جديد 🎓: ${exam.title}`,
        content: `تم تحديد موعد امتحان لمادة (${exam.courseName}) بتاريخ ${new Date(exam.examTimestamp).toLocaleDateString('ar-IQ', { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}. شريط العد التنازلي يعمل الآن لمتابعة المتبقي.`,
        timestamp: Date.now(),
        isRead: false,
        type: 'ANNOUNCEMENT',
      });
    }
  };

  const handleDeleteExam = async (id: string) => {
    await deleteExamFromFirestore(id);
  };

  // --- Views Copy/Paste from previous with minor adjustments if needed ---
  // The Render functions remain almost identical as they use the state variables which are now populated by Firebase

  const renderHome = () => {
    return (
      <div className="space-y-6 p-4">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-200 dark:shadow-none relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">
              مرحباً، {currentUser?.name} 👋
            </h1>
            <p className="opacity-90 text-lg">
              أهلاً بك في منصة دفعتي، كل ما تحتاجه في مكان واحد.
            </p>
          </div>
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
            </svg>
          </div>
        </div>

        {/* Live Countdown Strip for Assignments, Exams & Projects */}
        <LiveCountdownStrip
          assignments={assignments}
          projects={projects}
          exams={exams}
          courses={courses}
          currentUser={currentUser}
          isManager={isManager}
          onNavigateTab={setActiveTab}
          onSaveExam={handleSaveExam}
          onDeleteExam={handleDeleteExam}
          onToggleCompleteAssignment={async (id) => {
            const a = assignments.find((x) => x.id === id);
            if (a) await handleToggleAssignmentDone(a);
          }}
        />

        {/* Quick Competition & Leaderboard Banner on Home */}
        <div
          onClick={() => setActiveTab(Tab.LEADERBOARD)}
          className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-5 text-white shadow-lg shadow-orange-500/15 cursor-pointer hover:scale-[1.005] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden group"
        >
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shrink-0 group-hover:rotate-6 transition">
              <Trophy size={26} className="text-yellow-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-white">
                  ساحة المنافسة ولوحة شرف الدفعة 🏆🔥
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/25 text-white">
                  جديد ✨
                </span>
              </div>
              <p className="text-xs text-white/90 mt-0.5">
                اكتشف من يتصدر الدفعة في السعي التراكمي، الحضور، درجات الكويزات، ومن في صدارة الغيابات 😅!
              </p>
            </div>
          </div>

          <button
            type="button"
            className="relative z-10 bg-white text-orange-600 hover:bg-orange-50 px-4 py-2.5 rounded-2xl text-xs font-black shadow-md transition flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-center"
          >
            <span>عرض الترتيب والمنافسة</span>
            <ArrowRight size={15} className="rtl:rotate-180" />
          </button>
        </div>

        {/* Upcoming Assignments Preview Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Clock className="text-amber-500" size={24} />
                الواجبات والتكليفات القادمة ⏳
              </h2>
              {assignments.length > 0 && (
                <span className="bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-xs font-bold px-2 py-0.5 rounded-full">
                  {assignments.filter((a) => !a.completedBy?.includes(currentUser?.uid || "")).length} متبقي
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isManager && (
                <button
                  onClick={handleOpenAddAssignment}
                  className="bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1"
                >
                  <Plus size={16} />
                  إضافة واجب
                </button>
              )}
              <button
                onClick={() => setActiveTab(Tab.ASSIGNMENTS)}
                className="text-primary hover:underline text-xs font-bold flex items-center gap-1"
              >
                عرض كل الواجبات ({assignments.length}) ➔
              </button>
            </div>
          </div>

          {assignments.length === 0 ? (
            <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 text-center text-gray-400 text-xs">
              لا توجد واجبات دراسية مضافة حالياً.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {assignments
                .slice()
                .sort((a, b) => a.dueTimestamp - b.dueTimestamp)
                .slice(0, 3)
                .map((assign) => {
                  const isDone = assign.completedBy?.includes(currentUser?.uid || "");
                  const timeInfo = getRemainingTimeInfo(assign.dueTimestamp);

                  return (
                    <div
                      key={assign.id}
                      className={`p-4 rounded-2xl border transition-all duration-200 relative flex flex-col justify-between ${
                        isDone
                          ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 opacity-80"
                          : timeInfo.status === "urgent" || timeInfo.status === "critical"
                          ? "bg-orange-50/40 dark:bg-orange-950/20 border-orange-300 dark:border-orange-800 shadow-sm"
                          : "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 shadow-sm"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-lg truncate max-w-[120px]">
                            {assign.courseName}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 ${timeInfo.badgeClass}`}>
                            {timeInfo.text}
                          </span>
                        </div>

                        <h3 className="font-bold text-sm text-gray-800 dark:text-white line-clamp-1 mb-1">
                          {assign.title}
                        </h3>

                        {assign.description && (
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-3">
                            {assign.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-gray-100 dark:border-slate-700/50 flex items-center justify-between">
                        <button
                          onClick={() => handleToggleAssignmentDone(assign)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                            isDone
                              ? "bg-emerald-600 text-white"
                              : "bg-gray-100 dark:bg-slate-700 hover:bg-primary/10 hover:text-primary text-gray-600 dark:text-gray-300"
                          }`}
                        >
                          {isDone ? <CheckCircle size={14} /> : <Square size={14} />}
                          {isDone ? "أنجزت الواجب" : "تحديد كمنجز"}
                        </button>

                        <button
                          onClick={() => setActiveTab(Tab.ASSIGNMENTS)}
                          className="text-[10px] text-gray-400 hover:text-primary transition"
                        >
                          التفاصيل ➔
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Announcements */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Bell className="text-primary" size={24} />
            الإعلانات والتنبيهات
          </h2>
          {isManager && (
            <button
              onClick={() => setIsAddingAnnouncement(true)}
              className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition flex items-center gap-2"
            >
              <Plus size={18} />
              إضافة إعلان
            </button>
          )}
        </div>

        {/* Announcements List (Pinned First) */}
        <div className="space-y-4">
          {announcements
            .slice()
            .sort((a, b) => {
              if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
                return a.isPinned ? -1 : 1;
              }
              return b.timestamp - a.timestamp;
            })
            .map((ann) => {
              const totalPollVotes = ann.poll
                ? ann.poll.options.reduce((acc, o) => acc + (o.votes?.length || 0), 0)
                : 0;
              const isShowingVoters = expandedPollVotersAnnId === ann.id;

              return (
                <div
                  key={ann.id}
                  className={`bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border relative overflow-hidden group transition ${
                    ann.isPinned
                      ? "border-amber-300 dark:border-amber-700/70 bg-gradient-to-br from-amber-50/30 to-white dark:from-amber-950/15 dark:to-slate-800 ring-1 ring-amber-200/60 dark:ring-amber-800/40"
                      : "border-gray-100 dark:border-slate-700"
                  } ${ann.priority === "high" ? "border-l-4 border-l-red-500" : ""}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {ann.isPinned && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 flex items-center gap-1 shadow-xs">
                          <Pin size={11} className="rotate-45 fill-current" />
                          مثبت بالأعلى
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                          ann.priority === "high"
                            ? "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400"
                            : "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                        }`}
                      >
                        {ann.priority === "high" ? "هام جداً" : "إعلان عام"}
                      </span>
                      {ann.courseName && (
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded-lg text-[10px] font-bold">
                          {ann.courseName}
                        </span>
                      )}
                      {ann.poll && (
                        <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
                          <Vote size={11} />
                          تصويت تفاعلي
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">
                        {new Date(ann.timestamp).toLocaleDateString("ar-EG")}
                      </span>
                    </div>
                    {isManager && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleTogglePinAnnouncement(ann)}
                          className={`p-1.5 rounded-xl transition flex items-center gap-1 text-[11px] font-bold ${
                            ann.isPinned
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                              : "text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-700"
                          }`}
                          title={ann.isPinned ? "إلغاء تثبيت التبليغ" : "تثبيت التبليغ في الأعلى"}
                        >
                          <Pin size={15} className={ann.isPinned ? "rotate-45 fill-current" : ""} />
                          <span className="hidden sm:inline">{ann.isPinned ? "مثبت" : "تثبيت"}</span>
                        </button>
                        <button
                          onClick={() => handleDeleteAnnouncement(ann.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"
                          title="حذف الإعلان"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-2">
                    {ann.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line mb-4">
                    {ann.content}
                  </p>

                  {/* Interactive Poll Section */}
                  {ann.poll && (
                    <div className="mb-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-sm text-gray-800 dark:text-white flex items-center gap-2">
                          <Vote size={17} className="text-primary shrink-0" />
                          <span>{ann.poll.question}</span>
                        </h4>
                        <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-full border border-gray-200 dark:border-slate-700 shrink-0">
                          {totalPollVotes} صوت
                        </span>
                      </div>

                      <div className="space-y-2">
                        {ann.poll.options.map((opt) => {
                          const votesCount = opt.votes?.length || 0;
                          const pct =
                            totalPollVotes > 0
                              ? Math.round((votesCount / totalPollVotes) * 100)
                              : 0;
                          const hasVotedThis = Boolean(
                            currentUser && opt.votes?.includes(currentUser.uid)
                          );

                          const voterNames = (opt.votes || [])
                            .map((uid) => appUsers.find((u) => u.uid === uid)?.name || "طالب")
                            .filter(Boolean);

                          return (
                            <div key={opt.id} className="space-y-1">
                              <button
                                type="button"
                                onClick={() => handleVoteAnnouncementPoll(ann, opt.id)}
                                className={`w-full relative overflow-hidden rounded-xl border p-3 text-right transition-all ${
                                  hasVotedThis
                                    ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-xs"
                                    : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary/50"
                                }`}
                              >
                                {/* Progress Fill Bar */}
                                <div
                                  className={`absolute inset-y-0 right-0 transition-all duration-500 ${
                                    hasVotedThis
                                      ? "bg-primary/15 dark:bg-primary/25"
                                      : "bg-gray-100 dark:bg-slate-700/60"
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />

                                <div className="relative z-10 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div
                                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                        hasVotedThis
                                          ? "border-primary bg-primary text-white"
                                          : "border-gray-300 dark:border-slate-500"
                                      }`}
                                    >
                                      {hasVotedThis && <Check size={10} />}
                                    </div>
                                    <span className="text-xs sm:text-sm font-bold text-gray-800 dark:text-white truncate">
                                      {opt.text}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                      ({votesCount})
                                    </span>
                                    <span className="text-xs font-black text-primary min-w-[34px] text-left">
                                      {pct}%
                                    </span>
                                  </div>
                                </div>
                              </button>

                              {/* Voters List if expanded */}
                              {isShowingVoters && voterNames.length > 0 && (
                                <div className="px-3 py-1.5 text-[11px] text-gray-500 dark:text-gray-400 flex flex-wrap gap-1 items-center">
                                  <span className="font-bold text-gray-700 dark:text-gray-300">
                                    المصوتون ({voterNames.length}):
                                  </span>
                                  {voterNames.map((n, idx) => (
                                    <span
                                      key={idx}
                                      className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-2 py-0.5 rounded-md text-[10px]"
                                    >
                                      {n}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {totalPollVotes > 0 && (
                        <div className="pt-1 flex justify-between items-center">
                          <span className="text-[10px] text-gray-400">
                            انقر على أي خيار للتصويت أو تغيير صوتك
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedPollVotersAnnId(isShowingVoters ? null : ann.id)
                            }
                            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                          >
                            <Users size={12} />
                            <span>
                              {isShowingVoters ? "إخفاء أسماء المصوتين" : "عرض أسماء المصوتين"}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {(ann.title.includes("واجب") || ann.content.includes("واجب") || ann.title.includes("تكليف")) && (
                    <div className="mb-4">
                      <button
                        onClick={() => setActiveTab(Tab.ASSIGNMENTS)}
                        className="inline-flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
                      >
                        <CheckSquare size={15} className="text-amber-600 dark:text-amber-400" />
                        <span>الانتقال لقسم الواجبات والتسليم ومتابعة الوقت المتبقي ➔</span>
                      </button>
                    </div>
                  )}

                  {ann.mediaUrl && (
                    <div className="mb-4 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
                      {ann.mediaType === 'image' && (
                        <img src={ann.mediaUrl} alt={ann.title} className="w-full h-auto max-h-80 object-cover" />
                      )}
                      {ann.mediaType === 'video' && (
                        <video src={ann.mediaUrl} controls className="w-full h-auto max-h-80" />
                      )}
                      {ann.mediaType === 'link' && (
                        <a href={ann.mediaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 text-primary hover:underline font-bold text-sm">
                          <ExternalLink size={18} />
                          {ann.mediaUrl}
                        </a>
                      )}
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-50 dark:border-slate-700 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {ann.authorName.charAt(0)}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      نشر بواسطة <span className="font-bold">{ann.authorName}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          {announcements.length === 0 && (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 border-dashed">
              لا توجد إعلانات حالياً
            </div>
          )}
        </div>

        {/* Add Announcement Modal */}
        {isAddingAnnouncement && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                  إضافة إعلان أو تصويت جديد
                </h3>
                <button onClick={() => setIsAddingAnnouncement(false)}>
                  <X size={20} className="text-gray-400 dark:text-gray-500" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="عنوان الإعلان"
                    className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm outline-none"
                    value={newAnnouncementTitle}
                    onChange={(e) => setNewAnnouncementTitle(e.target.value)}
                  />
                  <select
                    value={newAnnouncementCourse}
                    onChange={(e) => setNewAnnouncementCourse(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm outline-none"
                  >
                    <option value="">إعلان عام (لكافة الطلاب)</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <textarea
                  placeholder="محتوى الإعلان..."
                  className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm outline-none h-28 resize-none"
                  value={newAnnouncementContent}
                  onChange={(e) => setNewAnnouncementContent(e.target.value)}
                ></textarea>

                {/* Pin & Poll Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setNewAnnouncementPinned(!newAnnouncementPinned)}
                    className={`p-3 rounded-2xl border text-right flex items-center justify-between transition ${
                      newAnnouncementPinned
                        ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200"
                        : "bg-gray-50 dark:bg-slate-700/40 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Pin size={16} className={newAnnouncementPinned ? "rotate-45 fill-current text-amber-600" : ""} />
                      <span className="text-xs font-bold">تثبيت في أعلى الرئيسية</span>
                    </div>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${newAnnouncementPinned ? "bg-amber-500 border-amber-500 text-white" : "border-gray-300"}`}>
                      {newAnnouncementPinned && <Check size={11} />}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewAnnouncementHasPoll(!newAnnouncementHasPoll)}
                    className={`p-3 rounded-2xl border text-right flex items-center justify-between transition ${
                      newAnnouncementHasPoll
                        ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200"
                        : "bg-gray-50 dark:bg-slate-700/40 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Vote size={16} className={newAnnouncementHasPoll ? "text-indigo-600" : ""} />
                      <span className="text-xs font-bold">إرفاق تصويت / استبيان</span>
                    </div>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${newAnnouncementHasPoll ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-300"}`}>
                      {newAnnouncementHasPoll && <Check size={11} />}
                    </div>
                  </button>
                </div>

                {/* Poll Builder UI */}
                {newAnnouncementHasPoll && (
                  <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/60 space-y-3">
                    <div>
                      <label className="text-xs font-bold text-indigo-900 dark:text-indigo-200 mb-1 block">
                        سؤال التصويت
                      </label>
                      <input
                        type="text"
                        value={newPollQuestion}
                        onChange={(e) => setNewPollQuestion(e.target.value)}
                        placeholder="مثال: أي يوم تفضلون لتأجيل الكويز؟"
                        className="w-full bg-white dark:bg-slate-800 dark:text-white border border-indigo-200 dark:border-slate-600 rounded-xl px-3.5 py-2 text-xs outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-indigo-900 dark:text-indigo-200 block">
                        خيارات التصويت
                      </label>
                      {newPollOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const copy = [...newPollOptions];
                              copy[idx] = e.target.value;
                              setNewPollOptions(copy);
                            }}
                            placeholder={`الخيار ${idx + 1}`}
                            className="flex-1 bg-white dark:bg-slate-800 dark:text-white border border-indigo-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs outline-none"
                          />
                          {newPollOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() =>
                                setNewPollOptions(newPollOptions.filter((_, i) => i !== idx))
                              }
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            >
                              <X size={15} />
                            </button>
                          )}
                        </div>
                      ))}

                      {newPollOptions.length < 6 && (
                        <button
                          type="button"
                          onClick={() => setNewPollOptions([...newPollOptions, ""])}
                          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 pt-1"
                        >
                          <Plus size={14} />
                          <span>إضافة خيار آخر</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-700 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">وسائط الإعلان (اختياري)</label>
                    <input
                      type="file"
                      ref={announcementFileInputRef}
                      onChange={handleAnnouncementFilePick}
                      accept="image/*,video/*"
                      hidden
                    />
                    <button
                      type="button"
                      onClick={() => announcementFileInputRef.current?.click()}
                      disabled={isUploadingAnnouncementFile}
                      className="bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      {isUploadingAnnouncementFile ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                      اختر صورة من جهازك
                    </button>
                  </div>
                  <div className="flex flex-col md:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="أو اكتب رابط الصورة، الفيديو، أو موقع خارجي..."
                      className="flex-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none"
                      value={newAnnouncementMediaUrl.startsWith("data:") ? "(تم اختيار صورة من الجهاز ✅)" : newAnnouncementMediaUrl}
                      onChange={(e) => setNewAnnouncementMediaUrl(e.target.value)}
                      disabled={newAnnouncementMediaUrl.startsWith("data:")}
                    />
                    <select
                      value={newAnnouncementMediaType}
                      onChange={(e) => setNewAnnouncementMediaType(e.target.value as any)}
                      disabled={newAnnouncementMediaUrl.startsWith("data:")}
                      className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none cursor-pointer"
                    >
                      <option value="image">صورة</option>
                      <option value="video">فيديو</option>
                      <option value="link">رابط</option>
                    </select>
                  </div>
                  {newAnnouncementMediaUrl.startsWith("data:") && (
                    <div className="flex justify-between items-center text-[10px] text-emerald-600 font-bold px-1">
                      <span>تم إرفاق الصورة من جهازك بنجاح ✅</span>
                      <button
                        type="button"
                        onClick={() => setNewAnnouncementMediaUrl("")}
                        className="text-red-500 hover:underline"
                      >
                        إلغاء المرفق
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      checked={newAnnouncementPriority === "normal"}
                      onChange={() => setNewAnnouncementPriority("normal")}
                      className="text-primary"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      عادي
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      checked={newAnnouncementPriority === "high"}
                      onChange={() => setNewAnnouncementPriority("high")}
                      className="text-red-500"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      هام جداً
                    </span>
                  </label>
                </div>
                <button
                  onClick={handleAddAnnouncement}
                  className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg hover:bg-primary/90 transition"
                >
                  نشر الإعلان
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ... (Other render methods: renderGrades, renderAttendance, etc. logic is identical but uses state populated by firebase) ...
  // To save space, I will include the critical ones updated for async behaviour where needed
  // Since we use state that is auto-updated, the render logic doesn't actually change much!
  // I will just put the whole return structure back.

  const renderGrades = () => {
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
        a.name.localeCompare(b.name, "ar", { sensitivity: "base" })
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

    // MANAGER VIEW (Representative, Admin, Owner)
    if (isManager) {
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
                          .filter((s) =>
                            s.name
                              .toLowerCase()
                              .includes(gradeEditorSearch.toLowerCase())
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
                                  className="w-8 h-8 rounded-full object-cover"
                                  alt=""
                                />
                                <div>
                                  <span className="font-bold text-xs md:text-sm text-gray-800 dark:text-gray-200 block">
                                    {student.name}
                                  </span>
                                  {student.isOfficial && (
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
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
                          .filter((s) =>
                            s.name
                              .toLowerCase()
                              .includes(gradeEditorSearch.toLowerCase())
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
                                    <span className="truncate">{student.name}</span>
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
    else {
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
    }
  };

  const renderAttendance = () => {
    // MANAGER VIEW (Representative, Admin, Owner)
    if (isManager) {
      if (selectedSessionId) {
        // View specific session attendance
        const session = attendanceSessions.find(
          (s) => s.id === selectedSessionId,
        );
        const course = courses.find((c) => c.id === session?.courseId);
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

        // All batch students: registered in this batch or official students (excluding excluded accounts)
        const batchStudents = appUsers.filter((u) => {
          if (u.role === UserRole.OWNER) return false;
          if (u.excludeFromStats) return false;
          if (u.batchCode === effectiveBatchCode) return true;
          if (u.isOfficial && (!u.batchCode || u.batchCode === effectiveBatchCode)) return true;
          return false;
        });

        // Alphabetical sorting in Arabic
        const sortedStudents = [...batchStudents].sort((a, b) =>
          a.name.localeCompare(b.name, "ar", { sensitivity: "base" })
        );

        const displayedStudents = sortedStudents.filter((s) =>
          s.name.toLowerCase().includes(attendanceSearchQuery.toLowerCase())
        );

        const unrecordedCount = Math.max(0, sortedStudents.length - (presentCount + absentCount + excusedCount));

        // Find previous sessions that have attendance records (prioritizing same-day lectures across any course!)
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
            if (a.date !== b.date) return b.date.localeCompare(a.date);
            return (b.timestamp || 0) - (a.timestamp || 0);
          });

        const primaryPrevSession = previousSessionsWithRecords[0];
        const primaryPrevCourse = courses.find(
          (c) => c.id === primaryPrevSession?.courseId
        );
        const isPrimarySameDay =
          primaryPrevSession && primaryPrevSession.date === session?.date;

        return (
          <div className="space-y-6 p-4 pb-20 animate-in fade-in duration-200">
            {/* Session Top Bar */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedSessionId(null);
                    setAttendanceSearchQuery("");
                    setCopyAttendanceSuccess(null);
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
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white">
                      {session?.title || "سجل الحضور"}
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {course?.name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
                    <Calendar size={13} className="text-gray-400" />
                    <span>تاريخ المحاضرة: {session?.date}</span>
                    <span>•</span>
                    <span className="font-bold text-gray-600 dark:text-gray-300">
                      مرتبة أبجدياً ({sortedStudents.length} طالب مشمول بالإحصائيات)
                    </span>
                  </p>
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
                {unrecordedCount > 0 && (
                  <div className="bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 px-3 py-1.5 rounded-xl text-xs font-bold">
                    لم يُسجل: {unrecordedCount}
                  </div>
                )}
              </div>
            </div>

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
                        تسجيل نفس غيابات المحاضرة السابقة بكبسة زر ⚡
                      </h3>
                      {isPrimarySameDay && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                          محاضرة بنفس اليوم ({session?.date})
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80 mt-0.5">
                      وفّر وقتك إذا كانت هذه المحاضرة الثانية لنفس الدفعة، وانسخ حالات (حاضر / غائب / مجاز) بضغطة واحدة.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                  {/* Direct 1-Click Button for the immediately preceding lecture */}
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

                  {/* Dropdown selector if there are more previous lectures */}
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
                              {c?.name || "مادة"} - {prevSess.title} ({prevSess.date}) [{count} طالب]
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

            {/* Quick Bulk Actions & Search Filter */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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
                  <span>الكل حاضر ✓</span>
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

            {/* Alphabetical Student Roster Table */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
              <div className="p-4 bg-gray-50/70 dark:bg-slate-700/30 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center text-xs font-bold text-gray-500 dark:text-gray-400">
                <span>اسم الطالب (مرتب أبجدياً أ - ي)</span>
                <span>تسجيل الحالة (حاضر / غائب / مجاز)</span>
              </div>

              <div className="divide-y divide-gray-50 dark:divide-slate-700">
                {displayedStudents.map((student, index) => {
                  const record = records.find(
                    (r) => r.studentId === student.uid,
                  );
                  const status = record?.status;

                  return (
                    <div
                      key={student.uid}
                      className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/80 dark:hover:bg-slate-700/40 transition"
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
                          <p className="font-bold text-sm text-gray-800 dark:text-white">
                            {student.name}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                            <span>
                              {student.username
                                ? `@${student.username}`
                                : "طالب نظامي"}
                            </span>
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
                          onClick={() => setAttendanceReportStudent(student)}
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
                <div className="text-center py-12 text-gray-400 text-xs">
                  لا توجد نتائج تطابق بحثك
                </div>
              )}
            </div>
          </div>
        );
      }

      if (selectedCourseForAttendance) {
        // View sessions for a course
        const sessions = attendanceSessions.filter(
          (s) => s.courseId === selectedCourseForAttendance.id,
        );

        return (
          <div className="space-y-6 p-4">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedCourseForAttendance(null)}
                  className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                >
                  <ChevronLeft
                    size={20}
                    className="rtl:rotate-180 text-gray-600 dark:text-gray-300"
                  />
                </button>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  سجلات الحضور: {selectedCourseForAttendance.name}
                </h2>
              </div>
              <button
                onClick={() => setIsAddingSession(true)}
                className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition flex items-center gap-2"
              >
                <Plus size={18} />
                محاضرة جديدة
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sessions.map((session) => {
                const records = attendanceRecords.filter(
                  (r) => r.sessionId === session.id,
                );
                const presentCount = records.filter(
                  (r) => r.status === "PRESENT",
                ).length;
                const studentsCount = appUsers.filter((u) => {
                  if (u.role === UserRole.OWNER) return false;
                  if (u.excludeFromStats) return false;
                  if (u.batchCode === effectiveBatchCode) return true;
                  if (u.isOfficial && (!u.batchCode || u.batchCode === effectiveBatchCode)) return true;
                  return false;
                }).length;

                return (
                  <div
                    key={session.id}
                    className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition cursor-pointer group"
                    onClick={() => setSelectedSessionId(session.id)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="p-3 bg-primary/10 text-primary rounded-xl">
                        <CalendarCheck size={24} />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.id);
                        }}
                        className="text-gray-300 hover:text-red-500 transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                      {session.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {session.date}
                    </p>
                    <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2 mb-2 overflow-hidden">
                      <div
                        className="bg-green-500 h-full rounded-full"
                        style={{
                          width: `${studentsCount > 0 ? (presentCount / studentsCount) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-green-600">
                        {presentCount} حاضر
                      </span>
                      <span className="text-gray-400">
                        {studentsCount} طالب
                      </span>
                    </div>
                  </div>
                );
              })}
              {sessions.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-400 dark:text-gray-500 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 border-dashed">
                  لا توجد محاضرات مسجلة لهذا الكورس.
                </div>
              )}
            </div>

            {/* Add Session Modal */}
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
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4">
                      تسجيل محاضرة جديدة ({selectedCourseForAttendance.name})
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                          تاريخ المحاضرة
                        </label>
                        <input
                          type="date"
                          value={newSessionDate}
                          onChange={(e) => setNewSessionDate(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                          عنوان المحاضرة (اختياري)
                        </label>
                        <input
                          type="text"
                          value={newSessionTitle}
                          onChange={(e) => setNewSessionTitle(e.target.value)}
                          placeholder="مثال: المحاضرة الثانية"
                          className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm outline-none"
                        />
                      </div>

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
                              إنشاء ونسخ غيابات ({topCandidateCourse?.name ? `${topCandidateCourse.name} - ` : ""}{topCandidate.title})
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
                          إنشاء محاضرة فارغة
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

      // Select Course View
      const batchStudentsForReports = appUsers
        .filter((u) => {
          if (u.role === UserRole.OWNER) return false;
          if (u.excludeFromStats) return false;
          if (u.batchCode === effectiveBatchCode) return true;
          if (u.isOfficial && (!u.batchCode || u.batchCode === effectiveBatchCode)) return true;
          return false;
        })
        .sort((a, b) => a.name.localeCompare(b.name, "ar", { sensitivity: "base" }));

      return (
        <div className="space-y-6 p-4 pb-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <CalendarCheck className="text-primary" size={24} />
                إدارة الحضور والغياب
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                اختر المادة لتسجيل المحاضرات، أو استخرج تقارير حضور شهرية وفصلية بصيغة PDF لأي طالب.
              </p>
            </div>
            {currentUser && (
              <button
                onClick={() =>
                  setAttendanceReportStudent(
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

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <div
                key={course.id}
                onClick={() => setSelectedCourseForAttendance(course)}
                className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition cursor-pointer group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                      {course.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {course.code}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-gray-400 group-hover:text-primary transition">
                  <span>عرض السجلات</span>
                  <ArrowRight size={18} className="rtl:rotate-180" />
                </div>
              </div>
            ))}
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
                    اضغط على «تقرير PDF» أمام أي طالب لمعاينة وتحميل كشف حضوره الشهري أو الفصلي الرسمي.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-gray-50 dark:divide-slate-700 max-h-96 overflow-y-auto">
                {batchStudentsForReports.map((st, i) => {
                  const stRecords = attendanceRecords.filter(
                    (r) =>
                      r.studentId === st.uid &&
                      attendanceSessions.some((s) => s.id === r.sessionId)
                  );
                  const totalS = attendanceSessions.length;
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
                          <p className="text-xs sm:text-sm font-bold text-gray-800 dark:text-white">
                            {st.name}
                          </p>
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
                        onClick={() => setAttendanceReportStudent(st)}
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
        <div className="space-y-6 p-4">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl p-6 text-white shadow-xl shadow-emerald-200 dark:shadow-none relative overflow-hidden mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-2">سجل الحضور 📅</h2>
              <p className="opacity-90 text-sm">
                احرص على حضور المحاضرات بانتظام لتجنب الحرمان، ويمكنك تحميل تقرير حضورك الشهري أو الفصلي بصيغة PDF.
              </p>
            </div>
            {currentUser && (
              <button
                onClick={() => setAttendanceReportStudent(currentUser)}
                className="relative z-10 bg-white text-emerald-700 hover:bg-emerald-50 px-5 py-3 rounded-2xl text-xs sm:text-sm font-black shadow-lg transition flex items-center justify-center gap-2 shrink-0 active:scale-95"
              >
                <Download size={18} />
                <span>تحميل تقرير الحضور (PDF) 📄</span>
              </button>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {courses.map((course) => {
              const courseSessions = attendanceSessions.filter(
                (s) => s.courseId === course.id,
              );
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
                  ? Math.round((presentCount / totalSessions) * 100)
                  : 100;

              return (
                <div
                  key={course.id}
                  className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                        {course.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {course.code}
                      </p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-bold ${attendancePercentage >= 75 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
                    >
                      {attendancePercentage}% حضور
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

  const renderMaterials = () => {
    const studiedIds = currentUser?.studiedMaterialIds || [];
    const bookmarkedIds = currentUser?.bookmarkedMaterialIds || [];

    const renderMaterialCard = (mat: Material, showCourseContext = false) => {
      const isStudied = studiedIds.includes(mat.id);
      const isBookmarked = bookmarkedIds.includes(mat.id);
      const matCourse = courses.find((c) => c.id === mat.courseId);
      const matSection = materialSections.find((s) => s.id === mat.sectionId);

      return (
        <div
          key={mat.id}
          className={`bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border transition flex flex-col justify-between group relative overflow-hidden ${
            isStudied
              ? "border-emerald-200 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50/20 to-white dark:from-emerald-950/10 dark:to-slate-800"
              : "border-gray-100 dark:border-slate-700 hover:shadow-md"
          }`}
        >
          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                  {mat.type === "PDF" && <FileText size={24} className="text-red-500" />}
                  {mat.type === "IMAGE" && <ImageIcon size={24} className="text-blue-500" />}
                  {mat.type === "LINK" && <LinkIcon size={24} className="text-green-500" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        mat.type === "PDF"
                          ? "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400"
                          : mat.type === "IMAGE"
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                          : "bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400"
                      }`}
                    >
                      {mat.type === "PDF"
                        ? mat.fileName?.toLowerCase().endsWith(".doc") ||
                          mat.fileName?.toLowerCase().endsWith(".docx")
                          ? "ملف Word"
                          : mat.fileName?.toLowerCase().endsWith(".ppt") ||
                            mat.fileName?.toLowerCase().endsWith(".pptx")
                          ? "عرض تقديمي"
                          : "ملف محاضرة"
                        : mat.type === "IMAGE"
                        ? "صورة"
                        : "رابط خارجي"}
                    </span>
                    {matSection?.category === "QUESTIONS_BANK" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 flex items-center gap-1">
                        <Archive size={10} />
                        بنك الأسئلة
                      </span>
                    )}
                  </div>
                  <h4
                    className="font-bold text-gray-800 dark:text-white truncate mt-1 text-sm md:text-base"
                    title={mat.title}
                  >
                    {mat.title}
                  </h4>
                  {showCourseContext && (
                    <p className="text-[11px] text-primary font-bold truncate mt-0.5">
                      {matCourse?.name || "مادة"} • {matSection?.title || "مجلد"}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleToggleBookmarkMaterial(mat.id)}
                  className={`p-1.5 rounded-xl transition ${
                    isBookmarked
                      ? "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400"
                      : "text-gray-300 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-slate-700"
                  }`}
                  title={isBookmarked ? "إزالة من المفضلة" : "إضافة للمفضلة للمراجعة ⭐"}
                >
                  <Star size={16} className={isBookmarked ? "fill-current" : ""} />
                </button>
                {isManager && (
                  <button
                    onClick={() => handleDeleteMaterialItem(mat.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"
                    title="حذف المحاضرة"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Thumbnail preview ONLY if Image */}
            {mat.type === "IMAGE" && mat.url && (
              <div
                onClick={() =>
                  setPreviewItem({
                    title: mat.title,
                    url: mat.url,
                    type: "IMAGE",
                    date: mat.uploadDate,
                  })
                }
                className="mb-3 h-36 rounded-2xl overflow-hidden bg-gray-100 dark:bg-slate-700/50 cursor-pointer relative group/img border border-gray-100 dark:border-slate-700"
              >
                <img
                  src={mat.url}
                  alt={mat.title}
                  className="w-full h-full object-cover group-hover/img:scale-105 transition duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center text-white gap-1.5 text-xs font-bold">
                  <Eye size={18} /> معاينة الصورة
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Clock size={12} />
                  {new Date(mat.uploadDate).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                {mat.fileSize && (
                  <span className="text-[10px] text-gray-400 font-mono">({mat.fileSize})</span>
                )}
              </div>

              {/* Studied Toggle Button */}
              <button
                onClick={() => handleToggleStudiedMaterial(mat.id)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition active:scale-95 ${
                  isStudied
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    : "bg-gray-100 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 dark:bg-slate-700 dark:text-gray-300"
                }`}
                title="تعليم المحاضرة كـ تمت دراستها"
              >
                <CheckCircle2 size={13} className={isStudied ? "text-emerald-600 dark:text-emerald-400" : ""} />
                <span>{isStudied ? "تمت دراستها ✅" : "تعليم كمقروءة"}</span>
              </button>
            </div>
          </div>

          {/* Action Buttons: Preview ONLY for images, direct download for documents/files */}
          <div className={`grid ${mat.type === "IMAGE" ? "grid-cols-2" : "grid-cols-1"} gap-2 pt-3 border-t border-gray-100 dark:border-slate-700/60`}>
            {mat.type === "IMAGE" && (
              <button
                onClick={() =>
                  setPreviewItem({
                    title: mat.title,
                    url: mat.url,
                    type: "IMAGE",
                    date: mat.uploadDate,
                  })
                }
                className="flex items-center justify-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary dark:text-primary-light py-2.5 px-3 rounded-2xl text-xs font-bold transition active:scale-95"
                title="معاينة الصورة داخل التطبيق"
              >
                <Eye size={15} />
                <span>معاينة الصورة</span>
              </button>
            )}

            {mat.type === "LINK" &&
            mat.url.startsWith("http") &&
            !mat.url.includes("cloudinary.com") &&
            !mat.url.startsWith("dafaaty-cloud://") ? (
              <a
                href={mat.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 px-3 rounded-2xl text-xs font-bold shadow-md shadow-emerald-500/20 transition active:scale-95"
              >
                <ExternalLink size={15} />
                <span>فتح الرابط</span>
              </a>
            ) : (
              <button
                onClick={() => handleDownloadMaterial(mat)}
                className="flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 px-3 rounded-2xl text-xs font-bold shadow-md shadow-emerald-500/20 transition active:scale-95"
                title="تنزيل الملف بصيغته الأصلية إلى جهازك"
              >
                <Download size={15} />
                <span>{mat.type === "IMAGE" ? "تنزيل بالجهاز" : "تنزيل الملف للجهاز"}</span>
              </button>
            )}
          </div>
        </div>
      );
    };

    // If inside a specific section of a course
    if (activeMatCourse && activeMatSection) {
      const sectionMaterials = materials.filter(
        (m) => m.sectionId === activeMatSection.id,
      );

      const studiedInSection = sectionMaterials.filter((m) => studiedIds.includes(m.id)).length;
      const sectionPct =
        sectionMaterials.length > 0
          ? Math.round((studiedInSection / sectionMaterials.length) * 100)
          : 0;

      return (
        <div className="space-y-6 p-4 animate-in fade-in duration-300">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white dark:bg-slate-800 p-4 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveMatSection(null)}
                className="p-2.5 bg-gray-50 dark:bg-slate-700 rounded-2xl shadow-sm hover:bg-gray-100 dark:hover:bg-slate-600 transition"
                title="الرجوع للمجلدات"
              >
                <ChevronLeft
                  size={20}
                  className="rtl:rotate-180 text-gray-600 dark:text-gray-300"
                />
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  {activeMatSection.category === "QUESTIONS_BANK" ? (
                    <Archive size={22} className="text-purple-500" />
                  ) : (
                    <Folder size={22} className="text-amber-500" />
                  )}
                  {activeMatSection.title}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {activeMatCourse.name} • 👨‍🏫 {activeMatCourse.professors?.join("، ") || "غير محدد"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mr-auto">
              {sectionMaterials.length > 0 && (
                <div className="hidden sm:flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-2xl border border-emerald-200 dark:border-emerald-800/50">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    إنجازك: {studiedInSection}/{sectionMaterials.length} ({sectionPct}%)
                  </span>
                </div>
              )}

              {isManager && (
                <button
                  onClick={() => setIsAddingMaterial(true)}
                  className="bg-primary text-white px-5 py-2.5 rounded-2xl text-xs md:text-sm font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition flex items-center gap-2 active:scale-95"
                >
                  <Upload size={18} />
                  رفع محاضرة أو صورة
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sectionMaterials.map((mat) => renderMaterialCard(mat, false))}

            {sectionMaterials.length === 0 && (
              <div className="col-span-full py-16 text-center text-gray-400 dark:text-gray-500 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 border-dashed">
                <BookOpen size={48} className="mx-auto mb-2 opacity-30 text-primary" />
                <p className="font-bold text-gray-700 dark:text-gray-300">لا توجد ملفات في هذا القسم بعد.</p>
                <p className="text-xs text-gray-400 mt-1">يمكن للممثل إضافة محاضرات أو أسئلة سنين سابقة أو ملخصات مباشرة من جهازه.</p>
              </div>
            )}
          </div>

          {/* Add Material Modal */}
          {isAddingMaterial && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 border border-gray-100 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Upload size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                        إضافة محاضرة أو ملف
                      </h3>
                      <p className="text-xs text-gray-400">
                        {activeMatCourse.name} • {activeMatSection.title}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setIsAddingMaterial(false)} className="text-gray-400 hover:text-gray-600 p-1">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Direct Device Upload Button */}
                  <div className="p-4 bg-primary/5 dark:bg-primary/10 border-2 border-dashed border-primary/30 rounded-2xl text-center">
                    <input
                      type="file"
                      ref={materialFileInputRef}
                      onChange={handleMaterialFilePick}
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*"
                      hidden
                    />
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        {isUploadingMaterial ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-800 dark:text-white">
                          رفع ملف أو صورة مباشرة من جهازك
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                          يدعم ملفات PDF و Word و PowerPoint والصور بكامل جودتها
                        </p>
                      </div>

                      {/* Real Progress Bar */}
                      {isUploadingMaterial && (
                        <div className="w-full mt-2">
                          <div className="flex justify-between text-[11px] font-bold text-primary mb-1">
                            <span>جاري رفع الملف...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-primary h-full transition-all duration-200"
                              style={{ width: `${Math.max(5, uploadProgress)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => materialFileInputRef.current?.click()}
                        disabled={isUploadingMaterial}
                        className="mt-1 bg-primary text-white hover:bg-primary/90 px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 active:scale-95"
                      >
                        <FolderPlus size={16} />
                        اختر ملف من جهازك
                      </button>
                    </div>

                    {newMatUrl && (
                      <div className="mt-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-between border border-emerald-200 dark:border-emerald-800">
                        <span className="truncate">
                          تم تجهيز الملف بنجاح ✅ {lastUploadedDriveInfo?.fileName ? `(${lastUploadedDriveInfo.fileName})` : ""}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setNewMatUrl("");
                            setLastUploadedDriveInfo(null);
                          }}
                          className="text-red-500 hover:underline text-[10px]"
                        >
                          إلغاء
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                      عنوان الملف أو المحاضرة <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newMatTitle}
                      onChange={(e) => setNewMatTitle(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="مثال: المحاضرة الأولى - مقدمة عامة"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                      نوع الملف
                    </label>
                    <div className="flex gap-2">
                      {(["PDF", "IMAGE", "LINK"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setNewMatType(t)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                            newMatType === t
                              ? "bg-primary text-white border-primary shadow-sm"
                              : "bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600"
                          }`}
                        >
                          {t === "PDF" ? "ملف / مستند" : t === "IMAGE" ? "صورة" : "رابط"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                      أو إدخال رابط مباشر (اختياري)
                    </label>
                    <input
                      type="text"
                      value={
                        newMatUrl.startsWith("data:") ||
                        newMatUrl.startsWith("dafaaty-cloud://") ||
                        newMatUrl.includes("cloudinary.com")
                          ? "(تم رفع وتجهيز الملف من الجهاز بنجاح ✅)"
                          : newMatUrl
                      }
                      onChange={(e) => setNewMatUrl(e.target.value)}
                      disabled={
                        newMatUrl.startsWith("data:") ||
                        newMatUrl.startsWith("dafaaty-cloud://") ||
                        newMatUrl.includes("cloudinary.com")
                      }
                      className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingMaterial(false);
                        setNewMatTitle("");
                        setNewMatUrl("");
                      }}
                      className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-200 transition"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={handleAddMaterialItem}
                      disabled={!newMatTitle.trim() || !newMatUrl || isUploadingMaterial}
                      className="flex-1 bg-primary text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/30 disabled:opacity-50 transition active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <Save size={16} />
                      إضافة الملف
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // If inside a course (List Sections: Lectures & Question Bank)
    if (activeMatCourse) {
      const allSections = materialSections.filter(
        (s) => s.courseId === activeMatCourse.id,
      );
      const filteredSections = allSections.filter((s) => {
        const cat = s.category || "LECTURES";
        if (activeCourseCategoryTab === "ALL") return true;
        return cat === activeCourseCategoryTab;
      });

      const courseMaterials = materials.filter((m) => m.courseId === activeMatCourse.id);
      const studiedCourseCount = courseMaterials.filter((m) => studiedIds.includes(m.id)).length;
      const courseProgressPct =
        courseMaterials.length > 0
          ? Math.round((studiedCourseCount / courseMaterials.length) * 100)
          : 0;

      return (
        <div className="space-y-6 p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setActiveMatCourse(null);
                    setActiveCourseCategoryTab("ALL");
                  }}
                  className="p-2.5 bg-gray-50 dark:bg-slate-700 rounded-2xl shadow-sm hover:bg-gray-100 dark:hover:bg-slate-600 transition"
                  title="الرجوع لقائمة المواد"
                >
                  <ChevronLeft
                    size={20}
                    className="rtl:rotate-180 text-gray-600 dark:text-gray-300"
                  />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                      {activeMatCourse.name}
                    </h2>
                    {isManager && (
                      <button
                        onClick={() => handleStartEditCourse(activeMatCourse)}
                        className="p-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold flex items-center gap-1 transition"
                        title="تعديل اسم المادة أو اسم التدريسي"
                      >
                        <Edit3 size={14} />
                        <span>تعديل المادة</span>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                    <UserIcon size={13} className="text-primary" />
                    <span>التدريسي المسؤول:</span>
                    <span className="font-bold text-gray-700 dark:text-gray-200">
                      {activeMatCourse.professors?.join("، ") || "لم يحدد"}
                    </span>
                  </p>
                </div>
              </div>

              {isManager && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setNewSectionCategory("LECTURES");
                      setNewSectionName("");
                      setIsAddingSection(true);
                    }}
                    className="bg-primary text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition flex items-center gap-1.5"
                  >
                    <FolderPlus size={16} />
                    <span>مجلد محاضرات</span>
                  </button>
                  <button
                    onClick={() => {
                      setNewSectionCategory("QUESTIONS_BANK");
                      setNewSectionName("بنك الأسئلة والسنين السابقة");
                      setIsAddingSection(true);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-lg shadow-purple-500/20 transition flex items-center gap-1.5"
                  >
                    <Archive size={16} />
                    <span>إضافة قسم بنك الأسئلة</span>
                  </button>
                </div>
              )}
            </div>

            {/* Course Study Progress Bar */}
            {courseMaterials.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/40 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    نسبة إنجازك في دراسة هذه المادة
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-300">
                    {studiedCourseCount} من {courseMaterials.length} محاضرة ({courseProgressPct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-emerald-200/60 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${courseProgressPct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Category Tabs: All / Lectures / Question Bank */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                onClick={() => setActiveCourseCategoryTab("ALL")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeCourseCategoryTab === "ALL"
                    ? "bg-primary text-white shadow-sm"
                    : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"
                }`}
              >
                جميع الأقسام ({allSections.length})
              </button>
              <button
                onClick={() => setActiveCourseCategoryTab("LECTURES")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeCourseCategoryTab === "LECTURES"
                    ? "bg-amber-500 text-white shadow-sm"
                    : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"
                }`}
              >
                <Folder size={14} />
                <span>المحاضرات والملازم ({allSections.filter((s) => (s.category || "LECTURES") === "LECTURES").length})</span>
              </button>
              <button
                onClick={() => setActiveCourseCategoryTab("QUESTIONS_BANK")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeCourseCategoryTab === "QUESTIONS_BANK"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"
                }`}
              >
                <Archive size={14} />
                <span>بنك الأسئلة والسنين السابقة ({allSections.filter((s) => s.category === "QUESTIONS_BANK").length})</span>
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {filteredSections.map((section) => {
              const isQBank = section.category === "QUESTIONS_BANK";
              const secMats = materials.filter((m) => m.sectionId === section.id);
              const secStudied = secMats.filter((m) => studiedIds.includes(m.id)).length;

              return (
                <div
                  key={section.id}
                  onClick={() => setActiveMatSection(section)}
                  className={`bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border hover:shadow-md transition cursor-pointer group text-center relative ${
                    isQBank
                      ? "border-purple-200 dark:border-purple-800/50 bg-gradient-to-b from-purple-50/30 to-white dark:from-purple-950/15 dark:to-slate-800"
                      : "border-gray-100 dark:border-slate-700"
                  }`}
                >
                  {isManager && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSection(section.id);
                      }}
                      className="absolute top-4 left-4 text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="حذف المجلد"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <div
                    className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition ${
                      isQBank
                        ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300"
                        : "bg-amber-50 dark:bg-amber-900/10 text-amber-500"
                    }`}
                  >
                    {isQBank ? (
                      <Archive size={32} />
                    ) : (
                      <Folder size={32} fill="currentColor" className="text-amber-400" />
                    )}
                  </div>
                  {isQBank && (
                    <span className="inline-block mb-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                      أرشيف الأسئلة والملخصات
                    </span>
                  )}
                  <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                    {section.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {secMats.length} ملفات {secMats.length > 0 ? `• دُرس ${secStudied}/${secMats.length}` : ""}
                  </p>
                </div>
              );
            })}
            {filteredSections.length === 0 && (
              <div className="col-span-full py-16 text-center text-gray-400 dark:text-gray-500 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 border-dashed">
                <Folder size={44} className="mx-auto mb-2 opacity-30 text-amber-500" />
                <p className="font-bold text-gray-700 dark:text-gray-300">لا توجد أقسام مطابقة في هذه المادة بعد.</p>
                <p className="text-xs text-gray-400 mt-1">
                  يمكن للممثل إضافة مجلد للمحاضرات أو قسم لبنك الأسئلة والسنين السابقة والملخصات.
                </p>
              </div>
            )}
          </div>

          {/* Add Section Modal */}
          {isAddingSection && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95">
                <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4">
                  إنشاء قسم أو مجلد جديد
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">
                      تصنيف القسم
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewSectionCategory("LECTURES")}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                          newSectionCategory === "LECTURES"
                            ? "bg-amber-500 text-white border-amber-500"
                            : "bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600"
                        }`}
                      >
                        <Folder size={14} />
                        <span>محاضرات وملازم</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewSectionCategory("QUESTIONS_BANK");
                          if (!newSectionName) setNewSectionName("بنك الأسئلة والسنين السابقة");
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                          newSectionCategory === "QUESTIONS_BANK"
                            ? "bg-purple-600 text-white border-purple-600"
                            : "bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600"
                        }`}
                      >
                        <Archive size={14} />
                        <span>بنك الأسئلة</span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                      اسم القسم / المجلد
                    </label>
                    <input
                      type="text"
                      value={newSectionName}
                      onChange={(e) => setNewSectionName(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm outline-none"
                      placeholder={
                        newSectionCategory === "QUESTIONS_BANK"
                          ? "مثال: أسئلة المد والكويزات والملخصات"
                          : "مثال: المحاضرات النظرية، المختبر"
                      }
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setIsAddingSection(false)}
                      className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 py-2 rounded-xl font-bold text-sm"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleAddMaterialSection}
                      className="flex-1 bg-primary text-white py-2 rounded-xl font-bold text-sm shadow-lg shadow-primary/30"
                    >
                      إنشاء
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Global Search or Filter Mode Results across all courses
    const isSearchingOrFiltering =
      materialSearchQuery.trim().length > 0 || materialFilterMode !== "ALL";

    const globalMatchingMaterials = materials.filter((mat) => {
      if (materialFilterMode === "BOOKMARKED" && !bookmarkedIds.includes(mat.id)) return false;
      if (materialFilterMode === "STUDIED" && !studiedIds.includes(mat.id)) return false;
      if (materialFilterMode === "UNSTUDIED" && studiedIds.includes(mat.id)) return false;

      if (materialSearchQuery.trim()) {
        const q = materialSearchQuery.toLowerCase();
        const cName = courses.find((c) => c.id === mat.courseId)?.name.toLowerCase() || "";
        const sName = materialSections.find((s) => s.id === mat.sectionId)?.title.toLowerCase() || "";
        return (
          mat.title.toLowerCase().includes(q) ||
          (mat.fileName && mat.fileName.toLowerCase().includes(q)) ||
          cName.includes(q) ||
          sName.includes(q)
        );
      }
      return true;
    });

    // Default: List Courses + Global Search & Filter Bar
    return (
      <div className="space-y-6 p-4 animate-in fade-in duration-300">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-6 text-white shadow-xl shadow-amber-200 relative overflow-hidden flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-1.5 flex items-center gap-2">
              <BookOpen size={28} />
              المحاضرات وبنك الأسئلة 📚
            </h2>
            <p className="opacity-90 text-sm">
              ابحث في جميع المحاضرات، تتبع تقدمك الدراسي، وراجع المفضلة وأسئلة السنين السابقة.
            </p>
          </div>
          {materials.length > 0 && (
            <div className="relative z-10 bg-white/15 backdrop-blur-md border border-white/25 px-4 py-3 rounded-2xl text-right shrink-0">
              <span className="text-[11px] font-bold block opacity-90">إجمالي إنجازك الدراسي</span>
              <span className="text-lg font-black">
                {materials.filter((m) => studiedIds.includes(m.id)).length} / {materials.length} محاضرة (
                {Math.round(
                  (materials.filter((m) => studiedIds.includes(m.id)).length / materials.length) * 100
                )}
                %)
              </span>
            </div>
          )}
        </div>

        {/* Global Search & Quick Filter Bar */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={materialSearchQuery}
              onChange={(e) => setMaterialSearchQuery(e.target.value)}
              placeholder="بحث شامل وسريع عن أي ملزمة أو محاضرة أو ملف في كل المواد..."
              className="w-full bg-gray-50 dark:bg-slate-700/60 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl pr-10 pl-8 py-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
            {materialSearchQuery && (
              <button
                onClick={() => setMaterialSearchQuery("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setMaterialFilterMode("ALL")}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                materialFilterMode === "ALL"
                  ? "bg-primary text-white shadow-xs"
                  : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"
              }`}
            >
              جميع المواد
            </button>
            <button
              onClick={() => setMaterialFilterMode("BOOKMARKED")}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1 transition ${
                materialFilterMode === "BOOKMARKED"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"
              }`}
            >
              <Star size={13} className={materialFilterMode === "BOOKMARKED" ? "fill-current" : ""} />
              <span>المفضلة ({materials.filter((m) => bookmarkedIds.includes(m.id)).length})</span>
            </button>
            <button
              onClick={() => setMaterialFilterMode("STUDIED")}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1 transition ${
                materialFilterMode === "STUDIED"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"
              }`}
            >
              <CheckCircle2 size={13} />
              <span>تمت دراستها ({materials.filter((m) => studiedIds.includes(m.id)).length})</span>
            </button>
            <button
              onClick={() => setMaterialFilterMode("UNSTUDIED")}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                materialFilterMode === "UNSTUDIED"
                  ? "bg-slate-800 dark:bg-slate-600 text-white shadow-xs"
                  : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"
              }`}
            >
              غير مدروسة ({materials.filter((m) => !studiedIds.includes(m.id)).length})
            </button>
          </div>
        </div>

        {isSearchingOrFiltering ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-gray-800 dark:text-white text-sm flex items-center gap-2">
                <Search size={16} className="text-primary" />
                <span>نتائج البحث والفلترة ({globalMatchingMaterials.length} ملف)</span>
              </h3>
              <button
                onClick={() => {
                  setMaterialSearchQuery("");
                  setMaterialFilterMode("ALL");
                }}
                className="text-xs font-bold text-primary hover:underline"
              >
                العودة لمجلدات المواد
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {globalMatchingMaterials.map((mat) => renderMaterialCard(mat, true))}
              {globalMatchingMaterials.length === 0 && (
                <div className="col-span-full py-16 text-center text-gray-400 dark:text-gray-500 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 border-dashed">
                  <Search size={42} className="mx-auto mb-2 opacity-30 text-primary" />
                  <p className="font-bold text-gray-700 dark:text-gray-300">لا توجد محاضرات أو ملفات مطابقة</p>
                  <p className="text-xs text-gray-400 mt-1">جرب البحث بكلمة أخرى أو تغيير الفلتر المحدد.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const courseSections = materialSections.filter((s) => s.courseId === course.id);
              const qBankCount = courseSections.filter((s) => s.category === "QUESTIONS_BANK").length;
              const courseMats = materials.filter((m) => m.courseId === course.id);
              const courseMatCount = courseMats.length;
              const studiedCount = courseMats.filter((m) => studiedIds.includes(m.id)).length;
              const progressPct = courseMatCount > 0 ? Math.round((studiedCount / courseMatCount) * 100) : 0;

              return (
                <div
                  key={course.id}
                  onClick={() => setActiveMatCourse(course)}
                  className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/20 text-orange-500 flex items-center justify-center group-hover:scale-110 transition shrink-0">
                          <BookOpen size={24} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-800 dark:text-white text-lg group-hover:text-primary transition truncate">
                            {course.name}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {course.code || "مادة دراسية"}
                          </p>
                        </div>
                      </div>

                      {isManager && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEditCourse(course);
                          }}
                          className="p-2 text-primary hover:bg-primary/10 bg-primary/5 rounded-xl transition flex items-center gap-1 text-xs font-bold shrink-0"
                          title="تعديل اسم المادة أو اسم التدريسي"
                        >
                          <Edit3 size={15} />
                          <span>تعديل</span>
                        </button>
                      )}
                    </div>

                    {/* Professor Name Display */}
                    <div className="bg-gray-50 dark:bg-slate-700/50 p-2.5 rounded-2xl text-xs text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-2 border border-gray-100/60 dark:border-slate-700/60">
                      <UserIcon size={14} className="text-primary shrink-0" />
                      <span className="font-semibold text-gray-400">التدريسي:</span>
                      <span className="font-bold truncate text-gray-800 dark:text-gray-200">
                        {course.professors?.length > 0 ? course.professors.join("، ") : "لم يحدد"}
                      </span>
                    </div>

                    {/* Study Progress Bar on Course Card */}
                    {courseMatCount > 0 && (
                      <div className="mb-3 space-y-1">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-gray-500 dark:text-gray-400">تقدم الدراسة</span>
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {studiedCount}/{courseMatCount} ({progressPct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-xs font-bold text-gray-400 group-hover:text-primary pt-3 border-t border-gray-100 dark:border-slate-700/60 transition">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>{courseSections.length} أقسام • {courseMatCount} ملف</span>
                      {qBankCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                          بنك أسئلة
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span>فتح المادة</span>
                      <ArrowRight size={14} className="rtl:rotate-180" />
                    </div>
                  </div>
                </div>
              );
            })}

            {courses.length === 0 && (
              <div className="col-span-full py-16 text-center text-gray-400 dark:text-gray-500 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 border-dashed">
                <BookOpen size={48} className="mx-auto mb-2 opacity-30 text-primary" />
                <p className="font-bold text-gray-700 dark:text-gray-300">لا توجد مواد دراسية مسجلة في الدفعة.</p>
                <p className="text-xs text-gray-400 mt-1">يمكن للممثل إضافة المواد من تبويب "المواد" لتظهر المحاضرات والجدول.</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderChat = () => {
    const now = Date.now();
    const visibleMessages = chatMessages.filter(m => !m.expiresAt || m.expiresAt > now);

    return (
      <div className="h-[calc(100vh-140px)] flex flex-col bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden mx-4 my-4 animate-in fade-in duration-500">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <Users size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-800 dark:text-white">
                  محادثة الدفعة
                </h3>
                <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                  {currentUser?.batchCode || "ENG26"}
                </span>
              </div>
              <p className="text-[10px] text-green-500 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                {appUsers.length} عضو نشط
                {isChatLocked && (
                  <span className="text-red-500 font-bold mr-2 flex items-center gap-1">
                    <Lock size={12} />
                    (مقفلة)
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isManager && (
              <button
                onClick={handleToggleChatLock}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1.5 shadow-sm transition ${
                  isChatLocked
                    ? "bg-red-500 text-white shadow-red-200"
                    : "bg-emerald-600 text-white shadow-emerald-200"
                }`}
              >
                {isChatLocked ? <Lock size={12} /> : <Unlock size={12} />}
                {isChatLocked ? "فتح" : "قفل"}
              </button>
            )}
            <div className="p-2 bg-gray-50 dark:bg-slate-700 rounded-xl text-gray-400" title="يتم حذف الوسائط تلقائياً بعد 7 أيام للحفاظ على المساحة">
               <Clock size={16} />
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900 no-scrollbar">
          {visibleMessages.length > 0 ? (
            visibleMessages.map((msg) => {
              const isMe = msg.senderId === currentUser?.uid;
              const isOwner = msg.senderRole === UserRole.OWNER;
              const isRep = msg.senderRole === UserRole.REPRESENTATIVE;
              const isAssistant = msg.senderRole === UserRole.ASSISTANT_REP;

              return (
                <div
                  key={msg.id}
                  id={`msg-${msg.id}`}
                  className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""} group/msg`}
                >
                  <div
                    onClick={() => handleViewProfile(msg.senderId)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0 relative cursor-pointer hover:opacity-80 transition
                       ${isOwner ? "bg-amber-600" : isRep ? "bg-purple-600" : isAssistant ? "bg-blue-600" : "bg-gray-400"}
                    `}
                    style={msg.senderColor ? { backgroundColor: msg.senderColor } : {}}
                  >
                    {msg.senderAvatar ? (
                      <img
                        src={msg.senderAvatar}
                        className="w-full h-full rounded-full object-cover"
                        alt=""
                      />
                    ) : (
                      msg.senderName.charAt(0)
                    )}
                  </div>

                  <div className={`flex flex-col max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-1.5 mb-1 px-1 flex-wrap">
                      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{msg.senderName}</span>
                      {isOwner && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/10 text-amber-600 rounded font-bold">المطور 💻</span>
                      )}
                      {isRep && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/10 text-purple-600 rounded font-bold">الممثل 👑</span>
                      )}
                      {isAssistant && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/10 text-blue-600 rounded font-bold">معاون 🎖️</span>
                      )}
                      <span className="text-[8px] text-gray-300">
                        {new Date(msg.timestamp).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <div
                      onClick={() => !isMe && setReplyingTo(msg)}
                      className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm relative group cursor-pointer transition-all hover:brightness-95
                             ${isMe ? "bg-primary text-white rounded-tr-sm" : "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 rounded-tl-sm border border-gray-100 dark:border-slate-700"}
                          `}
                      style={isMe && msg.senderColor ? { backgroundColor: msg.senderColor } : {}}
                    >
                      {msg.replyTo && (
                        <div onClick={(e) => { e.stopPropagation(); scrollToMessage(msg.replyTo!.id); }} className="text-[10px] mb-2 p-2 rounded-lg border-r-2 border-white/30 bg-black/10 flex flex-col cursor-pointer">
                          <span className="font-bold opacity-80">{msg.replyTo.senderName}</span>
                          <span className="opacity-70 truncate">{msg.replyTo.content}</span>
                        </div>
                      )}

                      {msg.type === 'image' && msg.mediaUrl && (
                        <div className="mb-2 rounded-lg overflow-hidden border border-white/20">
                          <img src={msg.mediaUrl} alt="chat" className="max-w-full h-auto max-h-60 object-cover" />
                        </div>
                      )}
                      
                      {msg.type === 'video' && msg.mediaUrl && (
                        <div className="mb-2 rounded-lg overflow-hidden border border-white/20">
                          <video src={msg.mediaUrl} controls className="max-w-full h-auto max-h-60" />
                        </div>
                      )}

                      {msg.type === 'link' && msg.mediaUrl && (
                        <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mb-2 p-2 bg-black/5 rounded-lg text-xs hover:underline">
                           <ExternalLink size={12} />
                           {msg.mediaUrl.length > 30 ? msg.mediaUrl.substring(0, 30) + "..." : msg.mediaUrl}
                        </a>
                      )}

                      {msg.type === 'file' && msg.mediaUrl && (
                        <a href={msg.mediaUrl} download className="flex items-center gap-2 mb-2 p-2 bg-black/5 rounded-lg text-xs hover:underline">
                           <File size={14} />
                           تحميل ملف مرفق
                        </a>
                      )}

                      <span className="whitespace-pre-wrap">{msg.content}</span>
                      
                      {msg.expiresAt && (
                        <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-1 text-[8px] opacity-60">
                           <Clock size={10} />
                           توفير مساحة: سيحذف تلقائياً
                        </div>
                      )}

                      {/* Managers Delete Button */}
                      {isManager && !isMe && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id); }}
                          className="absolute -top-2 -left-2 bg-white dark:bg-slate-700 text-red-500 p-1 rounded-full shadow-sm border border-gray-100 dark:border-slate-600 opacity-0 group-hover:opacity-100 transition"
                        >
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <MessageSquare size={48} className="mb-4 opacity-20" />
              <p className="text-sm">بداية المحادثة... كن أول من يرسل!</p>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700">
          {isChatLocked && currentUser?.role === UserRole.STUDENT ? (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-2xl text-center text-xs font-bold border border-red-200 dark:border-red-800 flex items-center justify-center gap-2">
              <Lock size={16} />
              الدردشة مقفلة حالياً للمراجعة من قبل الممثل.
            </div>
          ) : (
            <div className="space-y-3">
              {replyingTo && (
                <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-700 p-2 rounded-xl text-xs border-r-4 border-primary">
                  <span className="truncate opacity-70">رد على: {replyingTo.content}</span>
                  <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                </div>
              )}

              {chatMediaUrl && (
                <div className="flex items-center justify-between bg-primary/5 p-2 rounded-xl text-xs border border-primary/20">
                  <div className="flex items-center gap-2">
                    {chatMediaType === 'image' ? <ImageIcon size={14} /> : chatMediaType === 'video' ? <Video size={14} /> : <File size={14} />}
                    <span className="text-primary font-bold font-mono">مرفق جاهز للإرسال</span>
                  </div>
                  <button onClick={() => { setChatMediaUrl(""); setChatMediaType('text'); }} className="text-red-500"><X size={14} /></button>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={() => chatMediaInputRef.current?.click()}
                  className="p-3 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 rounded-2xl hover:bg-gray-200 transition shrink-0"
                >
                  <Plus size={20} />
                </button>
                <input
                  type="file"
                  ref={chatMediaInputRef}
                  hidden
                  onChange={handleChatMediaUpload}
                  accept="image/*,video/*,.pdf"
                />
                <div className="flex-1 flex items-center bg-gray-50 dark:bg-slate-700 px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-600 focus-within:ring-2 focus-within:ring-primary/20 transition">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="اكتب رسالتك..."
                    className="flex-1 bg-transparent text-sm outline-none dark:text-white"
                  />
                  {newMessage.startsWith('http') && (
                    <button
                      type="button"
                      onClick={() => { setChatMediaUrl(newMessage); setChatMediaType('link'); setNewMessage(""); }}
                      className="text-primary p-1 hover:bg-primary/10 rounded-lg transition"
                    >
                      <LinkIcon size={16} />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!newMessage.trim() && !chatMediaUrl}
                  className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition shrink-0"
                >
                  {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="rtl:rotate-180" />}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- Dynamic Lecture Schedule View ---
  const renderSchedule = () => {
    const days = ["الكل", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "السبت"];
    const filteredSchedules = schedFilterDay === "الكل" 
      ? schedules 
      : schedules.filter(s => s.day === schedFilterDay);

    return (
      <div className="space-y-6 p-4">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-200 dark:shadow-none relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs px-3 py-1 rounded-full font-bold mb-2">
                <CalendarCheck size={14} />
                جدول ومواعيد المحاضرات
              </div>
              <h2 className="text-2xl font-bold mb-1">
                الجدول الدراسي الديناميكي 🗓️
              </h2>
              <p className="opacity-90 text-sm">
                مواعيد المحاضرات والقاعات وتحديثات التبديل والتأجيل اللحظية من ممثل الدفعة.
              </p>
            </div>
            {isManager && (
              <button
                onClick={() => {
                  setEditingScheduleId(null);
                  setSchedCourseName("");
                  setSchedProf("");
                  setSchedDay("الأحد");
                  setSchedDate("");
                  setSchedStartTime("08:30 ص");
                  setSchedEndTime("10:30 ص");
                  setSchedHall("");
                  setSchedNote("");
                  setIsAddingSchedule(true);
                }}
                className="bg-white text-primary hover:bg-blue-50 px-4 py-2.5 rounded-xl font-bold text-sm shadow-md transition flex items-center gap-2 self-start md:self-auto"
              >
                <Plus size={18} />
                تسجيل موعد محاضرة
              </button>
            )}
          </div>
        </div>

        {/* Days Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {days.map(d => (
            <button
              key={d}
              onClick={() => setSchedFilterDay(d)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                schedFilterDay === d
                  ? "bg-primary text-white shadow-md shadow-primary/30"
                  : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-100 dark:border-slate-700"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Schedules Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {filteredSchedules.map((item) => (
            <div
              key={item.id}
              className={`bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border transition relative overflow-hidden ${
                item.isCancelled
                  ? "border-red-200 dark:border-red-900/50 bg-red-50/20"
                  : "border-gray-100 dark:border-slate-700 hover:shadow-md"
              }`}
            >
              {item.isCancelled && (
                <div className="bg-red-500 text-white text-[11px] font-bold px-3 py-1 rounded-bl-xl absolute top-0 left-0">
                  ❌ ملغاة لهذا اليوم
                </div>
              )}

              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-primary/10 text-primary font-bold text-xs px-2.5 py-1 rounded-lg">
                      {item.day}
                    </span>
                    {item.date && (
                      <span className="text-xs text-gray-400">
                        {item.date}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                    {item.courseName}
                  </h3>
                  {item.professor && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      التدريسي: {item.professor}
                    </p>
                  )}
                </div>

                {isManager && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleCancelSchedule(item)}
                      title={item.isCancelled ? "استئناف المحاضرة" : "إلغاء المحاضرة مؤقتاً"}
                      className={`p-2 rounded-xl text-xs font-bold transition ${
                        item.isCancelled 
                          ? "bg-green-100 text-green-700 hover:bg-green-200" 
                          : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                      }`}
                    >
                      {item.isCancelled ? "استئناف" : "إلغاء اليوم"}
                    </button>
                    <button
                      onClick={() => {
                        setEditingScheduleId(item.id);
                        setSchedCourseName(item.courseName);
                        setSchedProf(item.professor || "");
                        setSchedDay(item.day);
                        setSchedDate(item.date || "");
                        setSchedStartTime(item.startTime);
                        setSchedEndTime(item.endTime);
                        setSchedHall(item.hall);
                        setSchedNote(item.note || "");
                        setIsAddingSchedule(true);
                      }}
                      className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition"
                      title="تعديل الموعد"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteSchedule(item.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                      title="حذف الموعد"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Time & Hall */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-slate-700/60">
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/50 p-2.5 rounded-xl">
                  <Clock size={16} className="text-primary flex-shrink-0" />
                  <span className="font-semibold">{item.startTime} - {item.endTime}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/50 p-2.5 rounded-xl">
                  <MapPin size={16} className="text-amber-500 flex-shrink-0" />
                  <span className="font-semibold truncate">{item.hall}</span>
                </div>
              </div>

              {item.note && (
                <div className="mt-3 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/40">
                  <span className="font-bold ml-1">تنبيه الممثل:</span>
                  {item.note}
                </div>
              )}
            </div>
          ))}

          {filteredSchedules.length === 0 && (
            <div className="col-span-full py-16 text-center text-gray-400 dark:text-gray-500 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700">
              <Calendar size={48} className="mx-auto mb-2 opacity-30" />
              لا توجد محاضرات مجدولة لهذا اليوم.
            </div>
          )}
        </div>

        {/* Add / Edit Schedule Modal */}
        {isAddingSchedule && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                  {editingScheduleId ? "تعديل موعد محاضرة" : "تسجيل موعد محاضرة جديد"}
                </h3>
                <button onClick={() => setIsAddingSchedule(false)}>
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                    المادة الدراسية
                  </label>
                  <input
                    type="text"
                    value={schedCourseName}
                    onChange={(e) => setSchedCourseName(e.target.value)}
                    placeholder="اسم المادة (مثل: هندسة البرمجيات)"
                    className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                    اسم الأستاذ / التدريسي
                  </label>
                  <input
                    type="text"
                    value={schedProf}
                    onChange={(e) => setSchedProf(e.target.value)}
                    placeholder="د. فلان"
                    className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                      اليوم
                    </label>
                    <select
                      value={schedDay}
                      onChange={(e) => setSchedDay(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm outline-none"
                    >
                      {["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "السبت"].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                      التاريخ (اختياري)
                    </label>
                    <input
                      type="date"
                      value={schedDate}
                      onChange={(e) => setSchedDate(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                      وقت البدء
                    </label>
                    <input
                      type="text"
                      value={schedStartTime}
                      onChange={(e) => setSchedStartTime(e.target.value)}
                      placeholder="08:30 ص"
                      className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                      وقت الانتهاء
                    </label>
                    <input
                      type="text"
                      value={schedEndTime}
                      onChange={(e) => setSchedEndTime(e.target.value)}
                      placeholder="10:30 ص"
                      className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                    القاعة أو المختبر
                  </label>
                  <input
                    type="text"
                    value={schedHall}
                    onChange={(e) => setSchedHall(e.target.value)}
                    placeholder="مثال: قاعة 104 / مختبر البرمجيات"
                    className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                    ملاحظات التغيير / التبديل
                  </label>
                  <textarea
                    value={schedNote}
                    onChange={(e) => setSchedNote(e.target.value)}
                    placeholder="مثال: تم تبديل موعد المحاضرة من الساعة 8 إلى 9:30 بناءً على طلب الدكتور"
                    className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm outline-none resize-none h-20"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setIsAddingSchedule(false)}
                    className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 py-2.5 rounded-xl font-bold text-sm"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSaveSchedule}
                    className="flex-1 bg-primary text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/30"
                  >
                    حفظ الموعد
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCourseManagement = () => {
    if (!isManager)
      return (
        <div className="p-8 text-center text-gray-500">
          هذه الصفحة مخصصة لممثلي الدفعات والمشرفين فقط.
        </div>
      );

    return (
      <div className="space-y-6 p-4 animate-in fade-in duration-500">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-primary opacity-20"></div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <BookOpen className="text-primary" size={24} />
            إدارة المواد الدراسية لدفعتك 📚
          </h2>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 flex gap-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/20 transition">
              <BookOpen size={20} className="text-gray-400 mt-1" />
              <input
                type="text"
                placeholder="اسم المادة (مثال: البرمجة الكيانية)"
                className="flex-1 bg-transparent text-sm outline-none dark:text-white"
                value={newSimpleCourseName}
                onChange={(e) => setNewSimpleCourseName(e.target.value)}
              />
            </div>
            <div className="flex-1 flex gap-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/20 transition">
              <UserIcon size={20} className="text-gray-400 mt-1" />
              <input
                type="text"
                placeholder="اسم الأستاذ (اختياري)"
                className="flex-1 bg-transparent text-sm outline-none dark:text-white"
                value={simpleCourseProf}
                onChange={(e) => setSimpleCourseProf(e.target.value)}
              />
            </div>
            <button
              onClick={handleSaveSimpleCourse}
              className="bg-primary text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-primary/30 transition hover:bg-primary/90 flex items-center justify-center gap-2"
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
                    onClick={() => {
                      setActiveTab(Tab.GRADES);
                      handleOpenCustomizeCourseGrades(course);
                    }}
                    className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl transition flex items-center gap-1 text-xs font-bold"
                    title="تخصيص تقسيم الـ 50 التراكمي للمادة"
                  >
                    <PieChart size={15} />
                    <span className="hidden sm:inline">تقسيم السعي (50)</span>
                  </button>
                  <button
                    onClick={() => handleStartEditCourse(course)}
                    className="p-2 text-primary hover:bg-primary/10 bg-primary/5 rounded-xl transition flex items-center gap-1 text-xs font-bold"
                    title="تعديل المادة والتدريسي"
                  >
                    <Edit3 size={16} />
                    <span className="hidden sm:inline">تعديل</span>
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 bg-red-50/50 dark:bg-red-950/30 rounded-xl transition"
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
                  onClick={() => setEditingCourse(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-xl"
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
                    onClick={() => setEditingCourse(null)}
                    className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 py-3 rounded-2xl font-bold text-sm hover:bg-gray-200 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSaveEditedCourse}
                    disabled={!editCourseName.trim()}
                    className="flex-1 bg-primary text-white py-3 rounded-2xl font-bold text-sm shadow-lg shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50 transition active:scale-95"
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

  const renderProjects = () => {
    const isManager =
      currentUser?.role === UserRole.REPRESENTATIVE ||
      currentUser?.role === UserRole.OWNER;

    const batchStudents = appUsers.filter((u) => {
      if (u.role === UserRole.OWNER) return false;
      if (u.excludeFromStats) return false;
      if (u.batchCode === effectiveBatchCode) return true;
      if (u.isOfficial && (!u.batchCode || u.batchCode === effectiveBatchCode)) return true;
      return false;
    });

    // Filter projects
    const filteredProjects = projects.filter((p) => {
      const q = projectSearchQuery.toLowerCase();
      const matchesSearch =
        p.title.toLowerCase().includes(q) ||
        p.courseName.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q));
      const matchesCourse =
        projectCourseFilter === "all" || p.courseId === projectCourseFilter;
      return matchesSearch && matchesCourse;
    });

    const totalGroups = projects.reduce((acc, p) => acc + (p.groups?.length || 0), 0);
    const myProjectsCount = projects.filter((p) =>
      p.groups?.some((g) => g.members.includes(currentUser?.uid || ""))
    ).length;

    // Helper for collision checking in group modal
    const assignedGroupMap = new Map<string, string>();
    if (targetProjectForGroup) {
      targetProjectForGroup.groups?.forEach((g) => {
        if (g.id !== editingGroupId) {
          g.members.forEach((mUid) => {
            assignedGroupMap.set(mUid, g.name);
          });
        }
      });
    }

    const unassignedStudentsInTarget = batchStudents.filter(
      (s) => !assignedGroupMap.has(s.uid) && !newGroupMembers.includes(s.uid)
    );

    const displayedStudentsForGroup = batchStudents.filter((s) => {
      const q = groupMemberSearch.toLowerCase();
      const matchesQuery =
        s.name.toLowerCase().includes(q) ||
        (s.username && s.username.toLowerCase().includes(q));
      if (!matchesQuery) return false;
      if (groupMemberFilter === "unassigned") {
        return !assignedGroupMap.has(s.uid);
      }
      return true;
    });

    return (
      <div className="space-y-6 p-4 animate-in slide-in-from-bottom-4 duration-500">
        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Sparkles size={14} className="text-amber-300" />
                  دفعة {currentUser?.batchCode || "ENG26"}
                </span>
                <span className="bg-white/10 px-3 py-1 rounded-full text-xs">
                  {projects.length} مشاريع مسجلة
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black mb-1 flex items-center gap-2">
                <Layers size={28} />
                مشاريع المواد الدراسية 🚀
              </h2>
              <p className="opacity-80 text-sm max-w-xl">
                إدارة مشاريع المواد وتقسيم الطلاب إلى كروبات ومجموعات عمل لتفادي أي تداخل وتسهيل متابعة التسليم.
              </p>
            </div>
            {isManager && (
              <button
                onClick={handleOpenAddProject}
                className="bg-white text-indigo-700 hover:bg-indigo-50 px-6 py-3.5 rounded-2xl font-bold text-sm transition shadow-lg flex items-center justify-center gap-2 shrink-0 active:scale-95"
              >
                <Plus size={20} />
                إنشاء مشروع جديد
              </button>
            )}
          </div>
        </div>

        {/* Filters and Stats Bar */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex flex-1 flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="بحث باسم المشروع أو المادة..."
                value={projectSearchQuery}
                onChange={(e) => setProjectSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-700 rounded-2xl pr-10 pl-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>

            <div className="relative sm:w-60">
              <Filter
                size={16}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <select
                value={projectCourseFilter}
                onChange={(e) => setProjectCourseFilter(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-700 rounded-2xl pr-9 pl-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition appearance-none cursor-pointer"
              >
                <option value="all">جميع المواد ({projects.length})</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="bg-white dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-gray-100 dark:border-slate-700 text-gray-600 dark:text-gray-300 font-bold shadow-sm">
              المجموعات: <strong className="text-primary">{totalGroups}</strong>
            </span>
            <span className="bg-white dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-gray-100 dark:border-slate-700 text-gray-600 dark:text-gray-300 font-bold shadow-sm">
              مشاريعك: <strong className="text-green-600">{myProjectsCount}</strong>
            </span>
          </div>
        </div>

        {/* Hidden Global Input for Project / Group File Uploads */}
        <input
          type="file"
          ref={projectFileInputRef}
          onChange={handleProjectFilePick}
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,image/*,video/*"
          hidden
        />

        {/* Projects List */}
        <div className="space-y-6">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 text-gray-400">
              <Layers size={52} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-1">
                لا توجد مشاريع مضافة حالياً
              </p>
              <p className="text-sm text-gray-400 mb-4 max-w-sm mx-auto">
                {isManager
                  ? "قم بالضغط على زر 'إنشاء مشروع جديد' لتحديد اسم المشروع والمادة وتقسيم الطلاب إلى كروبات."
                  : "سيقوم ممثل الدفعة بإضافة المشاريع وتوزيع المجموعات قريباً."}
              </p>
              {isManager && (
                <button
                  onClick={handleOpenAddProject}
                  className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-primary/90 transition inline-flex items-center gap-2"
                >
                  <Plus size={18} />
                  إنشاء أول مشروع
                </button>
              )}
            </div>
          ) : (
            filteredProjects.map((project) => {
              const myGroup = project.groups?.find((g) =>
                g.members.includes(currentUser?.uid || "")
              );

              const assignedUidsInProj = new Set<string>();
              project.groups?.forEach((g) => {
                g.members.forEach((uid) => assignedUidsInProj.add(uid));
              });

              const unassignedCount = batchStudents.filter(
                (s) => !assignedUidsInProj.has(s.uid)
              ).length;

              const totalUploadedFilesInProject =
                (project.projectFiles?.length || 0) +
                (project.groups || []).reduce((acc, g) => acc + (g.files?.length || 0), 0);

              const isUploadingGeneral =
                uploadingProjectTargetKey === `${project.id}_general`;

              return (
                <div
                  key={project.id}
                  className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 transition duration-300 hover:shadow-md"
                >
                  {/* Project Header */}
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 pb-4 border-b border-gray-100 dark:border-slate-700/60">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="bg-primary/10 text-primary text-xs font-black px-3 py-1 rounded-xl">
                          {project.courseName}
                        </span>
                        {project.deadline && (
                          <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1 border border-amber-200/50 dark:border-amber-800/50">
                            <Calendar size={13} />
                            موعد التسليم: {project.deadline}
                          </span>
                        )}
                        <span className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-xs font-bold px-2.5 py-1 rounded-xl">
                          {project.groups?.length || 0} كروبات
                        </span>
                        <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1">
                          <Archive size={12} />
                          {totalUploadedFilesInProject} ملفات محفوظة بالمشروع
                        </span>
                      </div>

                      <h3 className="text-xl md:text-2xl font-black text-gray-800 dark:text-white">
                        {project.title}
                      </h3>
                      {project.description && (
                        <p className="text-gray-600 dark:text-gray-300 text-xs md:text-sm mt-1 max-w-2xl whitespace-pre-line leading-relaxed">
                          {project.description}
                        </p>
                      )}
                    </div>

                    {/* Manager controls for this project */}
                    {isManager && (
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {totalUploadedFilesInProject > 0 && (
                          <button
                            onClick={() => handleDownloadAllProjectFiles(project)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition shadow-md shadow-emerald-600/20 flex items-center gap-1.5 active:scale-95"
                            title="تحميل جميع ملفات الكروبات والمشروع لإرسالها للدكتور"
                          >
                            <Download size={15} />
                            <span>تحميل كل ملفات المشروع ({totalUploadedFilesInProject})</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleTriggerProjectFileUpload(project.id)}
                          disabled={!!uploadingProjectTargetKey}
                          className="bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 px-3.5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                          title="رفع ملف عام للمشروع أو حدث خاص بالمشروع"
                        >
                          {isUploadingGeneral ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Upload size={15} />
                          )}
                          <span>
                            {isUploadingGeneral
                              ? `جاري الرفع ${projectUploadProgress}%`
                              : "رفع ملف للمشروع/الحدث"}
                          </span>
                        </button>
                        <button
                          onClick={() => handleOpenAddGroup(project)}
                          className="bg-primary text-white hover:bg-primary/90 px-4 py-2.5 rounded-xl font-bold text-xs transition shadow-md shadow-primary/20 flex items-center gap-1.5"
                        >
                          <Plus size={16} />
                          إضافة كروب
                        </button>
                        <button
                          onClick={() => setViewUnassignedProject(project)}
                          className="bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 px-3 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-1"
                          title="عرض الطلاب الذين لم يتم تعيينهم في أي كروب لهذا المشروع"
                        >
                          <Users size={14} />
                          غير موزعين ({unassignedCount})
                        </button>
                        <button
                          onClick={() => handleOpenEditProject(project)}
                          className="p-2.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition"
                          title="تعديل المشروع"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"
                          title="حذف المشروع"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* General Project / Event Files Section (Stored Permanently) */}
                  {((project.projectFiles && project.projectFiles.length > 0) || isUploadingGeneral) && (
                    <div className="mt-4 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                          <FolderOpen size={16} className="text-indigo-600" />
                          <span>ملفات ومرفقات المشروع والفعاليات العامة ({project.projectFiles?.length || 0})</span>
                        </h4>
                        <span className="text-[10px] text-indigo-600/80 dark:text-indigo-300 font-bold">
                          تبقى محفوظة في أرشيف المشروع دائماً
                        </span>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        {(project.projectFiles || []).map((pf) => (
                          <div
                            key={pf.id}
                            className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 shadow-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                                {pf.type === "IMAGE" ? <ImageIcon size={16} /> : <FileText size={16} />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-800 dark:text-white truncate" title={pf.fileName}>
                                  {pf.fileName || pf.title}
                                </p>
                                <p className="text-[10px] text-gray-400 truncate">
                                  بواسطة {pf.uploadedByName} • {new Date(pf.uploadedAt).toLocaleDateString("ar-EG")}
                                  {pf.fileSize ? ` • ${pf.fileSize}` : ""}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {pf.type === "IMAGE" && (
                                <button
                                  onClick={() =>
                                    setPreviewItem({
                                      title: pf.fileName || pf.title,
                                      url: pf.url,
                                      type: "IMAGE",
                                    })
                                  }
                                  className="p-1.5 bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-100 transition"
                                  title="معاينة الصورة"
                                >
                                  <Eye size={14} />
                                </button>
                              )}
                              <button
                                onClick={() => handleDownloadProjectFile(pf)}
                                className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition shadow-xs"
                                title="تنزيل الملف للجهاز"
                              >
                                <Download size={13} />
                                <span>تحميل</span>
                              </button>
                              {(isManager || pf.uploadedByUid === currentUser?.uid) && (
                                <button
                                  onClick={() => handleDeleteProjectFile(project, pf.id)}
                                  className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg transition"
                                  title="حذف الملف"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Student My-Group Notification Banner */}
                  <div className="mt-4">
                    {myGroup ? (
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black shadow-md shadow-emerald-500/20">
                            ⭐
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                مجموعتك في هذا المشروع:
                              </span>
                              <span className="text-sm font-black text-gray-800 dark:text-white">
                                {myGroup.name}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              قائد الكروب:{" "}
                              <strong>
                                {appUsers.find((u) => u.uid === myGroup.leaderId)?.name ||
                                  "لم يحدد بعد"}
                              </strong>{" "}
                              • عدد أعضاء فريقك: {myGroup.members.length} طلاب
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleTriggerProjectFileUpload(project.id, myGroup.id)}
                          disabled={!!uploadingProjectTargetKey}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition active:scale-95 shrink-0 disabled:opacity-50"
                        >
                          <Upload size={15} />
                          <span>رفع ملف مشروع كروبك</span>
                        </button>
                      </div>
                    ) : (
                      <div className="bg-gray-50 dark:bg-slate-700/40 border border-gray-200/60 dark:border-slate-700 p-3 rounded-2xl flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Info size={16} className="text-gray-400 shrink-0" />
                        <span>لم يتم تعيينك في أي كروب لهذا المشروع بعد. سيقوم الممثل بتوزيعك قريباً.</span>
                      </div>
                    )}
                  </div>

                  {/* Groups Cards Section */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2">
                        <Users size={16} className="text-primary" />
                        كروبات المشروع وملفاتها المرفوعة ({project.groups?.length || 0})
                      </h4>
                      {isManager && project.groups?.length > 0 && (
                        <button
                          onClick={() => handleOpenAddGroup(project)}
                          className="text-primary text-xs font-bold hover:underline flex items-center gap-1"
                        >
                          <Plus size={14} />
                          إضافة كروب آخر
                        </button>
                      )}
                    </div>

                    {!project.groups || project.groups.length === 0 ? (
                      <div className="text-center py-10 bg-gray-50 dark:bg-slate-900/40 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700 text-gray-400">
                        <Users size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-xs font-bold">لا توجد كروبات مضافة في هذا المشروع بعد</p>
                        {isManager && (
                          <button
                            onClick={() => handleOpenAddGroup(project)}
                            className="mt-3 bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-xl text-xs font-bold transition inline-flex items-center gap-1"
                          >
                            <Plus size={14} />
                            إضافة أول كروب وتوزيع الطلاب
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {project.groups.map((group) => {
                          const isMyGroupItem = group.members.includes(currentUser?.uid || "");
                          const canUploadToGroup = isManager || isMyGroupItem;
                          const groupLeader = appUsers.find((u) => u.uid === group.leaderId);
                          const membersData = appUsers.filter((u) =>
                            group.members.includes(u.uid)
                          );
                          const groupFiles = group.files || [];
                          const isUploadingThisGroup =
                            uploadingProjectTargetKey === `${project.id}_${group.id}`;

                          return (
                            <div
                              key={group.id}
                              className={`p-4 rounded-2xl border transition-all duration-200 relative flex flex-col justify-between ${
                                isMyGroupItem
                                  ? "bg-primary/[0.03] dark:bg-primary/10 border-primary ring-1 ring-primary/20 shadow-sm"
                                  : "bg-gray-50/70 dark:bg-slate-700/30 border-gray-200/70 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600"
                              }`}
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h5 className="font-bold text-gray-900 dark:text-white text-base">
                                        {group.name}
                                      </h5>
                                      {isMyGroupItem && (
                                        <span className="bg-primary text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                                          مجموعتك
                                        </span>
                                      )}
                                      {groupFiles.length > 0 && (
                                        <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                          <CheckCircle2 size={10} />
                                          تم التسليم ({groupFiles.length})
                                        </span>
                                      )}
                                    </div>
                                    {group.description && (
                                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                        {group.description}
                                      </p>
                                    )}
                                  </div>

                                  {isManager && (
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={() => handleOpenEditGroup(project, group)}
                                        className="p-1 text-gray-400 hover:text-primary transition"
                                        title="تعديل الكروب والأعضاء"
                                      >
                                        <Edit3 size={14} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteGroup(project, group.id)}
                                        className="p-1 text-gray-400 hover:text-red-500 transition"
                                        title="حذف الكروب"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Leader Display */}
                                <div className="bg-white dark:bg-slate-800/80 rounded-xl p-2.5 border border-gray-100 dark:border-slate-700 mb-3 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Crown size={15} className="text-amber-500 shrink-0" />
                                    <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300">
                                      قائد الكروب:
                                    </span>
                                  </div>
                                  <span className="text-[11px] font-black text-gray-800 dark:text-white truncate max-w-[130px]">
                                    {groupLeader ? groupLeader.name : "لم يتم التحديد"}
                                  </span>
                                </div>

                                {/* Members List */}
                                <div className="mb-3">
                                  <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-2">
                                    <span>الأعضاء ({group.members.length})</span>
                                  </div>
                                  <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                                    {membersData.map((member) => {
                                      const isLeader = member.uid === group.leaderId;
                                      const isMe = member.uid === currentUser?.uid;

                                      return (
                                        <div
                                          key={member.uid}
                                          className={`flex items-center justify-between p-1.5 rounded-xl text-xs transition ${
                                            isMe
                                              ? "bg-primary/10 text-primary font-bold"
                                              : "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200"
                                          }`}
                                        >
                                          <div className="flex items-center gap-2 min-w-0">
                                            <img
                                              src={member.avatar}
                                              alt={member.name}
                                              className="w-6 h-6 rounded-full object-cover shrink-0"
                                            />
                                            <span className="truncate text-[11px]">
                                              {member.name} {isMe && "(أنت)"}
                                            </span>
                                          </div>
                                          {isLeader && (
                                            <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                                              <Crown size={10} />
                                              قائد
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Group Project Files & Submissions Section */}
                                <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-extrabold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                                      <Folder size={14} className="text-primary" />
                                      ملفات المشروع المرفوعة ({groupFiles.length})
                                    </span>

                                    {canUploadToGroup && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleTriggerProjectFileUpload(project.id, group.id)
                                        }
                                        disabled={!!uploadingProjectTargetKey}
                                        className="px-2.5 py-1 rounded-lg bg-primary text-white hover:bg-primary/90 text-[10px] font-bold flex items-center gap-1 transition shadow-xs active:scale-95 disabled:opacity-50"
                                      >
                                        {isUploadingThisGroup ? (
                                          <Loader2 size={11} className="animate-spin" />
                                        ) : (
                                          <Upload size={11} />
                                        )}
                                        <span>
                                          {isUploadingThisGroup
                                            ? `${projectUploadProgress}%`
                                            : "رفع ملف للكروب"}
                                        </span>
                                      </button>
                                    )}
                                  </div>

                                  {isUploadingThisGroup && (
                                    <div className="w-full bg-gray-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                      <div
                                        className="bg-primary h-full transition-all duration-200"
                                        style={{ width: `${Math.max(8, projectUploadProgress)}%` }}
                                      />
                                    </div>
                                  )}

                                  {groupFiles.length > 0 ? (
                                    <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar pt-1">
                                      {groupFiles.map((gf) => (
                                        <div
                                          key={gf.id}
                                          className="flex items-center justify-between gap-2 p-2 rounded-xl bg-gray-50 dark:bg-slate-700/60 border border-gray-100 dark:border-slate-600/60"
                                        >
                                          <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                              {gf.type === "IMAGE" ? (
                                                <ImageIcon size={14} />
                                              ) : (
                                                <FileText size={14} />
                                              )}
                                            </div>
                                            <div className="min-w-0">
                                              <p
                                                className="text-[11px] font-bold text-gray-800 dark:text-white truncate"
                                                title={gf.fileName}
                                              >
                                                {gf.fileName || gf.title}
                                              </p>
                                              <p className="text-[9px] text-gray-400 truncate">
                                                رفعه: {gf.uploadedByName}
                                                {gf.fileSize ? ` • ${gf.fileSize}` : ""}
                                              </p>
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-1 shrink-0">
                                            {gf.type === "IMAGE" && (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setPreviewItem({
                                                    title: gf.fileName || gf.title,
                                                    url: gf.url,
                                                    type: "IMAGE",
                                                  })
                                                }
                                                className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-600 rounded-md transition"
                                                title="معاينة الصورة"
                                              >
                                                <Eye size={13} />
                                              </button>
                                            )}
                                            <button
                                              type="button"
                                              onClick={() => handleDownloadProjectFile(gf)}
                                              className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition shadow-xs"
                                              title="تنزيل الملف لإرساله للدكتور"
                                            >
                                              <Download size={11} />
                                              <span>تحميل</span>
                                            </button>
                                            {(isManager ||
                                              gf.uploadedByUid === currentUser?.uid) && (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleDeleteProjectFile(
                                                    project,
                                                    gf.id,
                                                    group.id
                                                  )
                                                }
                                                className="p-1 text-gray-300 hover:text-red-500 rounded-md transition"
                                                title="حذف الملف"
                                              >
                                                <Trash2 size={12} />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-[10px] text-gray-400 text-center py-2">
                                      لا توجد ملفات مرفوعة لهذا الكروب بعد.
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="mt-3 pt-2 border-t border-gray-200/50 dark:border-slate-700/50 flex items-center justify-between text-[10px] text-gray-400">
                                <span>{group.members.length} طلاب مسجلين</span>
                                <span>محفوظ بأرشيف المشروع ✓</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal: Add/Edit Project */}
        {isAddingProject && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 border border-gray-100 dark:border-slate-700">
              <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Layers size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                      {editingProject ? "تعديل بيانات المشروع" : "إنشاء مشروع جديد"}
                    </h3>
                    <p className="text-xs text-gray-400">
                      حدد اسم المشروع والمادة، ثم أضف الكروبات وقسم الطلاب
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddingProject(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-xl"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                    اسم المشروع <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newProjectTitle}
                    onChange={(e) => setNewProjectTitle(e.target.value)}
                    placeholder="مثال: مشروع نظام إدارة المكتبات الذكية"
                    className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                      المادة الدراسية <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newProjectCourseId}
                      onChange={(e) => setNewProjectCourseId(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition cursor-pointer"
                    >
                      <option value="">اختر المادة...</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                      موعد التسليم (اختياري)
                    </label>
                    <input
                      type="text"
                      value={newProjectDeadline}
                      onChange={(e) => setNewProjectDeadline(e.target.value)}
                      placeholder="مثال: 2026-10-30 أو الأسبوع 12"
                      className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                    وصف أو متطلبات المشروع (اختياري)
                  </label>
                  <textarea
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    placeholder="اكتب تعليمات الدكتور، آلية التسليم، أو المتطلبات الفنية للمشروع..."
                    className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-sm outline-none resize-none h-24 focus:ring-2 focus:ring-primary/20 transition"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                  <button
                    onClick={() => setIsAddingProject(false)}
                    className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 py-3 rounded-2xl font-bold text-sm hover:bg-gray-200 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSaveProject}
                    disabled={!newProjectTitle.trim() || !newProjectCourseId}
                    className="flex-1 bg-primary text-white py-3 rounded-2xl font-bold text-sm shadow-lg shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50 transition active:scale-95"
                  >
                    <Save size={18} />
                    {editingProject ? "حفظ التعديلات" : "إنشاء المشروع"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add/Edit Group inside a Project */}
        {isAddingGroup && targetProjectForGroup && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 border border-gray-100 dark:border-slate-700 max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-slate-700">
                <div>
                  <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg inline-block mb-1">
                    {targetProjectForGroup.courseName} • {targetProjectForGroup.title}
                  </span>
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                    {editingGroupId ? "تعديل الكروب والأعضاء" : "إضافة كروب جديد للمشروع"}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setIsAddingGroup(false);
                    setTargetProjectForGroup(null);
                    setEditingGroupId(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-xl"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form Content */}
              <div className="space-y-4 py-4 overflow-y-auto no-scrollbar flex-1">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                    اسم الكروب <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="مثال: المجموعة 1 - Alpha"
                    className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                    ملاحظات أو وصف الكروب (اختياري)
                  </label>
                  <input
                    type="text"
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    placeholder="مثال: مسؤولين عن الواجهة الأمامية أو التصميم"
                    className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition"
                  />
                </div>

                {/* Member selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      اختيار أعضاء الكروب ({newGroupMembers.length} محددين)
                    </label>
                    <div className="flex gap-1 bg-gray-100 dark:bg-slate-700 p-0.5 rounded-xl text-[10px]">
                      <button
                        type="button"
                        onClick={() => setGroupMemberFilter("all")}
                        className={`px-2.5 py-1 rounded-lg font-bold transition ${
                          groupMemberFilter === "all"
                            ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                            : "text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        الكل ({batchStudents.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setGroupMemberFilter("unassigned")}
                        className={`px-2.5 py-1 rounded-lg font-bold transition ${
                          groupMemberFilter === "unassigned"
                            ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                            : "text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        المتاحين فقط ({unassignedStudentsInTarget.length})
                      </button>
                    </div>
                  </div>

                  <div className="relative mb-2">
                    <Search
                      size={15}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={groupMemberSearch}
                      onChange={(e) => setGroupMemberSearch(e.target.value)}
                      placeholder="بحث عن اسم الطالب لإضافته..."
                      className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl pr-9 pl-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20 transition"
                    />
                  </div>

                  {/* Student Cards List */}
                  <div className="max-h-52 overflow-y-auto no-scrollbar grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-gray-50/80 dark:bg-slate-900/60 rounded-2xl border border-gray-200/70 dark:border-slate-700">
                    {displayedStudentsForGroup.map((user) => {
                      const isSelected = newGroupMembers.includes(user.uid);
                      const otherGroupName = assignedGroupMap.get(user.uid);

                      return (
                        <div
                          key={user.uid}
                          onClick={() => handleToggleGroupMember(user.uid)}
                          className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none ${
                            isSelected
                              ? "bg-primary/10 border-primary ring-1 ring-primary/20"
                              : otherGroupName
                              ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30 opacity-75 hover:opacity-100"
                              : "bg-white dark:bg-slate-800 border-transparent hover:border-gray-200 dark:hover:border-slate-700"
                          }`}
                        >
                          <img
                            src={user.avatar}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-gray-800 dark:text-white truncate">
                              {user.name}
                            </p>
                            {otherGroupName && !isSelected ? (
                              <p className="text-[10px] text-amber-600 dark:text-amber-400 truncate">
                                ⚠️ في {otherGroupName}
                              </p>
                            ) : user.isOfficial ? (
                              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold truncate">
                                📋 طالب مضاف بالسجل
                              </p>
                            ) : (
                              <p className="text-[10px] text-gray-400 truncate">
                                @{user.username || "طالب"}
                              </p>
                            )}
                          </div>
                          <div className="shrink-0">
                            {isSelected ? (
                              <CheckSquare size={16} className="text-primary" />
                            ) : (
                              <Square size={16} className="text-gray-300" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Group Leader Selector */}
                {newGroupMembers.length > 0 && (
                  <div className="bg-amber-50/60 dark:bg-amber-950/20 p-3.5 rounded-2xl border border-amber-200/60 dark:border-amber-800/40">
                    <label className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-1.5 block">
                      <Crown size={16} className="text-amber-500" />
                      تحديد قائد الكروب (من الأعضاء المحددين)
                    </label>
                    <select
                      value={newGroupLeaderId}
                      onChange={(e) => setNewGroupLeaderId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 text-gray-800 dark:text-white border border-amber-200 dark:border-amber-800/50 rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer"
                    >
                      {newGroupMembers.map((mUid) => {
                        const member = appUsers.find((u) => u.uid === mUid);
                        return (
                          <option key={mUid} value={mUid}>
                            👑 {member?.name || mUid}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                <button
                  onClick={() => {
                    setIsAddingGroup(false);
                    setTargetProjectForGroup(null);
                    setEditingGroupId(null);
                  }}
                  className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 py-3 rounded-2xl font-bold text-sm hover:bg-gray-200 transition"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveGroup}
                  disabled={!newGroupName.trim()}
                  className="flex-1 bg-primary text-white py-3 rounded-2xl font-bold text-sm shadow-lg shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50 transition active:scale-95"
                >
                  <Save size={18} />
                  {editingGroupId ? "تحديث الكروب" : "حفظ الكروب في المشروع"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: View Unassigned Students in a Project */}
        {viewUnassignedProject && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 border border-gray-100 dark:border-slate-700 max-h-[85vh] flex flex-col">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-slate-700">
                <div>
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                    <Users size={20} className="text-primary" />
                    الطلاب غير الموزعين في المشروع
                  </h3>
                  <p className="text-xs text-gray-400">
                    مشروع: {viewUnassignedProject.title} ({viewUnassignedProject.courseName})
                  </p>
                </div>
                <button
                  onClick={() => setViewUnassignedProject(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-xl"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Unassigned List */}
              <div className="py-4 overflow-y-auto no-scrollbar flex-1 space-y-2">
                {(() => {
                  const assignedUids = new Set<string>();
                  viewUnassignedProject.groups?.forEach((g) => {
                    g.members.forEach((uid) => assignedUids.add(uid));
                  });
                  const unassigned = batchStudents.filter((s) => !assignedUids.has(s.uid));

                  if (unassigned.length === 0) {
                    return (
                      <div className="text-center py-8 text-emerald-600 font-bold text-sm">
                        🎉 رائع! تم توزيع جميع طلاب الدفعة في كروبات هذا المشروع بنجاح.
                      </div>
                    );
                  }

                  return (
                    <>
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-bold mb-2">
                        يوجد {unassigned.length} طالب لم ينضموا بعد إلى أي كروب في هذا المشروع:
                      </p>
                      {unassigned.map((st) => (
                        <div
                          key={st.uid}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600"
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={st.avatar}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div>
                              <p className="text-xs font-bold text-gray-800 dark:text-white">
                                {st.name}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                @{st.username || "طالب"}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 font-bold px-2 py-0.5 rounded-lg">
                            غير منضم
                          </span>
                        </div>
                      ))}
                    </>
                  );
                })()}
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center gap-3">
                <button
                  onClick={() => {
                    const currentProj = viewUnassignedProject;
                    setViewUnassignedProject(null);
                    handleOpenAddGroup(currentProj);
                  }}
                  className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-primary/20 flex items-center gap-1.5"
                >
                  <Plus size={16} />
                  إنشاء كروب بهؤلاء الطلاب
                </button>
                <button
                  onClick={() => setViewUnassignedProject(null)}
                  className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-gray-200 transition"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- Assignments (الواجبات والتكليفات) View ---
  const renderAssignments = () => {
    const isManager =
      currentUser?.role === UserRole.REPRESENTATIVE ||
      currentUser?.role === UserRole.OWNER;

    const batchStudents = appUsers.filter((u) => u.batchCode === effectiveBatchCode);

    const pendingAssignments = assignments.filter(
      (a) => !a.completedBy?.includes(currentUser?.uid || "")
    );
    const completedAssignments = assignments.filter((a) =>
      a.completedBy?.includes(currentUser?.uid || "")
    );
    const urgentAssignments = pendingAssignments.filter((a) => {
      const diff = a.dueTimestamp - Date.now();
      return diff > 0 && diff <= 48 * 60 * 60 * 1000;
    });

    // Filter assignments
    const filteredAssignments = assignments
      .filter((a) => {
        const q = assignSearchQuery.toLowerCase();
        const matchesQuery =
          a.title.toLowerCase().includes(q) ||
          a.courseName.toLowerCase().includes(q) ||
          (a.description && a.description.toLowerCase().includes(q));

        const matchesCourse =
          assignFilterCourse === "all" || a.courseId === assignFilterCourse;

        const isDone = a.completedBy?.includes(currentUser?.uid || "");
        let matchesStatus = true;
        if (assignFilterStatus === "pending") matchesStatus = !isDone;
        if (assignFilterStatus === "completed") matchesStatus = isDone;
        if (assignFilterStatus === "urgent") {
          const diff = a.dueTimestamp - Date.now();
          matchesStatus = !isDone && diff > 0 && diff <= 48 * 60 * 60 * 1000;
        }

        return matchesQuery && matchesCourse && matchesStatus;
      })
      .sort((a, b) => {
        const aDone = a.completedBy?.includes(currentUser?.uid || "");
        const bDone = b.completedBy?.includes(currentUser?.uid || "");
        if (aDone !== bDone) return aDone ? 1 : -1;
        return a.dueTimestamp - b.dueTimestamp;
      });

    return (
      <div className="space-y-6 p-4 animate-in slide-in-from-bottom-4 duration-500">
        {/* Hero Header */}
        <div className="bg-gradient-to-br from-amber-600 via-orange-600 to-rose-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <CheckSquare size={14} className="text-amber-200" />
                  دفعة {currentUser?.batchCode || "ENG26"}
                </span>
                <span className="bg-white/10 px-3 py-1 rounded-full text-xs">
                  {assignments.length} واجبات مسجلة
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black mb-1 flex items-center gap-2">
                <CheckSquare size={28} />
                الواجبات والتكليفات الدراسية 📝
              </h2>
              <p className="opacity-90 text-sm max-w-xl">
                متابعة المواعيد النهائية لتسليم الواجبات، عداد الأيام والساعات المتبقية، وتسجيل إنجاز المهام لتفادي التأخير.
              </p>
            </div>
            {isManager && (
              <button
                onClick={handleOpenAddAssignment}
                className="bg-white text-orange-700 hover:bg-orange-50 px-6 py-3.5 rounded-2xl font-bold text-sm transition shadow-lg flex items-center justify-center gap-2 shrink-0 active:scale-95"
              >
                <Plus size={20} />
                إضافة واجب جديد
              </button>
            )}
          </div>
        </div>

        {/* Status Tabs and Quick Stats */}
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => setAssignFilterStatus("all")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
              assignFilterStatus === "all"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-slate-700 hover:bg-gray-50"
            }`}
          >
            <span>كل الواجبات</span>
            <span className="bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full text-[10px]">
              {assignments.length}
            </span>
          </button>

          <button
            onClick={() => setAssignFilterStatus("pending")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
              assignFilterStatus === "pending"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-slate-700 hover:bg-gray-50"
            }`}
          >
            <span>قيد الانتظار</span>
            <span className="bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full text-[10px]">
              {pendingAssignments.length}
            </span>
          </button>

          <button
            onClick={() => setAssignFilterStatus("completed")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
              assignFilterStatus === "completed"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-slate-700 hover:bg-gray-50"
            }`}
          >
            <span>المنجزة</span>
            <span className="bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full text-[10px]">
              {completedAssignments.length}
            </span>
          </button>

          <button
            onClick={() => setAssignFilterStatus("urgent")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
              assignFilterStatus === "urgent"
                ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-slate-700 hover:bg-gray-50"
            }`}
          >
            <span>قريبة التسليم ⚠️</span>
            <span className="bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full text-[10px]">
              {urgentAssignments.length}
            </span>
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="بحث في الواجبات أو اسم المادة..."
              value={assignSearchQuery}
              onChange={(e) => setAssignSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-700 rounded-2xl pr-10 pl-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition"
            />
          </div>

          <div className="relative sm:w-60">
            <Filter
              size={16}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <select
              value={assignFilterCourse}
              onChange={(e) => setAssignFilterCourse(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-700 rounded-2xl pr-9 pl-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition appearance-none cursor-pointer"
            >
              <option value="all">جميع المواد ({courses.length})</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Assignments Cards Grid */}
        <div className="space-y-4">
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 text-gray-400">
              <CheckSquare size={52} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-1">
                لا توجد واجبات مطابقة للفلتر
              </p>
              <p className="text-sm text-gray-400 mb-4 max-w-sm mx-auto">
                {isManager
                  ? "اضغط على زر 'إضافة واجب جديد' لإضافة تكليف مع موعد التسليم وإرسال إشعار للدفعة."
                  : "ليس لديك أي تكليفات معلقة حالياً في هذا القسم."}
              </p>
              {isManager && (
                <button
                  onClick={handleOpenAddAssignment}
                  className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-primary/90 transition inline-flex items-center gap-2"
                >
                  <Plus size={18} />
                  إضافة أول واجب
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredAssignments.map((assign) => {
                const isDone = assign.completedBy?.includes(currentUser?.uid || "");
                const timeInfo = getRemainingTimeInfo(assign.dueTimestamp);
                const doneCount = assign.completedBy?.length || 0;
                const totalStudents = batchStudents.length || 1;
                const percentDone = Math.round((doneCount / totalStudents) * 100);

                const formattedDueDate = new Date(assign.dueTimestamp).toLocaleString(
                  "ar-EG",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                );

                return (
                  <div
                    key={assign.id}
                    className={`bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border transition-all duration-300 relative flex flex-col justify-between ${
                      isDone
                        ? "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/10"
                        : timeInfo.status === "urgent" || timeInfo.status === "critical"
                        ? "border-orange-300 dark:border-orange-900/60 shadow-orange-100 dark:shadow-none"
                        : "border-gray-100 dark:border-slate-700"
                    }`}
                  >
                    <div>
                      {/* Top Badges Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="bg-primary/10 text-primary text-xs font-black px-3 py-1 rounded-xl">
                            {assign.courseName}
                          </span>
                          <span className={`text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1 ${timeInfo.badgeClass}`}>
                            <Clock size={13} />
                            {timeInfo.text}
                          </span>
                        </div>

                        {isManager && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditAssignment(assign)}
                              className="p-1.5 text-gray-400 hover:text-primary rounded-lg transition"
                              title="تعديل الواجب"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteAssignment(assign.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition"
                              title="حذف الواجب"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-lg md:text-xl font-black text-gray-800 dark:text-white mb-2">
                        {assign.title}
                      </h3>

                      {/* Description */}
                      {assign.description && (
                        <p className="text-gray-600 dark:text-gray-300 text-xs md:text-sm whitespace-pre-line leading-relaxed mb-4">
                          {assign.description}
                        </p>
                      )}

                      {/* Live Detailed Countdown Ticker */}
                      {(() => {
                        const diff = assign.dueTimestamp - currentTimer;
                        if (diff > 0) {
                          const d = Math.floor(diff / (1000 * 60 * 60 * 24));
                          const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

                          return (
                            <div className="grid grid-cols-3 gap-2 mb-4 p-3 rounded-2xl bg-amber-50/60 dark:bg-slate-700/50 border border-amber-200/50 dark:border-slate-600/50 text-center">
                              <div className="bg-white dark:bg-slate-800 p-2 rounded-xl shadow-xs border border-amber-100/60 dark:border-slate-700">
                                <span className="block text-lg md:text-xl font-black text-gray-800 dark:text-white leading-none mb-0.5">
                                  {d}
                                </span>
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">أيام</span>
                              </div>
                              <div className="bg-white dark:bg-slate-800 p-2 rounded-xl shadow-xs border border-amber-100/60 dark:border-slate-700">
                                <span className="block text-lg md:text-xl font-black text-amber-600 dark:text-amber-400 leading-none mb-0.5">
                                  {h}
                                </span>
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">ساعات</span>
                              </div>
                              <div className="bg-white dark:bg-slate-800 p-2 rounded-xl shadow-xs border border-amber-100/60 dark:border-slate-700">
                                <span className="block text-lg md:text-xl font-black text-orange-600 dark:text-orange-400 leading-none mb-0.5">
                                  {m}
                                </span>
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">دقائق</span>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="mb-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-center text-xs font-bold text-red-600 dark:text-red-400 flex items-center justify-center gap-1.5">
                              <Clock size={16} />
                              <span>انتهت مهلة تسليم هذا الواجب</span>
                            </div>
                          );
                        }
                      })()}

                      {/* Due Date & Attachments */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/50 p-2.5 rounded-xl border border-gray-100 dark:border-slate-700">
                          <Calendar size={15} className="text-amber-500 shrink-0" />
                          <span>
                            <strong>آخر موعد للتسليم:</strong> {formattedDueDate}
                          </span>
                        </div>

                        {assign.attachments && assign.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {assign.attachments.map((att, i) => (
                              <a
                                key={i}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-xl text-xs font-bold transition"
                              >
                                <ExternalLink size={13} />
                                {att.title || "رابط / مرفق الواجب"}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Progress & Student Action */}
                    <div className="pt-4 border-t border-gray-100 dark:border-slate-700/60 space-y-3">
                      {/* Batch Progress Bar */}
                      <div>
                        <div className="flex justify-between items-center text-[10px] text-gray-500 dark:text-gray-400 mb-1 font-bold">
                          <span>نسبة إنجاز الدفعة ({doneCount} من {totalStudents} طالب)</span>
                          <span>{percentDone}%</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentDone}%` }}
                          />
                        </div>
                      </div>

                      {/* Interactive Toggle Done Button */}
                      <button
                        onClick={() => handleToggleAssignmentDone(assign)}
                        className={`w-full py-3 rounded-2xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition shadow-sm active:scale-98 ${
                          isDone
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                            : "bg-gray-100 dark:bg-slate-700 hover:bg-primary hover:text-white text-gray-700 dark:text-gray-200"
                        }`}
                      >
                        {isDone ? (
                          <>
                            <CheckCircle size={18} />
                            تم إنجاز الواجب بنجاح ✅ (انقر للإلغاء)
                          </>
                        ) : (
                          <>
                            <Square size={18} />
                            تحديد كمنجز (أتممت الواجب)
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal: Add/Edit Assignment */}
        {isAddingAssignment && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 border border-gray-100 dark:border-slate-700">
              <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <CheckSquare size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                      {editingAssignment ? "تعديل بيانات الواجب" : "إضافة تكليف / واجب دراسي جديد"}
                    </h3>
                    <p className="text-xs text-gray-400">
                      حدد المادة وتاريخ ووقت التسليم لحساب الوقت المتبقي تلقائياً
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddingAssignment(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-xl"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                    عنوان الواجب <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newAssignTitle}
                    onChange={(e) => setNewAssignTitle(e.target.value)}
                    placeholder="مثال: حل الشيت الثاني - تصميم قواعد البيانات"
                    className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                      المادة الدراسية <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newAssignCourseId}
                      onChange={(e) => setNewAssignCourseId(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition cursor-pointer"
                    >
                      <option value="">اختر المادة...</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                      موعد التسليم الدقيق <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={newAssignDueDate}
                      onChange={(e) => setNewAssignDueDate(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                    تفاصيل ومتطلبات الواجب (اختياري)
                  </label>
                  <textarea
                    value={newAssignDesc}
                    onChange={(e) => setNewAssignDesc(e.target.value)}
                    placeholder="اكتب تعليمات الأستاذ، طريقة التسليم، أو أي ملاحظات هامة..."
                    className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-sm outline-none resize-none h-24 focus:ring-2 focus:ring-primary/20 transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                    مرفق الواجب (ملف أو صورة من الجهاز أو رابط)
                  </label>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={assignFileInputRef}
                        onChange={handleAssignFilePick}
                        accept=".pdf,.doc,.docx,.ppt,.pptx,image/*"
                        hidden
                      />
                      <button
                        type="button"
                        onClick={() => assignFileInputRef.current?.click()}
                        disabled={isUploadingAssignFile}
                        className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                      >
                        {isUploadingAssignFile ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                        اختر ملف من جهازك
                      </button>

                      <input
                        type="text"
                        value={newAssignAttachmentUrl.startsWith("data:") ? "(تم اختيار ملف من جهازك ✅)" : newAssignAttachmentUrl}
                        onChange={(e) => setNewAssignAttachmentUrl(e.target.value)}
                        disabled={newAssignAttachmentUrl.startsWith("data:")}
                        placeholder="أو اكتب رابط خارجي..."
                        className="flex-1 bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/20 transition"
                      />

                      <select
                        value={newAssignAttachmentType}
                        onChange={(e) => setNewAssignAttachmentType(e.target.value as any)}
                        disabled={newAssignAttachmentUrl.startsWith("data:")}
                        className="bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-2.5 py-2.5 text-xs outline-none cursor-pointer"
                      >
                        <option value="link">رابط</option>
                        <option value="file">ملف</option>
                        <option value="image">صورة</option>
                      </select>
                    </div>

                    {newAssignAttachmentUrl && newAssignAttachmentUrl.startsWith("data:") && (
                      <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-bold px-1">
                        <span>تم تجهيز الملف المرفق من الجهاز للرفع مع الواجب ({newAssignAttachmentType})</span>
                        <button
                          type="button"
                          onClick={() => setNewAssignAttachmentUrl("")}
                          className="text-red-500 hover:underline"
                        >
                          إلغاء المرفق
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Announcement & Notification toggle */}
                {!editingAssignment && (
                  <div
                    className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-center justify-between cursor-pointer select-none"
                    onClick={() => setNewAssignNotify(!newAssignNotify)}
                  >
                    <div className="flex items-center gap-2.5">
                      <Bell size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                          نشر التكليف في التبليغات وإرسال إشعار للدفعة 📢
                        </p>
                        <p className="text-[10px] text-amber-700/80 dark:text-amber-400">
                          سيتم إنشاء تبليغ فوري يحتوي على المادة وموعد التسليم
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={newAssignNotify}
                      onChange={(e) => setNewAssignNotify(e.target.checked)}
                      className="w-4 h-4 rounded text-primary accent-primary cursor-pointer shrink-0"
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                  <button
                    onClick={() => setIsAddingAssignment(false)}
                    className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 py-3 rounded-2xl font-bold text-sm hover:bg-gray-200 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSaveAssignment}
                    disabled={!newAssignTitle.trim() || !newAssignCourseId || !newAssignDueDate}
                    className="flex-1 bg-primary text-white py-3 rounded-2xl font-bold text-sm shadow-lg shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50 transition active:scale-95"
                  >
                    <Save size={18} />
                    {editingAssignment ? "حفظ التعديلات" : "حفظ ونشر الواجب"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- Batches (النسخ والدفعات) View (Developer / Owner) ---
  const renderBatches = () => {
    if (currentUser?.role !== UserRole.OWNER) {
      return (
        <div className="p-8 text-center text-gray-500">
          هذه الصفحة مخصصة لحساب المطور الرئيسي فقط.
        </div>
      );
    }

    return (
      <div className="space-y-6 p-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 text-xs px-3 py-1 rounded-full font-bold mb-2">
                <ShieldCheck size={14} />
                حساب المطور الرئيسي (ahmed)
              </div>
              <h2 className="text-2xl font-bold mb-1">
                إدارة النسخ والدفعات الجامعية 🏛️
              </h2>
              <p className="opacity-80 text-sm">
                توليد نسخ مستقلة من البرنامج لكل دفعة، وتعيين ممثلي الدفعات وتوزيع الأكواد للطلاب.
              </p>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
              <button
                onClick={() => setIsRepManagerOpen(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-orange-500/20 transition flex items-center gap-2 active:scale-95"
              >
                <Crown size={18} />
                <span>إدارة وتعيين الممثلين والأكواد 👑</span>
              </button>
              <button
                onClick={() => {
                  setNewBatchName("");
                  setNewBatchCode(`ENG${Math.floor(10 + Math.random() * 89)}`);
                  setNewBatchDept("");
                  setNewBatchStage("المرحلة الأولى");
                  setNewBatchRepName("");
                  setIsAddingBatch(true);
                }}
                className="bg-primary hover:bg-primary/90 text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-primary/30 transition flex items-center gap-2 active:scale-95"
              >
                <Plus size={18} />
                <span>إنشاء نسخة دفعة جديدة</span>
              </button>
            </div>
          </div>
        </div>

        {/* Batches Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {batches.map((batch) => {
            const enrolledStudents = appUsers.filter(u => u.batchCode === batch.code);
            return (
              <div
                key={batch.id}
                className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition relative group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold px-2.5 py-1 rounded-lg">
                      {batch.department || "عام"} - {batch.stage}
                    </span>
                    <h3 className="font-bold text-xl text-gray-800 dark:text-white mt-2">
                      {batch.name}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsRepManagerOpen(true)}
                      className="p-2 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition"
                      title="إدارة وتعيين ممثل لهذه الدفعة"
                    >
                      <Crown size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setEditingRepBatch(batch);
                        setNewRepUsername("");
                        setIsEditingRep(true);
                      }}
                      className="p-2 text-gray-300 hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/20 rounded-xl transition"
                      title="تعديل الممثل"
                    >
                      <UserPlus size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteBatch(batch.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"
                      title="حذف هذه النسخة"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Batch Code Box with 1-click Copy */}
                <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-2xl p-4 my-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 block mb-1">
                      كود انضمام الدفعة (يعطى للطلاب)
                    </span>
                    <span className="font-mono text-xl font-black text-primary tracking-widest">
                      {batch.code}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(batch.code);
                    }}
                    className="bg-primary text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-primary/90 transition flex items-center gap-1.5"
                  >
                    <Copy size={14} />
                    نسخ الكود
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="bg-gray-50 dark:bg-slate-700/50 p-3 rounded-xl flex flex-col justify-between">
                    <div>
                      <span className="text-gray-400 block mb-1">ممثل الدفعة المسؤول</span>
                      <span className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1">
                        <Crown size={12} className="text-amber-500" />
                        {batch.representativeName || "لم يحدد بعد"}
                      </span>
                    </div>
                    <button
                      onClick={() => setIsRepManagerOpen(true)}
                      className="mt-2 text-[11px] text-orange-600 dark:text-orange-400 hover:underline font-bold flex items-center gap-1"
                    >
                      <ArrowRightLeft size={12} />
                      نقل / تعيين الممثل
                    </button>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-700/50 p-3 rounded-xl flex flex-col justify-between">
                    <div>
                      <span className="text-gray-400 block mb-1">الطلاب المسجلين</span>
                      <span className="font-bold text-primary">
                        {enrolledStudents.length} طالب
                      </span>
                    </div>
                    <button
                      onClick={() => setIsRepManagerOpen(true)}
                      className="mt-2 text-[11px] text-primary hover:underline font-bold flex items-center gap-1"
                    >
                      <Key size={12} />
                      توليد كود ممثل
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Batch Modal */}
        {isAddingBatch && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                  إنشاء نسخة دفعة جديدة للممثل
                </h3>
                <button onClick={() => setIsAddingBatch(false)}>
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                    اسم الدفعة
                  </label>
                  <input
                    type="text"
                    value={newBatchName}
                    onChange={(e) => setNewBatchName(e.target.value)}
                    placeholder="مثال: هندسة البرمجيات - المرحلة الثالثة"
                    className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                    كود الدفعة المميز
                  </label>
                  <input
                    type="text"
                    value={newBatchCode}
                    onChange={(e) => setNewBatchCode(e.target.value.toUpperCase())}
                    placeholder="ENG2024"
                    className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm font-mono outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                      القسم
                    </label>
                    <input
                      type="text"
                      value={newBatchDept}
                      onChange={(e) => setNewBatchDept(e.target.value)}
                      placeholder="هندسة البرمجيات"
                      className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                      المرحلة
                    </label>
                    <input
                      type="text"
                      value={newBatchStage}
                      onChange={(e) => setNewBatchStage(e.target.value)}
                      placeholder="المرحلة الثالثة"
                      className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                    اسم مستخدم الممثل (@username)
                  </label>
                  <input
                    type="text"
                    value={newBatchRepUsername}
                    onChange={(e) => setNewBatchRepUsername(e.target.value.toLowerCase().trim())}
                    placeholder="أدخل يوزر ممثل الدفعة"
                    className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm outline-none"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    سيتم تعيين هذا المستخدم كممثل وإعطائه صلاحيات الإدارة لهذه الدفعة.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setIsAddingBatch(false)}
                    className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 py-2.5 rounded-xl font-bold text-sm"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSaveBatch}
                    className="flex-1 bg-primary text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/30"
                  >
                    إنشاء الدفعة
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Representative Modal */}
        {isEditingRep && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                  تعديل ممثل الدفعة: {editingRepBatch?.name}
                </h3>
                <button onClick={() => setIsEditingRep(false)}>
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex gap-3">
                  <AlertCircle className="text-amber-600 dark:text-amber-400 shrink-0" size={20} />
                  <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                    سيتم سحب صلاحيات الممثل الحالي (إن وجد) ومنحها للمستخدم الجديد. تأكد من إدخال اسم المستخدم الصحيح.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                    اسم مستخدم الممثل الجديد (@username)
                  </label>
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-primary/20 transition">
                    <AtSign size={16} className="text-gray-400" />
                    <input
                      type="text"
                      value={newRepUsername}
                      onChange={(e) => setNewRepUsername(e.target.value.toLowerCase().trim())}
                      placeholder="username"
                      className="flex-1 bg-transparent text-sm outline-none dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsEditingRep(false)}
                    className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 py-3 rounded-xl font-bold text-sm"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleUpdateRepresentative}
                    className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} />
                    تحديث الممثل
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderNoBatchLanding = () => {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="text-primary" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">مرحباً بك في تطبيق دفعتي!</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
            أنت مسجل حالياً كطالب، ولكن لم تنضم إلى أي دفعة بعد. يرجى إدخال كود الدفعة (الذي تحصل عليه من ممثل دفعتك) لتقديم طلب انضمام.
          </p>

          {!currentUser?.pendingBatchCode ? (
            <div className="max-w-sm mx-auto space-y-4">
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-primary/20 transition">
                <Award size={20} className="text-gray-400" />
                <input
                  type="text"
                  className="flex-1 bg-transparent text-lg outline-none dark:text-white uppercase font-bold tracking-widest"
                  placeholder="أدخل كود الدفعة هنا"
                  value={joiningCode}
                  onChange={(e) => setJoiningCode(e.target.value)}
                />
              </div>
              <button
                onClick={handleJoinRequestSubmit}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/30 transition flex items-center justify-center gap-2"
              >
                <UserPlus size={20} />
                إرسال طلب انضمام للدفعة
              </button>
            </div>
          ) : (
            <div className="max-w-sm mx-auto p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-3xl space-y-4">
              <Clock className="text-amber-500 mx-auto" size={32} />
              <div>
                <p className="text-amber-800 dark:text-amber-400 font-bold mb-1">طلبك قيد الانتظار</p>
                <p className="text-amber-600 dark:text-amber-500 text-xs">
                  لقد قدمت طلباً للانضمام إلى الدفعة ذات الكود: <span className="font-mono font-black">{currentUser.pendingBatchCode}</span>. سيتم إشعارك فور قبول طلبك من قبل ممثل الدفعة.
                </p>
              </div>

              {/* Withdraw Request Option */}
              <div className="pt-3 border-t border-amber-200/60 dark:border-amber-900/40">
                <button
                  onClick={handleCancelJoinRequest}
                  disabled={isCancellingJoin}
                  className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm active:scale-95 disabled:opacity-50"
                >
                  <RotateCcw size={14} className={isCancellingJoin ? "animate-spin" : ""} />
                  <span>{isCancellingJoin ? "جاري سحب الطلب..." : "سحب الطلب وإعادة كتابة الكود"}</span>
                </button>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 text-center">
                  * هل كتبت كود الدفعة بالخطأ؟ اضغط لسحب الطلب فوراً وتصحيح الكود.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Profile Snapshot */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="h-24 bg-primary/10 relative">
            {currentUser?.banner && <img src={currentUser.banner} className="w-full h-full object-cover opacity-50" />}
          </div>
          <div className="px-8 pb-8 flex flex-col items-center -mt-12 relative z-10">
            <div className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden mb-4">
              <img src={currentUser?.avatar} className="w-full h-full object-cover" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{currentUser?.name}</h3>
            <p className="text-gray-500 text-sm mb-4">{currentUser?.email}</p>
            <button
              onClick={() => setActiveTab(Tab.PROFILE)}
              className="px-6 py-2 bg-gray-100 dark:bg-slate-700 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition"
            >
              تعديل الملف الشخصي
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderJoinRequests = () => {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">طلبات الانضمام للدفعة 👋</h2>
              {joinRequests.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-500 text-white animate-pulse">
                  {joinRequests.length} جديد
                </span>
              )}
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
              لديك {joinRequests.length} طلبات جديدة من طلاب يرغبون بالانضمام للدفعة وتفعيل حساباتهم.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {joinRequests.length > 1 && (
              <button
                onClick={handleApproveAllRequests}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95"
              >
                <UserCheck size={16} />
                <span>قبول جميع الطلبات ({joinRequests.length})</span>
              </button>
            )}
            <div className="bg-primary/10 p-3 rounded-2xl text-primary shrink-0">
              <Users size={24} />
            </div>
          </div>
        </div>

        {joinRequests.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-12 rounded-3xl text-center border border-dashed border-gray-200 dark:border-slate-700">
            <ShieldCheck size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-bold">لا توجد طلبات انضمام معلقة حالياً</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              عندما يقوم أي طالب بإدخال كود دفعتك، سيظهر طلبه هنا فوراً مع إشعار لك.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {joinRequests.map((req) => {
              const reqBatch = batches.find((b) => b.code === req.batchCode);
              const dateStr = req.timestamp ? new Date(req.timestamp).toLocaleDateString('ar-IQ', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }) : '';

              return (
                <div key={req.id} className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-gray-100 dark:border-slate-700 flex items-center justify-between shadow-sm hover:shadow-md transition">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-13 h-13 rounded-2xl overflow-hidden border-2 border-primary/20 shrink-0">
                      <img src={req.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.userName)}`} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-800 dark:text-white text-sm truncate">{req.userName}</h4>
                      <p className="text-[11px] text-gray-400 truncate">{req.userEmail || 'طالب'}</p>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-bold">
                          كود: {req.batchCode}
                        </span>
                        {reqBatch && (
                          <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-full truncate max-w-[140px]">
                            {reqBatch.name}
                          </span>
                        )}
                        {dateStr && (
                          <span className="text-[10px] text-gray-400">
                            {dateStr}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1.5 shrink-0 mr-2">
                    <button
                      onClick={() => handleApproveRequest(req)}
                      className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center transition shadow-md shadow-emerald-500/20 active:scale-95"
                      title="قبول انضمام الطالب"
                    >
                      <UserCheck size={18} />
                    </button>
                    <button
                      onClick={() => handleRejectRequest(req.id)}
                      className="w-10 h-10 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 text-red-600 rounded-xl flex items-center justify-center transition active:scale-95"
                      title="رفض الطلب"
                    >
                      <UserMinus size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderStudentManagement = () => {
    // All batch students: registered with accounts, joined via batchCode (including Google logins), or official records
    const batchStudents = appUsers.filter((u) => {
      if (u.role === UserRole.OWNER) return false;
      if (u.batchCode === effectiveBatchCode) return true;
      if (u.isOfficial && (!u.batchCode || u.batchCode === effectiveBatchCode)) return true;
      return false;
    });

    const officialStudents = batchStudents.filter((u) => u.isOfficial);

    const totalBatchCount = batchStudents.length;
    const includedCount = batchStudents.filter((u) => !u.excludeFromStats).length;
    const excludedCount = batchStudents.filter((u) => !!u.excludeFromStats).length;

    // Filter by inclusion tab
    const filteredByInclusion = batchStudents.filter((u) => {
      if (studentStatsFilter === 'INCLUDED') return !u.excludeFromStats;
      if (studentStatsFilter === 'EXCLUDED') return !!u.excludeFromStats;
      return true;
    });

    // Filter by search
    const displayedStudents = filteredByInclusion.filter((u) => {
      if (!studentDirectorySearch.trim()) return true;
      const q = studentDirectorySearch.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
      );
    }).sort((a, b) => a.name.localeCompare(b.name, "ar", { sensitivity: "base" }));

    return (
      <div className="space-y-6 p-4 pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Users className="text-primary" size={24} />
              <span>إدارة طلاب وأعضاء الدفعة</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              إدارة حسابات طلاب دفعة ({effectiveBatchCode})، تحديد المشمولين في الإحصائيات وقوائم الحضور، وتعيين الممثل المعاون.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
            <div className="bg-primary/10 text-primary border border-primary/20 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
              <span>إجمالي الطلاب:</span>
              <span className="font-mono text-sm">{totalBatchCount}</span>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>مشمول بالإحصائيات:</span>
              <span className="font-mono text-sm">{includedCount}</span>
            </div>
            {excludedCount > 0 && (
              <div className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                <span>مستثنى:</span>
                <span className="font-mono text-sm">{excludedCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* Representative Guidance Info Banner */}
        <div className="p-4 bg-blue-50/70 dark:bg-slate-800/80 rounded-3xl border border-blue-100 dark:border-blue-900/30 flex items-start gap-3 text-xs leading-relaxed text-blue-900 dark:text-blue-200">
          <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-black">ملاحظة تنظيمية للممثل: </span>
            <span>
              جميع الطلاب المنضمين للدفعة (بما في ذلك الحسابات المسجلة عبر Google) مشمولون تلقائياً بالإحصائيات وقوائم الحضور والدرجات.
              إذا كان هناك حساب تجريبي، أو حساب أستاذ/مشرف، يمكنك الضغط على <strong>"استثناء من الإحصائيات"</strong> لكي لا يؤثر على نسب الحضور ومعدلات السعايات.
            </span>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={studentDirectorySearch}
              onChange={(e) => setStudentDirectorySearch(e.target.value)}
              placeholder="ابحث عن طالب بالاسم، البريد الإلكتروني، أو المعرف..."
              className="w-full bg-gray-50 dark:bg-slate-700/60 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl pr-10 pl-4 py-2 text-xs outline-none"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center p-1 bg-gray-100 dark:bg-slate-700/60 rounded-2xl text-[11px] font-bold self-start sm:self-auto">
            <button
              onClick={() => setStudentStatsFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl transition ${
                studentStatsFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-800 text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'
              }`}
            >
              الكل ({totalBatchCount})
            </button>
            <button
              onClick={() => setStudentStatsFilter('INCLUDED')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 ${
                studentStatsFilter === 'INCLUDED'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'
              }`}
            >
              <span>المشمولون بالإحصائيات</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-1.5 py-0.2 rounded-full">
                {includedCount}
              </span>
            </button>
            <button
              onClick={() => setStudentStatsFilter('EXCLUDED')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 ${
                studentStatsFilter === 'EXCLUDED'
                  ? 'bg-white dark:bg-slate-800 text-gray-800 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'
              }`}
            >
              <span>المستثنون</span>
              {excludedCount > 0 && (
                <span className="text-[10px] bg-gray-200 text-gray-700 dark:bg-slate-600 dark:text-gray-300 px-1.5 py-0.2 rounded-full">
                  {excludedCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 1. Batch Students List */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="p-5 border-b border-gray-50 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/30 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-800 dark:text-white text-sm flex items-center gap-2">
                <span>قائمة طلاب وأعضاء الدفعة</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                  {displayedStudents.length}
                </span>
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                تتضمن الحسابات المسجلة وحسابات Google وقوائم الحضور والدرجات، مرتبة هجائياً.
              </p>
            </div>
          </div>

          <div>
            {displayedStudents.length > 0 ? (
              <div className="divide-y divide-gray-50 dark:divide-slate-700">
                {displayedStudents.map((student, idx) => {
                  const isRep = student.role === UserRole.REPRESENTATIVE;
                  const isAssistant = student.role === UserRole.ASSISTANT_REP;
                  const isExcluded = !!student.excludeFromStats;
                  const isGoogleAccount = student.email?.endsWith('@gmail.com') || student.avatar?.includes('googleusercontent.com');

                  return (
                    <div
                      key={student.uid}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"
                    >
                      <div
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => handleViewProfile(student.uid)}
                      >
                        <span className="w-6 text-center text-xs font-bold text-gray-400 shrink-0">
                          {idx + 1}
                        </span>
                        <img
                          src={student.avatar}
                          className="w-11 h-11 rounded-full border border-gray-100 dark:border-slate-600 object-cover shrink-0"
                          alt=""
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-sm text-gray-800 dark:text-white hover:text-primary transition">
                              {student.name}
                            </p>
                            {isRep && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 flex items-center gap-1">
                                <Crown size={11} />
                                <span>الممثل 👑</span>
                              </span>
                            )}
                            {isAssistant && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 flex items-center gap-1 shadow-sm">
                                <Award size={11} />
                                <span>ممثل معاون 🎖️</span>
                              </span>
                            )}
                            {isExcluded ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400 flex items-center gap-1">
                                <EyeOff size={11} />
                                <span>مستثنى من الإحصائيات</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center gap-1">
                                <Check size={11} />
                                <span>مشمول بالإحصائيات</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                            <span>@{student.username || "طالب"}</span>
                            <span>•</span>
                            <span className="truncate max-w-[200px]">{student.email || "بدون بريد"}</span>
                            {isGoogleAccount && (
                              <span className="text-[10px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/40 px-1.5 py-0.2 rounded-md">
                                Google
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons for Managers / Representative */}
                      {isManager && (
                        <div className="flex items-center gap-2 self-end md:self-center flex-wrap">
                          {/* PDF Attendance Report Button */}
                          <button
                            onClick={() => setAttendanceReportStudent(student)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
                            title="توليد وتحميل تقرير الحضور الشهري أو الفصلي بصيغة PDF لهذا الطالب"
                          >
                            <FileText size={13} />
                            <span>تقرير الحضور PDF 📄</span>
                          </button>

                          {/* Stats Inclusion/Exclusion Toggle (Available on ALL batch accounts including Google & Rep) */}
                          <button
                            onClick={() => handleToggleExcludeFromStats(student)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 ${
                              isExcluded
                                ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40"
                                : "bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-600"
                            }`}
                            title={isExcluded ? "إعادة تضمين الحساب في الإحصائيات وقوائم الحضور" : "استثناء هذا الحساب من الإحصائيات وقوائم الحضور والدرجات"}
                          >
                            {isExcluded ? (
                              <>
                                <Check size={13} />
                                <span>تضمين بالإحصائيات ✓</span>
                              </>
                            ) : (
                              <>
                                <EyeOff size={13} />
                                <span>استثناء من الإحصائيات</span>
                              </>
                            )}
                          </button>

                          {/* Link to Official Student Record (if official student records exist) */}
                          {!student.isOfficial && officialStudents.length > 0 && (
                            <button
                              onClick={() => {
                                setLinkingTargetAccount(student);
                                setLinkingSourceOfficialUid("");
                              }}
                              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
                              title="ربط هذا الحساب بطالب مضاف مسبقاً في السجل لنقل جميع درجاته وحضوره ومشاريعه إليه"
                            >
                              <ArrowRightLeft size={13} />
                              <span>ربط باسم في السجل 🔗</span>
                            </button>
                          )}

                          {/* Assistant Representative Toggle (Main Admin only, for other students) */}
                          {isMainAdmin && student.uid !== currentUser?.uid && !isRep && !student.isOfficial && (
                            <>
                              {isAssistant ? (
                                <button
                                  onClick={() => handleToggleAssistantRep(student)}
                                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
                                  title="إعفاء الطالب من منصب ممثل معاون"
                                >
                                  <X size={13} />
                                  <span>إعفاء من المعاونية</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleToggleAssistantRep(student)}
                                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
                                  title="ترقية وتعيين الطالب كممثل معاون للدفعة"
                                >
                                  <Award size={13} className="text-blue-600 dark:text-blue-400" />
                                  <span>تعيين كممثل معاون 🎖️</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 text-xs">
                لا توجد حسابات تطابق البحث أو الفلتر المحدد.
              </div>
            )}
          </div>
        </div>

        {/* 2. Add Offline Student Form */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <UserPlus size={18} className="text-primary" />
            إضافة اسم طالب يدوياً (يظهر في الحضور، الدرجات، والمشاريع)
          </h3>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                الاسم الثلاثي للطالب
              </label>
              <input
                type="text"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddStudent();
                }}
                className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm outline-none"
                placeholder="مثال: أحمد علي محمد..."
              />
            </div>
            <button
              onClick={handleAddStudent}
              className="bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-600 transition shadow-lg shadow-primary/20 h-10"
            >
              إضافة
            </button>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
            * الطلاب الذين تضيف أسماءهم هنا يظهرون فوراً في <strong>الحضور، السعيات، وكروبات المشاريع</strong>. وإذا سجل الطالب لاحقاً بحساب Google، يمكنك الضغط على زر <strong>«ربط بحساب مسجل 🔗»</strong> لنقل كل إحصائياته ودرجاته ومشاريعه إلى حسابه الجديد تلقائياً.
          </p>
        </div>

        {/* 3. Offline Student List */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="p-5 border-b border-gray-50 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-gray-800 dark:text-white text-sm">
                قائمة الطلاب المضافين يدوياً بدون حساب ({officialStudents.length})
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                يمكنك ربط أي اسم هنا بحساب الطالب الفعلي فور تسجيله في المنصة لنقل كافة بياناته وإحصائياته.
              </p>
            </div>
          </div>
          <div>
            {officialStudents.length > 0 ? (
              <div className="divide-y divide-gray-50 dark:divide-slate-700">
                {officialStudents.map((student) => (
                  <div
                    key={student.uid}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"
                  >
                    <div
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => handleViewProfile(student.uid)}
                    >
                      <img
                        src={student.avatar}
                        className="w-10 h-10 rounded-full border border-gray-100 dark:border-slate-600"
                        alt=""
                      />
                      <div>
                        <p className="font-bold text-sm text-gray-800 dark:text-white group-hover:text-primary transition">
                          {student.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                          <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 px-2 py-0.5 rounded-md font-bold text-[10px]">
                            مضاف يدوياً بالسجل (مشروع / حضور / درجات)
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => setAttendanceReportStudent(student)}
                        className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95"
                        title="تحميل تقرير حضور هذا الطالب بصيغة PDF"
                      >
                        <FileText size={14} />
                        <span>تقرير PDF</span>
                      </button>
                      <button
                        onClick={() => {
                          setLinkingSourceOfficialUid(student.uid);
                          setLinkingTargetAccount(null);
                        }}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 active:scale-95"
                        title="ربط هذا الطالب بحساب جوجل مسجل لنقل جميع درجاته وحضوره ومشاريعه إليه"
                      >
                        <ArrowRightLeft size={14} />
                        <span>ربط بحساب مسجل (Google) 🔗</span>
                      </button>
                      <button
                        onClick={() => handleDeleteUser(student.uid)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-xl transition"
                        title="حذف الطالب"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-xs">
                لا يوجد طلاب مضافين يدوياً في السجل حالياً (أو تم ربطهم جميعاً بحساباتهم).
              </div>
            )}
          </div>
        </div>

        {/* Modal: Link / Merge Official Student Record with Registered Google Account */}
        {(linkingTargetAccount || linkingSourceOfficialUid) && (() => {
          const registeredAccounts = batchStudents.filter((u) => !u.isOfficial);
          const selectedOfficial = officialStudents.find((o) => o.uid === linkingSourceOfficialUid);

          return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 border border-gray-100 dark:border-slate-700">
                <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <ArrowRightLeft size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-base md:text-lg text-gray-800 dark:text-white">
                        ربط ودمج بيانات طالب بحسابه المسجل 🔗
                      </h3>
                      <p className="text-[11px] text-gray-400">
                        نقل الحضور، الدرجات، المشاريع، والواجبات تلقائياً لحساب الطالب في Google
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setLinkingTargetAccount(null);
                      setLinkingSourceOfficialUid("");
                    }}
                    className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4 py-5">
                  <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
                    عند إتمام الربط، سيتم نقل جميع <strong>سجلات الحضور والغياب، درجات السعي، عضوية وقيادة كروبات المشاريع، والواجبات</strong> من الاسم المضاف يدوياً إلى حساب الطالب المسجل، ثم يُدمج السجلان في حساب واحد بدون أي تكرار.
                  </div>

                  {/* Step 1: Select Official Student Record */}
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                      1. اختر اسم الطالب الذي أضفته يدوياً في السجل (المصدر):
                    </label>
                    <select
                      value={linkingSourceOfficialUid}
                      onChange={(e) => setLinkingSourceOfficialUid(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="">-- اختر الاسم من السجل الورقي --</option>
                      {officialStudents.map((off) => (
                        <option key={off.uid} value={off.uid}>
                          📋 {off.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Step 2: Select Target Registered Account */}
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                      2. اختر حساب الطالب المسجل في النظام (حساب Google المستلم):
                    </label>
                    <select
                      value={linkingTargetAccount?.uid || ""}
                      onChange={(e) => {
                        const found = registeredAccounts.find((r) => r.uid === e.target.value) || null;
                        setLinkingTargetAccount(found);
                      }}
                      className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="">-- اختر حساب الطالب المسجل --</option>
                      {registeredAccounts.map((acc) => (
                        <option key={acc.uid} value={acc.uid}>
                          👤 {acc.name} ({acc.email || `@${acc.username}`})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Option: Keep Official Full Name */}
                  {selectedOfficial && linkingTargetAccount && (
                    <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={keepOfficialNameOnMerge}
                        onChange={(e) => setKeepOfficialNameOnMerge(e.target.checked)}
                        className="w-4 h-4 accent-indigo-600 rounded"
                      />
                      <div className="text-xs">
                        <p className="font-bold text-gray-800 dark:text-white">
                          اعتماد الاسم الثلاثي الرسمي ({selectedOfficial.name})
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                          تحديث اسم حساب جوجل ({linkingTargetAccount.name}) ليصبح بالاسم الثلاثي الرسمي المسجل لديك
                        </p>
                      </div>
                    </label>
                  )}
                </div>

                <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                  <button
                    onClick={() => {
                      setLinkingTargetAccount(null);
                      setLinkingSourceOfficialUid("");
                    }}
                    disabled={isMergingStudent}
                    className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 py-3 rounded-2xl font-bold text-xs hover:bg-gray-200 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleLinkAndMergeOfficialStudent}
                    disabled={!linkingSourceOfficialUid || !linkingTargetAccount || isMergingStudent}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-2xl font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50 transition active:scale-95"
                  >
                    {isMergingStudent ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>جاري نقل ودمج البيانات...</span>
                      </>
                    ) : (
                      <>
                        <ArrowRightLeft size={16} />
                        <span>تأكيد الربط ونقل الإحصائيات</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  const renderProfile = () => {
    const userToDisplay = viewingUserProfile || currentUser;
    if (!userToDisplay) return null;

    const isOwnProfile = currentUser?.uid === userToDisplay.uid;

    // Digital Student Card Metrics
    const userBatch = batches.find(
      (b) => b.code === (userToDisplay.batchCode || effectiveBatchCode)
    );
    const totalBatchSessions = attendanceSessions.length;
    const userPresentRecords = attendanceRecords.filter(
      (r) =>
        r.studentId === userToDisplay.uid &&
        (r.status === "PRESENT" || r.status === "EXCUSED")
    ).length;
    const overallAttendancePct =
      totalBatchSessions > 0
        ? Math.round((userPresentRecords / totalBatchSessions) * 100)
        : 100;

    const totalBatchAssignments = assignments.length;
    const completedAssignmentsCount = assignments.filter((a) =>
      a.completedBy?.includes(userToDisplay.uid)
    ).length;

    const studiedLecturesCount = (userToDisplay.studiedMaterialIds || []).filter((id) =>
      materials.some((m) => m.id === id)
    ).length;

    if (isEditingProfile && isOwnProfile) {
      return (
        <div className="space-y-6 p-4">
          {/* Edit Mode UI */}
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
                onClick={() => fileInputRefBanner.current?.click()}
                className="absolute bottom-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
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
                    onClick={() => fileInputRefAvatar.current?.click()}
                    className="absolute bottom-2 right-2 bg-primary text-white p-2 rounded-full hover:bg-primary/90 transition shadow-lg"
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
                      className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm outline-none"
                      placeholder="أدخل اسمك الكامل..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                      اسم المستخدم (@username)
                    </label>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value.toLowerCase().trim())}
                      className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm outline-none"
                      placeholder="username"
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
                    className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm outline-none resize-none h-24"
                    placeholder="اكتب شيئاً عن نفسك..."
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                    لون التوقيع
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      "#64748b",
                      "#ef4444",
                      "#f97316",
                      "#eab308",
                      "#22c55e",
                      "#06b6d4",
                      "#3b82f6",
                      "#6366f1",
                      "#a855f7",
                      "#ec4899",
                    ].map((color) => (
                      <button
                        key={color}
                        onClick={() => setEditColor(color)}
                        className={`w-8 h-8 rounded-full border-2 transition ${editColor === color ? "border-gray-800 dark:border-white scale-110" : "border-transparent hover:scale-105"}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="px-6 py-2 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isUploading}
                    className="px-6 py-2 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition flex items-center gap-2 disabled:opacity-50"
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
                onClick={() => {
                  setEditName(currentUser?.name || "");
                  setEditUsername(currentUser?.username || "");
                  setEditBio(currentUser?.bio || "");
                  setEditBanner(currentUser?.banner || "");
                  setEditAvatar(currentUser?.avatar || "");
                  setEditColor(currentUser?.signatureColor || "#64748b");
                  setIsEditingProfile(true);
                }}
                className="absolute top-4 left-4 bg-white/20 backdrop-blur-md text-white p-2 rounded-xl hover:bg-white/30 transition shadow-sm border border-white/30"
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
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
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
              </h2>
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:justify-between mt-1">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  @{userToDisplay.username || "user"}
                </p>

                {isOwnProfile && currentUser?.role === UserRole.REPRESENTATIVE && (
                  <button
                    onClick={() => {
                      const batch = batches.find((b) => b.representativeUid === currentUser.uid);
                      if (batch) {
                        setEditingRepBatch(batch);
                        setNewRepUsername("");
                        setIsEditingRep(true);
                      } else {
                        alert("تعذر العثور على الدفعة المرتبطة بك.");
                      }
                    }}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary hover:underline bg-primary/5 px-3 py-1.5 rounded-xl transition"
                  >
                    <UserPlus size={14} />
                    نقل الممثلية لمستخدم آخر
                  </button>
                )}
              </div>

              <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border border-gray-100 dark:border-slate-700">
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed italic">
                  "{userToDisplay.bio || "لا توجد نبذة تعريفية."}"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Digital Student ID Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-6 shadow-xl border border-blue-800/40">
          {/* Decorative Background Accents */}
          <div className="absolute -top-12 -left-12 w-44 h-44 rounded-full bg-blue-500/15 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-52 h-52 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-5">
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/15">
                  <CreditCard size={20} className="text-blue-300" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-blue-300 font-bold block">
                    DIGITAL STUDENT ID • بطاقة الطالب الرقمية
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

            {/* Download Attendance PDF Report Button inside Student ID Card */}
            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setAttendanceReportStudent(userToDisplay)}
                className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold border border-white/20 transition flex items-center gap-2 active:scale-95"
              >
                <Download size={14} className="text-blue-200" />
                <span>تقرير الحضور والغياب (PDF شهري / فصلي) 📄</span>
              </button>
            </div>
          </div>
        </div>

        {/* Theme Selector (Only for own profile) */}
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
                <ThemeSelector currentTheme={theme} onChange={setTheme} />
              </div>

              <div className="h-8 w-px bg-gray-100 dark:bg-slate-700 hidden md:block"></div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 dark:text-gray-400">
                  الوضع الليلي
                </label>
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-gray-50 border-gray-200 text-gray-600"}`}
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

        {/* Representative Management Card - Exclusive to System Owner (ahmed) */}
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
                onClick={() => setIsRepManagerOpen(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold transition shadow-md shadow-orange-500/20 flex items-center gap-2 self-start sm:self-auto shrink-0 active:scale-95"
              >
                <Crown size={16} />
                <span>إدارة الممثلين والأكواد</span>
              </button>
            </div>
          </div>
        )}

        {/* Reset System for Production Card - Exclusive to System Owner (ahmed) */}
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
                onClick={handleResetDatabase}
                disabled={isResettingDb}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-red-600/20 flex items-center gap-2 self-start sm:self-auto shrink-0 active:scale-95 disabled:opacity-50"
              >
                {isResettingDb ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                <span>تصفير النظام الآن</span>
              </button>
            </div>
          </div>
        )}

        {/* Redeem Representative Code Card - For Students */}
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
                onClick={() => setIsRedeemRepCodeOpen(true)}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-md shadow-amber-500/20 flex items-center gap-2 self-start sm:self-auto shrink-0 active:scale-95"
              >
                <Key size={15} />
                <span>إدخال كود الممثل</span>
              </button>
            </div>
          </div>
        )}

        {/* Assistant Representative Action Card - When Admin views another student in batch */}
        {!isOwnProfile && isMainAdmin && userToDisplay.role !== UserRole.OWNER && userToDisplay.role !== UserRole.REPRESENTATIVE && (
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
                onClick={() => handleToggleAssistantRep(userToDisplay)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-md flex items-center gap-2 self-start sm:self-auto shrink-0 active:scale-95 ${
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

  if (loadingApp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900 text-primary">
        <Loader2 size={40} className="animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthScreen
        users={appUsers}
        onLogin={(user) => {
          localStorage.setItem("dafaaty_user_uid", user.uid);
          setCurrentUser(user);
        }}
        onSignup={async (user) => {
          await saveUserToFirestore(user);
          localStorage.setItem("dafaaty_user_uid", user.uid);
          setCurrentUser(user);
        }}
      />
    );
  }

  const showLanding =
    currentUser?.role === UserRole.STUDENT &&
    !currentUser.batchCode &&
    !isStealthMode;

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      user={currentUser}
      onLogout={handleLogout}
      onOpenRepModal={isOwner ? () => setIsRepManagerOpen(true) : undefined}
      joinRequestsCount={joinRequests.length}
    >
      {showLanding ? (
        activeTab === Tab.PROFILE ? (
          renderProfile()
        ) : (
          renderNoBatchLanding()
        )
      ) : (
        <>
          {activeTab === Tab.HOME && renderHome()}
          {activeTab === Tab.LEADERBOARD && (
            <BatchLeaderboard
              currentUser={currentUser}
              users={appUsers}
              courses={courses}
              grades={grades}
              sessions={attendanceSessions}
              records={attendanceRecords}
              assignments={assignments}
              materials={materials}
              effectiveBatchCode={effectiveBatchCode || ""}
              onViewProfile={handleViewProfile}
            />
          )}
          {activeTab === Tab.ASSIGNMENTS && renderAssignments()}
          {activeTab === Tab.SCHEDULE && renderSchedule()}
          {activeTab === Tab.GRADES && renderGrades()}
          {activeTab === Tab.ATTENDANCE && renderAttendance()}
          {activeTab === Tab.MATERIALS && renderMaterials()}
          {activeTab === Tab.SUMMARIES && (
            <StudentSummariesHub
              currentUser={currentUser}
              courses={courses}
              summaries={studentSummaries}
              effectiveBatchCode={effectiveBatchCode || ""}
              isManager={isManager}
              onPreviewImage={(title, url) =>
                setPreviewItem({ title, url, type: "IMAGE" })
              }
              onViewProfile={handleViewProfile}
            />
          )}
          {activeTab === Tab.SUGGESTIONS && (
            <BatchSuggestionsBox
              currentUser={currentUser}
              courses={courses}
              suggestions={batchSuggestions}
              effectiveBatchCode={effectiveBatchCode || ""}
              isManager={isManager}
              onViewProfile={handleViewProfile}
            />
          )}
          {activeTab === Tab.CHAT && renderChat()}
          {activeTab === Tab.STUDENTS && renderStudentManagement()}
          {activeTab === Tab.COURSES && renderCourseManagement()}
          {activeTab === Tab.PROJECTS && renderProjects()}
          {activeTab === Tab.BATCHES && renderBatches()}
          {activeTab === Tab.REQUESTS && renderJoinRequests()}
          {activeTab === Tab.PROFILE && renderProfile()}
        </>
      )}

      <RepresentativeManagerModal
        isOpen={isRepManagerOpen}
        onClose={() => setIsRepManagerOpen(false)}
        batches={batches}
        users={appUsers}
        codes={representativeCodes}
      />

      {attendanceReportStudent && (
        <StudentAttendanceReportModal
          isOpen={!!attendanceReportStudent}
          onClose={() => setAttendanceReportStudent(null)}
          initialStudent={attendanceReportStudent}
          allStudents={
            isManager
              ? appUsers
                  .filter((u) => {
                    if (u.role === UserRole.OWNER) return false;
                    if (u.excludeFromStats) return false;
                    if (u.batchCode === effectiveBatchCode) return true;
                    if (
                      u.isOfficial &&
                      (!u.batchCode || u.batchCode === effectiveBatchCode)
                    )
                      return true;
                    return false;
                  })
                  .sort((a, b) =>
                    a.name.localeCompare(b.name, "ar", { sensitivity: "base" })
                  )
              : undefined
          }
          isManager={isManager}
          canSelectOtherStudents={isManager}
          courses={courses}
          attendanceSessions={attendanceSessions}
          attendanceRecords={attendanceRecords}
          batch={batches.find((b) => b.code === effectiveBatchCode)}
          batchCode={effectiveBatchCode || ""}
        />
      )}

      {/* Modal: In-App Image Viewer ONLY */}
      {previewItem && previewItem.type === "IMAGE" && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 w-full max-w-5xl mx-auto rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 flex flex-col flex-1 overflow-hidden">
            {/* Viewer Header */}
            <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <ImageIcon size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm sm:text-base text-gray-800 dark:text-white truncate">
                    {previewItem.title}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    معاينة الصورة
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    downloadFile(previewItem.url, `${previewItem.title}.jpg`);
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition active:scale-95"
                >
                  <Download size={15} />
                  <span>تنزيل الصورة</span>
                </button>
                <button
                  onClick={() => setPreviewItem(null)}
                  className="w-9 h-9 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-300 transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Viewer Body */}
            <div className="flex-1 bg-gray-100 dark:bg-slate-900 relative overflow-auto flex items-center justify-center p-2">
              {isLoadingPreview ? (
                <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-gray-400">
                  <Loader2 size={32} className="animate-spin text-primary" />
                  <span className="text-xs font-bold">جاري فتح الصورة...</span>
                </div>
              ) : (
                <img
                  src={resolvedPreviewUrl || previewItem.url}
                  alt={previewItem.title}
                  className="max-w-full max-h-full object-contain rounded-xl shadow-md"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Redeem Representative Code */}
      {isRedeemRepCodeOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-slate-700 space-y-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <Crown size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-800 dark:text-white">
                    تفعيل كود الممثل
                  </h3>
                  <p className="text-xs text-gray-400">
                    أدخل الكود السري الممنوح لك من المطور
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsRedeemRepCodeOpen(false);
                  setRedeemFeedback(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            {redeemFeedback && (
              <div
                className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
                  redeemFeedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/40 dark:text-red-300"
                }`}
              >
                {redeemFeedback.type === "success" ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                <span>{redeemFeedback.text}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                كود الممثل (مثل: REP-ENG26-7842)
              </label>
              <input
                type="text"
                value={redeemCodeInput}
                onChange={(e) => setRedeemCodeInput(e.target.value.toUpperCase())}
                placeholder="REP-XXXX-XXXX"
                className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-amber-500/20 text-center tracking-widest"
                dir="ltr"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setIsRedeemRepCodeOpen(false);
                  setRedeemFeedback(null);
                }}
                className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={handleRedeemRepCodeSubmit}
                disabled={isRedeemingCode || !redeemCodeInput.trim()}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-50 transition active:scale-95"
              >
                {isRedeemingCode ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <ShieldCheck size={15} />
                )}
                <span>تأكيد وتفعيل الرتبة</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
