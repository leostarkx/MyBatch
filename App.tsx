import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Layout from "./components/Layout";
import { BatchLogo } from "./components/BatchLogo";
import { StudentAttendanceReportModal } from "./components/StudentAttendanceReportModal";
import { BatchLeaderboard } from "./components/BatchLeaderboard";
import { StudentSummariesHub } from "./components/StudentSummariesHub";
import { BatchSuggestionsBox } from "./components/BatchSuggestionsBox";
import { FinalExamGradeCalculator } from "./components/FinalExamGradeCalculator";
import { NotificationPreferencesCard } from "./components/NotificationPreferencesCard";
import { NotificationCenterModal } from "./components/NotificationCenterModal";
import { RichTextEditor } from "./components/RichTextEditor";
import { FormattedTextRenderer } from "./components/FormattedTextRenderer";
import { StudyHubView } from "./views/StudyHubView";
import { AcademicPathView } from "./views/AcademicPathView";
import { CommunityHubView } from "./views/CommunityHubView";
import { CourseGradesView } from "./views/CourseGradesView";
import { AttendanceSheetView } from "./views/AttendanceSheetView";
import { UnifiedTasksHub } from "./components/UnifiedTasksHub";
import { QuizResultsHub } from "./components/QuizResultsHub";
import { NicknameModal } from "./components/NicknameModal";
import { ChangeEmailModal } from "./components/ChangeEmailModal";
import { AssistantDutiesModal } from "./components/AssistantDutiesModal";
import {
  getUserNotificationPreferences,
  isCategoryEnabledForUser,
  playNotificationChime,
  showBrowserPushNotification,
  notifyUserIfAllowed,
  broadcastBatchNotification,
  getAlertedNotificationIds,
  markNotificationIdsAsAlerted,
} from "./services/notificationService";
import {
  markNotificationAsReadInFirestore,
  subscribeQuotaState,
} from "./services/firebase";
import {
  getBatchesSupabase,
  saveBatchSupabase,
  getUsersSupabase,
  saveUserSupabase,
  getAnnouncementsSupabase,
  saveAnnouncementSupabase,
  getCoursesSupabase,
  saveCourseSupabase,
  getSchedulesSupabase,
  saveScheduleSupabase,
  getAssignmentsSupabase,
  saveAssignmentSupabase,
  getExamsSupabase,
  saveExamSupabase,
  deleteExamSupabase,
  getAttendanceSessionsSupabase,
  saveAttendanceSessionSupabase,
  getAttendanceRecordsSupabase,
  saveAttendanceRecordSupabase,
  saveAttendanceRecordsBatchSupabase,
  getGradesSupabase,
  saveGradeSupabase,
  getChatMessagesSupabase,
  saveChatMessageSupabase,
  getMaterialSectionsSupabase,
  saveMaterialSectionSupabase,
  getMaterialsSupabase,
  saveMaterialSupabase,
  getProjectsSupabase,
  saveProjectSupabase,
  getStudentSummariesSupabase,
  saveStudentSummarySupabase,
  getBatchSuggestionsSupabase,
  saveBatchSuggestionSupabase,
  getJoinRequestsSupabase,
  saveJoinRequestSupabase,
  deleteJoinRequestSupabase,
  getRepresentativeCodesSupabase,
  saveRepresentativeCodeSupabase,
  subscribeTableSupabase,
} from "./services/supabaseService";
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
  AssistantDuty,
  ASSISTANT_DUTIES_CONFIG,
} from "./types";
import {
  Send,
  Plus,
  Mail,
  Download,
  Trash2,
  LogOut,
  CheckCircle,
  AlertCircle,
  HelpCircle,
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
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  AlertTriangle,
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
import { PDFViewerModal } from "./components/PDFViewerModal";
import { AcademicQAHub } from "./components/AcademicQAHub";

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
  saveAttendanceRecordsBatchToFirestore,
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
  compareArabicNames,
  sortUsersAlphabetically,
} from "./services/firebase";

// Modular Views & Modals
import { ThemeSelector } from "./components/ThemeSelector";
import { AuthScreen } from "./components/AuthScreen";
import { ImageViewerModal } from "./components/ImageViewerModal";
import { RedeemCodeModal } from "./components/RedeemCodeModal";
import { AddAssignmentModal } from "./components/AddAssignmentModal";
import { HomeView } from "./views/HomeView";
import { MaterialsView } from "./views/MaterialsView";
import { ChatView } from "./views/ChatView";
import { ScheduleView } from "./views/ScheduleView";
import { CoursesView } from "./views/CoursesView";
import { ProjectsView } from "./views/ProjectsView";
import { AssignmentsView } from "./views/AssignmentsView";
import { BatchesView, NoBatchLanding } from "./views/BatchesView";
import { JoinRequestsView } from "./views/JoinRequestsView";
import { StudentsView } from "./views/StudentsView";
import { ProfileView } from "./views/ProfileView";

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

  // Granular Role & Duty Checks (الممثل الرئيسي + المساعدين المخصصين)
  const userDuties = currentUser?.assistantDuties || [];
  const canManageAttendance =
    isManager || userDuties.includes(AssistantDuty.ATTENDANCE);
  const canManageGrades =
    isManager || userDuties.includes(AssistantDuty.GRADES);
  const canManageMaterials =
    isManager || userDuties.includes(AssistantDuty.MATERIALS);
  const canManageAnnouncements =
    isManager || userDuties.includes(AssistantDuty.ANNOUNCEMENTS);
  const canManageAssignments =
    isManager || userDuties.includes(AssistantDuty.ASSIGNMENTS);
  const isAnyAssistant = isAssistantRep || userDuties.length > 0;

  // Duty Management Modal State (Representative assigns/revokes duties for students)
  const [dutyTargetStudent, setDutyTargetStudent] = useState<User | null>(null);
  const [isUpdatingDuty, setIsUpdatingDuty] = useState(false);
  const [viewingUserProfile, setViewingUserProfile] = useState<User | null>(
    null,
  );
  const [previousTabBeforeProfile, setPreviousTabBeforeProfile] = useState<Tab | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);
  const [theme, setTheme] = useState<ThemeColor>("blue");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loadingApp, setLoadingApp] = useState(true);
  const [currentTimer, setCurrentTimer] = useState(Date.now());
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  useEffect(() => {
    const unsub = subscribeQuotaState((exceeded) => {
      setIsQuotaExceeded(exceeded);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimer(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Real Data State (from Mock DB)
  const [appUsers, setAppUsers] = useState<User[]>(() =>
    sortUsersAlphabetically(MOCK_USERS)
  );
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
    : (currentUser?.role === UserRole.STUDENT && !currentUser?.batchCode)
      ? ""
      : (currentUser?.batchCode || (currentUser?.role === UserRole.OWNER ? (batches.length > 0 ? (batches.find(b => b.code !== 'CS-2024')?.code || batches[0].code) : "ITUOK5") : ""));

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
  const [schedCourseId, setSchedCourseId] = useState("");
  const [schedCourseName, setSchedCourseName] = useState("");
  const [schedProf, setSchedProf] = useState("");
  const [schedDay, setSchedDay] = useState("الأحد");
  const [schedDate, setSchedDate] = useState("");
  const [schedStartTime, setSchedStartTime] = useState("08:30 ص");
  const [schedEndTime, setSchedEndTime] = useState("10:30 ص");
  const [schedHall, setSchedHall] = useState("");
  const [schedLectureType, setSchedLectureType] = useState<"THEORY" | "PRACTICAL">("THEORY");
  const [schedTargetGroup, setSchedTargetGroup] = useState<string>("ALL");
  const [schedIsWeekly, setSchedIsWeekly] = useState(true);
  const [schedNote, setSchedNote] = useState("");
  const [schedFilterDay, setSchedFilterDay] = useState("الكل");
  const [schedFilterGroup, setSchedFilterGroup] = useState("الكل");
  const [scheduleViewMode, setScheduleViewMode] = useState<"WEEKLY_GRID" | "CARDS">("WEEKLY_GRID");

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

  // In-App Interactive PDF Viewer Modal State
  const [pdfViewerState, setPdfViewerState] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
    courseName?: string;
    fileSize?: string;
  }>({
    isOpen: false,
    url: "",
    title: "",
  });

  // Materials Sub-view: Lectures vs Questions Hub
  const [materialsActiveSubTab, setMaterialsActiveSubTab] = useState<"LECTURES" | "QUESTIONS">("LECTURES");

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

  useEffect(() => {
    if (!previewItem) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPreviewItem(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewItem]);

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
  const [attendanceTargetDate, setAttendanceTargetDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [selectedScheduleSlotId, setSelectedScheduleSlotId] = useState<string>("");
  const [newSessionTargetGroup, setNewSessionTargetGroup] = useState<string>("ALL");
  const [attendanceGroupFilter, setAttendanceGroupFilter] = useState<string>("DEFAULT");
  const [attendanceSheetGroupFilter, setAttendanceSheetGroupFilter] = useState<string>("SESSION_GROUP");
  const [isAddingExceptionModalOpen, setIsAddingExceptionModalOpen] = useState<boolean>(false);
  const [isExceptionModalOpen, setIsExceptionModalOpen] = useState<boolean>(false);
  const [exceptionMode, setExceptionMode] = useState<"ATTEND_WITH_GROUP" | "SWAP_WITH_STUDENT">("ATTEND_WITH_GROUP");
  const [exceptionGuestStudentId, setExceptionGuestStudentId] = useState<string>("");
  const [exceptionSwapTargetStudentId, setExceptionSwapTargetStudentId] = useState<string>("");
  const [exceptionNoteInput, setExceptionNoteInput] = useState<string>("");
  const [exceptionStudentId, setExceptionStudentId] = useState<string>("");
  const [exceptionSwappedWithId, setExceptionSwappedWithId] = useState<string>("");
  const [exceptionNote, setExceptionNote] = useState<string>("");
  const [exceptionStatus, setExceptionStatus] = useState<"PRESENT" | "EXCUSED">("PRESENT");
  const [exceptionSearchQuery, setExceptionSearchQuery] = useState<string>("");

  // Student Management State (Admin)
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentGroup, setNewStudentGroup] = useState("");
  const [studentStatsFilter, setStudentStatsFilter] = useState<'ALL' | 'INCLUDED' | 'EXCLUDED'>('ALL');
  const [studentGroupFilter, setStudentGroupFilter] = useState<string>("ALL");
  const [newCustomGroupName, setNewCustomGroupName] = useState<string>("");
  const [isManagingAcademicGroups, setIsManagingAcademicGroups] = useState<boolean>(false);
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
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);
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

  // Nickname & Email Switcher States
  const [nicknameTargetStudent, setNicknameTargetStudent] = useState<User | null>(null);
  const [nicknameInput, setNicknameInput] = useState<string>("");
  const [isSavingNickname, setIsSavingNickname] = useState<boolean>(false);

  const [isChangeEmailModalOpen, setIsChangeEmailModalOpen] = useState<boolean>(false);
  const [newEmailInput, setNewEmailInput] = useState<string>("");
  const [emailChangeError, setEmailChangeError] = useState<string>("");
  const [emailChangeSuccess, setEmailChangeSuccess] = useState<string | null>(null);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState<boolean>(false);
  const [emailTargetStudent, setEmailTargetStudent] = useState<User | null>(null);

  const handleUpdateStudentNickname = async (studentUid: string, nickname: string) => {
    const target = appUsers.find((u) => u.uid === studentUid);
    if (!target) return;
    const trimmed = nickname.trim();
    const updatedUser: User = {
      ...target,
      repNickname: trimmed ? trimmed : undefined,
    };
    setIsSavingNickname(true);
    try {
      await saveUserToFirestore(updatedUser);
      await saveUserSupabase(updatedUser);
      setAppUsers((prev) =>
        prev.map((u) => (u.uid === studentUid ? updatedUser : u))
      );
      if (currentUser?.uid === studentUid) {
        setCurrentUser(updatedUser);
        localStorage.setItem("auth_user", JSON.stringify(updatedUser));
      }
    } finally {
      setIsSavingNickname(false);
      setNicknameTargetStudent(null);
    }
  };

  const handleUpdateUserEmail = async (targetUid: string, newEmail: string) => {
    const trimmed = newEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailChangeError("يرجى كتابة عنوان بريد إلكتروني صالح (مثال: student@gmail.com)");
      return false;
    }
    setIsUpdatingEmail(true);
    setEmailChangeError("");
    try {
      const target = appUsers.find((u) => u.uid === targetUid);
      if (!target) {
        setEmailChangeError("لم يتم العثور على حساب الطالب");
        return false;
      }
      const updatedUser: User = { ...target, email: trimmed };
      await saveUserToFirestore(updatedUser);
      await saveUserSupabase(updatedUser);
      setAppUsers((prev) =>
        prev.map((u) => (u.uid === targetUid ? updatedUser : u))
      );
      if (currentUser?.uid === targetUid) {
        setCurrentUser(updatedUser);
        localStorage.setItem("auth_user", JSON.stringify(updatedUser));
      }
      setEmailChangeSuccess("تم تبديل وتحديث البريد الإلكتروني بنجاح! جميع بياناتك وسجلاتك الأكاديمية مستمرة ومحفوظة.");
      return true;
    } catch (err: any) {
      setEmailChangeError(err?.message || "حدث خطأ أثناء تحديث البريد الإلكتروني");
      return false;
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  // --- Firebase & Supabase Initialization and Listeners ---
  useEffect(() => {
    // 1. Initial Load from Supabase (instant, zero quota limits)
    getUsersSupabase().then((users) => {
      if (users && users.length > 0) {
        setAppUsers(users);
        const storedUid = localStorage.getItem("dafaaty_user_uid");
        if (storedUid) {
          const found = users.find((u) => u.uid === storedUid);
          if (found) {
            setCurrentUser(found);
          }
        }
        setLoadingApp(false);
      }
    });

    getBatchesSupabase().then((batches) => {
      if (batches && batches.length > 0) {
        setBatches(batches);
      }
    });

    const unsubSbBatches = subscribeTableSupabase('batches', '', () => {
      getBatchesSupabase().then(setBatches);
    });

    const unsubSbUsers = subscribeTableSupabase('users', '', () => {
      getUsersSupabase().then(setAppUsers);
    });

    // 1.b Seed initial data to Firestore if empty
    seedInitialDataIfEmpty();

    // 1.c Check if returning from a Google Sign-In Redirect (e.g. mobile browsers / Netlify)
    checkGoogleRedirectResult().then((redirectUser) => {
      if (redirectUser) {
        localStorage.setItem("dafaaty_user_uid", redirectUser.uid);
        setCurrentUser(redirectUser);
        setLoadingApp(false);
        saveUserSupabase(redirectUser);
      }
    });

    // 2. Realtime Firestore fallback listeners
    const unsubUsers = subscribeUsers((users) => {
      if (users && users.length > 0) {
        setAppUsers(users);
        const storedUid = localStorage.getItem("dafaaty_user_uid");
        if (storedUid) {
          const found = users.find((u) => u.uid === storedUid);
          if (found) {
            setCurrentUser((prev) => {
              if (
                prev &&
                prev.uid === found.uid &&
                prev.role === found.role &&
                prev.batchCode === found.batchCode &&
                prev.name === found.name &&
                prev.avatar === found.avatar
              ) {
                return prev;
              }
              return found;
            });
          }
        }
      }
      setLoadingApp(false);
    });

    const unsubBatches = subscribeBatches((items) => {
      if (items && items.length > 0) {
        setBatches(items);
      }
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
      unsubSbBatches();
      unsubSbUsers();
      unsubUsers();
      unsubBatches();
      unsubSettings();
    };
  }, []);

  // Only the Owner needs to listen to secret representative appointment codes
  useEffect(() => {
    if (currentUser?.role !== UserRole.OWNER) {
      setRepresentativeCodes([]);
      return;
    }
    getRepresentativeCodesSupabase().then((codes) => {
      if (codes && codes.length > 0) setRepresentativeCodes(codes);
    });
    const unsubSb = subscribeTableSupabase('representative_codes', '', () => {
      getRepresentativeCodesSupabase().then(setRepresentativeCodes);
    });
    const unsub = subscribeRepresentativeCodes((codes) => {
      if (codes && codes.length > 0) setRepresentativeCodes(codes);
    });
    return () => {
      unsubSb();
      unsub();
    };
  }, [currentUser?.role]);

  // 1. All Batch Collections: Eagerly load & sync with Supabase Realtime (zero quota limits)
  useEffect(() => {
    if (!effectiveBatchCode) {
      setAnnouncements([]);
      setCourses([]);
      setSchedules([]);
      setAssignments([]);
      setExams([]);
      setAttendanceSessions([]);
      setAttendanceRecords([]);
      setGrades([]);
      setMaterialSections([]);
      setMaterials([]);
      setProjects([]);
      setStudentSummaries([]);
      setBatchSuggestions([]);
      return;
    }

    // Load from Supabase (fast, zero quota limits)
    getAnnouncementsSupabase(effectiveBatchCode).then((items) => {
      if (items && items.length > 0) setAnnouncements(items);
    });
    getCoursesSupabase(effectiveBatchCode).then((items) => {
      if (items && items.length > 0) setCourses(items);
    });
    getSchedulesSupabase(effectiveBatchCode).then((items) => {
      if (items && items.length > 0) setSchedules(items);
    });
    getAssignmentsSupabase(effectiveBatchCode).then((items) => {
      if (items && items.length > 0) setAssignments(items);
    });
    getExamsSupabase(effectiveBatchCode).then((items) => {
      if (items && items.length > 0) setExams(items);
    });
    getAttendanceSessionsSupabase(effectiveBatchCode).then((items) => {
      if (items && items.length > 0) setAttendanceSessions(items);
    });
    getAttendanceRecordsSupabase(effectiveBatchCode).then((items) => {
      if (items && items.length > 0) setAttendanceRecords(items);
    });
    getGradesSupabase(effectiveBatchCode).then((items) => {
      if (items && items.length > 0) setGrades(items);
    });
    getMaterialSectionsSupabase(effectiveBatchCode).then((items) => {
      if (items && items.length > 0) setMaterialSections(items);
    });
    getMaterialsSupabase(effectiveBatchCode).then((items) => {
      if (items && items.length > 0) setMaterials(items);
    });
    getProjectsSupabase(effectiveBatchCode).then((items) => {
      if (items && items.length > 0) setProjects(items);
    });
    getStudentSummariesSupabase(effectiveBatchCode).then((items) => {
      if (items && items.length > 0) setStudentSummaries(items);
    });
    getBatchSuggestionsSupabase(effectiveBatchCode).then((items) => {
      if (items && items.length > 0) setBatchSuggestions(items);
    });

    // Supabase Realtime channels
    const unsubSbAnn = subscribeTableSupabase('announcements', effectiveBatchCode, () => {
      getAnnouncementsSupabase(effectiveBatchCode).then(setAnnouncements);
    });
    const unsubSbCourses = subscribeTableSupabase('courses', effectiveBatchCode, () => {
      getCoursesSupabase(effectiveBatchCode).then(setCourses);
    });
    const unsubSbSchedules = subscribeTableSupabase('schedules', effectiveBatchCode, () => {
      getSchedulesSupabase(effectiveBatchCode).then(setSchedules);
    });
    const unsubSbAssignments = subscribeTableSupabase('assignments', effectiveBatchCode, () => {
      getAssignmentsSupabase(effectiveBatchCode).then(setAssignments);
    });
    const unsubSbExams = subscribeTableSupabase('exams', effectiveBatchCode, () => {
      getExamsSupabase(effectiveBatchCode).then(setExams);
    });
    const unsubSbAttSessions = subscribeTableSupabase('attendance_sessions', effectiveBatchCode, () => {
      getAttendanceSessionsSupabase(effectiveBatchCode).then(setAttendanceSessions);
    });
    const unsubSbAttRecords = subscribeTableSupabase('attendance_records', effectiveBatchCode, () => {
      getAttendanceRecordsSupabase(effectiveBatchCode).then(setAttendanceRecords);
    });
    const unsubSbGrades = subscribeTableSupabase('grades', effectiveBatchCode, () => {
      getGradesSupabase(effectiveBatchCode).then(setGrades);
    });
    const unsubSbSections = subscribeTableSupabase('material_sections', effectiveBatchCode, () => {
      getMaterialSectionsSupabase(effectiveBatchCode).then(setMaterialSections);
    });
    const unsubSbMaterials = subscribeTableSupabase('materials', effectiveBatchCode, () => {
      getMaterialsSupabase(effectiveBatchCode).then(setMaterials);
    });
    const unsubSbProjects = subscribeTableSupabase('projects', effectiveBatchCode, () => {
      getProjectsSupabase(effectiveBatchCode).then(setProjects);
    });
    const unsubSbSummaries = subscribeTableSupabase('student_summaries', effectiveBatchCode, () => {
      getStudentSummariesSupabase(effectiveBatchCode).then(setStudentSummaries);
    });
    const unsubSbSuggestions = subscribeTableSupabase('batch_suggestions', effectiveBatchCode, () => {
      getBatchSuggestionsSupabase(effectiveBatchCode).then(setBatchSuggestions);
    });

    // Firestore fallback listeners (safely catches quota errors in firebase.ts)
    const unsubAnnouncements = subscribeAnnouncements(effectiveBatchCode, (items) => {
      if (items && items.length > 0) setAnnouncements(items);
    });
    const unsubCourses = subscribeCourses(effectiveBatchCode, (items) => {
      if (items && items.length > 0) setCourses(items);
    });
    const unsubSchedules = subscribeSchedules(effectiveBatchCode, (items) => {
      if (items && items.length > 0) setSchedules(items);
    });
    const unsubAssignments = subscribeAssignments(effectiveBatchCode, (items) => {
      if (items && items.length > 0) setAssignments(items);
    });
    const unsubExams = subscribeExams(effectiveBatchCode, (items) => {
      if (items && items.length > 0) setExams(items);
    });
    const unsubSessions = subscribeAttendanceSessions(effectiveBatchCode, (items) => {
      if (items && items.length > 0) setAttendanceSessions(items);
    });
    const unsubRecords = subscribeAttendanceRecords(effectiveBatchCode, (items) => {
      if (items && items.length > 0) setAttendanceRecords(items);
    });
    const unsubGrades = subscribeGrades(effectiveBatchCode, (items) => {
      if (items && items.length > 0) setGrades(items);
    });
    const unsubSections = subscribeMaterialSections(effectiveBatchCode, (items) => {
      if (items && items.length > 0) setMaterialSections(items);
    });
    const unsubMaterials = subscribeMaterials(effectiveBatchCode, (items) => {
      if (items && items.length > 0) setMaterials(items);
    });
    const unsubProjects = subscribeProjects(effectiveBatchCode, (items) => {
      if (items && items.length > 0) setProjects(items);
    });
    const unsubSummaries = subscribeStudentSummaries(effectiveBatchCode, (items) => {
      if (items && items.length > 0) setStudentSummaries(items);
    });
    const unsubSuggestions = subscribeBatchSuggestions(effectiveBatchCode, (items) => {
      if (items && items.length > 0) setBatchSuggestions(items);
    });

    return () => {
      unsubSbAnn();
      unsubSbCourses();
      unsubSbSchedules();
      unsubSbAssignments();
      unsubSbExams();
      unsubSbAttSessions();
      unsubSbAttRecords();
      unsubSbGrades();
      unsubSbSections();
      unsubSbMaterials();
      unsubSbProjects();
      unsubSbSummaries();
      unsubSbSuggestions();
      unsubAnnouncements();
      unsubCourses();
      unsubSchedules();
      unsubAssignments();
      unsubExams();
      unsubSessions();
      unsubRecords();
      unsubGrades();
      unsubSections();
      unsubMaterials();
      unsubProjects();
      unsubSummaries();
      unsubSuggestions();
    };
  }, [effectiveBatchCode]);

  // 2. Chat Messages: Subscribe when on Chat or Community Hub tab
  useEffect(() => {
    if (
      !effectiveBatchCode ||
      (activeTab !== Tab.CHAT && activeTab !== Tab.COMMUNITY_HUB)
    ) {
      return;
    }

    getChatMessagesSupabase(effectiveBatchCode).then((items) => {
      if (items && items.length > 0) setChatMessages(items);
    });

    const unsubSbChat = subscribeTableSupabase('chat_messages', effectiveBatchCode, () => {
      getChatMessagesSupabase(effectiveBatchCode).then(setChatMessages);
    });

    const unsubChat = subscribeChatMessages(effectiveBatchCode, (items) => {
      if (items && items.length > 0) setChatMessages(items);
    });

    return () => {
      unsubSbChat();
      unsubChat();
    };
  }, [effectiveBatchCode, activeTab]);

  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [liveToastNotif, setLiveToastNotif] = useState<Notification | null>(null);
  const knownNotifIdsRef = useRef<Set<string>>(new Set());
  const isInitialNotifLoadRef = useRef<boolean>(true);
  const currentUserRef = useRef<User | null>(null);
  currentUserRef.current = currentUser;

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      knownNotifIdsRef.current.clear();
      isInitialNotifLoadRef.current = true;
      return;
    }

    const currentUid = currentUser.uid;
    // Load previously alerted notification IDs from storage so past alerts are never re-triggered
    const alertedIds = getAlertedNotificationIds(currentUid);
    knownNotifIdsRef.current = new Set(alertedIds);
    isInitialNotifLoadRef.current = true;

    const unsubNotifs = subscribeNotifications(currentUid, (items) => {
      setNotifications(items);

      if (isInitialNotifLoadRef.current) {
        // On initial snapshot/cache load, register all existing IDs so they don't pop up as alerts
        items.forEach((n) => {
          knownNotifIdsRef.current.add(n.id);
        });
        markNotificationIdsAsAlerted(currentUid, items.map((n) => n.id));
        isInitialNotifLoadRef.current = false;
        return;
      }

      // Detect newly arrived unread notifications that haven't been alerted yet
      const newlyArrived = items.filter(
        (n) => !knownNotifIdsRef.current.has(n.id) && !n.isRead
      );

      // Register all incoming IDs immediately
      items.forEach((n) => knownNotifIdsRef.current.add(n.id));

      if (newlyArrived.length > 0) {
        // Mark all newly arrived notification IDs as alerted immediately in persistent storage
        markNotificationIdsAsAlerted(
          currentUid,
          newlyArrived.map((n) => n.id)
        );

        const latest = newlyArrived[0];
        const activeUser = currentUserRef.current;
        const prefs = getUserNotificationPreferences(activeUser);

        if (prefs.enabled && isCategoryEnabledForUser(activeUser, latest.type)) {
          setLiveToastNotif(latest);
          if (prefs.soundEnabled) {
            playNotificationChime();
          }
          if (prefs.browserPush) {
            showBrowserPushNotification(
              latest.title || "إشعار جديد - منصة دفعتي 🔔",
              latest.content,
              latest.id
            );
          }
        }
      }
    });
    return () => unsubNotifs();
  }, [currentUser?.uid]);

  // Auto-dismiss live toast notification banner after 6 seconds to prevent stuck toast
  useEffect(() => {
    if (!liveToastNotif) return;
    const toastTimer = setTimeout(() => {
      setLiveToastNotif(null);
    }, 6000);
    return () => clearTimeout(toastTimer);
  }, [liveToastNotif?.id]);

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
    const fetchRequests = () => {
      getJoinRequestsSupabase(isOwner ? undefined : targetCode).then((items) => {
        setJoinRequests(items || []);
      });
    };

    fetchRequests();

    const unsubSbReqs = subscribeTableSupabase('join_requests', isOwner ? '' : targetCode, fetchRequests);
    const unsubSbUsers = subscribeTableSupabase('users', '', fetchRequests);

    const unsubReqs = subscribeJoinRequests(
      targetCode,
      (items) => {
        if (items && items.length > 0) setJoinRequests(items);
      },
      isOwner
    );
    return () => {
      unsubSbReqs();
      unsubSbUsers();
      unsubReqs();
    };
  }, [currentUser?.uid, currentUser?.role, currentUser?.batchCode, effectiveBatchCode]);

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
      if (activeTab !== Tab.PROFILE) {
        setPreviousTabBeforeProfile(activeTab);
      }
      setViewingUserProfile(userToView);
      setActiveTab(Tab.PROFILE);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBackFromProfile = () => {
    setViewingUserProfile(null);
    if (previousTabBeforeProfile && previousTabBeforeProfile !== Tab.PROFILE) {
      setActiveTab(previousTabBeforeProfile);
    } else {
      setActiveTab(Tab.HOME);
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

  // --- Academic Groups Helpers & Handlers ---
  const DEFAULT_ACADEMIC_GROUPS = ["كروب A", "كروب B", "كروب C", "كروب D"];

  const currentBatchObj = batches.find((b) => b.code === effectiveBatchCode);

  // Compute all unique academic groups available in the active batch
  const batchAcademicGroups: string[] = Array.from(
    new Set([
      ...(currentBatchObj?.academicGroups && currentBatchObj.academicGroups.length > 0
        ? currentBatchObj.academicGroups
        : DEFAULT_ACADEMIC_GROUPS),
      ...appUsers
        .filter((u) => u.batchCode === effectiveBatchCode && u.academicGroup)
        .map((u) => u.academicGroup as string),
      ...schedules
        .filter((s) => s.targetGroup && s.targetGroup !== "ALL")
        .map((s) => s.targetGroup as string),
      ...attendanceSessions
        .filter((s) => s.targetGroup && s.targetGroup !== "ALL")
        .map((s) => s.targetGroup as string),
    ])
  );

  const handleAddBatchAcademicGroup = async () => {
    const clean = newCustomGroupName.trim();
    if (!clean || !currentBatchObj) return;
    const formatted = clean.startsWith("كروب") ? clean : `كروب ${clean}`;
    const existing =
      currentBatchObj.academicGroups && currentBatchObj.academicGroups.length > 0
        ? currentBatchObj.academicGroups
        : DEFAULT_ACADEMIC_GROUPS;
    if (existing.includes(formatted)) {
      setNewCustomGroupName("");
      return;
    }
    const updatedGroups = [...existing, formatted];
    await saveBatchToFirestore({
      ...currentBatchObj,
      academicGroups: updatedGroups,
    });
    setNewCustomGroupName("");
  };

  const handleRemoveBatchAcademicGroup = async (groupName: string) => {
    if (!currentBatchObj) return;
    const existing =
      currentBatchObj.academicGroups && currentBatchObj.academicGroups.length > 0
        ? currentBatchObj.academicGroups
        : DEFAULT_ACADEMIC_GROUPS;
    const updatedGroups = existing.filter((g) => g !== groupName);
    await saveBatchToFirestore({
      ...currentBatchObj,
      academicGroups: updatedGroups,
    });
  };

  const handleAssignStudentAcademicGroup = async (student: User, groupName: string) => {
    if (!isManager) return;
    const updatedStudent: User = {
      ...student,
      academicGroup: groupName || "",
    };
    await saveUserToFirestore(updatedStudent);
    if (currentUser?.uid === student.uid) {
      setCurrentUser(updatedStudent);
    }
  };

  const handleAutoDistributeStudentsIntoGroups = async (groupsToUse: string[]) => {
    if (!isManager || groupsToUse.length === 0) return;
    const eligibleStudents = appUsers
      .filter((u) => {
        if (u.role === UserRole.OWNER) return false;
        if (u.excludeFromStats) return false;
        if (u.batchCode === effectiveBatchCode) return true;
        if (u.isOfficial && (!u.batchCode || u.batchCode === effectiveBatchCode)) return true;
        return false;
      })
      .sort((a, b) => compareArabicNames(a.name, b.name));

    if (eligibleStudents.length === 0) return;
    if (
      !confirm(
        `هل تريد توزيع طلاب الدفعة (${eligibleStudents.length} طالب) بالتساوي وبحسب الترتيب الأبجدي على (${groupsToUse.join(
          " ، "
        )})؟`
      )
    )
      return;

    const chunkSize = Math.ceil(eligibleStudents.length / groupsToUse.length);
    await Promise.all(
      eligibleStudents.map((st, idx) => {
        const gIndex = Math.min(groupsToUse.length - 1, Math.floor(idx / chunkSize));
        const targetGrp = groupsToUse[gIndex];
        return saveUserToFirestore({
          ...st,
          academicGroup: targetGrp,
        });
      })
    );
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
      ...(newStudentGroup ? { academicGroup: newStudentGroup } : {}),
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

    try {
      await saveChatMessageSupabase(msgData);
    } catch (err) {
      console.warn("Supabase chat save note:", err);
    }
    saveChatMessageToFirestore(msgData).catch(() => {});

    // Notify replied-to user or @mentioned users in batch chat
    const notifiedUids = new Set<string>();
    if (replyingTo && replyingTo.id) {
      const originalMsg = chatMessages.find((m) => m.id === replyingTo.id);
      if (originalMsg && originalMsg.senderId !== currentUser.uid) {
        const targetUser = appUsers.find((u) => u.uid === originalMsg.senderId);
        if (targetUser) {
          notifiedUids.add(targetUser.uid);
          await notifyUserIfAllowed({
            targetUser,
            category: "CHAT",
            title: `💬 رد جديد من ${currentUser.name} في دردشة الدفعة`,
            content: msgData.content.slice(0, 120),
            batchCode: effectiveBatchCode,
            targetTab: Tab.CHAT,
          });
        }
      }
    }

    // Check @username mentions in message content
    const mentionMatches = (newMessage || "").match(/@([a-zA-Z0-9_]+)/g);
    if (mentionMatches) {
      for (const match of mentionMatches) {
        const cleanUname = match.slice(1).toLowerCase();
        const mentionedUser = appUsers.find(
          (u) =>
            u.username?.toLowerCase() === cleanUname &&
            u.uid !== currentUser.uid &&
            !notifiedUids.has(u.uid)
        );
        if (mentionedUser) {
          notifiedUids.add(mentionedUser.uid);
          await notifyUserIfAllowed({
            targetUser: mentionedUser,
            category: "MENTION",
            title: `💬 أشار إليك (${currentUser.name}) في دردشة الدفعة`,
            content: msgData.content.slice(0, 120),
            batchCode: effectiveBatchCode,
            targetTab: Tab.CHAT,
          });
        }
      }
    }

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
  const handleOpenAddScheduleModal = (preselectedDay?: string) => {
    setEditingScheduleId(null);
    const defaultCourse = courses[0] || null;
    setSchedCourseId(defaultCourse ? defaultCourse.id : "");
    setSchedCourseName(defaultCourse ? defaultCourse.name : "");
    setSchedProf(
      defaultCourse && defaultCourse.professors?.length > 0 && defaultCourse.professors[0] !== "غير محدد"
        ? defaultCourse.professors.join("، ")
        : ""
    );
    setSchedDay(preselectedDay && preselectedDay !== "الكل" ? preselectedDay : "الأحد");
    setSchedDate("");
    setSchedStartTime("08:30 ص");
    setSchedEndTime("10:30 ص");
    setSchedHall("");
    setSchedLectureType("THEORY");
    setSchedTargetGroup("ALL");
    setSchedIsWeekly(true);
    setSchedNote("");
    setIsAddingSchedule(true);
  };

  const handleSaveSchedule = async () => {
    const selectedCourseObj = courses.find((c) => c.id === schedCourseId);
    const resolvedCourseName = (selectedCourseObj?.name || schedCourseName).trim();
    if (!resolvedCourseName || !schedDay || !schedStartTime) {
      alert("يرجى اختيار المادة وتحديد اليوم ووقت بدء المحاضرة");
      return;
    }

    const scheduleItem: LectureSchedule = {
      id: editingScheduleId || `sch_${Date.now()}`,
      batchCode: effectiveBatchCode,
      courseId: selectedCourseObj?.id || schedCourseId || undefined,
      courseName: resolvedCourseName,
      professor:
        schedProf.trim() ||
        (selectedCourseObj?.professors?.length && selectedCourseObj.professors[0] !== "غير محدد"
          ? selectedCourseObj.professors.join("، ")
          : ""),
      day: schedDay,
      date: schedIsWeekly ? "" : schedDate || "",
      startTime: schedStartTime.trim(),
      endTime: schedEndTime.trim() || "",
      hall: schedHall.trim() || "قاعة عامة",
      lectureType: schedLectureType,
      targetGroup: schedTargetGroup || "ALL",
      isWeekly: schedIsWeekly,
      isCancelled: false,
      note: schedNote.trim() || "",
      updatedAt: Date.now(),
    };
    await saveScheduleToFirestore(scheduleItem);

    const groupBadgeLabel =
      scheduleItem.targetGroup && scheduleItem.targetGroup !== "ALL"
        ? ` (${scheduleItem.targetGroup})`
        : "";

    await broadcastBatchNotification({
      allUsers: appUsers,
      batchCode: effectiveBatchCode,
      excludeUid: currentUser?.uid,
      category: "SCHEDULE",
      title: editingScheduleId
        ? `🗓️ تحديث محاضرة في الجدول: ${resolvedCourseName}${groupBadgeLabel}`
        : `🗓️ محاضرة جديدة في الجدول: ${resolvedCourseName}${groupBadgeLabel}`,
      content: `يوم ${schedDay} • وقت البدء: ${schedStartTime.trim()}${
        scheduleItem.targetGroup && scheduleItem.targetGroup !== "ALL"
          ? ` • الفئة: ${scheduleItem.targetGroup}`
          : " • للدفعة كاملة"
      }${schedHall.trim() ? ` • القاعة: ${schedHall.trim()}` : ""}`,
      targetTab: Tab.SCHEDULE,
    });

    setIsAddingSchedule(false);
    setEditingScheduleId(null);
    setSchedCourseId("");
    setSchedCourseName("");
    setSchedProf("");
    setSchedDay("الأحد");
    setSchedDate("");
    setSchedStartTime("08:30 ص");
    setSchedEndTime("10:30 ص");
    setSchedHall("");
    setSchedLectureType("THEORY");
    setSchedTargetGroup("ALL");
    setSchedIsWeekly(true);
    setSchedNote("");
  };

  const handleDeleteSchedule = async (id: string) => {
    await deleteScheduleFromFirestore(id);
  };

  const handleToggleCancelSchedule = async (item: LectureSchedule) => {
    const nextCancelled = !item.isCancelled;
    const updated = { ...item, isCancelled: nextCancelled, updatedAt: Date.now() };
    await saveScheduleToFirestore(updated);

    await broadcastBatchNotification({
      allUsers: appUsers,
      batchCode: effectiveBatchCode,
      excludeUid: currentUser?.uid,
      category: "SCHEDULE",
      title: nextCancelled
        ? `⚠️ إلغاء محاضرة: ${item.courseName}`
        : `✅ استئناف محاضرة: ${item.courseName}`,
      content: nextCancelled
        ? `تم إلغاء محاضرة (${item.courseName}) ليوم ${item.day} (${item.startTime}) مؤقتاً.`
        : `تم تفعيل واستئناف محاضرة (${item.courseName}) ليوم ${item.day} (${item.startTime}) في الجدول.`,
      targetTab: Tab.SCHEDULE,
    });
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
      await saveJoinRequestSupabase(req);

      // Update user pendingBatchCode and strictly keep batchCode empty so the student is NEVER admitted without approval
      const updatedUser: User = {
        ...currentUser,
        batchCode: "",
        pendingBatchCode: resolvedBatchCode,
      };
      await saveUserToFirestore(updatedUser);
      await saveUserSupabase(updatedUser);
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
      alert(`✅ تم إرسال طلب الانضمام لدفعة (${batchDisplayName}) بنجاح!\nطلبك الآن قيد الانتظار ولن تتمكن من دخول الدفعة إلا بعد قبول طلبك من قبل ممثل الدفعة.`);
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
      await deleteJoinRequestSupabase(`req_${currentUser.uid}`);
      const updatedUser: User = {
        ...currentUser,
        batchCode: "",
        pendingBatchCode: "",
      };
      await saveUserToFirestore(updatedUser);
      await saveUserSupabase(updatedUser);
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
        const approvedUser: User = {
          ...targetUser,
          batchCode: req.batchCode,
          pendingBatchCode: "",
        };
        await saveUserToFirestore(approvedUser);
        await saveUserSupabase(approvedUser);
        setAppUsers((prev) => prev.map((u) => u.uid === req.userId ? approvedUser : u));
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
      await deleteJoinRequestSupabase(req.id);
      setJoinRequests((prev) => prev.filter((r) => r.id !== req.id));
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
          const rejectedUser: User = {
            ...targetUser,
            pendingBatchCode: "",
          };
          await saveUserToFirestore(rejectedUser);
          await saveUserSupabase(rejectedUser);
          setAppUsers((prev) => prev.map((u) => u.uid === req.userId ? rejectedUser : u));
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
      await deleteJoinRequestSupabase(id);
      setJoinRequests((prev) => prev.filter((r) => r.id !== id));
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

  const handleToggleUserDuty = async (targetUser: User, duty: AssistantDuty) => {
    if (!isMainAdmin) return;
    setIsUpdatingDuty(true);
    try {
      const currentDuties = targetUser.assistantDuties || [];
      const hasDuty = currentDuties.includes(duty);
      const nextDuties = hasDuty
        ? currentDuties.filter((d) => d !== duty)
        : [...currentDuties, duty];

      const updatedUser: User = {
        ...targetUser,
        assistantDuties: nextDuties,
      };

      await saveUserToFirestore(updatedUser);

      // Update local duty target state if modal is open
      if (dutyTargetStudent && dutyTargetStudent.uid === targetUser.uid) {
        setDutyTargetStudent(updatedUser);
      }

      const dutyConfig = ASSISTANT_DUTIES_CONFIG[duty];
      await notifyUserIfAllowed({
        targetUser,
        category: "SYSTEM",
        title: hasDuty
          ? `ℹ️ تحديث مهامك في الدفعة: تم سحب رتبة (${dutyConfig.label})`
          : `🎖️ تهانينا: تم تعيينك (${dutyConfig.label})!`,
        content: hasDuty
          ? `تم تحديث صلاحياتك وسحب مهمة (${dutyConfig.label}) من حسابك.`
          : `قام ممثل الدفعة بتعيينك رسمياً كـ (${dutyConfig.label}). أصبحت تملك الآن صلاحيات: ${dutyConfig.description}`,
        batchCode: effectiveBatchCode,
        targetTab: Tab.PROFILE,
      });
    } catch (err) {
      console.error("Error updating user duties:", err);
      alert("حدث خطأ أثناء حفظ رتب الطالب.");
    } finally {
      setIsUpdatingDuty(false);
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
        academicGroup: targetUser.academicGroup || oldStudent.academicGroup || "",
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
              await notifyUserIfAllowed({
                targetUser: student,
                category: "GRADE",
                title: `📊 رصد درجة جديدة في ${viewingCourseGradeSheet.name}`,
                content: `تم رصد درجتك في (${asm.name}): ${numericScore} من ${asm.maxScore}.`,
                batchCode: effectiveBatchCode,
                targetTab: Tab.GRADES,
              });
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
      if (!existingGrade || existingGrade.score !== numericScore) {
        const targetStudent = appUsers.find((u) => u.uid === studentId);
        if (targetStudent) {
          await notifyUserIfAllowed({
            targetUser: targetStudent,
            category: "GRADE",
            title: `📊 رصد درجة جديدة في ${selectedCourseForGrading.name}`,
            content: `تم رصد درجتك في (${selectedAssessmentForGrading.name}): ${numericScore} من ${selectedAssessmentForGrading.maxScore}.`,
            batchCode: effectiveBatchCode,
            targetTab: Tab.GRADES,
          });
        }
      }
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

      const recordsToCopy = sourceRecords
        .filter((srcRec) => validStudentIds.has(srcRec.studentId))
        .map((srcRec) => {
          const existingRecord = attendanceRecords.find(
            (r) =>
              r.sessionId === destSessionId &&
              r.studentId === srcRec.studentId
          );
          return {
            id: existingRecord
              ? existingRecord.id
              : `rec_${Date.now()}_${srcRec.studentId}`,
            batchCode: effectiveBatchCode,
            sessionId: destSessionId,
            studentId: srcRec.studentId,
            status: srcRec.status,
            timestamp: Date.now(),
          } as AttendanceRecord;
        });

      await saveAttendanceRecordsBatchToFirestore(recordsToCopy);
      setCopyAttendanceSuccess(
        `تم نسخ نفس الحضور والغيابات (${recordsToCopy.length} طالب) من "${sourceSession?.title || "المحاضرة السابقة"}" ${sourceCourse ? `(${sourceCourse.name})` : ""} بنجاح! ⚡`
      );
      setTimeout(() => setCopyAttendanceSuccess(null), 5000);
    } catch (err) {
      console.error("Error copying attendance:", err);
    } finally {
      setIsCopyingAttendance(false);
    }
  };

  // --- Schedule-Linked Attendance Helpers ---
  const getArabicDayFromDateStr = (dateStr: string): string => {
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

  const getMostRecentDateForArabicDay = (arabicDay: string): string => {
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
    return `${yyyy}-${mm}-${dd}`;
  };

  const parseScheduleTimeMinutes = (timeStr?: string): number => {
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

  const handleOpenOrCreateScheduledAttendance = async (
    sched: LectureSchedule,
    dateStr: string,
    autoCopyFromSessionId?: string
  ) => {
    const targetDate = dateStr || new Date().toISOString().slice(0, 10);
    setAttendanceTargetDate(targetDate);

    const matchedCourse = findMatchedCourseForSchedule(sched);
    const existing = findExistingSessionForSchedule(sched, targetDate);

    if (existing) {
      if (matchedCourse) {
        setSelectedCourseForAttendance(matchedCourse);
      }
      setSelectedSessionId(existing.id);
      setActiveTab(Tab.ATTENDANCE);
      if (autoCopyFromSessionId) {
        await handleCopyAttendanceFromSession(autoCopyFromSessionId, existing.id);
      }
      return;
    }

    const typeLabel = sched.lectureType === "PRACTICAL" ? "عملي" : "نظري";
    const groupPart =
      sched.targetGroup && sched.targetGroup !== "ALL"
        ? ` - ${sched.targetGroup}`
        : "";
    const timePart = sched.startTime ? ` • ${sched.startTime}` : "";
    const autoTitle = `${sched.courseName} (${typeLabel}${groupPart}${timePart})`;

    const newSession: AttendanceSession = {
      id: `session_${Date.now()}`,
      batchCode: effectiveBatchCode,
      courseId: matchedCourse?.id || sched.courseId || sched.id,
      courseName: sched.courseName,
      scheduleId: sched.id,
      date: targetDate,
      title: autoTitle,
      startTime: sched.startTime,
      endTime: sched.endTime,
      hall: sched.hall,
      lectureType: sched.lectureType || "THEORY",
      targetGroup: sched.targetGroup || "ALL",
      createdBy: currentUser?.uid || "admin",
      timestamp: Date.now(),
    };

    await saveAttendanceSessionToFirestore(newSession);
    if (matchedCourse) {
      setSelectedCourseForAttendance(matchedCourse);
    }
    setAttendanceGroupFilter("DEFAULT");
    setAttendanceSheetGroupFilter("SESSION_GROUP");
    setSelectedSessionId(newSession.id);
    setActiveTab(Tab.ATTENDANCE);

    if (autoCopyFromSessionId) {
      await handleCopyAttendanceFromSession(autoCopyFromSessionId, newSession.id);
    }
  };

  const handleCreateSession = async (autoCopyFromSessionId?: string) => {
    if (!selectedCourseForAttendance || !newSessionDate) return;

    const chosenSched = selectedScheduleSlotId
      ? schedules.find((s) => s.id === selectedScheduleSlotId)
      : undefined;

    if (chosenSched) {
      setIsAddingSession(false);
      setSelectedScheduleSlotId("");
      await handleOpenOrCreateScheduledAttendance(
        chosenSched,
        newSessionDate,
        autoCopyFromSessionId
      );
      return;
    }

    const groupSuffix =
      newSessionTargetGroup && newSessionTargetGroup !== "ALL"
        ? ` - ${newSessionTargetGroup}`
        : "";

    const newSession: AttendanceSession = {
      id: `session_${Date.now()}`,
      batchCode: effectiveBatchCode,
      courseId: selectedCourseForAttendance.id,
      courseName: selectedCourseForAttendance.name,
      date: newSessionDate,
      title: newSessionTitle
        ? `${newSessionTitle}${groupSuffix}`
        : `محاضرة إضافية${groupSuffix} (${newSessionDate})`,
      targetGroup: newSessionTargetGroup || "ALL",
      createdBy: currentUser?.uid || "admin",
      timestamp: Date.now(),
    };

    await saveAttendanceSessionToFirestore(newSession);
    setAttendanceGroupFilter("DEFAULT");
    setAttendanceSheetGroupFilter("SESSION_GROUP");
    setSelectedSessionId(newSession.id);
    if (autoCopyFromSessionId) {
      await handleCopyAttendanceFromSession(autoCopyFromSessionId, newSession.id);
    }
    setNewSessionDate(new Date().toISOString().slice(0, 10));
    setNewSessionTitle("");
    setSelectedScheduleSlotId("");
    setNewSessionTargetGroup("ALL");
    setIsAddingSession(false);
  };

  const handleDeleteSession = async (sessionId: string) => {
    await deleteAttendanceSessionFromFirestore(sessionId);
    if (selectedSessionId === sessionId) setSelectedSessionId(null);
  };

  // Update targetGroup of an already opened AttendanceSession
  const handleUpdateSessionTargetGroup = async (
    session: AttendanceSession,
    nextGroup: string
  ) => {
    const updatedSession: AttendanceSession = {
      ...session,
      targetGroup: nextGroup || "ALL",
    };
    await saveAttendanceSessionToFirestore(updatedSession);
    setAttendanceGroupFilter("DEFAULT");
    setAttendanceSheetGroupFilter("SESSION_GROUP");
  };

  // Add an exceptional student from another group (with optional swap) to the current session
  const handleAddExceptionAttendanceRecord = async () => {
    if (!selectedSessionId || !exceptionStudentId) return;
    const sessionObj = attendanceSessions.find((s) => s.id === selectedSessionId);
    const guestStudent = appUsers.find((u) => u.uid === exceptionStudentId);
    if (!guestStudent || !sessionObj) return;

    const swappedStudent = exceptionSwappedWithId
      ? appUsers.find((u) => u.uid === exceptionSwappedWithId)
      : undefined;

    const existingGuestRec = attendanceRecords.find(
      (r) => r.sessionId === selectedSessionId && r.studentId === guestStudent.uid
    );

    const guestRec: AttendanceRecord = {
      id: existingGuestRec
        ? existingGuestRec.id
        : `rec_${Date.now()}_${guestStudent.uid}`,
      batchCode: effectiveBatchCode,
      sessionId: selectedSessionId,
      studentId: guestStudent.uid,
      status: exceptionStatus,
      isException: true,
      originalGroup: guestStudent.academicGroup || "كروب آخر",
      ...(swappedStudent
        ? {
            swappedWithStudentId: swappedStudent.uid,
            swappedWithStudentName: swappedStudent.name,
          }
        : {}),
      ...(exceptionNote.trim() ? { exceptionNote: exceptionNote.trim() } : {}),
      timestamp: Date.now(),
    };

    await saveAttendanceRecordToFirestore(guestRec);

    // If swapped with a student from the current lecture's group, mark that student as EXCUSED with swap note
    if (swappedStudent) {
      const existingSwapTargetRec = attendanceRecords.find(
        (r) =>
          r.sessionId === selectedSessionId && r.studentId === swappedStudent.uid
      );
      const swapTargetRec: AttendanceRecord = {
        id: existingSwapTargetRec
          ? existingSwapTargetRec.id
          : `rec_${Date.now()}_${swappedStudent.uid}`,
        batchCode: effectiveBatchCode,
        sessionId: selectedSessionId,
        studentId: swappedStudent.uid,
        status: "EXCUSED",
        swappedWithStudentId: guestStudent.uid,
        swappedWithStudentName: guestStudent.name,
        exceptionNote:
          exceptionNote.trim() ||
          `تبديل كروب مؤقت مع الطالب (${guestStudent.name})`,
        timestamp: Date.now(),
      };
      await saveAttendanceRecordToFirestore(swapTargetRec);
    }

    const courseObj = courses.find((c) => c.id === sessionObj.courseId);
    await notifyUserIfAllowed({
      targetUser: guestStudent,
      category: "ATTENDANCE",
      title: `🔄 تسجيل حضور استثنائي في ${courseObj?.name || sessionObj.courseName || "المحاضرة"}`,
      content: `تم تسجيل حضورك الاستثنائي مع (${
        sessionObj.targetGroup && sessionObj.targetGroup !== "ALL"
          ? sessionObj.targetGroup
          : "المحاضرة"
      })${swappedStudent ? ` بديلاً عن (${swappedStudent.name})` : ""} بتاريخ ${
        sessionObj.date
      }.`,
      batchCode: effectiveBatchCode,
      targetTab: Tab.ATTENDANCE,
    });

    setIsAddingExceptionModalOpen(false);
    setExceptionStudentId("");
    setExceptionSwappedWithId("");
    setExceptionNote("");
    setExceptionStatus("PRESENT");
    setExceptionSearchQuery("");
  };

  const handleAddExceptionOrSwapAttendance = async () => {
    if (!selectedSessionId || !exceptionGuestStudentId) return;
    const sessionObj = attendanceSessions.find((s) => s.id === selectedSessionId);
    const guestStudent = appUsers.find((u) => u.uid === exceptionGuestStudentId);
    if (!guestStudent || !sessionObj) return;

    const swappedStudent =
      exceptionMode === "SWAP_WITH_STUDENT" && exceptionSwapTargetStudentId
        ? appUsers.find((u) => u.uid === exceptionSwapTargetStudentId)
        : undefined;

    const existingGuestRec = attendanceRecords.find(
      (r) => r.sessionId === selectedSessionId && r.studentId === guestStudent.uid
    );

    const guestRec: AttendanceRecord = {
      id: existingGuestRec
        ? existingGuestRec.id
        : `rec_${Date.now()}_${guestStudent.uid}`,
      batchCode: effectiveBatchCode,
      sessionId: selectedSessionId,
      studentId: guestStudent.uid,
      status: "PRESENT",
      isException: true,
      originalGroup: guestStudent.academicGroup || "كروب آخر",
      ...(swappedStudent
        ? {
            swappedWithStudentId: swappedStudent.uid,
            swappedWithStudentName: swappedStudent.name,
          }
        : {}),
      ...(exceptionNoteInput.trim()
        ? { exceptionNote: exceptionNoteInput.trim() }
        : {}),
      timestamp: Date.now(),
    };

    await saveAttendanceRecordToFirestore(guestRec);

    if (swappedStudent) {
      const existingSwapTargetRec = attendanceRecords.find(
        (r) =>
          r.sessionId === selectedSessionId && r.studentId === swappedStudent.uid
      );
      const swapTargetRec: AttendanceRecord = {
        id: existingSwapTargetRec
          ? existingSwapTargetRec.id
          : `rec_${Date.now()}_${swappedStudent.uid}`,
        batchCode: effectiveBatchCode,
        sessionId: selectedSessionId,
        studentId: swappedStudent.uid,
        status: "EXCUSED",
        swappedWithStudentId: guestStudent.uid,
        swappedWithStudentName: guestStudent.name,
        exceptionNote:
          exceptionNoteInput.trim() ||
          `تبديل كروب مؤقت مع الطالب (${guestStudent.name})`,
        timestamp: Date.now(),
      };
      await saveAttendanceRecordToFirestore(swapTargetRec);
    }

    const courseObj = courses.find((c) => c.id === sessionObj.courseId);
    await notifyUserIfAllowed({
      targetUser: guestStudent,
      category: "ATTENDANCE",
      title: `🔄 تسجيل حضور استثنائي في ${courseObj?.name || sessionObj.courseName || "المحاضرة"}`,
      content: `تم تسجيل حضورك الاستثنائي مع (${
        sessionObj.targetGroup && sessionObj.targetGroup !== "ALL"
          ? sessionObj.targetGroup
          : "المحاضرة"
      })${swappedStudent ? ` بديلاً عن (${swappedStudent.name})` : ""} بتاريخ ${
        sessionObj.date
      }.`,
      batchCode: effectiveBatchCode,
      targetTab: Tab.ATTENDANCE,
    });

    setIsExceptionModalOpen(false);
    setExceptionGuestStudentId("");
    setExceptionSwapTargetStudentId("");
    setExceptionNoteInput("");
    setExceptionMode("ATTEND_WITH_GROUP");
  };

  const handleRemoveExceptionRecord = async (recordId: string) => {
    await deleteAttendanceRecordFromFirestore(recordId);
  };

  const handleRemoveExceptionStudent = async (recordId: string) => {
    await deleteAttendanceRecordFromFirestore(recordId);
  };

  const handleMarkAttendance = async (
    studentId: string,
    status: 'PRESENT' | 'ABSENT' | 'EXCUSED',
    extraMeta?: Partial<AttendanceRecord>
  ) => {
    if (!selectedSessionId) return;

    const sessionObj = attendanceSessions.find((s) => s.id === selectedSessionId);
    const linkedSched = sessionObj?.scheduleId
      ? schedules.find((sc) => sc.id === sessionObj.scheduleId)
      : undefined;
    const effectiveTargetGroup =
      sessionObj?.targetGroup || linkedSched?.targetGroup || "ALL";
    const targetStudent = appUsers.find((u) => u.uid === studentId);

    const existingRecord = attendanceRecords.find(
      (r) => r.sessionId === selectedSessionId && r.studentId === studentId,
    );

    // Automatically detect if this student belongs to a different group than the session's targetGroup
    const isAutoException =
      existingRecord?.isException ||
      extraMeta?.isException ||
      (effectiveTargetGroup !== "ALL" &&
        Boolean(targetStudent?.academicGroup) &&
        targetStudent?.academicGroup !== effectiveTargetGroup);

    const recData: AttendanceRecord = {
      id: existingRecord ? existingRecord.id : `rec_${Date.now()}_${studentId}`,
      batchCode: effectiveBatchCode,
      sessionId: selectedSessionId,
      studentId,
      status,
      ...(isAutoException
        ? {
            isException: true,
            originalGroup:
              existingRecord?.originalGroup ||
              targetStudent?.academicGroup ||
              "كروب آخر",
          }
        : {}),
      ...(existingRecord?.swappedWithStudentId
        ? {
            swappedWithStudentId: existingRecord.swappedWithStudentId,
            swappedWithStudentName: existingRecord.swappedWithStudentName,
          }
        : {}),
      ...(existingRecord?.exceptionNote
        ? { exceptionNote: existingRecord.exceptionNote }
        : {}),
      ...extraMeta,
      timestamp: Date.now(),
    };
    await saveAttendanceRecordToFirestore(recData);

    if (targetStudent && (!existingRecord || existingRecord.status !== status)) {
      const courseObj = courses.find((c) => c.id === sessionObj?.courseId);
      const statusAr =
        status === "PRESENT" ? "حاضر ✅" : status === "EXCUSED" ? "مجاز 📝" : "غائب ❌";
      await notifyUserIfAllowed({
        targetUser: targetStudent,
        category: "ATTENDANCE",
        title: `✅ تسجيل حضورك في ${courseObj?.name || sessionObj?.courseName || "المحاضرة"}`,
        content: `تم تسجيل حالتك (${statusAr}) في ${sessionObj?.title || "المحاضرة"} بتاريخ ${sessionObj?.date || ""}.`,
        batchCode: effectiveBatchCode,
        targetTab: Tab.ATTENDANCE,
      });
    }
  };

  const handleBulkMarkAttendance = async (
    status: 'PRESENT' | 'ABSENT' | 'EXCUSED',
    targetStudents: User[]
  ) => {
    if (!selectedSessionId) return;
    const sessObj = attendanceSessions.find((s) => s.id === selectedSessionId);
    const courseObj = courses.find((c) => c.id === sessObj?.courseId);
    const statusAr =
      status === "PRESENT" ? "حاضر ✅" : status === "EXCUSED" ? "مجاز 📝" : "غائب ❌";

    const bulkRecords: AttendanceRecord[] = [];
    const changedStudents: User[] = [];

    targetStudents.forEach((student) => {
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
      bulkRecords.push(recData);
      if (!existingRecord || existingRecord.status !== status) {
        changedStudents.push(student);
      }
    });

    await saveAttendanceRecordsBatchToFirestore(bulkRecords);

    // Notify changed students
    await Promise.all(
      changedStudents.map((student) =>
        notifyUserIfAllowed({
          targetUser: student,
          category: "ATTENDANCE",
          title: `✅ تسجيل حضورك في ${courseObj?.name || "المحاضرة"}`,
          content: `تم تسجيل حالتك (${statusAr}) في ${sessObj?.title || "المحاضرة"} بتاريخ ${sessObj?.date || ""}.`,
          batchCode: effectiveBatchCode,
          targetTab: Tab.ATTENDANCE,
        })
      )
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

    await broadcastBatchNotification({
      allUsers: appUsers,
      batchCode: effectiveBatchCode,
      excludeUid: currentUser?.uid,
      category: "MATERIAL",
      title: `📚 محاضرة جديدة في ${activeMatCourse.name}`,
      content: `تم رفع (${newMatTitle}) ضمن قسم «${activeMatSection.title}».`,
      targetTab: Tab.MATERIALS,
    });

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

    await broadcastBatchNotification({
      allUsers: appUsers,
      batchCode: effectiveBatchCode,
      excludeUid: currentUser.uid,
      category: "ANNOUNCEMENT",
      title: `📢 ${newAnnouncementPriority === "high" ? "تبليغ هام: " : "تبليغ جديد: "}${newAnnouncementTitle}`,
      content: newAnnouncementContent.slice(0, 140),
      targetTab: Tab.HOME,
    });

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

    if (!editingProject) {
      await broadcastBatchNotification({
        allUsers: appUsers,
        batchCode: effectiveBatchCode,
        excludeUid: currentUser?.uid,
        category: "PROJECT",
        title: `🚀 مشروع جديد في ${project.courseName}: ${project.title}`,
        content: project.deadline
          ? `تم طرح مشروع جديد. موعد التسليم: ${project.deadline}.`
          : `تم طرح مشروع جديد لمادة (${project.courseName}).`,
        targetTab: Tab.PROJECTS,
      });
    }

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

    if (newGroupMembers.length > 0) {
      await broadcastBatchNotification({
        allUsers: appUsers,
        batchCode: effectiveBatchCode,
        excludeUid: currentUser?.uid,
        category: "PROJECT",
        title: `🚀 كروب المشروع (${groupItem.name}) - ${targetProjectForGroup.title}`,
        content: `تمت إضافتك أو تحديث مجموعتك (${groupItem.name}) في مشروع مادة ${targetProjectForGroup.courseName}.`,
        targetTab: Tab.PROJECTS,
        onlyUids: newGroupMembers,
      });
    }

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
    setNewAssignCourseId(courses.length > 0 ? courses[0].id : "general");
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
    setNewAssignCourseId(assign.courseId || "general");
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
    if (!newAssignTitle.trim() || !newAssignCourseId || !newAssignDueDate) {
      alert("يرجى إدخال عنوان الواجب، اختيار المادة، وتحديد موعد التسليم");
      return;
    }

    const batchCodeToUse = effectiveBatchCode || currentUser?.batchCode || "ENG26";
    const selectedCourse = courses.find((c) => c.id === newAssignCourseId);
    const courseName = selectedCourse?.name || (newAssignCourseId === "general" ? "تكليف عام" : "مادة دراسية");
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
      batchCode: batchCodeToUse,
      title: newAssignTitle.trim(),
      courseId: newAssignCourseId,
      courseName,
      dueDate: newAssignDueDate,
      dueTimestamp,
      completedBy: editingAssignment ? editingAssignment.completedBy || [] : [],
      createdAt: editingAssignment ? editingAssignment.createdAt : Date.now(),
      createdBy: currentUser?.name || "الممثل",
      ...(newAssignDesc.trim() ? { description: newAssignDesc.trim() } : {}),
      ...(attachmentsList.length > 0 ? { attachments: attachmentsList } : {}),
    };

    setIsSavingAssignment(true);
    try {
      await saveAssignmentToFirestore(assignment);

      const formattedDueShort = new Date(dueTimestamp).toLocaleString("ar-EG", {
        weekday: "long",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      if (!editingAssignment) {
        await broadcastBatchNotification({
          allUsers: appUsers,
          batchCode: batchCodeToUse,
          excludeUid: currentUser?.uid,
          category: "ASSIGNMENT",
          title: `📝 واجب جديد في ${assignment.courseName}: ${assignment.title}`,
          content: `آخر موعد للتسليم: ${formattedDueShort}.`,
          targetTab: Tab.ASSIGNMENTS,
        });
      }

      // If notification toggle was checked, automatically post to Announcements
      if (newAssignNotify && !editingAssignment && currentUser) {
        const formattedDue = new Date(dueTimestamp).toLocaleString("ar-EG", {
          weekday: "long",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        const annContent = `تمت إضافة تكليف / واجب جديد لمادة ${courseName}.\n\n📅 موعد التسليم النهائي: ${formattedDue}\n\n${newAssignDesc.trim()}`;

        const ann: Announcement = {
          id: `ann_${Date.now()}`,
          batchCode: batchCodeToUse,
          title: `📝 واجب جديد: ${newAssignTitle.trim()}`,
          content: annContent,
          timestamp: Date.now(),
          authorId: currentUser.uid,
          authorName: currentUser.name,
          priority: "high",
          courseId: newAssignCourseId,
          courseName,
          ...(newAssignAttachmentUrl.trim()
            ? { mediaUrl: newAssignAttachmentUrl.trim(), mediaType: newAssignAttachmentType }
            : {}),
          attachments: [],
        };
        await saveAnnouncementToFirestore(ann);
      }

      setIsAddingAssignment(false);
      setEditingAssignment(null);
    } catch (err) {
      console.error("Error saving assignment:", err);
      alert("حدث خطأ أثناء حفظ الواجب الدراسي، يرجى المحاولة مجدداً.");
    } finally {
      setIsSavingAssignment(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الواجب؟")) return;
    await deleteAssignmentFromFirestore(id);
  };

  const handleSaveAssignmentFromHub = async (assign: Assignment, notifyBatch: boolean = false) => {
    await saveAssignmentToFirestore(assign);
    if (notifyBatch && currentUser) {
      const formattedDue = new Date(assign.dueTimestamp).toLocaleString("ar-IQ", {
        weekday: "long",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      const annContent = `تمت إضافة تكليف / واجب جديد لمادة ${assign.courseName}.\n\n📅 موعد التسليم النهائي: ${formattedDue}\n\n${assign.description || ""}`;
      const ann: Announcement = {
        id: `ann_${Date.now()}`,
        batchCode: effectiveBatchCode,
        title: `📝 واجب جديد: ${assign.title}`,
        content: annContent,
        timestamp: Date.now(),
        authorId: currentUser.uid,
        authorName: currentUser.name,
        priority: "high",
        courseId: assign.courseId,
        courseName: assign.courseName,
        attachments: [],
      };
      await saveAnnouncementToFirestore(ann);
      await broadcastBatchNotification({
        allUsers: appUsers,
        batchCode: effectiveBatchCode,
        excludeUid: currentUser.uid,
        category: "ASSIGNMENT",
        title: `📝 تكليف جديد: ${assign.title}`,
        content: `موعد التسليم: ${formattedDue} لمادة ${assign.courseName}`,
        targetTab: Tab.ASSIGNMENTS,
      });
    }
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
    await broadcastBatchNotification({
      allUsers: appUsers,
      batchCode: effectiveBatchCode,
      excludeUid: currentUser?.uid,
      category: "EXAM",
      title: `🎓 موعد امتحان جديد: ${exam.title}`,
      content: `تم تحديد موعد امتحان لمادة (${exam.courseName}) بتاريخ ${new Date(
        exam.examTimestamp
      ).toLocaleDateString("ar-IQ", {
        weekday: "long",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}.`,
      targetTab: Tab.HOME,
    });
  };

  const handleDeleteExam = async (id: string) => {
    await deleteExamFromFirestore(id);
  };

  const handleToggleAssignmentDoneById = useCallback(
    async (id: string) => {
      const a = assignments.find((x) => x.id === id);
      if (a) await handleToggleAssignmentDone(a);
    },
    [assignments, handleToggleAssignmentDone]
  );

  // Memoized Home Selectors for lag-free rendering
  const upcomingHomeAssignments = useMemo(() => {
    return assignments
      .slice()
      .sort((a, b) => a.dueTimestamp - b.dueTimestamp)
      .slice(0, 3);
  }, [assignments]);

  const sortedHomeAnnouncements = useMemo(() => {
    return announcements
      .slice()
      .sort((a, b) => {
        if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
          return a.isPinned ? -1 : 1;
        }
        return b.timestamp - a.timestamp;
      });
  }, [announcements]);

  const userNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (let i = 0; i < appUsers.length; i++) {
      map.set(appUsers[i].uid, appUsers[i].name);
    }
    return map;
  }, [appUsers]);

  // --- Views Copy/Paste from previous with minor adjustments if needed ---
  // The Render functions remain almost identical as they use the state variables which are now populated by Firebase

  const renderHome = () => {
    return (
      <HomeView
        currentUser={currentUser}
        canManageAnnouncements={canManageAnnouncements}
        isManager={isManager}
        canManageAssignments={canManageAssignments}
        assignments={assignments}
        projects={projects}
        exams={exams}
        courses={courses}
        announcements={announcements}
        userNameMap={userNameMap}
        currentTimer={currentTimer}
        setActiveTab={setActiveTab}
        onSaveExam={handleSaveExam}
        onDeleteExam={handleDeleteExam}
        onToggleCompleteAssignmentById={handleToggleAssignmentDoneById}
        onOpenAddAssignment={handleOpenAddAssignment}
        onToggleAssignmentDone={handleToggleAssignmentDone}
        onTogglePinAnnouncement={handleTogglePinAnnouncement}
        onDeleteAnnouncement={handleDeleteAnnouncement}
        onVoteAnnouncementPoll={handleVoteAnnouncementPoll}
        onAddAnnouncement={handleAddAnnouncement}
        onPreviewItem={(item) =>
          setPreviewItem({
            title: item.title,
            url: item.url,
            type: item.type === "image" ? "IMAGE" : "LINK",
          })
        }
      />
    );
  };

  // ... (Other render methods: renderGrades, renderAttendance, etc. logic is identical but uses state populated by firebase) ...
  // To save space, I will include the critical ones updated for async behaviour where needed
  // Since we use state that is auto-updated, the render logic doesn't actually change much!
  // I will just put the whole return structure back.

  const renderGrades = () => {
    return (
      <CourseGradesView
        currentUser={currentUser}
        canManageGrades={canManageGrades}
        effectiveBatchCode={effectiveBatchCode}
        courses={courses}
        grades={grades}
        appUsers={appUsers}
        isAddingCourse={isAddingCourse}
        setIsAddingCourse={setIsAddingCourse}
        editingCourseId={editingCourseId}
        setEditingCourseId={setEditingCourseId}
        newCourseName={newCourseName}
        setNewCourseName={setNewCourseName}
        courseProfessors={courseProfessors}
        setCourseProfessors={setCourseProfessors}
        tempProfName={tempProfName}
        setTempProfName={setTempProfName}
        newAssessments={newAssessments}
        setNewAssessments={setNewAssessments}
        newAssessmentName={newAssessmentName}
        setNewAssessmentName={setNewAssessmentName}
        newAssessmentScore={newAssessmentScore}
        setNewAssessmentScore={setNewAssessmentScore}
        handleAddProf={handleAddProf}
        handleRemoveProf={handleRemoveProf}
        handleAddAssessmentToNewCourse={handleAddAssessmentToNewCourse}
        handleRemoveAssessmentFromNewCourse={handleRemoveAssessmentFromNewCourse}
        handleSaveCourse={handleSaveCourse}
        handleStartEditCourse={handleStartEditCourse}
        handleDeleteCourse={handleDeleteCourse}
        customizingCourseForGrades={customizingCourseForGrades}
        setCustomizingCourseForGrades={setCustomizingCourseForGrades}
        customAssessmentsDraft={customAssessmentsDraft}
        setCustomAssessmentsDraft={setCustomAssessmentsDraft}
        customNewAsmName={customNewAsmName}
        setCustomNewAsmName={setCustomNewAsmName}
        customNewAsmScore={customNewAsmScore}
        setCustomNewAsmScore={setCustomNewAsmScore}
        handleOpenCustomizeCourseGrades={handleOpenCustomizeCourseGrades}
        handleAddDraftAssessment={handleAddDraftAssessment}
        handleUpdateDraftAssessment={handleUpdateDraftAssessment}
        handleRemoveDraftAssessment={handleRemoveDraftAssessment}
        handleSaveCustomCourseAssessments={handleSaveCustomCourseAssessments}
        isEditingGrades={isEditingGrades}
        setIsEditingGrades={setIsEditingGrades}
        selectedCourseForGrading={selectedCourseForGrading}
        selectedAssessmentForGrading={selectedAssessmentForGrading}
        gradeEditorSearch={gradeEditorSearch}
        setGradeEditorSearch={setGradeEditorSearch}
        tempGrades={tempGrades}
        setTempGrades={setTempGrades}
        handleOpenGradeEditor={handleOpenGradeEditor}
        handleSaveGrades={handleSaveGrades}
        viewingCourseGradeSheet={viewingCourseGradeSheet}
        setViewingCourseGradeSheet={setViewingCourseGradeSheet}
        matrixGradesDraft={matrixGradesDraft}
        setMatrixGradesDraft={setMatrixGradesDraft}
        isSavingMatrixGrades={isSavingMatrixGrades}
        handleOpenCourseGradeSheet={handleOpenCourseGradeSheet}
        handleSaveMatrixGrades={handleSaveMatrixGrades}
        handleViewProfile={handleViewProfile}
        onOpenNicknameModal={(student) => {
          setNicknameTargetStudent(student);
          setNicknameInput(student.repNickname || student.name);
        }}
      />
    );
  };

  const handleSaveQuizGrades = async (
    exam: Exam,
    studentGrades: { studentId: string; score: number; notes?: string }[],
    maxScore: number,
    publishNotification: boolean
  ) => {
    const assessmentKey = `exam_quiz_${exam.id}`;
    const now = Date.now();
    const updatedExam: Exam = {
      ...exam,
      maxScore,
      isResultsPublished: publishNotification ? true : exam.isResultsPublished,
      publishedAt: publishNotification ? now : exam.publishedAt,
      publishedBy: currentUser?.name || 'ممثل الدفعة',
    };

    // 1. Update exam in Firestore & Supabase (dual-sync) & local state
    await saveExamToFirestore(updatedExam);
    setExams((prev) => prev.map((e) => (e.id === exam.id ? updatedExam : e)));

    // 2. Save individual student grades to both Firestore & Supabase
    const newOrUpdatedGrades: Grade[] = [];
    for (const sg of studentGrades) {
      const gradeId = `quiz_grade_${exam.id}_${sg.studentId}`;
      const gradeObj: Grade = {
        id: gradeId,
        batchCode: effectiveBatchCode,
        courseId: exam.courseId,
        studentId: sg.studentId,
        assessmentId: assessmentKey,
        score: sg.score,
        timestamp: now,
      };
      await saveGradeToFirestore(gradeObj);
      newOrUpdatedGrades.push(gradeObj);

      // If publishing, send individual notification to the graded student
      if (publishNotification) {
        const targetStudent = appUsers.find((u) => u.uid === sg.studentId);
        if (targetStudent) {
          await notifyUserIfAllowed({
            targetUser: targetStudent,
            category: 'GRADE',
            title: `درجتك في ${exam.title} 📝`,
            content: `أعلن الممثل درجات ${exam.title} (${exam.courseName}). درجتك المحققة: ${sg.score} من ${maxScore}.`,
            targetTab: Tab.ACADEMIC_PATH,
            batchCode: effectiveBatchCode,
          });
        }
      }
    }

    setGrades((prev) => {
      const idsToReplace = new Set(newOrUpdatedGrades.map((g) => g.id));
      const filtered = prev.filter((g) => !idsToReplace.has(g.id));
      return [...filtered, ...newOrUpdatedGrades];
    });

    // If publishing, broadcast announcement to the entire batch
    if (publishNotification) {
      await broadcastBatchNotification({
        allUsers: appUsers,
        batchCode: effectiveBatchCode,
        category: 'GRADE',
        title: `إعلان درجات: ${exam.title} 📢`,
        content: `تم إعلان ونشر نتائج ${exam.title} لمادة (${exam.courseName}). تفقد درجتك الآن في تبويب نتائج الكويزات!`,
        targetTab: Tab.ACADEMIC_PATH,
      });
    }
  };

  const handleCreateExam = async (examData: Partial<Exam>) => {
    const maxScore = examData.maxScore || 10;
    const newExam: Exam = {
      id: `exam_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      batchCode: effectiveBatchCode,
      title: examData.title || 'كويز جديد',
      courseId: examData.courseId || '',
      courseName: examData.courseName || '',
      type: examData.type || 'QUIZ',
      maxScore,
      passScore: typeof examData.passScore === 'number' ? examData.passScore : Math.round((maxScore / 2) * 10) / 10,
      visibility: examData.visibility || 'PUBLIC',
      examDate: examData.examDate || new Date().toISOString().split('T')[0],
      examTimestamp: examData.examTimestamp || Date.now(),
      topics: examData.topics,
      isResultsPublished: false,
      createdAt: Date.now(),
      createdBy: currentUser?.uid,
    };
    await saveExamToFirestore(newExam);
    setExams((prev) => [newExam, ...prev]);
  };

  const handleUpdateExam = async (updatedExam: Exam) => {
    await saveExamToFirestore(updatedExam);
    setExams((prev) => prev.map((e) => (e.id === updatedExam.id ? updatedExam : e)));
  };

  const handleDeleteQuizExam = async (examId: string) => {
    await deleteExamFromFirestore(examId);
    setExams((prev) => prev.filter((e) => e.id !== examId));
  };

  const renderQuizResults = () => {
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

    return (
      <QuizResultsHub
        currentUser={currentUser}
        isManager={isManager}
        canManageGrades={canManageGrades}
        courses={courses}
        exams={exams}
        grades={grades}
        students={batchStudents}
        effectiveBatchCode={effectiveBatchCode || ''}
        onSaveQuizGrades={handleSaveQuizGrades}
        onCreateExam={handleCreateExam}
        onUpdateExam={handleUpdateExam}
        onDeleteExam={handleDeleteQuizExam}
        onUpdateStudentNickname={handleUpdateStudentNickname}
      />
    );
  };

  const renderAttendance = () => {
    return (
      <AttendanceSheetView
        currentUser={currentUser}
        canManageAttendance={canManageAttendance}
        effectiveBatchCode={effectiveBatchCode}
        courses={courses}
        appUsers={appUsers}
        schedules={schedules}
        attendanceSessions={attendanceSessions}
        attendanceRecords={attendanceRecords}
        batchAcademicGroups={batchAcademicGroups}
        selectedSessionId={selectedSessionId}
        setSelectedSessionId={setSelectedSessionId}
        selectedCourseForAttendance={selectedCourseForAttendance}
        setSelectedCourseForAttendance={setSelectedCourseForAttendance}
        attendanceTargetDate={attendanceTargetDate}
        setAttendanceTargetDate={setAttendanceTargetDate}
        attendanceSearchQuery={attendanceSearchQuery}
        setAttendanceSearchQuery={setAttendanceSearchQuery}
        attendanceSheetGroupFilter={attendanceSheetGroupFilter}
        setAttendanceSheetGroupFilter={setAttendanceSheetGroupFilter}
        setAttendanceGroupFilter={setAttendanceGroupFilter}
        isAddingSession={isAddingSession}
        setIsAddingSession={setIsAddingSession}
        newSessionDate={newSessionDate}
        setNewSessionDate={setNewSessionDate}
        newSessionTitle={newSessionTitle}
        setNewSessionTitle={setNewSessionTitle}
        newSessionTargetGroup={newSessionTargetGroup}
        setNewSessionTargetGroup={setNewSessionTargetGroup}
        selectedScheduleSlotId={selectedScheduleSlotId}
        setSelectedScheduleSlotId={setSelectedScheduleSlotId}
        isCopyingAttendance={isCopyingAttendance}
        copyAttendanceSuccess={copyAttendanceSuccess}
        setCopyAttendanceSuccess={setCopyAttendanceSuccess}
        copyFromSessionId={copyFromSessionId}
        setCopyFromSessionId={setCopyFromSessionId}
        isExceptionModalOpen={isExceptionModalOpen}
        setIsExceptionModalOpen={setIsExceptionModalOpen}
        exceptionMode={exceptionMode}
        setExceptionMode={setExceptionMode}
        exceptionGuestStudentId={exceptionGuestStudentId}
        setExceptionGuestStudentId={setExceptionGuestStudentId}
        exceptionSwapTargetStudentId={exceptionSwapTargetStudentId}
        setExceptionSwapTargetStudentId={setExceptionSwapTargetStudentId}
        exceptionNoteInput={exceptionNoteInput}
        setExceptionNoteInput={setExceptionNoteInput}
        setActiveTab={setActiveTab}
        setSchedFilterDay={setSchedFilterDay}
        handleMarkAttendance={handleMarkAttendance}
        handleBulkMarkAttendance={handleBulkMarkAttendance}
        handleDeleteSession={handleDeleteSession}
        handleCreateSession={handleCreateSession}
        handleCopyAttendanceFromSession={handleCopyAttendanceFromSession}
        handleOpenOrCreateScheduledAttendance={handleOpenOrCreateScheduledAttendance}
        handleAddExceptionOrSwapAttendance={handleAddExceptionOrSwapAttendance}
        handleRemoveExceptionStudent={handleRemoveExceptionStudent}
        handleViewProfile={handleViewProfile}
        onOpenAttendanceReport={(student) => setAttendanceReportStudent(student)}
        onOpenNicknameModal={(student) => {
          setNicknameTargetStudent(student);
          setNicknameInput(student.repNickname || student.name);
        }}
      />
    );
  };

  const renderMaterials = () => {
    return (
      <MaterialsView
        currentUser={currentUser}
        effectiveBatchCode={effectiveBatchCode}
        courses={courses}
        materialSections={materialSections}
        materials={materials}
        appUsers={appUsers}
        currentBatchObj={batches.find((b) => b.code === effectiveBatchCode)}
        canManageMaterials={canManageMaterials}
        onToggleBookmarkMaterial={handleToggleBookmarkMaterial}
        onToggleStudiedMaterial={handleToggleStudiedMaterial}
        onDeleteMaterialItem={handleDeleteMaterialItem}
        onDownloadMaterial={handleDownloadMaterial}
        onOpenPdfViewer={(url, title, courseName, fileSize) =>
          setPdfViewerState({
            isOpen: true,
            url,
            title,
            courseName,
            fileSize,
          })
        }
        onPreviewImage={(title, url) =>
          setPreviewItem({
            title,
            url,
            type: "IMAGE",
          })
        }
        onAddMaterialSection={handleAddMaterialSection}
        onDeleteSection={handleDeleteSection}
        onAddMaterialItem={handleAddMaterialItem}
        onStartEditCourse={handleStartEditCourse}
        setActiveTab={setActiveTab}
      />
    );
  };

  const renderChat = () => {
    return (
      <ChatView
        currentUser={currentUser}
        appUsers={appUsers}
        chatMessages={chatMessages}
        isChatLocked={isChatLocked}
        isManager={isManager}
        onToggleChatLock={handleToggleChatLock}
        onSendMessage={handleSendMessage}
        onDeleteMessage={handleDeleteMessage}
        onViewProfile={handleViewProfile}
        onPreviewImage={(title, url) =>
          setPreviewItem({
            title,
            url,
            type: "IMAGE",
          })
        }
      />
    );
  };

  // --- Dynamic Lecture Schedule View ---
  const renderSchedule = () => {
    return (
      <ScheduleView
        currentUser={currentUser}
        effectiveBatchCode={effectiveBatchCode}
        schedules={schedules}
        courses={courses}
        batchAcademicGroups={batchAcademicGroups}
        isManager={isManager}
        canManageSchedule={canManageMaterials}
        onSaveSchedule={handleSaveSchedule}
        onDeleteSchedule={handleDeleteSchedule}
        onToggleCancelSchedule={handleToggleCancelSchedule}
        onOpenOrCreateScheduledAttendance={handleOpenOrCreateScheduledAttendance}
        setActiveTab={setActiveTab}
      />
    );
  };

  const renderCourseManagement = () => {
    return (
      <CoursesView
        courses={courses}
        isManager={isManager}
        canManageMaterials={canManageMaterials}
        setActiveTab={setActiveTab}
        onOpenCustomizeCourseGrades={handleOpenCustomizeCourseGrades}
        onAddCourse={async (name, prof) => {
          setNewSimpleCourseName(name);
          setSimpleCourseProf(prof);
          const courseData: Course = {
            id: `course_${Date.now()}`,
            batchCode: effectiveBatchCode,
            name,
            professors: prof ? [prof] : ["غير محدد"],
            cumulativeMaxScore: 50,
            finalExamMaxScore: 50,
            assessments: [],
            code: `C${Math.floor(100 + Math.random() * 899)}`,
          };
          await saveCourseToFirestore(courseData);
        }}
        onEditCourse={async (id, name, prof) => {
          const target = courses.find((c) => c.id === id);
          if (target) {
            const updated: Course = {
              ...target,
              name,
              professors: prof ? [prof] : target.professors,
            };
            await saveCourseToFirestore(updated);
          }
        }}
        onDeleteCourse={handleDeleteCourse}
      />
    );
  };

  const renderProjects = () => {
    return (
      <ProjectsView
        currentUser={currentUser}
        effectiveBatchCode={effectiveBatchCode}
        projects={projects}
        courses={courses}
        appUsers={appUsers}
        canManageAssignments={canManageAssignments}
        onSaveProject={async (data) => {
          const projectData: CourseProject = {
            id: data.id || `proj_${Date.now()}`,
            batchCode: effectiveBatchCode,
            courseId: data.courseId,
            courseName: data.courseName,
            title: data.title,
            deadline: data.deadline,
            description: data.description,
            groups: data.id ? projects.find((p) => p.id === data.id)?.groups || [] : [],
            createdAt: Date.now(),
          };
          await saveProjectToFirestore(projectData);
        }}
        onDeleteProject={handleDeleteProject}
        onSaveGroup={async (projectId, groupData) => {
          const proj = projects.find((p) => p.id === projectId);
          if (!proj) return;
          const groupItem: ProjectGroupItem = {
            id: groupData.id || `grp_${Date.now()}`,
            name: groupData.name,
            members: groupData.members,
            createdAt: Date.now(),
            description: groupData.description,
            leaderId: groupData.leaderId,
          };
          const updatedGroups = groupData.id
            ? proj.groups.map((g) => (g.id === groupData.id ? groupItem : g))
            : [...proj.groups, groupItem];
          await saveProjectToFirestore({
            ...proj,
            groups: updatedGroups,
          });
        }}
        onDeleteGroup={handleDeleteGroup}
        onUploadFileToGroup={async (projectId, groupId, file) => {
          // delegate to project file save
        }}
        onDeleteFileFromGroup={async (projectId, groupId, fileId) => {
          // delegate
        }}
        onViewProfile={handleViewProfile}
        onPreviewImage={(title, url) =>
          setPreviewItem({
            title,
            url,
            type: "IMAGE",
          })
        }
      />
    );
  };

  // --- Assignments (الواجبات والتكليفات) View ---
  const renderAssignments = () => {
    return (
      <AssignmentsView
        currentUser={currentUser}
        assignments={assignments}
        courses={courses}
        appUsers={appUsers}
        effectiveBatchCode={effectiveBatchCode}
        canManageAssignments={canManageAssignments}
        currentTimer={currentTimer}
        onOpenAddAssignment={handleOpenAddAssignment}
        onEditAssignment={handleOpenEditAssignment}
        onDeleteAssignment={handleDeleteAssignment}
        onToggleAssignmentDone={handleToggleAssignmentDone}
      />
    );
  };

  // --- Batches (النسخ والدفعات) View (Developer / Owner) ---
  const renderBatches = () => {
    return (
      <BatchesView
        currentUser={currentUser}
        batches={batches}
        appUsers={appUsers}
        onOpenRepManager={() => setIsRepManagerOpen(true)}
        onAddBatch={async (batchData) => {
          const newBatch: Batch = {
            id: `batch_${Date.now()}`,
            name: batchData.name,
            code: batchData.code,
            department: batchData.department,
            stage: batchData.stage,
            academicGroups: ["A", "B", "C"],
            createdAt: Date.now(),
          };
          await saveBatchToFirestore(newBatch);
          if (batchData.repUsername) {
            const rep = appUsers.find(
              (u) => u.username?.toLowerCase() === batchData.repUsername.toLowerCase()
            );
            if (rep) {
              await saveUserToFirestore({
                ...rep,
                role: UserRole.REPRESENTATIVE,
                batchCode: batchData.code,
              });
            }
          }
        }}
        onDeleteBatch={handleDeleteBatch}
        onUpdateBatchRepresentative={async (batch, newRepUsername) => {
          const rep = appUsers.find(
            (u) => u.username?.toLowerCase() === newRepUsername.toLowerCase()
          );
          if (rep) {
            await saveUserToFirestore({
              ...rep,
              role: UserRole.REPRESENTATIVE,
              batchCode: batch.code,
            });
          }
        }}
      />
    );
  };

  const renderNoBatchLanding = () => {
    return (
      <NoBatchLanding
        currentUser={currentUser!}
        onJoinSubmit={async (code) => {
          if (!currentUser) return;
          const updated: User = {
            ...currentUser,
            pendingBatchCode: code,
          };
          await saveUserToFirestore(updated);
          await saveUserSupabase(updated);
          setCurrentUser(updated);

          const req: JoinRequest = {
            id: `req_${Date.now()}_${currentUser.uid}`,
            userId: currentUser.uid,
            userName: currentUser.name,
            userEmail: currentUser.email || "",
            batchCode: code,
            status: 'PENDING',
            timestamp: Date.now(),
          };
          await saveJoinRequestToFirestore(req);
          await saveJoinRequestSupabase(req);
        }}
        onCancelJoinRequest={handleCancelJoinRequest}
        onNavigateProfile={() => setActiveTab(Tab.PROFILE)}
      />
    );
  };

  const renderJoinRequests = () => {
    return (
      <JoinRequestsView
        joinRequests={joinRequests}
        batches={batches}
        onApproveRequest={handleApproveRequest}
        onApproveAllRequests={handleApproveAllRequests}
        onRejectRequest={handleRejectRequest}
      />
    );
  };

  const renderStudentManagement = () => {
    return (
      <StudentsView
        currentUser={currentUser}
        effectiveBatchCode={effectiveBatchCode}
        appUsers={appUsers}
        batchAcademicGroups={batchAcademicGroups}
        isManager={isManager}
        canManageStudents={isMainAdmin}
        isOwner={isOwner}
        onViewProfile={handleViewProfile}
        onOpenAttendanceReport={(student) => setAttendanceReportStudent(student)}
        onOpenNicknameModal={(student) => {
          setNicknameTargetStudent(student);
          setNicknameInput(student.repNickname || student.name);
        }}
        onOpenDutyModal={(student) => setDutyTargetStudent(student)}
        onOpenChangeEmailModal={(student) => {
          setEmailTargetStudent(student);
          setIsChangeEmailModalOpen(true);
        }}
        onToggleAssistantRep={handleToggleAssistantRep}
        onToggleExcludeFromStats={handleToggleExcludeFromStats}
        onAssignStudentAcademicGroup={handleAssignStudentAcademicGroup}
        onAutoDistributeStudentsIntoGroups={handleAutoDistributeStudentsIntoGroups}
        onAddBatchAcademicGroup={handleAddBatchAcademicGroup}
        onRemoveBatchAcademicGroup={handleRemoveBatchAcademicGroup}
        onAddStudent={async (name, group) => {
          const newOfficialStudent: User = {
            uid: `official_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            username: `student_${Date.now().toString().slice(-4)}`,
            name: name.trim(),
            role: UserRole.STUDENT,
            batchCode: effectiveBatchCode,
            academicGroup: group || "A",
            isOfficial: true,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
            bio: "طالب مسجل رسمياً في السجل",
            signatureColor: "#64748b",
          };
          await saveUserToFirestore(newOfficialStudent);
        }}
        onDeleteUser={handleDeleteUser}
        onLinkAndMergeOfficialStudent={async (sourceUid, targetAcc, keepName) => {
          setLinkingSourceOfficialUid(sourceUid);
          setLinkingTargetAccount(targetAcc);
          setKeepOfficialNameOnMerge(keepName);
          await handleLinkAndMergeOfficialStudent();
        }}
      />
    );
  };

  const renderProfile = () => {
    return (
      <ProfileView
        currentUser={currentUser}
        viewingUserProfile={viewingUserProfile}
        previousTabBeforeProfile={previousTabBeforeProfile}
        batches={batches}
        effectiveBatchCode={effectiveBatchCode}
        attendanceSessions={attendanceSessions}
        attendanceRecords={attendanceRecords}
        assignments={assignments}
        materials={materials}
        joinRequests={joinRequests}
        isOwner={isOwner}
        isManager={isManager}
        isMainAdmin={isMainAdmin}
        theme={theme}
        isDarkMode={isDarkMode}
        onSetTheme={setTheme}
        onToggleDarkMode={setIsDarkMode}
        onBackFromProfile={() => {
          setViewingUserProfile(null);
          if (previousTabBeforeProfile) {
            setActiveTab(previousTabBeforeProfile);
            setPreviousTabBeforeProfile(null);
          }
        }}
        onNavigateTab={(tab) => {
          setViewingUserProfile(null);
          setActiveTab(tab);
        }}
        onViewOwnProfile={() => setViewingUserProfile(null)}
        onOpenAttendanceReport={(student) => setAttendanceReportStudent(student)}
        onOpenRepManager={() => setIsRepManagerOpen(true)}
        onOpenRedeemRepCode={() => setIsRedeemRepCodeOpen(true)}
        onOpenDutyModal={(student) => setDutyTargetStudent(student)}
        onOpenChangeEmailModal={(student) => {
          setEmailTargetStudent(student);
          setIsChangeEmailModalOpen(true);
        }}
        onSaveProfile={async (data) => {
          if (!currentUser) return;
          const updated: User = {
            ...currentUser,
            name: data.name,
            username: data.username,
            bio: data.bio,
            banner: data.banner,
            avatar: data.avatar,
            signatureColor: data.signatureColor,
          };
          await saveUserToFirestore(updated);
          await saveUserSupabase(updated);
          setCurrentUser(updated);
        }}
        onResetDatabase={handleResetDatabase}
        onLeaveBatch={async () => {
          if (!currentUser) return;
          const updated: User = {
            ...currentUser,
            batchCode: "",
            pendingBatchCode: "",
          };
          await saveUserToFirestore(updated);
          await saveUserSupabase(updated);
          setCurrentUser(updated);
          setActiveTab(Tab.HOME);
        }}
        onToggleAssistantRep={handleToggleAssistantRep}
        onUpdateCurrentUser={(u) => setCurrentUser(u)}
      />
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
          await saveUserSupabase(user);
          saveUserToFirestore(user).catch(() => {});
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

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={(newTab) => {
        if (newTab === Tab.PROFILE) {
          setViewingUserProfile(null);
        }
        setActiveTab(newTab);
      }}
      user={currentUser}
      onLogout={handleLogout}
      onOpenRepModal={isOwner ? () => setIsRepManagerOpen(true) : undefined}
      onOpenNotifications={() => setIsNotificationCenterOpen(true)}
      unreadNotificationsCount={unreadNotifsCount}
      joinRequestsCount={joinRequests.length}
    >
      {isQuotaExceeded && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-900 dark:text-emerald-200 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3 shadow-sm z-30 sticky top-0 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <span className="font-medium">
              تم الانتقال وتفعيل قاعدة بيانات Supabase (PostgreSQL) السحابية بنجاح ⚡ المنصة تعمل الآن بكامل طاقتها وبدون أي حدود للقراءات اليومية!
            </span>
          </div>
          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full font-bold">
            Supabase Live 🟢
          </span>
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
          {activeTab === Tab.ASSIGNMENTS && (
            <UnifiedTasksHub
              currentUser={currentUser}
              batchStudents={appUsers.filter((u) => u.batchCode === effectiveBatchCode)}
              courses={courses}
              assignments={assignments}
              exams={exams}
              effectiveBatchCode={effectiveBatchCode || ""}
              isManager={isManager}
              onSaveAssignment={handleSaveAssignmentFromHub}
              onDeleteAssignment={handleDeleteAssignment}
              onToggleAssignmentDone={handleToggleAssignmentDone}
              onSaveExam={handleSaveExam}
              onDeleteExam={handleDeleteExam}
              onPreviewItem={setPreviewItem}
            />
          )}
          {activeTab === Tab.STUDY_HUB && (
            <StudyHubView
              initialSubTab="tasks"
              assignments={assignments}
              exams={exams}
              materials={materials}
              materialSections={materialSections}
              courses={courses}
              currentUser={currentUser}
              appUsers={appUsers}
              effectiveBatchCode={effectiveBatchCode || ""}
              isManager={isManager}
              canManageMaterials={canManageMaterials}
              canManageAssignments={canManageAssignments}
              onToggleAssignmentDone={handleToggleAssignmentDone}
              onOpenAddAssignment={handleOpenAddAssignment}
              onOpenEditAssignment={handleOpenEditAssignment}
              onDeleteAssignment={handleDeleteAssignment}
              onSaveExam={handleSaveExam}
              onDeleteExam={handleDeleteExam}
              renderMaterialsContent={renderMaterials}
              studentSummaries={studentSummaries}
              onPreviewImage={(title, url) =>
                setPreviewItem({ title, url, type: "IMAGE" })
              }
              onViewProfile={handleViewProfile}
              currentTimer={currentTimer}
            />
          )}
          {activeTab === Tab.ACADEMIC_PATH && (
            <AcademicPathView
              initialSubTab="grades"
              currentUser={currentUser}
              courses={courses}
              grades={grades}
              attendanceSessions={attendanceSessions}
              attendanceRecords={attendanceRecords}
              effectiveBatchCode={effectiveBatchCode || ""}
              isManager={isManager}
              onOpenAttendanceReport={(student) => {
                setAttendanceReportStudent(student);
              }}
              renderGradesContent={renderGrades}
              renderQuizResultsContent={renderQuizResults}
              renderAttendanceContent={renderAttendance}
              renderScheduleContent={renderSchedule}
            />
          )}
          {activeTab === Tab.COMMUNITY_HUB && (
            <CommunityHubView
              initialSubTab="chat"
              currentUser={currentUser}
              appUsers={appUsers}
              courses={courses}
              grades={grades}
              attendanceSessions={attendanceSessions}
              attendanceRecords={attendanceRecords}
              assignments={assignments}
              materials={materials}
              batchSuggestions={batchSuggestions}
              effectiveBatchCode={effectiveBatchCode || ""}
              isManager={isManager}
              onViewProfile={handleViewProfile}
              renderChatContent={renderChat}
              renderProjectsContent={renderProjects}
            />
          )}
          {activeTab === Tab.SCHEDULE && renderSchedule()}
          {activeTab === Tab.GRADES && renderGrades()}
          {activeTab === Tab.ATTENDANCE && renderAttendance()}
          {activeTab === Tab.MATERIALS && renderMaterials()}
          {activeTab === Tab.SUMMARIES && (
            <StudentSummariesHub
              currentUser={currentUser}
              allUsers={appUsers}
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
              allUsers={appUsers}
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

      {/* Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        notifications={notifications}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onOpenSettings={() => {
          setViewingUserProfile(null);
          setActiveTab(Tab.PROFILE);
        }}
      />

      {/* Live Real-Time Toast Notification Banner */}
      {liveToastNotif && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 animate-in slide-in-from-top-5 duration-300">
          <div className="bg-white dark:bg-slate-800 border-2 border-primary/40 rounded-3xl shadow-2xl p-4 flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-md shadow-primary/30">
              <Bell size={20} className="animate-bounce" />
            </div>
            <div
              className="flex-1 min-w-0 cursor-pointer"
              onClick={async () => {
                await markNotificationAsReadInFirestore(liveToastNotif.id);
                if (liveToastNotif.targetTab) {
                  setActiveTab(liveToastNotif.targetTab);
                } else {
                  setIsNotificationCenterOpen(true);
                }
                setLiveToastNotif(null);
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  إشعار فوري جديد 🔔
                </span>
                <span className="text-[10px] text-gray-400">الآن</span>
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white mt-1 truncate">
                {liveToastNotif.title || "تنبيه جديد في دفعتي"}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mt-0.5 leading-relaxed">
                {liveToastNotif.content}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLiveToastNotif(null)}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>
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

      {/* Modal: In-App Image Viewer / Lightbox */}
      <ImageViewerModal
        previewItem={previewItem}
        resolvedPreviewUrl={resolvedPreviewUrl}
        isLoadingPreview={isLoadingPreview}
        onClose={() => setPreviewItem(null)}
      />

      {/* In-App Interactive PDF Viewer Modal */}
      <PDFViewerModal
        isOpen={pdfViewerState.isOpen}
        onClose={() => setPdfViewerState((prev) => ({ ...prev, isOpen: false }))}
        url={pdfViewerState.url}
        title={pdfViewerState.title}
        courseName={pdfViewerState.courseName}
        fileSize={pdfViewerState.fileSize}
      />

      {/* Modal: Redeem Representative Code */}
      <RedeemCodeModal
        isOpen={isRedeemRepCodeOpen}
        onClose={() => {
          setIsRedeemRepCodeOpen(false);
          setRedeemFeedback(null);
        }}
        onRedeem={async (code) => {
          if (!currentUser) return { success: false, message: "غير مسجل" };
          const res = await redeemRepresentativeCode(code, currentUser);
          if (res.success && res.updatedUser) {
            setCurrentUser(res.updatedUser);
          }
          return res;
        }}
      />

      {/* Modal: Assign / Manage Assistant Duties for Batch Members */}
      <AssistantDutiesModal
        targetStudent={dutyTargetStudent}
        onClose={() => setDutyTargetStudent(null)}
        onToggleDuty={async (student, dutyId) => {
          await handleToggleUserDuty(student, dutyId);
        }}
        onSetDuties={async (student, duties) => {
          const updatedUser: User = {
            ...student,
            assistantDuties: duties,
          };
          await saveUserToFirestore(updatedUser);
          setDutyTargetStudent(updatedUser);
        }}
      />

      {/* Modal: Global Add/Edit Assignment */}
      <AddAssignmentModal
        isOpen={isAddingAssignment}
        onClose={() => setIsAddingAssignment(false)}
        editingAssignment={editingAssignment}
        courses={courses}
        onSave={async (data) => {
          const assignData: Assignment = {
            id: editingAssignment ? editingAssignment.id : `assign_${Date.now()}`,
            batchCode: effectiveBatchCode,
            courseId: data.courseId,
            courseName:
              data.courseId === "general"
                ? "واجب عام"
                : courses.find((c) => c.id === data.courseId)?.name || "مادة دراسية",
            title: data.title,
            dueDate: data.dueDate,
            dueTimestamp: new Date(data.dueDate).getTime(),
            description: data.description,
            attachments: data.attachment ? [data.attachment] : undefined,
            completedBy: editingAssignment ? editingAssignment.completedBy : [],
            createdAt: editingAssignment ? editingAssignment.createdAt : Date.now(),
            createdBy: editingAssignment ? editingAssignment.createdBy : currentUser?.uid,
          };

          await saveAssignmentToFirestore(assignData);

          if (data.notify && !editingAssignment) {
            await broadcastBatchNotification({
              allUsers: appUsers,
              batchCode: effectiveBatchCode,
              excludeUid: currentUser?.uid,
              category: "ASSIGNMENT",
              title: `📝 واجب وتكليف دراسي جديد: ${assignData.title}`,
              content: `تمت إضافة واجب جديد لمادة (${assignData.courseName}) موعد التسليم: ${new Date(
                assignData.dueTimestamp
              ).toLocaleDateString("ar-IQ", {
                weekday: "long",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}.`,
              targetTab: Tab.ASSIGNMENTS,
            });
          }

          setIsAddingAssignment(false);
          setEditingAssignment(null);
        }}
      />

      {/* Modal: Set / Edit Student Nickname for Alphabetical Order */}
      <NicknameModal
        student={nicknameTargetStudent}
        onClose={() => setNicknameTargetStudent(null)}
        onSave={handleUpdateStudentNickname}
      />

      {/* Modal: Account Email Switcher / Updater */}
      <ChangeEmailModal
        isOpen={isChangeEmailModalOpen}
        targetUser={emailTargetStudent || currentUser}
        onClose={() => {
          setIsChangeEmailModalOpen(false);
          setEmailTargetStudent(null);
        }}
        onUpdateEmail={handleUpdateUserEmail}
      />
    </Layout>
  );
}
