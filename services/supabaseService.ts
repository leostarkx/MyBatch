import { createClient } from '@supabase/supabase-js';
import supabaseConfig from '../supabase-config.json';
import {
  User,
  Batch,
  Course,
  LectureSchedule,
  Announcement,
  Assignment,
  Exam,
  AttendanceSession,
  AttendanceRecord,
  Grade,
  ChatMessage,
  MaterialSection,
  Material,
  CourseProject,
  StudentSummary,
  BatchSuggestion,
  Notification,
  JoinRequest,
  RepresentativeCode,
} from '../types';

export const supabase = createClient(
  supabaseConfig.supabaseUrl,
  supabaseConfig.supabaseAnonKey
);

// Track missing tables to warn gently once without spamming red console errors
const warnedTables = new Set<string>();

export function logSupabaseError(action: string, error: any) {
  if (!error) return;
  const errMsg = typeof error === 'string' ? error : (error.message || '');
  const code = error.code || '';
  if (code === 'PGRST205' || errMsg.includes('schema cache')) {
    const tableMatch = errMsg.match(/'public\.([^']+)'/);
    const tableName = tableMatch ? tableMatch[1] : 'table';
    if (!warnedTables.has(tableName)) {
      warnedTables.add(tableName);
      console.warn(`[Supabase Note] Table "${tableName}" does not exist in Supabase yet. Changes are safely preserved. To enable it in Supabase, execute the SQL script in Supabase SQL editor.`);
    }
    return;
  }
  console.warn(`Supabase notice while ${action}:`, errMsg || error);
}

// Local notifications cache for fallback when Supabase table is pending creation
function getLocalNotifications(userId: string): Notification[] {
  try {
    const raw = localStorage.getItem(`dafaaty_notifs_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalNotification(item: Notification) {
  try {
    const existing = getLocalNotifications(item.userId);
    const filtered = existing.filter((n) => n.id !== item.id);
    const updated = [item, ...filtered].slice(0, 50);
    localStorage.setItem(`dafaaty_notifs_${item.userId}`, JSON.stringify(updated));
  } catch {}
}

function markLocalNotificationRead(id: string) {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('dafaaty_notifs_')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const items: Notification[] = JSON.parse(raw);
          let changed = false;
          items.forEach((n) => {
            if (n.id === id) {
              n.isRead = true;
              changed = true;
            }
          });
          if (changed) {
            localStorage.setItem(key, JSON.stringify(items));
          }
        }
      }
    }
  } catch {}
}

function deleteLocalNotification(id: string) {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('dafaaty_notifs_')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const items: Notification[] = JSON.parse(raw);
          const filtered = items.filter((n) => n.id !== id);
          if (filtered.length !== items.length) {
            localStorage.setItem(key, JSON.stringify(filtered));
          }
        }
      }
    }
  } catch {}
}

// --- Batches ---
export async function getBatchesSupabase(): Promise<Batch[]> {
  const { data, error } = await supabase
    .from('batches')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('Error fetching batches from Supabase:', error);
    return [];
  }
  return (data || []).map((b) => ({
    id: b.id,
    code: b.code,
    name: b.name,
    department: b.department || undefined,
    stage: b.stage || undefined,
    representativeUid: b.representative_uid || undefined,
    representativeName: b.representative_name || undefined,
    chatLocked: Boolean(b.chat_locked),
    academicGroups: b.academic_groups || undefined,
    createdAt: Number(b.created_at),
  }));
}

export async function saveBatchSupabase(batch: Batch): Promise<void> {
  const { error } = await supabase.from('batches').upsert({
    id: batch.id,
    code: batch.code,
    name: batch.name,
    department: batch.department,
    stage: batch.stage,
    representative_uid: batch.representativeUid,
    representative_name: batch.representativeName,
    chat_locked: batch.chatLocked,
    academic_groups: batch.academicGroups,
    created_at: batch.createdAt || Date.now(),
  });
  if (error) console.error('Error saving batch to Supabase:', error);
}

export async function deleteBatchSupabase(batchId: string): Promise<void> {
  const { error } = await supabase.from('batches').delete().eq('id', batchId);
  if (error) console.error('Error deleting batch from Supabase:', error);
}

// --- Users ---
export async function getUsersSupabase(batchCode?: string): Promise<User[]> {
  let query = supabase.from('users').select('*');
  if (batchCode) {
    query = query.or(`batch_code.eq.${batchCode},is_official.eq.true,role.eq.OWNER`);
  }
  const { data, error } = await query;
  if (error) {
    console.warn('Error fetching users from Supabase:', error);
    return [];
  }
  return (data || []).map((u) => ({
    uid: u.uid,
    username: u.username || undefined,
    password: u.password || undefined,
    email: u.email || undefined,
    name: u.name,
    role: u.role,
    studentId: u.student_id || undefined,
    batchCode: u.batch_code || undefined,
    pendingBatchCode: u.pending_batch_code || undefined,
    academicGroup: u.academic_group || undefined,
    avatar: u.avatar || undefined,
    isOfficial: Boolean(u.is_official),
    excludeFromStats: Boolean(u.exclude_from_stats),
    bio: u.bio || undefined,
    banner: u.banner || undefined,
    signatureColor: u.signature_color || undefined,
    studiedMaterialIds: u.studied_material_ids || [],
    bookmarkedMaterialIds: u.bookmarked_material_ids || [],
    notificationPrefs: u.notification_prefs || undefined,
    assistantDuties: u.assistant_duties || undefined,
    academicPoints: Number(u.academic_points || 0),
  }));
}

export async function saveUserSupabase(user: User): Promise<void> {
  const { error } = await supabase.from('users').upsert({
    uid: user.uid,
    username: user.username,
    password: user.password,
    email: user.email,
    name: user.name,
    role: user.role,
    student_id: user.studentId,
    batch_code: user.batchCode,
    pending_batch_code: user.pendingBatchCode,
    academic_group: user.academicGroup,
    avatar: user.avatar,
    is_official: user.isOfficial,
    exclude_from_stats: user.excludeFromStats,
    bio: user.bio,
    banner: user.banner,
    signature_color: user.signatureColor,
    studied_material_ids: user.studiedMaterialIds,
    bookmarked_material_ids: user.bookmarkedMaterialIds,
    notification_prefs: user.notificationPrefs,
    assistant_duties: user.assistantDuties,
    academic_points: user.academicPoints || 0,
  });
  if (error) logSupabaseError('saving user', error);
}

export async function deleteUserSupabase(uid: string): Promise<void> {
  const { error } = await supabase.from('users').delete().eq('uid', uid);
  if (error) console.error('Error deleting user from Supabase:', error);
}

// --- Announcements ---
export async function getAnnouncementsSupabase(batchCode: string): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('batch_code', batchCode)
    .order('timestamp', { ascending: false });
  if (error) return [];
  return (data || []).map((a) => ({
    id: a.id,
    batchCode: a.batch_code,
    title: a.title,
    content: a.content,
    timestamp: Number(a.timestamp),
    authorId: a.author_id,
    authorName: a.author_name,
    priority: (a.priority === 'high' ? 'high' : 'normal') as 'normal' | 'high',
    isPinned: Boolean(a.is_pinned),
    poll: a.poll || undefined,
    attachments: a.attachments || undefined,
  }));
}

export async function saveAnnouncementSupabase(item: Announcement): Promise<void> {
  const { error } = await supabase.from('announcements').upsert({
    id: item.id,
    batch_code: item.batchCode,
    title: item.title,
    content: item.content,
    author_id: item.authorId,
    author_name: item.authorName,
    priority: item.priority,
    is_pinned: Boolean(item.isPinned),
    poll: item.poll,
    attachments: item.attachments,
    timestamp: item.timestamp,
  });
  if (error) console.error('Error saving announcement to Supabase:', error);
}

export async function deleteAnnouncementSupabase(id: string): Promise<void> {
  await supabase.from('announcements').delete().eq('id', id);
}

// --- Courses ---
export async function getCoursesSupabase(batchCode: string): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('batch_code', batchCode);
  if (error) return [];
  return (data || []).map((c) => ({
    id: c.id,
    batchCode: c.batch_code,
    name: c.name,
    professors: c.professors || [],
    code: c.code || undefined,
    cumulativeMaxScore: 50,
    finalExamMaxScore: 50,
    assessments: c.assessment_structure && Array.isArray(c.assessment_structure) ? c.assessment_structure : [],
  }));
}

export async function saveCourseSupabase(item: Course): Promise<void> {
  const { error } = await supabase.from('courses').upsert({
    id: item.id,
    batch_code: item.batchCode,
    name: item.name,
    professors: item.professors,
    code: item.code,
    assessment_structure: item.assessments || [],
  });
  if (error) console.error('Error saving course to Supabase:', error);
}

export async function deleteCourseSupabase(id: string): Promise<void> {
  await supabase.from('courses').delete().eq('id', id);
}

// --- Schedules ---
export async function getSchedulesSupabase(batchCode: string): Promise<LectureSchedule[]> {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('batch_code', batchCode)
    .order('updated_at', { ascending: false });
  if (error) return [];
  return (data || []).map((s) => ({
    id: s.id,
    batchCode: s.batch_code,
    courseId: s.course_id || undefined,
    courseName: s.course_name,
    professor: s.professor || undefined,
    day: s.day,
    date: s.date || undefined,
    startTime: s.start_time,
    endTime: s.end_time,
    hall: s.location || 'قاعة المحاضرات',
    lectureType: (s.type === 'PRACTICAL' ? 'PRACTICAL' : 'THEORY') as 'THEORY' | 'PRACTICAL',
    targetGroup: s.target_group || undefined,
    note: s.notes || undefined,
    isCancelled: Boolean(s.is_cancelled),
    updatedAt: Number(s.updated_at),
  }));
}

export async function saveScheduleSupabase(item: LectureSchedule): Promise<void> {
  const { error } = await supabase.from('schedules').upsert({
    id: item.id,
    batch_code: item.batchCode,
    course_id: item.courseId,
    course_name: item.courseName,
    professor: item.professor,
    day: item.day,
    date: item.date,
    start_time: item.startTime,
    end_time: item.endTime,
    location: item.hall,
    type: item.lectureType,
    target_group: item.targetGroup,
    notes: item.note,
    is_cancelled: Boolean(item.isCancelled),
    updated_at: item.updatedAt || Date.now(),
  });
  if (error) console.error('Error saving schedule to Supabase:', error);
}

export async function deleteScheduleSupabase(id: string): Promise<void> {
  await supabase.from('schedules').delete().eq('id', id);
}

// --- Assignments ---
export async function getAssignmentsSupabase(batchCode: string): Promise<Assignment[]> {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('batch_code', batchCode)
    .order('due_timestamp', { ascending: true });
  if (error) return [];
  return (data || []).map((a) => ({
    id: a.id,
    batchCode: a.batch_code,
    title: a.title,
    courseId: a.course_id || '',
    courseName: a.course_name || '',
    description: a.description || undefined,
    dueDate: a.due_date,
    dueTimestamp: Number(a.due_timestamp),
    completedBy: a.completed_by || [],
    attachments: a.attachments || [],
    createdAt: Number(a.created_at),
  }));
}

export async function saveAssignmentSupabase(item: Assignment): Promise<void> {
  const { error } = await supabase.from('assignments').upsert({
    id: item.id,
    batch_code: item.batchCode,
    course_id: item.courseId,
    course_name: item.courseName,
    title: item.title,
    description: item.description,
    due_date: item.dueDate,
    due_timestamp: item.dueTimestamp,
    completed_by: item.completedBy,
    attachments: item.attachments,
    created_at: item.createdAt || Date.now(),
  });
  if (error) console.error('Error saving assignment to Supabase:', error);
}

export async function deleteAssignmentSupabase(id: string): Promise<void> {
  await supabase.from('assignments').delete().eq('id', id);
}

// --- Exams ---
export async function getExamsSupabase(batchCode: string): Promise<Exam[]> {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('batch_code', batchCode)
    .order('exam_timestamp', { ascending: true });
  if (error) return [];
  return (data || []).map((e) => {
    let cleanNotes = e.notes || undefined;
    let maxScore = 10;
    let isResultsPublished = false;
    if (e.notes && e.notes.includes('__MAXSCORE:')) {
      const matchMax = e.notes.match(/__MAXSCORE:(\d+(\.\d+)?)__/);
      if (matchMax) maxScore = Number(matchMax[1]);
      const matchPub = e.notes.match(/__PUBLISHED:(true|false)__/);
      if (matchPub) isResultsPublished = matchPub[1] === 'true';
      cleanNotes = e.notes.replace(/__MAXSCORE:.*?__PUBLISHED:.*?__\n?/, '').trim() || undefined;
    }
    return {
      id: e.id,
      batchCode: e.batch_code,
      title: e.title,
      courseId: e.course_id || '',
      courseName: e.course_name || '',
      examDate: e.exam_date,
      examTimestamp: Number(e.exam_timestamp),
      hall: e.location || undefined,
      topics: e.material_covered || undefined,
      type: (e.type || 'QUIZ') as any,
      notes: cleanNotes,
      maxScore,
      isResultsPublished,
      createdAt: Number(e.created_at),
    };
  });
}

export async function saveExamSupabase(item: Exam): Promise<void> {
  let notesPayload = item.notes || '';
  if (item.maxScore !== undefined || item.isResultsPublished !== undefined) {
    const metaTag = `__MAXSCORE:${item.maxScore ?? 10}____PUBLISHED:${item.isResultsPublished ? 'true' : 'false'}__`;
    if (!notesPayload.includes('__MAXSCORE:')) {
      notesPayload = metaTag + (notesPayload ? '\n' + notesPayload : '');
    } else {
      notesPayload = notesPayload.replace(/__MAXSCORE:.*?__PUBLISHED:.*?__/, metaTag);
    }
  }

  const { error } = await supabase.from('exams').upsert({
    id: item.id,
    batch_code: item.batchCode,
    course_id: item.courseId,
    course_name: item.courseName,
    title: item.title,
    type: item.type,
    exam_date: item.examDate,
    exam_timestamp: item.examTimestamp,
    location: item.hall,
    material_covered: item.topics,
    notes: notesPayload || item.notes,
    created_at: item.createdAt || Date.now(),
  });
  if (error) console.error('Error saving exam to Supabase:', error);
}

export async function deleteExamSupabase(id: string): Promise<void> {
  await supabase.from('exams').delete().eq('id', id);
}

// --- Chat Messages ---
export async function getChatMessagesSupabase(batchCode: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('batch_code', batchCode)
    .order('timestamp', { ascending: true })
    .limit(100);
  if (error) return [];
  return (data || []).map((m) => ({
    id: m.id,
    batchCode: m.batch_code,
    senderId: m.sender_id,
    senderName: m.sender_name,
    senderRole: m.sender_role,
    senderAvatar: m.sender_avatar || undefined,
    senderColor: m.sender_color || undefined,
    content: m.content,
    type: m.type as any,
    mediaUrl: m.media_url || undefined,
    expiresAt: m.expires_at ? Number(m.expires_at) : undefined,
    replyTo: m.reply_to,
    timestamp: Number(m.timestamp),
  }));
}

export async function saveChatMessageSupabase(item: ChatMessage): Promise<void> {
  const { error } = await supabase.from('chat_messages').upsert({
    id: item.id,
    batch_code: item.batchCode,
    sender_id: item.senderId,
    sender_name: item.senderName,
    sender_role: item.senderRole,
    sender_avatar: item.senderAvatar,
    sender_color: item.senderColor,
    content: item.content,
    type: item.type,
    media_url: item.mediaUrl,
    expires_at: item.expiresAt,
    reply_to: item.replyTo,
    timestamp: item.timestamp,
  });
  if (error) console.error('Error saving chat message to Supabase:', error);
}

export async function deleteChatMessageSupabase(id: string): Promise<void> {
  await supabase.from('chat_messages').delete().eq('id', id);
}

// --- Attendance Sessions & Records ---
export async function getAttendanceSessionsSupabase(batchCode: string): Promise<AttendanceSession[]> {
  const { data, error } = await supabase
    .from('attendance_sessions')
    .select('*')
    .eq('batch_code', batchCode)
    .order('timestamp', { ascending: false });
  if (error) return [];
  return (data || []).map((s) => ({
    id: s.id,
    batchCode: s.batch_code,
    courseId: s.course_id,
    courseName: s.course_name || undefined,
    title: s.title || undefined,
    date: s.date,
    targetGroup: s.target_group || undefined,
    lectureType: (s.type === 'PRACTICAL' ? 'PRACTICAL' : 'THEORY') as 'THEORY' | 'PRACTICAL',
    timestamp: Number(s.timestamp),
  }));
}

export async function saveAttendanceSessionSupabase(item: AttendanceSession): Promise<void> {
  const { error } = await supabase.from('attendance_sessions').upsert({
    id: item.id,
    batch_code: item.batchCode,
    course_id: item.courseId,
    course_name: item.courseName,
    title: item.title,
    date: item.date,
    target_group: item.targetGroup,
    type: item.lectureType,
    timestamp: item.timestamp,
  });
  if (error) console.error('Error saving attendance session to Supabase:', error);
}

export async function deleteAttendanceSessionSupabase(id: string): Promise<void> {
  await supabase.from('attendance_sessions').delete().eq('id', id);
}

export async function getAttendanceRecordsSupabase(batchCode: string): Promise<AttendanceRecord[]> {
  let allRows: any[] = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('batch_code', batchCode)
      .order('timestamp', { ascending: false })
      .range(from, from + pageSize - 1);
    if (error || !data || data.length === 0) break;
    allRows = allRows.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return allRows.map((r) => ({
    id: r.id,
    batchCode: r.batch_code,
    sessionId: r.session_id,
    studentId: r.student_id,
    status: r.status,
    isException: Boolean(r.is_exception),
    originalGroup: r.original_group || undefined,
    swappedWithStudentId: r.swapped_with_student_id || undefined,
    swappedWithStudentName: r.swapped_with_student_name || undefined,
    exceptionNote: r.exception_note || undefined,
    timestamp: Number(r.timestamp),
  }));
}

export async function saveAttendanceRecordSupabase(item: AttendanceRecord): Promise<void> {
  const { error } = await supabase.from('attendance_records').upsert({
    id: item.id,
    batch_code: item.batchCode,
    session_id: item.sessionId,
    student_id: item.studentId,
    status: item.status,
    is_exception: item.isException,
    original_group: item.originalGroup,
    swapped_with_student_id: item.swappedWithStudentId,
    swapped_with_student_name: item.swappedWithStudentName,
    exception_note: item.exceptionNote,
    timestamp: item.timestamp,
  });
  if (error) console.error('Error saving attendance record to Supabase:', error);
}

export async function saveAttendanceRecordsBatchSupabase(items: AttendanceRecord[]): Promise<void> {
  if (!items || items.length === 0) return;
  const rows = items.map((item) => ({
    id: item.id,
    batch_code: item.batchCode,
    session_id: item.sessionId,
    student_id: item.studentId,
    status: item.status,
    is_exception: item.isException,
    original_group: item.originalGroup,
    swapped_with_student_id: item.swappedWithStudentId,
    swapped_with_student_name: item.swappedWithStudentName,
    exception_note: item.exceptionNote,
    timestamp: item.timestamp,
  }));
  const { error } = await supabase.from('attendance_records').upsert(rows);
  if (error) console.error('Error saving attendance records batch to Supabase:', error);
}

export async function deleteAttendanceRecordSupabase(id: string): Promise<void> {
  await supabase.from('attendance_records').delete().eq('id', id);
}

// --- Grades ---
export async function getGradesSupabase(batchCode: string): Promise<Grade[]> {
  const { data, error } = await supabase
    .from('grades')
    .select('*')
    .eq('batch_code', batchCode)
    .order('timestamp', { ascending: false });
  if (error) return [];
  return (data || []).map((g) => ({
    id: g.id,
    batchCode: g.batch_code,
    courseId: g.course_id,
    studentId: g.student_id,
    assessmentId: g.assessment_id,
    score: Number(g.score),
    timestamp: Number(g.timestamp),
  }));
}

export async function saveGradeSupabase(item: Grade): Promise<void> {
  const { error } = await supabase.from('grades').upsert({
    id: item.id,
    batch_code: item.batchCode,
    course_id: item.courseId,
    student_id: item.studentId,
    assessment_id: item.assessmentId,
    score: item.score,
    timestamp: item.timestamp,
  });
  if (error) console.error('Error saving grade to Supabase:', error);
}

export async function deleteGradeSupabase(id: string): Promise<void> {
  await supabase.from('grades').delete().eq('id', id);
}

// --- Material Sections & Materials ---
export async function getMaterialSectionsSupabase(batchCode: string): Promise<MaterialSection[]> {
  const { data, error } = await supabase
    .from('material_sections')
    .select('*')
    .eq('batch_code', batchCode)
    .order('created_at', { ascending: true });
  if (error) return [];
  return (data || []).map((s) => ({
    id: s.id,
    batchCode: s.batch_code,
    courseId: s.course_id,
    title: s.title,
    icon: s.icon,
    category: s.category,
  }));
}

export async function saveMaterialSectionSupabase(item: MaterialSection): Promise<void> {
  const { error } = await supabase.from('material_sections').upsert({
    id: item.id,
    batch_code: item.batchCode,
    course_id: item.courseId,
    title: item.title,
    icon: item.icon || 'FOLDER',
    category: item.category || 'LECTURES',
    created_at: Date.now(),
  });
  if (error) console.error('Error saving material section to Supabase:', error);
}

export async function deleteMaterialSectionSupabase(id: string): Promise<void> {
  await supabase.from('material_sections').delete().eq('id', id);
}

export async function getMaterialsSupabase(batchCode: string): Promise<Material[]> {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('batch_code', batchCode)
    .order('timestamp', { ascending: false });
  if (error) return [];
  return (data || []).map((m) => ({
    id: m.id,
    batchCode: m.batch_code,
    courseId: m.course_id,
    sectionId: m.section_id,
    title: m.title,
    type: m.file_type as any,
    url: m.url,
    uploadDate: m.date || new Date(Number(m.timestamp)).toLocaleDateString('ar-IQ'),
    fileName: m.title,
    driveFileId: m.drive_file_id || undefined,
    fileSize: m.size || undefined,
  }));
}

export async function saveMaterialSupabase(item: Material): Promise<void> {
  const { error } = await supabase.from('materials').upsert({
    id: item.id,
    batch_code: item.batchCode,
    course_id: item.courseId,
    section_id: item.sectionId,
    title: item.title,
    file_type: item.type,
    size: item.fileSize,
    url: item.url,
    drive_file_id: item.driveFileId,
    uploaded_by: 'الممثل',
    date: item.uploadDate,
    timestamp: Date.now(),
  });
  if (error) console.error('Error saving material to Supabase:', error);
}

export async function deleteMaterialSupabase(id: string): Promise<void> {
  await supabase.from('materials').delete().eq('id', id);
}

// --- Projects & Project Groups ---
export async function getProjectsSupabase(batchCode: string): Promise<CourseProject[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('batch_code', batchCode)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map((p) => ({
    id: p.id,
    batchCode: p.batch_code,
    courseId: p.course_id || '',
    courseName: p.course_name,
    title: p.title,
    description: p.description || undefined,
    deadline: p.deadline || undefined,
    groups: p.groups || [],
    createdAt: Number(p.created_at),
  }));
}

export async function saveProjectSupabase(item: CourseProject): Promise<void> {
  const { error } = await supabase.from('projects').upsert({
    id: item.id,
    batch_code: item.batchCode,
    course_id: item.courseId,
    course_name: item.courseName,
    title: item.title,
    description: item.description,
    deadline: item.deadline,
    groups: item.groups || [],
    created_at: item.createdAt || Date.now(),
  });
  if (error) console.error('Error saving project to Supabase:', error);
}

export async function deleteProjectSupabase(id: string): Promise<void> {
  await supabase.from('projects').delete().eq('id', id);
}

// --- Student Summaries ---
export async function getStudentSummariesSupabase(batchCode: string): Promise<StudentSummary[]> {
  const { data, error } = await supabase
    .from('student_summaries')
    .select('*')
    .eq('batch_code', batchCode)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map((s) => ({
    id: s.id,
    batchCode: s.batch_code,
    authorUid: s.author_id,
    authorName: s.author_name,
    authorAvatar: s.author_avatar || undefined,
    courseId: s.course_id,
    courseName: s.course_name,
    category: 'SUMMARY',
    title: s.title,
    content: s.content || undefined,
    attachments: s.attachments || [],
    likes: s.liked_by || [],
    createdAt: Number(s.created_at),
  }));
}

export async function saveStudentSummarySupabase(item: StudentSummary): Promise<void> {
  const { error } = await supabase.from('student_summaries').upsert({
    id: item.id,
    batch_code: item.batchCode,
    author_id: item.authorUid,
    author_name: item.authorName,
    author_avatar: item.authorAvatar,
    course_id: item.courseId,
    course_name: item.courseName,
    title: item.title,
    content: item.content,
    attachments: item.attachments || [],
    likes: item.likes?.length || 0,
    liked_by: item.likes || [],
    created_at: item.createdAt || Date.now(),
  });
  if (error) console.error('Error saving summary to Supabase:', error);
}

export async function deleteStudentSummarySupabase(id: string): Promise<void> {
  await supabase.from('student_summaries').delete().eq('id', id);
}

// --- Batch Suggestions ---
export async function getBatchSuggestionsSupabase(batchCode: string): Promise<BatchSuggestion[]> {
  const { data, error } = await supabase
    .from('batch_suggestions')
    .select('*')
    .eq('batch_code', batchCode)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map((s) => ({
    id: s.id,
    batchCode: s.batch_code,
    category: 'SUGGESTION',
    title: s.content.slice(0, 30),
    content: s.content,
    isAnonymous: Boolean(s.is_anonymous),
    authorUid: s.author_id || '',
    authorName: s.author_name,
    authorAvatar: s.author_avatar || undefined,
    upvotes: s.upvoted_by || [],
    downvotes: [],
    status: (s.status as any) || 'OPEN',
    repReply: s.rep_reply || undefined,
    repReplyAt: s.rep_reply_at ? Number(s.rep_reply_at) : undefined,
    createdAt: Number(s.created_at),
  }));
}

export async function saveBatchSuggestionSupabase(item: BatchSuggestion): Promise<void> {
  const { error } = await supabase.from('batch_suggestions').upsert({
    id: item.id,
    batch_code: item.batchCode,
    author_id: item.authorUid,
    author_name: item.authorName,
    author_avatar: item.authorAvatar,
    is_anonymous: item.isAnonymous,
    content: item.content,
    status: item.status,
    rep_reply: item.repReply,
    rep_reply_at: item.repReplyAt,
    upvotes: item.upvotes?.length || 0,
    upvoted_by: item.upvotes || [],
    created_at: item.createdAt || Date.now(),
  });
  if (error) logSupabaseError('saving suggestion', error);
}

export async function deleteBatchSuggestionSupabase(id: string): Promise<void> {
  await supabase.from('batch_suggestions').delete().eq('id', id);
}

// --- Notifications ---
export async function getNotificationsSupabase(userId: string): Promise<Notification[]> {
  const localItems = getLocalNotifications(userId);
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(50);
    if (error) {
      logSupabaseError('fetching notifications', error);
      return localItems;
    }
    const remoteList = (data || []).map((n) => ({
      id: n.id,
      userId: n.user_id,
      batchCode: n.batch_code || undefined,
      type: n.type as any,
      title: n.title,
      content: n.content,
      isRead: Boolean(n.is_read),
      targetTab: n.target_tab as any,
      timestamp: Number(n.timestamp),
    }));

    // Merge remote and local notifications
    const map = new Map<string, Notification>();
    remoteList.forEach((n) => map.set(n.id, n));
    localItems.forEach((n) => {
      if (!map.has(n.id)) map.set(n.id, n);
    });
    return Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
  } catch (err) {
    return localItems;
  }
}

export async function saveNotificationSupabase(item: Notification): Promise<void> {
  // Always persist locally so student/user never misses alerts even if table is not in Supabase yet
  saveLocalNotification(item);
  try {
    const { error } = await supabase.from('notifications').upsert({
      id: item.id,
      user_id: item.userId,
      batch_code: item.batchCode,
      type: item.type,
      title: item.title || '',
      content: item.content,
      is_read: item.isRead,
      target_tab: item.targetTab,
      timestamp: item.timestamp,
    });
    if (error) {
      logSupabaseError('saving notification', error);
    }
  } catch (err) {
    logSupabaseError('saving notification', err);
  }
}

export async function markNotificationReadSupabase(id: string): Promise<void> {
  markLocalNotificationRead(id);
  try {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (error) logSupabaseError('marking notification read', error);
  } catch (err) {
    logSupabaseError('marking notification read', err);
  }
}

export async function deleteNotificationSupabase(id: string): Promise<void> {
  deleteLocalNotification(id);
  try {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) logSupabaseError('deleting notification', error);
  } catch (err) {
    logSupabaseError('deleting notification', err);
  }
}

// --- Join Requests ---
export async function getJoinRequestsSupabase(batchCode?: string): Promise<JoinRequest[]> {
  const itemsFromTable: JoinRequest[] = [];
  try {
    let q = supabase.from('join_requests').select('*');
    if (batchCode) {
      q = q.eq('batch_code', batchCode);
    }
    const { data, error } = await q.order('timestamp', { ascending: false });
    if (!error && data && data.length > 0) {
      data.forEach((j) => {
        itemsFromTable.push({
          id: j.id,
          userId: j.user_uid,
          userName: j.user_name,
          userEmail: j.user_email || '',
          userAvatar: j.user_avatar || undefined,
          batchCode: j.batch_code,
          status: (j.status || 'PENDING') as any,
          timestamp: Number(j.timestamp || Date.now()),
        });
      });
    }
  } catch {
    // Graceful table schema fallback
  }

  // Also query users table for pending join requests (bulletproof fallback when join_requests table is missing)
  try {
    let uQuery = supabase
      .from('users')
      .select('*')
      .not('pending_batch_code', 'is', null)
      .neq('pending_batch_code', '');

    if (batchCode) {
      uQuery = uQuery.eq('pending_batch_code', batchCode);
    }

    const { data: pendingUsers, error: uErr } = await uQuery;
    if (!uErr && pendingUsers && pendingUsers.length > 0) {
      const userReqs: JoinRequest[] = pendingUsers
        .filter((u: any) => !u.batch_code || u.batch_code !== u.pending_batch_code)
        .map((u: any) => ({
          id: `req_${u.uid}`,
          userId: u.uid,
          userName: u.name,
          userEmail: u.email || '',
          userAvatar: u.avatar || undefined,
          batchCode: u.pending_batch_code,
          status: 'PENDING' as const,
          timestamp: Number(u.created_at || Date.now()),
        }));

      // Combine requests, avoiding duplicates by userId
      const seenUserIds = new Set<string>();
      const combined: JoinRequest[] = [];
      for (const r of [...itemsFromTable, ...userReqs]) {
        if (!seenUserIds.has(r.userId)) {
          seenUserIds.add(r.userId);
          combined.push(r);
        }
      }
      return combined.sort((a, b) => b.timestamp - a.timestamp);
    }
  } catch (err) {
    console.warn('Error fetching pending users fallback:', err);
  }

  return itemsFromTable;
}

export async function saveJoinRequestSupabase(item: JoinRequest): Promise<void> {
  // 1. Always update pending_batch_code on users table to ensure persistence across devices & tables
  try {
    await supabase.from('users').update({
      pending_batch_code: item.batchCode,
      batch_code: '', // Ensure student cannot enter batch until approved
    }).eq('uid', item.userId);
  } catch (err) {
    console.warn('Error updating pending_batch_code on user:', err);
  }

  // 2. Also try upserting to join_requests table if present
  try {
    const { error } = await supabase.from('join_requests').upsert({
      id: item.id,
      user_uid: item.userId,
      user_name: item.userName,
      user_avatar: item.userAvatar,
      user_email: item.userEmail,
      batch_code: item.batchCode,
      status: item.status,
      timestamp: item.timestamp,
    });
    if (error && error.code !== 'PGRST205') {
      logSupabaseError('saving join request', error);
    }
  } catch {
    // Handled gracefully
  }
}

export async function deleteJoinRequestSupabase(id: string): Promise<void> {
  const uid = id.startsWith('req_') ? id.replace('req_', '') : id;
  // 1. Clear pending_batch_code in users table
  try {
    await supabase.from('users').update({
      pending_batch_code: '',
    }).eq('uid', uid);
  } catch (err) {
    console.warn('Error clearing pending_batch_code on user:', err);
  }

  // 2. Also delete from join_requests table
  try {
    await supabase.from('join_requests').delete().eq('id', id);
  } catch {
    // Handled gracefully
  }
}

// --- Settings ---
export async function getSettingSupabase(key: string): Promise<any | null> {
  const { data, error } = await supabase.from('settings').select('*').eq('key', key).single();
  if (error || !data) return null;
  return data.value;
}

export async function saveSettingSupabase(key: string, value: any): Promise<void> {
  const { error } = await supabase.from('settings').upsert({
    key,
    value,
    updated_at: Date.now(),
  });
  if (error) logSupabaseError('saving setting', error);
}

// --- Representative Codes ---
export async function getRepresentativeCodesSupabase(): Promise<RepresentativeCode[]> {
  const { data, error } = await supabase.from('representative_codes').select('*');
  if (error) return [];
  return (data || []).map((c) => ({
    id: c.id,
    code: c.code,
    batchCode: c.batch_code,
    batchName: c.batch_name,
    createdBy: c.created_by || 'owner_ahmed',
    isUsed: Boolean(c.is_used),
    createdAt: Number(c.created_at),
    usedAt: c.used_at ? Number(c.used_at) : undefined,
    usedByUid: c.used_by_uid || undefined,
    usedByName: c.used_by_name || undefined,
  }));
}

export async function saveRepresentativeCodeSupabase(item: RepresentativeCode): Promise<void> {
  const { error } = await supabase.from('representative_codes').upsert({
    id: item.id,
    code: item.code,
    batch_code: item.batchCode,
    batch_name: item.batchName,
    is_used: item.isUsed,
    created_at: item.createdAt,
    used_at: item.usedAt,
    used_by_uid: item.usedByUid,
    used_by_name: item.usedByName,
  });
  if (error) logSupabaseError('saving representative code', error);
}

export async function deleteRepresentativeCodeSupabase(id: string): Promise<void> {
  await supabase.from('representative_codes').delete().eq('id', id);
}

// --- Realtime Subscriptions ---
export function subscribeTableSupabase(
  table: string,
  batchCode: string,
  onUpdate: () => void
) {
  const channel = supabase
    .channel(`rt_${table}_${batchCode}_${Math.random().toString(36).slice(2, 6)}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
      },
      () => {
        onUpdate();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
