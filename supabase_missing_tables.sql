-- ==============================================================================
-- إكمال الجداول المتبقية في Supabase لنظام "دفعتي" (Dafaaty)
-- انسخ هذا الكود بالكامل وشغله في Supabase SQL Editor لتفعيل الإشعارات والمقترحات وباقي الميزات
-- ==============================================================================

-- 1. جدول الإشعارات (Notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    batch_code TEXT,
    type TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    target_tab TEXT,
    timestamp BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- 2. جدول صندوق المقترحات (Batch Suggestions)
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

-- 3. جدول طلبات الانضمام (Join Requests)
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

-- 4. جدول أكواد تعيين وتفويض الممثلين (Representative Appointment Codes)
CREATE TABLE IF NOT EXISTS public.representative_codes (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    batch_code TEXT NOT NULL,
    batch_name TEXT,
    is_used BOOLEAN DEFAULT FALSE,
    used_by_uid TEXT,
    used_by_name TEXT,
    used_at BIGINT,
    expires_at BIGINT,
    target_rep_username TEXT,
    notes TEXT,
    created_by TEXT DEFAULT 'owner_ahmed',
    created_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- 5. جدول إعدادات النظام والشات (Settings)
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value JSONB DEFAULT '{}'::jsonb,
    data JSONB DEFAULT '{}'::jsonb,
    updated_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- الفهارس لتسريع الاستعلامات (Indexes)
CREATE INDEX IF NOT EXISTS idx_notifs_user ON public.notifications(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_suggestions_batch ON public.batch_suggestions(batch_code, created_at);
CREATE INDEX IF NOT EXISTS idx_join_requests_batch ON public.join_requests(batch_code, timestamp);
CREATE INDEX IF NOT EXISTS idx_rep_codes_code ON public.representative_codes(code);

-- تفعيل الأمان والصلاحيات (Row Level Security) للجداول الجديدة
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for notifications" ON public.notifications;
CREATE POLICY "Public access for notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.batch_suggestions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for batch_suggestions" ON public.batch_suggestions;
CREATE POLICY "Public access for batch_suggestions" ON public.batch_suggestions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for join_requests" ON public.join_requests;
CREATE POLICY "Public access for join_requests" ON public.join_requests FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.representative_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for representative_codes" ON public.representative_codes;
CREATE POLICY "Public access for representative_codes" ON public.representative_codes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for settings" ON public.settings;
CREATE POLICY "Public access for settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);

-- 6. إضافة عمود نقاط التفاعل الأكاديمية لجدول المستخدمين
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS academic_points INT DEFAULT 0;

-- 7. جدول أسئلة واستفسارات المواد الأكاديمية (Academic Questions)
CREATE TABLE IF NOT EXISTS public.academic_questions (
    id TEXT PRIMARY KEY,
    batch_code TEXT NOT NULL,
    course_id TEXT NOT NULL,
    course_name TEXT NOT NULL,
    author_uid TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags JSONB DEFAULT '[]'::jsonb,
    image_url TEXT,
    answers_count INT DEFAULT 0,
    accepted_answer_id TEXT,
    upvotes JSONB DEFAULT '[]'::jsonb,
    created_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- 8. جدول إجابات ومناقشات الأسئلة الأكاديمية (Academic Answers)
CREATE TABLE IF NOT EXISTS public.academic_answers (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL,
    batch_code TEXT,
    author_uid TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    content TEXT NOT NULL,
    image_url TEXT,
    is_accepted BOOLEAN DEFAULT FALSE,
    upvotes JSONB DEFAULT '[]'::jsonb,
    created_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- فهارس التسريع
CREATE INDEX IF NOT EXISTS idx_academic_q_batch ON public.academic_questions(batch_code, course_id, created_at);
CREATE INDEX IF NOT EXISTS idx_academic_ans_q ON public.academic_answers(question_id, created_at);

-- سياسات الأمان
ALTER TABLE public.academic_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for academic_questions" ON public.academic_questions;
CREATE POLICY "Public access for academic_questions" ON public.academic_questions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.academic_answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for academic_answers" ON public.academic_answers;
CREATE POLICY "Public access for academic_answers" ON public.academic_answers FOR ALL USING (true) WITH CHECK (true);

-- تفعيل التحديث الحي (Realtime) على الإشعارات والأسئلة
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.academic_questions;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.academic_answers;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

