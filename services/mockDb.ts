import { User, UserRole, Announcement, Course, Grade, AttendanceSession, AttendanceRecord, Material, MaterialSection, ChatMessage, Notification, Batch, LectureSchedule } from '../types';

export const MOCK_USERS: User[] = [
  {
    uid: 'owner_ahmed',
    username: 'ahmed',
    password: 'ahmed0828',
    email: 'ahmed@dafaaty.edu',
    name: 'أحمد (المطور)',
    role: UserRole.OWNER,
    isOfficial: true,
    avatar: 'https://ui-avatars.com/api/?name=Ahmed&background=2563eb&color=fff',
    bio: 'مطور النظام ومؤسس منصة دفعتي',
    signatureColor: '#2563eb'
  }
];

export const MOCK_BATCHES: Batch[] = [];

export const MOCK_SCHEDULE: LectureSchedule[] = [];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [];

export const MOCK_COURSES: Course[] = [];

export const MOCK_GRADES: Grade[] = [];

export const MOCK_ATTENDANCE_SESSIONS: AttendanceSession[] = [];

export const MOCK_ATTENDANCE_RECORDS: AttendanceRecord[] = [];

export const MOCK_CHAT: ChatMessage[] = [];

export const MOCK_NOTIFICATIONS: Notification[] = [];
export const MOCK_MATERIAL_SECTIONS: MaterialSection[] = [];
export const MOCK_MATERIALS: Material[] = [];

