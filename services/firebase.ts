import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { 
  getFirestore, doc, getDocFromServer, getDocs, getDoc, setDoc, 
  deleteDoc, collection, onSnapshot, query, orderBy, where
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { 
  User, UserRole, Announcement, Course, Grade, 
  AttendanceSession, AttendanceRecord, Material, 
  MaterialSection, ChatMessage, Notification,
  Batch, LectureSchedule, JoinRequest, ProjectGroup, CourseProject, Assignment
} from '../types';
import { 
  MOCK_USERS, MOCK_BATCHES
} from './mockDb';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Standard Error Handling for Firestore
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
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
    const usersSnap = await getDocs(collection(db, 'users'));
    if (usersSnap.empty) {
      console.log('Seeding initial users to Firestore...');
      for (const user of MOCK_USERS) {
        await setDoc(doc(db, 'users', user.uid), user);
      }
    }
    const batchesSnap = await getDocs(collection(db, 'batches'));
    if (batchesSnap.empty) {
      for (const b of MOCK_BATCHES) {
        await setDoc(doc(db, 'batches', b.id), b);
      }
    }
  } catch (error) {
    console.error('Error during initial Firestore seeding:', error);
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
    handleFirestoreError(error, OperationType.GET, path);
  });
}

export async function saveBatchToFirestore(batch: Batch) {
  await setDoc(doc(db, 'batches', batch.id), batch, { merge: true });
}

export async function deleteBatchFromFirestore(batchId: string) {
  await deleteDoc(doc(db, 'batches', batchId));
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
  const q = query(collection(db, 'chat_messages'), where('batchCode', '==', batchCode), orderBy('timestamp', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => doc.data() as ChatMessage);
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'chat_messages');
  });
}

export const subscribeMaterialSections = (batchCode: string, callback: (items: MaterialSection[]) => void) => 
  subscribeCollectionScoped<MaterialSection>('material_sections', batchCode, callback);

export const subscribeMaterials = (batchCode: string, callback: (items: Material[]) => void) => 
  subscribeCollectionScoped<Material>('materials', batchCode, callback);

export const subscribeJoinRequests = (batchCode: string, callback: (items: JoinRequest[]) => void) => 
  subscribeCollectionScoped<JoinRequest>('join_requests', batchCode, callback, 'timestamp');

export const subscribeProjectGroups = (batchCode: string, callback: (items: ProjectGroup[]) => void) => 
  subscribeCollectionScoped<ProjectGroup>('project_groups', batchCode, callback, 'createdAt');

export const subscribeProjects = (batchCode: string, callback: (items: CourseProject[]) => void) => 
  subscribeCollectionScoped<CourseProject>('projects', batchCode, callback, 'createdAt');

export const subscribeAssignments = (batchCode: string, callback: (items: Assignment[]) => void) => 
  subscribeCollectionScoped<Assignment>('assignments', batchCode, callback, 'dueTimestamp');

// Persistence
export async function saveProjectGroupToFirestore(item: ProjectGroup) {
  const sanitized = sanitizeForFirestore(item);
  await setDoc(doc(db, 'project_groups', item.id), sanitized);
}
export async function deleteProjectGroupFromFirestore(id: string) {
  await deleteDoc(doc(db, 'project_groups', id));
}

export async function saveProjectToFirestore(item: CourseProject) {
  const sanitized = sanitizeForFirestore(item);
  await setDoc(doc(db, 'projects', item.id), sanitized);
}
export async function deleteProjectFromFirestore(id: string) {
  await deleteDoc(doc(db, 'projects', id));
}

export async function saveAssignmentToFirestore(item: Assignment) {
  const sanitized = sanitizeForFirestore(item);
  await setDoc(doc(db, 'assignments', item.id), sanitized);
}
export async function deleteAssignmentFromFirestore(id: string) {
  await deleteDoc(doc(db, 'assignments', id));
}

export async function saveScheduleToFirestore(item: LectureSchedule) {
  const sanitized = sanitizeForFirestore(item);
  await setDoc(doc(db, 'schedules', item.id), sanitized, { merge: true });
}
export async function deleteScheduleFromFirestore(id: string) {
  await deleteDoc(doc(db, 'schedules', id));
}
export async function saveAnnouncementToFirestore(item: Announcement) {
  const sanitized = sanitizeForFirestore(item);
  await setDoc(doc(db, 'announcements', item.id), sanitized);
}
export async function deleteAnnouncementFromFirestore(id: string) {
  await deleteDoc(doc(db, 'announcements', id));
}
export async function saveCourseToFirestore(item: Course) {
  const sanitized = sanitizeForFirestore(item);
  await setDoc(doc(db, 'courses', item.id), sanitized);
}
export async function deleteCourseFromFirestore(id: string) {
  await deleteDoc(doc(db, 'courses', id));
}
export async function saveGradeToFirestore(item: Grade) {
  await setDoc(doc(db, 'grades', item.id), item);
}
export async function deleteGradeFromFirestore(id: string) {
  await deleteDoc(doc(db, 'grades', id));
}
export async function saveAttendanceSessionToFirestore(item: AttendanceSession) {
  await setDoc(doc(db, 'attendance_sessions', item.id), item);
}
export async function deleteAttendanceSessionFromFirestore(id: string) {
  await deleteDoc(doc(db, 'attendance_sessions', id));
}
export async function saveAttendanceRecordToFirestore(item: AttendanceRecord) {
  await setDoc(doc(db, 'attendance_records', item.id), item);
}
export async function saveChatMessageToFirestore(item: ChatMessage) {
  await setDoc(doc(db, 'chat_messages', item.id), item);
}
export async function deleteChatMessageFromFirestore(id: string) {
  await deleteDoc(doc(db, 'chat_messages', id));
}
export async function saveMaterialSectionToFirestore(item: MaterialSection) {
  await setDoc(doc(db, 'material_sections', item.id), item);
}
export async function deleteMaterialSectionFromFirestore(id: string) {
  await deleteDoc(doc(db, 'material_sections', id));
}
export async function saveMaterialToFirestore(item: Material) {
  await setDoc(doc(db, 'materials', item.id), item);
}
export async function deleteMaterialFromFirestore(id: string) {
  await deleteDoc(doc(db, 'materials', id));
}
export async function saveJoinRequestToFirestore(item: JoinRequest) {
  await setDoc(doc(db, 'join_requests', item.id), item);
}
export async function deleteJoinRequestFromFirestore(id: string) {
  await deleteDoc(doc(db, 'join_requests', id));
}

// Users
export function subscribeUsers(callback: (users: User[]) => void) {
  return onSnapshot(collection(db, 'users'), (snapshot) => {
    callback(snapshot.docs.map(doc => doc.data() as User));
  });
}
export async function saveUserToFirestore(user: User) {
  await setDoc(doc(db, 'users', user.uid), user, { merge: true });
}
export async function deleteUserFromFirestore(uid: string) {
  await deleteDoc(doc(db, 'users', uid));
}

// Settings
export function subscribeSettings(callback: (settings: Record<string, any>) => void) {
  return onSnapshot(collection(db, 'settings'), (snapshot) => {
    const res: Record<string, any> = {};
    snapshot.docs.forEach(d => { res[d.id] = d.data(); });
    callback(res);
  });
}
export async function saveSettingToFirestore(key: string, data: any) {
  await setDoc(doc(db, 'settings', key), data, { merge: true });
}

// Notifications
export function subscribeNotifications(userId: string, callback: (items: Notification[]) => void) {
  const q = query(collection(db, 'notifications'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => doc.data() as Notification);
    list.sort((a, b) => b.timestamp - a.timestamp);
    callback(list);
  });
}
export async function saveNotificationToFirestore(notif: Notification) {
  await setDoc(doc(db, 'notifications', notif.id), notif);
}
export async function markNotificationAsReadInFirestore(id: string) {
  await setDoc(doc(db, 'notifications', id), { isRead: true }, { merge: true });
}

export async function isUsernameTaken(username: string): Promise<boolean> {
  const q = query(collection(db, 'users'), where('username', '==', username.toLowerCase()));
  const snap = await getDocs(q);
  return !snap.empty;
}

// Auth
export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  const fbUser = result.user;
  const userRef = doc(db, 'users', fbUser.uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) return userSnap.data() as User;

  // Generate random username: student_XXXX
  let username = `student_${Math.floor(1000 + Math.random() * 9000)}`;
  let attempts = 0;
  
  while (await isUsernameTaken(username) && attempts < 10) {
    username = `student_${Math.floor(1000 + Math.random() * 9000)}`;
    attempts++;
  }

  const user: User = {
    uid: fbUser.uid,
    name: fbUser.displayName || 'طالب Google',
    email: fbUser.email || '',
    username: username,
    role: UserRole.STUDENT,
    batchCode: '',
    avatar: fbUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(fbUser.displayName || 'Google')}&background=random`,
    isOfficial: false,
    bio: 'طالب مسجل عبر Google',
    signatureColor: '#2563eb'
  };
  await saveUserToFirestore(user);
  return user;
}
export async function logoutUser() { await signOut(auth); }
