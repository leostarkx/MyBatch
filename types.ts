// Role Definitions
export enum UserRole {
  ADMIN = 'ADMIN',
  STUDENT = 'STUDENT'
}

// App Theme Colors
export type ThemeColor = 'blue' | 'emerald' | 'violet' | 'rose' | 'amber';

// User Schema
export interface User {
  uid: string;
  username?: string; // Optional now (Official students don't need login)
  password?: string; // Optional now
  name: string;
  role: UserRole;
  studentId?: string; // Optional now
  avatar?: string;
  isOfficial?: boolean; // True if added by admin (Gradebook record), False if self-signed up (Real User)
  
  // New Profile Features
  bio?: string;
  banner?: string; // URL for profile cover
  signatureColor?: string; // Hex Code
}

// Notification Schema
export interface Notification {
  id: string;
  userId: string; // Recipient
  type: 'MENTION' | 'ANNOUNCEMENT';
  content: string;
  isRead: boolean;
  timestamp: string;
  linkTo?: string; // Context (e.g., chat)
}

// Announcement Schema
export interface Announcement {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  authorId: string;
  authorName: string;
  priority: 'normal' | 'high';
}

// Define the structure of an exam/assessment within a course
export interface AssessmentStructure {
  id: string;
  name: string; // e.g., "Midterm", "Quiz 1", "Report"
  maxScore: number; // e.g., 20, 5, 10
  date?: string; // Exam date (ISO string YYYY-MM-DD)
}

// Course Schema
export interface Course {
  id: string;
  name: string;
  professors: string[]; // Changed to array to support multiple professors
  code: string;
  assessments: AssessmentStructure[]; // Dynamic assessments
}

// Grade Schema
export interface Grade {
  id: string;
  studentId: string;
  courseId: string;
  assessmentId: string; // Links to AssessmentStructure.id
  score: number;
}

// Attendance Session (Represents a specific Class/Day)
export interface AttendanceSession {
  id: string;
  courseId: string;
  date: string; // YYYY-MM-DD
  title?: string; // e.g. "Lecture 1: Intro"
}

// Attendance Record (Links a student to a session with status)
export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  status: 'PRESENT' | 'ABSENT';
}

// Material Section Schema (New Folder Structure)
export interface MaterialSection {
  id: string;
  courseId: string;
  title: string;
  icon?: 'FOLDER' | 'BOOK' | 'FLASK'; 
}

// Material Schema
export interface Material {
  id: string;
  courseId: string;
  sectionId: string; // Linked to MaterialSection
  title: string;
  type: 'PDF' | 'IMAGE' | 'LINK';
  url: string;
  uploadDate: string;
}

// Chat Schema
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderAvatar?: string; // Snapshot of avatar at time of sending
  senderColor?: string; // Snapshot of color
  content: string;
  timestamp: string; // ISO string
  
  // Reply Feature
  replyTo?: {
    id: string;
    senderName: string;
    content: string;
  };
}

// Navigation Tabs
export enum Tab {
  HOME = 'الرئيسية',
  GRADES = 'درجاتي',
  ATTENDANCE = 'الحضور', // New Tab
  MATERIALS = 'المحاضرات',
  CHAT = 'الدفعة',
  PROFILE = 'حسابي',
  STUDENTS = 'الطلاب' // New Tab for Admin
}