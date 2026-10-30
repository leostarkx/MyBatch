-- ==============================================================================
-- Schema for Dafaaty Academic Platform (منصة دفعتي الأكاديمية)
-- Run this complete script in the Supabase SQL Editor
-- ==============================================================================

-- 1. Batches Table (الدفعات)
CREATE TABLE IF NOT EXISTS public.batches (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    department TEXT,
    stage TEXT,
    representative_uid TEXT,
    representative_name TEXT,
    chat_locked BOOLEAN DEFAULT FALSE,
    academic_groups JSONB DEFAULT '["كروب A", "كروب B", "كروب C", "كروب D"]'::jsonb,
    created_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- 2. Users Table (الطلاب والممثلين والمطور)
CREATE TABLE IF NOT EXISTS public.users (
    uid TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    email TEXT,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'STUDENT',
    student_id TEXT,
    batch_code TEXT,
    pending_batch_code TEXT,
    academic_group TEXT,
    avatar TEXT,
    is_official BOOLEAN DEFAULT FALSE,
    exclude_from_stats BOOLEAN DEFAULT FALSE,
    bio TEXT,
    banner TEXT,
    signature_color TEXT DEFAULT '#2563eb',
    studied_material_ids JSONB DEFAULT '[]'::jsonb,
    bookmarked_material_ids JSONB DEFAULT '[]'::jsonb,
    notification_prefs JSONB DEFAULT '{}'::jsonb,
    assistant_duties JSONB DEFAULT '[]'::jsonb,
    created_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- 3. Courses Table (المواد الدراسية)
CREATE TABLE IF NOT EXISTS public.courses (
    id TEXT PRIMARY KEY,
    batch_code TEXT NOT NULL,
    name TEXT NOT NULL,
    professors JSONB DEFAULT '[]'::jsonb,
    code TEXT,
    credits INT DEFAULT 3,
    color TEXT DEFAULT 'blue',
    description TEXT,
    semester TEXT DEFAULT 'الأول',
    assessment_structure JSONB DEFAULT '{}'::jsonb,
    created_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- 4. Schedules Table (جدول المحاضرات الأسبوعي)
CREATE TABLE IF NOT EXISTS public.schedules (
    id TEXT PRIMARY KEY,
    batch_code TEXT NOT NULL,
    course_id TEXT,
    course_name TEXT NOT NULL,
    professor TEXT,
    day TEXT NOT NULL,
    date TEXT,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    location TEXT,
    type TEXT DEFAULT 'THEORY',
    target_group TEXT DEFAULT 'ALL',
    notes TEXT,
    is_cancelled BOOLEAN DEFAULT FALSE,
    cancellation_reason TEXT,
    updated_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- 5. Announcements Table (التبليغات الرسمية)
CREATE TABLE IF NOT EXISTS public.announcements (
    id TEXT PRIMARY KEY,
    batch_code TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id TEXT,
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL,
    author_avatar TEXT,
    author_color TEXT,
    date TEXT,
    timestamp BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
    is_pinned BOOLEAN DEFAULT FALSE,
    priority TEXT DEFAULT 'NORMAL',
    target_group TEXT DEFAULT 'ALL',
    tags JSONB DEFAULT '[]'::jsonb,
    attachments JSONB DEFAULT '[]'::jsonb,
    poll JSONB DEFAULT NULL
);

-- 6. Assignments Table (الواجبات والتكليفات)
CREATE TABLE IF NOT EXISTS public.assignments (
    id TEXT PRIMARY KEY,
    batch_code TEXT NOT NULL,
    course_id TEXT,
    course_name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT NOT NULL,
    due_time TEXT,
    due_timestamp BIGINT NOT NULL,
    target_group TEXT DEFAULT 'ALL',
    priority TEXT DEFAULT 'NORMAL',
    status TEXT DEFAULT 'PENDING',
    completed_by JSONB DEFAULT '[]'::jsonb,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- 7. Exams Table (الامتحانات والكويزات)
CREATE TABLE IF NOT EXISTS public.exams (
    id TEXT PRIMARY KEY,
    batch_code TEXT NOT NULL,
    course_id TEXT,
    course_name TEXT NOT NULL,
    title TEXT NOT NULL,
    type TEXT DEFAULT 'QUIZ',
    exam_date TEXT NOT NULL,
    exam_time TEXT,
    exam_timestamp BIGINT NOT NULL,
    location TEXT,
    target_group TEXT DEFAULT 'ALL',
    material_covered TEXT,
    notes TEXT,
    created_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- 8. Attendance Sessions Table (جلسات الحضور)
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id TEXT PRIMARY KEY,
    batch_code TEXT NOT NULL,
    course_id TEXT NOT NULL,
    course_name TEXT,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    target_group TEXT DEFAULT 'ALL',
    type TEXT DEFAULT 'THEORY',
    timestamp BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- 9. Attendance Records Table (سجلات حضور وغياب الطلاب)
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id TEXT PRIMARY KEY,
    batch_code TEXT NOT NULL,
    session_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PRESENT',
    is_exception BOOLEAN DEFAULT FALSE,
    original_group TEXT,
    swapped_with_student_id TEXT,
    swapped_with_student_name TEXT,
    exception_note TEXT,
    timestamp BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- 10. Grades Table (كشوفات درجات السعي)
CREATE TABLE IF NOT EXISTS public.grades (
    id TEXT PRIMARY KEY,
    batch_code TEXT NOT NULL,
    course_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    assessment_id TEXT NOT NULL,
    score NUMERIC NOT NULL DEFAULT 0,
    timestamp BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- 11. Chat Messages Table (شات الدفعة الجماعي)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id TEXT PRIMARY KEY,
    batch_code TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    sender_avatar TEXT,
    sender_color TEXT,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text',
    media_url TEXT,
    expires_at BIGINT,
    reply_to JSONB DEFAULT NULL,
    timestamp BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- 12. Material Sections Table (أقسام المواد وبنوك الأسئلة)
CREATE TABLE IF NOT EXISTS public.material_sections (
    id TEXT PRIMARY KEY,
    batch_code TEXT NOT NULL,
    course_id TEXT NOT NULL,
    title TEXT NOT NULL,
    icon TEXT DEFAULT 'FOLDER',
    category TEXT DEFAULT 'LECTURES',
    created_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- 13. Materials Table (ملفات الملازم والروابط)
CREATE TABLE IF NOT EXISTS public.materials (
    id TEXT PRIMARY KEY,
    batch_code TEXT NOT NULL,
    course_id TEXT NOT NULL,
    section_id TEXT NOT NULL,
    title TEXT NOT NULL,
    file_type TEXT NOT NULL DEFAULT 'PDF',
    size TEXT,
    url TEXT NOT NULL,
    drive_file_id TEXT,
    drive_thumbnail_url TEXT,
    uploaded_by TEXT NOT NULL,
    date TEXT,
    description TEXT,
    timestamp BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- 14. Projects Table (مشاريع المواد والكروبات)
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY,
    batch_code TEXT NOT NULL,
    course_id TEXT,
    course_name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    max_members INT DEFAULT 4,
    min_members INT DEFAULT 1,
    deadline TEXT,
    due_timestamp BIGINT,
    groups JSONB DEFAULT '[]'::jsonb,
    created_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- 15. Student Summaries Table (الملخصات والشروحات المكتوبة)
CREATE TABLE IF NOT EXISTS public.student_summaries (
    id TEXT PRIMARY KEY,
    batch_code TEXT NOT NULL,
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    course_id TEXT NOT NULL,
    course_name TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    likes INT DEFAULT 0,
    liked_by JSONB DEFAULT '[]'::jsonb,
    created_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::bigint,
    updated_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- 16. Batch Suggestions Table (صندوق المقترحات)
CREATE TABLE IF NOT EXISTS public.batch_suggestions (
    id TEXT PRIMARY KEY,
    batch_code TEXT NOT NULL,
    author_id TEXT,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    rep_reply TEXT,
    rep_reply_at BIGINT,
    upvotes INT DEFAULT 0,
    upvoted_by JSONB DEFAULT '[]'::jsonb,
    created_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- 17. Notifications Table (الإشعارات)
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    batch_code TEXT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    target_tab TEXT,
    timestamp BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- 18. Join Requests Table (طلبات الانضمام للدفعة)
CREATE TABLE IF NOT EXISTS public.join_requests (
    id TEXT PRIMARY KEY,
    user_uid TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    user_email TEXT,
    batch_code TEXT NOT NULL,
    academic_group TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    notes TEXT,
    timestamp BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- 19. Representative Appointment Codes Table
CREATE TABLE IF NOT EXISTS public.representative_codes (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    batch_code TEXT NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_by_uid TEXT,
    used_by_name TEXT,
    used_at BIGINT,
    expires_at BIGINT,
    target_rep_username TEXT,
    notes TEXT,
    created_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- 20. App Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- ==============================================================================
-- Indexes for Maximum Speed
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_users_batch ON public.users(batch_code);
CREATE INDEX IF NOT EXISTS idx_chat_batch_time ON public.chat_messages(batch_code, timestamp);
CREATE INDEX IF NOT EXISTS idx_announcements_batch_time ON public.announcements(batch_code, timestamp);
CREATE INDEX IF NOT EXISTS idx_att_records_session ON public.attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_att_records_batch ON public.attendance_records(batch_code);
CREATE INDEX IF NOT EXISTS idx_grades_course_student ON public.grades(course_id, student_id);
CREATE INDEX IF NOT EXISTS idx_notifs_user ON public.notifications(user_id, timestamp);

-- ==============================================================================
-- Enable Row Level Security (RLS) & Allow Anonymous/Public Access for Platform
-- ==============================================================================
DO $$ 
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Public access for all operations" ON public.%I;', tbl);
        EXECUTE format('CREATE POLICY "Public access for all operations" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl);
    END LOOP;
END $$;

-- Enable Realtime on core communication tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.grades;
