import { User, UserRole, Announcement, Course, Grade, AttendanceSession, AttendanceRecord, Material, MaterialSection, ChatMessage, Notification, Batch, LectureSchedule } from '../types';

export const MOCK_USERS: User[] = [
  {
    uid: 'owner1',
    username: 'ahmed',
    password: 'ahmed0828',
    email: 'ahmed@example.com',
    name: 'أحمد (المطور)',
    role: UserRole.OWNER,
    isOfficial: true,
    avatar: 'https://ui-avatars.com/api/?name=Ahmed&background=000&color=fff',
    bio: 'مطور النظام والمسؤول التقني',
    signatureColor: '#000000'
  },
  {
    uid: 'admin1',
    username: 'admin',
    password: 'admin123',
    email: 'admin@example.com',
    name: 'المشرف العام',
    role: UserRole.ADMIN,
    batchCode: 'ENG26',
    isOfficial: true,
    avatar: 'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff',
    bio: 'مسؤول النظام',
    signatureColor: '#0ea5e9'
  },
  {
    uid: 'rep1',
    username: 'rep',
    password: 'rep123',
    email: 'rep@example.com',
    name: 'علي الكرخي (ممثل الدفعة)',
    role: UserRole.REPRESENTATIVE,
    batchCode: 'ENG26',
    isOfficial: true,
    avatar: 'https://ui-avatars.com/api/?name=Rep&background=8b5cf6&color=fff',
    bio: 'ممثل دفعة هندسة البرمجيات',
    signatureColor: '#8b5cf6'
  },
  {
    uid: 'student1',
    username: 'student',
    password: 'student123',
    email: 'student@example.com',
    name: 'أحمد محمد',
    role: UserRole.STUDENT,
    batchCode: 'ENG26',
    isOfficial: false,
    avatar: 'https://ui-avatars.com/api/?name=Ahmed+Mohamed&background=random',
    bio: 'طالب مجتهد',
    signatureColor: '#64748b'
  }
];

export const MOCK_BATCHES: Batch[] = [
  {
    id: 'batch_1',
    code: 'ENG26',
    name: 'هندسة البرمجيات - المرحلة الثالثة',
    department: 'هندسة تقنيات الحاسوب والبرمجيات',
    stage: 'المرحلة الثالثة',
    representativeUid: 'rep1',
    representativeName: 'علي الكرخي (ممثل الدفعة)',
    chatLocked: false,
    createdAt: Date.now() - 100000000
  }
];

export const MOCK_SCHEDULE: LectureSchedule[] = [
  {
    id: 'sch_1',
    batchCode: 'ENG26',
    courseId: 'math101',
    courseName: 'رياضيات 101',
    professor: 'د. علي',
    day: 'الأحد',
    startTime: '08:30 ص',
    endTime: '10:30 ص',
    hall: 'قاعة 101',
    isCancelled: false,
    note: 'الموعد المعتاد أسبوعياً',
    updatedAt: Date.now()
  },
  {
    id: 'sch_2',
    batchCode: 'ENG26',
    courseId: 'cs101',
    courseName: 'مقدمة في البرمجة',
    professor: 'د. سارة',
    day: 'الثلاثاء',
    startTime: '10:30 ص',
    endTime: '12:30 م',
    hall: 'مختبر الحاسوب 2',
    isCancelled: false,
    note: 'يرجى إحضار الحواسيب المحمولة',
    updatedAt: Date.now()
  }
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: '1',
    batchCode: 'ENG26',
    title: 'مرحباً بكم في التطبيق الجديد',
    content: 'تم إطلاق التطبيق الرسمي للدفعة. يمكنكم الآن متابعة الدرجات والحضور والجدول الدراسي من مكان واحد.',
    authorId: 'admin1',
    authorName: 'المشرف العام',
    timestamp: Date.now(),
    priority: 'high',
    attachments: []
  },
  {
    id: '2',
    batchCode: 'ENG26',
    title: 'تذكير بموعد الاختبار',
    content: 'نود تذكيركم بأن اختبار مادة الرياضيات سيكون يوم الأحد القادم.',
    authorId: 'rep1',
    authorName: 'ممثل الدفعة',
    timestamp: Date.now() - 86400000,
    priority: 'normal',
    attachments: []
  }
];

export const MOCK_COURSES: Course[] = [
  {
    id: 'math101',
    batchCode: 'ENG26',
    name: 'رياضيات 101',
    professors: ['د. علي'],
    code: 'MATH101',
    assessments: [
      { id: 'mid1', name: 'نصفي 1', maxScore: 20, date: '2023-10-15' },
      { id: 'final', name: 'نهائي', maxScore: 40, date: '2023-12-20' }
    ]
  },
  {
    id: 'cs101',
    batchCode: 'ENG26',
    name: 'مقدمة في البرمجة',
    professors: ['د. سارة'],
    code: 'CS101',
    assessments: [
      { id: 'project', name: 'مشروع', maxScore: 30, date: '2023-11-30' }
    ]
  }
];

export const MOCK_GRADES: Grade[] = [
  {
    id: 'g1',
    batchCode: 'ENG26',
    studentId: 'student1',
    courseId: 'math101',
    assessmentId: 'mid1',
    score: 18,
    timestamp: Date.now()
  }
];

export const MOCK_ATTENDANCE_SESSIONS: AttendanceSession[] = [
  {
    id: 's1',
    batchCode: 'ENG26',
    courseId: 'math101',
    date: '2023-10-01',
    title: 'محاضرة 1',
    createdBy: 'admin1',
    timestamp: Date.now()
  }
];

export const MOCK_ATTENDANCE_RECORDS: AttendanceRecord[] = [
  {
    id: 'r1',
    batchCode: 'ENG26',
    sessionId: 's1',
    studentId: 'student1',
    status: 'PRESENT',
    timestamp: Date.now()
  }
];

export const MOCK_CHAT: ChatMessage[] = [
  {
    id: 'm1',
    batchCode: 'ENG26',
    senderId: 'student1',
    senderName: 'أحمد محمد',
    senderAvatar: 'https://ui-avatars.com/api/?name=Ahmed+Mohamed&background=random',
    senderRole: UserRole.STUDENT,
    content: 'السلام عليكم، متى موعد تسليم الواجب؟',
    timestamp: Date.now() - 3600000,
    type: 'text'
  },
  {
    id: 'm2',
    batchCode: 'ENG26',
    senderId: 'rep1',
    senderName: 'ممثل الدفعة',
    senderAvatar: 'https://ui-avatars.com/api/?name=Rep&background=random',
    senderRole: UserRole.REPRESENTATIVE,
    content: 'وعليكم السلام، التسليم يوم الخميس القادم إن شاء الله.',
    timestamp: Date.now() - 3500000,
    type: 'text'
  }
];

export const MOCK_NOTIFICATIONS: Notification[] = [];
export const MOCK_MATERIAL_SECTIONS: MaterialSection[] = [];
export const MOCK_MATERIALS: Material[] = [];
