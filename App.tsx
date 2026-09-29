import React, { useState, useEffect, useRef } from "react";
import Layout from "./components/Layout";
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
  Assignment,
  AssignmentAttachment,
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
} from "lucide-react";

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
  subscribeAttendanceSessions,
  saveAttendanceSessionToFirestore,
  deleteAttendanceSessionFromFirestore,
  subscribeAttendanceRecords,
  saveAttendanceRecordToFirestore,
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
  loginWithGoogle,
  logoutUser,
  isUsernameTaken,
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
        // Login Logic
        const user = users.find(
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

        <button
          type="button"
          onClick={async () => {
            setIsLoading(true);
            setError("");
            try {
              const gUser = await loginWithGoogle();
              onLogin(gUser);
            } catch (err: any) {
              console.error(err);
              setError("تعذر تسجيل الدخول بواسطة Google");
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

        {/* Quick Developer Account autofill */}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700/60 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLoginMode(true);
              setUsername("ahmed");
              setPassword("ahmed0828");
            }}
            className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 px-3 py-1 rounded-full font-bold transition inline-flex items-center gap-1"
          >
            <ShieldCheck size={12} />
            حساب المطور الرئيسي (ahmed)
          </button>
        </div>

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
  const isManager =
    currentUser?.role === UserRole.REPRESENTATIVE ||
    currentUser?.role === UserRole.ADMIN ||
    currentUser?.role === UserRole.OWNER;
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
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);

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

  // Grade Editing State (Admin)
  const [isEditingGrades, setIsEditingGrades] = useState(false);
  const [selectedCourseForGrading, setSelectedCourseForGrading] =
    useState<Course | null>(null);
  const [selectedAssessmentForGrading, setSelectedAssessmentForGrading] =
    useState<AssessmentStructure | null>(null);
  const [tempGrades, setTempGrades] = useState<{ [studentId: string]: number }>(
    {},
  );

  // Attendance Management State (Admin)
  const [selectedCourseForAttendance, setSelectedCourseForAttendance] =
    useState<Course | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const [newSessionDate, setNewSessionDate] = useState("");
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [isAddingSession, setIsAddingSession] = useState(false);

  // Student Management State (Admin)
  const [newStudentName, setNewStudentName] = useState("");

  // Admin Management State (Owner Only)
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [newAdminPass, setNewAdminPass] = useState("");
  const [promoteUsername, setPromoteUsername] = useState("");

  // Announcements State
  const [isAddingAnnouncement, setIsAddingAnnouncement] = useState(false);
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState("");
  const [newAnnouncementContent, setNewAnnouncementContent] = useState("");
  const [newAnnouncementPriority, setNewAnnouncementPriority] = useState<
    "normal" | "high"
  >("normal");
  const [newAnnouncementCourse, setNewAnnouncementCourse] = useState("");
  const [newAnnouncementMediaUrl, setNewAnnouncementMediaUrl] = useState("");
  const [newAnnouncementMediaType, setNewAnnouncementMediaType] = useState<"image" | "video" | "link">("link");

  // Projects State (مشروع -> مادة -> كروبات -> أعضاء)
  const [projects, setProjects] = useState<CourseProject[]>([]);
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

  // Assignments (الواجبات والتكليفات) State
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [newAssignTitle, setNewAssignTitle] = useState("");
  const [newAssignCourseId, setNewAssignCourseId] = useState("");
  const [newAssignDesc, setNewAssignDesc] = useState("");
  const [newAssignDueDate, setNewAssignDueDate] = useState("");
  const [newAssignNotify, setNewAssignNotify] = useState(true);
  const [newAssignAttachmentUrl, setNewAssignAttachmentUrl] = useState("");
  const [newAssignAttachmentType, setNewAssignAttachmentType] = useState<"link" | "file" | "image">("link");
  const [assignFilterStatus, setAssignFilterStatus] = useState<"all" | "pending" | "completed" | "urgent">("all");
  const [assignFilterCourse, setAssignFilterCourse] = useState("all");
  const [assignSearchQuery, setAssignSearchQuery] = useState("");

  // --- Firebase Initialization and Listeners ---
  useEffect(() => {
    // 1. Seed initial data to Firestore if empty
    seedInitialDataIfEmpty();

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

    const unsubSettings = subscribeSettings((settings) => {
      if (settings["chat_settings"]) {
        setIsChatLocked(Boolean(settings["chat_settings"].chatLocked));
      }
    });

    return () => {
      unsubUsers();
      unsubBatches();
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
    if (!currentUser || currentUser.role !== UserRole.REPRESENTATIVE || !currentUser.batchCode) {
      setJoinRequests([]);
      return;
    }
    const unsubReqs = subscribeJoinRequests(currentUser.batchCode, (items) => {
      setJoinRequests(items);
    });
    return () => unsubReqs();
  }, [currentUser]);

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
    if (!newStudentName) return;
    const uid = `u_${Date.now()}`;
    const newStudent: User = {
      uid,
      name: newStudentName,
      username: `student_${Date.now()}`,
      role: UserRole.STUDENT,
      isOfficial: true,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newStudentName)}&background=random`,
      bio: "طالب جامعي",
      signatureColor: "#94a3b8",
    };
    await saveUserToFirestore(newStudent);
    setNewStudentName("");
  };

  const handleDeleteUser = async (uid: string) => {
    await deleteUserFromFirestore(uid);
  };

  // Add Admin (Creates a full account, Owner only)
  const handleAddAdmin = async () => {
    if (!newAdminName || !newAdminUsername || !newAdminPass) return;

    try {
      const newAdmin: User = {
        uid: `admin_${Date.now()}`,
        name: newAdminName,
        username: newAdminUsername,
        password: newAdminPass,
        role: UserRole.ADMIN,
        isOfficial: true,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newAdminName)}&background=0D8ABC&color=fff`,
        bio: "مشرف النظام",
        signatureColor: "#0ea5e9",
      };

      await saveUserToFirestore(newAdmin);

      setIsAddingAdmin(false);
      setNewAdminName("");
      setNewAdminUsername("");
      setNewAdminPass("");
    } catch (e: any) {
      console.error("Error adding admin:", e);
    }
  };

  const handlePromoteUser = async () => {
    if (!promoteUsername) return;
    const targetUser = appUsers.find(
      (u) => u.username?.toLowerCase() === promoteUsername.toLowerCase(),
    );
    if (targetUser) {
      if (
        targetUser.role === UserRole.ADMIN ||
        targetUser.role === UserRole.OWNER
      ) {
        return;
      }

      const updatedUser: User = {
        ...targetUser,
        role: UserRole.ADMIN,
        isOfficial: true,
        bio: targetUser.bio || "تمت ترقيته إلى مشرف",
      };

      await saveUserToFirestore(updatedUser);
      setPromoteUsername("");
    }
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
      currentUser?.role !== UserRole.ADMIN &&
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
  const handleJoinRequestSubmit = async () => {
    if (!joiningCode || !currentUser) return;
    const req: JoinRequest = {
      id: `req_${currentUser.uid}`,
      userId: currentUser.uid,
      userName: currentUser.name,
      userEmail: currentUser.email || "",
      userAvatar: currentUser.avatar,
      batchCode: joiningCode.trim().toUpperCase(),
      status: "PENDING",
      timestamp: Date.now(),
    };
    await saveJoinRequestToFirestore(req);

    // Update user pendingBatchCode
    await saveUserToFirestore({
      ...currentUser,
      pendingBatchCode: joiningCode.trim().toUpperCase(),
    });

    setIsJoiningBatch(false);
    setJoiningCode("");
  };

  const handleApproveRequest = async (req: JoinRequest) => {
    // 1. Update user document
    const targetUser = appUsers.find((u) => u.uid === req.userId);
    if (targetUser) {
      await saveUserToFirestore({
        ...targetUser,
        batchCode: req.batchCode,
        pendingBatchCode: "",
      });
    }
    // 2. Delete request
    await deleteJoinRequestFromFirestore(req.id);
  };

  const handleRejectRequest = async (id: string) => {
    const req = joinRequests.find((r) => r.id === id);
    if (req) {
      const targetUser = appUsers.find((u) => u.uid === req.userId);
      if (targetUser) {
        await saveUserToFirestore({
          ...targetUser,
          pendingBatchCode: "",
        });
      }
    }
    await deleteJoinRequestFromFirestore(id);
  };

  // --- Course Logic ---
  const handleAddAssessmentToNewCourse = () => {
    if (!newAssessmentName || !newAssessmentScore) return;
    const newItem: AssessmentStructure = {
      id: `asm_${Date.now()}`,
      name: newAssessmentName,
      maxScore: parseInt(newAssessmentScore),
      date: newAssessmentDate || "",
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
    if (
      !newCourseName ||
      courseProfessors.length === 0 ||
      newAssessments.length === 0
    )
      return;

    const courseData: Course = {
      id: editingCourseId || `course_${Date.now()}`,
      batchCode: effectiveBatchCode,
      name: newCourseName,
      professors: courseProfessors,
      assessments: newAssessments,
      code: `CODE${Date.now().toString().slice(-4)}`,
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
      assessments: [
        { id: `asm_${Date.now()}_1`, name: "ميدتيرم", maxScore: 40 },
        { id: `asm_${Date.now()}_2`, name: "سعي", maxScore: 10 },
        { id: `asm_${Date.now()}_3`, name: "نهائي", maxScore: 50 },
      ],
      code: `C${Math.floor(100 + Math.random() * 899)}`,
    };

    await saveCourseToFirestore(courseData);
    setNewSimpleCourseName("");
    setSimpleCourseProf("");
  };

  const handleStartEditCourse = (course: Course) => {
    setEditingCourseId(course.id);
    setNewCourseName(course.name);
    setCourseProfessors(course.professors);
    setNewAssessments(course.assessments);
    setIsAddingCourse(true);
  };

  const handleDeleteCourse = async (courseId: string) => {
    await deleteCourseFromFirestore(courseId);
  };

  // --- Grades Logic ---
  const handleOpenGradeEditor = (
    course: Course,
    assessment: AssessmentStructure,
  ) => {
    setSelectedCourseForGrading(course);
    setSelectedAssessmentForGrading(assessment);

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

    for (const [studentId, score] of Object.entries(tempGrades)) {
      const existingGrade = grades.find(
        (g) =>
          g.studentId === studentId &&
          g.assessmentId === selectedAssessmentForGrading?.id,
      );
      const gradeData: Grade = {
        id: existingGrade
          ? existingGrade.id
          : `grade_${Date.now()}_${studentId}`,
        batchCode: effectiveBatchCode,
        studentId,
        courseId: selectedCourseForGrading.id,
        assessmentId: selectedAssessmentForGrading.id,
        score: Number(score),
        timestamp: Date.now(),
      };
      await saveGradeToFirestore(gradeData);
    }

    setIsEditingGrades(false);
    setSelectedCourseForGrading(null);
    setSelectedAssessmentForGrading(null);
  };

  // --- Attendance Logic ---
  const handleCreateSession = async () => {
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
    setNewSessionDate("");
    setNewSessionTitle("");
    setIsAddingSession(false);
  };

  const handleDeleteSession = async (sessionId: string) => {
    await deleteAttendanceSessionFromFirestore(sessionId);
    if (selectedSessionId === sessionId) setSelectedSessionId(null);
  };

  const handleMarkAttendance = async (
    studentId: string,
    isPresent: boolean,
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
      status: isPresent ? "PRESENT" : "ABSENT",
      timestamp: Date.now(),
    };
    await saveAttendanceRecordToFirestore(recData);
  };

  // --- Materials Logic ---
  const handleAddMaterialSection = async () => {
    if (!newSectionName || !activeMatCourse) return;
    const newSection: MaterialSection = {
      id: `section_${Date.now()}`,
      batchCode: effectiveBatchCode,
      courseId: activeMatCourse.id,
      title: newSectionName,
      icon: "FOLDER",
    };
    await saveMaterialSectionToFirestore(newSection);
    setNewSectionName("");
    setIsAddingSection(false);
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
    };
    await saveMaterialToFirestore(newMaterial);
    setNewMatTitle("");
    setNewMatUrl("");
    setIsAddingMaterial(false);
  };

  const handleDeleteMaterialItem = async (matId: string) => {
    await deleteMaterialFromFirestore(matId);
  };

  const handleAddAnnouncement = async () => {
    if (!newAnnouncementTitle || !newAnnouncementContent || !currentUser)
      return;
    
    const selectedCourse = courses.find(c => c.id === newAnnouncementCourse);
    
    const newAnnouncement: Announcement = {
      id: `ann_${Date.now()}`,
      batchCode: effectiveBatchCode,
      title: newAnnouncementTitle,
      content: newAnnouncementContent,
      timestamp: Date.now(),
      authorId: currentUser.uid,
      authorName: currentUser.name,
      priority: newAnnouncementPriority,
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
    setNewAnnouncementCourse("");
    setNewAnnouncementMediaUrl("");
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

    const groupItem: ProjectGroupItem = {
      id: editingGroupId || `grp_${Date.now()}`,
      name: newGroupName.trim(),
      members: newGroupMembers,
      createdAt: Date.now(),
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
    setNewAssignNotify(true);
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

        {/* Urgent Assignment Banner Alert */}
        {(() => {
          const pending = assignments.filter((a) => !a.completedBy?.includes(currentUser?.uid || ""));
          const urgent = pending.filter((a) => {
            const diff = a.dueTimestamp - currentTimer;
            return diff > 0 && diff <= 48 * 60 * 60 * 1000;
          });
          const overdue = pending.filter((a) => a.dueTimestamp - currentTimer <= 0);

          if (urgent.length === 0 && overdue.length === 0) return null;

          return (
            <div className={`p-4 rounded-3xl text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 ${
              overdue.length > 0 
                ? "bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 shadow-red-500/20"
                : "bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 shadow-orange-500/20 animate-pulse"
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                  <AlertCircle size={22} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm md:text-base">
                      {overdue.length > 0 ? "تنبيه: لديك واجبات انتهت مدة تسليمها!" : "تنبيه هام: تسليم واجب دراسي وشيك ⏳"}
                    </span>
                    <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {overdue.length > 0 ? `${overdue.length} متأخر` : `${urgent.length} عاجل`}
                    </span>
                  </div>
                  <p className="text-xs text-white/90 mt-0.5">
                    {overdue.length > 0 
                      ? `واجب (${overdue[0].title} - ${overdue[0].courseName}) ومواعيد أخرى تحتاج المراجعة فوراً.`
                      : `واجب (${urgent[0].title} - ${urgent[0].courseName}) ينتهي موعده قريباً!`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab(Tab.ASSIGNMENTS)}
                className="bg-white text-orange-600 hover:bg-orange-50 px-4 py-2 rounded-xl text-xs font-black shadow-md transition shrink-0 active:scale-95"
              >
                عرض الواجب وتسليمه ➔
              </button>
            </div>
          );
        })()}

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

        {/* Announcements List */}
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className={`bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden group ${ann.priority === "high" ? "border-l-4 border-l-red-500" : ""}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold ${ann.priority === "high" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}
                  >
                    {ann.priority === "high" ? "هام جداً" : "إعلان عام"}
                  </span>
                  {ann.courseName && (
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded-lg text-[10px] font-bold">
                      {ann.courseName}
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400">
                    {new Date(ann.timestamp).toLocaleDateString("ar-EG")}
                  </span>
                </div>
                {isManager && (
                  <button
                    onClick={() => handleDeleteAnnouncement(ann.id)}
                    className="text-gray-300 hover:text-red-500 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-2">
                {ann.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line mb-4">
                {ann.content}
              </p>

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
          ))}
          {announcements.length === 0 && (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 border-dashed">
              لا توجد إعلانات حالياً
            </div>
          )}
        </div>

        {/* Add Announcement Modal */}
        {isAddingAnnouncement && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl p-6 animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                  إضافة إعلان جديد
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
                  className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm outline-none h-32 resize-none"
                  value={newAnnouncementContent}
                  onChange={(e) => setNewAnnouncementContent(e.target.value)}
                ></textarea>
                
                <div className="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-700">
                  <label className="text-[10px] font-bold text-gray-400 mb-2 block uppercase tracking-wider">وسائط الإعلان (اختياري)</label>
                  <div className="flex flex-col md:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="رابط الصورة، الفيديو، أو موقع خارجي..."
                      className="flex-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none"
                      value={newAnnouncementMediaUrl}
                      onChange={(e) => setNewAnnouncementMediaUrl(e.target.value)}
                    />
                    <select
                      value={newAnnouncementMediaType}
                      onChange={(e) => setNewAnnouncementMediaType(e.target.value as any)}
                      className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none"
                    >
                      <option value="image">صورة</option>
                      <option value="video">فيديو</option>
                      <option value="link">رابط</option>
                    </select>
                  </div>
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
    // MANAGER VIEW (Representative, Admin, Owner)
    if (isManager) {
      return (
        <div className="space-y-6 p-4">
          {/* Header & Add Course Button */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <GraduationCap className="text-primary" size={24} />
              إدارة المواد والدرجات
            </h2>
            <button
              onClick={() => {
                setIsAddingCourse(true);
                setEditingCourseId(null);
                setNewCourseName("");
                setCourseProfessors([]);
                setNewAssessments([]);
              }}
              className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition flex items-center gap-2"
            >
              <Plus size={18} />
              إضافة مادة
            </button>
          </div>

          {/* Add/Edit Course Modal */}
          {isAddingCourse && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                    {editingCourseId ? "تعديل المادة" : "إضافة مادة جديدة"}
                  </h3>
                  <button onClick={() => setIsAddingCourse(false)}>
                    <X size={20} className="text-gray-400 dark:text-gray-500" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Course Name */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                      اسم المادة
                    </label>
                    <input
                      type="text"
                      value={newCourseName}
                      onChange={(e) => setNewCourseName(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm outline-none"
                      placeholder="مثال: رياضيات حاسوبية"
                    />
                  </div>

                  {/* Professors */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                      دكاترة المادة
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={tempProfName}
                        onChange={(e) => setTempProfName(e.target.value)}
                        className="flex-1 bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm outline-none"
                        placeholder="د. فلان"
                      />
                      <button
                        onClick={handleAddProf}
                        className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 px-4 rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-slate-600"
                      >
                        إضافة
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {courseProfessors.map((prof, idx) => (
                        <span
                          key={idx}
                          className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2"
                        >
                          {prof}
                          <button
                            onClick={() => handleRemoveProf(idx)}
                            className="text-blue-400 hover:text-blue-600"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Assessments Config */}
                  <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 block">
                      توزيع الدرجات (الامتحانات والواجبات)
                    </label>
                    <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl space-y-3 mb-2">
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="عنوان (مثال: ميدتيرم)"
                          className="col-span-1 bg-white dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-xs outline-none"
                          value={newAssessmentName}
                          onChange={(e) => setNewAssessmentName(e.target.value)}
                        />
                        <input
                          type="number"
                          placeholder="الدرجة"
                          className="col-span-1 bg-white dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-xs outline-none"
                          value={newAssessmentScore}
                          onChange={(e) =>
                            setNewAssessmentScore(e.target.value)
                          }
                        />
                        <button
                          onClick={handleAddAssessmentToNewCourse}
                          className="col-span-1 bg-primary text-white rounded-lg text-xs font-bold"
                        >
                          إضافة بند
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {newAssessments.map((asm) => (
                        <div
                          key={asm.id}
                          className="flex justify-between items-center p-3 bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-xl shadow-sm"
                        >
                          <div>
                            <p className="font-bold text-sm text-gray-800 dark:text-white">
                              {asm.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {asm.maxScore} درجة
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              handleRemoveAssessmentFromNewCourse(asm.id)
                            }
                            className="text-red-300 hover:text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6 border-t border-gray-100 dark:border-slate-700 pt-4">
                  <button
                    onClick={() => setIsAddingCourse(false)}
                    className="px-4 py-2 text-gray-500 dark:text-gray-400 font-bold text-sm hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSaveCourse}
                    className="px-6 py-2 bg-primary text-white font-bold text-sm rounded-xl shadow-lg hover:bg-primary/90"
                  >
                    حفظ المادة
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Grade Editing Modal */}
          {isEditingGrades &&
            selectedCourseForGrading &&
            selectedAssessmentForGrading && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 h-[80vh] flex flex-col">
                  <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-slate-700 pb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                        رصد الدرجات: {selectedCourseForGrading.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedAssessmentForGrading.name} (من{" "}
                        {selectedAssessmentForGrading.maxScore})
                      </p>
                    </div>
                    <button onClick={() => setIsEditingGrades(false)}>
                      <X
                        size={20}
                        className="text-gray-400 dark:text-gray-500"
                      />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-right">
                      <thead className="bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-gray-300 text-xs font-bold sticky top-0">
                        <tr>
                          <th className="p-3 rounded-r-xl">الطالب</th>
                          <th className="p-3">الدرجة</th>
                          <th className="p-3 rounded-l-xl">الحالة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                        {appUsers
                          .filter(
                            (u) => u.role === UserRole.STUDENT && u.isOfficial,
                          )
                          .map((student) => (
                            <tr key={student.uid}>
                              <td
                                className="p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg transition"
                                onClick={() => handleViewProfile(student.uid)}
                              >
                                <img
                                  src={student.avatar}
                                  className="w-8 h-8 rounded-full"
                                  alt=""
                                />
                                <span className="font-bold text-sm text-gray-700 dark:text-gray-200">
                                  {student.name}
                                </span>
                              </td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  min="0"
                                  max={selectedAssessmentForGrading.maxScore}
                                  value={
                                    tempGrades[student.uid] !== undefined
                                      ? tempGrades[student.uid]
                                      : ""
                                  }
                                  onChange={(e) => {
                                    const val =
                                      e.target.value === ""
                                        ? undefined
                                        : Math.min(
                                            parseInt(e.target.value) || 0,
                                            selectedAssessmentForGrading.maxScore,
                                          );
                                    if (val !== undefined)
                                      setTempGrades({
                                        ...tempGrades,
                                        [student.uid]: val,
                                      });
                                    else {
                                      const newGrades = { ...tempGrades };
                                      delete newGrades[student.uid];
                                      setTempGrades(newGrades);
                                    }
                                  }}
                                  className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 dark:text-white rounded-lg px-3 py-1 text-sm outline-none w-20 text-center font-bold"
                                />
                              </td>
                              <td className="p-3">
                                {tempGrades[student.uid] !== undefined ? (
                                  <span className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-md">
                                    تم الرصد
                                  </span>
                                ) : (
                                  <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-md">
                                    --
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                    <button
                      onClick={() => setIsEditingGrades(false)}
                      className="px-4 py-2 text-gray-500 dark:text-gray-400 font-bold text-sm hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleSaveGrades}
                      className="px-6 py-2 bg-primary text-white font-bold text-sm rounded-xl shadow-lg hover:bg-primary/90 flex items-center gap-2"
                    >
                      <Save size={16} />
                      حفظ الدرجات
                    </button>
                  </div>
                </div>
              </div>
            )}

          {/* Course List */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden group"
              >
                <div className="p-5 border-b border-gray-50 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/30 flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                      {course.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {course.professors.join("، ")}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleStartEditCourse(course)}
                      className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <p className="text-xs font-bold text-gray-400 mb-2">
                    بنود التقييم
                  </p>
                  {course.assessments.map((asm) => (
                    <div
                      key={asm.id}
                      className="flex justify-between items-center bg-gray-50 dark:bg-slate-700/50 p-2 rounded-xl border border-gray-100 dark:border-slate-700"
                    >
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        {asm.name}{" "}
                        <span className="text-gray-400 text-xs">
                          ({asm.maxScore})
                        </span>
                      </span>
                      <button
                        onClick={() => handleOpenGradeEditor(course, asm)}
                        className="text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 hover:border-primary hover:text-primary dark:text-gray-300 px-3 py-1 rounded-lg transition font-bold shadow-sm"
                      >
                        رصد
                      </button>
                    </div>
                  ))}
                  {course.assessments.length === 0 && (
                    <p className="text-center text-xs text-gray-400 py-2">
                      لا توجد بنود تقييم
                    </p>
                  )}
                </div>
              </div>
            ))}
            {courses.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400 dark:text-gray-500">
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
        <div className="space-y-6 p-4">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden mb-6">
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-2">سجل الدرجات 🎓</h2>
              <p className="opacity-90 text-sm">
                تابع تحصيلك الدراسي ودرجاتك أولاً بأول.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {courses.map((course) => {
              // Calculate Student Score
              const studentGrades = grades.filter(
                (g) =>
                  g.courseId === course.id && g.studentId === currentUser?.uid,
              );
              const totalScore = studentGrades.reduce(
                (acc, g) => acc + g.score,
                0,
              );
              const maxPossible = course.assessments.reduce(
                (acc, a) => acc + a.maxScore,
                0,
              );
              const percentage =
                maxPossible > 0
                  ? Math.round((totalScore / maxPossible) * 100)
                  : 0;

              return (
                <div
                  key={course.id}
                  className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition duration-300"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                        {course.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {course.professors.join("، ")}
                      </p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-bold ${percentage >= 50 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
                    >
                      {percentage}%
                    </div>
                  </div>

                  <div className="space-y-3">
                    {course.assessments.map((asm) => {
                      const grade = studentGrades.find(
                        (g) => g.assessmentId === asm.id,
                      );
                      return (
                        <div
                          key={asm.id}
                          className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl"
                        >
                          <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                            {asm.name}
                          </span>
                          <div className="flex items-center gap-1">
                            <span
                              className={`font-bold ${grade ? "text-gray-800 dark:text-white" : "text-gray-400"}`}
                            >
                              {grade ? grade.score : "-"}
                            </span>
                            <span className="text-xs text-gray-400">
                              / {asm.maxScore}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {course.assessments.length === 0 && (
                      <p className="text-center text-xs text-gray-400">
                        لا توجد تفاصيل متاحة
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                      المجموع الكلي
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {totalScore}{" "}
                      <span className="text-xs text-gray-400">
                        / {maxPossible}
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
            {courses.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400 dark:text-gray-500">
                لا توجد مواد مسجلة لعرض الدرجات.
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
        const students = appUsers.filter(
          (u) => u.role === UserRole.STUDENT && u.isOfficial,
        );

        return (
          <div className="space-y-6 p-4">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setSelectedSessionId(null)}
                className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition"
              >
                <ChevronLeft
                  size={20}
                  className="rtl:rotate-180 text-gray-600 dark:text-gray-300"
                />
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  {session?.title}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {course?.name} - {session?.date}
                </p>
              </div>
              <div className="mr-auto bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold text-sm">
                حضور: {presentCount} / {students.length}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
              <div className="divide-y divide-gray-50 dark:divide-slate-700">
                {students.map((student) => {
                  const record = records.find(
                    (r) => r.studentId === student.uid,
                  );
                  const isPresent = record?.status === "PRESENT";

                  return (
                    <div
                      key={student.uid}
                      className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={student.avatar}
                          className="w-10 h-10 rounded-full"
                          alt=""
                        />
                        <span className="font-bold text-gray-700 dark:text-gray-200">
                          {student.name}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleMarkAttendance(student.uid, true)
                          }
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition ${isPresent ? "bg-green-500 text-white shadow-lg shadow-green-200" : "bg-gray-100 dark:bg-slate-700 text-gray-400"}`}
                        >
                          حاضر
                        </button>
                        <button
                          onClick={() =>
                            handleMarkAttendance(student.uid, false)
                          }
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition ${record && !isPresent ? "bg-red-500 text-white shadow-lg shadow-red-200" : "bg-gray-100 dark:bg-slate-700 text-gray-400"}`}
                        >
                          غائب
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
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
                const studentsCount = appUsers.filter(
                  (u) => u.role === UserRole.STUDENT && u.isOfficial,
                ).length;

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
            {isAddingSession && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95">
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4">
                    تسجيل محاضرة جديدة
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
                        عنوان (اختياري)
                      </label>
                      <input
                        type="text"
                        value={newSessionTitle}
                        onChange={(e) => setNewSessionTitle(e.target.value)}
                        placeholder="مثال: مقدمة في البرمجة"
                        className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm outline-none"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setIsAddingSession(false)}
                        className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 py-2 rounded-xl font-bold text-sm"
                      >
                        إلغاء
                      </button>
                      <button
                        onClick={handleCreateSession}
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

      // Select Course View
      return (
        <div className="space-y-6 p-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <CalendarCheck className="text-primary" size={24} />
            إدارة الحضور والغياب
          </h2>
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
        </div>
      );
    }

    // Student View
    else {
      return (
        <div className="space-y-6 p-4">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl p-6 text-white shadow-xl shadow-emerald-200 relative overflow-hidden mb-6">
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-2">سجل الحضور 📅</h2>
              <p className="opacity-90 text-sm">
                احرص على حضور المحاضرات بانتظام لتجنب الحرمان.
              </p>
            </div>
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
              ).length; // Or calculated differently depending on business logic (unrecorded = absent?) -> For now explicit records

              // Assuming only explicit records count. If session exists but no record, maybe consider absent or pending. Let's assume explicit for now.
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

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-2xl">
                      <span className="block text-2xl font-bold text-gray-800 dark:text-white">
                        {totalSessions}
                      </span>
                      <span className="text-xs text-gray-400">محاضرة</span>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/10 rounded-2xl">
                      <span className="block text-2xl font-bold text-green-600">
                        {presentCount}
                      </span>
                      <span className="text-xs text-green-400">حاضر</span>
                    </div>
                    <div className="text-center p-3 bg-red-50 dark:bg-red-900/10 rounded-2xl">
                      <span className="block text-2xl font-bold text-red-600">
                        {absentCount}
                      </span>
                      <span className="text-xs text-red-400">غائب</span>
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
    // If inside a specific section of a course
    if (activeMatCourse && activeMatSection) {
      const sectionMaterials = materials.filter(
        (m) => m.sectionId === activeMatSection.id,
      );

      return (
        <div className="space-y-6 p-4">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setActiveMatSection(null)}
              className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition"
            >
              <ChevronLeft
                size={20}
                className="rtl:rotate-180 text-gray-600 dark:text-gray-300"
              />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                {activeMatSection.title}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {activeMatCourse.name}
              </p>
            </div>
            {isManager && (
              <button
                onClick={() => setIsAddingMaterial(true)}
                className="mr-auto bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition flex items-center gap-2"
              >
                <Upload size={18} />
                رفع ملف
              </button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sectionMaterials.map((mat) => (
              <div
                key={mat.id}
                className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition group relative"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-slate-700 flex items-center justify-center text-gray-400 dark:text-gray-300 flex-shrink-0">
                    {mat.type === "PDF" && (
                      <FileText size={24} className="text-red-500" />
                    )}
                    {mat.type === "IMAGE" && (
                      <ImageIcon size={24} className="text-blue-500" />
                    )}
                    {mat.type === "LINK" && (
                      <LinkIcon size={24} className="text-green-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4
                      className="font-bold text-gray-800 dark:text-white truncate mb-1"
                      title={mat.title}
                    >
                      {mat.title}
                    </h4>
                    <p className="text-xs text-gray-400">
                      {new Date(mat.uploadDate).toLocaleDateString("ar-EG")}
                    </p>
                    <a
                      href={mat.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                      {mat.type === "LINK" ? "فتح الرابط" : "تحميل الملف"}
                      <ArrowRight size={12} className="rtl:rotate-180" />
                    </a>
                  </div>
                  {isManager && (
                    <button
                      onClick={() => handleDeleteMaterialItem(mat.id)}
                      className="text-gray-300 hover:text-red-500 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {sectionMaterials.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400 dark:text-gray-500 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 border-dashed">
                لا توجد ملفات في هذا القسم.
              </div>
            )}
          </div>

          {/* Add Material Modal */}
          {isAddingMaterial && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95">
                <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4">
                  إضافة ملف جديد
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                      عنوان الملف
                    </label>
                    <input
                      type="text"
                      value={newMatTitle}
                      onChange={(e) => setNewMatTitle(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm outline-none"
                      placeholder="مثال: المحاضرة الأولى"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                      نوع الملف
                    </label>
                    <div className="flex gap-2">
                      {(["PDF", "IMAGE", "LINK"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setNewMatType(t)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold border ${newMatType === t ? "bg-primary text-white border-primary" : "bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600"}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                      الرابط (URL)
                    </label>
                    <input
                      type="text"
                      value={newMatUrl}
                      onChange={(e) => setNewMatUrl(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm outline-none"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setIsAddingMaterial(false)}
                      className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 py-2 rounded-xl font-bold text-sm"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleAddMaterialItem}
                      className="flex-1 bg-primary text-white py-2 rounded-xl font-bold text-sm shadow-lg shadow-primary/30"
                    >
                      إضافة
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // If inside a course (List Sections)
    if (activeMatCourse) {
      const sections = materialSections.filter(
        (s) => s.courseId === activeMatCourse.id,
      );

      return (
        <div className="space-y-6 p-4">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveMatCourse(null)}
                className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition"
              >
                <ChevronLeft
                  size={20}
                  className="rtl:rotate-180 text-gray-600 dark:text-gray-300"
                />
              </button>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                {activeMatCourse.name}
              </h2>
            </div>
            {isManager && (
              <button
                onClick={() => setIsAddingSection(true)}
                className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition flex items-center gap-2"
              >
                <FolderPlus size={18} />
                مجلد جديد
              </button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {sections.map((section) => (
              <div
                key={section.id}
                onClick={() => setActiveMatSection(section)}
                className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition cursor-pointer group text-center relative"
              >
                {isManager && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSection(section.id);
                    }}
                    className="absolute top-4 left-4 text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <div className="w-16 h-16 mx-auto bg-amber-50 dark:bg-amber-900/10 rounded-2xl flex items-center justify-center text-amber-500 mb-4 group-hover:scale-110 transition">
                  <Folder
                    size={32}
                    fill="currentColor"
                    className="text-amber-400"
                  />
                </div>
                <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                  {section.title}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {materials.filter((m) => m.sectionId === section.id).length}{" "}
                  ملفات
                </p>
              </div>
            ))}
            {sections.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400 dark:text-gray-500 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 border-dashed">
                لا توجد مجلدات في هذه المادة.
              </div>
            )}
          </div>

          {/* Add Section Modal */}
          {isAddingSection && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95">
                <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4">
                  إنشاء مجلد جديد
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                      اسم المجلد
                    </label>
                    <input
                      type="text"
                      value={newSectionName}
                      onChange={(e) => setNewSectionName(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm outline-none"
                      placeholder="مثال: المحاضرة، الكتب، المراجع"
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

    // Default: List Courses
    return (
      <div className="space-y-6 p-4">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-6 text-white shadow-xl shadow-amber-200 relative overflow-hidden mb-6">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">المحاضرات والمراجع 📚</h2>
            <p className="opacity-90 text-sm">
              تصفح وحمل جميع المواد الدراسية بسهولة.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <div
              key={course.id}
              onClick={() => setActiveMatCourse(course)}
              className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/20 text-orange-500 flex items-center justify-center group-hover:scale-110 transition">
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
                <span>تصفح الملفات</span>
                <ArrowRight size={18} className="rtl:rotate-180" />
              </div>
            </div>
          ))}
          {courses.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-400 dark:text-gray-500">
              لا توجد مواد دراسية.
            </div>
          )}
        </div>
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
              const isAdmin = msg.senderRole === UserRole.ADMIN;
              const isRep = msg.senderRole === UserRole.REPRESENTATIVE;

              return (
                <div
                  key={msg.id}
                  id={`msg-${msg.id}`}
                  className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""} group/msg`}
                >
                  <div
                    onClick={() => handleViewProfile(msg.senderId)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0 relative cursor-pointer hover:opacity-80 transition
                       ${isOwner ? "bg-amber-600" : isAdmin ? "bg-primary" : isRep ? "bg-purple-600" : "bg-gray-400"}
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
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{msg.senderName}</span>
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
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleStartEditCourse(course)}
                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition"
                    title="تعديل المادة"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"
                    title="حذف المادة"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderProjects = () => {
    const isManager =
      currentUser?.role === UserRole.REPRESENTATIVE ||
      currentUser?.role === UserRole.ADMIN ||
      currentUser?.role === UserRole.OWNER;

    const batchStudents = appUsers.filter((u) => u.batchCode === effectiveBatchCode);

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
                        <span className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-xs font-bold px-2.5 py-1 rounded-xl">
                          {assignedUidsInProj.size} طالب مسجل
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
                        <span className="text-[10px] bg-emerald-600 text-white font-bold px-3 py-1 rounded-full shrink-0">
                          أنت مسجل في هذا الفريق
                        </span>
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
                        كروبات المشروع ({project.groups?.length || 0})
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
                          const groupLeader = appUsers.find((u) => u.uid === group.leaderId);
                          const membersData = appUsers.filter((u) =>
                            group.members.includes(u.uid)
                          );

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
                                    <div className="flex items-center gap-2">
                                      <h5 className="font-bold text-gray-900 dark:text-white text-base">
                                        {group.name}
                                      </h5>
                                      {isMyGroupItem && (
                                        <span className="bg-primary text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                                          مجموعتك
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
                                <div>
                                  <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-2">
                                    <span>الأعضاء ({group.members.length})</span>
                                  </div>
                                  <div className="space-y-1.5 max-h-44 overflow-y-auto no-scrollbar">
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
                              </div>

                              <div className="mt-3 pt-2 border-t border-gray-200/50 dark:border-slate-700/50 flex items-center justify-between text-[10px] text-gray-400">
                                <span>{group.members.length} طلاب مسجلين</span>
                                <span>دفعة {effectiveBatchCode}</span>
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
      currentUser?.role === UserRole.ADMIN ||
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
                    رابط أو مرفق خارجي (اختياري)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newAssignAttachmentUrl}
                      onChange={(e) => setNewAssignAttachmentUrl(e.target.value)}
                      placeholder="رابط ملف الواجب (Google Drive، موقع خارجي...)"
                      className="flex-1 bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/20 transition"
                    />
                    <select
                      value={newAssignAttachmentType}
                      onChange={(e) => setNewAssignAttachmentType(e.target.value as any)}
                      className="bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-3 py-2.5 text-xs outline-none cursor-pointer"
                    >
                      <option value="link">رابط</option>
                      <option value="file">ملف</option>
                      <option value="image">صورة</option>
                    </select>
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
            <button
              onClick={() => {
                setNewBatchName("");
                setNewBatchCode(`ENG${Math.floor(10 + Math.random() * 89)}`);
                setNewBatchDept("");
                setNewBatchStage("المرحلة الأولى");
                setNewBatchRepName("");
                setIsAddingBatch(true);
              }}
              className="bg-primary hover:bg-primary/90 text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-primary/30 transition flex items-center gap-2 self-start md:self-auto"
            >
              <Plus size={18} />
              إنشاء نسخة دفعة جديدة
            </button>
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
                  <div className="bg-gray-50 dark:bg-slate-700/50 p-3 rounded-xl">
                    <span className="text-gray-400 block mb-1">ممثل الدفعة المسؤول</span>
                    <span className="font-bold text-gray-700 dark:text-gray-200">
                      {batch.representativeName || "لم يحدد بعد"}
                    </span>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-700/50 p-3 rounded-xl">
                    <span className="text-gray-400 block mb-1">الطلاب المسجلين</span>
                    <span className="font-bold text-primary">
                      {enrolledStudents.length} طالب
                    </span>
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
            <div className="max-w-sm mx-auto p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-3xl">
              <Clock className="text-amber-500 mx-auto mb-3" size={32} />
              <p className="text-amber-800 dark:text-amber-400 font-bold mb-1">طلبك قيد الانتظار</p>
              <p className="text-amber-600 dark:text-amber-500 text-xs">
                لقد قدمت طلباً للانضمام إلى الدفعة ذات الكود: <span className="font-mono font-black">{currentUser.pendingBatchCode}</span>. سيتم إشعارك فور قبول طلبك من قبل ممثل الدفعة.
              </p>
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
        <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">طلبات الانضمام 👋</h2>
            <p className="text-gray-500 text-sm">لديك {joinRequests.length} طلبات جديدة ترغب بالانضمام لدفعتك.</p>
          </div>
          <div className="bg-primary/10 p-3 rounded-2xl">
            <Users className="text-primary" size={24} />
          </div>
        </div>

        {joinRequests.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-12 rounded-3xl text-center border border-dashed border-gray-200 dark:border-slate-700">
            <ShieldCheck size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-400 font-bold">لا توجد طلبات معلقة حالياً</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {joinRequests.map((req) => (
              <div key={req.id} className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-gray-100 dark:border-slate-700 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-primary/20">
                    <img src={req.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.userName)}`} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 dark:text-white">{req.userName}</h4>
                    <p className="text-[10px] text-gray-400 font-medium">{req.userEmail}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-bold">طالب</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveRequest(req)}
                    className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/30"
                    title="قبول الطلب"
                  >
                    <UserCheck size={20} />
                  </button>
                  <button
                    onClick={() => handleRejectRequest(req.id)}
                    className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center hover:bg-red-600 transition shadow-lg shadow-red-500/30"
                    title="رفض الطلب"
                  >
                    <UserMinus size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderStudentManagement = () => {
    // Only show Official Students (added by admin) in the management list
    const students = appUsers.filter(
      (u) => u.role === UserRole.STUDENT && u.isOfficial,
    );

    return (
      <div className="space-y-6 p-4">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Users className="text-primary" size={24} />
            إدارة الطلاب
          </h2>
        </div>

        {/* Add Student Form */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <UserPlus size={18} />
            إضافة طالب جديد
          </h3>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                الاسم الثلاثي
              </label>
              <input
                type="text"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm outline-none"
                placeholder="أحمد علي..."
              />
            </div>
            <button
              onClick={handleAddStudent}
              className="bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-600 transition shadow-lg shadow-primary/20 h-10"
            >
              إضافة
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">
            * الطلاب المضافين هنا يظهرون في قوائم الدرجات فقط ولا يملكون حسابات
            دخول.
          </p>
        </div>

        {/* Student List */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="p-5 border-b border-gray-50 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/30">
            <h3 className="font-bold text-gray-800 dark:text-white">
              قائمة الطلاب ({students.length})
            </h3>
          </div>
          <div>
            {students.length > 0 ? (
              <div className="divide-y divide-gray-50 dark:divide-slate-700">
                {students.map((student) => (
                  <div
                    key={student.uid}
                    className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"
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
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span className="bg-green-100 text-green-600 px-2 rounded font-medium">
                            طالب نظامي
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteUser(student.uid)}
                      className="text-red-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-xl transition"
                      title="حذف الطالب"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-400 text-sm">
                لا يوجد طلاب مضافين حتى الآن
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderProfile = () => {
    const userToDisplay = viewingUserProfile || currentUser;
    if (!userToDisplay) return null;

    const isOwnProfile = currentUser?.uid === userToDisplay.uid;

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
                    ? "مالك التطبيق (المالك)"
                    : userToDisplay.role === UserRole.ADMIN
                    ? "مشرف النظام"
                    : userToDisplay.role === UserRole.REPRESENTATIVE
                    ? "ممثل الدفعة"
                    : "طالب"}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                {userToDisplay.name}
                {userToDisplay.role === UserRole.OWNER && (
                  <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 text-xs px-2.5 py-0.5 rounded-full font-bold">
                    المالك
                  </span>
                )}
                {userToDisplay.role === UserRole.ADMIN && (
                  <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 text-xs px-2.5 py-0.5 rounded-full font-bold">
                    مشرف
                  </span>
                )}
                {userToDisplay.role === UserRole.REPRESENTATIVE && (
                  <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 text-xs px-2.5 py-0.5 rounded-full font-bold">
                    ممثل الدفعة
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

        {/* Owner Controls (Only if current user is OWNER and looking at own profile) */}
        {isOwnProfile && currentUser.role === UserRole.OWNER && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
            <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <ShieldCheck className="text-amber-500" size={20} />
              لوحة تحكم المالك (إدارة المشرفين)
            </h3>

            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-2xl border border-yellow-100 dark:border-yellow-900/30">
                <h4 className="font-bold text-yellow-700 dark:text-yellow-500 mb-2 text-sm">
                  ترقية مستخدم إلى مشرف
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="اسم المستخدم (username)"
                    value={promoteUsername}
                    onChange={(e) => setPromoteUsername(e.target.value)}
                    className="flex-1 bg-white dark:bg-slate-700 border border-yellow-200 dark:border-yellow-900/50 rounded-lg px-3 py-2 text-sm outline-none dark:text-white"
                  />
                  <button
                    onClick={handlePromoteUser}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-yellow-600 transition"
                  >
                    ترقية
                  </button>
                </div>
              </div>

              <button
                onClick={() => setIsAddingAdmin(true)}
                className="w-full py-3 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition flex items-center justify-center gap-2"
              >
                <UserPlus size={18} />
                إضافة حساب مشرف جديد
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
    >
      {currentUser?.username === "ahmed" && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/30 p-2 text-center text-[10px] font-bold flex justify-center items-center gap-3 animate-in slide-in-from-top duration-500 sticky top-0 md:relative z-40">
          <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
            <ShieldCheck size={14} />
            <span>وضع المطور الخارق</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              placeholder="كود الدفعة المستهدف"
              className="bg-white dark:bg-slate-700 border border-amber-200 dark:border-amber-900/50 rounded-lg px-2 py-0.5 outline-none w-28 text-center uppercase"
              value={stealthBatchCode}
              onChange={(e) => setStealthBatchCode(e.target.value)}
            />
            <button
              onClick={() => setIsStealthMode(!isStealthMode)}
              className={`px-3 py-0.5 rounded-lg transition ${isStealthMode ? "bg-amber-500 text-white" : "bg-amber-100 text-amber-700 dark:bg-amber-900/20"}`}
            >
              {isStealthMode ? "إيقاف التخفي" : "تفعيل التخفي"}
            </button>
          </div>
        </div>
      )}

      {showLanding ? (
        activeTab === Tab.PROFILE ? (
          renderProfile()
        ) : (
          renderNoBatchLanding()
        )
      ) : (
        <>
          {activeTab === Tab.HOME && renderHome()}
          {activeTab === Tab.ASSIGNMENTS && renderAssignments()}
          {activeTab === Tab.SCHEDULE && renderSchedule()}
          {activeTab === Tab.GRADES && renderGrades()}
          {activeTab === Tab.ATTENDANCE && renderAttendance()}
          {activeTab === Tab.MATERIALS && renderMaterials()}
          {activeTab === Tab.CHAT && renderChat()}
          {activeTab === Tab.STUDENTS && renderStudentManagement()}
          {activeTab === Tab.COURSES && renderCourseManagement()}
          {activeTab === Tab.PROJECTS && renderProjects()}
          {activeTab === Tab.BATCHES && renderBatches()}
          {activeTab === Tab.REQUESTS && renderJoinRequests()}
          {activeTab === Tab.PROFILE && renderProfile()}
        </>
      )}

      {/* Add Admin Modal */}
      {isAddingAdmin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                إضافة مشرف جديد
              </h3>
              <button onClick={() => setIsAddingAdmin(false)}>
                <X size={20} className="text-gray-400 dark:text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                  الاسم
                </label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                  اسم المستخدم
                </label>
                <input
                  type="text"
                  value={newAdminUsername}
                  onChange={(e) => setNewAdminUsername(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                  كلمة المرور
                </label>
                <input
                  type="password"
                  value={newAdminPass}
                  onChange={(e) => setNewAdminPass(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm outline-none"
                />
              </div>
              <button
                onClick={handleAddAdmin}
                className="w-full bg-primary text-white font-bold py-3 rounded-xl mt-2 hover:bg-primary/90"
              >
                إنشاء الحساب
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
