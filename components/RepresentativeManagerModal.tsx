import React, { useState } from 'react';
import {
  Crown,
  UserCheck,
  UserX,
  PlusCircle,
  Copy,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Share2,
  RefreshCw,
  X,
  Sparkles,
  Users,
  ShieldCheck,
  ArrowRightLeft,
  Key,
  Calendar,
  AtSign,
  FileText,
  Dices,
  Edit3,
  Check,
} from 'lucide-react';
import { Batch, User, RepresentativeCode, UserRole } from '../types';
import {
  saveRepresentativeCodeToFirestore,
  updateRepresentativeCodeInFirestore,
  deleteRepresentativeCodeFromFirestore,
  transferRepresentation,
  dismissRepresentative,
  saveBatchToFirestore,
  compareArabicNames,
} from '../services/firebase';

interface RepresentativeManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  batches: Batch[];
  users: User[];
  codes: RepresentativeCode[];
}

export const RepresentativeManagerModal: React.FC<RepresentativeManagerModalProps> = ({
  isOpen,
  onClose,
  batches,
  users,
  codes,
}) => {
  const [activeTab, setActiveTab] = useState<'generate' | 'codes' | 'batches'>('generate');

  // Form States as requested by Developer
  const [batchNameInput, setBatchNameInput] = useState('');
  const [batchCodeInput, setBatchCodeInput] = useState('');
  const [selectedExistingBatchCode, setSelectedExistingBatchCode] = useState('');
  const [useExistingBatch, setUseExistingBatch] = useState(batches.length > 0);
  
  const [repNameInput, setRepNameInput] = useState('');
  const [repUsernameInput, setRepUsernameInput] = useState('');
  const [specialNotesInput, setSpecialNotesInput] = useState('');
  
  // Duration: month | year | lifetime
  const [durationOption, setDurationOption] = useState<'month' | 'year' | 'lifetime'>('year');
  
  // Code generation state
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Transfer modal
  const [transferBatch, setTransferBatch] = useState<Batch | null>(null);
  const [targetStudentUid, setTargetStudentUid] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);

  // Edit Code Modal State (Exclusive to Developer)
  const [editingCode, setEditingCode] = useState<RepresentativeCode | null>(null);
  const [editRepName, setEditRepName] = useState('');
  const [editRepUsername, setEditRepUsername] = useState('');
  const [editBatchName, setEditBatchName] = useState('');
  const [editCodeString, setEditCodeString] = useState('');
  const [editDuration, setEditDuration] = useState<'month' | 'year' | 'lifetime'>('year');
  const [editNotes, setEditNotes] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Edit Batch Modal State (Exclusive to Developer)
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [editBatchNameField, setEditBatchNameField] = useState('');
  const [editBatchCodeField, setEditBatchCodeField] = useState('');
  const [isSavingBatchEdit, setIsSavingBatchEdit] = useState(false);

  // Status feedback
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  /**
   * Smart Code Generation Algorithm:
   * Generates a clean, memorable, professional code derived from rep username or batch name + unique digits
   */
  const handleAutoGenerateCode = () => {
    let prefix = 'REP';
    
    if (repUsernameInput.trim()) {
      const cleanUser = repUsernameInput.trim().replace(/^@/, '').toUpperCase().slice(0, 5);
      if (cleanUser) prefix = `REP-${cleanUser}`;
    } else if (repNameInput.trim()) {
      const cleanName = repNameInput.trim().replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '');
      if (/^[a-zA-Z]/.test(cleanName)) {
        prefix = `REP-${cleanName.slice(0, 4).toUpperCase()}`;
      } else {
        prefix = 'REP';
      }
    } else if (useExistingBatch && selectedExistingBatchCode) {
      prefix = `REP-${selectedExistingBatchCode.toUpperCase()}`;
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const candidateCode = `${prefix}-${randomSuffix}`;
    setGeneratedCode(candidateCode);
  };

  const handleCreateCode = async () => {
    // 1. Validate Batch Name
    const targetBatchName = useExistingBatch
      ? batches.find(b => b.code === selectedExistingBatchCode)?.name || selectedExistingBatchCode
      : batchNameInput.trim();

    if (!targetBatchName) {
      showStatus('error', 'يرجى كتابة اسم الدفعة أو اختيار دفعة من القائمة');
      return;
    }

    // 2. Validate Representative Name
    if (!repNameInput.trim()) {
      showStatus('error', 'يرجى كتابة اسم الممثل المستهدف');
      return;
    }

    // 3. Validate Representative Username (REQUIRED)
    if (!repUsernameInput.trim()) {
      showStatus('error', 'يرجى إدخال يوزر الممثل (@username) - هذا الحقل إلزامي لربط الكود بحساب الممثل ومنع استخدامه من قبل غيره');
      return;
    }

    const cleanUsername = repUsernameInput.trim().replace(/^@/, '').toLowerCase();
    if (cleanUsername.length < 2) {
      showStatus('error', 'يوزر الممثل قصير جداً، يرجى كتابة يوزر صالح');
      return;
    }

    // 4. Determine or Auto-Generate Code
    let finalCode = generatedCode.trim().toUpperCase().replace(/\s+/g, '-');
    if (!finalCode) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      finalCode = `REP-${cleanUsername.toUpperCase().slice(0, 4)}-${randomSuffix}`;
    }

    // Check code uniqueness
    if (codes.some(c => c.code === finalCode)) {
      showStatus('error', 'هذا الكود مستخدم بالفعل! انقر على زر التوليد الذكي لإنشاء كود فريد جديد.');
      return;
    }

    setIsGenerating(true);
    try {
      // Determine Batch Code
      let finalBatchCode = selectedExistingBatchCode;
      if (!useExistingBatch || !finalBatchCode) {
        if (batchCodeInput.trim()) {
          finalBatchCode = batchCodeInput.trim().toUpperCase().replace(/\s+/g, '-');
        } else {
          // Clean English alphanumeric code (avoid Arabic slugs)
          const cleanEnglish = targetBatchName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
          const prefix = cleanEnglish.slice(0, 4) || 'BATCH';
          const rand = Math.floor(1000 + Math.random() * 9000);
          finalBatchCode = `${prefix}${rand}`;
        }

        // Create batch in Firestore if not existing
        const newBatch: Batch = {
          id: `batch_${Date.now()}`,
          code: finalBatchCode,
          name: targetBatchName,
          representativeName: repNameInput.trim(),
          chatLocked: false,
          createdAt: Date.now(),
        };
        await saveBatchToFirestore(newBatch);
      }

      // Calculate expiration timestamp based on duration option
      let expiresAt: number | undefined = undefined;
      const now = Date.now();
      if (durationOption === 'month') {
        expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 days
      } else if (durationOption === 'year') {
        expiresAt = now + 365 * 24 * 60 * 60 * 1000; // 365 days
      } else {
        expiresAt = undefined; // Lifetime
      }

      const newCodeDoc: RepresentativeCode = {
        id: `repcode_${Date.now()}`,
        code: finalCode,
        batchCode: finalBatchCode.toUpperCase(),
        batchName: targetBatchName,
        targetRepName: repNameInput.trim(),
        targetRepUsername: cleanUsername,
        durationOption,
        createdBy: 'أحمد (المطور)',
        createdAt: now,
        expiresAt,
        isUsed: false,
        notes: specialNotesInput.trim() || undefined,
      };

      await saveRepresentativeCodeToFirestore(newCodeDoc);

      // Reset form
      setBatchNameInput('');
      setBatchCodeInput('');
      setRepNameInput('');
      setRepUsernameInput('');
      setSpecialNotesInput('');
      setGeneratedCode('');

      showStatus('success', `تم توليد كود الممثل [${finalCode}] لدفعة [${finalBatchCode}] بنجاح!`);
      setActiveTab('codes');
    } catch (err: any) {
      showStatus('error', err.message || 'حدث خطأ أثناء حفظ كود الممثل');
    } finally {
      setIsGenerating(false);
    }
  };

  // Open Edit Modal for a Code
  const handleOpenEditCode = (code: RepresentativeCode) => {
    setEditingCode(code);
    setEditRepName(code.targetRepName || '');
    setEditRepUsername(code.targetRepUsername || '');
    setEditBatchName(code.batchName || '');
    setEditCodeString(code.code);
    setEditDuration(code.durationOption || 'year');
    setEditNotes(code.notes || '');
  };

  const handleSaveEditCode = async () => {
    if (!editingCode) return;
    if (!editRepName.trim()) {
      showStatus('error', 'يرجى كتابة اسم الممثل');
      return;
    }
    if (!editRepUsername.trim()) {
      showStatus('error', 'يوزر الممثل إلزامي');
      return;
    }
    const cleanUsername = editRepUsername.trim().replace(/^@/, '').toLowerCase();
    const cleanCode = editCodeString.trim().toUpperCase().replace(/\s+/g, '-');

    if (!cleanCode) {
      showStatus('error', 'الكود لا يمكن أن يكون فارغاً');
      return;
    }

    if (cleanCode !== editingCode.code && codes.some(c => c.id !== editingCode.id && c.code === cleanCode)) {
      showStatus('error', 'هذا الكود مستخدم بالفعل لكود آخر');
      return;
    }

    setIsSavingEdit(true);
    try {
      let expiresAt = editingCode.expiresAt;
      const now = Date.now();
      if (editDuration === 'month') {
        expiresAt = now + 30 * 24 * 60 * 60 * 1000;
      } else if (editDuration === 'year') {
        expiresAt = now + 365 * 24 * 60 * 60 * 1000;
      } else if (editDuration === 'lifetime') {
        expiresAt = undefined;
      }

      await updateRepresentativeCodeInFirestore(editingCode.id, {
        code: cleanCode,
        targetRepName: editRepName.trim(),
        targetRepUsername: cleanUsername,
        batchName: editBatchName.trim() || editingCode.batchName,
        durationOption: editDuration,
        expiresAt,
        notes: editNotes.trim() || undefined,
      });

      showStatus('success', `تم تحديث بيانات كود الممثل [${cleanCode}] بنجاح!`);
      setEditingCode(null);
    } catch (e: any) {
      showStatus('error', e.message || 'فشل تعديل الكود');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Open Edit Modal for a Batch
  const handleOpenEditBatch = (batch: Batch) => {
    setEditingBatch(batch);
    setEditBatchNameField(batch.name);
    setEditBatchCodeField(batch.code);
  };

  const handleSaveBatchEdit = async () => {
    if (!editingBatch) return;
    if (!editBatchNameField.trim() || !editBatchCodeField.trim()) {
      showStatus('error', 'يرجى ملء اسم الدفعة وكودها');
      return;
    }

    const cleanNewCode = editBatchCodeField.trim().toUpperCase().replace(/\s+/g, '-');

    setIsSavingBatchEdit(true);
    try {
      await saveBatchToFirestore({
        ...editingBatch,
        name: editBatchNameField.trim(),
        code: cleanNewCode,
      });

      showStatus('success', `تم تعديل بيانات الدفعة [${cleanNewCode}] بنجاح!`);
      setEditingBatch(null);
    } catch (e: any) {
      showStatus('error', e.message || 'فشل تعديل الدفعة');
    } finally {
      setIsSavingBatchEdit(false);
    }
  };

  const handleCopyCode = (code: RepresentativeCode) => {
    navigator.clipboard.writeText(code.code);
    setCopiedCodeId(code.id);
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  const handleShareWhatsApp = (code: RepresentativeCode) => {
    const durationText = code.durationOption === 'month' 
      ? 'شهر واحد (30 يوماً)' 
      : code.durationOption === 'year' 
      ? 'سنة كاملة (365 يوماً)' 
      : 'مدى الحياة (دائم) ♾️';

    const text = `🎓 *كود تعيين الممثل الرسمي لدفعة (${code.batchName || code.batchCode})*\n\n` +
      `👤 *الممثل المعيّن:* ${code.targetRepName || 'ممثل الدفعة'}\n` +
      `🆔 *يوزر الحساب:* @${code.targetRepUsername || 'غير محدد'}\n` +
      `🔑 *كود التفعيل:* \`${code.code}\`\n` +
      `⏳ *المدة:* ${durationText}\n` +
      (code.notes ? `📝 *ملاحظات:* ${code.notes}\n` : '') +
      `\n📲 *طريقة التفعيل:* افتح تطبيق دفعتي، اذهب إلى حسابك واضغط على "تفعيل كود الممثل" وأدخل الكود أعلاه للحصول على صلاحيات الإدارة فوراً!`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleDeleteCode = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف كود الممثل هذا؟')) return;
    try {
      await deleteRepresentativeCodeFromFirestore(id);
      showStatus('success', 'تم حذف الكود بنجاح');
    } catch (e: any) {
      showStatus('error', 'تعذر حذف الكود');
    }
  };

  const handleOpenTransfer = (batch: Batch) => {
    setTransferBatch(batch);
    const candidate = users.find(u => u.batchCode === batch.code && u.uid !== batch.representativeUid);
    setTargetStudentUid(candidate?.uid || '');
  };

  const handleExecuteTransfer = async () => {
    if (!transferBatch || !targetStudentUid) {
      showStatus('error', 'يرجى اختيار الطالب الذي ستنقل له الممثلية');
      return;
    }

    setIsTransferring(true);
    try {
      const res = await transferRepresentation(transferBatch.code, targetStudentUid);
      if (res.success) {
        showStatus('success', res.message);
        setTransferBatch(null);
      } else {
        showStatus('error', res.message);
      }
    } catch (err: any) {
      showStatus('error', err.message || 'فشل نقل الممثلية');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleDismiss = async (batch: Batch) => {
    if (!confirm(`هل أنت متأكد من إعفاء الممثل الحالي لدفعة (${batch.name}) وعزله إلى طالب عادي؟`)) return;
    try {
      const res = await dismissRepresentative(batch.code);
      if (res.success) {
        showStatus('success', res.message);
      } else {
        showStatus('error', res.message);
      }
    } catch (err: any) {
      showStatus('error', err.message || 'تعذر إعفاء الممثل');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-700 max-h-[92vh] flex flex-col animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Crown size={26} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold">
                  إدارة وتوليد أكواد الممثلين والدفعات
                </h2>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-white text-orange-600 shadow-sm">
                  المطور 💻
                </span>
              </div>
              <p className="text-xs text-orange-100 mt-0.5">
                توليد أكواد مخصصة للممثلين وربطها بيوزر الممثل وتعديل بياناتها في أي وقت
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 px-4 sm:px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('generate')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition flex items-center gap-2 ${
              activeTab === 'generate'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <PlusCircle size={16} />
            <span>توليد كود ممثل جديد</span>
          </button>

          <button
            onClick={() => setActiveTab('codes')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition flex items-center gap-2 ${
              activeTab === 'codes'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <Key size={16} />
            <span>سجل وتعديل الأكواد ({codes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('batches')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition flex items-center gap-2 ${
              activeTab === 'batches'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <Users size={16} />
            <span>ممثلو الدفعات الحاليين ({batches.length})</span>
          </button>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div
            className={`mx-4 sm:mx-6 mt-4 p-3.5 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-900/50'
                : 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-900/50'
            }`}
          >
            {statusMsg.type === 'success' ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
            <span className="font-medium">{statusMsg.text}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: GENERATE NEW CODE */}
          {activeTab === 'generate' && (
            <div className="space-y-5 max-w-xl mx-auto py-1">
              
              <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <Sparkles size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  أدخل بيانات الدفعة وكودها واسم الممثل و<strong>يوزره الإلزامي (@username)</strong> لربط الكود به وحمايته. يمكنك الضغط على <strong>زر التوليد الذكي 🎲</strong> لإنشاء كود فوري مميز أو كتابة الكود بيدك.
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4 bg-gray-50/90 dark:bg-slate-700/30 p-5 sm:p-6 rounded-3xl border border-gray-100 dark:border-slate-700">
                
                {/* 1. اسم الدفعة */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <Users size={14} className="text-orange-500" />
                      <span>إسم الدفعة</span>
                      <span className="text-red-500">*</span>
                    </label>

                    {batches.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setUseExistingBatch(!useExistingBatch)}
                        className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline"
                      >
                        {useExistingBatch ? '✍️ كتابة اسم دفعة جديدة' : '📋 اختيار من الدفعات الحالية'}
                      </button>
                    )}
                  </div>

                  {useExistingBatch && batches.length > 0 ? (
                    <select
                      value={selectedExistingBatchCode}
                      onChange={(e) => setSelectedExistingBatchCode(e.target.value)}
                      className="w-full bg-white dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
                    >
                      <option value="">-- اختر الدفعة --</option>
                      {batches.map((b) => (
                        <option key={b.id} value={b.code}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={batchNameInput}
                        onChange={(e) => setBatchNameInput(e.target.value)}
                        placeholder="مثال: جامعة كربلاء - تكنولوجيا المعلومات - الدفعة الخامسة"
                        className="w-full bg-white dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-orange-500/20"
                      />

                      {/* Custom Batch Code for Students */}
                      <div>
                        <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 block mb-1">
                          كود الدفعة المخصص للطلاب (Batch Code - إنجليزي):
                        </label>
                        <input
                          type="text"
                          value={batchCodeInput}
                          onChange={(e) => setBatchCodeInput(e.target.value.toUpperCase())}
                          placeholder="مثال: ITUOK5TH أو CS26 (اتركه فارغاً للتوليد التلقائي)"
                          className="w-full bg-white dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2 text-xs font-mono font-bold outline-none uppercase"
                          dir="ltr"
                        />
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          * هذا الكود هو الذي سيقوم الطلاب بكتابته للانضمام إلى الدفعة.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. اسم الممثل */}
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block flex items-center gap-1.5">
                    <Crown size={14} className="text-amber-500" />
                    <span>إسم الممثل</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={repNameInput}
                    onChange={(e) => setRepNameInput(e.target.value)}
                    placeholder="مثال: أحمد عامر أو علي الكرخي"
                    className="w-full bg-white dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                {/* 3. يوزر الممثل (إلزامي) */}
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block flex items-center gap-1.5">
                    <AtSign size={14} className="text-orange-500" />
                    <span>يوزر الممثل (@username)</span>
                    <span className="text-red-500">* (إلزامي لربط الكود)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={repUsernameInput}
                      onChange={(e) => setRepUsernameInput(e.target.value)}
                      placeholder="@a"
                      className="w-full bg-white dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
                      dir="ltr"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    * الكود سيعمل حصرياً للطالب الذي يملك هذا اليوزر ولن يتمكن أي طالب آخر من تفعيله.
                  </p>
                </div>

                {/* 4. ملاحظات خاصة */}
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block flex items-center gap-1.5">
                    <FileText size={14} className="text-gray-400" />
                    <span>ملاحظات خاصة</span>
                    <span className="text-[10px] text-gray-400 font-normal">(اختياري)</span>
                  </label>
                  <textarea
                    value={specialNotesInput}
                    onChange={(e) => setSpecialNotesInput(e.target.value)}
                    placeholder="مثال: جامعة كربلاء - دراسة صباحية / كود خاص بالفصل الأول"
                    className="w-full bg-white dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-xs outline-none resize-none h-16 focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                {/* 5. مدة صلاحية الكود (شهر أو سنة أو مدى الحياة) */}
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 block flex items-center gap-1.5">
                    <Clock size={14} className="text-orange-500" />
                    <span>مدة صلاحية الكود</span>
                    <span className="text-red-500">*</span>
                  </label>

                  <div className="grid grid-cols-3 gap-2.5">
                    {/* شهر */}
                    <button
                      type="button"
                      onClick={() => setDurationOption('month')}
                      className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                        durationOption === 'month'
                          ? 'border-orange-500 bg-orange-50/80 dark:bg-orange-950/40 text-orange-600 dark:text-orange-300 font-bold shadow-sm'
                          : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                      }`}
                    >
                      <Calendar size={18} className={durationOption === 'month' ? 'text-orange-500' : 'text-gray-400'} />
                      <span className="text-xs font-bold">شهر واحد</span>
                      <span className="text-[10px] text-gray-400">30 يوماً</span>
                    </button>

                    {/* سنة */}
                    <button
                      type="button"
                      onClick={() => setDurationOption('year')}
                      className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                        durationOption === 'year'
                          ? 'border-orange-500 bg-orange-50/80 dark:bg-orange-950/40 text-orange-600 dark:text-orange-300 font-bold shadow-sm'
                          : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                      }`}
                    >
                      <Calendar size={18} className={durationOption === 'year' ? 'text-orange-500' : 'text-gray-400'} />
                      <span className="text-xs font-bold">سنة كاملة</span>
                      <span className="text-[10px] text-gray-400">365 يوماً</span>
                    </button>

                    {/* مدى الحياة */}
                    <button
                      type="button"
                      onClick={() => setDurationOption('lifetime')}
                      className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                        durationOption === 'lifetime'
                          ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 font-bold shadow-sm'
                          : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-lg">♾️</span>
                      <span className="text-xs font-bold">مدى الحياة</span>
                      <span className="text-[10px] text-gray-400">دائم بدون انتهاء</span>
                    </button>
                  </div>
                </div>

                {/* 6. الكود نفسه */}
                <div className="pt-2 border-t border-gray-100 dark:border-slate-600">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <Key size={14} className="text-amber-500" />
                      <span>كود التفعيل (تلقائي ذكي أو يدوي)</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleAutoGenerateCode}
                      className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 text-amber-800 dark:text-amber-300 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                    >
                      <Dices size={13} />
                      <span>🎲 توليد كود ذكي تلقائي</span>
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={generatedCode}
                      onChange={(e) => setGeneratedCode(e.target.value.toUpperCase())}
                      placeholder="اضغط على زر التوليد الذكي أو اكتب كودك المخصص هنا..."
                      className="w-full bg-white dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-orange-500/20 text-center tracking-wider uppercase"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="button"
                  onClick={handleCreateCode}
                  disabled={isGenerating}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl font-bold text-xs shadow-lg shadow-orange-500/20 hover:from-amber-600 hover:to-orange-700 transition flex items-center justify-center gap-2 mt-3 disabled:opacity-50 active:scale-98"
                >
                  {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <PlusCircle size={16} />}
                  <span>حفظ وإنشاء كود الممثل</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CODES LIST (With Edit & Details) */}
          {activeTab === 'codes' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>سجل الأكواد الصادرة (يمكنك تعديل أي كود أو معلوماته):</span>
                <span className="font-bold text-orange-600">{codes.length} كود مسجل</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {codes.map((c) => {
                  const isExpired = c.expiresAt && Date.now() > c.expiresAt;
                  const isCopied = copiedCodeId === c.id;
                  
                  const durationLabel = c.durationOption === 'month' 
                    ? 'شهر واحد' 
                    : c.durationOption === 'year' 
                    ? 'سنة' 
                    : 'مدى الحياة ♾️';

                  return (
                    <div
                      key={c.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        c.isUsed
                          ? 'bg-gray-50/70 dark:bg-slate-800/40 border-gray-200 dark:border-slate-700 opacity-80'
                          : isExpired
                          ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/30'
                          : 'bg-white dark:bg-slate-700/50 border-orange-200 dark:border-slate-600 shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-sm text-gray-800 dark:text-white bg-gray-100 dark:bg-slate-600 px-3 py-1 rounded-xl" dir="ltr">
                              {c.code}
                            </span>

                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                              دفعة: {c.batchName || c.batchCode}
                            </span>

                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 flex items-center gap-1">
                              <Clock size={11} />
                              {durationLabel}
                            </span>

                            {c.isUsed ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                                تم الاستخدام بواسطة: {c.usedByName || 'طالب'}
                              </span>
                            ) : isExpired ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
                                منتهي الصلاحية
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                                نشط وجاهز للاستخدام
                              </span>
                            )}
                          </div>

                          {/* Representative details */}
                          <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-300 flex-wrap pt-0.5">
                            {c.targetRepName && (
                              <span className="font-bold flex items-center gap-1">
                                <Crown size={12} className="text-amber-500" />
                                الممثل: <strong className="text-orange-600 dark:text-orange-400">{c.targetRepName}</strong>
                              </span>
                            )}
                            {c.targetRepUsername && (
                              <span className="font-mono text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-md font-bold text-[11px]" dir="ltr">
                                @{c.targetRepUsername}
                              </span>
                            )}
                          </div>

                          {c.notes && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              ملاحظات: {c.notes}
                            </p>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          {/* EDIT CODE BUTTON FOR DEVELOPER */}
                          <button
                            onClick={() => handleOpenEditCode(c)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition flex items-center gap-1 text-xs font-bold"
                            title="تعديل معلومات الكود والممثل"
                          >
                            <Edit3 size={15} />
                            <span className="hidden sm:inline">تعديل</span>
                          </button>

                          {!c.isUsed && !isExpired && (
                            <>
                              <button
                                onClick={() => handleCopyCode(c)}
                                className="px-3 py-1.5 bg-gray-100 dark:bg-slate-600 hover:bg-gray-200 dark:hover:bg-slate-500 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 transition flex items-center gap-1"
                                title="نسخ الكود"
                              >
                                {isCopied ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} />}
                                <span>{isCopied ? 'تم النسخ' : 'نسخ'}</span>
                              </button>

                              <button
                                onClick={() => handleShareWhatsApp(c)}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition"
                                title="مشاركة الكود والبيانات عبر WhatsApp"
                              >
                                <Share2 size={16} />
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => handleDeleteCode(c.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"
                            title="حذف الكود"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {codes.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    لا توجد أكواد صادرة بعد. اضغط على تبويب "توليد كود ممثل جديد" للبدء.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: BATCHES & CURRENT REPRESENTATIVES */}
          {activeTab === 'batches' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>يمكنك تعيين أي طالب كممثل للدفعة، أو تعديل كود الدفعة واسمها، أو نقل الصلاحيات:</span>
              </div>

              <div className="grid grid-cols-1 gap-3.5">
                {batches.map((batch) => {
                  const repUser = users.find(u => u.uid === batch.representativeUid);
                  const hasRep = !!batch.representativeUid && batch.representativeUid !== '';

                  return (
                    <div
                      key={batch.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-700/40 border border-gray-200 dark:border-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-sm transition"
                    >
                      {/* Batch Info */}
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm shrink-0 border border-amber-200/50 uppercase font-mono">
                          {batch.code}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-gray-800 dark:text-white">
                              {batch.name}
                            </h4>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-gray-300">
                              كود الانضمام: {batch.code}
                            </span>
                          </div>

                          <div className="mt-1 flex items-center gap-2 text-xs">
                            <span className="text-gray-400">الممثل الحالي:</span>
                            {hasRep ? (
                              <span className="font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1">
                                <Crown size={13} />
                                {repUser?.name || batch.representativeName || 'ممثل مسجل'}
                              </span>
                            ) : (
                              <span className="font-semibold text-gray-400 bg-gray-100 dark:bg-slate-600 px-2 py-0.5 rounded-md text-[11px]">
                                شاغر (لا يوجد ممثل)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                        {/* Edit Batch Info */}
                        <button
                          onClick={() => handleOpenEditBatch(batch)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition flex items-center gap-1 text-xs font-bold"
                          title="تعديل اسم أو كود الدفعة"
                        >
                          <Edit3 size={15} />
                          <span>تعديل الدفعة</span>
                        </button>

                        {hasRep ? (
                          <>
                            <button
                              onClick={() => handleOpenTransfer(batch)}
                              className="px-3.5 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-primary/20"
                              title="نقل الممثلية لطالب آخر"
                            >
                              <ArrowRightLeft size={14} />
                              <span>نقل الممثلية</span>
                            </button>

                            <button
                              onClick={() => handleDismiss(batch)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"
                              title="إعفاء الممثل وعزله"
                            >
                              <UserX size={16} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleOpenTransfer(batch)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
                          >
                            <UserCheck size={14} />
                            <span>تعيين ممثل للدفعة</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {batches.length === 0 && (
                  <div className="text-center py-10 text-gray-400">
                    لا توجد دفعات منشأة بعد. يمكنك كتابة اسم دفعة جديدة عند توليد الكود وسيقوم النظام بإنشائها فوراً!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* SUB-MODAL 1: EDIT CODE (Exclusive to Developer) */}
        {editingCode && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[65] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-slate-700 space-y-4 animate-in zoom-in-95">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                    <Edit3 size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-gray-800 dark:text-white">
                      تعديل بيانات كود الممثل
                    </h3>
                    <p className="text-xs text-gray-400">
                      صلاحية المطور
                    </p>
                  </div>
                </div>
                <button onClick={() => setEditingCode(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {/* Rep Name */}
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                    إسم الممثل:
                  </label>
                  <input
                    type="text"
                    value={editRepName}
                    onChange={(e) => setEditRepName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  />
                </div>

                {/* Rep Username */}
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                    يوزر الممثل (@username):
                  </label>
                  <input
                    type="text"
                    value={editRepUsername}
                    onChange={(e) => setEditRepUsername(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none"
                    dir="ltr"
                  />
                </div>

                {/* Batch Name */}
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                    إسم الدفعة:
                  </label>
                  <input
                    type="text"
                    value={editBatchName}
                    onChange={(e) => setEditBatchName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  />
                </div>

                {/* Code String */}
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                    كود التفعيل:
                  </label>
                  <input
                    type="text"
                    value={editCodeString}
                    onChange={(e) => setEditCodeString(e.target.value.toUpperCase())}
                    className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none"
                    dir="ltr"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                    مدة الصلاحية:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditDuration('month')}
                      className={`p-2 rounded-xl border text-center font-bold text-[11px] ${
                        editDuration === 'month' ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-600' : 'border-gray-200 dark:border-slate-600'
                      }`}
                    >
                      شهر
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditDuration('year')}
                      className={`p-2 rounded-xl border text-center font-bold text-[11px] ${
                        editDuration === 'year' ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-600' : 'border-gray-200 dark:border-slate-600'
                      }`}
                    >
                      سنة
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditDuration('lifetime')}
                      className={`p-2 rounded-xl border text-center font-bold text-[11px] ${
                        editDuration === 'lifetime' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' : 'border-gray-200 dark:border-slate-600'
                      }`}
                    >
                      مدى الحياة
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                    ملاحظات:
                  </label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs outline-none h-14 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setEditingCode(null)}
                  className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-xs"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveEditCode}
                  disabled={isSavingEdit}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20"
                >
                  {isSavingEdit ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>حفظ التعديلات</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUB-MODAL 2: EDIT BATCH (Exclusive to Developer) */}
        {editingBatch && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[65] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-slate-700 space-y-4 animate-in zoom-in-95">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center">
                    <Edit3 size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-gray-800 dark:text-white">
                      تعديل بيانات الدفعة
                    </h3>
                    <p className="text-xs text-gray-400">
                      صلاحية المطور
                    </p>
                  </div>
                </div>
                <button onClick={() => setEditingBatch(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                    اسم الدفعة:
                  </label>
                  <input
                    type="text"
                    value={editBatchNameField}
                    onChange={(e) => setEditBatchNameField(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                    كود انضمام الدفعة للطلاب (Batch Code):
                  </label>
                  <input
                    type="text"
                    value={editBatchCodeField}
                    onChange={(e) => setEditBatchCodeField(e.target.value.toUpperCase())}
                    className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none uppercase"
                    dir="ltr"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    * هذا هو الكود الذي يكتبه الطلاب في صفحة الانضمام للدفعة.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setEditingBatch(null)}
                  className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-xs"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveBatchEdit}
                  disabled={isSavingBatchEdit}
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-orange-600/20"
                >
                  {isSavingBatchEdit ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>حفظ بيانات الدفعة</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUB-MODAL 3: TRANSFER REPRESENTATION */}
        {transferBatch && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-slate-700 space-y-4 animate-in zoom-in-95">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center">
                    <ArrowRightLeft size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-gray-800 dark:text-white">
                      نقل وتعيين الممثلية
                    </h3>
                    <p className="text-xs text-gray-400">
                      دفعة: {transferBatch.name} ({transferBatch.code})
                    </p>
                  </div>
                </div>
                <button onClick={() => setTransferBatch(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-200">
                سيتم سحب الممثلية من الممثل القديم وتنزيل رتبته إلى طالب عادي، وترقية الطالب المختار ليصبح ممثلاً مع إشعار لكافة طلاب الدفعة.
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                  اختر الطالب البديل ليصبح ممثلاً:
                </label>
                <select
                  value={targetStudentUid}
                  onChange={(e) => setTargetStudentUid(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-xs font-bold outline-none"
                >
                  <option value="">-- اختر طالباً --</option>
                  {users
                    .filter((u) => u.role !== UserRole.OWNER && u.uid !== transferBatch.representativeUid)
                    .sort((a, b) => compareArabicNames(a.name, b.name))
                    .map((u) => (
                      <option key={u.uid} value={u.uid}>
                        {u.name} (@{u.username || 'طالب'}) - {u.batchCode === transferBatch.code ? 'نفس الدفعة' : `دفعة ${u.batchCode || 'عام'}`}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setTransferBatch(null)}
                  className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-xs"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleExecuteTransfer}
                  disabled={isTransferring || !targetStudentUid}
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-orange-600/20"
                >
                  {isTransferring ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                  <span>تأكيد نقل الممثلية</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center shrink-0">
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <Crown size={15} className="text-amber-500" />
            <span>نظام تعيين وإدارة ممثلي الدفعات</span>
          </div>
          <button
            onClick={onClose}
            className="py-2 px-6 bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 text-gray-700 dark:text-gray-200 rounded-xl font-bold text-xs transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
