import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { 
  initializeFirestore, getFirestore, doc, getDocFromServer, getDocs, getDoc, setDoc, 
  deleteDoc, collection, onSnapshot, query, orderBy, where, writeBatch, setLogLevel,
  persistentLocalCache, persistentMultipleTabManager, limit, limitToLast
} from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';
import { setCachedDriveToken, fetchDriveAccountInfo } from './googleDrive';
import { 
  User, UserRole, Announcement, Course, Grade, 
  AttendanceSession, AttendanceRecord, Material, 
  MaterialSection, ChatMessage, Notification,
  Batch, LectureSchedule, JoinRequest, ProjectGroup, CourseProject, Assignment,
  RepresentativeCode, Exam, StudentSummary, BatchSuggestion
} from '../types';
import { 
  MOCK_USERS, MOCK_BATCHES
} from './mockDb';
import {
  saveBatchSupabase,
  deleteBatchSupabase,
  saveUserSupabase,
  deleteUserSupabase,
  saveCourseSupabase,
  deleteCourseSupabase,
  saveScheduleSupabase,
  deleteScheduleSupabase,
  saveAnnouncementSupabase,
  deleteAnnouncementSupabase,
  saveAssignmentSupabase,
  deleteAssignmentSupabase,
  saveExamSupabase,
  deleteExamSupabase,
  saveAttendanceSessionSupabase,
  deleteAttendanceSessionSupabase,
  saveAttendanceRecordSupabase,
  saveAttendanceRecordsBatchSupabase,
  deleteAttendanceRecordSupabase,
  saveGradeSupabase,
  deleteGradeSupabase,
  saveChatMessageSupabase,
  deleteChatMessageSupabase,
  saveMaterialSectionSupabase,
  deleteMaterialSectionSupabase,
  saveMaterialSupabase,
  deleteMaterialSupabase,
  saveProjectSupabase,
  deleteProjectSupabase,
  saveStudentSummarySupabase,
  deleteStudentSummarySupabase,
  saveBatchSuggestionSupabase,
  deleteBatchSuggestionSupabase,
  saveNotificationSupabase,
  deleteNotificationSupabase,
  saveJoinRequestSupabase,
  deleteJoinRequestSupabase,
  saveSettingSupabase,
  saveRepresentativeCodeSupabase,
  deleteRepresentativeCodeSupabase,
} from './supabaseService';

// Suppress noisy internal WebChannel timeout logs
try {
  setLogLevel('silent');
} catch {
  // Ignore if setLogLevel is unavailable
}

// Initialize Firebase App with multi-tab persistent IndexedDB cache
export const app = initializeApp(firebaseConfig);
export const db = (() => {
  try {
    return initializeFirestore(
      app,
      {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      },
      (firebaseConfig as any).firestoreDatabaseId
    );
  } catch (err) {
    console.warn('IndexedDB persistent cache init fallback:', err);
    return getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
  }
})();
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Validate connection to Firestore as per guidelines (using cached/non-blocking read)
async function testConnection() {
  try {
    await getDoc(doc(db, 'test', 'connection'));
  } catch {
    // Ignore transient offline/unavailable network states during initial boot
  }
}
testConnection();

export async function uploadFileToStorage(file: File, folder = 'materials'): Promise<string> {
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${folder}/${Date.now()}_${cleanName}`;
  const fileRef = storageRef(storage, path);
  const snapshot = await uploadBytes(fileRef, file);
  return await getDownloadURL(snapshot.ref);
}

// Standard Error Handling for Firestore
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export type QuotaListener = (isExceeded: boolean) => void;
const quotaListeners: Set<QuotaListener> = new Set();
let currentQuotaExceeded = false;

export function subscribeQuotaState(listener: QuotaListener) {
  quotaListeners.add(listener);
  listener(currentQuotaExceeded);
  return () => {
    quotaListeners.delete(listener);
  };
}

export function isQuotaError(error: unknown): boolean {
  const errMsg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    errMsg.includes('quota') ||
    errMsg.includes('resource-exhausted') ||
    errMsg.includes('free daily read units') ||
    errMsg.includes('quota limit exceeded')
  );
}

export function notifyQuotaExceeded() {
  currentQuotaExceeded = true;
  quotaListeners.forEach((l) => {
    try {
      l(true);
    } catch {}
  });
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  if (isQuotaError(error)) {
    notifyQuotaExceeded();
  }
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Deep sanitize data to remove any `undefined` values before writing to Firestore
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

// Initial Database Seeding
export async function seedInitialDataIfEmpty() {
  try {
    const ownerRef = doc(db, 'users', 'owner_ahmed');
    const ownerSnap = await getDoc(ownerRef);
    if (!ownerSnap.exists()) {
      await setDoc(ownerRef, { 
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
      });
    }

    // Only run mock announcement cleanup once per client instead of every reload
    const hasCleanedAnnouncements = localStorage.getItem('dafaaty_ann_cleaned_v2');
    if (!hasCleanedAnnouncements) {
      const annSnap = await getDocs(collection(db, 'announcements'));
      for (const d of annSnap.docs) {
        const data = d.data();
        if (
          d.id.startsWith('ann_rep_') ||
          d.id.startsWith('mock_') ||
          data.authorId === 'system_ahmed' ||
          data.authorId === 'rep_1' ||
          (typeof data.title === 'string' && data.title.includes('تعيين ممثل جديد للدفعة'))
        ) {
          await deleteDoc(d.ref);
        }
      }
      localStorage.setItem('dafaaty_ann_cleaned_v2', 'true');
    }
  } catch (error: any) {
    const msg = error?.message || String(error);
    if (
      error?.code === 'unavailable' ||
      msg.includes('offline') ||
      msg.includes('Could not reach Cloud Firestore')
    ) {
      console.warn('Skipping initial Firestore seed while connection is initializing.');
      return;
    }
    if (isQuotaError(error)) {
      notifyQuotaExceeded();
      console.warn('Skipping initial Firestore seed due to quota limit.');
      return;
    }
    console.warn('Initial Firestore seeding warning:', msg);
  }
}

/**
 * Completely resets and purges all test/mock data from Firestore for Production Launch.
 * Keeps only the System Owner (ahmed / ahmed0828).
 */
export async function resetEntireSystemDataToProduction(): Promise<{ success: boolean; count: number; message: string }> {
  try {
    let deletedCount = 0;
    const collectionsToPurge = [
      'announcements',
      'batches',
      'chat_messages',
      'courses',
      'grades',
      'attendance_sessions',
      'attendance_records',
      'materials',
      'material_sections',
      'schedules',
      'project_groups',
      'projects',
      'assignments',
      'join_requests',
      'representative_codes',
      'notifications',
    ];

    for (const collName of collectionsToPurge) {
      const snap = await getDocs(collection(db, collName));
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
        deletedCount++;
      }
    }

    // Clean users: delete all test users except owner_ahmed
    const usersSnap = await getDocs(collection(db, 'users'));
    for (const uDoc of usersSnap.docs) {
      const uData = uDoc.data();
      if (uDoc.id !== 'owner_ahmed' && uData.username !== 'ahmed') {
        await deleteDoc(uDoc.ref);
        deletedCount++;
      }
    }

    // Ensure pristine owner account
    const ownerRef = doc(db, 'users', 'owner_ahmed');
    await setDoc(ownerRef, {
      uid: 'owner_ahmed',
      username: 'ahmed',
      password: 'ahmed0828',
      email: 'ahmed@dafaaty.edu',
      name: 'أحمد (المطور)',
      role: UserRole.OWNER,
      isOfficial: true,
      avatar: 'https://ui-avatars.com/api/?name=Ahmed&background=2563eb&color=fff',
      bio: 'مطور النظام ومؤسس منصة دفعتي',
      signatureColor: '#2563eb',
    });

    return {
      success: true,
      count: deletedCount,
      message: `تم تصفير النظام بالكامل وحذف ${deletedCount} عنصراً وهمياً بنجاح! المنصة الآن نظيفة 100% وجاهزة للنشر.`
    };
  } catch (err: any) {
    console.error('Error resetting database to production:', err);
    return { success: false, count: 0, message: err.message || 'حدث خطأ أثناء تصفير النظام' };
  }
}

// --- Data Listeners & Actions ---

// Batches
export async function getBatchByCode(code: string): Promise<Batch | null> {
  const path = 'batches';
  const q = query(collection(db, path), where('code', '==', code.toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as Batch;
}

export function subscribeBatches(callback: (batches: Batch[]) => void) {
  const path = 'batches';
  return onSnapshot(collection(db, path), (snapshot) => {
    const list = snapshot.docs.map(doc => doc.data() as Batch);
    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    callback(list);
  }, (error) => {
    if (isQuotaError(error)) {
      notifyQuotaExceeded();
      console.warn('Firestore Quota exceeded on batches; using local cached state.');
      return;
    }
    handleFirestoreError(error, OperationType.GET, path);
  });
}

export async function saveBatchToFirestore(batch: Batch) {
  saveBatchSupabase(batch).catch((e) => console.warn('Supabase saveBatch error:', e));
  try {
    const sanitized = sanitizeForFirestore(batch);
    await setDoc(doc(db, 'batches', batch.id), sanitized, { merge: true });
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}

export async function deleteBatchFromFirestore(batchId: string) {
  deleteBatchSupabase(batchId).catch((e) => console.warn('Supabase deleteBatch error:', e));
  try {
    await deleteDoc(doc(db, 'batches', batchId));
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}

// Scoped Subscriptions
function subscribeCollectionScoped<T>(collName: string, batchCode: string, callback: (items: T[]) => void, sortField?: string) {
  if (!batchCode) {
    callback([]);
    return () => {};
  }
  const q = query(collection(db, collName), where('batchCode', '==', batchCode));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => doc.data() as T);
    if (sortField) {
      list.sort((a: any, b: any) => (b[sortField] || 0) - (a[sortField] || 0));
    }
    callback(list);
  }, (error) => {
    if (isQuotaError(error)) {
      notifyQuotaExceeded();
      console.warn(`Firestore Quota exceeded on ${collName}; using local cached state.`);
      return;
    }
    handleFirestoreError(error, OperationType.GET, collName);
  });
}

export const subscribeSchedules = (batchCode: string, callback: (items: LectureSchedule[]) => void) => 
  subscribeCollectionScoped<LectureSchedule>('schedules', batchCode, callback, 'updatedAt');

export const subscribeAnnouncements = (batchCode: string, callback: (items: Announcement[]) => void) => 
  subscribeCollectionScoped<Announcement>('announcements', batchCode, callback, 'timestamp');

export const subscribeCourses = (batchCode: string, callback: (items: Course[]) => void) => 
  subscribeCollectionScoped<Course>('courses', batchCode, callback);

export const subscribeGrades = (batchCode: string, callback: (items: Grade[]) => void) => 
  subscribeCollectionScoped<Grade>('grades', batchCode, callback, 'timestamp');

export const subscribeAttendanceSessions = (batchCode: string, callback: (items: AttendanceSession[]) => void) => 
  subscribeCollectionScoped<AttendanceSession>('attendance_sessions', batchCode, callback, 'timestamp');

export const subscribeAttendanceRecords = (batchCode: string, callback: (items: AttendanceRecord[]) => void) => 
  subscribeCollectionScoped<AttendanceRecord>('attendance_records', batchCode, callback, 'timestamp');

export function subscribeChatMessages(batchCode: string, callback: (items: ChatMessage[]) => void) {
  if (!batchCode) {
    callback([]);
    return () => {};
  }
  const q = query(
    collection(db, 'chat_messages'),
    where('batchCode', '==', batchCode),
    orderBy('timestamp', 'asc'),
    limitToLast(100)
  );
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => doc.data() as ChatMessage);
    callback(list);
  }, (error) => {
    if (isQuotaError(error)) {
      notifyQuotaExceeded();
      console.warn('Firestore Quota exceeded on chat_messages; using local cached state.');
      return;
    }
    handleFirestoreError(error, OperationType.GET, 'chat_messages');
  });
}

export const subscribeMaterialSections = (batchCode: string, callback: (items: MaterialSection[]) => void) => 
  subscribeCollectionScoped<MaterialSection>('material_sections', batchCode, callback);

export const subscribeMaterials = (batchCode: string, callback: (items: Material[]) => void) => 
  subscribeCollectionScoped<Material>('materials', batchCode, callback);

export const subscribeJoinRequests = (
  batchCode: string, 
  callback: (items: JoinRequest[]) => void, 
  isOwner?: boolean
) => {
  if (isOwner) {
    const q = query(collection(db, 'join_requests'), where('status', '==', 'PENDING'));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => doc.data() as JoinRequest);
      list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      callback(list);
    }, (error) => {
      if (isQuotaError(error)) {
        notifyQuotaExceeded();
        console.warn('Firestore Quota exceeded on join_requests; using local cached state.');
        return;
      }
      handleFirestoreError(error, OperationType.GET, 'join_requests');
    });
  }

  if (!batchCode) {
    callback([]);
    return () => {};
  }

  const cleanBatchCode = batchCode.trim().toUpperCase();
  const q = query(
    collection(db, 'join_requests'), 
    where('batchCode', '==', cleanBatchCode),
    where('status', '==', 'PENDING')
  );
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => doc.data() as JoinRequest);
    list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    callback(list);
  }, (error) => {
    if (isQuotaError(error)) {
      notifyQuotaExceeded();
      console.warn('Firestore Quota exceeded on join_requests; using local cached state.');
      return;
    }
    handleFirestoreError(error, OperationType.GET, 'join_requests');
  });
};

export const subscribeProjectGroups = (batchCode: string, callback: (items: ProjectGroup[]) => void) => 
  subscribeCollectionScoped<ProjectGroup>('project_groups', batchCode, callback, 'createdAt');

export const subscribeProjects = (batchCode: string, callback: (items: CourseProject[]) => void) => 
  subscribeCollectionScoped<CourseProject>('projects', batchCode, callback, 'createdAt');

export const subscribeAssignments = (batchCode: string, callback: (items: Assignment[]) => void) => 
  subscribeCollectionScoped<Assignment>('assignments', batchCode, callback, 'dueTimestamp');

export const subscribeExams = (batchCode: string, callback: (items: Exam[]) => void) => 
  subscribeCollectionScoped<Exam>('exams', batchCode, callback, 'examTimestamp');

export const subscribeStudentSummaries = (batchCode: string, callback: (items: StudentSummary[]) => void) => 
  subscribeCollectionScoped<StudentSummary>('student_summaries', batchCode, callback, 'createdAt');

export const subscribeBatchSuggestions = (batchCode: string, callback: (items: BatchSuggestion[]) => void) => 
  subscribeCollectionScoped<BatchSuggestion>('batch_suggestions', batchCode, callback, 'createdAt');

// Persistence
export async function saveBatchSuggestionToFirestore(item: BatchSuggestion) {
  saveBatchSuggestionSupabase(item).catch((e) => console.warn('Supabase saveSuggestion error:', e));
  try {
    const sanitized = sanitizeForFirestore(item);
    await setDoc(doc(db, 'batch_suggestions', item.id), sanitized);
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}
export async function deleteBatchSuggestionFromFirestore(id: string) {
  deleteBatchSuggestionSupabase(id).catch((e) => console.warn('Supabase deleteSuggestion error:', e));
  try {
    await deleteDoc(doc(db, 'batch_suggestions', id));
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}
export async function saveStudentSummaryToFirestore(item: StudentSummary) {
  saveStudentSummarySupabase(item).catch((e) => console.warn('Supabase saveSummary error:', e));
  try {
    const sanitized = sanitizeForFirestore(item);
    await setDoc(doc(db, 'student_summaries', item.id), sanitized);
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}
export async function deleteStudentSummaryFromFirestore(id: string) {
  deleteStudentSummarySupabase(id).catch((e) => console.warn('Supabase deleteSummary error:', e));
  try {
    await deleteDoc(doc(db, 'student_summaries', id));
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}
export async function saveExamToFirestore(item: Exam) {
  saveExamSupabase(item).catch((e) => console.warn('Supabase saveExam error:', e));
  try {
    const sanitized = sanitizeForFirestore(item);
    await setDoc(doc(db, 'exams', item.id), sanitized);
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}
export async function deleteExamFromFirestore(id: string) {
  deleteExamSupabase(id).catch((e) => console.warn('Supabase deleteExam error:', e));
  try {
    await deleteDoc(doc(db, 'exams', id));
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}
export async function saveProjectGroupToFirestore(item: ProjectGroup) {
  try {
    const sanitized = sanitizeForFirestore(item);
    await setDoc(doc(db, 'project_groups', item.id), sanitized);
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}
export async function deleteProjectGroupFromFirestore(id: string) {
  try {
    await deleteDoc(doc(db, 'project_groups', id));
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}

export async function saveProjectToFirestore(item: CourseProject) {
  saveProjectSupabase(item).catch((e) => console.warn('Supabase saveProject error:', e));
  try {
    const sanitized = sanitizeForFirestore(item);
    await setDoc(doc(db, 'projects', item.id), sanitized);
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}
export async function deleteProjectFromFirestore(id: string) {
  deleteProjectSupabase(id).catch((e) => console.warn('Supabase deleteProject error:', e));
  try {
    await deleteDoc(doc(db, 'projects', id));
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}

export async function saveAssignmentToFirestore(item: Assignment) {
  saveAssignmentSupabase(item).catch((e) => console.warn('Supabase saveAssignment error:', e));
  try {
    const sanitized = sanitizeForFirestore(item);
    await setDoc(doc(db, 'assignments', item.id), sanitized);
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}
export async function deleteAssignmentFromFirestore(id: string) {
  deleteAssignmentSupabase(id).catch((e) => console.warn('Supabase deleteAssignment error:', e));
  try {
    await deleteDoc(doc(db, 'assignments', id));
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}

export async function saveScheduleToFirestore(item: LectureSchedule) {
  saveScheduleSupabase(item).catch((e) => console.warn('Supabase saveSchedule error:', e));
  try {
    const sanitized = sanitizeForFirestore(item);
    await setDoc(doc(db, 'schedules', item.id), sanitized, { merge: true });
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}
export async function deleteScheduleFromFirestore(id: string) {
  deleteScheduleSupabase(id).catch((e) => console.warn('Supabase deleteSchedule error:', e));
  try {
    await deleteDoc(doc(db, 'schedules', id));
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}
export async function saveAnnouncementToFirestore(item: Announcement) {
  saveAnnouncementSupabase(item).catch((e) => console.warn('Supabase saveAnnouncement error:', e));
  try {
    const sanitized = sanitizeForFirestore(item);
    await setDoc(doc(db, 'announcements', item.id), sanitized);
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}
export async function deleteAnnouncementFromFirestore(id: string) {
  deleteAnnouncementSupabase(id).catch((e) => console.warn('Supabase deleteAnnouncement error:', e));
  try {
    await deleteDoc(doc(db, 'announcements', id));
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}
export async function saveCourseToFirestore(item: Course) {
  saveCourseSupabase(item).catch((e) => console.warn('Supabase saveCourse error:', e));
  try {
    const sanitized = sanitizeForFirestore(item);
    await setDoc(doc(db, 'courses', item.id), sanitized);
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}
export async function deleteCourseFromFirestore(id: string) {
  deleteCourseSupabase(id).catch((e) => console.warn('Supabase deleteCourse error:', e));
  try {
    await deleteDoc(doc(db, 'courses', id));
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}
export async function saveGradeToFirestore(item: Grade) {
  saveGradeSupabase(item).catch((e) => console.warn('Supabase saveGrade error:', e));
  try {
    const sanitized = sanitizeForFirestore(item);
    await setDoc(doc(db, 'grades', item.id), sanitized);
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}
export async function deleteGradeFromFirestore(id: string) {
  deleteGradeSupabase(id).catch((e) => console.warn('Supabase deleteGrade error:', e));
  try {
    await deleteDoc(doc(db, 'grades', id));
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}
export async function saveAttendanceSessionToFirestore(item: AttendanceSession) {
  saveAttendanceSessionSupabase(item).catch((e) => console.warn('Supabase saveAttendanceSession error:', e));
  try {
    const sanitized = sanitizeForFirestore(item);
    await setDoc(doc(db, 'attendance_sessions', item.id), sanitized);
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}
export async function deleteAttendanceSessionFromFirestore(id: string) {
  deleteAttendanceSessionSupabase(id).catch((e) => console.warn('Supabase deleteAttendanceSession error:', e));
  try {
    await deleteDoc(doc(db, 'attendance_sessions', id));
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}
export async function saveAttendanceRecordToFirestore(item: AttendanceRecord) {
  saveAttendanceRecordSupabase(item).catch((e) => console.warn('Supabase saveAttendanceRecord error:', e));
  try {
    const sanitized = sanitizeForFirestore(item);
    await setDoc(doc(db, 'attendance_records', item.id), sanitized);
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}
export async function saveAttendanceRecordsBatchToFirestore(items: AttendanceRecord[]) {
  if (!items || items.length === 0) return;
  saveAttendanceRecordsBatchSupabase(items).catch((e) => console.warn('Supabase saveAttendanceRecordsBatch error:', e));
  try {
    const batch = writeBatch(db);
    for (const item of items) {
      const sanitized = sanitizeForFirestore(item);
      batch.set(doc(db, 'attendance_records', item.id), sanitized);
    }
    await batch.commit();
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}
export async function deleteAttendanceRecordFromFirestore(id: string) {
  deleteAttendanceRecordSupabase(id).catch((e) => console.warn('Supabase deleteAttendanceRecord error:', e));
  try {
    await deleteDoc(doc(db, 'attendance_records', id));
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}
export async function saveChatMessageToFirestore(item: ChatMessage) {
  saveChatMessageSupabase(item).catch((e) => console.warn('Supabase saveChatMessage error:', e));
  try {
    const sanitized = sanitizeForFirestore(item);
    await setDoc(doc(db, 'chat_messages', item.id), sanitized);
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}
export async function deleteChatMessageFromFirestore(id: string) {
  deleteChatMessageSupabase(id).catch((e) => console.warn('Supabase deleteChatMessage error:', e));
  try {
    await deleteDoc(doc(db, 'chat_messages', id));
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}
export async function saveMaterialSectionToFirestore(item: MaterialSection) {
  saveMaterialSectionSupabase(item).catch((e) => console.warn('Supabase saveMaterialSection error:', e));
  try {
    const sanitized = sanitizeForFirestore(item);
    await setDoc(doc(db, 'material_sections', item.id), sanitized);
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}
export async function deleteMaterialSectionFromFirestore(id: string) {
  deleteMaterialSectionSupabase(id).catch((e) => console.warn('Supabase deleteMaterialSection error:', e));
  try {
    await deleteDoc(doc(db, 'material_sections', id));
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}
export async function saveMaterialToFirestore(item: Material) {
  saveMaterialSupabase(item).catch((e) => console.warn('Supabase saveMaterial error:', e));
  try {
    const sanitized = sanitizeForFirestore(item);
    await setDoc(doc(db, 'materials', item.id), sanitized);
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}
export async function deleteMaterialFromFirestore(id: string) {
  deleteMaterialSupabase(id).catch((e) => console.warn('Supabase deleteMaterial error:', e));
  try {
    await deleteDoc(doc(db, 'materials', id));
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}
export async function saveJoinRequestToFirestore(item: JoinRequest) {
  saveJoinRequestSupabase(item).catch((e) => console.warn('Supabase saveJoinRequest error:', e));
  try {
    const sanitized = sanitizeForFirestore(item);
    await setDoc(doc(db, 'join_requests', item.id), sanitized);
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}
export async function deleteJoinRequestFromFirestore(id: string) {
  deleteJoinRequestSupabase(id).catch((e) => console.warn('Supabase deleteJoinRequest error:', e));
  try {
    await deleteDoc(doc(db, 'join_requests', id));
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}

// Users
export function normalizeArabicForSort(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // إزالة التشكيل والكشيدة
    .replace(/[أإآٱ]/g, 'ا') // توحيد الألف (أ، إ، آ -> ا)
    .replace(/ى/g, 'ي') // توحيد الألف المقصورة والياء
    .replace(/ة/g, 'ه') // توحيد التاء المربوطة والهاء
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/\s+/g, ' ');
}

export function compareArabicNames(nameA?: string, nameB?: string): number {
  const normA = normalizeArabicForSort(nameA || '');
  const normB = normalizeArabicForSort(nameB || '');
  const cmp = normA.localeCompare(normB, 'ar');
  if (cmp !== 0) return cmp;
  return (nameA || '').localeCompare(nameB || '', 'ar');
}

export function sortUsersAlphabetically<T extends { name?: string }>(users: T[]): T[] {
  return [...users].sort((a, b) => compareArabicNames(a.name, b.name));
}

export function subscribeUsers(callback: (users: User[]) => void) {
  return onSnapshot(
    collection(db, 'users'),
    (snapshot) => {
      const users = snapshot.docs.map(doc => doc.data() as User);
      callback(sortUsersAlphabetically(users));
    },
    () => {}
  );
}
export async function saveUserToFirestore(user: User) {
  saveUserSupabase(user).catch((e) => console.warn('Supabase saveUser error:', e));
  try {
    const sanitized = sanitizeForFirestore(user);
    await setDoc(doc(db, 'users', user.uid), sanitized, { merge: true });
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}
export async function deleteUserFromFirestore(uid: string) {
  deleteUserSupabase(uid).catch((e) => console.warn('Supabase deleteUser error:', e));
  try {
    await deleteDoc(doc(db, 'users', uid));
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}

// Settings
export function subscribeSettings(callback: (settings: Record<string, any>) => void) {
  return onSnapshot(
    doc(db, 'settings', 'chat_settings'),
    (docSnap) => {
      const res: Record<string, any> = {};
      if (docSnap.exists()) {
        res['chat_settings'] = docSnap.data();
      }
      callback(res);
    },
    () => {}
  );
}
export async function saveSettingToFirestore(key: string, data: any) {
  saveSettingSupabase(key, data).catch((e) => console.warn('Supabase saveSetting error:', e));
  try {
    const sanitized = sanitizeForFirestore(data);
    await setDoc(doc(db, 'settings', key), sanitized, { merge: true });
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}

// Notifications
export function subscribeNotifications(userId: string, callback: (items: Notification[]) => void) {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    limit(50)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map(doc => doc.data() as Notification);
      list.sort((a, b) => b.timestamp - a.timestamp);
      callback(list);
    },
    () => {}
  );
}
export async function saveNotificationToFirestore(notif: Notification) {
  saveNotificationSupabase(notif).catch((e) => console.warn('Supabase saveNotification error:', e));
  try {
    const sanitized = sanitizeForFirestore(notif);
    await setDoc(doc(db, 'notifications', notif.id), sanitized);
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}
export async function markNotificationAsReadInFirestore(id: string) {
  try {
    await setDoc(doc(db, 'notifications', id), { isRead: true }, { merge: true });
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}
export async function deleteNotificationFromFirestore(id: string) {
  deleteNotificationSupabase(id).catch((e) => console.warn('Supabase deleteNotification error:', e));
  try {
    await deleteDoc(doc(db, 'notifications', id));
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}
export async function markAllNotificationsReadInFirestore(notifications: Notification[]) {
  const unread = notifications.filter((n) => !n.isRead);
  if (unread.length === 0) return;
  try {
    const batch = writeBatch(db);
    unread.forEach((n) => {
      batch.set(doc(db, 'notifications', n.id), { isRead: true }, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}
export async function clearAllNotificationsInFirestore(notifications: Notification[]) {
  if (notifications.length === 0) return;
  try {
    const batch = writeBatch(db);
    notifications.forEach((n) => {
      batch.delete(doc(db, 'notifications', n.id));
    });
    await batch.commit();
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}

// Representative Codes & Appointment Management
export function subscribeRepresentativeCodes(callback: (codes: RepresentativeCode[]) => void) {
  return onSnapshot(collection(db, 'representative_codes'), (snapshot) => {
    const list = snapshot.docs.map(doc => doc.data() as RepresentativeCode);
    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    callback(list);
  }, (err) => {
    console.error('Error in subscribeRepresentativeCodes:', err);
  });
}

export async function saveRepresentativeCodeToFirestore(item: RepresentativeCode) {
  saveRepresentativeCodeSupabase(item).catch((e) => console.warn('Supabase saveRepCode error:', e));
  try {
    const sanitized = sanitizeForFirestore(item);
    await setDoc(doc(db, 'representative_codes', item.id), sanitized, { merge: true });
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}

export async function deleteRepresentativeCodeFromFirestore(id: string) {
  deleteRepresentativeCodeSupabase(id).catch((e) => console.warn('Supabase deleteRepCode error:', e));
  try {
    await deleteDoc(doc(db, 'representative_codes', id));
  } catch (err) {
    if (isQuotaError(err)) notifyQuotaExceeded();
  }
}

/**
 * Transfer representation of a batch from previous representative to a new student
 */
export async function transferRepresentation(
  batchCode: string,
  newRepUid: string
): Promise<{ success: boolean; message: string }> {
  try {
    const cleanBatchCode = batchCode.trim().toUpperCase();
    const qBatch = query(collection(db, 'batches'), where('code', '==', cleanBatchCode));
    const batchSnap = await getDocs(qBatch);
    
    let batchDocId = '';
    let batchDataName = `دفعة ${cleanBatchCode}`;
    let previousRepUid = '';

    if (batchSnap.empty) {
      batchDocId = `batch_${Date.now()}`;
      await setDoc(doc(db, 'batches', batchDocId), {
        id: batchDocId,
        code: cleanBatchCode,
        name: `دفعة ${cleanBatchCode}`,
        createdAt: Date.now(),
      });
    } else {
      batchDocId = batchSnap.docs[0].id;
      const bData = batchSnap.docs[0].data() as Batch;
      batchDataName = bData.name || `دفعة ${cleanBatchCode}`;
      previousRepUid = bData.representativeUid || '';
    }

    const newUserRef = doc(db, 'users', newRepUid);
    const newUserSnap = await getDoc(newUserRef);
    if (!newUserSnap.exists()) {
      throw new Error('الطالب المختار لتعيينه ممثلاً غير موجود');
    }
    const newUserData = newUserSnap.data() as User;

    // 1. Demote old representative of this batch to STUDENT if exists and not OWNER
    if (previousRepUid && previousRepUid !== newRepUid) {
      const oldRepRef = doc(db, 'users', previousRepUid);
      const oldRepSnap = await getDoc(oldRepRef);
      if (oldRepSnap.exists()) {
        const oldData = oldRepSnap.data() as User;
        if (oldData.role !== UserRole.OWNER) {
          await setDoc(oldRepRef, { role: UserRole.STUDENT }, { merge: true });
        }
      }
    }

    // 2. Promote new user to REPRESENTATIVE
    if (newUserData.role !== UserRole.OWNER) {
      await setDoc(newUserRef, {
        role: UserRole.REPRESENTATIVE,
        batchCode: cleanBatchCode,
      }, { merge: true });
    }

    // 3. Update batch document
    await setDoc(doc(db, 'batches', batchDocId), {
      representativeUid: newRepUid,
      representativeName: newUserData.name,
    }, { merge: true });

    return { success: true, message: `تم نقل الممثلية وتعيين (${newUserData.name}) ممثلاً لدفعة [${cleanBatchCode}] بنجاح!` };
  } catch (error: any) {
    console.error('Error transferring representation:', error);
    return { success: false, message: error.message || 'حدث خطأ أثناء نقل الممثلية' };
  }
}

/**
 * Update representative code details (by developer)
 */
export async function updateRepresentativeCodeInFirestore(
  id: string,
  updates: Partial<RepresentativeCode>
) {
  const sanitized = sanitizeForFirestore(updates);
  await setDoc(doc(db, 'representative_codes', id), sanitized, { merge: true });
}

/**
 * Dismiss current representative of a batch
 */
export async function dismissRepresentative(batchCode: string): Promise<{ success: boolean; message: string }> {
  try {
    const cleanBatchCode = batchCode.trim().toUpperCase();
    const qBatch = query(collection(db, 'batches'), where('code', '==', cleanBatchCode));
    const batchSnap = await getDocs(qBatch);
    if (batchSnap.empty) throw new Error('الدفعة غير موجودة');
    const batchDoc = batchSnap.docs[0];
    const batchData = batchDoc.data() as Batch;

    if (batchData.representativeUid) {
      const oldRef = doc(db, 'users', batchData.representativeUid);
      const oldSnap = await getDoc(oldRef);
      if (oldSnap.exists()) {
        const u = oldSnap.data() as User;
        if (u.role !== UserRole.OWNER) {
          await setDoc(oldRef, { role: UserRole.STUDENT }, { merge: true });
        }
      }
    }

    await setDoc(doc(db, 'batches', batchDoc.id), {
      representativeUid: '',
      representativeName: 'لا يوجد ممثل حالياً (شاغر)',
    }, { merge: true });

    return { success: true, message: `تم إعفاء الممثل لدفعة [${cleanBatchCode}] بنجاح.` };
  } catch (error: any) {
    return { success: false, message: error.message || 'تعذر إعفاء الممثل' };
  }
}

/**
 * Redeem representative invitation code
 */
export async function redeemRepresentativeCode(
  codeString: string,
  currentUser: User
): Promise<{ success: boolean; message: string; updatedUser?: User }> {
  try {
    const cleanCode = codeString.trim().toUpperCase();
    const q = query(collection(db, 'representative_codes'), where('code', '==', cleanCode));
    const snap = await getDocs(q);

    if (snap.empty) {
      return { success: false, message: 'كود الممثل غير صالح أو غير موجود في النظام' };
    }

    const codeDoc = snap.docs[0];
    const codeData = codeDoc.data() as RepresentativeCode;

    if (codeData.isUsed) {
      return { success: false, message: `هذا الكود تم استخدامه مسبقاً بواسطة (${codeData.usedByName || 'طالب آخر'})` };
    }

    if (codeData.expiresAt && Date.now() > codeData.expiresAt) {
      return { success: false, message: 'هذا الكود منتهي الصلاحية' };
    }

    // Validate target username if specified on code
    if (codeData.targetRepUsername) {
      const cleanTargetUsername = codeData.targetRepUsername.trim().replace(/^@/, '').toLowerCase();
      const currentUsername = (currentUser.username || '').trim().replace(/^@/, '').toLowerCase();
      if (currentUsername && currentUsername !== cleanTargetUsername) {
        return {
          success: false,
          message: `عذراً، هذا الكود مخصص حصرياً للممثل صاحب الحساب (@${cleanTargetUsername}) فقط.`
        };
      }
    }

    // Appoint user
    const res = await transferRepresentation(codeData.batchCode, currentUser.uid);
    if (!res.success) {
      return res;
    }

    // Mark as used
    await setDoc(doc(db, 'representative_codes', codeDoc.id), {
      isUsed: true,
      usedByUid: currentUser.uid,
      usedByName: currentUser.name,
      usedAt: Date.now(),
    }, { merge: true });

    const updatedUser: User = {
      ...currentUser,
      role: currentUser.role === UserRole.OWNER ? UserRole.OWNER : UserRole.REPRESENTATIVE,
      batchCode: codeData.batchCode,
    };

    return {
      success: true,
      message: `مبروك! تم تفعيل رتبتك كممثل لدفعة [${codeData.batchCode}] بنجاح! 🎉`,
      updatedUser,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'حدث خطأ أثناء تفعيل الكود' };
  }
}

export async function isUsernameTaken(username: string): Promise<boolean> {
  const q = query(collection(db, 'users'), where('username', '==', username.toLowerCase()));
  const snap = await getDocs(q);
  return !snap.empty;
}

async function resolveOrCreateAppUserFromFirebaseUser(fbUser: FirebaseUser): Promise<User> {
  const fallbackUser: User = {
    uid: fbUser.uid,
    name: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'طالب Google'),
    email: fbUser.email || '',
    username: `student_${fbUser.uid.slice(0, 6).toLowerCase()}`,
    role: UserRole.STUDENT,
    batchCode: '',
    avatar:
      fbUser.photoURL ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        fbUser.displayName || 'Google'
      )}&background=random`,
    isOfficial: false,
    bio: 'طالب مسجل عبر Google',
    signatureColor: '#2563eb',
  };

  try {
    const userRef = doc(db, 'users', fbUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as User;
    }

    // Generate random username: student_XXXX
    let username = `student_${Math.floor(1000 + Math.random() * 9000)}`;
    let attempts = 0;
    try {
      while ((await isUsernameTaken(username)) && attempts < 5) {
        username = `student_${Math.floor(1000 + Math.random() * 9000)}`;
        attempts++;
      }
    } catch {
      // Ignore username uniqueness check error if offline
    }

    const newUser: User = {
      ...fallbackUser,
      username,
    };

    await saveUserToFirestore(newUser);
    return newUser;
  } catch (fsErr) {
    console.warn('Firestore read/write warning during Google login, using authenticated session:', fsErr);
    return fallbackUser;
  }
}

export async function checkGoogleRedirectResult(): Promise<User | null> {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      return await resolveOrCreateAppUserFromFirebaseUser(result.user);
    }
  } catch (err) {
    console.warn('Redirect result check error:', err);
  }
  return null;
}

// Auth
export async function loginWithGoogle(): Promise<User | null> {
  let result;
  try {
    result = await signInWithPopup(auth, googleProvider);
  } catch (err: any) {
    const code = err?.code || '';
    const msg = err?.message || '';

    if (
      code === 'auth/popup-closed-by-user' ||
      msg.includes('popup-closed-by-user') ||
      code === 'auth/cancelled-popup-request' ||
      msg.includes('cancelled-popup-request')
    ) {
      return null;
    }

    // If popup is blocked on mobile browsers or strict webviews, automatically fall back to Redirect
    if (
      code === 'auth/popup-blocked' ||
      msg.includes('popup-blocked') ||
      code === 'auth/operation-not-supported-in-this-environment'
    ) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }

    throw err;
  }

  return await resolveOrCreateAppUserFromFirebaseUser(result.user);
}
export async function logoutUser() { await signOut(auth); }
