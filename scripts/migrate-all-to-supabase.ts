import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';
import firebaseConfig from '../firebase-applet-config.json';
import supabaseConfig from '../supabase-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const supabase = createClient(
  supabaseConfig.supabaseUrl,
  supabaseConfig.supabaseAnonKey
);

async function migrateAll() {
  console.log('🚀 Starting full migration from Firestore to Supabase...');

  // 1. Batches
  try {
    const snap = await getDocs(collection(db, 'batches'));
    console.log(`📦 Found ${snap.docs.length} batches.`);
    for (const d of snap.docs) {
      const data = d.data();
      await supabase.from('batches').upsert({
        id: d.id,
        code: data.code,
        name: data.name,
        department: data.department || null,
        stage: data.stage || null,
        representative_uid: data.representativeUid || null,
        representative_name: data.representativeName || null,
        chat_locked: Boolean(data.chatLocked),
        academic_groups: data.academicGroups || ['كروب A', 'كروب B', 'كروب C', 'كروب D'],
        created_at: data.createdAt || Date.now(),
      });
    }
  } catch (err: any) {
    console.warn('Batches error:', err.message);
  }

  // 2. Users
  try {
    const snap = await getDocs(collection(db, 'users'));
    console.log(`👤 Found ${snap.docs.length} users.`);
    for (const d of snap.docs) {
      const data = d.data();
      await supabase.from('users').upsert({
        uid: d.id,
        username: data.username || null,
        password: data.password || null,
        email: data.email || null,
        name: data.name || 'طالب',
        role: data.role || 'STUDENT',
        student_id: data.studentId || null,
        batch_code: data.batchCode || null,
        pending_batch_code: data.pendingBatchCode || null,
        academic_group: data.academicGroup || null,
        avatar: data.avatar || null,
        is_official: Boolean(data.isOfficial),
        exclude_from_stats: Boolean(data.excludeFromStats),
        bio: data.bio || null,
        banner: data.banner || null,
        signature_color: data.signatureColor || '#2563eb',
        studied_material_ids: data.studiedMaterialIds || [],
        bookmarked_material_ids: data.bookmarkedMaterialIds || [],
        notification_prefs: data.notificationPrefs || {},
        assistant_duties: data.assistantDuties || [],
        created_at: data.createdAt || Date.now(),
      });
    }
  } catch (err: any) {
    console.warn('Users error:', err.message);
  }

  // 3. Courses
  try {
    const snap = await getDocs(collection(db, 'courses'));
    console.log(`📚 Found ${snap.docs.length} courses.`);
    for (const d of snap.docs) {
      const data = d.data();
      await supabase.from('courses').upsert({
        id: d.id,
        batch_code: data.batchCode || 'CS-2024',
        name: data.name,
        professors: data.professors || [],
        code: data.code || null,
        cumulative_max_score: data.cumulativeMaxScore || 50,
        final_exam_max_score: data.finalExamMaxScore || 50,
        assessment_structure: data.assessments || [],
        created_at: data.createdAt || Date.now(),
      });
    }
  } catch (err: any) {
    console.warn('Courses error:', err.message);
  }

  // 4. Schedules
  try {
    const snap = await getDocs(collection(db, 'schedules'));
    console.log(`🗓️ Found ${snap.docs.length} schedules.`);
    for (const d of snap.docs) {
      const data = d.data();
      await supabase.from('schedules').upsert({
        id: d.id,
        batch_code: data.batchCode || 'CS-2024',
        course_id: data.courseId || null,
        course_name: data.courseName,
        professor: data.professor || null,
        day: data.day,
        date: data.date || null,
        start_time: data.startTime,
        end_time: data.endTime,
        location: data.hall || null,
        type: data.lectureType || 'THEORY',
        target_group: data.targetGroup || 'ALL',
        notes: data.note || null,
        is_cancelled: Boolean(data.isCancelled),
        updated_at: data.updatedAt || Date.now(),
      });
    }
  } catch (err: any) {
    console.warn('Schedules error:', err.message);
  }

  // 5. Announcements
  try {
    const snap = await getDocs(collection(db, 'announcements'));
    console.log(`📢 Found ${snap.docs.length} announcements.`);
    for (const d of snap.docs) {
      const data = d.data();
      await supabase.from('announcements').upsert({
        id: d.id,
        batch_code: data.batchCode || 'CS-2024',
        title: data.title,
        content: data.content,
        author_id: data.authorId || null,
        author_name: data.authorName || 'الممثل',
        author_role: data.authorRole || 'REPRESENTATIVE',
        timestamp: data.timestamp || Date.now(),
        is_pinned: Boolean(data.isPinned),
        priority: data.priority || 'normal',
        poll: data.poll || null,
        attachments: data.attachments || [],
      });
    }
  } catch (err: any) {
    console.warn('Announcements error:', err.message);
  }

  // 6. Attendance Sessions
  try {
    const snap = await getDocs(collection(db, 'attendance_sessions'));
    console.log(`⏱️ Found ${snap.docs.length} attendance sessions.`);
    for (const d of snap.docs) {
      const data = d.data();
      await supabase.from('attendance_sessions').upsert({
        id: d.id,
        batch_code: data.batchCode || 'CS-2024',
        course_id: data.courseId,
        course_name: data.courseName || null,
        title: data.title || 'محاضرة',
        date: data.date,
        target_group: data.targetGroup || 'ALL',
        type: data.lectureType || 'THEORY',
        timestamp: data.timestamp || Date.now(),
      });
    }
  } catch (err: any) {
    console.warn('Attendance sessions error:', err.message);
  }

  // 7. Attendance Records (including exceptions & excuses / الاجازات)
  try {
    const snap = await getDocs(collection(db, 'attendance_records'));
    console.log(`📋 Found ${snap.docs.length} attendance records.`);
    const rows = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        batch_code: data.batchCode || 'CS-2024',
        session_id: data.sessionId,
        student_id: data.studentId,
        status: data.status || 'PRESENT',
        is_exception: Boolean(data.isException),
        original_group: data.originalGroup || null,
        swapped_with_student_id: data.swappedWithStudentId || null,
        swapped_with_student_name: data.swappedWithStudentName || null,
        exception_note: data.exceptionNote || null,
        timestamp: data.timestamp || Date.now(),
      };
    });

    // Chunk into batches of 100 for fast upsert
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      const { error } = await supabase.from('attendance_records').upsert(chunk);
      if (error) console.error('Chunk upsert error:', error);
    }
  } catch (err: any) {
    console.warn('Attendance records error:', err.message);
  }

  // 8. Grades
  try {
    const snap = await getDocs(collection(db, 'grades'));
    console.log(`📊 Found ${snap.docs.length} grades.`);
    const rows = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        batch_code: data.batchCode || 'CS-2024',
        course_id: data.courseId,
        student_id: data.studentId,
        assessment_id: data.assessmentId,
        score: Number(data.score) || 0,
        timestamp: data.timestamp || Date.now(),
      };
    });
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      await supabase.from('grades').upsert(chunk);
    }
  } catch (err: any) {
    console.warn('Grades error:', err.message);
  }

  // 9. Material Sections
  try {
    const snap = await getDocs(collection(db, 'material_sections'));
    console.log(`📁 Found ${snap.docs.length} material sections.`);
    for (const d of snap.docs) {
      const data = d.data();
      await supabase.from('material_sections').upsert({
        id: d.id,
        batch_code: data.batchCode || 'CS-2024',
        course_id: data.courseId,
        title: data.title,
        icon: data.icon || 'FOLDER',
        category: data.category || 'LECTURES',
        created_at: Date.now(),
      });
    }
  } catch (err: any) {
    console.warn('Material sections error:', err.message);
  }

  // 10. Materials (PDFs and lectures)
  try {
    const snap = await getDocs(collection(db, 'materials'));
    console.log(`📄 Found ${snap.docs.length} materials (PDFs/Lectures).`);
    for (const d of snap.docs) {
      const data = d.data();
      await supabase.from('materials').upsert({
        id: d.id,
        batch_code: data.batchCode || 'CS-2024',
        course_id: data.courseId,
        section_id: data.sectionId,
        title: data.title,
        file_type: data.type || 'PDF',
        size: data.fileSize || null,
        url: data.url,
        drive_file_id: data.driveFileId || null,
        uploaded_by: 'الممثل',
        date: data.uploadDate || null,
        timestamp: data.timestamp || Date.now(),
      });
    }
  } catch (err: any) {
    console.warn('Materials error:', err.message);
  }

  // 11. Assignments
  try {
    const snap = await getDocs(collection(db, 'assignments'));
    console.log(`📝 Found ${snap.docs.length} assignments.`);
    for (const d of snap.docs) {
      const data = d.data();
      await supabase.from('assignments').upsert({
        id: d.id,
        batch_code: data.batchCode || 'CS-2024',
        course_id: data.courseId || '',
        course_name: data.courseName || '',
        title: data.title,
        description: data.description || null,
        due_date: data.dueDate,
        due_timestamp: data.dueTimestamp || Date.now(),
        completed_by: data.completedBy || [],
        attachments: data.attachments || [],
        created_at: data.createdAt || Date.now(),
      });
    }
  } catch (err: any) {
    console.warn('Assignments error:', err.message);
  }

  // 12. Exams
  try {
    const snap = await getDocs(collection(db, 'exams'));
    console.log(`🎓 Found ${snap.docs.length} exams.`);
    for (const d of snap.docs) {
      const data = d.data();
      await supabase.from('exams').upsert({
        id: d.id,
        batch_code: data.batchCode || 'CS-2024',
        course_id: data.courseId || '',
        course_name: data.courseName || '',
        title: data.title,
        type: data.type || 'QUIZ',
        exam_date: data.examDate,
        exam_timestamp: data.examTimestamp || Date.now(),
        location: data.hall || null,
        material_covered: data.topics || null,
        created_at: data.createdAt || Date.now(),
      });
    }
  } catch (err: any) {
    console.warn('Exams error:', err.message);
  }

  // 13. Projects
  try {
    const snap = await getDocs(collection(db, 'projects'));
    console.log(`🚀 Found ${snap.docs.length} projects.`);
    for (const d of snap.docs) {
      const data = d.data();
      await supabase.from('projects').upsert({
        id: d.id,
        batch_code: data.batchCode || 'CS-2024',
        course_id: data.courseId || null,
        course_name: data.courseName || '',
        title: data.title,
        description: data.description || null,
        deadline: data.deadline || null,
        groups: data.groups || [],
        created_at: data.createdAt || Date.now(),
      });
    }
  } catch (err: any) {
    console.warn('Projects error:', err.message);
  }

  // 14. Student Summaries
  try {
    const snap = await getDocs(collection(db, 'student_summaries'));
    console.log(`💡 Found ${snap.docs.length} student summaries.`);
    for (const d of snap.docs) {
      const data = d.data();
      await supabase.from('student_summaries').upsert({
        id: d.id,
        batch_code: data.batchCode || 'CS-2024',
        author_id: data.authorUid,
        author_name: data.authorName,
        author_avatar: data.authorAvatar || null,
        course_id: data.courseId,
        course_name: data.courseName,
        title: data.title,
        content: data.content || null,
        attachments: data.attachments || [],
        likes: data.likes?.length || 0,
        liked_by: data.likes || [],
        created_at: data.createdAt || Date.now(),
      });
    }
  } catch (err: any) {
    console.warn('Student summaries error:', err.message);
  }

  // 15. Batch Suggestions
  try {
    const snap = await getDocs(collection(db, 'batch_suggestions'));
    console.log(`📮 Found ${snap.docs.length} batch suggestions.`);
    for (const d of snap.docs) {
      const data = d.data();
      await supabase.from('batch_suggestions').upsert({
        id: d.id,
        batch_code: data.batchCode || 'CS-2024',
        author_id: data.authorUid || null,
        author_name: data.authorName,
        author_avatar: data.authorAvatar || null,
        is_anonymous: Boolean(data.isAnonymous),
        content: data.content,
        status: data.status || 'OPEN',
        rep_reply: data.repReply || null,
        rep_reply_at: data.repReplyAt || null,
        upvotes: data.upvotes?.length || 0,
        upvoted_by: data.upvotes || [],
        created_at: data.createdAt || Date.now(),
      });
    }
  } catch (err: any) {
    console.warn('Batch suggestions error:', err.message);
  }

  // 16. Join Requests
  try {
    const snap = await getDocs(collection(db, 'join_requests'));
    console.log(`🤝 Found ${snap.docs.length} join requests.`);
    for (const d of snap.docs) {
      const data = d.data();
      await supabase.from('join_requests').upsert({
        id: d.id,
        user_uid: data.userId,
        user_name: data.userName,
        user_avatar: data.userAvatar || null,
        user_email: data.userEmail || null,
        batch_code: data.batchCode,
        status: data.status || 'PENDING',
        timestamp: data.timestamp || Date.now(),
      });
    }
  } catch (err: any) {
    console.warn('Join requests error:', err.message);
  }

  // 17. Representative Codes
  try {
    const snap = await getDocs(collection(db, 'representative_codes'));
    console.log(`🔑 Found ${snap.docs.length} representative codes.`);
    for (const d of snap.docs) {
      const data = d.data();
      await supabase.from('representative_codes').upsert({
        id: d.id,
        code: data.code,
        batch_code: data.batchCode,
        batch_name: data.batchName || null,
        is_used: Boolean(data.isUsed),
        created_at: data.createdAt || Date.now(),
        used_at: data.usedAt || null,
        used_by_uid: data.usedByUid || null,
        used_by_name: data.usedByName || null,
      });
    }
  } catch (err: any) {
    console.warn('Representative codes error:', err.message);
  }

  console.log('🎉 Full Migration from Firestore to Supabase Finished Successfully!');
  process.exit(0);
}

migrateAll().catch((e) => {
  console.error('Fatal migration error:', e);
  process.exit(1);
});
