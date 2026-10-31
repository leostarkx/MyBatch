import { supabase, logSupabaseError } from './supabaseService';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { AcademicQuestion, AcademicAnswer, User } from '../types';

// Local storage caching helpers
function getLocalQuestions(batchCode: string): AcademicQuestion[] {
  try {
    const raw = localStorage.getItem(`dafaaty_qa_questions_${batchCode}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalQuestions(batchCode: string, items: AcademicQuestion[]): void {
  try {
    localStorage.setItem(`dafaaty_qa_questions_${batchCode}`, JSON.stringify(items));
  } catch {}
}

function getLocalAnswers(questionId: string): AcademicAnswer[] {
  try {
    const raw = localStorage.getItem(`dafaaty_qa_answers_${questionId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalAnswers(questionId: string, items: AcademicAnswer[]): void {
  try {
    localStorage.setItem(`dafaaty_qa_answers_${questionId}`, JSON.stringify(items));
  } catch {}
}

/**
 * Award or adjust academic reputation points for a user
 */
export async function awardAcademicPoints(
  userUid: string,
  pointsDelta: number,
  _reason?: string
): Promise<number> {
  let updatedTotal = 0;
  try {
    // 1. Try Firebase Firestore
    try {
      const userRef = doc(db, 'users', userUid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const currentPoints = Number((snap.data() as User).academicPoints || 0);
        updatedTotal = Math.max(0, currentPoints + pointsDelta);
        await setDoc(userRef, { academicPoints: updatedTotal }, { merge: true });
      }
    } catch (fsErr) {
      console.warn('Firestore points update fallback:', fsErr);
    }

    // 2. Try Supabase
    try {
      const { data: suUser } = await supabase
        .from('users')
        .select('academic_points')
        .eq('uid', userUid)
        .single();

      const currentPoints = suUser ? Number(suUser.academic_points || 0) : updatedTotal;
      if (!updatedTotal) updatedTotal = Math.max(0, currentPoints + pointsDelta);

      await supabase
        .from('users')
        .update({ academic_points: updatedTotal })
        .eq('uid', userUid);
    } catch (sbErr) {
      logSupabaseError('updating academic points', sbErr);
    }

    // 3. Local storage update for immediate active session sync
    const currentSessionRaw = localStorage.getItem('dafaaty_active_user');
    if (currentSessionRaw) {
      try {
        const u = JSON.parse(currentSessionRaw) as User;
        if (u.uid === userUid) {
          u.academicPoints = updatedTotal;
          localStorage.setItem('dafaaty_active_user', JSON.stringify(u));
        }
      } catch {}
    }
  } catch (err) {
    console.warn('awardAcademicPoints general error:', err);
  }

  return updatedTotal;
}

/**
 * Fetch academic questions for a batch, optionally filtered by course
 */
export async function getAcademicQuestions(
  batchCode: string,
  courseId?: string
): Promise<AcademicQuestion[]> {
  const localList = getLocalQuestions(batchCode);
  try {
    let query = supabase
      .from('academic_questions')
      .select('*')
      .eq('batch_code', batchCode)
      .order('created_at', { ascending: false });

    if (courseId && courseId !== 'ALL') {
      query = query.eq('course_id', courseId);
    }

    const { data, error } = await query;
    if (error) {
      logSupabaseError('fetching academic questions', error);
      return courseId && courseId !== 'ALL'
        ? localList.filter((q) => q.courseId === courseId)
        : localList;
    }

    const remoteQuestions: AcademicQuestion[] = (data || []).map((row) => ({
      id: row.id,
      batchCode: row.batch_code,
      courseId: row.course_id,
      courseName: row.course_name,
      authorUid: row.author_uid,
      authorName: row.author_name,
      authorAvatar: row.author_avatar || undefined,
      title: row.title,
      content: row.content,
      tags: row.tags || [],
      imageUrl: row.image_url || undefined,
      answersCount: Number(row.answers_count || 0),
      acceptedAnswerId: row.accepted_answer_id || undefined,
      upvotes: row.upvotes || [],
      createdAt: Number(row.created_at),
    }));

    // Cache to local storage
    saveLocalQuestions(batchCode, remoteQuestions);
    return remoteQuestions;
  } catch (err) {
    logSupabaseError('fetching academic questions', err);
    return courseId && courseId !== 'ALL'
      ? localList.filter((q) => q.courseId === courseId)
      : localList;
  }
}

/**
 * Save / Create an academic question
 */
export async function saveAcademicQuestion(
  item: AcademicQuestion,
  isNew: boolean = false
): Promise<void> {
  // 1. Save to local storage first
  const currentList = getLocalQuestions(item.batchCode);
  const updatedList = [item, ...currentList.filter((q) => q.id !== item.id)];
  saveLocalQuestions(item.batchCode, updatedList);

  // 2. Award +5 points to the author if it's a new question
  if (isNew) {
    awardAcademicPoints(item.authorUid, 5, 'طرح سؤال دراسي جديد').catch(() => {});
  }

  // 3. Write to Supabase
  try {
    const { error } = await supabase.from('academic_questions').upsert({
      id: item.id,
      batch_code: item.batchCode,
      course_id: item.courseId,
      course_name: item.courseName,
      author_uid: item.authorUid,
      author_name: item.authorName,
      author_avatar: item.authorAvatar || null,
      title: item.title,
      content: item.content,
      tags: item.tags || [],
      image_url: item.imageUrl || null,
      answers_count: item.answersCount,
      accepted_answer_id: item.acceptedAnswerId || null,
      upvotes: item.upvotes,
      created_at: item.createdAt,
    });
    if (error) logSupabaseError('saving academic question', error);
  } catch (err) {
    logSupabaseError('saving academic question', err);
  }

  // 4. Firestore sync
  try {
    await setDoc(doc(db, 'academic_questions', item.id), item, { merge: true });
  } catch (fsErr) {
    // Ignore if quota exceeded
  }
}

/**
 * Delete an academic question
 */
export async function deleteAcademicQuestion(
  questionId: string,
  batchCode: string
): Promise<void> {
  const currentList = getLocalQuestions(batchCode);
  saveLocalQuestions(
    batchCode,
    currentList.filter((q) => q.id !== questionId)
  );

  try {
    await supabase.from('academic_questions').delete().eq('id', questionId);
  } catch (err) {
    logSupabaseError('deleting academic question', err);
  }

  try {
    await supabase.from('academic_answers').delete().eq('question_id', questionId);
  } catch {}
}

/**
 * Toggle upvote on a question
 */
export async function toggleUpvoteQuestion(
  question: AcademicQuestion,
  userUid: string
): Promise<{ isUpvoted: boolean; newCount: number }> {
  const hasUpvoted = question.upvotes.includes(userUid);
  const newUpvotes = hasUpvoted
    ? question.upvotes.filter((uid) => uid !== userUid)
    : [...question.upvotes, userUid];

  const updated: AcademicQuestion = {
    ...question,
    upvotes: newUpvotes,
  };

  // If newly upvoted and not the author themselves, reward question author with +2 points
  if (!hasUpvoted && question.authorUid !== userUid) {
    awardAcademicPoints(question.authorUid, 2, 'إعجاب بسؤال دراسي').catch(() => {});
  }

  await saveAcademicQuestion(updated, false);
  return { isUpvoted: !hasUpvoted, newCount: newUpvotes.length };
}

/**
 * Fetch answers for a specific question
 */
export async function getAcademicAnswers(questionId: string): Promise<AcademicAnswer[]> {
  const localList = getLocalAnswers(questionId);
  try {
    const { data, error } = await supabase
      .from('academic_answers')
      .select('*')
      .eq('question_id', questionId)
      .order('is_accepted', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      logSupabaseError('fetching academic answers', error);
      return localList;
    }

    const remoteAnswers: AcademicAnswer[] = (data || []).map((row) => ({
      id: row.id,
      questionId: row.question_id,
      batchCode: row.batch_code || undefined,
      authorUid: row.author_uid,
      authorName: row.author_name,
      authorAvatar: row.author_avatar || undefined,
      content: row.content,
      imageUrl: row.image_url || undefined,
      isAccepted: Boolean(row.is_accepted),
      upvotes: row.upvotes || [],
      createdAt: Number(row.created_at),
    }));

    saveLocalAnswers(questionId, remoteAnswers);
    return remoteAnswers;
  } catch (err) {
    logSupabaseError('fetching academic answers', err);
    return localList;
  }
}

/**
 * Save / Create an answer and increment question answersCount
 */
export async function saveAcademicAnswer(
  answer: AcademicAnswer,
  question: AcademicQuestion,
  isNew: boolean = false
): Promise<void> {
  const currentAnswers = getLocalAnswers(question.id);
  const updatedAnswers = [
    ...currentAnswers.filter((a) => a.id !== answer.id),
    answer,
  ];
  saveLocalAnswers(question.id, updatedAnswers);

  // If new answer, award +10 points to respondent and increment answersCount
  if (isNew) {
    awardAcademicPoints(answer.authorUid, 10, 'تقديم إجابة أكاديمية').catch(() => {});
    const updatedQuestion: AcademicQuestion = {
      ...question,
      answersCount: (question.answersCount || 0) + 1,
    };
    saveAcademicQuestion(updatedQuestion, false).catch(() => {});
  }

  // Save to Supabase
  try {
    const { error } = await supabase.from('academic_answers').upsert({
      id: answer.id,
      question_id: answer.questionId,
      batch_code: answer.batchCode || question.batchCode,
      author_uid: answer.authorUid,
      author_name: answer.authorName,
      author_avatar: answer.authorAvatar || null,
      content: answer.content,
      image_url: answer.imageUrl || null,
      is_accepted: answer.isAccepted,
      upvotes: answer.upvotes,
      created_at: answer.createdAt,
    });
    if (error) logSupabaseError('saving academic answer', error);
  } catch (err) {
    logSupabaseError('saving academic answer', err);
  }
}

/**
 * Toggle upvote on an answer
 */
export async function toggleUpvoteAnswer(
  answer: AcademicAnswer,
  question: AcademicQuestion,
  userUid: string
): Promise<{ isUpvoted: boolean; newCount: number }> {
  const hasUpvoted = answer.upvotes.includes(userUid);
  const newUpvotes = hasUpvoted
    ? answer.upvotes.filter((uid) => uid !== userUid)
    : [...answer.upvotes, userUid];

  const updated: AcademicAnswer = {
    ...answer,
    upvotes: newUpvotes,
  };

  // If newly upvoted and not the respondent themselves, reward respondent with +3 points
  if (!hasUpvoted && answer.authorUid !== userUid) {
    awardAcademicPoints(answer.authorUid, 3, 'إعجاب بإجابة مفيدة').catch(() => {});
  }

  await saveAcademicAnswer(updated, question, false);
  return { isUpvoted: !hasUpvoted, newCount: newUpvotes.length };
}

/**
 * Mark an answer as accepted by the question author
 */
export async function markAnswerAsAccepted(
  question: AcademicQuestion,
  answer: AcademicAnswer
): Promise<void> {
  // Update question
  const updatedQuestion: AcademicQuestion = {
    ...question,
    acceptedAnswerId: answer.id,
  };
  await saveAcademicQuestion(updatedQuestion, false);

  // Update answer
  const updatedAnswer: AcademicAnswer = {
    ...answer,
    isAccepted: true,
  };
  await saveAcademicAnswer(updatedAnswer, question, false);

  // Reward: +25 points to the respondent, and +2 points to question author for confirming
  awardAcademicPoints(answer.authorUid, 25, 'اختيار إجابتك كإجابة نموذجية معتمدة').catch(() => {});
  awardAcademicPoints(question.authorUid, 2, 'تأكيد إجابة السؤال النموذجية').catch(() => {});
}
