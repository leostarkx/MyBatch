// Role Definitions
export enum UserRole {
  OWNER = 'OWNER',
  STUDENT = 'STUDENT',
  REPRESENTATIVE = 'REPRESENTATIVE',
  ASSISTANT_REP = 'ASSISTANT_REP'
}

// App Theme Colors
export type ThemeColor = 'blue' | 'emerald' | 'violet' | 'rose' | 'amber';

// Notification Categories & Preferences Schema
export type NotificationCategory =
  | 'ANNOUNCEMENT'
  | 'ASSIGNMENT'
  | 'EXAM'
  | 'MATERIAL'
  | 'SUMMARY'
  | 'GRADE'
  | 'ATTENDANCE'
  | 'SCHEDULE'
  | 'PROJECT'
  | 'SUGGESTION'
  | 'CHAT'
  | 'SYSTEM'
  | 'MENTION';

export interface NotificationPreferences {
  enabled: boolean; // الوضع العام للإشعارات (مفعل / معطل)
  browserPush: boolean; // إشعارات المتصفح والنظام (Push Notifications)
  soundEnabled: boolean; // تنبيه صوتي عند وصول إشعار
  categories: {
    announcements: boolean; // التبليغات والإعلانات العامة 📢
    assignments: boolean; // الواجبات والتكليفات الدراسية 📝
    exams: boolean; // الامتحانات والكويزات 🎓
    materials: boolean; // المحاضرات والملازم الجديدة 📚
    summaries: boolean; // ملخصات الطلاب والمراجعات ✍️
    grades: boolean; // رصد وتحديث الدرجات والسعيات 📊
    attendance: boolean; // تسجيل الحضور والغياب ✅
    schedule: boolean; // تحديثات الجدول وإلغاء المحاضرات 🗓️
    projects: boolean; // المشاريع والكروبات 🚀
    suggestions: boolean; // ردود الممثل بصندوق الدفعة 📬
    chatMentions: boolean; // الإشارات والردود في دردشة الدفعة 💬
  };
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,
  browserPush: true,
  soundEnabled: true,
  categories: {
    announcements: true,
    assignments: true,
    exams: true,
    materials: true,
    summaries: true,
    grades: true,
    attendance: true,
    schedule: true,
    projects: true,
    suggestions: true,
    chatMentions: true,
  },
};

// User Schema
export interface User {
  uid: string;
  username?: string;
  password?: string;
  email?: string;
  name: string;
  role: UserRole;
  studentId?: string;
  batchCode?: string;
  pendingBatchCode?: string;
  avatar?: string;
  isOfficial?: boolean;
  excludeFromStats?: boolean;
  bio?: string;
  banner?: string;
  signatureColor?: string;
  studiedMaterialIds?: string[];
  bookmarkedMaterialIds?: string[];
  notificationPrefs?: NotificationPreferences;
}

// Batch Instance Schema (النسخ والدفعات)
export interface Batch {
  id: string;
  code: string; // كود الدفعة
  name: string; // اسم الدفعة
  department?: string; // القسم
  stage?: string; // المرحلة
  representativeUid?: string; // معرّف الممثل
  representativeName?: string; // اسم الممثل
  chatLocked?: boolean; // قفل/فتح الدردشة بيد الممثل
  createdAt: number;
}

// Dynamic Lecture Schedule Schema
export interface LectureSchedule {
  id: string;
  batchCode: string; // SCOPED
  courseId?: string;
  courseName: string;
  professor?: string;
  day: string;
  date?: string;
  startTime: string;
  endTime: string;
  hall: string;
  lectureType?: 'THEORY' | 'PRACTICAL'; // نظري أو عملي/مختبر
  isWeekly?: boolean; // يتكرر كل أسبوع تلقائياً
  isCancelled?: boolean;
  note?: string;
  updatedAt?: number;
}

// Notification Schema
export interface Notification {
  id: string;
  userId: string;
  batchCode?: string;
  type: NotificationCategory;
  title?: string;
  content: string;
  isRead: boolean;
  timestamp: number;
  linkTo?: string;
  targetTab?: Tab;
}

// Announcement Poll Option
export interface AnnouncementPollOption {
  id: string;
  text: string;
  votes: string[]; // Array of voter UIDs
}

// Announcement Poll Schema
export interface AnnouncementPoll {
  question: string;
  options: AnnouncementPollOption[];
}

// Announcement Schema
export interface Announcement {
  id: string;
  batchCode: string; // SCOPED
  title: string;
  content: string;
  timestamp: number;
  authorId: string;
  authorName: string;
  priority: 'normal' | 'high';
  isPinned?: boolean;
  poll?: AnnouncementPoll;
  courseId?: string; // Specific course
  courseName?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'link';
  attachments?: any[];
}

// Assessment Schema
export interface AssessmentStructure {
  id: string;
  name: string;
  maxScore: number;
  date?: string;
  category?: 'CUMULATIVE' | 'FINAL';
}

// Course Schema
export interface Course {
  id: string;
  batchCode: string; // SCOPED
  name: string;
  professors: string[];
  code?: string;
  cumulativeMaxScore?: number; // Default 50 (السعي التراكمي)
  finalExamMaxScore?: number; // Default 50 (الامتحان النهائي الفاينال)
  assessments: AssessmentStructure[];
}

// Grade Schema
export interface Grade {
  id: string;
  batchCode: string; // SCOPED
  studentId: string;
  courseId: string;
  assessmentId: string;
  score: number;
  timestamp?: number;
}

// Attendance Session
export interface AttendanceSession {
  id: string;
  batchCode: string; // SCOPED
  courseId: string;
  courseName?: string;
  scheduleId?: string;
  date: string;
  title?: string;
  startTime?: string;
  endTime?: string;
  hall?: string;
  lectureType?: 'THEORY' | 'PRACTICAL';
  createdBy?: string;
  timestamp?: number;
}

// Attendance Record
export interface AttendanceRecord {
  id: string;
  batchCode: string; // SCOPED
  sessionId: string;
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED';
  timestamp?: number;
}

// Material Section
export interface MaterialSection {
  id: string;
  batchCode: string; // SCOPED
  courseId: string;
  title: string;
  icon?: 'FOLDER' | 'BOOK' | 'FLASK' | 'ARCHIVE';
  category?: 'LECTURES' | 'QUESTIONS_BANK';
}

// Material
export interface Material {
  id: string;
  batchCode: string; // SCOPED
  courseId: string;
  sectionId: string;
  title: string;
  type: 'PDF' | 'IMAGE' | 'LINK';
  url: string;
  uploadDate: string;
  fileName?: string;
  driveFileId?: string;
  driveViewUrl?: string;
  driveDownloadUrl?: string;
  fileSize?: string;
}

// Chat Schema
export interface ChatMessage {
  id: string;
  batchCode: string; // SCOPED
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderAvatar?: string;
  senderColor?: string;
  content: string;
  timestamp: number;
  type?: 'text' | 'image' | 'video' | 'link' | 'file';
  mediaUrl?: string;
  expiresAt?: number;
  replyTo?: {
    id: string;
    senderName: string;
    content: string;
  } | null;
}

// Navigation Tabs
export enum Tab {
  HOME = 'الرئيسية',
  SCHEDULE = 'الجدول',
  GRADES = 'درجاتي',
  ATTENDANCE = 'الحضور',
  MATERIALS = 'المحاضرات',
  SUMMARIES = 'الملخصات',
  CHAT = 'الدفعة',
  PROFILE = 'حسابي',
  STUDENTS = 'الطلاب',
  BATCHES = 'إدارة الدفعات',
  REQUESTS = 'طلبات الانضمام',
  COURSES = 'المواد الدراسية',
  PROJECTS = 'المشاريع',
  ASSIGNMENTS = 'الواجبات',
  LEADERBOARD = 'المتصدرين',
  SUGGESTIONS = 'صندوق الدفعة'
}

export type SuggestionCategory =
  | 'SUGGESTION' // مقترح تطويري
  | 'REQUEST' // طلب تأجيل / تنسيق
  | 'ISSUE' // مشكلة في القاعة / المحاضرة
  | 'QUESTION'; // استفسار عام للممثل

export type SuggestionStatus =
  | 'OPEN' // مفتوح للتصويت
  | 'ANSWERED' // تمت الإجابة من الممثل
  | 'APPROVED' // تمت الموافقة والتنفيذ
  | 'CONVERTED'; // تم تحويله لتبليغ عام

export interface BatchSuggestion {
  id: string;
  batchCode: string;
  courseId?: string;
  courseName?: string;
  category: SuggestionCategory;
  title: string;
  content: string;
  isAnonymous: boolean; // إرسال بدون اسم (مجهول الهوية)
  authorUid: string;
  authorName: string;
  authorAvatar?: string;
  upvotes: string[]; // معرّفات الطلاب المؤيدين 👍
  downvotes: string[]; // معرّفات الطلاب المعارضين 👎
  status: SuggestionStatus;
  repReply?: string; // رد الممثل
  repReplyBy?: string;
  repReplyAt?: number;
  createdAt: number;
}

export type SummaryCategory =
  | 'SUMMARY' // ملخص محاضرة / فصل
  | 'NOTES' // ملاحظات مهمة وتأشيرات
  | 'PAST_QUESTIONS' // أسئلة وحلول
  | 'MINDMAP' // مخططات وجداول وقوانين
  | 'EXAM_REVIEW'; // مراجعة مركزة للامتحان

export interface SummaryAttachment {
  id: string;
  fileName: string;
  url: string;
  fileSize?: string;
  mimeType?: string;
}

export interface StudentSummary {
  id: string;
  batchCode: string;
  courseId: string;
  courseName: string;
  category: SummaryCategory;
  title: string;
  content?: string; // النص أو الملاحظة المكتوبة (اختياري إذا وُجد مرفق، أو كلاهما معاً)
  attachments?: SummaryAttachment[]; // ملفات بأي صيغة كانت
  authorUid: string;
  authorName: string;
  authorAvatar?: string;
  authorRole?: UserRole;
  likes?: string[]; // UIDs of students who found it helpful
  isPinned?: boolean;
  createdAt: number;
}

// Join Request Schema
export interface JoinRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  batchCode: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  timestamp: number;
}

// Project File / Submission Item Schema
export interface ProjectFileItem {
  id: string;
  title: string;
  fileName: string;
  url: string;
  fileSize?: string;
  uploadedByUid: string;
  uploadedByName: string;
  uploadedAt: number;
  type?: 'PDF' | 'IMAGE' | 'LINK' | 'file';
}

// Project Group Item Schema (Inside a Project)
export interface ProjectGroupItem {
  id: string;
  name: string;
  description?: string;
  members: string[]; // User UIDs
  leaderId?: string;
  createdAt: number;
  files?: ProjectFileItem[]; // قائمة ملفات الكروب المرفوعة من الطلاب أو الممثل
  submissionUrl?: string;
  submissionName?: string;
  submissionDate?: string;
  driveFileId?: string;
}

// Course Project Schema
export interface CourseProject {
  id: string;
  batchCode: string;
  title: string;
  courseId: string;
  courseName: string;
  description?: string;
  deadline?: string;
  groups: ProjectGroupItem[];
  projectFiles?: ProjectFileItem[]; // ملفات عامة للمشروع أو الحدث يرفعها الممثل
  createdAt: number;
  createdBy?: string;
}

// Legacy ProjectGroup Schema for backward compatibility
export interface ProjectGroup {
  id: string;
  batchCode: string;
  courseId: string;
  courseName: string;
  name: string;
  description?: string;
  members: string[]; // User UIDs
  leaderId?: string;
  createdAt: number;
}

// Assignment / Homework Schema
export interface AssignmentAttachment {
  title: string;
  url: string;
  type: 'file' | 'link' | 'image';
}

export interface Assignment {
  id: string;
  batchCode: string;
  title: string; // عنوان الواجب
  courseId: string;
  courseName: string; // اسم المادة
  description?: string; // تفاصيل أو متطلبات الواجب
  dueDate: string; // نص التاريخ والوقت (مثل 2026-10-05T23:59)
  dueTimestamp: number; // لحساب الوقت المتبقي بالدقائق والساعات والأيام
  attachments?: AssignmentAttachment[];
  completedBy?: string[]; // معرّفات الطلاب الذين أتمّوا الواجب
  createdAt: number;
  createdBy?: string;
}

// Exam & Quiz Schema (الامتحانات والكويزات)
export interface Exam {
  id: string;
  batchCode: string; // SCOPED
  title: string; // e.g. "كويز فصلي 1" أو "امتحان الشهر الأول" أو "الامتحان النهائي"
  courseId: string;
  courseName: string;
  examDate: string; // e.g. "2026-10-12T09:00"
  examTimestamp: number;
  hall?: string; // القاعة الامتحانية
  topics?: string; // المادة المقررة للامتحان
  type?: 'QUIZ' | 'MIDTERM' | 'FINAL' | 'PRACTICAL';
  createdAt: number;
  createdBy?: string;
}

// Representative Activation / Appointment Code Schema
export interface RepresentativeCode {
  id: string;
  code: string; // e.g. "REP-ENG26-9281"
  batchCode: string;
  batchName?: string;
  targetRepName?: string; // اسم الممثل المحدد
  targetRepUsername?: string; // يوزر الممثل إن وجد
  durationOption?: 'month' | 'year' | 'lifetime'; // مدة الكود: شهر أو سنة أو مدى الحياة
  createdBy: string;
  createdAt: number;
  expiresAt?: number;
  isUsed: boolean;
  usedByUid?: string;
  usedByName?: string;
  usedAt?: number;
  notes?: string;
}
