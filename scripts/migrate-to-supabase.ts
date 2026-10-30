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

async function migrate() {
  console.log('🚀 Starting migration from Firestore to Supabase...');

  // 1. Batches
  try {
    const batchesSnap = await getDocs(collection(db, 'batches'));
    console.log(`📦 Found ${batchesSnap.docs.length} batches in Firestore.`);
    for (const d of batchesSnap.docs) {
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
    console.log('✅ Batches migrated successfully.');
  } catch (err: any) {
    console.warn('⚠️ Batches migration note:', err.message);
  }

  // 2. Users
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    console.log(`👤 Found ${usersSnap.docs.length} users in Firestore.`);
    for (const d of usersSnap.docs) {
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
    console.log('✅ Users migrated successfully.');
  } catch (err: any) {
    console.warn('⚠️ Users migration note:', err.message);
  }

  console.log('🎉 Migration run completed!');
}

migrate().catch(console.error);
