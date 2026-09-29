// Role Definitions
export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  STUDENT = 'STUDENT',
  REPRESENTATIVE = 'REPRESENTATIVE'
}

// App Theme Colors
export type ThemeColor = 'blue' | 'emerald' | 'violet' | 'rose' | 'amber';

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
  bio?: string;
  banner?: string;
  signatureColor?: string;
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
  isCancelled?: boolean;
  note?: string;
  updatedAt?: number;
}

// Notification Schema
export interface Notification {
  id: string;
  userId: string;
  type: 'MENTION' | 'ANNOUNCEMENT';
  content: string;
  isRead: boolean;
  timestamp: number;
  linkTo?: string;
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
}

// Course Schema
export interface Course {
  id: string;
  batchCode: string; // SCOPED
  name: string;
  professors: string[];
  code?: string;
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
  date: string;
  title?: string;
  createdBy?: string;
  timestamp?: number;
}

// Attendance Record
export interface AttendanceRecord {
  id: string;
  batchCode: string; // SCOPED
  sessionId: string;
  studentId: string;
  status: 'PRESENT' | 'ABSENT';
  timestamp?: number;
}

// Material Section
export interface MaterialSection {
  id: string;
  batchCode: string; // SCOPED
  courseId: string;
  title: string;
  icon?: 'FOLDER' | 'BOOK' | 'FLASK'; 
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
  CHAT = 'الدفعة',
  PROFILE = 'حسابي',
  STUDENTS = 'الطلاب',
  BATCHES = 'إدارة الدفعات',
  REQUESTS = 'طلبات الانضمام',
  COURSES = 'المواد الدراسية',
  PROJECTS = 'المشاريع',
  ASSIGNMENTS = 'الواجبات'
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

// Project Group Item Schema (Inside a Project)
export interface ProjectGroupItem {
  id: string;
  name: string;
  description?: string;
  members: string[]; // User UIDs
  leaderId?: string;
  createdAt: number;
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
