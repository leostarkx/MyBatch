import { User, UserRole, Announcement, Course, Grade, AttendanceSession, AttendanceRecord, Material, MaterialSection, ChatMessage, Notification } from '../types';

// We keep these empty arrays just to satisfy initial state if needed, 
// but the app will now fetch data from Firebase.

export const MOCK_USERS: User[] = [];
export const MOCK_NOTIFICATIONS: Notification[] = [];
export const MOCK_COURSES: Course[] = [];
export const MOCK_ANNOUNCEMENTS: Announcement[] = [];
export const MOCK_GRADES: Grade[] = [];
export const MOCK_ATTENDANCE_SESSIONS: AttendanceSession[] = [];
export const MOCK_ATTENDANCE_RECORDS: AttendanceRecord[] = [];
export const MOCK_MATERIAL_SECTIONS: MaterialSection[] = [];
export const MOCK_MATERIALS: Material[] = [];
export const MOCK_CHAT: ChatMessage[] = [];