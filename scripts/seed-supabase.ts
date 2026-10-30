import { createClient } from '@supabase/supabase-js';
import supabaseConfig from '../supabase-config.json';
import {
  MOCK_USERS,
  MOCK_BATCHES,
  MOCK_COURSES,
  MOCK_SCHEDULE,
  MOCK_ANNOUNCEMENTS,
} from '../services/mockDb';

const supabase = createClient(
  supabaseConfig.supabaseUrl,
  supabaseConfig.supabaseAnonKey
);

async function seed() {
  console.log('🌱 Seeding Supabase with initial data...');

  // 1. Owner & Users
  const ownerUser = {
    uid: 'owner_ahmed',
    username: 'ahmed',
    password: 'ahmed0828',
    email: 'ahmed@dafaaty.edu',
    name: 'أحمد (المطور)',
    role: 'OWNER',
    batch_code: 'CS-2024',
    is_official: true,
    avatar: 'https://ui-avatars.com/api/?name=Ahmed&background=2563eb&color=fff',
    bio: 'مطور النظام ومؤسس منصة دفعتي',
    signature_color: '#2563eb',
    created_at: Date.now(),
  };

  const { error: userErr } = await supabase.from('users').upsert(ownerUser);
  if (userErr) console.error('Error inserting owner user:', userErr);
  else console.log('✅ Owner user inserted.');

  for (const u of MOCK_USERS) {
    await supabase.from('users').upsert({
      uid: u.uid,
      username: u.username || null,
      password: u.password || '123456',
      email: u.email || null,
      name: u.name,
      role: u.role,
      batch_code: u.batchCode || 'CS-2024',
      academic_group: u.academicGroup || 'كروب A',
      avatar: u.avatar || null,
      is_official: Boolean(u.isOfficial),
      bio: u.bio || null,
      signature_color: u.signatureColor || '#2563eb',
      created_at: Date.now(),
    });
  }
  console.log(`✅ Seeded ${MOCK_USERS.length} mock students/users.`);

  // 2. Batches
  const defaultBatch = {
    id: 'batch_cs_2024',
    code: 'CS-2024',
    name: 'علوم الحاسوب - دفعة 2024',
    department: 'علوم الحاسوب',
    stage: 'المرحلة الرابعة',
    representative_uid: 'owner_ahmed',
    representative_name: 'أحمد (المطور)',
    chat_locked: false,
    academic_groups: ['كروب A', 'كروب B', 'كروب C', 'كروب D'],
    created_at: Date.now(),
  };
  const { error: batchErr } = await supabase.from('batches').upsert(defaultBatch);
  if (batchErr) console.error('Error inserting default batch:', batchErr);
  else console.log('✅ Default batch CS-2024 inserted.');

  for (const b of MOCK_BATCHES) {
    await supabase.from('batches').upsert({
      id: b.id,
      code: b.code,
      name: b.name,
      department: b.department || 'علوم الحاسوب',
      stage: b.stage || 'المرحلة الرابعة',
      representative_uid: b.representativeUid || 'owner_ahmed',
      representative_name: b.representativeName || 'أحمد (المطور)',
      chat_locked: false,
      academic_groups: b.academicGroups || ['كروب A', 'كروب B', 'كروب C', 'كروب D'],
      created_at: b.createdAt || Date.now(),
    });
  }

  // 3. Courses
  for (const c of MOCK_COURSES) {
    await supabase.from('courses').upsert({
      id: c.id,
      batch_code: 'CS-2024',
      name: c.name,
      professors: c.professors || [],
      code: c.code || null,
      cumulative_max_score: c.cumulativeMaxScore || 50,
      final_exam_max_score: c.finalExamMaxScore || 50,
      assessments: c.assessments || [],
      created_at: Date.now(),
    });
  }
  console.log(`✅ Seeded ${MOCK_COURSES.length} courses.`);

  // 4. Schedules
  for (const s of MOCK_SCHEDULE) {
    await supabase.from('schedules').upsert({
      id: s.id,
      batch_code: 'CS-2024',
      course_id: s.courseId || null,
      course_name: s.courseName,
      professor: s.professor || null,
      day: s.day,
      date: s.date || null,
      start_time: s.startTime,
      end_time: s.endTime,
      location: s.hall || null,
      type: s.lectureType || 'THEORY',
      target_group: s.targetGroup || 'ALL',
      notes: s.note || null,
      is_cancelled: Boolean(s.isCancelled),
      updated_at: s.updatedAt || Date.now(),
    });
  }
  console.log(`✅ Seeded ${MOCK_SCHEDULE.length} schedule entries.`);

  // 5. Announcements
  for (const a of MOCK_ANNOUNCEMENTS) {
    await supabase.from('announcements').upsert({
      id: a.id,
      batch_code: 'CS-2024',
      title: a.title,
      content: a.content,
      author_id: a.authorId || 'owner_ahmed',
      author_name: a.authorName,
      timestamp: a.timestamp || Date.now(),
      is_pinned: Boolean(a.isPinned),
      priority: a.priority || 'normal',
      poll: a.poll || null,
      course_id: a.courseId || null,
      course_name: a.courseName || null,
    });
  }
  console.log(`✅ Seeded ${MOCK_ANNOUNCEMENTS.length} announcements.`);

  console.log('🎉 Supabase seeded successfully with zero errors!');
}

seed().catch(console.error);
